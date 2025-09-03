export interface PullRequestListItem {
  number: number;
  title: string;
  state?: "open" | "closed";
  body?: string | null;
  html_url: string;
  user?: { login?: string | null } | null;
  labels?: { name?: string | null }[];
}

export interface RepoPRSummary {
  repo: string;
  openPRs: number;
  authors?: string[];
  summary: string;
}

export interface OwnerPRsList {
  owner: string;
  totalOpenPRs: number;
  repositories: {
    repo: string;
    openPRs: number;
    prs: {
      number: number;
      title: string;
      author: string | null;
      labels: string[];
      html_url: string;
    }[];
  }[];
}

export interface OwnerPRsSummary {
  owner: string;
  totalOpenPRs: number;
  repositories: { repo: string; openPRs: number; authors: string[] }[];
  authors?: string[];
  summary: string;
  note?: string;
}

function joinUrl(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
    .join("/");
}

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || "http://localhost:5000";
const PRS_BASE = joinUrl(API_BASE, "/prs");

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

export async function fetchRepoPRs(
  owner: string,
  repo: string,
  opts?: { signal?: AbortSignal }
): Promise<PullRequestListItem[]> {
  const url = joinUrl(PRS_BASE, `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  return fetchJson(url, { signal: opts?.signal });
}

export async function summarizeRepoPRs(
  owner: string,
  repo: string,
  opts?: { signal?: AbortSignal }
): Promise<RepoPRSummary> {
  const url = joinUrl(PRS_BASE, `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/summary`);
  return fetchJson(url, { signal: opts?.signal });
}

export async function listOpenPRsForOwner(owner: string, opts?: { signal?: AbortSignal }) {
  const url = joinUrl(PRS_BASE, `/owner/${encodeURIComponent(owner)}/open`);
  return fetchJson<OwnerPRsList>(url, { signal: opts?.signal });
}

export async function summarizeOpenPRsForOwner(owner: string, opts?: { signal?: AbortSignal }) {
  const url = joinUrl(PRS_BASE, `/owner/${encodeURIComponent(owner)}/open/summary`);
  return fetchJson<OwnerPRsSummary>(url, { signal: opts?.signal });
}