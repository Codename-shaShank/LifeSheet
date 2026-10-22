import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, Check, ExternalLink, FileText, Send, Sparkles, SquarePen } from 'lucide-react';
import Breadcrumb from '../components/common/Breadcrumb.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import NotesModal from '../components/sheet/NotesModal.jsx';
import { useProgress } from '../context/ProgressContext.jsx';
import { useContent } from '../hooks/useContent.js';
import { loadSheet, loadSolution } from '../lib/content.js';
import { platformOf } from '../lib/platforms.js';

export default function ProblemPage() {
  const { sheetId, problemId } = useParams();
  const { data: sheet, status } = useContent(loadSheet, sheetId);
  const solution = useContent(loadSolution, problemId);
  const progress = useProgress();
  const [notesOpen, setNotesOpen] = useState(false);

  if (status === 'loading') return <div className="page" aria-busy="true" />;

  const hit = sheet?.index.get(problemId);
  if (!hit) {
    return (
      <div className="page">
        <EmptyState
          icon={FileText}
          title="Problem not found"
          body="It may have been renamed in your spreadsheet. Find it again from the sheet."
          action={<Link to={sheet ? `/prep/${sheetId}` : '/prep'} className="btn">Back to the sheet</Link>}
        />
      </div>
    );
  }

  const { problem, moduleId } = hit;
  const moduleTitle = sheet.modules.find((m) => m.id === moduleId)?.title;
  const entry = progress.get(problem.id);
  const doc = solution.data; // { statement?, sections?, code? } from content/solutions/<id>.json

  return (
    <div className="page problem-page">
      <Breadcrumb
        items={[
          { label: 'Prep Hub', to: '/prep' },
          { label: sheet.title, to: `/prep/${sheetId}` },
          { label: problem.title },
        ]}
      />

      <div className="problem-layout">
        <article className="problem-main">
          <header className="problem-head">
            <p className="problem-module">{moduleTitle}</p>
            <h1>{problem.title}</h1>
            <div className="problem-actions">
              <button
                type="button"
                className={`btn${entry.done ? ' btn-success' : ''}`}
                onClick={() => progress.toggleDone(problem.id)}
                aria-pressed={entry.done}
              >
                <Check size={15} /> {entry.done ? 'Done' : 'Mark as done'}
              </button>
              {problem.links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="btn">
                  Open on {platformOf(l.platform).label} <ExternalLink size={14} />
                </a>
              ))}
              <button type="button" className="btn" onClick={() => setNotesOpen(true)}>
                <SquarePen size={15} /> {entry.hasNotes ? 'Edit notes' : 'Add notes'}
              </button>
              <button
                type="button"
                className={`btn${entry.saved ? ' is-saved' : ''}`}
                onClick={() => progress.toggleSaved(problem.id)}
                aria-pressed={entry.saved}
              >
                <Bookmark size={15} fill={entry.saved ? 'currentColor' : 'none'} /> {entry.saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </header>

          <section className="problem-section">
            <h2>Problem</h2>
            {doc?.statement ? (
              <p className="prose">{doc.statement}</p>
            ) : (
              <p className="placeholder">
                No statement written yet. Add one in <code>content/solutions/{problem.id}.json</code>, or read it on
                the platform.
              </p>
            )}
          </section>

          <section className="problem-section">
            <h2>Solution</h2>
            {doc?.sections?.length ? (
              doc.sections.map((s) => (
                <div key={s.title} className="solution-block">
                  <h3>{s.title}</h3>
                  <p className="prose">{s.body}</p>
                </div>
              ))
            ) : (
              <p className="placeholder">No solution written yet.</p>
            )}
            {doc?.code?.map((c) => (
              <pre key={c.lang} className="code-block" data-lang={c.lang}>
                <code>{c.code}</code>
              </pre>
            ))}
            {/* FUTURE: language tabs for code blocks, and syntax highlighting. */}
          </section>

          {problem.similar.length > 0 && (
            <section className="problem-section">
              <h2>Similar problems</h2>
              <ul className="chips">
                {problem.similar.map((s) => (
                  <li key={`${s.label}-${s.url}`}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="chip">
                        {s.label} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="chip is-static">{s.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        {/*
          FUTURE: AI chat, powered by the Google Gemini API.
          • Client: this panel POSTs to /api/chat { problemId, messages } and renders the streamed reply.
            The Gemini key NEVER reaches the browser.
          • Server: new route server/src/routes/chat.js calls Gemini with GEMINI_API_KEY from env
            (Google's official Node SDK, @google/genai). Pick a current Gemini model in Google AI Studio
            and keep the model name in env (GEMINI_MODEL) so it can change without a code change.
          • Context sent to Gemini: problem title + platform link, content/solutions/<id>.json if it
            exists, and the user's own notes (approach, pitfall, TC/SC) for this problem.
          • Modes: "Hint only" (no spoilers), "Review my approach", "Explain the complexity".
          • Guards: requireAuth, a per-user rate limit, and a max message length.
          • Chat history per problem stored in a `chats` collection { userId, problemId, messages[] }.
        */}
        <aside className="chat-panel" aria-labelledby="chat-title">
          <header className="chat-head">
            <Sparkles size={16} />
            <h2 id="chat-title">Ask AI</h2>
            <span className="soon-badge">Soon</span>
          </header>
          <div className="chat-body">
            <p className="muted">Hints, approach reviews and complexity checks for this problem will show up here.</p>
          </div>
          <form className="chat-composer" onSubmit={(e) => e.preventDefault()}>
            <textarea rows={2} placeholder="Ask about this problem" disabled aria-label="Message" />
            <button type="submit" className="icon-btn" disabled aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </aside>
      </div>

      {notesOpen && <NotesModal problem={problem} onClose={() => setNotesOpen(false)} />}
    </div>
  );
}
