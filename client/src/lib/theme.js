import { useCallback, useState } from 'react';

// The initial theme is applied by the inline script in index.html (before first paint, so there's
// no flash). This hook reads it back and keeps <html data-theme> and localStorage in sync.
const STORAGE_KEY = 'lifesheet-theme';

const current = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

export function useTheme() {
  const [theme, setTheme] = useState(current);

  const toggle = useCallback(() => {
    const next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage blocked (private mode) — the choice just won't persist
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
