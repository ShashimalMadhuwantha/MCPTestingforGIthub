const { getClient } = require("../config/githubClient");

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
