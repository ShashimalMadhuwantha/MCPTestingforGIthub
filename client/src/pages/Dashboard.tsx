import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const PROJECT_NAME = "GitGlimpse";

export default function Dashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // Redirect to /home after OAuth callback (supports ?auth=... or ?code=...)
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("auth") || qs.get("code")) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    document.title = PROJECT_NAME;
    const saved =
      (localStorage.getItem("theme") as "light" | "dark" | null) ||
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(saved || "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const toggleMenu = () => setMenuOpen((v) => !v);

  const connectGitHub = () => {
    window.location.href = `${BASE_URL}/auth`;
  };

  return (
    <div>
      {/* Nav */}
      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="container nav-inner">
          <a className="brand" href="#home" aria-label="Home">
            <span className="brand-logo"><GitHubMark /></span>
            <span className="brand-name">{PROJECT_NAME}</span>
          </a>
          <nav
            className={`nav-links ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(false)}
            aria-label="Primary"
          >
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#ai">AI</a>
          </nav>

          <div className="nav-actions">
            <button
              className="icon-btn nav-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              ☰
            </button>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <button className="btn primary" onClick={connectGitHub}>
              <span className="gh-badge">
                <GitHubMark size={18} />
              </span>
              Connect with GitHub
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="hero">
        <div className="container hero-inner">
          <div className="hero-content">
            <h1>
              Stay on top of your code with
              <span className="gradient-text"> {PROJECT_NAME}</span>
            </h1>
            <p className="sub">
              AI‑powered insights for Pull Requests, Issues, and Commits—diff‑aware summaries,
              risks, and next steps, across repos and owners.
            </p>
            <div className="cta">
              <button className="btn primary lg" onClick={connectGitHub}>
                <span className="gh-badge">
                  <GitHubMark size={18} />
                </span>
                Connect with GitHub
              </button>
              <a className="btn ghost lg" href="#features">Explore features</a>
            </div>

            {/* Stats strip */}
            <div className="stats">
              <div className="stat">
                <div className="stat-k">1,248</div>
                <div className="stat-l">Summaries generated</div>
              </div>
              <div className="stat">
                <div className="stat-k">312</div>
                <div className="stat-l">Repositories synced</div>
              </div>
              <div className="stat">
                <div className="stat-k">~3s</div>
                <div className="stat-l">Avg summary time</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="orbit">
              <div className="orb orb1"><GitHubMark /></div>
              <div className="orb orb2"><GitHubMark /></div>
              <div className="orb orb3"><GitHubMark /></div>
              <div className="glow" />
            </div>
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section id="features" className="section">
        <div className="container">
          <h2 className="section-title">What we offer</h2>

 
          <div className="grid feature-grid">
            <FeatureCard
              icon={<PRIcon />}
              title="PR Summaries"
              desc="Understand intent and impact of changes—before opening the diff."
              badges={["Diff-aware", "Risk hotspots", "Review-ready"]}
              points={[
                "Purpose, scope, and affected areas per PR",
                "Highlights of potential breaking changes and risks",
                "Auto-generated review checklist to speed approvals",
                "Cross‑repo mentions and linked issues surfaced",
              ]}
              tone="blue"
            />
            <FeatureCard
              icon={<IssueIcon />}
              title="Issue Insights"
              desc="Make triage effortless with context and actionable next steps."
              badges={["Themes", "Duplicates", "Next steps"]}
              points={[
                "Thematic clustering: see trending topics and blockers",
                "Duplicate detection hints for quicker deduping",
                "Suggested next steps based on labels and history",
                "Owner‑wide open issues rollups and summaries",
              ]}
              tone="violet"
            />
            <FeatureCard
              icon={<CommitIcon />}
              title="Commit Digests"
              desc="Digest daily activity by area, author, and impact."
              badges={["Daily", "Release‑ready", "People-aware"]}
              points={[
                "Daily grouped digests with impacted files and modules",
                "Author highlights and activity distribution",
                "Release‑notes‑ready one‑pager summaries",
                "Date‑scoped summaries for sprint or deploy windows",
              ]}
              tone="amber"
            />
            <FeatureCard
              icon={<ExploreIcon />}
              title="Repository Explorer"
              desc="Filter, explore, and compare across your GitHub footprint."
              badges={["Owner‑wide", "Filters", "Saved views"]}
              points={[
                "Owner‑wide rollups with per‑repo open issues",
                "Language, stars, and label filters for fast discovery",
                "Consistent card design with attribute chips",
                "Launch into PRs, Issues, and Commits in one click",
              ]}
              tone="cyan"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section alt">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <ol className="steps">
            <li><span className="step-no">1</span> Connect your GitHub account.</li>
            <li><span className="step-no">2</span> We fetch PRs, Issues, and Commits you can access.</li>
            <li><span className="step-no">3</span> Our AI summarizes and surfaces what matters.</li>
          </ol>
        </div>
      </section>

      {/* AI Preview */}
      <section id="ai" className="section">
        <div className="container">
          <h2 className="section-title">AI preview</h2>
          <div className="preview ai-preview">
            <div className="preview-header">
              <GitHubMark size={18} />
              <span>AI Summary</span>
            </div>
            <p>
              3 PRs need review in core-api. 2 issues labeled “bug” show recurring auth failures.
              Consider prioritizing rate-limit middleware refactor. Deploy window: green.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-block">
        <div className="container center">
          <h2>Ready to get started?</h2>
          <p>Connect your GitHub and see summaries in seconds with {PROJECT_NAME}.</p>
          <button className="btn primary lg" onClick={connectGitHub}>
            <span className="gh-badge">
              <GitHubMark size={18} />
            </span>
            Connect with GitHub
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} {PROJECT_NAME}</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
function FeatureCard({
  icon,
  title,
  desc,
  badges = [],
  points = [],
  tone = "blue",
}: {
  icon?: React.ReactNode;
  title: string;
  desc: string;
  badges?: string[];
  points?: string[];
  tone?: "blue" | "violet" | "amber" | "cyan";
}) {
  return (
    <div className="card hover feature-card feature-hero" data-tone={tone}>
      <div className="feature-hero-head">
        <div className="feature-icon">{icon}</div>
        <div className="feature-head-text">
          <h3 className="feature-title">{title}</h3>
          <p className="feature-desc">{desc}</p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="badges">
          {badges.map((b) => (
            <span key={b} className="badge">{b}</span>
          ))}
        </div>
      )}

      {points.length > 0 && (
        <ul className="check-list">
          {points.map((p, i) => (
            <li key={i}><span className="check">✓</span>{p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
// ...existing code...

function GitHubMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg" fill="currentColor"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38
      0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
      -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07
      -1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11
      0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82
      .44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.74.54 1.49
      0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

/* Simple inline icons to match feature cards */
function PRIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 3a2 2 0 0 0-2 2v8.28A2 2 0 1 0 7 15V9h6a3 3 0 0 1 3 3v1.28A2 2 0 1 0 18 15V12a5 5 0 0 0-5-5H7V5a2 2 0 0 0-2-2z"/>
    </svg>
  );
}
function IssueIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z"/><path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2z"/>
    </svg>
  );
}
function CommitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 12a5 5 0 0 1 10 0 5 5 0 0 1-10 0zm-5 1h4a7 7 0 0 0 12 0h4v-2h-4a7 7 0 0 0-12 0H2v2z"/>
    </svg>
  );
}
function ExploreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5zm0 7.18L5.09 6.5 12 3.82 18.91 6.5 12 9.18zM2 17l10 5 10-5v-7l-10 5-10-5v7z"/>
    </svg>
  );
}