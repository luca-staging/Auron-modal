// Same-origin /api on Vercel. VITE_API_URL is only for a split local desk (Vite :3000, API :8080).
const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8080" : "");

export async function apiGet(path) {
  try {
    const res = await fetch(`${API}/api/v1${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiPost(path, body) {
  try {
    const res = await fetch(`${API}/api/v1${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
