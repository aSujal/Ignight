class Game {
  constructor(hostId, hostName, gameType, socketId) {
    this.hostId = hostId;
    this.hostName = hostName;
    this.type = gameType;
    this.code = this.generateGameCode();
    this.socketId = socketId;
    this.players = new Map();
    this.phase = "waiting";
    this.createdAt = new Date();

    this.addPlayer(hostId, hostName, socketId, true);
  }


  generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  addPlayer(playerId, playerName, socketId, isHost = false) {
    const player = {
      id: playerId,
      name: playerName,
      socketId,
      isHost,
      isReady: false,
      votes: 0,
      isEliminated: false,
      isConnected: true,
    };

    this.players.set(playerId, player);
    return player;
  }

  reconnectPlayer(playerId, playerName, socketId) {
    const player = this.players.get(playerId);
    if (player) {
      player.name = playerName;
      player.socketId = socketId;
      player.isConnected = true;
      return player;
    }
    return null;
  }

  disconnectPlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
      return player;
    }
    return null;
  }

  getPlayerBySocketId(socketId) {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) {
        return player;
      }
    }
    return null;
  }

  toJSON() {
    return {
      hostId: this.hostId,
      hostName: this.hostName,
      type: this.type,
      code: this.code,
      socketId: this.socketId,
      players: Array.from(this.players.values()),
      phase: this.phase,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Game;