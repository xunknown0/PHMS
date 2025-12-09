const userSockets = new Map(); // userId -> { socketId, userAgent }

function initialize(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("registerUser", ({ userId, userAgent }) => {
      if (!userId) return;

      const existing = userSockets.get(userId);

      if (existing && existing.socketId !== socket.id) {
        // Notify old socket to logout
        io.to(existing.socketId).emit("forceLogout", "You have been logged in from another device.");

        // Disconnect old socket
        io.sockets.sockets.get(existing.socketId)?.disconnect(true);
      }

      // Store new socket with browser info
      userSockets.set(userId, { socketId: socket.id, userAgent });
    });

    socket.on("disconnect", () => {
      for (const [userId, info] of userSockets.entries()) {
        if (info.socketId === socket.id) userSockets.delete(userId);
      }
    });
  });
}

module.exports = {
  initialize,
  userSockets
};
