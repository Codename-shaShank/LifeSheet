import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { NOTES_SCHEMA } from '../../content/notesSchema.js';
import { api } from '../../lib/api.js';
import { useProgress } from '../../context/ProgressContext.jsx';

function NoteField({ field, value, onChange }) {
  const id = `note-${field.key}`;
  const shared = { id, name: field.key, value, onChange: (e) => onChange(field.key, e.target.value) };

  let control;
  if (field.type === 'select') {
    control = (
      <select {...shared}>
        <option value="">Not set</option>
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'textarea') {
    control = <textarea rows={field.rows ?? 3} placeholder={field.placeholder} {...shared} />;
  } else {
    control = <input type="text" placeholder={field.placeholder} {...shared} />;
  }

  return (
    <div className={`field${field.span === 2 ? ' span-2' : ''}`}>
      <label htmlFor={id}>{field.label}</label>
      {control}
    </div>
  );
}

const sameNotes = (a, b) => NOTES_SCHEMA.every(({ key }) => (a[key] ?? '') === (b[key] ?? ''));

export default function NotesModal({ problem, onClose }) {
  const dialogRef = useRef(null);
  const { setNoteMeta } = useProgress();
  const [initial, setInitial] = useState(null); // null while loading
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal(); // guard: StrictMode runs effects twice in dev
  }, []);

  useEffect(() => {
    let alive = true;
    api
      .get(`/notes/${encodeURIComponent(problem.id)}`)
      .then((d) => {
        if (!alive) return;
        setInitial(d.notes ?? {});
        setValues(d.notes ?? {});
      })
      .catch((err) => {
        if (!alive) return;
        setInitial({});
        setError(`Couldn’t load your notes: ${err.message}`);
      });
    return () => {
      alive = false;
    };
  }, [problem.id]);

  const update = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const requestClose = () => {
    const dirty = initial && !sameNotes(initial, values);
    if (dirty && !window.confirm('Discard unsaved notes?')) return;
    dialogRef.current?.close();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const d = await api.put(`/notes/${encodeURIComponent(problem.id)}`, { notes: values });
      setNoteMeta(problem.id, { hasNotes: d.hasNotes, difficulty: d.notes.difficulty ?? '' });
      setInitial(d.notes);
      dialogRef.current?.close();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="notes-title"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault(); // Esc goes through the unsaved-changes check
        requestClose();
      }}
      onClick={(e) => e.target === dialogRef.current && requestClose()}
    >
      <form className="modal-body" onSubmit={handleSubmit}>
        <header className="modal-head">
          <div>
            <p className="modal-kicker">Notes</p>
            <h2 id="notes-title">{problem.title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Close notes">
            <X size={18} />
          </button>
        </header>

        {initial === null ? (
          <p className="muted modal-loading">Loading your notes…</p>
        ) : (
          <div className="notes-grid">
            {NOTES_SCHEMA.map((field) => (
              <NoteField key={field.key} field={field} value={values[field.key] ?? ''} onChange={update} />
            ))}
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <footer className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={requestClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || initial === null}>
            {saving ? 'Saving…' : 'Save notes'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
