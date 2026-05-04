import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const TOKEN_KEY = "officehub.session.token";

const ENV_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

type ExtraConfig = { apiUrl?: unknown } & Record<string, unknown>;

function readExtraApiUrl(): string | null {
  const sources: Array<ExtraConfig | undefined> = [
    Constants.expoConfig?.extra as ExtraConfig | undefined,
    (Constants.manifest2 as { extra?: ExtraConfig } | null | undefined)?.extra,
  ];
  for (const extra of sources) {
    const raw = extra?.apiUrl;
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim().replace(/\/+$/, "");
    if (trimmed) return trimmed;
  }
  return null;
}

function extractHostname(value: string | undefined | null): string | null {
  if (!value) return null;
  let s = String(value).trim();
  if (!s) return null;
  s = s.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  if (s.startsWith("[")) {
    const end = s.indexOf("]");
    if (end > 0) s = s.substring(1, end);
  } else if (s.includes(":")) {
    s = s.split(":")[0];
  }
  return s || null;
}

function deriveFromHost(host: string | undefined | null): string | null {
  const clean = extractHostname(host);
  if (!clean) return null;
  if (!clean.endsWith(".replit.dev")) return null;
  if (clean.includes(".expo.")) {
    return `https://${clean.replace(".expo.", ".")}`;
  }
  return `https://${clean}`;
}

function resolveApiBase(): string {
  if (ENV_DOMAIN) return `https://${ENV_DOMAIN}`;

  // EAS production builds (no Expo dev server, no window in the native shell):
  // use the stable URL baked into app.json `extra.apiUrl`.
  if (!__DEV__) {
    const prod = readExtraApiUrl();
    if (prod) return prod;
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host.includes(".expo.")) {
      return `${window.location.protocol}//${host.replace(".expo.", ".")}`;
    }
    return `${window.location.protocol}//${host}`;
  }

  const candidates: Array<string | undefined> = [
    (Constants.expoConfig as any)?.hostUri,
    (Constants as any).expoGoConfig?.debuggerHost,
    (Constants as any).expoGoConfig?.hostUri,
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost,
    (Constants.manifest2 as any)?.extra?.expoGo?.developer?.hostUri,
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri,
    (Constants as any).manifest?.hostUri,
    (Constants as any).manifest?.debuggerHost,
  ];
  for (const c of candidates) {
    const url = deriveFromHost(c);
    if (url) return url;
  }

  console.warn(
    "[api] Kon API-basis-URL niet bepalen. Stel EXPO_PUBLIC_DOMAIN in (dev) of vul `expo.extra.apiUrl` in app.json (productie).",
  );
  return "";
}

export const API_BASE = resolveApiBase();

let memoryToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  memoryToken = stored;
  return stored;
}

export async function saveToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await loadToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["X-Session-Token"] = token;

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  return fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });
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
