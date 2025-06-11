const { GAME_PHASES } = require('../config/enums');
const config = require('../config/config'); // Import config

class Player {
  constructor(id, name, socketId, isHost = false) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isConnected = true;
    this.isReady = false;
    // Default to first available style or 'micah' if list is empty/not found
    this.avatarStyle = (config.availableAvatarStyles && config.availableAvatarStyles.length > 0)
                       ? config.availableAvatarStyles[0]
                       : 'micah';
    // avatarUrl is now a getter, so direct assignment is removed.
  }

  get avatarUrl() { // Added getter for dynamic URL
    return `https://api.dicebear.com/8.x/${this.avatarStyle}/svg?seed=${encodeURIComponent(this.id)}`;
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
    
    this.addPlayer(hostId, hostName, socketId, true);
  }

  generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  addPlayer(id, name, socketId, isHost = false) {
    const player = new Player(id, name, socketId, isHost);
    this.players.set(id, player);
    return player;
  }

  handleAction(playerId, action, data) {
    // Override in subclasses
    throw new Error(`Action ${action} not implemented for game type ${this.type}`);
  }

  getClientState(playerId = null) {
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
      availableAvatarStyles: config.availableAvatarStyles // Add available styles to game state
    };
  }

  disconnectPlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
      // Potentially add logic for host change if host disconnects, or game cleanup
    }
  }

  reconnectPlayer(playerId, name, socketId) {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = true;
      player.socketId = socketId;
      player.name = name; // Allow name update on reconnect if desired
    }
  }

  getPlayerBySocketId(socketId) {
    return Array.from(this.players.values()).find(p => p.socketId === socketId);
  }
}

module.exports = Game;