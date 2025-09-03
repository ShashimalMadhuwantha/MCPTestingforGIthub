// ...existing code...
const { getClient } = require("../config/githubClient");
const { summarizeText } = require("../services/aiService");

// List issues for a repo (kept as-is)
exports.listIssues = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const client = getClient();
    const issues = await client.issues.listForRepo({ owner, repo });
    res.json(issues.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper: list issues (not PRs) for a repo with pagination
async function listIssuesForRepo(client, owner, repo, { state = "open", labels, since } = {}) {
  let all = [];
  let page = 1;
  while (true) {
    const { data } = await client.issues.listForRepo({
      owner,
      repo,
      state,                  // open | closed | all
      labels,                 // optional comma-separated labels
      since,                  // optional ISO string
      per_page: 100,
      page,
    });
    const onlyIssues = (data || []).filter((i) => !i.pull_request);
    if (!onlyIssues.length && (!data || !data.length)) break;
    all = all.concat(onlyIssues);
    if (!data || data.length < 100) break;
    page += 1;
  }
  return all;
}

// Helper: get all repos for an owner (org or user)
async function getReposForOwner(client, owner) {
  // Try organization
  try {
    let all = [];
    let page = 1;
    while (true) {
      const { data } = await client.repos.listForOrg({
        org: owner,
        type: "all",
        per_page: 100,
        page,
      });
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < 100) break;
      page += 1;
    }
    if (all.length) return all;
  } catch (_) {}
  // Fallback: user
  let all = [];
  let page = 1;
  while (true) {
    const { data } = await client.repos.listForUser({
      username: owner,
      per_page: 100,
      page,
    });
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 100) break;
    page += 1;
  }
  return all;
}

// AI summary for a specific repo's open issues
exports.summarizeRepoIssues = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const client = getClient();

    const issues = await listIssuesForRepo(client, owner, repo, { state: "open" });
    if (!issues.length) {
      return res.json({ repo: `${owner}/${repo}`, openIssues: 0, summary: "No open issues." });
    }

    const lines = issues.map((is) => {
      const author = is.user?.login || "unknown";
      const labels = (is.labels || []).map((l) => l.name).join(", ");
      const title = is.title || "";
      const number = is.number;
      const body = (is.body || "").slice(0, 800);
      const comments = is.comments || 0;
      return `#${number} by ${author}${labels ? ` [${labels}]` : ""} (comments:${comments}): ${title}\n${body}`;
    });

    const authors = Array.from(new Set(issues.map((i) => i.user?.login).filter(Boolean))).sort();

    const prompt = `Summarize the currently open issues for ${owner}/${repo}.
Highlight themes, severity, blockers, and suggested next steps. Be concise.

${lines.slice(0, 200).join("\n\n")}`;

    const summary = await summarizeText(prompt);

    res.json({
      repo: `${owner}/${repo}`,
      openIssues: issues.length,
      authors,
      summary,
      note: lines.length > 200 ? "Summarized first 200 issues due to size limits." : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List open issues across all repos for an owner
exports.listOpenIssuesForOwner = async (req, res) => {
  try {
    const { owner } = req.params;
    const client = getClient();

    const repos = await getReposForOwner(client, owner);
    const results = [];
    let totalOpenIssues = 0;

    for (const r of repos) {
      const issues = await listIssuesForRepo(client, owner, r.name, { state: "open" });
      if (issues.length) {
        totalOpenIssues += issues.length;
        results.push({
          repo: r.name,
          openIssues: issues.length,
          issues: issues.map((is) => ({
            number: is.number,
            title: is.title,
            author: is.user?.login || null,
            labels: (is.labels || []).map((l) => l.name),
            comments: is.comments || 0,
            html_url: is.html_url,
          })),
        });
      }
    }

    res.json({ owner, repositories: results, totalOpenIssues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// AI summary of open issues across all repos for an owner
exports.summarizeOpenIssuesForOwner = async (req, res) => {
  try {
    const { owner } = req.params;
    const client = getClient();

    const repos = await getReposForOwner(client, owner);

    const lines = [];
    const repoStats = [];
    const authors = new Set();
    let total = 0;
    let reposWithIssues = 0;

    for (const r of repos) {
      const issues = await listIssuesForRepo(client, owner, r.name, { state: "open" });
      if (!issues.length) continue;
      reposWithIssues += 1;
      total += issues.length;

      const repoLines = issues.map((is) => {
        const author = is.user?.login || "unknown";
        authors.add(author);
        const labels = (is.labels || []).map((l) => l.name).join(", ");
        const title = is.title || "";
        const number = is.number;
        const body = (is.body || "").slice(0, 600);
        return `[${r.name}] #${number} by ${author}${labels ? ` [${labels}]` : ""}: ${title}\n${body}`;
      });

      lines.push(...repoLines);
      repoStats.push({ repo: r.name, openIssues: issues.length });
    }

    if (total === 0) {
      return res.json({ owner, openIssues: 0, summary: "No open issues across repositories." });
    }

    const capped = lines.slice(0, 300).join("\n\n");
    const prompt = `Summarize open issues across all repositories for owner "${owner}".
Group by repo when useful. Call out critical problems, themes, and recommended next steps.
Repos with issues: ${reposWithIssues}, total open issues: ${total}.

${capped}`;

    const summary = await summarizeText(prompt);

    res.json({
      owner,
      repositories: repoStats,
      totalOpenIssues: total,
      authors: Array.from(authors).sort(),
      summary,
      note: lines.length > 300 ? "Summarized first 300 issues due to size limits." : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ...existing code...