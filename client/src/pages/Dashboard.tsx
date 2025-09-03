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
    setTheme(saved);
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
              AI‑powered GitHub insights for Pull Requests, Issues, and Commits—instantly.
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

      {/* Features */}
      <section id="features" className="section">
        <div className="container">
          <h2 className="section-title">What you get</h2>
          <div className="grid">
            <FeatureCard
              title="PR Summaries"
              desc="Understand PR purpose, scope, and risks at a glance across repos."
            />
            <FeatureCard
              title="Issue Insights"
              desc="Spot themes, blockers, and suggested next steps automatically."
            />
            <FeatureCard
              title="Commit Digests"
              desc="Concise daily summaries of changes and areas impacted."
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
            <li><span className="step-no">2</span> We fetch PRs, Issues, and Commits (with your permission).</li>
            <li><span className="step-no">3</span> Our AI summarizes and surfaces what matters.</li>
          </ol>
        </div>
      </section>

      {/* AI Preview */}
      <section id="ai" className="section">
        <div className="container">
          <h2 className="section-title">AI preview</h2>
          <div className="preview">
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

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card hover">
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

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