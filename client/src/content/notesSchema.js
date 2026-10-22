// The notes form is rendered entirely from this array. Add, remove or reorder fields here —
// the modal follows, and the server stores any key matching /^[a-zA-Z][a-zA-Z0-9_]*$/,
// so no backend change is needed. Removing a field hides it but keeps old values in MongoDB.
//
// span: 1 = half width, 2 = full width. Two consecutive span-1 fields sit side by side.

export const NOTES_SCHEMA = [
  { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard'], span: 1 },
  { key: 'pattern', label: 'Pattern', type: 'text', span: 1, placeholder: 'The method in short, e.g. hashmap for O(1) lookup' },
  { key: 'takeaways', label: 'Takeaways', type: 'textarea', rows: 3, span: 2 },
  { key: 'approach', label: 'Approach', type: 'textarea', rows: 5, span: 2 },
  { key: 'timeComplexity', label: 'Time complexity', type: 'text', span: 1, placeholder: 'O(N)' },
  { key: 'spaceComplexity', label: 'Space complexity', type: 'text', span: 1, placeholder: 'O(1)' },
  { key: 'pitfall', label: 'Pitfall', type: 'textarea', rows: 3, span: 2 },
  { key: 'revision', label: 'Revision', type: 'textarea', rows: 2, span: 2 },
  // FUTURE: { key: 'similarSolved', label: 'Similar problems solved', type: 'textarea', span: 2 },
  // FUTURE: a 'revisionDate' date field feeding a spaced-repetition queue in My Spaces.
];

export const DIFFICULTY_OPTIONS = NOTES_SCHEMA.find((f) => f.key === 'difficulty')?.options ?? [];
