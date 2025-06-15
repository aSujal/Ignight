const socketIo = require("socket.io");
const {
  handleCreateRoom,
  handleJoinRoom,
  handleGameAction,
  handleDisconnect,
  handleChatMessage,
} = require("./gameHandlers");
const config = require("../config/config");

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: config.clientUrl || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected: ", socket.id);

    socket.on("createRoom", (data) => handleCreateRoom(socket, io, data));
    socket.on("joinRoom", (data) => handleJoinRoom(socket, io, data));
    socket.on("gameAction", (data) => handleGameAction(socket, io, data));
    socket.on("disconnect", () => handleDisconnect(socket, io));
    socket.on("chatMessage", (data) => handleChatMessage(socket, io, data));
  });

  return io;
}

module.exports = { initializeSocket };