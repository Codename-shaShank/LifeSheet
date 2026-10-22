import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });
  const setUser = useCallback((user) => setState({ status: 'ready', user }), []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    let alive = true;
    api
      .get('/auth/me')
      .then((d) => alive && setUser(d.user))
      .catch(() => alive && setUser(null));
    return () => {
      alive = false;
    };
  }, [setUser]);

  const login = useCallback(
    async (identifier, password) => setUser((await api.post('/auth/login', { identifier, password })).user),
    [setUser],
  );

  const signup = useCallback(async (payload) => setUser((await api.post('/auth/signup', payload)).user), [setUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, [setUser]);

  const value = useMemo(() => ({ ...state, login, signup, logout }), [state, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
