import { useCallback, useEffect, useMemo, useState } from 'react';

/** useState that survives reloads via localStorage. UI preferences only, never user data. */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked or full — losing a UI preference is harmless.
    }
  }, [key, value]);

  return [value, setValue];
}

/** A persisted Set of keys, e.g. which accordion rows are expanded. */
export function usePersistentSet(key) {
  const [list, setList] = usePersistentState(key, []);
  const set = useMemo(() => new Set(list), [list]);

  const toggle = useCallback(
    (k) => setList((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k])),
    [setList],
  );

  const addMany = useCallback(
    (keys) =>
      setList((prev) => {
        const missing = keys.filter((k) => !prev.includes(k));
        return missing.length ? [...prev, ...missing] : prev;
      }),
    [setList],
  );

  return [set, toggle, addMany];
}
