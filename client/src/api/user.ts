const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export type Me = {
  login?: string;
  name?: string;
  avatar_url?: string;
  id?: number;
};

export async function getMe(init?: { signal?: AbortSignal }): Promise<Me> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    credentials: "include",
    ...(init?.signal ? { signal: init.signal } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as Me;
}