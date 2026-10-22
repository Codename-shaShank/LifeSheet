import { ArrowDown, Award } from 'lucide-react';
import ProgressBar from '../common/ProgressBar.jsx';
import { percent } from '../../lib/sheetTree.js';

// FUTURE: milestone badges (25 / 50 / 80 / 100 %). The medal marks the 80 % milestone for now.
const MILESTONE = 80;

export default function SheetHeader({ sheet, overall, upNext, onUpNext }) {
  return (
    <header className="sheet-header">
      <div className="sheet-intro">
        <h1>{sheet.title}</h1>
        <p className="sheet-description">{sheet.description}</p>
        <button type="button" className="upnext" onClick={onUpNext} disabled={!upNext}>
          {upNext ? (
            <>
              <span>Up next :</span>
              <span className="upnext-title">{upNext.problem.title}</span>
            </>
          ) : (
            <span>Every problem is done</span>
          )}
          <ArrowDown size={14} />
        </button>
      </div>

      <div className="overall">
        <span className="overall-label">Overall Progress</span>
        <div className="progress-card">
          <div className="progress-line">
            <strong className="progress-pct">{percent(overall)} %</strong>
            <span className="progress-meta">
              {overall.done} / {overall.total} problems solved
            </span>
          </div>
          <div className="progress-track-wrap">
            <ProgressBar value={overall.done} max={overall.total} size="lg" label="Overall progress" />
            <Award
              size={20}
              className={`milestone${percent(overall) >= MILESTONE ? ' is-reached' : ''}`}
              style={{ left: `${MILESTONE}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
