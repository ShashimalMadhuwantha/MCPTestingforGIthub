import { useEffect, useRef, useState } from "react";
import NavBar from "../components/NavBar";
import "../styles/prs.css";
import { getMe } from "../api/user";
import { getRepos, type Repo } from "../api/repo";
import {
  fetchRepoPRs,
  summarizeRepoPRs,
  listOpenPRsForOwner,
  summarizeOpenPRsForOwner,
  type PullRequestListItem,
  type RepoPRSummary,
  type OwnerPRsList,
  type OwnerPRsSummary,
} from "../api/prs";

const PROJECT_NAME = "GitGlimpse";

export default function PRs() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposErr, setReposErr] = useState<string | null>(null);

  const [prs, setPRs] = useState<PullRequestListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);

  const [ownerScope, setOwnerScope] = useState<OwnerPRsList | null>(null);
  const [ownerScopeLoading, setOwnerScopeLoading] = useState(false);
  const [ownerScopeErr, setOwnerScopeErr] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  useEffect(() => {
    document.title = `${PROJECT_NAME} • Pull Requests`;
  }, []);

  // Prefill owner from session and fetch repos
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const me = await getMe({ signal: ac.signal });
        if (me?.login && !owner) setOwner(me.login);
      } catch (e: any) {
        console.debug("getMe failed:", e?.message || e);
      }
      setReposLoading(true);
      setReposErr(null);
      try {
        const all: Repo[] = [];
        let page = 1;
        const per_page = 100;
        for (let i = 0; i < 20; i++) {
          const resp = await getRepos({ page, per_page }, { signal: ac.signal });
          all.push(...(resp.items || []));
          const next = resp.pageInfo?.next;
          if (!next) break;
          page = next.page ?? page + 1;
        }
        setRepos(all);
        if (all.length > 0 && !repo) {
          const first = all[0];
          const full = first.full_name || `${first.owner?.login ?? ""}/${first.name}`;
          const [o, r] = String(full).split("/");
          if (o && r) {
            setOwner((prev) => prev || o);
            setRepo(r);
          }
        }
      } catch (e: any) {
        setReposErr(e?.message || "Failed to load repositories");
      } finally {
        setReposLoading(false);
      }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load PRs on owner/repo change
  useEffect(() => {
    if (!owner || !repo) {
      setPRs(null);
      setErr(null);
      return;
    }
    const id = ++reqIdRef.current;
    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await fetchRepoPRs(owner, repo, { signal: ac.signal });
        if (reqIdRef.current !== id) return;
        setPRs(data);
      } catch (e: any) {
        const aborted =
          ac.signal.aborted ||
          e?.name === "AbortError" ||
          e?.code === 20 ||
          /aborted|The user aborted a request|signal was aborted/i.test(String(e?.message || ""));
        if (!aborted && reqIdRef.current === id) {
          setErr(e?.message || "Failed to load pull requests");
        }
      } finally {
        if (reqIdRef.current === id) setLoading(false);
      }
    }, 250);
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [owner, repo]);

  const onRepoSelect = (value: string) => {
    if (!value) {
      setRepo("");
      return;
    }
    const [o, r] = value.split("/");
    if (o && r) {
      setOwner((prev) => prev || o);
      setRepo(r);
    }
  };

  const onSummarizeRepo = async () => {
    if (!owner || !repo) return;
    setSummary(null);
    setSummaryErr(null);
    setSummaryLoading(true);
    try {
      const result: RepoPRSummary = await summarizeRepoPRs(owner, repo);
      setSummary(result.summary);
    } catch (e: any) {
      setSummaryErr(e?.message || "Failed to summarize PRs");
    } finally {
      setSummaryLoading(false);
    }
  };

  const onLoadOwnerOpen = async () => {
    if (!owner) return;
    setOwnerScope(null);
    setOwnerScopeErr(null);
    setOwnerScopeLoading(true);
    try {
      const result = await listOpenPRsForOwner(owner);
      setOwnerScope(result);
    } catch (e: any) {
      setOwnerScopeErr(e?.message || "Failed to list open PRs for owner");
    } finally {
      setOwnerScopeLoading(false);
    }
  };

  const onSummarizeOwnerOpen = async () => {
    if (!owner) return;
    setSummary(null);
    setSummaryErr(null);
    setSummaryLoading(true);
    try {
      const result: OwnerPRsSummary = await summarizeOpenPRsForOwner(owner);
      setSummary(result.summary);
    } catch (e: any) {
      setSummaryErr(e?.message || "Failed to summarize owner's PRs");
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <>
      <NavBar projectName={PROJECT_NAME} active="prs" showConnected />

      <div style={{ maxWidth: 980, margin: "24px auto", padding: "0 20px" }}>
        <h1>Pull Requests</h1>
        <p className="muted">List and summarize open PRs for a repository or across an owner.</p>

        <section style={{ marginTop: 16 }}>
          <div className="filter-grid">
            <div>
              <label>Owner</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="GitHub username or org"
              />
            </div>
            <div>
              <label>Repository</label>
              <select
                value={repo ? `${owner}/${repo}` : ""}
                onChange={(e) => onRepoSelect(e.target.value)}
              >
                <option value="">Select a repository…</option>
                {repos.map((r) => {
                  const full = r.full_name || `${r.owner?.login ?? ""}/${r.name}`;
                  return (
                    <option key={r.id} value={full}>
                      {full}
                    </option>
                  );
                })}
              </select>
              {reposLoading && <div className="muted" style={{ marginTop: 6 }}>Loading repositories…</div>}
              {reposErr && <div className="muted" style={{ marginTop: 6, color: "var(--fg)" }}>{reposErr}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <button className="btn" onClick={onSummarizeRepo} disabled={!owner || !repo || summaryLoading}>
                Summarize repo PRs
              </button>
              <button className="btn" onClick={onLoadOwnerOpen} disabled={!owner || ownerScopeLoading}>
                List owner's open PRs
              </button>
              <button className="btn" onClick={onSummarizeOwnerOpen} disabled={!owner || summaryLoading}>
                Summarize owner's open PRs
              </button>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 12 }}>
          {loading && <div className="card">Loading pull requests…</div>}
          {err && (
            <div className="card" style={{ border: "1px solid #e11d48", background: "rgba(225,29,72,.06)" }}>
              {err}
            </div>
          )}
        </section>

        {(summaryLoading || summary || summaryErr) && (
          <section style={{ marginTop: 16 }}>
            <div className="card ai-summary" style={{ padding: 16 }}>
              <h3 className="ai-title"><span className="ai-chip">AI</span> PR Summary</h3>
              {summaryLoading && (
                <div className="skeleton-lines">
                  <div className="skeleton-line lg" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line w-70" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line w-50" />
                </div>
              )}
              {summaryErr && <div style={{ color: "var(--fg)" }}>{summaryErr}</div>}
              {summary && !summaryLoading && (
                <div className="ai-body">
                  <div className="ai-stream" data-animated="true">
                    {summary
                      .trim()
                      .split(/\n{2,}/)
                      .map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Repo PRs list */}
        <section style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gap: 10 }}>
            {prs?.map((pr) => {
              const author = pr.user?.login || "unknown";
              const labels = (pr.labels || []).map((l) => l.name).filter(Boolean).join(", ");
              return (
                <article key={pr.number} className="card hover commit-card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <a href={pr.html_url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--fg)", textDecoration: "none" }}>
                      #{pr.number} {pr.title}
                    </a>
                    {labels && <span className="muted">[{labels}]</span>}
                  </div>
                  <div className="meta" style={{ display: "flex", flexWrap: "wrap", gap: 10, color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
                    <span>👤 {author}</span>
                    {pr.state && <span>• {pr.state}</span>}
                  </div>
                </article>
              );
            })}
            {!loading && prs && prs.length === 0 && <div className="card">No open PRs found.</div>}
          </div>
        </section>

        {/* Owner-scope PRs list */}
        {(ownerScopeLoading || ownerScope || ownerScopeErr) && (
          <section style={{ marginTop: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ margin: 0 }}>Owner's Open PRs</h3>
              {ownerScopeLoading && <div style={{ marginTop: 8 }}>Loading…</div>}
              {ownerScopeErr && <div style={{ marginTop: 8, color: "var(--fg)" }}>{ownerScopeErr}</div>}
              {ownerScope && (
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {ownerScope.repositories.map((r) => (
                    <div key={r.repo} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600 }}>{owner}/{r.repo} • {r.openPRs} open</div>
                      <ul style={{ margin: "8px 0 0 16px" }}>
                        {r.prs.map((p) => (
                          <li key={p.number} style={{ margin: "4px 0" }}>
                            <a href={p.html_url} target="_blank" rel="noreferrer" style={{ color: "var(--fg)", textDecoration: "none" }}>
                              #{p.number} {p.title}
                            </a>
                            {p.author && <span className="muted"> by {p.author}</span>}
                            {p.labels?.length ? <span className="muted"> [{p.labels.join(", ")}]</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {ownerScope.repositories.length === 0 && <div>No open PRs across repositories.</div>}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}