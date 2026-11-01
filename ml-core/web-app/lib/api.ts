export function getApiBaseUrl(): string {
  // If explicitly configured for external cloud deployment (e.g. Render / Railway / ngrok)
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith("/")) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  // Standard Next.js /api proxy (avoids collisions with Next.js App Router pages)
  return "/api";
}

export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function getApiHeaders(extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders || {});
  headers.set("ngrok-skip-browser-warning", "true");
  return headers;
}

// Global browser fetch interceptor: automatically attaches ngrok-skip-browser-warning
// to bypass ngrok's free tier interstitial page (ERR_NGROK_6024) and avoid CORS/JSON parsing errors.
if (typeof window !== "undefined" && !(window as any).__ngrok_fetch_patched) {
  (window as any).__ngrok_fetch_patched = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    let urlString = "";
    if (typeof input === "string") {
      urlString = input;
    } else if (input instanceof URL) {
      urlString = input.toString();
    } else if (typeof Request !== "undefined" && input instanceof Request) {
      urlString = input.url;
    }

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").toLowerCase();
    const isTarget =
      urlString.includes("ngrok") ||
      (apiBase && urlString.toLowerCase().startsWith(apiBase)) ||
      urlString.startsWith("/api");

    if (isTarget) {
      if (typeof Request !== "undefined" && input instanceof Request) {
        const headers = new Headers(input.headers);
        if (!headers.has("ngrok-skip-browser-warning")) {
          headers.set("ngrok-skip-browser-warning", "true");
        }
        input = new Request(input, { headers });
      } else {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has("ngrok-skip-browser-warning")) {
          headers.set("ngrok-skip-browser-warning", "true");
        }
        init.headers = headers;
      }
    }

    return originalFetch.call(this, input, init);
  };
}
