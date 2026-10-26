import { EllipsisVertical, Filter, Gauge, Search, Shuffle } from 'lucide-react';

// Clickable, but no behaviour yet.
const TOOLS = [
  { label: 'Search problems', icon: Search }, // FUTURE: filter the tree by title as you type
  { label: 'Filter', icon: Filter }, // FUTURE: by your difficulty, done/undone, saved, has notes
  { label: 'Revision mode', icon: Gauge }, // FUTURE: show only problems whose Revision note says to revisit
  { label: 'Pick a random problem', icon: Shuffle }, // FUTURE: jump to a random unsolved problem
  { label: 'More options', icon: EllipsisVertical }, // FUTURE: expand/collapse all, reset progress
];

export default function SheetToolbar() {
  return (
    <div className="sheet-toolbar" role="toolbar" aria-label="Sheet tools"></div>
  );
}
