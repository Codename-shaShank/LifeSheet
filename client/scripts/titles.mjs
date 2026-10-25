// Problem title cleanup shared by scripts/ingest.mjs and scripts/refresh.mjs.
// Titles only — problem ids are never touched, since user progress is keyed by id.
import config from './ingest.config.mjs';
import { lcSlugOf, titleFromSlug } from './links.mjs';

const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with']);

/** "kth element of 2 sorted arrays" → "Kth Element of 2 Sorted Arrays". Words with capitals (LL, XOR, 1's) are kept. */
function titleCase(s) {
  return s
    .split(' ')
    .map((w, i) => {
      if (/^[A-Z]{4,}$/.test(w)) w = w.toLowerCase(); // shouted words: INTRO, TREES
      if (w !== w.toLowerCase()) return w;
      if (i > 0 && SMALL_WORDS.has(w)) return w;
      return w ? w[0].toUpperCase() + w.slice(1) : w;
    })
    .join(' ');
}

/** "GFG : Largest Subaray with 0 sum" → "Largest Subarray with 0 Sum". */
function tidy(title) {
  let t = title
    .replace(/^(?:gfg|spoj|lc|leetcode|code360)\s*[.:]\s*(?:\d+\s*[.:]\s*)?/i, '') // platform prefix
    .replace(/^\d+\s*\.\s*/, '') // "152. "
    .replace(/\s+(?:lc|leetcode)\s*\d+$/i, '') // trailing "LC 70"
    .trim();
  for (const [wrong, right] of Object.entries(config.titleFixes)) t = t.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), right);
  return titleCase(t);
}

/** Official LeetCode titles by slug. Slugs that can't be fetched are left out. */
async function fetchLeetCodeTitles(slugs, warnings) {
  const titles = new Map();
  const queue = [...slugs];
  const worker = async () => {
    for (let slug; (slug = queue.shift()); ) {
      try {
        const res = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
          body: JSON.stringify({
            query: 'query q($slug: String!) { question(titleSlug: $slug) { title } }',
            variables: { slug },
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const title = (await res.json()).data?.question?.title;
        if (title) titles.set(slug, title);
        else warnings.push(`LeetCode has no problem "${slug}"`);
      } catch (err) {
        warnings.push(`LeetCode title for "${slug}": ${err.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return titles;
}

/**
 * Rewrites problem titles and similar-link labels in place:
 *   • config.titleOverrides (by problem id) win;
 *   • LeetCode problems get their official title ("15. threesome" → "3Sum");
 *   • everything else loses platform/number prefixes and is title-cased.
 * Similar labels that were derived from a LeetCode slug also get the official title;
 * labels typed in the sheet are kept.
 */
export async function cleanTitles(modules, warnings) {
  const problems = modules.flatMap((m) => m.groups.flatMap((g) => g.problems));
  const slugOfProblem = (p) => lcSlugOf(p.links[0]?.url);
  const isDerived = (s) => {
    const slug = lcSlugOf(s.url);
    return slug && s.label.toLowerCase() === titleFromSlug(slug).toLowerCase();
  };

  const slugs = new Set();
  for (const p of problems) {
    if (slugOfProblem(p)) slugs.add(slugOfProblem(p));
    for (const s of p.similar) if (isDerived(s)) slugs.add(lcSlugOf(s.url));
  }
  const official = await fetchLeetCodeTitles(slugs, warnings);

  let renamed = 0;
  for (const p of problems) {
    const before = p.title;
    p.title = config.titleOverrides[p.id] ?? official.get(slugOfProblem(p)) ?? tidy(p.title);
    if (p.title !== before) renamed++;
    for (const s of p.similar) if (isDerived(s)) s.label = official.get(lcSlugOf(s.url)) ?? s.label;
  }
  return { renamed };
}
