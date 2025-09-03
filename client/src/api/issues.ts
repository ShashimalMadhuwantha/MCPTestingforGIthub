function joinUrl(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
    .join("/");
}

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || "http://localhost:5000";
const ISSUES_BASE = joinUrl(API_BASE, "/issues");

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(text || `Request failed (${res.status})`), { status: res.status });
  }
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  const text = await res.text().catch(() => "");
  throw new Error(`Expected JSON but received ${ct || "unknown"}: ${text.slice(0, 180)}`);
}

export interface IssueListItem {
  number: number;
  title: string;
  state?: "open" | "closed";
  body?: string | null;
  html_url: string;
  user?: { login?: string | null } | null;
  labels?: { name?: string | null }[] | string[];
  comments?: number;
  pull_request?: unknown;
}

export interface RepoIssuesSummary {
  repo: string;
  openIssues: number;
  authors?: string[];
  summary: string;
  note?: string;
}

export interface OwnerIssuesList {
  owner: string;
  totalOpenIssues: number;
  repositories: {
    repo: string;
    openIssues: number;
    issues: {
      number: number;
      title: string;
      author: string | null;
      labels: string[];
      comments: number;
      html_url: string;
    }[];
  }[];
}

export interface OwnerIssuesSummary {
  owner: string;
  totalOpenIssues: number;
  repositories: { repo: string; openIssues: number }[];
  authors?: string[];
  summary: string;
  note?: string;
}

export async function fetchRepoIssues(
  owner: string,
  repo: string,
  opts?: { signal?: AbortSignal }
): Promise<IssueListItem[]> {
  const url = joinUrl(ISSUES_BASE, `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  return fetchJson(url, { signal: opts?.signal });
}

export async function summarizeRepoIssues(
  owner: string,
  repo: string,
  opts?: { signal?: AbortSignal }
): Promise<RepoIssuesSummary> {
  const url = joinUrl(ISSUES_BASE, `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/summary`);
  return fetchJson(url, { signal: opts?.signal });
}

export async function listOpenIssuesForOwner(owner: string, opts?: { signal?: AbortSignal }) {
  const url = joinUrl(ISSUES_BASE, `/owner/${encodeURIComponent(owner)}/open`);
  return fetchJson<OwnerIssuesList>(url, { signal: opts?.signal });
}

export async function summarizeOpenIssuesForOwner(owner: string, opts?: { signal?: AbortSignal }) {
  const url = joinUrl(ISSUES_BASE, `/owner/${encodeURIComponent(owner)}/open/summary`);
  return fetchJson<OwnerIssuesSummary>(url, { signal: opts?.signal });
}