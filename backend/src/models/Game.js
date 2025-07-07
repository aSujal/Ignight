const { GAME_PHASES } = require("../config/enums");
const config = require("../config/config"); // Import config

class Player {
  constructor(id, name, socketId, isHost = false) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isConnected = true;
    this.isReady = false;
    this.isBot = false;
    this.avatarStyle =
      config.availableAvatarStyles && config.availableAvatarStyles.length > 0
        ? config.availableAvatarStyles[0]
        : "micah";
  }

  get avatarUrl() {
    return `https://api.dicebear.com/8.x/${
      this.avatarStyle
    }/svg?seed=${encodeURIComponent(this.id)}`;
  }
}

class Game {
  constructor(hostId, hostName, gameType, socketId) {
    this.code = this.generateCode();
    this.type = gameType;
    this.phase = GAME_PHASES.WAITING;
    this.players = new Map();
    this.host = hostId;
    this.createdAt = new Date();
    this.readyPlayers = new Set();
    this.phaseStartTime = null;
    this.timers = new Map();

    this.addPlayer(hostId, hostName, socketId, true);
  }

  generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  addPlayer(id, name, socketId, isHost = false) {
    if (this.players.size >= config.maxPlayersPerGame) {
      throw new Error(
        `Game is full (max ${config.maxPlayersPerGame} players).`
      );
    }
    if (this.players.has(id)) {
      throw new Error(`Player ${id} already exists in game ${this.code}.`);
    }
    const player = new Player(id, name, socketId, isHost);
    this.players.set(id, player);
    return player;
  }

  _createSingleBot() {
    if (this.players.size >= config.maxPlayersPerGame) {
      console.warn(
        `Max players (${config.maxPlayersPerGame}) reached. Cannot add more bots.`
      );
      return null;
    }

    let botNum = 0;
    this.players.forEach((player) => {
      if (player.isBot) {
        const match = player.name.match(/^Bot (\d+)$/);
        if (match && parseInt(match[1]) > botNum) {
          botNum = parseInt(match[1]);
        }
      }
    });
    botNum++;

    const botId = `bot-${Date.now()}-${botNum}`;
    const botName = `Bot ${botNum}`;

    const botPlayer = new Player(botId, botName, null, false);
    botPlayer.isBot = true;
    botPlayer.isReady = true;
    botPlayer.avatarStyle = "bottts";

    this.players.set(botId, botPlayer);
    return botPlayer;
  }

  addBotPlayer(actingPlayerId) {
    const actor = this.players.get(actingPlayerId);
    if (!actor || !actor.isHost) {
      throw new Error("Only the host can add bot players.");
    }

    const newBot = this._createSingleBot();
    if (!newBot) {
      throw new Error(
        "Failed to create bot, possibly due to reaching max player limit unexpectedly."
      );
    }

    this.readyPlayers.add(newBot.id);

    return {
      code: this.code,
      type: this.type,
      phase: this.phase,
      host: this.host,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isConnected: p.isConnected,
        isReady: p.isReady,
        avatarUrl: p.avatarUrl, // This will now call the getter
        avatarStyle: p.avatarStyle // Include avatarStyle in player data
      })),
      maxPlayers: config.maxPlayersPerGame,
      availableAvatarStyles: config.availableAvatarStyles, // Add available styles to game state
      currentTurnIndex: config.currentTurnIndex
    };
  }

  disconnectPlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
    }
  }

  reconnectPlayer(playerId, name, socketId) {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = true;
      player.socketId = socketId;
      player.name = name;
    }
  }

  getPlayerBySocketId(socketId) {
    return Array.from(this.players.values()).find(
      (p) => p.socketId === socketId
    );
  }

  _startTimer(timerName, duration, callback) {
    this._clearTimer(timerName);

    const timerId = setTimeout(() => {
      console.log(
        `Timer ${timerName} expired in game ${this.code}. Auto-transitioning.`
      );
      callback();
    }, duration);

    this.timers.set(timerName, timerId);
  }

  _clearTimer(timerName) {
    const timerId = this.timers.get(timerName);
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete(timerName);
    }
  }

  _clearAllTimers() {
    this.timers.forEach((timerId) => clearTimeout(timerId));
    this.timers.clear();
  }

  _setPhase(newPhase) {
    this.phase = newPhase;
    this.phaseStartTime = Date.now();
    this.clearReadyPlayersExceptBots();
    console.log(`Game ${this.code} transitioning to ${this.phase}`);
  }

  getClientState(playerId = null) {
    const baseState = {
      code: this.code,
      type: this.type,
      phase: this.phase,
      host: this.host,
      players: Array.from(this.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isConnected: p.isConnected,
        isReady: p.isReady,
        isBot: p.isBot,
        avatarUrl: p.avatarUrl,
        avatarStyle: p.avatarStyle,
      })),
      maxPlayers: config.maxPlayersPerGame,
      availableAvatarStyles: config.availableAvatarStyles,
      readyPlayers: Array.from(this.readyPlayers),
    };
    if (this.phaseStartTime && this._getPhaseTimer()) {
      const timer = this._getPhaseTimer();
      const elapsed = Date.now() - this.phaseStartTime;
      baseState.timerRemaining = Math.max(0, Math.floor((timer.duration - elapsed) / 1000));
      baseState.timerDuration = Math.floor(timer.duration / 1000);
    } else {
      baseState.timerRemaining = null;
      baseState.timerDuration = null;
    }
    return baseState;
  }

  handleAction(playerId, action, data) {
    switch (action) {
      case "addBot":
        return this.addBotPlayer(playerId);
      case "removePlayer":
        return this.removePlayer(playerId, data.playerId);
      case "changeAvatarStyle":
        return this.changeAvatarStyle(playerId, data.style);
      case "readyUp":
        return this.readyUp(playerId);
      default:
        // Let subclass handle game-specific actions
        return this._handleGameSpecificAction(playerId, action, data);
    }
  }

  _handleGameSpecificAction(playerId, action, data) {
    throw new Error(`Action ${action} not implemented for game type ${this.type}`);
  }

  _handleAllPlayersReady() {
    // Override in subclasses to handle what happens when all players are ready
    console.log("All players ready - subclass should override _handleAllPlayersReady");
  }

  _getPhaseTimer() {
    // Override in subclasses to return { duration } for current phase
    return null;
  }
}

module.exports = Game;
