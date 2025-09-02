const { getClient } = require("../config/githubClient");
const { summarizeText } = require("../services/aiService");

// ...existing code...
exports.listPRs = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const client = getClient();
    const prs = await client.pulls.list({ owner, repo, state: "open" });
    res.json(prs.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper: list all open PRs for a repo (with pagination)
async function listOpenPRsForRepo(client, owner, repo) {
  let all = [];
  let page = 1;
  while (true) {
    const { data } = await client.pulls.list({
      owner,
      repo,
      state: "open",
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

// Helper: get all repos for an owner (org or user)
async function getReposForOwner(client, owner) {
  // Try org first
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
    if (all.length > 0) return all;
  } catch (_) {}
  // Fallback to user
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

// AI summary for a specific repo's open PRs
exports.summarizeRepoPRs = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const client = getClient();

    const prs = await listOpenPRsForRepo(client, owner, repo);
    if (!prs.length) {
      return res.json({ repo: `${owner}/${repo}`, openPRs: 0, summary: "No open pull requests." });
    }

    const lines = prs.map(pr => {
      const author = pr.user?.login || "unknown";
      const labels = (pr.labels || []).map(l => l.name).join(", ");
      const title = pr.title || "";
      const number = pr.number;
      const body = (pr.body || "").slice(0, 1000); // avoid very long bodies
      return `#${number} by ${author}${labels ? ` [${labels}]` : ""}: ${title}\n${body}`;
    });

    const prompt = `Summarize the currently open pull requests for ${owner}/${repo}. 
Focus on purpose, scope, potential impact, and any risks or blockers. Provide a concise executive summary:

${lines.join("\n\n")}`;

    const summary = await summarizeText(prompt);

    const authors = Array.from(new Set(prs.map(pr => pr.user?.login).filter(Boolean))).sort();

    res.json({
      repo: `${owner}/${repo}`,
      openPRs: prs.length,
      authors,
      summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List open PRs across all repos for an owner (org or user)
exports.listOpenPRsForOwner = async (req, res) => {
  try {
    const { owner } = req.params;
    const client = getClient();

    const repos = await getReposForOwner(client, owner);
    const results = [];
    let totalOpenPRs = 0;

    for (const r of repos) {
      const prs = await listOpenPRsForRepo(client, owner, r.name);
      if (prs.length) {
        totalOpenPRs += prs.length;
        results.push({
          repo: r.name,
          openPRs: prs.length,
          prs: prs.map(pr => ({
            number: pr.number,
            title: pr.title,
            author: pr.user?.login || null,
            labels: (pr.labels || []).map(l => l.name),
            html_url: pr.html_url,
          })),
        });
      }
    }

    res.json({ owner, repositories: results, totalOpenPRs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// AI summary of open PRs across all repos for an owner
exports.summarizeOpenPRsForOwner = async (req, res) => {
  try {
    const { owner } = req.params;
    const client = getClient();

    const repos = await getReposForOwner(client, owner);

    const repoSummaries = [];
    const lines = [];
    const authorsSet = new Set();
    let totalPRs = 0;
    let reposWithPRs = 0;

    for (const r of repos) {
      const prs = await listOpenPRsForRepo(client, owner, r.name);
      if (!prs.length) continue;
      reposWithPRs += 1;
      totalPRs += prs.length;

      authorsSetForRepo = new Set();
      const repoLines = prs.map(pr => {
        const author = pr.user?.login || "unknown";
        authorsSet.add(author);
        authorsSetForRepo.add(author);
        const labels = (pr.labels || []).map(l => l.name).join(", ");
        const title = pr.title || "";
        const number = pr.number;
        const body = (pr.body || "").slice(0, 600);
        return `[${r.name}] #${number} by ${author}${labels ? ` [${labels}]` : ""}: ${title}\n${body}`;
      });

      lines.push(...repoLines);
      repoSummaries.push({ repo: r.name, openPRs: prs.length, authors: Array.from(authorsSetForRepo).sort() });
    }

    if (totalPRs === 0) {
      return res.json({ owner, openPRs: 0, summary: "No open pull requests across repositories." });
    }

    // If extremely large, cap the input size
    const capped = lines.slice(0, 200).join("\n\n");

    const prompt = `Summarize open pull requests across all repositories for owner "${owner}".
Group insights by repository when relevant. Highlight themes, risk, and priority items.
Total repos with PRs: ${reposWithPRs}, total open PRs: ${totalPRs}.

${capped}`;

    const summary = await summarizeText(prompt);

    res.json({
      owner,
      repositories: repoSummaries,
      totalOpenPRs: totalPRs,
      authors: Array.from(authorsSet).sort(),
      summary,
      note: lines.length > 200 ? "Summarized first 200 PR entries due to size limits." : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};