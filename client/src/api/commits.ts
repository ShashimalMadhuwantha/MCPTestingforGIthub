export interface CommitListItem {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; email?: string; date?: string };
  };
  author?: { login?: string | null } | null;
}

export interface CommitSummary {
  summary: string;
  date?: string;
  repo?: string;
  commits?: number;
  authors?: string[];
}

// ...existing code...
function joinUrl(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
    .join("/");
}

// Default to your server; override via VITE_API_BASE_URL if needed
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || "http://localhost:5000";
const COMMITS_BASE = joinUrl(API_BASE, "/commits");

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = text || `Request failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status });
  }
  if (ct.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  const text = await res.text().catch(() => "");
  throw Object.assign(new Error(`Expected JSON but received ${ct || "unknown"}: ${text.slice(0, 180)}`), {
    status: res.status,
  });
}
// ...existing code...

export async function fetchCommits(
  owner: string,
  repo: string,
  opts?: { signal?: AbortSignal }
): Promise<CommitListItem[]> {
  const url = joinUrl(COMMITS_BASE, `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  return fetchJson<CommitListItem[]>(url, { signal: opts?.signal });
}

export async function fetchCommitSummary(
  owner: string,
  repo: string,
  opts?: { signal?: AbortSignal }
): Promise<CommitSummary> {
  const url = joinUrl(COMMITS_BASE, `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/summary`);
  return fetchJson<CommitSummary>(url, { signal: opts?.signal });
}

export async function fetchCommitSummaryByDate(
  owner: string,
  repo: string,
  date: string, // YYYY-MM-DD
  opts?: { signal?: AbortSignal }
): Promise<CommitSummary> {
  const url = joinUrl(
    COMMITS_BASE,
    `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/summary/${encodeURIComponent(date)}`
  );
  return fetchJson<CommitSummary>(url, { signal: opts?.signal });
}

// ...existing code...

export async function fetchCommitsByDate(
  owner: string,
  repo: string,
  date: string, // YYYY-MM-DD
  opts?: { signal?: AbortSignal }
): Promise<CommitListItem[]> {
  const url = joinUrl(
    COMMITS_BASE,
    `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/by-date/${encodeURIComponent(date)}`
  );
  return fetchJson<CommitListItem[]>(url, { signal: opts?.signal });
}

// ...existing code...