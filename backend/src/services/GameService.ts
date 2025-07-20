
import config from '../config/config';
import { Game } from '../models/Game';
import WordImpostorGame from '../models/ImposterGame';

class GameService {
  private games: Map<string, any>;
  private playerSockets: Map<string, string>;
  private phaseChangeEmitter?: (gameCode: string, event: any) => void;

  constructor() {
    this.games = new Map();
    this.playerSockets = new Map();
  }

  createGame(
    hostId: string,
    hostName: string,
    gameType: string,
    socketId: string,
    avatar: any,
    numBots = 0
  ) {
    if (!hostName || !gameType) {
      throw new Error('Player name and game type are required.');
    }

    let game: any;

    switch (gameType) {
      case 'word-impostor':
        game = new WordImpostorGame(hostId, hostName, socketId);
        break;
      default:
        game = new Game(hostId, hostName, gameType, socketId);
        break;
    }

    game.players.get(hostId).applyAvatarData(avatar);

    // Set up phase change callback for this game
    game.setPhaseChangeCallback((event: any) => {
      this.emitPhaseChange(game.code, event);
    });

    this.games.set(game.code, game);
    this.playerSockets.set(hostId, socketId);

    console.log(`Game created: ${game.code} (Type: ${gameType})`);

    return game;
  }

  joinGame(
    roomCode: string,
    playerId: string,
    playerName: string,
    socketId: string,
    avatar: any
  ) {
    if (!playerName || !roomCode || !playerId) {
      throw new Error('Player name, room code, and player ID are required.');
    }

    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error(`Game room ${roomCode} not found.`);
    }

    let player = game.players.get(playerId);

    if (player) {
      game.reconnectPlayer(playerId, playerName, socketId, avatar);
    } else {
      if (game.phase !== 'waiting') {
        throw new Error('Game already in progress');
      }

      if (game.players.size >= config.maxPlayersPerGame) {
        throw new Error('Game is full');
      }
      player = game.addPlayer(playerId, playerName, socketId, false, avatar);
    }

    this.playerSockets.set(playerId, socketId);
    return { game, player };
  }

  disconnectPlayer(socketId: string) {
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

  getGame(gameCode: string) {
    return this.games.get(gameCode);
  }

  getAllGames() {
    return Array.from(this.games.values()).map((game) => game.toJson());
  }

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

  deleteGame(gameCode: string): boolean {
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

  // Set the phase change emitter callback (called by socket handler)
  setPhaseChangeEmitter(emitter: (gameCode: string, event: any) => void) {
    this.phaseChangeEmitter = emitter;
  }

  // Emit phase change event (called by games)
  emitPhaseChange(gameCode: string, event: any) {
    if (this.phaseChangeEmitter) {
      this.phaseChangeEmitter(gameCode, event);
    }
  }
}

const gameService = new GameService();
export default gameService;
