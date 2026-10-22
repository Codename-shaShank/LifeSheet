import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SheetHeader from '../components/sheet/SheetHeader.jsx';
import SheetToolbar from '../components/sheet/SheetToolbar.jsx';
import ModuleTree from '../components/sheet/ModuleTree.jsx';
import NotesModal from '../components/sheet/NotesModal.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import { useContent } from '../hooks/useContent.js';
import { usePersistentSet } from '../hooks/usePersistentState.js';
import { loadSheet } from '../lib/content.js';
import { SHEET_KEY, computeStats, findUpNext, groupKey } from '../lib/sheetTree.js';

const FOCUS_MS = 2200;

export default function SheetPage() {
  const { sheetId } = useParams();
  // Keyed so open/closed state and focus reset cleanly when switching sheets.
  return <SheetView key={sheetId} sheetId={sheetId} />;
}

function SheetView({ sheetId }) {
  const { data: sheet, status } = useContent(loadSheet, sheetId);
  const progress = useProgress();
  const [openSet, toggleOpen, openMany] = usePersistentSet(`lifesheet:open:${sheetId}`);
  const [focusId, setFocusId] = useState(null);
  const [notesFor, setNotesFor] = useState(null);

  const stats = useMemo(() => sheet && computeStats(sheet, progress.isDone), [sheet, progress.isDone]);
  const upNext = useMemo(() => sheet && findUpNext(sheet, progress.isDone), [sheet, progress.isDone]);

  useEffect(() => {
    if (!focusId) return undefined;
    const t = setTimeout(() => setFocusId(null), FOCUS_MS);
    return () => clearTimeout(t);
  }, [focusId]);

  const jumpToUpNext = useCallback(() => {
    if (!upNext) return;
    openMany([upNext.moduleId, groupKey(upNext.moduleId, upNext.groupId)]);
    setFocusId(upNext.problem.id);
  }, [upNext, openMany]);

  if (status === 'loading') return <div className="page" aria-busy="true" />;

  if (!sheet) {
    return (
      <div className="page">
        <EmptyState
          icon={FileText}
          title="This sheet hasn’t been generated yet"
          body="Run npm run ingest in the client folder to build it from your spreadsheet."
          action={<Link to="/prep" className="btn">Back to Prep Hub</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Prep Hub', to: '/prep' }, { label: sheet.title }]} />
      <SheetHeader sheet={sheet} overall={stats.get(SHEET_KEY)} upNext={upNext} onUpNext={jumpToUpNext} />
      {progress.status === 'error' && (
        <p className="form-error" role="alert">
          Couldn’t load your progress ({progress.error}). Checkboxes show as empty until you reload.
        </p>
      )}
      <SheetToolbar />
      <ModuleTree
        sheet={sheet}
        sheetId={sheetId}
        stats={stats}
        openSet={openSet}
        onToggle={toggleOpen}
        focusId={focusId}
        onOpenNotes={setNotesFor}
      />
      {notesFor && <NotesModal problem={notesFor} onClose={() => setNotesFor(null)} />}
    </div>
  );
}
