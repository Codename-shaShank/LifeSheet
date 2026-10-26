import { Link } from 'react-router';
import { ArrowRight, Building2, Clock, FileText, Layers, ListOrdered, Trophy } from 'lucide-react';
import { loadSheet } from '../../lib/content.js';
import { useContent } from '../../hooks/useContent.js';

// card.icon (from collections/<id>.json) → icon component. Add more keys as you add sheets.
const SHEET_ICONS = { sequence: ListOrdered, company: Building2 };

export default function SheetCard({ card }) {
  const { data: sheet } = useContent(loadSheet, card.id);
  const Icon = SHEET_ICONS[card.icon] ?? ListOrdered;

  // Modules and topics are counted from the generated sheet, so the card can't drift from the content.
  // Contests and hours are hand-entered, so cards without them (company sheets) just hide them.
  // FUTURE: contests and hours computed from per-problem estimates instead of hand-entered values.
  const stats = [
    { icon: Layers, label: `${sheet?.moduleCount ?? '–'} Modules` },
    { icon: FileText, label: `${sheet?.problemCount ?? '–'} Topics` },
    card.contests != null && { icon: Trophy, label: `${card.contests} Contests` },
    card.hours != null && { icon: Clock, label: `${card.hours} Hrs` },
  ].filter(Boolean);

  return (
    <article className="sheet-card">
      <header className="sheet-card-head">
        <span className="sheet-card-icon">
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <h3>{card.title ?? sheet?.title}</h3>
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
        <Link to={`/prep/${card.id}`} className="btn">
          Explore <ArrowRight size={15} />
        </Link>
      </footer>
    </article>
  );
}
