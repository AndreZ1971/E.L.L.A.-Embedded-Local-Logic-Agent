const API = (import.meta.env.VITE_API_BASE ?? "") as string;

function token(): string {
  return (
    (window as any).electronAPI?.apiToken ||
    import.meta.env.VITE_ELLA_DEV_TOKEN ||
    ""
  );
}

export function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-ELLA-Token", token());
  return fetch(`${API}${path}`, { ...init, headers });
}

export function eventStreamUrl(path = "/api/events/stream"): string {
  return `${API}${path}?token=${encodeURIComponent(token())}`;
}

export function apiAudioUrl(path: string): Promise<string> {
  return apiFetch(path)
    .then((r) => r.blob())
    .then((b) => URL.createObjectURL(b));
}

export { API };
