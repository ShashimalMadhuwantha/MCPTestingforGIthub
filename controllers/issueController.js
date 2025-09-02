const { getClient } = require("../config/githubClient");

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
