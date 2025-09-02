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
