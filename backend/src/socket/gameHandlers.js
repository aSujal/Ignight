const gameService = require("../services/GameService");
const { GAME_TYPES } = require("../config/enums");

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

function handleDisconnect(socket, io) {
  const result = gameService.disconnectPlayer(socket.id);
  if (result) {
    const { game } = result;
    for (const [playerId, player] of game.players.entries()) {
      const gameReturn = game.getClientState(playerId);
      io.to(player.socketId).emit("gameStateUpdate", gameReturn);
    }
  }
}

module.exports = {
  handleCreateRoom,
  handleJoinRoom,
  handleGameAction,
  handleDisconnect,
};
