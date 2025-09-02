const { getClient } = require("../config/githubClient");

exports.listCommits = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const client = getClient();
    const commits = await client.repos.listCommits({ owner, repo });
    res.json(commits.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
