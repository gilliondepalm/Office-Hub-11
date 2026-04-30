const STORAGE_KEY = "officehub.session.token";

let memoryToken: string | null = null;

function readStorage(): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage failures (e.g. private mode)
  }
}

export function loadSessionToken(): string | null {
  if (memoryToken) return memoryToken;
  memoryToken = readStorage();
  return memoryToken;
}

export function saveSessionToken(token: string | null): void {
  memoryToken = token;
  writeStorage(token);
}

interface ResolvedTarget {
  url: URL;
  isSameOriginApi: boolean;
  isLogin: boolean;
}

function resolveTarget(input: RequestInfo | URL): ResolvedTarget | null {
  try {
    let raw: string;
    if (typeof input === "string") {
      raw = input;
    } else if (input instanceof URL) {
      raw = input.href;
    } else {
      raw = input.url;
    }
    const url = new URL(raw, window.location.href);
    const isSameOriginApi =
      url.origin === window.location.origin &&
      url.pathname.startsWith("/api/");
    return {
      url,
      isSameOriginApi,
      isLogin: isSameOriginApi && url.pathname === "/api/auth/login",
    };
  } catch {
    return null;
  }
}

let installed = false;

/**
 * Returns true when the page is running inside a cross-origin iframe
 * (e.g. the Replit workspace preview pane). In that case Chrome treats
 * the API cookie as third-party and silently drops it, even with
 * `SameSite=None;Secure`, so we fall back to a token transport.
 *
 * On the published top-level domain (production), this returns false
 * and the app keeps using the httpOnly session cookie alone.
 */
export function isThirdPartyContext(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.top === window) return false;
    // Cross-origin: try/catch on accessing the parent's location.
    // If access throws, parent is a different origin → third-party context.
    void window.top?.location.href;
    return false;
  } catch {
    return true;
  }
}

/**
 * Install a one-time global `fetch` wrapper that — only when running
 * inside a cross-origin iframe (Replit workspace preview):
 *   - injects `X-Session-Token` on every same-origin `/api/...` request,
 *     so authentication still works where Chrome blocks third-party
 *     cookies (parent: replit.com, iframe origin: *.replit.dev).
 *   - sets `X-Client: web` on the `/api/auth/login` request so the
 *     server returns the signed session token in the response body.
 *   - defaults `credentials: "include"` for same-origin `/api/*` calls
 *     so any remaining cookie-based callers keep working unchanged.
 *
 * On the production top-level domain (no iframe), the wrapper is a
 * no-op pass-through, preserving httpOnly cookie protection in full.
 *
 * Cross-origin requests and non-`/api/*` requests are always passed
 * through untouched to prevent leaking the bearer-equivalent session
 * token to other origins.
 *
 * Existing `Request` objects are preserved (their headers, body,
 * credentials, mode, etc.) and only auth headers are added on top.
 */
export function installAuthFetch(): void {
  if (installed) return;
  if (typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }
  installed = true;

  // Only enable the token transport when we're inside a cross-origin
  // iframe (Replit workspace preview). On the production top-level
  // domain we leave the original fetch alone so httpOnly cookie auth
  // remains the only credential transport.
  if (!isThirdPartyContext()) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const target = resolveTarget(input);

    // Pass-through for cross-origin or non-API URLs — never leak the token.
    if (!target || !target.isSameOriginApi) {
      return originalFetch(input as RequestInfo, init);
    }

    const isRequestObject = input instanceof Request;
    const baseRequest = isRequestObject ? (input as Request) : null;

    // Merge headers: start from Request headers (if any), then init headers,
    // then auth additions. Caller-provided values are not overwritten.
    const headers = new Headers();
    if (baseRequest) {
      baseRequest.headers.forEach((v, k) => headers.set(k, v));
    }
    if (init?.headers) {
      const initHeaders = new Headers(init.headers);
      initHeaders.forEach((v, k) => headers.set(k, v));
    }

    const token = loadSessionToken();
    if (token && !headers.has("X-Session-Token")) {
      headers.set("X-Session-Token", token);
    }
    if (target.isLogin && !headers.has("X-Client")) {
      headers.set("X-Client", "web");
    }

    const credentials =
      init?.credentials ?? baseRequest?.credentials ?? "include";

    if (baseRequest) {
      // Preserve the rest of the Request via clone, override only what we changed.
      const merged = new Request(baseRequest, {
        ...init,
        headers,
        credentials,
      });
      return originalFetch(merged);
    }

    return originalFetch(input as RequestInfo, {
      ...(init ?? {}),
      headers,
      credentials,
    });
  };
}
