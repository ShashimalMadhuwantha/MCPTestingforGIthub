const { Octokit } = require("@octokit/rest");
let octokit = null;

exports.setToken = (token) => {
  octokit = new Octokit({ auth: token });
};

exports.getClient = () => {
  if (!octokit) throw new Error("GitHub client not initialized!");
  return octokit;
};
