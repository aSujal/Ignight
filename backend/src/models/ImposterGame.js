// wordImpostorGame.js
const Game = require("./Game");
const { GAME_PHASES } = require("../config/enums");
const config = require("../config/config"); // Import config

const WORD_SETS = [
  { word: "PIZZA", hint: "Food" },
  { word: "OCEAN", hint: "Water" },
  { word: "GUITAR", hint: "Music" },
  { word: "BUTTERFLY", hint: "Insect" },
  { word: "CASTLE", hint: "Building" },
  { word: "RAINBOW", hint: "Colors" },
  { word: "TELESCOPE", hint: "Science" },
  { word: "VOLCANO", hint: "Mountain" },
  { word: "LIBRARY", hint: "Books" },
  { word: "DIAMOND", hint: "Gem" },
  { word: "SANDWICH", hint: "Food" },
  { word: "HELICOPTER", hint: "Vehicle" },
  { word: "PENGUIN", hint: "Animal" },
  { word: "KEYBOARD", hint: "Computer" },
  { word: "SUNFLOWER", hint: "Plant" },
  { word: "MOTORCYCLE", hint: "Vehicle" },
  { word: "AQUARIUM", hint: "Fish" },
  { word: "CACTUS", hint: "Plant" },
  { word: "LIGHTHOUSE", hint: "Building" },
  { word: "PARACHUTE", hint: "Sky" },
];

class WordImpostorGame extends Game {
  constructor(hostId, hostName, socketId) {
    super(hostId, hostName, "word-impostor", socketId);
    this.currentWord = null;
    this.impostorId = null;
    this.playerClues = new Map(); // Stores clues given in DISCUSSION phase
    this.votes = new Map();
    this.readyPlayers = new Set();
    this.discussionTimer = null;
    this.votingTimer = null;
    this.wordShowTimer = null; // Ensure wordShowTimer is initialized
    this.phaseStartTime = null;
    // Store configured durations in milliseconds
    this.phaseDurations = {
      [GAME_PHASES.DISCUSSION]: config.discussionDurationSeconds * 1000,
      [GAME_PHASES.VOTING]: config.votingDurationSeconds * 1000,
      [GAME_PHASES.WORD_SHOW]: 5000, // 5 seconds for word show, can be configurable too
    };
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

    const botPlayer = {
      id: botId,
      name: botName,
      socketId: null,
      isHost: false,
      isConnected: true,
      isBot: true,
      score: 0,
      avatarStyle: "bottts",
      isReady: true,
    };

    const tempBotPlayer = { ...botPlayer };
    tempBotPlayer.avatarUrl = `https://api.dicebear.com/8.x/${
      tempBotPlayer.avatarStyle
    }/svg?seed=${encodeURIComponent(botId)}`;

    this.players.set(botId, tempBotPlayer);
    console.log(
      `Bot ${botName} (ID: ${botId}) added to game ${this.code}. Total players: ${this.players.size}`
    );
    return botPlayer;
  }

  addBotPlayer(actingPlayerId) {
    const actor = this.players.get(actingPlayerId);
    if (!actor || !actor.isHost) {
      throw new Error("Only the host can add bot players.");
    }
    if (this.players.size >= config.maxPlayersPerGame) {
      throw new Error(
        `Cannot add bot: Game is full (max ${config.maxPlayersPerGame} players).`
      );
    }
    const newBot = this._createSingleBot();
    if (!newBot) {
      throw new Error(
        "Failed to create bot, possibly due to reaching max player limit unexpectedly."
      );
    }
    return {
      broadcast: true,
      event: "playerJoined",
      data: { newPlayer: newBot, gameCode: this.code },
    };
  }

  removePlayer(actingPlayerId, playerToKickId) {
    const actor = this.players.get(actingPlayerId);
    if (!actor || !actor.isHost) {
      throw new Error("Only the host can remove players.");
    }
    const playerToKick = this.players.get(playerToKickId);
    if (!playerToKick) {
      throw new Error("Player to kick not found.");
    }
    this.players.delete(playerToKickId);
    console.log(
      `Player ${playerToKickId} (Name: ${playerToKick.name}) removed from game ${this.code}. Total players: ${this.players.size}`
    );
    return {
      broadcast: true,
      event: "playerLeft",
      data: { playerId: playerToKickId, gameCode: this.code },
    };
  }

  handleAction(playerId, action, data) {
    switch (action) {
      case "startGame":
        return this.startGame(playerId);
      case "startRound":
        return this.startRound(playerId);
      case "submitClue": // This action remains, happens during DISCUSSION phase
        return this.submitClue(playerId, data.clue);
      case "submitVote": // This action remains, happens during VOTING phase
        return this.submitVote(playerId, data.votedForPlayerId);
      case "readyUp":
        return this.readyUp(playerId);
      case "hostEndWordShow":
        return this.hostEndWordShow(playerId);
      case "hostEndDiscussion":
        return this.hostEndDiscussion(playerId);
      case "hostEndVoting":
        return this.hostEndVoting(playerId);
      case "resetGame":
        return this.resetGame(playerId);
      case "addBot": // New action
        return this.addBotPlayer(playerId);
      case "removePlayer":
        return this.removePlayer(playerId, data.playerId);
      case "changeAvatarStyle":
        return this.changeAvatarStyle(playerId, data.style);
      default:
        console.warn(`Unknown action: ${action} by player ${playerId}`);
        throw new Error(`Unknown action: ${action}`);
    }
  }

  changeAvatarStyle(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found.");
    }
    return { broadcast: true };
  }

  startRound(playerId) {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error("Only host can start round");
    this.phase = GAME_PHASES.CLUE_GIVING;
    return {
      broadcast: true,
      event: "phaseChanged",
      data: { phase: this.phase },
    };
  }

  startGame(playerId) {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error("Only host can start game");
    if (this.players.size < 3) throw new Error("Need at least 3 players");

    this.phase = GAME_PHASES.WORD_REVEAL;
    this.selectWordAndImpostor();

    return this._transitionToWordShow();
  }

  selectWordAndImpostor() {
    const wordSet = WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)];
    this.currentWord = wordSet;

    const playerIds = Array.from(this.players.keys());
    if (playerIds.length === 0) {
      console.error(
        "Attempted to select word and imposter with no players in the game."
      );
      throw new Error("No players to select imposter from.");
    }
    this.impostorId = playerIds[Math.floor(Math.random() * playerIds.length)];
    console.log(
      `Imposter selected: ${this.impostorId}. Word: ${this.currentWord.word}, Hint: ${this.currentWord.hint}`
    );
  }

  getGameStartData() {
    const data = {};
    for (const [playerId] of this.players) {
      data[playerId] = {
        word: playerId === this.impostorId ? "Imposter" : this.currentWord.word,
        hint: this.currentWord.hint,
        isImpostor: playerId === this.impostorId,
      };
    }
    return data;
  }

  submitClue(playerId, clue) {
    if (this.phase !== GAME_PHASES.DISCUSSION) {
      throw new Error(
        `Cannot submit clue in phase: ${this.phase}. Must be in DISCUSSION phase.`
      );
    }
    if (this.playerClues.has(playerId)) {
      throw new Error(
        `Player ${playerId} has already submitted a clue this round.`
      );
    }

    this.playerClues.set(playerId, clue);

    const humanPlayersCount = Array.from(this.players.values()).filter(
      (p) => !p.isBot && p.isConnected
    ).length;
    const humanCluesCount = Array.from(this.playerClues.keys()).filter(
      (id) => !this.players.get(id)?.isBot
    ).length;

    return {
      broadcast: true,
      event: "clueSubmitted",
      data: {
        playerId,
        playerName: this.players.get(playerId)?.name || "Unknown Player",
        clue,
        allHumanCluesSubmitted: humanCluesCount === humanPlayersCount,
      },
    };
  }

  submitVote(playerId, votedForPlayerId) {
    if (this.phase !== GAME_PHASES.VOTING) {
      throw new Error(
        `Cannot submit vote in phase: ${this.phase}. Must be in VOTING phase.`
      );
    }
    if (!this.players.has(votedForPlayerId)) {
      throw new Error("Voted for player does not exist.");
    }
    if (this.votes.has(playerId)) {
      this.votes.delete(playerId);
    }

    this.votes.set(playerId, votedForPlayerId);

    // Inform clients about who has voted (anonymously or not).
    // TODO: Add annonymous vote settings
    return {
      broadcast: true,
      event: "voteSubmitted", // Client can use this to show "Player X has voted"
      data: {
        playerId, // Let clients know who voted
        // allVotesSubmitted: this.votes.size === Array.from(this.players.values()).filter(p => p.isConnected).length // For UI
      },
    };
  }

  triggerBotActions() {
    if (this.phase === GAME_PHASES.DISCUSSION) {
      // Updated phase
      this.players.forEach((player) => {
        if (
          player.isBot &&
          player.isConnected &&
          !this.playerClues.has(player.id)
        ) {
          this._botSubmitClue(player.id);
        }
      });
    } else if (this.phase === GAME_PHASES.VOTING) {
      this.players.forEach((player) => {
        if (player.isBot && player.isConnected && !this.votes.has(player.id)) {
          this._botSubmitVote(player.id);
        }
      });
    }
  }

  _botSubmitClue(botId) {
    const bot = this.players.get(botId);
    if (
      !bot ||
      !bot.isBot ||
      this.phase !== GAME_PHASES.DISCUSSION ||
      this.playerClues.has(botId)
    ) {
      // Updated phase
      return;
    }

    let clue;
    const isImposter = this.impostorId === botId;
    const randomWords = [
      "Dog",
      "House",
      "Window",
      "Goblin",
      "Tiger",
      "Ninja",
      "Pen",
      "Famous",
    ];
    if (isImposter) {
      clue = this.currentWord?.hint
        ? `${randomWords[Math.floor(Math.random() * randomWords.length)]}`
        : "IDK";
    } else {
      clue = this.currentWord?.word ? `${this.currentWord.hint}` : "IDK";
    }
    console.log(
      `Bot ${bot.name} submitting clue: ${clue} (Imposter: ${isImposter})`
    );
    this.submitClue(botId, clue);
  }

  _botSubmitVote(botId) {
    const bot = this.players.get(botId);
    if (
      !bot ||
      !bot.isBot ||
      this.phase !== GAME_PHASES.VOTING ||
      this.votes.has(botId)
    ) {
      return;
    }

    const potentialTargets = Array.from(this.players.values())
      .filter((p) => p.isConnected && p.id !== botId)
      .map((p) => p.id);

    if (potentialTargets.length === 0) {
      console.warn(`Bot ${bot.name} has no one to vote for.`);
      return;
    }

    const votedForPlayerId =
      potentialTargets[Math.floor(Math.random() * potentialTargets.length)];

    this.submitVote(botId, votedForPlayerId);
  }

  startRound(playerId) {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error("Only host can start round");
    this._transitionToDiscussion();
    return {
      broadcast: true,
      event: "phaseChanged",
      data: { phase: this.phase },
    };
  }

  // --- Phase Transition Methods ---
  _transitionToWaiting() {
    this.phase = GAME_PHASES.WAITING;
    this.currentWord = null;
    this.impostorId = null;
    this.playerClues.clear();
    this.votes.clear();
    this.readyPlayers.clear();
    this._clearAllTimers();
    this.phaseStartTime = null;
    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToWordShow() {
    if (this.players.size < (config.minPlayersForGame || 3)) {
      throw new Error("Not enough players to start Word Show.");
    }
    this.phase = GAME_PHASES.WORD_SHOW;
    this.selectWordAndImpostor();
    this.readyPlayers.clear();
    this._clearAllTimers();
    this.phaseStartTime = Date.now();
    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return {
      broadcast: true,
      event: "phaseChanged",
      data: {
        ...this.getClientState(),
        gameSpecificData: this.getGameStartData(),
      },
    };
  }

  _transitionToDiscussion() {
    this.phase = GAME_PHASES.DISCUSSION;
    this.playerClues.clear();
    this.readyPlayers.clear();
    this._clearAllTimers();
    this.phaseStartTime = Date.now();
    this.triggerBotActions();
    this._startPhaseTimer(GAME_PHASES.DISCUSSION, () =>
      this._transitionToVoting()
    );

    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToVoting() {
    this.phase = GAME_PHASES.VOTING;
    this.votes.clear();
    this.readyPlayers.clear();
    this._clearAllTimers();
    this.phaseStartTime = Date.now();
    this.triggerBotActions();
    this._startPhaseTimer(GAME_PHASES.VOTING, () =>
      this._transitionToResults()
    );

    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToResults() {
    this.phase = GAME_PHASES.RESULTS;
    this.readyPlayers.clear();
    this._clearAllTimers();
    this.phaseStartTime = Date.now();

    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _startPhaseTimer(phase, callback) {
    const duration = this.phaseDurations[phase];
    if (!duration) return;

    // Clear existing timer for this phase type before starting a new one
    if (phase === GAME_PHASES.DISCUSSION && this.discussionTimer)
      clearTimeout(this.discussionTimer);
    if (phase === GAME_PHASES.VOTING && this.votingTimer)
      clearTimeout(this.votingTimer);

    const timerId = setTimeout(() => {
      console.log(
        `Timer expired for phase ${phase} in game ${this.code}. Auto-transitioning.`
      );
      callback();
    }, duration);

    if (phase === GAME_PHASES.DISCUSSION) this.discussionTimer = timerId;
    else if (phase === GAME_PHASES.VOTING) this.votingTimer = timerId;
  }

  _clearAllTimers() {
    if (this.discussionTimer) clearTimeout(this.discussionTimer);
    if (this.votingTimer) clearTimeout(this.votingTimer);
    this.discussionTimer = null;
    this.votingTimer = null;
  }
  // --- End Phase Transition Methods ---

  // --- Host Actions ---
  hostEndWordShow(playerId) {
    if (!this.players.get(playerId)?.isHost)
      throw new Error("Only host can end word show phase.");
    if (this.phase !== GAME_PHASES.WORD_SHOW)
      throw new Error(`Cannot end discussion from phase: ${this.phase}`);
    console.log(`Host ${playerId} ending DISCUSSION phase.`);
    this._clearAllTimers(); 
    return this._transitionToDiscussion();
  }

  hostEndDiscussion(playerId) {
    if (!this.players.get(playerId)?.isHost)
      throw new Error("Only host can end discussion.");
    if (this.phase !== GAME_PHASES.DISCUSSION)
      throw new Error(`Cannot end discussion from phase: ${this.phase}`);
    console.log(`Host ${playerId} ending DISCUSSION phase.`);
    this._clearAllTimers(); 
    return this._transitionToVoting();
  }

  hostEndVoting(playerId) {
    if (!this.players.get(playerId)?.isHost)
      throw new Error("Only host can end voting.");
    if (this.phase !== GAME_PHASES.VOTING)
      throw new Error(`Cannot end voting from phase: ${this.phase}`);
    console.log(`Host ${playerId} ending VOTING phase.`);
    this._clearAllTimers();
    return this._transitionToResults();
  }
  // --- End Host Actions ---

  // --- Player Actions ---
  readyUp(playerId) {
    const player = this.players.get(playerId);
    if (!player) throw new Error("Player not found.");
    if (player.isBot) {
      console.log(
        `Bot ${playerId} attempted to ready up. Bots do not participate in readying.`
      );
      return;
    }

    if (
      this.phase !== GAME_PHASES.WAITING &&
      this.phase !== GAME_PHASES.WORD_SHOW &&
      this.phase !== GAME_PHASES.DISCUSSION &&
      this.phase !== GAME_PHASES.VOTING
    ) {
      throw new Error(`Cannot ready up in phase: ${this.phase}`);
    }

    if (this.readyPlayers.has(playerId)) {
      console.log(
        `Player ${playerId} has already readied up in phase ${this.phase}.`
      );
      return { broadcast: false };
    }

    this.readyPlayers.add(playerId);
    console.log(
      `Player ${playerId} readied up in phase ${this.phase}. Ready players: ${this.readyPlayers.size}`
    );

    const humanPlayers = Array.from(this.players.values()).filter(
      (p) => !p.isBot && p.isConnected
    );
    if (this.readyPlayers.size >= humanPlayers.length) {
      // Use >= for safety, though === should be sufficient
      console.log(
        `All ${humanPlayers.length} human players readied up. Ending phase ${this.phase} early.`
      );
      this._clearAllTimers();

      if (this.phase === GAME_PHASES.WORD_SHOW) {
        return this._transitionToDiscussion();
      } else if (this.phase === GAME_PHASES.DISCUSSION) {
        return this._transitionToVoting();
      } else if (this.phase === GAME_PHASES.VOTING) {
        return this._transitionToResults();
      }
    }

    return {
      broadcast: true,
      event: "playerReadiedUp",
      data: {
        playerId,
        readyCount: this.readyPlayers.size,
        totalHumanPlayers: humanPlayers.length,
        phase: this.phase,
      },
    };
  }

  getClientState(playerId = null) {
    const baseState = super.getClientState(playerId); // Gets basic player list, game code, phase, hostId, players, maxPlayers

    // Add phase-specific data
    baseState.readyPlayers = Array.from(this.readyPlayers);
    if (
      this.phaseStartTime &&
      (this.phase === GAME_PHASES.DISCUSSION ||
        this.phase === GAME_PHASES.VOTING ||
        this.phase === GAME_PHASES.WORD_SHOW)
    ) {
      const duration = this.phaseDurations[this.phase];
      const elapsed = Date.now() - this.phaseStartTime;
      baseState.timerRemaining = Math.max(
        0,
        Math.floor((duration - elapsed) / 1000)
      );
      baseState.timerDuration = Math.floor(duration / 1000);
    } else {
      baseState.timerRemaining = null;
      baseState.timerDuration = null;
    }

    if (playerId && this.phase === GAME_PHASES.WORD_SHOW && this.currentWord) {
      const isImpostor = playerId === this.impostorId;
      baseState.gameData = {
        // Player-specific data for word show
        word: isImpostor ? "Imposter" : this.currentWord.word,
        hint: this.currentWord.hint,
        isImpostor,
      };
    }

    // During DISCUSSION and VOTING (and RESULTS), clues are visible
    if (
      this.phase === GAME_PHASES.DISCUSSION ||
      this.phase === GAME_PHASES.VOTING ||
      this.phase === GAME_PHASES.RESULTS
    ) {
      baseState.clues = Array.from(this.playerClues.entries()).map(
        ([pId, clue]) => ({
          playerId: pId,
          playerName: this.players.get(pId)?.name || "Unknown",
          clue,
        })
      );
    }

    if (this.phase === GAME_PHASES.RESULTS) {
      baseState.results = this.getResults();
      baseState.votes = this.getVoteDetails(); // Send detailed votes
    }

    // Add isImpostor status for the requesting player if roles are assigned
    if (this.impostorId && playerId) {
      baseState.isImpostor = playerId === this.impostorId;
    } else {
      // Set to false or null if roles aren't assigned or playerId is null (e.g. for a general game observer if that were a feature)
      baseState.isImpostor = false;
    }

    return baseState;
  }

  getVoteDetails() {
    // Helper to get detailed vote info for results
    return Array.from(this.votes.entries()).map(([voterId, votedForId]) => ({
      voterId,
      voterName: this.players.get(voterId)?.name || "Unknown",
      votedForId,
      votedForName: this.players.get(votedForId)?.name || "Unknown",
    }));
  }

  getResults() {
    const voteCount = new Map();
    for (const votedFor of this.votes.values()) {
      voteCount.set(votedFor, (voteCount.get(votedFor) || 0) + 1);
    }

    const mostVoted = Array.from(voteCount.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      impostorId: this.impostorId,
      mostVotedId: mostVoted?.[0],
      impostorCaught: mostVoted?.[0] === this.impostorId,
      votes: Object.fromEntries(voteCount),
    };
  }

  resetGame(playerId) {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error("Only host can reset game."); // This check is good here or in handleAction

    // Centralize reset logic via _transitionToWaiting
    console.log(`Game ${this.code} is being reset by host ${playerId}.`);
    return this._transitionToWaiting();
    // _transitionToWaiting handles state clearing, timer clearing, and broadcasting.
  }
}

module.exports = WordImpostorGame;