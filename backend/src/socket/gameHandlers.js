const gameService = require("../services/GameService");

function handleCreateRoom(socket, io, { gameType, playerName, playerId }) {
  try {
    const game = gameService.createGame(
      playerId,
      playerName,
      gameType,
      socket.id
    );
    socket.join(game.code);
    socket.emit("roomCreated", game.toJSON());

    console.log(
      `Player ${playerName} (ID: ${playerId}, Socket: ${socket.id}) created and joined room ${game.code}`
    );
  } catch (error) {
    console.error("Error creating room:", error);
    socket.emit("error", error.message);
  }
}

function handleJoinRoom(socket, io, { roomCode, playerName, playerId }) {
  try {
    const { game, player } = gameService.joinGame(
      roomCode,
      playerId,
      playerName,
      socket.id
    );

    socket.join(game.code);
    socket.emit("roomJoined", game.toJSON());

    io.to(game.code).emit("gameStateUpdate", game.toJSON());

    console.log(
      `Player ${playerName} (ID: ${playerId}) ${
        player.isConnected ? "reconnected to" : "joined"
      } room ${roomCode}`
    );
  } catch (error) {
    console.error("Error joining room:", error);
    socket.emit("error", error.message);
  }
}

function handleDisconnect(socket, io) {
  const result = gameService.disconnectPlayer(socket.id);

  if (result) {
    const { game, player } = result;
    console.log(
      `Player ${player.name} (ID: ${player.id}) marked as disconnected from game ${game.code}`
    );

    io.to(game.code).emit("gameStateUpdate", game.toJSON());
  } else {
    console.log(
      `No player found for disconnected socket.id: ${socket.id}. User might not have joined a room.`
    );
  }
}

module.exports = {
  handleCreateRoom,
  handleJoinRoom,
  handleDisconnect,
};
