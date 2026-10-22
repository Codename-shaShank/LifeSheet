// Tuning knobs for scripts/ingest.mjs. Re-run `npm run ingest` after editing.
// Keys of the form "TAB::Cell text" refer to the raw text in column A of that tab.

export default {
  defaultInput: './LIFE_SHEET.xlsx',
  output: 'src/content/sheets/{id}.json',

  sheet: {
    id: 'sequence-dsa-sheet',
    title: 'Sequence DSA Sheet',
    description:
      'Learn data structures and algorithms in a clear sequence, from programming foundations to advanced problems. Build your coding interview skills through independent practice, better approaches, and regular revision.',
  },

  // Tabs that are not problem lists. This one holds long-form notes in a different column layout.
  skipTabs: ['ALL PROBLEMS SHEET(LONG TERM)'],

  // Optional explicit module order by tab name. null = workbook order.
  moduleOrder: null,

  // Display names for modules (tab name → title). Unlisted tabs are title-cased automatically.
  moduleTitles: {
    DP: 'Dynamic Programming',
  },

  // Display names for groups. Append "#2" to target the second occurrence of the same text in a tab.
  groupTitleOverrides: {
    'SLIDING WINDOW::ARRAYS : MEDIUM': 'Medium',
    'LINKED LIST::LINKED LIST : LEARNING#2': 'Doubly Linked List : Learning',
  },

  // Escape hatches when the automatic group-row detection guesses wrong.
  forceGroupTitles: [], // e.g. 'RECURSION::RECURSION'
  forceProblems: [], // e.g. 'ARRAYS::KADANE\'S ALGORITHM'
};
