import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('geode_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // On mount (or token change) – validate the stored token
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => {
        // Token is invalid / expired → clear it
        localStorage.removeItem('geode_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback(async (googleCredential) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: googleCredential }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login failed');
    }
    localStorage.setItem('geode_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('geode_token');
    setToken(null);
    setUser(null);
  }, []);

  /** Helper: fetch with auth header attached */
  const authFetch = useCallback(
    (url, options = {}) => {
      const headers = { ...options.headers };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return fetch(url, { ...options, headers });
    },
    [token],
  );

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
