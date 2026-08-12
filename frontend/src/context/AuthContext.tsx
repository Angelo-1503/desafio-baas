import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { type RegisterPayload, authApi } from '../api/auth';
import { getToken, setToken } from '../api/client';
import type { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'baas_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (getToken() && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persist(token: string, nextUser: User) {
    setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  async function login(email: string, password: string) {
    const response = await authApi.login(email, password);
    persist(response.accessToken, response.user);
  }

  async function register(payload: RegisterPayload) {
    const response = await authApi.register(payload);
    persist(response.accessToken, response.user);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
