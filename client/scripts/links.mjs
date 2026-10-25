// Link helpers shared by scripts/ingest.mjs and scripts/expand-pastes.mjs.

export const isHttp = (u) => /^https?:\/\//i.test(u ?? '');

export const titleFromSlug = (slug) =>
  slug
    .split('-')
    .map((w) => (/^(?:i{2,3}|iv|vi{0,3})$/.test(w) ? w.toUpperCase() : w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

export const lcSlugOf = (url) => url?.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i)?.[1]?.toLowerCase() ?? null;

const PLATFORM_HOSTS = [
  ['leetcode.com', 'leetcode'],
  ['geeksforgeeks.org', 'gfg'],
  ['naukri.com/code360', 'codingninjas'],
  ['codingninjas.com', 'codingninjas'],
  ['spoj.com', 'spoj'],
  ['codeforces.com', 'codeforces'],
  ['cses.fi', 'cses'],
  ['hackerrank.com', 'hackerrank'],
  ['interviewbit.com', 'interviewbit'],
  ['takeuforward.org', 'takeuforward'],
];

export const detectPlatform = (url) => {
  const u = url.toLowerCase();
  return PLATFORM_HOSTS.find(([host]) => u.includes(host))?.[1] ?? 'other';
};

const PASTE_HOST = 'p.ip.fi';

export function labelForUrl(url) {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname === PASTE_HOST) return 'Similar list';
    const slug = lcSlugOf(url);
    if (hostname.endsWith('leetcode.com') && slug) return titleFromSlug(slug);
    return hostname.replace(/^www\./, '') + (pathname.length > 1 ? pathname : '');
  } catch {
    return 'Link';
  }
}

export function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((l) => {
    const key = `${l.label}|${l.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ───────────────────────── paste expansion ─────────────────────────

const isPaste = (url) => {
  try {
    return new URL(url).hostname === PASTE_HOST;
  } catch {
    return false;
  }
};

/** Problem-platform URLs listed in a p.ip.fi paste, or null when it can't be used. */
async function fetchPaste(url, warnings) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const urls = (await res.text()).match(/https?:\/\/\S+/g) ?? [];
    const problems = urls.filter((u) => detectPlatform(u) !== 'other');
    if (!problems.length) warnings.push(`${url}: no problem links inside — kept as a single link`);
    return problems;
  } catch (err) {
    warnings.push(`${url}: ${err.message} — kept as a single link`);
    return null;
  }
}

/**
 * Replaces every p.ip.fi paste in a problem's `similar` list with the problem links written in
 * that paste, one chip each. Links back to the problem itself ("Main question : …") are dropped.
 * Pastes that fail to load or hold no problem links stay as they were.
 */
export async function expandPastes(modules, warnings) {
  const problems = modules.flatMap((m) => m.groups.flatMap((g) => g.problems));
  const pasteUrls = [...new Set(problems.flatMap((p) => p.similar.map((s) => s.url).filter(isPaste)))];
  const pastes = new Map(await Promise.all(pasteUrls.map(async (url) => [url, await fetchPaste(url, warnings)])));

  let added = 0;
  for (const p of problems) {
    const own = new Set(p.links.map((l) => lcSlugOf(l.url) ?? l.url));
    p.similar = dedupeLinks(
      p.similar.flatMap((s) => {
        const urls = isPaste(s.url) ? pastes.get(s.url) : null;
        if (!urls?.length) return [s];
        const links = urls.filter((u) => !own.has(lcSlugOf(u) ?? u)).map((u) => ({ label: labelForUrl(u), url: u }));
        added += links.length;
        return links;
      }),
    );
  }
  return { pastes: pasteUrls.length, added };
}
