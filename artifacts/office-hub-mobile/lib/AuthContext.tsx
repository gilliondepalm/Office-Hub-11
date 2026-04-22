import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch, apiJson, saveCookie } from "./api";

export interface User {
  id: number;
  username: string;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  vacationDays?: number | null;
  vacationDaysUsed?: number | null;
  saldoOud?: number | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await apiJson<User>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(data);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {}
    await saveCookie(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
