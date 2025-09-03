const { getClient } = require("../config/githubClient");
const { summarizeText } = require("../services/aiService");

// List commits (existing)
exports.listCommits = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const client = getClient();
    const commits = await client.repos.listCommits({ owner, repo, per_page: 10 });
    res.json(commits.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// New: Summarize commits using Gemini
exports.summarizeCommits = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const client = getClient();
    const commits = await client.repos.listCommits({ owner, repo, per_page: 10 });

    const commitMessages = commits.data.map(c => c.commit.message).join("\n");
    const summary = await summarizeText(commitMessages);

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// New: Summarize commits for a specific date (UTC, YYYY-MM-DD)
// ...existing code...
// ...existing code...
exports.summarizeCommitsByDate = async (req, res) => {
  try {
    const { owner, repo, date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }

    const since = new Date(`${date}T00:00:00Z`);
    const until = new Date(`${date}T23:59:59Z`);
    if (isNaN(since) || isNaN(until)) {
      return res.status(400).json({ error: "Invalid date." });
    }

    const client = getClient();

    let allCommits = [];
    let page = 1;
    while (true) {
      const { data } = await client.repos.listCommits({
        owner,
        repo,
        since: since.toISOString(),
        until: until.toISOString(),
        per_page: 100,
        page
      });
      if (!data || data.length === 0) break;
      allCommits = allCommits.concat(data);
      if (data.length < 100) break;
      page += 1;
    }

    if (allCommits.length === 0) {
      return res.json({ date, commits: 0, authors: [], summary: "No commits found for this date." });
    }

    // Deduplicate authors: prefer GitHub login, then email, then normalized name
    const normalizeName = (s) =>
      (s || "")
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ");

    const authorsMap = new Map(); // key -> { login, name, email }

    for (const c of allCommits) {
      const login =
        c.author?.login ||
        c.committer?.login ||
        null;
      const name =
        c.commit?.author?.name ||
        c.commit?.committer?.name ||
        null;
      const emailRaw =
        c.commit?.author?.email ||
        c.commit?.committer?.email ||
        null;
      const email = emailRaw ? String(emailRaw).toLowerCase() : null;

      const key =
        (login && `login:${login.toLowerCase()}`) ||
        (email && `email:${email}`) ||
        (name && `name:${normalizeName(name)}`);

      if (!key) continue;

      if (!authorsMap.has(key)) {
        authorsMap.set(key, { login: login || null, name: name || null, email });
      } else {
        const existing = authorsMap.get(key);
        if (!existing.login && login) existing.login = login;
        if (!existing.name && name) existing.name = name;
        if (!existing.email && email) existing.email = email;
      }
    }

    const authorsDetailed = Array.from(authorsMap.values());
    const authors = authorsDetailed
      .map(a => a.login || a.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const commitMessages = allCommits.map(c => c.commit?.message || "").join("\n");

    const authorsForPrompt = authorsDetailed
      .map(a => (a.login && a.name ? `${a.login} (${a.name})` : a.login || a.name))
      .join(", ");

    const prompt = `Summarize the following GitHub commit messages for ${owner}/${repo} on ${date} (UTC).
Mention these commit authors (do not invent names): ${authorsForPrompt}.

${commitMessages}`;

    const summary = await summarizeText(prompt);

    res.json({
      date,
      repo: `${owner}/${repo}`,
      commits: allCommits.length,
      authors,          // unique, human-friendly list (prefers login)
      authorsDetailed,  // structured list if you need it
      summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ...existing code...
exports.listCommitsByDate = async (req, res) => {
  try {
    const { owner, repo, date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }

    const since = new Date(`${date}T00:00:00Z`);
    const until = new Date(`${date}T23:59:59Z`);
    if (isNaN(since) || isNaN(until)) {
      return res.status(400).json({ error: "Invalid date." });
    }

    const client = getClient();
    let allCommits = [];
    let page = 1;

    while (true) {
      const { data } = await client.repos.listCommits({
        owner,
        repo,
        since: since.toISOString(),
        until: until.toISOString(),
        per_page: 100,
        page,
      });
      if (!data || data.length === 0) break;
      allCommits = allCommits.concat(data);
      if (data.length < 100) break;
      page += 1;
    }

    return res.json(allCommits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ...existing code...
// ...existing code...