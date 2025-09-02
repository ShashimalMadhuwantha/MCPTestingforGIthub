let savedToken = null;

exports.saveToken = (token) => {
  savedToken = token;
};

exports.getToken = () => {
  if (!savedToken) throw new Error("No token found! Authenticate first.");
  return savedToken;
};
