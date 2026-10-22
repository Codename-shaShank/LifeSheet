import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CircleCheck } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ModuleTree from '../components/sheet/ModuleTree.jsx';
import NotesModal from '../components/sheet/NotesModal.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import { usePersistentSet } from '../hooks/usePersistentState.js';
import { loadSheet, sheetIds } from '../lib/content.js';
import { filterSheet } from '../lib/sheetTree.js';

/**
 * My Spaces (first version): every problem you've marked done, in the same module/group
 * structure as the sheet, without progress bars.
 *
 * FUTURE: decide the final design — candidates:
 *  • Tabs: Completed / Saved / Has notes.
 *  • User-created spaces (named collections) that the Save button adds to.
 *  • Revision queue ordered by completedAt and the Revision note.
 */
function CompletedSheet({ sheet, onOpenNotes }) {
  const [openSet, toggleOpen] = usePersistentSet(`lifesheet:open:my-spaces:${sheet.id}`);
  return (
    <section className="space-section">
      <h2 className="space-title">
        {sheet.title} <span className="muted">· {sheet.problemCount} done</span>
      </h2>
      <ModuleTree sheet={sheet} sheetId={sheet.id} openSet={openSet} onToggle={toggleOpen} onOpenNotes={onOpenNotes} />
    </section>
  );
}

export default function MySpacesPage() {
  const progress = useProgress();
  const [sheets, setSheets] = useState(null);
  const [notesFor, setNotesFor] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all(sheetIds.map(loadSheet)).then((list) => alive && setSheets(list.filter(Boolean)));
    return () => {
      alive = false;
    };
  }, []);

  const completed = useMemo(
    () => sheets?.map((s) => filterSheet(s, progress.isDone)).filter((s) => s.problemCount > 0) ?? null,
    [sheets, progress.isDone],
  );

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'My Spaces' }, { label: 'Completed' }]} />
      <h1 className="page-title">Completed</h1>

      {completed && completed.length === 0 && (
        <EmptyState
          icon={CircleCheck}
          title="Nothing here yet"
          body="Problems you tick off in a sheet appear here, grouped the same way."
          action={<Link to="/prep" className="btn">Open Prep Hub</Link>}
        />
      )}
      {completed?.map((s) => (
        <CompletedSheet key={s.id} sheet={s} onOpenNotes={setNotesFor} />
      ))}

      {notesFor && <NotesModal problem={notesFor} onClose={() => setNotesFor(null)} />}
    </div>
  );
}
