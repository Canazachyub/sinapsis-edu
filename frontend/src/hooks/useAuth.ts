// Stub Fase 0. Implementación completa en Fase 5 (login + portal alumno).
import { useEffect, useState } from 'react';

const TOKEN_KEY = 'pc_token';
const USER_KEY = 'pc_user';

export interface AuthUser {
  nombre: string;
  correo: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  useEffect(() => {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
  }, [user]);

  function login(newToken: string, newUser: AuthUser) {
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return { token, user, isAuthenticated: !!token, login, logout };
}
