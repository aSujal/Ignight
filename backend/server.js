const socketIo = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");
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

  socket.on("createRoom", ({ gameType, playerName, playerId }) => {
    try {
      if (!playerName || !gameType) {
        socket.emit("error", "Player name and game type are required.");
        return;
      }
      const game = createNewRoom(playerId, gameType, playerName, socket.id);
      playerSockets.set(playerId, socket.id);
      socket.emit("roomCreated", {
        id: game.hostId,
        host: game.hostName,
        type: game.gameType,
        players: Array.from(game.players.values()),
        code: game.gameCode,
        phase: game.phase,
      });
      socket.join(game.gameCode);
      console.log(
        `Player ${playerName} (ID: ${playerId}, Socket: ${socket.id}) created and joined room ${game.gameCode}`
      );
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("error", "Failed to create room");
    }
  });

  socket.on("joinRoom", ({ roomCode, playerName, playerId }) => {
    try {
      if (!playerName || !roomCode || !playerId) {
        socket.emit(
          "error",
          "Player name, room code, and player ID are required."
        );
        return;
      }
      const game = games.get(roomCode);
      if (!game) {
        socket.emit("error", `Game room ${roomCode} not found.`);
        return;
      }
      const player = game.players.get(playerId);
      // Player is REJOINING / RECONNECTING
      if (player) {
        console.log(
          `Player ${player.name} (ID: ${playerId}) is reconnecting to room ${roomCode} with new socket ${socket.id}`
        );
        player.isConnected = true;
        player.socketId = socket.id;
        player.name = playerName;
      } else {
        console.log(
          `Player ${playerName} (ID: ${playerId}) is joining room ${roomCode} for the first time with socket ${socket.id}`
        );
        const newPlayer = {
          id: playerId,
          name: playerName,
          socketId: socket.id,
          isHost: false,
          isReady: false,
          votes: 0,
          isEliminated: false,
          isConnected: true,
        };
        game.players.set(playerId, newPlayer);
      }

      socket.join(game.gameCode);

      socket.emit("roomJoined", {
        id: game.hostId,
        host: game.hostName,
        type: game.gameType,
        players: Array.from(game.players.values()),
        code: game.gameCode,
        phase: game.phase,
      });

      io.to(game.gameCode).emit("gameStateUpdate", {
        ...game,
        players: Array.from(game.players.values()),
        code: game.gameCode,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", "Failed to join room");
    }
  });

  socket.on("disconnect", () => {
    const playerId = playerSockets.get(socket.id);
    if (playerId) {
      playerSockets.delete(socket.id);
      for (const [gameCode, game] of games.entries()) {
        const player = game.players.get(playerId);
        if (player && player.socketId === socket.id) {
          console.log(
            `Player ${player.name} (ID: ${playerId}) marked as disconnected from game ${gameCode}`
          );
          player.isConnected = false;
          io.to(gameCode).emit("gameStateUpdate", {
            ...game,
            players: Array.from(game.players.values()),
            code: gameCode,
          });
          break;
        }
      }
    } else {
      console.log(
        `No player found for disconnected socket.id: ${socket.id}. User might not have joined a room.`
      );
    }
  });
});

function createNewRoom(hostPersistentId, gameType, hostName, socketId) {
  const gameCode = generateGameCode();
  const hostPlayer = {
    id: hostPersistentId,
    name: hostName,
    socketId,
    isHost: true,
    isReady: true,
    votes: 0,
    isEliminated: false,
    isConnected: true,
  };
  const playersMap = new Map();
  playersMap.set(hostPersistentId, hostPlayer);
  const newGame = {
    hostId: hostPersistentId,
    hostName,
    gameCode,
    gameType,
    players: playersMap,
    phase: "waiting",
    createdAt: new Date(),
  };
  games.set(gameCode, newGame);
  return newGame;
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
