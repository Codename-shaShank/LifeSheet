// Platform key (written by the ingest script) → how its link icon looks.
// Add a platform here and in PLATFORM_HOSTS in scripts/ingest.mjs.

export const PLATFORMS = {
  leetcode: { label: 'LeetCode', color: '#f5a524' },
  gfg: { label: 'GeeksforGeeks', color: '#3fa55b' },
  codingninjas: { label: 'Code360', color: '#f0803c' },
  spoj: { label: 'SPOJ', color: '#5b9bd5' },
  codeforces: { label: 'Codeforces', color: '#5b8def' },
  cses: { label: 'CSES', color: '#9aa0ff' },
  hackerrank: { label: 'HackerRank', color: '#2ec866' },
  interviewbit: { label: 'InterviewBit', color: '#4aa3df' },
  takeuforward: { label: 'takeUforward', color: 'var(--platform-neutral)' },
  other: { label: 'Problem link', color: 'var(--platform-other)' },
};

export const platformOf = (key) => PLATFORMS[key] ?? PLATFORMS.other;
