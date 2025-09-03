import { useEffect, useState } from "react";

type ActiveKey = "repositories" | "issues" | "prs" | "commits";

export default function NavBar({
  projectName,
  active,
  showConnected = false,
  connectUrl,
}: {
  projectName: string;
  active: ActiveKey;
  showConnected?: boolean;
  connectUrl?: string;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Theme boot + persist
  useEffect(() => {
    const saved =
      (localStorage.getItem("theme") as "light" | "dark" | null) ||
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <header className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-inner">
        <a className="brand" href="/home" aria-label="Home">
          <span className="brand-logo"><GitHubMark /></span>
          <span className="brand-name">{projectName}</span>
        </a>

        <nav
          className={`nav-links ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(false)}
          aria-label="Primary"
        >
          <a href="/home" className={active === "repositories" ? "active" : undefined} aria-current={active === "repositories" ? "page" : undefined}>
            Repositories
          </a>
          <a href="/issues" className={active === "issues" ? "active" : undefined}>
            Issues
          </a>
          <a href="/prs" className={active === "prs" ? "active" : undefined}>
            Pull Requests
          </a>
          <a href="/commits" className={active === "commits" ? "active" : undefined}>
            Commits
          </a>
        </nav>

        <div className="nav-actions">
          <button
            className="icon-btn nav-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          {showConnected ? (
            <span className="status-pill connected" title="Connected to GitHub">
              <span className="dot" /> Connected
            </span>
          ) : connectUrl ? (
            <a className="btn primary" href={connectUrl}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <GitHubMark size={18} /> Connect with GitHub
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </header>
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