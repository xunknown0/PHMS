const { userSockets } = require("../services/socketService");

function getUserBrowser(userId) {
  const info = userSockets.get(userId);
  return info ? info.userAgent : null;
}

module.exports = { getUserBrowser };
