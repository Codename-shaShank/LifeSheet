import { memo, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Bookmark, Check, Code, EllipsisVertical, FileText, SquarePen } from 'lucide-react';
import { platformOf } from '../../lib/platforms.js';

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Row actions, left to right (as in the reference design):
 *   1. Solution  → problem page (statement + solution + AI chat space)
 *   2. Platform  → the link from your sheet, opens in a new tab
 *   3. Notes     → notes modal (Difficulty is entered here)
 *   4. Save      → bookmark into "saved"
 *   5. More      → clickable, no action yet
 * Memoised: with hundreds of rows, a toggle re-renders only the row whose `entry` changed.
 */
function ProblemRow({ problem, entry, sheetId, focused, onToggleDone, onToggleSaved, onOpenNotes }) {
  const ref = useRef(null);
  const link = problem.links[0];
  const platform = link ? platformOf(link.platform) : null;

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [focused]);

  return (
    <li ref={ref} className={`problem-row${focused ? ' is-focused' : ''}`}>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={entry.done}
          onChange={() => onToggleDone(problem.id)}
          aria-label={`Mark ${problem.title} as done`}
        />
        <span className="checkbox-box" aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </span>
      </label>

      <span className="problem-title">{problem.title}</span>

      {entry.difficulty && (
        <span className={`difficulty-pill d-${entry.difficulty.toLowerCase()}`}>{entry.difficulty}</span>
      )}

      <div className="row-actions">
        <Link to={`/prep/${sheetId}/problem/${problem.id}`} className="icon-btn" aria-label="Solution" title="Solution">
          <FileText size={16} strokeWidth={1.8} />
        </Link>

        {link ? (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            style={{ color: platform.color }}
            aria-label={`Open on ${platform.label}`}
            title={platform.label}
          >
            <Code size={16} strokeWidth={2} />
          </a>
        ) : (
          <span className="icon-btn is-disabled" title="No link in your sheet for this problem" aria-hidden="true">
            <Code size={16} strokeWidth={2} />
          </span>
        )}

        <button
          type="button"
          className={`icon-btn${entry.hasNotes ? ' has-notes' : ''}`}
          onClick={() => onOpenNotes(problem)}
          aria-label={entry.hasNotes ? 'Edit notes' : 'Add notes'}
          title="Notes"
        >
          <SquarePen size={16} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          className={`icon-btn${entry.saved ? ' is-saved' : ''}`}
          onClick={() => onToggleSaved(problem.id)}
          aria-pressed={entry.saved}
          aria-label={entry.saved ? 'Remove from saved' : 'Save'}
          title="Save"
        >
          <Bookmark size={16} strokeWidth={1.8} fill={entry.saved ? 'currentColor' : 'none'} />
        </button>

        {/* FUTURE: menu with "Add to Daily Planner", "Copy link", "Reset notes". */}
        <button type="button" className="icon-btn" aria-label="More options" title="More">
          <EllipsisVertical size={16} />
        </button>
      </div>
    </li>
  );
}

export default memo(ProblemRow);
