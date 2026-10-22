import { ChevronDown, ChevronRight } from 'lucide-react';
import ProgressBar from '../common/ProgressBar.jsx';
import ProblemRow from './ProblemRow.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import { groupKey, isFlatModule } from '../../lib/sheetTree.js';

function TreeRow({ level, title, open, onClick, stat, controlsId }) {
  return (
    <button
      type="button"
      className={`tree-row tree-row-${level}`}
      aria-expanded={open}
      aria-controls={open ? controlsId : undefined}
      onClick={onClick}
    >
      <span className="tree-chevron" aria-hidden="true">
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </span>
      <span className="tree-title">{title}</span>
      {stat && (
        <>
          <ProgressBar value={stat.done} max={stat.total} size="mini" label={`${title} progress`} />
          <span className="tree-count">
            {stat.done}/{stat.total}
          </span>
        </>
      )}
    </button>
  );
}

function ProblemList({ problems, sheetId, focusId, onOpenNotes }) {
  const progress = useProgress();
  return (
    <ul className="problem-list">
      {problems.map((p) => (
        <ProblemRow
          key={p.id}
          problem={p}
          entry={progress.get(p.id)}
          sheetId={sheetId}
          focused={p.id === focusId}
          onToggleDone={progress.toggleDone}
          onToggleSaved={progress.toggleSaved}
          onOpenNotes={onOpenNotes}
        />
      ))}
    </ul>
  );
}

/**
 * Renders any prepared sheet. `stats` is optional — My Spaces passes none to hide progress.
 * Open/closed state is owned by the caller (persisted per page).
 */
export default function ModuleTree({ sheet, sheetId, stats, openSet, onToggle, focusId, onOpenNotes }) {
  const listProps = { sheetId, focusId, onOpenNotes };

  return (
    <div className="tree">
      {sheet.modules.map((m) => {
        const open = openSet.has(m.id);
        const childrenId = `tree-${sheetId}-${m.id}`;
        return (
          <section key={m.id} className={`tree-module${open ? ' is-open' : ''}`}>
            <TreeRow
              level="module"
              title={m.title}
              open={open}
              onClick={() => onToggle(m.id)}
              stat={stats?.get(m.id)}
              controlsId={childrenId}
            />

            {open && (
              <div className="tree-children" id={childrenId}>
                {isFlatModule(m) ? (
                  <ProblemList problems={m.groups[0].problems} {...listProps} />
                ) : (
                  m.groups.map((g) => {
                    const key = groupKey(m.id, g.id);
                    const groupOpen = openSet.has(key);
                    return (
                      <div key={g.id} className="tree-group">
                        <TreeRow
                          level="group"
                          title={g.title}
                          open={groupOpen}
                          onClick={() => onToggle(key)}
                          stat={stats?.get(key)}
                          controlsId={`${childrenId}-${g.id}`}
                        />
                        {groupOpen && (
                          <div id={`${childrenId}-${g.id}`}>
                            <ProblemList problems={g.problems} {...listProps} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {/* FUTURE: module contest row — "Contest · 3 Problems · 2 hours · Start contest",
                    rendered when the sheet JSON gives the module a `contest` object. */}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
