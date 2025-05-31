const socketIo = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

const PORT = 4000 || process.env.PORT;

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const games = new Map();
const playerSockets = new Map();

function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);
  socket.emit("message", "Welcome to the server!");
  socket.on("createRoom", ({ playerName, gameType }) => {
    try {
      const playerId = uuidv4();
      const game = createRoom(playerId, playerName, gameType);
      playerSockets.set(playerId, socket.id);
      socket.emit("roomCreated", {
        id: game.hostId,
        host: game.hostName,
        type: game.gameType,
        players: game.players,
        code: game.gameCode,
        phase: game.phase,
      });
      socket.join(game.gameCode);
    } catch (error) {}
  });

  socket.on("joinRoom", ({ playerName, roomCode }) => {
    try {
      const playerId = uuidv4();
      const game = joinRoom(playerId, playerName, roomCode);
      playerSockets.set(playerId, socket.id);
      socket.emit("roomJoined", {
        id: game.hostId,
        host: game.hostName,
        type: game.gameType,
        players: game.players,
        code: game.gameCode,
        phase: game.phase,
      });
      socket.join(game.gameCode);
    } catch (error) {}
  });
});

function createRoom(hostId, gameType, hostName) {
  const gameCode = generateGameCode();
  const newGame = {
    hostId,
    hostName,
    gameCode,
    gameType,
    players: new Map(),
    phase: "waiting",
    createdAt: new Date(),
  };
  games.set(gameCode, newGame);
  return newGame;
}

function joinRoom(playerId, roomCode, playerName) {
  const game = games.get(roomCode);
  if (!game) {
    throw new Error("Game not found");
  }
  game.players.set(playerId, {
    id: playerId,
    name: playerName,
    isHost: false,
    isReady: false,
    votes: 0,
    isEliminated: false,
    isConnected: true,
  });
  return game;
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
