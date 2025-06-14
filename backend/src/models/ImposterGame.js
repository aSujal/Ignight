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

    // Phase durations (in milliseconds)
    this.phaseDurations = {
      [GAME_PHASES.DISCUSSION]: config.discussionDurationSeconds * 1000,
      [GAME_PHASES.VOTING]: config.votingDurationSeconds * 1000,
      [GAME_PHASES.WORD_SHOW]: 5000,
    };
  }

  _handleGameSpecificAction(playerId, action, data) {
    switch (action) {
      case "startGame":
        return this.startGame(playerId);
      case "submitClue": // This action remains, happens during DISCUSSION phase
        return this.submitClue(playerId, data.clue);
      case "submitVote": // This action remains, happens during VOTING phase
        return this.submitVote(playerId, data.votedForPlayerId);
      case "hostEndDiscussion":
        return this.hostEndDiscussion(playerId);
      case "hostEndVoting":
        return this.hostEndVoting(playerId);
      case "resetGame":
        return this.resetGame(playerId);
      default:
        console.warn(`Unknown action: ${action} by player ${playerId}`);
        throw new Error(`Unknown action: ${action}`);
    }
  }

  _handleAllPlayersReady() {
    this._clearAllTimers();

    if (this.phase === GAME_PHASES.WAITING) {
      return this._transitionToWordShow();
    } else if (this.phase === GAME_PHASES.WORD_SHOW) {
      return this._transitionToDiscussion();
    } else if (this.phase === GAME_PHASES.DISCUSSION) {
      return this._transitionToVoting();
    } else if (this.phase === GAME_PHASES.VOTING) {
      return this._transitionToResults();
    }
  }

  _getPhaseTimer() {
    const duration = this.phaseDurations[this.phase];
    return duration ? { duration } : null;
  }

  startGame(playerId) {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error("Only host can start game");
    if (this.players.size < 3) throw new Error("Need at least 3 players");
    if (this.readyPlayers.size < this.players.size - this.bots.size)
      throw new Error("All players must be ready to start the game");

    return this._transitionToWordShow();
  }

  selectWordAndImpostor() {
    const wordSet = WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)];
    this.currentWord = wordSet;

    const playerIds = Array.from(this.players.keys());
    if (playerIds.length === 0) {
      throw new Error("No players to select imposter from.");
    }

    this.impostorId = playerIds[Math.floor(Math.random() * playerIds.length)];
    console.log(
      `Imposter selected: ${this.impostorId}. Word: ${this.currentWord.word}, Hint: ${this.currentWord.hint}`
    );
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

  _transitionToWordShow() {
    if (this.players.size < (config.minPlayersForGame || 3)) {
      throw new Error("Not enough players to start Word Show.");
    }
    this._setPhase(GAME_PHASES.WORD_SHOW);
    this.selectWordAndImpostor();
    this._startTimer(
      "wordShow",
      this.phaseDurations[GAME_PHASES.WORD_SHOW],
      () => this._transitionToDiscussion()
    );
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
    this._setPhase(GAME_PHASES.DISCUSSION);
    this.playerClues.clear();
    this.triggerBotActions();
    this._startTimer(
      "discussion",
      this.phaseDurations[GAME_PHASES.DISCUSSION],
      () => this._transitionToVoting()
    );
    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToVoting() {
    this._setPhase(GAME_PHASES.VOTING);
    this.votes.clear();
    this.triggerBotActions();
    this._startTimer("voting", this.phaseDurations[GAME_PHASES.VOTING], () =>
      this._transitionToResults()
    );
    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToResults() {
    this._setPhase(GAME_PHASES.RESULTS);
    this._clearAllTimers();

    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToWaiting() {
    this._setPhase(GAME_PHASES.WAITING);
    this.currentWord = null;
    this.impostorId = null;
    this.playerClues.clear();
    this.votes.clear();
    this._clearAllTimers();

    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
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

  resetGame(playerId) {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error("Only host can reset game.");

    console.log(`Game ${this.code} is being reset by host ${playerId}.`);
    return this._transitionToWaiting();
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

  getVoteDetails() {
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

    const mostVoted = Array.from(voteCount.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      impostorId: this.impostorId,
      mostVotedId: mostVoted?.[0],
      impostorCaught: mostVoted?.[0] === this.impostorId,
      votes: Object.fromEntries(voteCount),
    };
  }

  getClientState(playerId = null) {
    const baseState = super.getClientState(playerId);

    // Add word reveal data for specific player during WORD_SHOW
    if (playerId && this.phase === GAME_PHASES.WORD_SHOW && this.currentWord) {
      const isImpostor = playerId === this.impostorId;
      baseState.gameData = {
        word: isImpostor ? "Imposter" : this.currentWord.word,
        hint: this.currentWord.hint,
        isImpostor,
      };
    }

    // Add clues during discussion, voting, and results
    if ([GAME_PHASES.DISCUSSION, GAME_PHASES.VOTING, GAME_PHASES.RESULTS].includes(this.phase)) {
      baseState.clues = Array.from(this.playerClues.entries()).map(([pId, clue]) => ({
        playerId: pId,
        playerName: this.players.get(pId)?.name || "Unknown",
        clue,
      }));
    }

    // Add results data
    if (this.phase === GAME_PHASES.RESULTS) {
      baseState.results = this.getResults();
      baseState.votes = this.getVoteDetails();
    }

    // Add impostor status for requesting player
    if (this.impostorId && playerId) {
      baseState.isImpostor = playerId === this.impostorId;
    } else {
      baseState.isImpostor = false;
    }

    return baseState;
  }
}

module.exports = WordImpostorGame;