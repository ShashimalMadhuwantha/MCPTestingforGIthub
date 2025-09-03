const axios = require("axios");
const { setToken } = require("../config/githubClient");
const tokenStore = require("../utils/tokenStore");

exports.login = (req, res) => {
  const redirectUri =
    process.env.REDIRECT_URI ||
    `${process.env.BACKEND_URL || "http://localhost:5000"}/auth/callback`;

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.CLIENT_ID);
  url.searchParams.set("scope", "repo");
  url.searchParams.set("redirect_uri", redirectUri);

  res.redirect(url.toString());
};

exports.callback = async (req, res) => {
  try {
    const code = req.query.code;
    const redirectUri =
      process.env.REDIRECT_URI ||
      `${process.env.BACKEND_URL || "http://localhost:5000"}/auth/callback`;

    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = response.data.access_token;
    setToken(accessToken);
    tokenStore.saveToken(accessToken);

    const target = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${target}?auth=success`);
  } catch (e) {
    const target = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${target}?auth=error`);
  }
};