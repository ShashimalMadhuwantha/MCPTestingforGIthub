import { useEffect, useRef, useState } from "react";
import NavBar from "../components/NavBar";
import "../styles/commits.css";
import {
  fetchCommits,
  fetchCommitsByDate,
  fetchCommitSummary,
  fetchCommitSummaryByDate,
  type CommitListItem,
} from "../api/commits";
import { getRepos, type Repo } from "../api/repo";
import { getMe } from "../api/user";

const PROJECT_NAME = "GitGlimpse";

export default function Commits() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [commits, setCommits] = useState<CommitListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [date, setDate] = useState("");

  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposErr, setReposErr] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  useEffect(() => {
    document.title = `${PROJECT_NAME} • Commits`;
  }, []);

  // Fetch connected user and repos once
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        // Get current user and set owner textbox automatically
        const me = await getMe({ signal: ac.signal });
        if (me?.login && !owner) setOwner(me.login);
      } catch (e: any) {
        // owner can still be set manually; ignore if /auth/me not available
        console.debug("getMe failed:", e?.message || e);
      }

      // Fetch all repos (paginate until no next)
      setReposLoading(true);
      setReposErr(null);
      try {
        const all: Repo[] = [];
        let page = 1;
        const per_page = 100;
        // Safety cap to avoid infinite loops
        for (let i = 0; i < 20; i++) {
          const resp = await getRepos({ page, per_page }, { signal: ac.signal });
          all.push(...(resp.items || []));
          const next = resp.pageInfo?.next;
          if (!next) break;
          page = next.page ?? page + 1;
        }
        setRepos(all);
        // If repo not set yet, try to default to the first repo
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
    // intentionally not depending on owner/repo to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load latest commits when owner/repo change
  useEffect(() => {
    if (!owner || !repo) {
      setCommits(null);
      setErr(null);
      return;
    }
    const id = ++reqIdRef.current;
    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await fetchCommits(owner, repo, { signal: ac.signal });
        if (reqIdRef.current !== id) return;
        setCommits(data);
      } catch (e: any) {
        const aborted =
          ac.signal.aborted ||
          e?.name === "AbortError" ||
          e?.code === 20 ||
          /aborted|The user aborted a request|signal was aborted/i.test(String(e?.message || ""));
        if (aborted || reqIdRef.current !== id) return;
        setErr(e?.message || "Failed to load commits");
      } finally {
        if (reqIdRef.current === id) setLoading(false);
      }
    }, 250);
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [owner, repo]);

  const onLoadCommits = async () => {
    if (!owner || !repo) return;
    const id = ++reqIdRef.current;
    setLoading(true);
    setErr(null);
    try {
      const data = date
        ? await fetchCommitsByDate(owner, repo, date)
        : await fetchCommits(owner, repo);
      if (reqIdRef.current !== id) return;
      setCommits(data);
    } catch (e: any) {
      if (reqIdRef.current === id) {
        setErr(e?.message || "Failed to load commits");
      }
    } finally {
      if (reqIdRef.current === id) setLoading(false);
    }
  };

  const onSummarizeLatest = async () => {
    if (!owner || !repo) return;
    setSummary(null);
    setSummaryErr(null);
    setSummaryLoading(true);
    try {
      const { summary } = await fetchCommitSummary(owner, repo);
      setSummary(summary);
    } catch (e: any) {
      setSummaryErr(e?.message || "Failed to get summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const onSummarizeByDate = async () => {
    if (!owner || !repo || !date) return;
    setSummary(null);
    setSummaryErr(null);
    setSummaryLoading(true);
    try {
      const { summary } = await fetchCommitSummaryByDate(owner, repo, date);
      setSummary(summary);
    } catch (e: any) {
      setSummaryErr(e?.message || "Failed to get summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const shortSha = (sha: string) => sha.slice(0, 7);
  const firstLine = (msg: string) => (msg || "").split("\n")[0];

  const onRepoSelect = (value: string) => {
    if (!value) {
      setRepo("");
      return;
    }
    // value is full_name "owner/name"
    const [o, r] = value.split("/");
    if (o && r) {
      setOwner((prev) => (prev ? prev : o)); // keep manual override if already set
      setRepo(r);
    }
  };

  return (
    <>
      <NavBar projectName={PROJECT_NAME} active="commits" showConnected />

      <div style={{ maxWidth: 980, margin: "24px auto", padding: "0 20px" }}>
        <h1>Commits</h1>
        <p className="muted">View recent commits and get AI summaries.</p>

        {/* Filters */}
        <section style={{ marginTop: 16 }}>
          <div className="filter-grid">
            <div>
              <label>Owner</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="GitHub username"
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
            <div>
              <label>Date (UTC)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <button
                className="btn primary"
                onClick={onLoadCommits}
                disabled={!owner || !repo || loading}
              >
                Load commits
              </button>
              <button
                className="btn"
                onClick={onSummarizeLatest}
                disabled={!owner || !repo || summaryLoading}
              >
                Summarize latest 10
              </button>
              <button
                className="btn"
                onClick={onSummarizeByDate}
                disabled={!owner || !repo || !date || summaryLoading}
              >
                Summarize by date
              </button>
            </div>
          </div>
        </section>

        {/* Status */}
        <section style={{ marginTop: 12 }}>
          {loading && <div className="card">Loading commits…</div>}
          {err && (
            <div
              className="card"
              style={{ border: "1px solid #e11d48", background: "rgba(225,29,72,.06)" }}
            >
              {err}
            </div>
          )}
        </section>

        {/* Summary */}
        {(summaryLoading || summary || summaryErr) && (
          <section style={{ marginTop: 16 }}>
            <div className="card ai-summary" style={{ padding: 16 }}>
              <h3 className="ai-title">
                <span className="ai-chip">AI</span> Commit Summary
              </h3>
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

        {/* List */}
        <section style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gap: 10 }}>
            {commits?.map((c) => {
              const author = c.author?.login || c.commit?.author?.name || "unknown";
              const when = c.commit?.author?.date
                ? new Date(c.commit.author.date).toLocaleString()
                : "";
              return (
                <article key={c.sha} className="card hover commit-card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontWeight: 700, color: "var(--fg)", textDecoration: "none" }}
                    >
                      {firstLine(c.commit?.message || "")}
                    </a>
                    <span className="muted">({shortSha(c.sha)})</span>
                  </div>
                  <div
                    className="meta"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      color: "var(--muted)",
                      fontSize: 13,
                      marginTop: 6,
                    }}
                  >
                    <span>👤 {author}</span>
                    {when && <span>⏱ {when}</span>}
                  </div>
                </article>
              );
            })}
            {!loading && commits && commits.length === 0 && (
              <div className="card">No commits found.</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}