import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_BASE, apiFetch, apiJson, checkConnection, isNetworkError, saveToken } from "./api";

export interface User {
  id: number;
  username: string;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  functie?: string | null;
  kadasterId?: string | null;
  avatarUrl?: string | null;
  vacationDays?: number | null;
  vacationDaysUsed?: number | null;
  saldoOud?: number | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  connectionError: boolean;
  retryConnection: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  const refresh = useCallback(async () => {
    if (!API_BASE) {
      setConnectionError(true);
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setConnectionError(false);
      } else {
        setUser(null);
        setConnectionError(false);
      }
    } catch (err) {
      setUser(null);
      if (isNetworkError(err)) {
        setConnectionError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const retryConnection = useCallback(async () => {
    const ok = await checkConnection();
    if (ok) {
      setConnectionError(false);
      setLoading(true);
      await refresh();
    } else {
      setConnectionError(true);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await apiJson<User & { sessionToken?: string }>(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "X-Client": "mobile" },
          body: JSON.stringify({ username, password }),
        },
      );
      if (data.sessionToken) {
        await saveToken(data.sessionToken);
      }
      const { sessionToken: _t, ...rest } = data;
      setUser(rest as User);
      setConnectionError(false);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {}
    await saveToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, connectionError, retryConnection, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
