const { getClient } = require("../config/githubClient");

exports.getRepos = async (req, res) => {
  try {
    const client = getClient();
    const repos = await client.repos.listForAuthenticatedUser();
    res.json(repos.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
