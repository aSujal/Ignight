// models/Game.ts
import { GAME_PHASES } from "../config/enums";
import config from "../config/config";

interface AvatarCustomizations {
  [key: string]: string | number | boolean | undefined;
}

interface AvatarData {
  style?: string;
  customizations?: AvatarCustomizations;
}

export class Player {
  id: string;
  name: string;
  socketId: string | null;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
  isBot: boolean;
  avatarStyle: string;
  avatarCustomizations: AvatarCustomizations;

  constructor(
    id: string,
    name: string,
    socketId: string | null,
    isHost = false,
    avatar: AvatarData = {}
  ) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isConnected = true;
    this.isReady = false;
    this.isBot = false;
    this.avatarStyle = avatar.style || (config.availableAvatarStyles?.[0] ?? "micah");
    this.avatarCustomizations = avatar.customizations || {};
  }

  applyAvatarData(avatar: AvatarData) {
    this.avatarStyle = avatar.style || (config.availableAvatarStyles?.[0] ?? "micah");
    this.avatarCustomizations = avatar.customizations || {};
  }

  get avatarUrl(): string {
    const params = new URLSearchParams();
    params.append("seed", this.id);
    Object.entries(this.avatarCustomizations).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    return `https://api.dicebear.com/8.x/${this.avatarStyle}/svg?${params.toString()}`;
  }
}

export interface PlayerClientState {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
  isBot: boolean;
  avatarUrl: string;
  avatarStyle: string;
}

export interface GameClientState {
  code: string;
  type: string;
  phase: string;
  host: string;
  players: PlayerClientState[];
  maxPlayers: number;
  availableAvatarStyles: string[];
  readyPlayers: string[];
  timerRemaining: number | null;
  timerDuration: number | null;
  phaseStartTime: number | null;
}

export interface GameActionResult {
  broadcast: boolean;
  event: string;
  data: any;
  emit?: boolean;
}

export class Game {
  code: string;
  type: string;
  phase: string;
  players: Map<string, Player>;
  host: string;
  createdAt: Date;
  readyPlayers: Set<string>;
  phaseStartTime: number | null;
  timers: Map<string, NodeJS.Timeout>;
  public _phaseChangeCallback?: (event: GameActionResult) => void;

  constructor(hostId: string, hostName: string, gameType: string, socketId: string) {
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

  handleAction(playerId: string, action: string, data: any): GameActionResult | { broadcast: false } {
    switch (action) {
      case "addBot":
        return this.addBotPlayer(playerId);
      case "removePlayer":
        return this.removePlayer(playerId, data.playerId);
      case "changeAvatar":
        return this.changeAvatar(playerId, data.style, data.parts);
      case "readyUp":
        return this.readyUp(playerId);
      default:
        // Let subclass handle game-specific actions
        return this._handleGameSpecificAction(playerId, action, data);
    }
  }

  _setPhase(newPhase: string) {
    this.phase = newPhase;
    this.phaseStartTime = Date.now();
    this.clearReadyPlayersExceptBots();
    console.log(`Game ${this.code} transitioning to ${this.phase}`);
  }

  changeAvatar(playerId: string, style?: string, parts?: AvatarCustomizations): GameActionResult {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found.");
    }

    if (style && !config.availableAvatarStyles.includes(style)) {
      throw new Error("Invalid avatar style.");
    }

    player.avatarStyle = style ?? player.avatarStyle;
    if (parts) {
      player.avatarCustomizations = parts;
    }

    return {
      broadcast: true,
      event: "gameStateUpdate",
      data: this.getClientState(),
    };
  }

  generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  addPlayer(
    id: string,
    name: string,
    socketId: string | null,
    isHost = false,
    avatar: AvatarData = {}
  ): Player {
    if (this.players.size >= config.maxPlayersPerGame) {
      throw new Error(`Game is full (max ${config.maxPlayersPerGame} players).`);
    }
    if (this.players.has(id)) {
      throw new Error(`Player ${id} already exists in game ${this.code}.`);
    }
    const player = new Player(id, name, socketId, isHost, avatar);
    this.players.set(id, player);
    return player;
  }

  private _createSingleBot(): Player | null {
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

  addBotPlayer(actingPlayerId: string): GameActionResult {
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
      broadcast: true,
      event: "playerJoined",
      data: { newPlayer: newBot, gameCode: this.code },
    };
  }

  removePlayer(actingPlayerId: string, playerToKickId: string): GameActionResult {
    const actor = this.players.get(actingPlayerId);
    if (!actor || !actor.isHost) {
      throw new Error("Only the host can remove players.");
    }

    const playerToKick = this.players.get(playerToKickId);
    if (!playerToKick) {
      throw new Error("Player to kick not found.");
    }

    this.players.delete(playerToKickId);
    this.readyPlayers.delete(playerToKickId);
    console.log(
      `Player ${playerToKickId} (Name: ${playerToKick.name}) removed from game ${this.code}. Total players: ${this.players.size}`
    );

    return {
      broadcast: true,
      event: "playerLeft",
      data: { playerId: playerToKickId, gameCode: this.code },
    };
  }

  clearReadyPlayersExceptBots() {
    this.readyPlayers.forEach((playerId) => {
      const player = this.players.get(playerId);
      if (player && !player.isBot) {
        this.readyPlayers.delete(playerId);
      }
    });
  }

  readyUp(playerId: string): GameActionResult | { broadcast: false } {
    const player = this.players.get(playerId);
    if (!player) throw new Error("Player not found.");

    // Toggle ready state instead of just setting to true
    if (this.readyPlayers.has(playerId)) {
      // Unready the player
      player.isReady = false;
      this.readyPlayers.delete(playerId);
      console.log(
        `Player ${playerId} unreadied in phase ${this.phase}. Ready players: ${this.readyPlayers.size}`
      );

      return {
        broadcast: true,
        event: "playerReadiedUp",
        data: {
          playerId,
          isReady: player.isReady,
          readyCount: this.readyPlayers.size,
          totalHumanPlayers: Array.from(this.players.values()).filter(
            (p) => !p.isBot && p.isConnected
          ).length,
          phase: this.phase,
          allReady: false,
        },
      };
    }

    // Ready the player
    player.isReady = true;
    this.readyPlayers.add(playerId);

    console.log(
      `Player ${playerId} readied up in phase ${this.phase}. Ready players: ${this.readyPlayers.size}`
    );

    const humanPlayers = Array.from(this.players.values()).filter(
      (p) => !p.isBot && p.isConnected
    );
    const botPlayers = Array.from(this.players.values()).filter(
      (p) => p.isBot && p.isConnected
    );

    const allReady = this.readyPlayers.size - botPlayers.length >= humanPlayers.length;
    if (allReady) {
      console.log('allReady is true');
      this.players.forEach((player) => {
        if (!player.isBot) {
          player.isReady = false;
        }
      });
      this.clearReadyPlayersExceptBots();

      // Handle the phase change event if one is returned
      const phaseChangeEvent = this._handleAllPlayersReady();
      if (phaseChangeEvent && phaseChangeEvent.broadcast) {
        console.log(`Phase change event detected: ${phaseChangeEvent.event}`);
        this._emitPhaseChangeEvent(phaseChangeEvent);
        return phaseChangeEvent;
      }

      console.log(
        `All ${humanPlayers.length} human players readied up. Ending phase ${this.phase} early.`
      );
    }

    return {
      broadcast: true,
      event: "playerReadiedUp",
      data: {
        playerId,
        isReady: player.isReady,
        readyCount: this.readyPlayers.size,
        totalHumanPlayers: humanPlayers.length,
        phase: this.phase,
        allReady,
      },
    };
  }

  disconnectPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
    }
  }

  reconnectPlayer(playerId: string, name: string, socketId: string, avatar: AvatarData) {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = true;
      player.socketId = socketId;
      player.name = name;
      player.applyAvatarData(avatar);
    }
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    return Array.from(this.players.values()).find(
      (p) => p.socketId === socketId
    );
  }

  public _startTimer(timerName: string, duration: number, callback: () => void) {
    this._clearTimer(timerName);

    const timerId = setTimeout(() => {
      console.log(
        `Timer '${timerName}' finished for game ${this.code} at phase ${this.phase}`
      );
      this.phaseStartTime = null;
      this.timers.delete(timerName);
      callback();
    }, duration);

    this.phaseStartTime = Date.now();
    this.timers.set(timerName, timerId);
  }

  private _clearTimer(timerName: string) {
    if (this.timers.has(timerName)) {
      clearTimeout(this.timers.get(timerName));
      this.timers.delete(timerName);
    }
  }

  clearAllTimers() {
    this.timers.forEach((timeoutId) => clearTimeout(timeoutId));
    this.timers.clear();
    this.phaseStartTime = null;
  }

  // Set callback for phase change events (called by GameService)
  setPhaseChangeCallback(callback: (event: GameActionResult) => void) {
    this._phaseChangeCallback = callback;
  }

  // Emit phase change event through callback
  protected _emitPhaseChangeEvent(event: GameActionResult) {
    if (this._phaseChangeCallback) {
      this._phaseChangeCallback(event);
    }
  }

  _handleAllPlayersReady(): GameActionResult | void {
    // This method should be overridden in subclasses for game-specific logic.
  }

  _getPhaseTimer(): { duration: number } | null {
    // This method should be overridden to provide phase-specific timer durations.
    return null;
  }

  _handleGameSpecificAction(playerId: string, action: string, data: any): GameActionResult | { broadcast: false } {
    throw new Error(`Action ${action} not implemented for game type ${this.type}`);
  }

  getClientState(playerId: string | null = null): GameClientState {
    const baseState: GameClientState = {
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
      timerRemaining: null,
      timerDuration: null,
      phaseStartTime: this.phaseStartTime,
    };

    const timer = this._getPhaseTimer();
    if (this.phaseStartTime && timer) {
      const elapsed = Date.now() - this.phaseStartTime;
      baseState.timerRemaining = Math.max(0, Math.floor((timer.duration - elapsed) / 1000));
      baseState.timerDuration = Math.floor(timer.duration / 1000);
    }

    return baseState;
  }
}
