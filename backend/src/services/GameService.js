const Game = require("../models/Game");

class GameService {
  constructor() {
    this.games = new Map();
    this.playerSockets = new Map();
  }

  createGame(hostId, hostName, gameType, socketId) {
    if (!hostName || !gameType) {
      throw new Error("Player name and game type are required.");
    }

    const game = new Game(hostId, hostName, gameType, socketId);
    this.games.set(game.code, game);
    this.playerSockets.set(hostId, socketId);

    return game;
  }

  joinGame(roomCode, playerId, playerName, socketId) {
    if (!playerName || !roomCode || !playerId) {
      throw new Error("Player name, room code, and player ID are required.");
    }

    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error(`Game room ${roomCode} not found.`);
    }

    let player = game.players.get(playerId);

    if (player) {
      game.reconnectPlayer(playerId, playerName, socketId);
    } else {
      player = game.addPlayer(playerId, playerName, socketId, false);
    }

    this.playerSockets.set(playerId, socketId);
    return { game, player };
  }

  disconnectPlayer(socketId) {
    for (const [gameCode, game] of this.games.entries()) {
      const player = game.getPlayerBySocketId(socketId);
      if (player) {
        game.disconnectPlayer(player.id);
        this.playerSockets.delete(player.id);
        return { game, player };
      }
    }
    return null;
  }

  getGame(gameCode) {
    return this.games.get(gameCode);
  }

  getAllGames() {
    return Array.from(this.games.values()).map((game) => game.toJson());
  }

  deleteGame(gameCode) {
    const game = this.games.get(gameCode);
    if (game) {
      for (const player of game.players.values()) {
        this.playerSockets.delete(player.id);
      }
      this.games.delete(gameCode);
      return true;
    }
    return false;
  }
}

module.exports = new GameService();
