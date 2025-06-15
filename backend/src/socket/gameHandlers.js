const gameService = require("../services/GameService");
const { GAME_TYPES } = require("../config/enums");
const { v4: uuidv4 } = require("uuid");
const { sendServerMessage } = require("./utils/sendServerMessage");


function handleCreateRoom(socket, io, { gameType, playerName, playerId }) {
  try {
    const game = gameService.createGame(
      playerId,
      playerName,
      gameType,
      socket.id
    );
    socket.join(game.code);
    socket.emit("roomCreated", game.getClientState(playerId));
    console.log(`Player ${playerName} created room ${game.code}`);

    sendServerMessage(io, game.code, `${playerName} created the room.`);
  } catch (error) {
    socket.emit("error", error.message);
  }
}

function handleJoinRoom(socket, io, { roomCode, playerName, playerId }) {
  try {
    const { game } = gameService.joinGame(
      roomCode,
      playerId,
      playerName,
      socket.id
    );
    socket.join(game.code);
    const gameReturn = game.getClientState(playerId);
    socket.emit("roomJoined", gameReturn);
    io.to(game.code).emit("gameStateUpdate", gameReturn);
    console.log(`Player ${playerName} joined room ${roomCode}`);
    
    sendServerMessage(io, roomCode, `${playerName} joined the room.`);
  } catch (error) {
    socket.emit("error", error.message);
  }
}

function handleGameAction(socket, io, { roomCode, playerId, action, data }) {
  try {
    const game = gameService.getGame(roomCode);
    if (!game) throw new Error("Game not found");
    console.log(playerId);
    const result = game.handleAction(playerId, action, data);

    if (result.broadcast) {
      io.to(roomCode).emit(result.event, result.data);
    } else if (result.emit) {
      socket.emit(result.event, result.data);
    }

    for (const [playerId, player] of game.players.entries()) {
      const gameReturn = game.getClientState(playerId);
      io.to(player.socketId).emit("gameStateUpdate", gameReturn);
    }
  } catch (error) {
    socket.emit("error", error.message);
  }
}

function handleChatMessage(socket, io, data) {
  const { roomCode, playerId, message } = data;

  if (!roomCode || !playerId || !message?.trim()) {
    return;
  }

  const chatMessage = {
    id: uuidv4(),
    message,
    senderType: "player",
    playerId,
    timestamp: new Date(),
    type: "PLAYER",
  };

  io.to(roomCode).emit("chatMessage", chatMessage);
}

function handleDisconnect(socket, io) {
  const result = gameService.disconnectPlayer(socket.id);

  if (result) {
    const { game, player } = result;

    for (const [playerId, player] of game.players.entries()) {
      const gameReturn = game.getClientState(playerId);
      io.to(player.socketId).emit("gameStateUpdate", gameReturn);
    }

    if (player?.name) {
      sendServerMessage(io, game.code, `${player.name} left the game.`);
    }
  }
}

module.exports = {
  handleCreateRoom,
  handleJoinRoom,
  handleGameAction,
  handleDisconnect,
  handleChatMessage
};
