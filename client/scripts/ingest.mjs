#!/usr/bin/env node
/**
 * LifeSheet content ingestion: LIFE_SHEET.xlsx → src/content/sheets/<sheet-id>.json
 *
 *   npm run ingest -- ./LIFE_SHEET.xlsx
 *
 * Mapping rules
 *   • Each workbook tab is one module (tabs in config.skipTabs are ignored).
 *   • A "QUESTION LINK, SQ1, SQ2, SQ3, …" row is a header: skipped, and used to locate columns.
 *   • A row whose only filled cell is column A starts a new group when it reads like
 *     "TOPIC : LEVEL" or sits directly above a header row. Problems before any group
 *     go into an implicit group, which the UI renders flat under the module.
 *   • Every other row with text in the question column is a problem. Its hyperlink becomes
 *     the platform link; SQ1–SQ3 become "similar" links (LeetCode numbers → search links).
 *     A p.ip.fi paste in an SQ cell is fetched and replaced by the problem links listed in it.
 *   • Titles are cleaned last: LeetCode problems get their official title, others lose
 *     "GFG :" / "152." style prefixes (see scripts/titles.mjs and titleOverrides in the config).
 *   • Personal columns (DIFFICULTY, TAKEAWAYS, APPROACH, TC, SC, …) are ignored on purpose:
 *     notes are user data and live in MongoDB, entered through the Notes modal.
 *
 * FUTURE: `--with-notes` flag that exports those personal columns as a seed file, plus a server
 *         script that imports it into your account's notes.
 * FUTURE: read per-module contest definitions (3 problems / 2 hours) from a dedicated tab.
 */
import ExcelJS from 'exceljs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './ingest.config.mjs';
import { dedupeLinks, detectPlatform, expandPastes, isHttp, labelForUrl, lcSlugOf } from './links.mjs';
import { cleanTitles } from './titles.mjs';

const CLIENT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ───────────────────────── text helpers ─────────────────────────

const squash = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const norm = (s) => squash(s).toUpperCase();

const slugify = (s) =>
  squash(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

/** ARRAYS → Arrays, on → On; short acronyms (DP, LL) and mixed words (2D, ONEs) are kept. */
function smartTitle(s) {
  return squash(s)
    .split(' ')
    .map((w) => {
      if (!w) return w;
      if (/^[A-Z]{1,2}$/.test(w)) return w;
      if (/^[A-Z'’]+$/.test(w)) return w[0] + w.slice(1).toLowerCase();
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function uniqueId(base, used) {
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  used.add(id);
  return id;
}

// ───────────────────────── similar links ─────────────────────────

const LC_SEARCH = (n) => `https://leetcode.com/problemset/?search=${n}`;

/** One SQ cell → zero or more { label, url } entries. */
function parseSimilar({ text, url }) {
  if (url && isHttp(url)) return [{ label: text && text !== url ? text : labelForUrl(url), url }];
  if (!text) return [];
  if (/^(?:\s|prem(?:ium)?\d*)+$/i.test(text)) return []; // "premium", "Prem1 Prem2"
  if (/^(?:\s|lc|done|\d{1,4})+$/i.test(text)) {
    // "2404 2780", "LC 198", "135 done" → LeetCode problem numbers
    return (text.match(/\d{1,4}/g) ?? []).map((n) => ({ label: `LC ${n}`, url: LC_SEARCH(n) }));
  }
  return [{ label: text, url: null }]; // free text like "Wiggle Sort" — kept as a label
}

// ───────────────────────── cells & rows ─────────────────────────

const richTextToString = (rt) => rt.map((r) => r.text).join('');

/** Normalises every exceljs cell shape into { text, url }. */
function readCell(cell) {
  const v = cell.value;
  let text = '';
  let url = null;

  if (v != null && typeof v === 'object' && !(v instanceof Date)) {
    if (Array.isArray(v.richText)) text = richTextToString(v.richText);
    else if ('text' in v) text = v.text?.richText ? richTextToString(v.text.richText) : String(v.text ?? '');
    else if ('formula' in v || 'sharedFormula' in v) {
      text = v.result != null ? String(v.result) : '';
      url = /HYPERLINK\(\s*"([^"]+)"/i.exec(v.formula ?? '')?.[1] ?? null;
    }
    if (v.hyperlink) url = v.hyperlink;
  } else if (v != null) {
    text = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
  }

  text = squash(text);
  if (!url) url = text.match(/https?:\/\/\S+/)?.[0] ?? null;
  return { text, url: isHttp(url) ? url.trim() : null };
}

function readRows(ws) {
  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells = {};
    let filled = 0;
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      // Merged ranges repeat the master value in every slave cell — count it once.
      if (cell.isMerged && cell.master && cell.master.address !== cell.address) return;
      const c = readCell(cell);
      if (!c.text && !c.url) return;
      cells[col] = c;
      filled++;
    });
    if (filled) rows.push({ rowNumber, cells, filled });
  });
  return rows;
}

const isHeaderRow = (row) => Object.values(row.cells).some((c) => norm(c.text) === 'QUESTION LINK');

function columnsFromHeader(row) {
  const entries = Object.entries(row.cells).map(([col, c]) => [Number(col), norm(c.text)]);
  const question = entries.find(([, t]) => t === 'QUESTION LINK')?.[0] ?? 1;
  const similar = entries.filter(([, t]) => /^SQ\d+$/.test(t)).map(([col]) => col);
  return { question, similar: similar.length ? similar : [question + 1, question + 2, question + 3] };
}

// ───────────────────────── groups & problems ─────────────────────────

const GROUP_TITLE = /^([A-Z][A-Z ]{4,}?)\s*:\s*(.+)$/; // "ARRAYS : MEDIUM", "BINARY SEARCH : on ANSWERS"

function isGroupRow(tab, row, q, next) {
  const key = `${tab}::${q.text}`;
  if (config.forceProblems.includes(key)) return false;
  if (config.forceGroupTitles.includes(key)) return true;
  if (q.url || row.filled !== 1) return false;
  if (next && isHeaderRow(next)) return true;
  return GROUP_TITLE.test(q.text);
}

function groupTitle(tab, raw, occurrence) {
  const base = `${tab}::${raw}`;
  const override = config.groupTitleOverrides[`${base}#${occurrence}`] ?? config.groupTitleOverrides[base];
  if (override) return override;
  const m = raw.match(GROUP_TITLE);
  return m && norm(m[1]) === norm(tab) ? smartTitle(m[2]) : smartTitle(raw);
}

function buildProblem({ tab, moduleId, row, q, cols, usedIds, warnings }) {
  const url = q.url;
  const title = q.text; // tidied later by cleanTitles
  const id = uniqueId(lcSlugOf(url) ?? `${moduleId}-${slugify(title)}`, usedIds);
  const similar = dedupeLinks(cols.similar.flatMap((col) => (row.cells[col] ? parseSimilar(row.cells[col]) : [])));
  if (!url) warnings.push(`${tab} row ${row.rowNumber}: "${title}" has no link`);
  return { id, title, links: url ? [{ platform: detectPlatform(url), url }] : [], similar };
}

function buildModule(ws, tab, usedIds, warnings) {
  const moduleId = slugify(tab);
  const module = { id: moduleId, title: config.moduleTitles[tab] ?? smartTitle(tab), groups: [] };
  const groupIds = new Set();
  const occurrences = new Map();
  let cols = { question: 1, similar: [2, 3, 4] };
  let group = null;

  const openGroup = (title, implicit = false) => {
    group = { id: uniqueId(slugify(title), groupIds), title, ...(implicit && { implicit: true }), problems: [] };
    module.groups.push(group);
  };

  const rows = readRows(ws);
  rows.forEach((row, i) => {
    if (isHeaderRow(row)) {
      cols = columnsFromHeader(row);
      return;
    }
    const q = row.cells[cols.question];
    if (!q?.text) return;

    if (isGroupRow(tab, row, q, rows[i + 1])) {
      const n = (occurrences.get(q.text) ?? 0) + 1;
      occurrences.set(q.text, n);
      openGroup(groupTitle(tab, q.text, n));
      return;
    }
    if (!group) openGroup(module.title, true);
    group.problems.push(buildProblem({ tab, moduleId, row, q, cols, usedIds, warnings }));
  });

  module.groups = module.groups.filter((g) => g.problems.length);
  return module;
}

function orderTabs(worksheets) {
  if (!config.moduleOrder) return worksheets;
  const rank = new Map(config.moduleOrder.map((name, i) => [norm(name), i]));
  return [...worksheets].sort((a, b) => (rank.get(norm(a.name)) ?? 1e9) - (rank.get(norm(b.name)) ?? 1e9));
}

// ───────────────────────── main ─────────────────────────

async function main() {
  const input = path.resolve(process.cwd(), process.argv[2] ?? config.defaultInput);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(input);

  const skip = new Set(config.skipTabs.map(norm));
  const usedIds = new Set();
  const warnings = [];
  const modules = [];

  for (const ws of orderTabs(workbook.worksheets)) {
    const tab = squash(ws.name);
    if (skip.has(norm(tab))) continue;
    if (ws.state && ws.state !== 'visible') {
      warnings.push(`Tab "${tab}" is hidden — skipped`);
      continue;
    }
    const module = buildModule(ws, tab, usedIds, warnings);
    if (module.groups.length) modules.push(module);
    else warnings.push(`Tab "${tab}" has no problems — skipped`);
  }

  await expandPastes(modules, warnings);
  await cleanTitles(modules, warnings);

  const sheet = {
    ...config.sheet,
    source: path.basename(input),
    generatedAt: new Date().toISOString(),
    modules,
  };

  const out = path.resolve(CLIENT_ROOT, config.output.replace('{id}', config.sheet.id));
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(sheet, null, 2)}\n`);

  const summary = modules.map((m) => {
    const problems = m.groups.flatMap((g) => g.problems);
    return {
      module: m.title,
      groups: m.groups.map((g) => (g.implicit ? '(flat)' : g.title)).join(', '),
      problems: problems.length,
      linked: problems.filter((p) => p.links.length).length,
    };
  });
  console.table(summary);

  const total = summary.reduce((n, s) => n + s.problems, 0);
  const linked = summary.reduce((n, s) => n + s.linked, 0);
  console.log(`\n${total} problems (${linked} with links) → ${path.relative(process.cwd(), out)}`);

  if (total && !linked) {
    console.warn(
      '\nNo hyperlinks were found. Google Sheets only exports whole-cell links — select the cell, Insert → Link, then download the .xlsx again.',
    );
  }
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  • ${w}`);
  }
}

main().catch((err) => {
  console.error(`Ingest failed: ${err.message}`);
  process.exit(1);
});
