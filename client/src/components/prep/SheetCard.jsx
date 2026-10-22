import { Link } from 'react-router';
import { ArrowRight, Clock, FileText, Layers, ListOrdered, Trophy } from 'lucide-react';
import { loadSheet } from '../../lib/content.js';
import { useContent } from '../../hooks/useContent.js';

// card.icon (from collections/<id>.json) → icon component. Add more keys as you add sheets.
const SHEET_ICONS = { sequence: ListOrdered };

export default function SheetCard({ card }) {
  const { data: sheet, status } = useContent(loadSheet, card.id);
  const Icon = SHEET_ICONS[card.icon] ?? ListOrdered;

  // Modules and topics are counted from the generated sheet, so the card can't drift from the content.
  // FUTURE: contests and hours computed from per-problem estimates instead of hand-entered values.
  const stats = [
    { icon: Layers, label: `${sheet?.moduleCount ?? '–'} Modules` },
    { icon: FileText, label: `${sheet?.problemCount ?? '–'} Topics` },
    { icon: Trophy, label: `${card.contests ?? 0} Contests` },
    { icon: Clock, label: `${card.hours ?? 0} Hrs` },
  ];

  return (
    <article className="sheet-card">
      <header className="sheet-card-head">
        <span className="sheet-card-icon">
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <h3>{sheet?.title ?? card.title}</h3>
      </header>

      <ul className="sheet-card-stats">
        {stats.map(({ icon: StatIcon, label }) => (
          <li key={label}>
            <StatIcon size={13} strokeWidth={1.8} />
            {label}
          </li>
        ))}
      </ul>

      <footer className="sheet-card-foot">
        {status === 'missing' ? (
          <span className="hint">Run npm run ingest to build this sheet</span>
        ) : (
          <Link to={`/prep/${card.id}`} className="btn">
            Explore <ArrowRight size={15} />
          </Link>
        )}
      </footer>
    </article>
  );
}
