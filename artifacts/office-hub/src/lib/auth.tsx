import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@/lib/shared-schema";
import { apiRequest, queryClient } from "./queryClient";
import { saveSessionToken } from "./sessionToken";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
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
    fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    const data = await res.json();
    if (data?.sessionToken) {
      saveSessionToken(data.sessionToken);
    }
    const { sessionToken: _t, ...user } = data ?? {};
    setUser(user as User);
  };

  const logout = async () => {
    let serverLogoutError: unknown = null;
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (err) {
      // Server-side logout failed (network down, server error). We still
      // clear local state so the user appears logged out, but we log and
      // re-throw so the UI can show a warning — the server session may
      // still be alive on a shared device.
      serverLogoutError = err;
      console.error("Server logout failed; local session cleared.", err);
    }
    saveSessionToken(null);
    setUser(null);
    queryClient.clear();
    if (serverLogoutError) {
      throw serverLogoutError;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
