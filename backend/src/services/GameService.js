const Game = require("../models/Game");
const WordImpostorGame = require("../models/ImposterGame");
const config = require("../config/config");

class GameService {
  constructor() {
    this.games = new Map();
    this.playerSockets = new Map();
  }

  createGame(hostId, hostName, gameType, socketId) {
    if (!hostName || !gameType) {
      throw new Error("Player name and game type are required.");
    }

    let game;

    switch (gameType) {
      case "word-impostor":
        game = new WordImpostorGame(hostId, hostName, socketId);
        break;
      default:
        game = new Game(hostId, hostName, gameType, socketId);
        break;
    }

    this.games.set(game.code, game);
    this.playerSockets.set(hostId, socketId);

    console.log(`Game created: ${game.code} (Type: ${gameType})`);

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
      if (game.phase !== "waiting") {
        throw new Error("Game already in progress");
      }

      if (game.players.size >= config.maxPlayersPerGame) {
        throw new Error("Game is full");
      }
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

        // const connectedPlayers = Array.from(game.players.values()).filter(
        //   (p) => p.isConnected
        // );
        // if (connectedPlayers.length === 0) {
        //   this.games.delete(gameCode);
        //   console.log(`Game ${gameCode} deleted - no connected players`);
        // }

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

  // Clean up old games (call this periodically)
  cleanupOldGames(maxAgeMinutes = config.gameDurationMinutes) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - maxAgeMinutes * 60 * 1000);

    for (const [gameCode, game] of this.games.entries()) {
      if (game.createdAt < cutoff) {
        this.games.delete(gameCode);
        console.log(`Cleaned up old game: ${gameCode}`);
      }
    }
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

const gameService = new GameService();

module.exports = gameService;
