import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

// All per-problem user state, loaded with ONE request after login and kept in memory.
// Toggles are optimistic: the UI (checkbox, every progress bar, "Up next") updates instantly
// and rolls back only if the server rejects the write.

const ProgressContext = createContext(null);

export const EMPTY_ENTRY = Object.freeze({ done: false, saved: false, hasNotes: false, difficulty: '' });
const initialState = { status: 'idle', byId: {}, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'loading':
      return { ...initialState, status: 'loading' };
    case 'loaded':
      return { status: 'ready', byId: action.byId, error: null };
    case 'failed':
      return { ...state, status: 'error', error: action.error };
    case 'merge': {
      const current = state.byId[action.id] ?? EMPTY_ENTRY;
      return { ...state, byId: { ...state.byId, [action.id]: { ...current, ...action.patch } } };
    }
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

const toEntry = (row) => ({
  done: !!row.done,
  saved: !!row.saved,
  hasNotes: !!row.hasNotes,
  difficulty: row.difficulty ?? '',
});

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [state, dispatch] = useReducer(reducer, initialState);

  const byIdRef = useRef(state.byId);
  byIdRef.current = state.byId;
  const requestSeq = useRef(new Map()); // problemId → latest request number, guards rollbacks

  useEffect(() => {
    if (!userId) {
      dispatch({ type: 'reset' });
      return undefined;
    }
    let alive = true;
    dispatch({ type: 'loading' });
    api
      .get('/progress')
      .then((rows) => {
        if (!alive) return;
        const byId = {};
        for (const row of rows) byId[row.problemId] = toEntry(row);
        dispatch({ type: 'loaded', byId });
      })
      .catch((err) => alive && dispatch({ type: 'failed', error: err.message }));
    return () => {
      alive = false;
    };
  }, [userId]);

  const patchFlags = useCallback(async (id, patch) => {
    const previous = byIdRef.current[id] ?? EMPTY_ENTRY;
    const rollback = Object.fromEntries(Object.keys(patch).map((k) => [k, previous[k]]));
    dispatch({ type: 'merge', id, patch });

    const seq = (requestSeq.current.get(id) ?? 0) + 1;
    requestSeq.current.set(id, seq);
    try {
      await api.patch(`/progress/${encodeURIComponent(id)}`, patch);
    } catch (err) {
      // Only roll back if no newer toggle for this problem has been issued since.
      if (requestSeq.current.get(id) === seq) dispatch({ type: 'merge', id, patch: rollback });
      // FUTURE: surface this in a toast instead of the console.
      console.error(`Couldn’t save progress for ${id}:`, err.message);
    }
  }, []);

  const toggleDone = useCallback(
    (id) => patchFlags(id, { done: !(byIdRef.current[id]?.done ?? false) }),
    [patchFlags],
  );

  // "Save" = the bookmark icon. FUTURE: named collections instead of a single saved flag.
  const toggleSaved = useCallback(
    (id) => patchFlags(id, { saved: !(byIdRef.current[id]?.saved ?? false) }),
    [patchFlags],
  );

  /** Called by the notes modal after a successful save, so row icons update without a refetch. */
  const setNoteMeta = useCallback((id, meta) => dispatch({ type: 'merge', id, patch: meta }), []);

  const value = useMemo(() => {
    const { byId } = state;
    return {
      status: state.status,
      error: state.error,
      byId,
      get: (id) => byId[id] ?? EMPTY_ENTRY,
      isDone: (id) => byId[id]?.done === true,
      toggleDone,
      toggleSaved,
      setNoteMeta,
    };
  }, [state, toggleDone, toggleSaved, setNoteMeta]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
