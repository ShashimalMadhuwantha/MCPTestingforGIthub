const axios = require("axios");
const { setToken } = require("../config/githubClient");
const tokenStore = require("../utils/tokenStore");

exports.login = (req, res) => {
  const redirect = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&scope=repo`;
  res.redirect(redirect);
};

exports.callback = async (req, res) => {
  const code = req.query.code;

  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
    },
    { headers: { Accept: "application/json" } }
  );

  const accessToken = response.data.access_token;
  setToken(accessToken);
  tokenStore.saveToken(accessToken);

  res.send("✅ GitHub authentication successful! You can now access repositories.");
};
