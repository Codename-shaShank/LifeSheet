#!/usr/bin/env node
/**
 * Re-runs the post-processing steps of `npm run ingest` on an already generated sheet JSON,
 * without needing the xlsx: expands p.ip.fi pastes, then cleans titles. Safe to run repeatedly.
 *
 *   npm run refresh                       (the sheet from ingest.config.mjs)
 *   npm run refresh -- src/content/sheets/other.json
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './ingest.config.mjs';
import { expandPastes } from './links.mjs';
import { cleanTitles } from './titles.mjs';

const CLIENT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const file = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.resolve(CLIENT_ROOT, config.output.replace('{id}', config.sheet.id));
  const sheet = JSON.parse(await readFile(file, 'utf8'));
  const warnings = [];

  const { pastes, added } = await expandPastes(sheet.modules, warnings);
  const { renamed } = await cleanTitles(sheet.modules, warnings);
  await writeFile(file, `${JSON.stringify(sheet, null, 2)}\n`);

  console.log(`${pastes} paste(s) → ${added} similar link(s), ${renamed} title(s) cleaned in ${path.relative(process.cwd(), file)}`);
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  • ${w}`);
  }
}

main().catch((err) => {
  console.error(`Refresh failed: ${err.message}`);
  process.exit(1);
});
