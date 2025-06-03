const { GAME_PHASES } = require('../config/enums');

class Player {
  constructor(id, name, socketId, isHost = false) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isConnected = true;
    this.isReady = false;
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
    throw new Error(`Action ${action} not implemented`);
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
        isReady: p.isReady
      }))
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
    return Array.from(this.players.values()).find(p => p.socketId === socketId);
  }
}

module.exports = Game;