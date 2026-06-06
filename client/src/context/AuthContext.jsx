/**
 * @module context/AuthContext
 * @description React context for JWT authentication state management.
 * Handles login, logout, and automatic session validation.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, fetchProfile } from '../utils/api';

const AuthContext = createContext(null);

/**
 * Authentication context provider. Wraps the app to provide auth state.
 * @param {object} props - React props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {React.ReactElement} Provider component.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile()
        .then(data => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context.
 * @returns {{user: object|null, loading: boolean, login: Function, logout: Function, isAuthenticated: boolean}}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
