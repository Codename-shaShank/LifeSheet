import { useEffect, useState } from 'react';

/**
 * Loads a content file through one of the loaders in lib/content.js.
 * status: 'loading' | 'ready' | 'missing' (no such file) | 'error'
 */
export function useContent(loadFn, id) {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', data: null });
    loadFn(id)
      .then((data) => alive && setState({ status: data ? 'ready' : 'missing', data }))
      .catch((error) => alive && setState({ status: 'error', data: null, error }));
    return () => {
      alive = false;
    };
  }, [loadFn, id]);

  return state;
}
