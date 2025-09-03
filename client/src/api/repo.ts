export type PageRef = { url: string; page?: number } | null;

export type Repo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
  fork: boolean;
  archived: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  license: string | null;
  pushed_at: string;
  updated_at: string;
  created_at: string;
  owner: { login?: string; type?: string };
};

export type ReposResponse = {
  page: number;
  per_page: number;
  filters: Record<string, unknown>;
  pageInfo: { next: PageRef; prev: PageRef; first: PageRef; last: PageRef } | null;
  count: number;
  items: Repo[];
  summary?: string;
};

export type GetReposOptions = {
  page?: number;
  per_page?: number;
  visibility?: "all" | "public" | "private";
  affiliation?: string;
  type?: "all" | "owner" | "public" | "private" | "member";
  sort?: "created" | "updated" | "pushed" | "full_name";
  direction?: "asc" | "desc";
  q?: string;
  language?: string;
  min_stars?: number;
  summary?: boolean | "true" | "false";
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function toQuery(params: Record<string, unknown>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (typeof v === "boolean") usp.set(k, v ? "true" : "false");
    else usp.set(k, String(v));
  });
  return usp.toString();
}

export async function getRepos(
  opts: GetReposOptions = {},
  init?: { signal?: AbortSignal }
): Promise<ReposResponse> {
  const qs = toQuery(opts);
  const res = await fetch(`${BASE_URL}/repos${qs ? `?${qs}` : ""}`, {
    credentials: "include",
    ...(init?.signal ? { signal: init.signal } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    return Promise.reject(new Error(msg));
  }
  return data as ReposResponse;
}