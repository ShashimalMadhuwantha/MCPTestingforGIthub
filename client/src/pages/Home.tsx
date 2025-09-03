import { useEffect, useRef, useState } from "react";
import { getRepos, type ReposResponse } from "../api/repo";
import NavBar from "../components/NavBar";
import "../styles/home.css";

const PROJECT_NAME = "GitGlimpse";

export default function Home() {
  // Filters and data
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [minStars, setMinStars] = useState<number | "">("");
  const [sort, setSort] = useState<"pushed" | "updated" | "created" | "full_name">("pushed");
  const [direction, setDirection] = useState<"desc" | "asc">("desc");
  const [includeSummary, setIncludeSummary] = useState(false);

  const [data, setData] = useState<ReposResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Summary cooldown when quota is exhausted
  const [summaryCooldownUntil, setSummaryCooldownUntil] = useState<number | null>(null);
  const inSummaryCooldown = summaryCooldownUntil ? Date.now() < summaryCooldownUntil : false;
  const cooldownRemaining = inSummaryCooldown ? Math.max(0, summaryCooldownUntil! - Date.now()) : 0;

  // Request control (debounce + abort + stale response guard)
  const reqIdRef = useRef(0);

  useEffect(() => {
    document.title = PROJECT_NAME;
  }, []);

  useEffect(() => {
    const id = ++reqIdRef.current;
    const ac = new AbortController();
    const debounce = window.setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await getRepos(
          {
            page,
            per_page: perPage,
            q: q || undefined,
            language: language || undefined,
            min_stars: minStars === "" ? undefined : Number(minStars),
            sort,
            direction,
            summary: includeSummary && !inSummaryCooldown,
          },
          { signal: ac.signal }
        );
        if (reqIdRef.current !== id) return;
        setData(resp);
      } catch (e: any) {
        const aborted =
          ac.signal.aborted ||
          e?.name === "AbortError" ||
          e?.code === 20 ||
          /aborted|The user aborted a request|signal was aborted/i.test(String(e?.message || ""));
        if (aborted || reqIdRef.current !== id) return;

        const status = Number(e?.status) || (String(e?.message || "").includes("429") ? 429 : undefined);
        const quotaExhausted =
          status === 429 &&
          /RESOURCE_EXHAUSTED|quota|plan|billing/i.test(String(e?.message || ""));

        if (quotaExhausted) {
          const until = Date.now() + 10 * 60 * 1000;
          setSummaryCooldownUntil(until);
          if (includeSummary) setIncludeSummary(false);
          setErr("AI summary quota exceeded. Showing repositories without summary.");
          return;
        }

        setErr(e?.message || "Failed to load repositories");
      } finally {
        if (reqIdRef.current === id) setLoading(false);
      }
    }, includeSummary ? 400 : 250);

    return () => {
      ac.abort();
      clearTimeout(debounce);
    };
  }, [page, perPage, q, language, minStars, sort, direction, includeSummary, inSummaryCooldown]);

  const onPrev = () => {
    if (!data?.pageInfo?.prev?.page && page > 1) setPage((p) => Math.max(1, p - 1));
    else if (data?.pageInfo?.prev?.page) setPage(data.pageInfo.prev.page!);
  };
  const onNext = () => {
    if (!data?.pageInfo?.next?.page) setPage((p) => p + 1);
    else if (data?.pageInfo?.next?.page) setPage(data.pageInfo.next.page!);
  };

  const formatMs = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  return (
    <>
      <NavBar projectName={PROJECT_NAME} active="repositories" showConnected />

      <div style={{ maxWidth: 980, margin: "24px auto", padding: "0 20px" }}>
        <h1>Welcome to {PROJECT_NAME}</h1>
        <p className="muted">You’re connected. Below are your repositories.</p>

        {/* Filters */}
        <section style={{ marginTop: 16 }}>
          <div className="filter-grid">
            <div>
              <label>Search</label>
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="name, full_name, description"
              />
            </div>
            <div>
              <label>Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => {
                  setPage(1);
                  setLanguage(e.target.value);
                }}
                placeholder="e.g. TypeScript"
              />
            </div>
            <div>
              <label>Min stars</label>
              <input
                type="number"
                inputMode="numeric"
                value={minStars}
                onChange={(e) => {
                  setPage(1);
                  const v = e.target.value;
                  setMinStars(v === "" ? "" : Number(v));
                }}
                placeholder="0"
              />
            </div>
            <div>
              <label>Sort</label>
              <select
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value as any);
                }}
              >
                <option value="pushed">pushed</option>
                <option value="updated">updated</option>
                <option value="created">created</option>
                <option value="full_name">full_name</option>
              </select>
            </div>
            <div>
              <label>Direction</label>
              <select
                value={direction}
                onChange={(e) => {
                  setPage(1);
                  setDirection(e.target.value as any);
                }}
              >
                <option value="desc">desc</option>
                <option value="asc">asc</option>
              </select>
            </div>
            <div>
              <label>Per page</label>
              <select
                value={perPage}
                onChange={(e) => {
                  setPage(1);
                  setPerPage(Number(e.target.value));
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={includeSummary && !inSummaryCooldown}
                  disabled={inSummaryCooldown}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  title={inSummaryCooldown ? `AI summary paused (${formatMs(cooldownRemaining)} left)` : "Generate AI summary"}
                />
                Include AI summary (top 50)
              </label>
              <span className="muted">
                Page {data?.page ?? page} • {data?.count ?? 0} items
              </span>
              <div className="pager" style={{ marginLeft: "auto" }}>
                <button className="btn" onClick={() => { setPage(1); }} disabled={loading}>
                  Refresh
                </button>
                <button className="btn" onClick={onPrev} disabled={loading || (page <= 1 && !data?.pageInfo?.prev)}>
                  ← Prev
                </button>
                <button className="btn" onClick={onNext} disabled={loading}>
                  Next →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Status */}
        <section style={{ marginTop: 12 }}>
          {inSummaryCooldown && (
            <div className="card" style={{ padding: 12 }}>
              AI summary temporarily unavailable (provider quota). Try again in {formatMs(cooldownRemaining)}.
            </div>
          )}
          {loading && <div className="card">Loading repositories…</div>}
          {err && (
            <div className="card" style={{ border: "1px solid #e11d48", background: "rgba(225,29,72,.06)" }}>
              {err}
            </div>
          )}
        </section>

        {/* Summary */}
        {includeSummary && !data?.summary && loading && (
          <section style={{ marginTop: 16 }}>
            <div className="card ai-summary" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>AI Summary</h3>
              <div className="skeleton-lines">
                <div className="skeleton-line lg" />
                <div className="skeleton-line" />
                <div className="skeleton-line w-70" />
                <div className="skeleton-line" />
                <div className="skeleton-line w-50" />
              </div>
            </div>
          </section>
        )}
        {data?.summary && (
          <section style={{ marginTop: 16 }}>
            <div className="card ai-summary" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>AI Summary</h3>
              <div className="ai-body">
                <div className="ai-stream" data-animated="true">
                  {data.summary
                    .trim()
                    .split(/\n{2,}/)
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* List */}
        <section style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gap: 10 }}>
            {data?.items?.map((r) => (
              <article key={r.id} className="card hover" style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <a href={r.html_url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--fg)", textDecoration: "none" }}>
                    {r.full_name}
                  </a>
                  {r.private && (
                    <span style={{ fontSize: 12, color: "var(--muted)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 6 }}>
                      private
                    </span>
                  )}
                  {r.archived && (
                    <span style={{ fontSize: 12, color: "var(--muted)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 6 }}>
                      archived
                    </span>
                  )}
                </div>
                {r.description && (
                  <p style={{ margin: "6px 0 8px", color: "var(--muted)" }}>{r.description}</p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, color: "var(--muted)", fontSize: 13 }}>
                  {r.language && <span>🧠 {r.language}</span>}
                  <span>★ {r.stargazers_count}</span>
                  <span>⑂ {r.forks_count}</span>
                  <span>● issues {r.open_issues_count}</span>
                  <span>⏱ pushed {new Date(r.pushed_at).toLocaleString()}</span>
                </div>
              </article>
            ))}
            {!loading && data && data.items.length === 0 && (
              <div className="card">No repositories match the filters.</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}