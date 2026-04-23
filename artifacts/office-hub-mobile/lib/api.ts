import AsyncStorage from "@react-native-async-storage/async-storage";

const COOKIE_KEY = "officehub.session.cookie";

const ENV_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

function resolveApiBase(): string {
  if (ENV_DOMAIN) return `https://${ENV_DOMAIN}`;
  // On Expo web, window.location is the expo dev domain
  // (e.g. <id>.expo.riker.replit.dev). The API server lives on the
  // matching main domain (e.g. <id>.riker.replit.dev) at /api.
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host.includes(".expo.")) {
      return `${window.location.protocol}//${host.replace(".expo.", ".")}`;
    }
    return `${window.location.protocol}//${host}`;
  }
  return "";
}

export const API_BASE = resolveApiBase();

let memoryCookie: string | null = null;

export async function loadCookie(): Promise<string | null> {
  if (memoryCookie) return memoryCookie;
  const stored = await AsyncStorage.getItem(COOKIE_KEY);
  memoryCookie = stored;
  return stored;
}

export async function saveCookie(cookie: string | null): Promise<void> {
  memoryCookie = cookie;
  if (cookie) {
    await AsyncStorage.setItem(COOKIE_KEY, cookie);
  } else {
    await AsyncStorage.removeItem(COOKIE_KEY);
  }
}

function extractSessionCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  const parts = setCookieHeader.split(/,(?=[^;]+?=)/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.toLowerCase().startsWith("connect.sid=")) {
      const semi = trimmed.indexOf(";");
      return semi >= 0 ? trimmed.substring(0, semi) : trimmed;
    }
  }
  return null;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookie = await loadCookie();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (cookie) headers["Cookie"] = cookie;

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const setCookie =
    res.headers.get("set-cookie") || res.headers.get("Set-Cookie");
  const session = extractSessionCookie(setCookie);
  if (session) {
    await saveCookie(session);
  }
  return res;
}

export async function apiJson<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    let msg = `Request mislukt (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
