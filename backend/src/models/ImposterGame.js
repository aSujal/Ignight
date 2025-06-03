// wordImpostorGame.js
const Game = require("./Game");
const { GAME_PHASES } = require("../config/enums");

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
    super(hostId, hostName, 'word-impostor', socketId);
    this.currentWord = null;
    this.impostorId = null;
    this.playerClues = new Map();
    this.votes = new Map();
  }

  handleAction(playerId, action, data) {
    switch (action) {
      case 'startGame':
        return this.startGame(playerId);
      case 'startRound':
        return this.startRound(playerId);
      case 'submitClue':
        return this.submitClue(playerId, data.clue);
      case 'submitVote':
        return this.submitVote(playerId, data.votedForPlayerId);
      case 'resetGame':
        return this.resetGame(playerId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  startRound(playerId){
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error('Only host can start round');
    this.phase = GAME_PHASES.CLUE_GIVING;
    return { broadcast: true, event: 'phaseChanged', data: { phase: this.phase } };
  }

  startGame(playerId) {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error('Only host can start game');
    if (this.players.size < 3) throw new Error('Need at least 3 players');

    this.phase = GAME_PHASES.WORD_REVEAL;
    this.selectWordAndImpostor();

    // setTimeout(() => {
    //   this.phase = GAME_PHASES.CLUE_GIVING;
    //   return { broadcast: true, event: 'phaseChanged', data: { phase: this.phase } };
    // }, 10000);

    return { broadcast: true, event: 'gameStarted', data: this.getGameStartData() };
  }

  selectWordAndImpostor() {
    const wordSet = WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)];
    this.currentWord = wordSet;
    
    const playerIds = Array.from(this.players.keys());
    this.impostorId = playerIds[Math.floor(Math.random() * playerIds.length)];
  }

  getGameStartData() {
    const data = {};
    for (const [playerId] of this.players) {
      data[playerId] = {
        word: playerId === this.impostorId ? "Imposter" : this.currentWord.word,
        hint: this.currentWord.hint,
        isImpostor: playerId === this.impostorId
      };
    }
    return data;
  }

  submitClue(playerId, clue) {
    if (this.phase !== GAME_PHASES.CLUE_GIVING) throw new Error('Not clue giving phase');
    
    this.playerClues.set(playerId, clue);
    
    if (this.playerClues.size === this.players.size) {
      this.phase = GAME_PHASES.VOTING;
    }

    return {
      broadcast: true,
      event: 'clueSubmitted',
      data: {
        playerId,
        playerName: this.players.get(playerId).name,
        clue,
        allSubmitted: this.playerClues.size === this.players.size
      }
    };
  }

  submitVote(playerId, votedForPlayerId) {
    if (this.phase !== GAME_PHASES.VOTING) throw new Error('Not voting phase');
    
    this.votes.set(playerId, votedForPlayerId);
    
    if (this.votes.size === this.players.size) {
      this.phase = GAME_PHASES.RESULTS;
    }

    return {
      broadcast: true,
      event: 'voteSubmitted',
      data: {
        playerId,
        allSubmitted: this.votes.size === this.players.size
      }
    };
  }

  getClientState(playerId = null) {
    const baseState = super.getClientState(playerId);
    if (playerId && this.phase === GAME_PHASES.WORD_REVEAL) {
      const isImpostor = playerId === this.impostorId;
      baseState.gameData = {
        word: isImpostor ? "Imposter" : this.currentWord.word,
        hint: this.currentWord.hint,
        isImpostor,
        playerId,
      };
    }

    if (this.phase === GAME_PHASES.CLUE_GIVING || this.phase === GAME_PHASES.VOTING) {
      baseState.clues = Array.from(this.playerClues.entries()).map(([pId, clue]) => ({
        playerId: pId,
        playerName: this.players.get(pId).name,
        clue
      }));
    }

    if (this.phase === GAME_PHASES.RESULTS) {
      baseState.results = this.getResults();
    }

    return baseState;
  }

  getResults() {
    const voteCount = new Map();
    for (const votedFor of this.votes.values()) {
      voteCount.set(votedFor, (voteCount.get(votedFor) || 0) + 1);
    }

    const mostVoted = Array.from(voteCount.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return {
      impostorId: this.impostorId,
      mostVotedId: mostVoted?.[0],
      impostorCaught: mostVoted?.[0] === this.impostorId,
      votes: Object.fromEntries(voteCount)
    };
  }

  resetGame(playerId) {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error('Only host can reset game');

    this.phase = GAME_PHASES.WAITING;
    this.currentWord = null;
    this.impostorId = null;
    this.playerClues.clear();
    this.votes.clear();

    return { broadcast: true, event: 'gameReset', data: {} };
  }
}

module.exports = WordImpostorGame;
