const socketIo = require("socket.io");
const {
  handleCreateRoom,
  handleJoinRoom,
  handleDisconnect,
} = require("./gameHandlers");

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    console.log("Uses connected: ", socket.id);

    socket.on("createRoom", ({ gameType, playerName, playerId }) =>
      handleCreateRoom(socket, io, { gameType, playerName, playerId })
    );
    socket.on("joinRoom", ({ roomCode, playerName, playerId }) =>
      handleJoinRoom(socket, io, { roomCode, playerName, playerId })
    );
    socket.on("disconnect", () => handleDisconnect(socket, io));
  });

  return io;
}

module.exports = { initializeSocket };
