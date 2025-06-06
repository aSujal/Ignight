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
  constructor(hostId, hostName, socketId, numBots = 0) {
    super(hostId, hostName, 'word-impostor', socketId);
    this.currentWord = null;
    this.impostorId = null;
    this.playerClues = new Map(); // Stores clues given in DISCUSSION phase
    this.votes = new Map();
    this._addBotPlayers(numBots);

    this.readyPlayers = new Set();
    this.discussionTimer = null;
    this.votingTimer = null;
    this.wordShowTimer = null; // Ensure wordShowTimer is initialized
    this.phaseStartTime = null;
    // Store configured durations in milliseconds
    this.phaseDurations = {
      [GAME_PHASES.DISCUSSION]: config.discussionDurationSeconds * 1000,
      [GAME_PHASES.VOTING]: config.votingDurationSeconds * 1000,
      // WORD_SHOW might have a short, fixed duration or be skipped by host
      [GAME_PHASES.WORD_SHOW]: 5000, // Example: 5 seconds for word show, can be configurable too
    };
  }

  _addBotPlayers(numBots) {
    // Basic structure for adding bots
    // Initial setup of multiple bots (e.g. at game creation)
    for (let i = 0; i < numBots; i++) {
      this._createSingleBot(); // Call the new single bot creation logic
    }
  }

  // New method to create a single bot, can be called by _addBotPlayers or the new addBotPlayer action
  _createSingleBot() {
    if (this.players.size >= config.maxPlayersPerGame) {
      // This check is important here for any internal calls.
      // The addBotPlayer action will also have this check.
      console.warn(`Max players (${config.maxPlayersPerGame}) reached. Cannot add more bots.`);
      return null; // Or throw error if called from a context expecting a bot
    }

    // Find the highest existing bot number to create a unique name like Bot 1, Bot 2, etc.
    let botNum = 0;
    this.players.forEach(player => {
      if (player.isBot) {
        const match = player.name.match(/^Bot (\d+)$/);
        if (match && parseInt(match[1]) > botNum) {
          botNum = parseInt(match[1]);
        }
      }
    });
    botNum++; // Next bot number

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
      avatarStyle: 'bottts', // Assign bot-specific style
      // avatarUrl is now a getter in Player.js, it will use this avatarStyle.
      isReady: false,
    };

    // Create a temporary Player instance to access the getter, then spread it.
    // This is a bit of a workaround because the botPlayer object literal doesn't have the getter.
    // Alternatively, if Player class was imported, we could instantiate it.
    // For now, we'll rely on the structure matching what Player class would have.
    // The actual Player objects in this.players (if created by Game.addPlayer) will have the getter.
    // Since _createSingleBot is adding directly to this.players, it needs to ensure the object has all needed fields.
    // The base Player class should be used for consistency if possible, or ensure structure matches.
    // Let's assume the structure is sufficient and `getClientState` will correctly use the getter from the prototype.
    // Actually, Player objects ARE created by the base Game class's addPlayer if we call it.
    // However, _addBotPlayers and _createSingleBot currently create object literals.
    // This should be fine as long as all necessary properties are present for getClientState's mapping.
    // The Player class in Game.js defines the getter, so when getClientState maps players,
    // if player objects are plain objects, they won't have the getter.
    // This means bots added via _createSingleBot might not have their avatarUrl generated via getter.
    // Let's refine _createSingleBot to create a proper Player instance or ensure it has a concrete avatarUrl.

    // To ensure bots have a concrete avatarUrl consistent with Player class logic:
    const tempBotPlayer = { ...botPlayer }; // temporary to avoid direct modification before logging
    tempBotPlayer.avatarUrl = `https://api.dicebear.com/8.x/${tempBotPlayer.avatarStyle}/svg?seed=${encodeURIComponent(botId)}`;


    this.players.set(botId, tempBotPlayer); // Store the bot object with concrete avatarUrl
    console.log(`Bot ${botName} (ID: ${botId}) added to game ${this.code}. Total players: ${this.players.size}`);
    return botPlayer;
  }

  addBotPlayer(actingPlayerId) {
    const actor = this.players.get(actingPlayerId);
    if (!actor || !actor.isHost) {
      throw new Error("Only the host can add bot players.");
    }
    if (this.phase !== GAME_PHASES.WAITING) {
      throw new Error("Bots can only be added during the WAITING phase.");
    }
    if (this.players.size >= config.maxPlayersPerGame) {
      throw new Error(`Cannot add bot: Game is full (max ${config.maxPlayersPerGame} players).`);
    }

    const newBot = this._createSingleBot();
    if (!newBot) {
        // Should not happen if max player check above is correct, but as a safeguard
        throw new Error("Failed to create bot, possibly due to reaching max player limit unexpectedly.");
    }

    // The game state will be broadcast by the game handler after any successful action
    // We can return an event specific to bot joining if needed by client for special handling,
    // but a general gameStateUpdate is usually sufficient.
    return { broadcast: true, event: 'playerJoined', data: { newPlayer: newBot, gameCode: this.code } };
    // Or simply return { broadcast: true } and rely on the generic game state update.
    // Let's go with a more specific event if the client wants to react to "bot added" differently.
    // However, the standard is to just send the new game state.
    // For now, let's assume the generic handler will send the full game state.
    // So, the specific data for 'playerJoined' might be redundant if the full state is sent.
    // Let's simplify: the action succeeds, and the handler will broadcast the new state.
    return { broadcast: true }; // Signal that game state changed and needs broadcasting
  }


  handleAction(playerId, action, data) {
    switch (action) {
      case 'startGame':
        return this.startGame(playerId);
      // 'startRound' might be deprecated or change meaning; phase transitions will be more explicit
      // case 'startRound':
      //   return this.startRound(playerId);
      case 'submitClue': // This action remains, happens during DISCUSSION phase
        return this.submitClue(playerId, data.clue);
      case 'submitVote': // This action remains, happens during VOTING phase
        return this.submitVote(playerId, data.votedForPlayerId);
      case 'readyUp':
        return this.readyUp(playerId);
      case 'hostSkipWordShow':
        return this.hostSkipWordShow(playerId);
      case 'hostEndDiscussion':
        return this.hostEndDiscussion(playerId);
      case 'hostEndVoting':
        return this.hostEndVoting(playerId);
      case 'resetGame':
        return this.resetGame(playerId);
      case 'addBot': // New action
        return this.addBotPlayer(playerId);
      case 'changeAvatarStyle':
        return this.changeAvatarStyle(playerId, data.style);
      default:
        console.warn(`Unknown action: ${action} by player ${playerId}`);
        throw new Error(`Unknown action: ${action}`);
    }
  }

  changeAvatarStyle(playerId, newStyle) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found.");
    }
    if (player.isBot) {
      throw new Error("Bots cannot change their avatar style.");
    }

    if (!config.availableAvatarStyles.includes(newStyle)) {
      throw new Error(`Invalid avatar style: ${newStyle}.`);
    }

    player.avatarStyle = newStyle;
    // The avatarUrl will be automatically updated by the getter in the Player class (Game.js)
    console.log(`Player ${playerId} changed avatar style to ${newStyle}. New URL: ${player.avatarUrl}`);

    return { broadcast: true }; // Signal game state change
  }

  // startRound is effectively replaced by explicit phase transition methods.
  // For example, after WORD_SHOW, the game auto-transitions or host skips to DISCUSSION.
  // I will remove startRound or repurpose it if needed later. For now, commenting out.
  /*
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
    //   // Potentially trigger bot clues here if phase directly changes
    //   this.triggerBotActions();
    //   return { broadcast: true, event: 'phaseChanged', data: { phase: this.phase } };
    // }, 10000);
    // Note: Bots will submit clues when 'startRound' is called, which sets CLUE_GIVING phase.
    // Or if startGame directly goes to CLUE_GIVING, bots should act.
    // For now, startRound is the primary trigger for clue giving.

    // return { broadcast: true, event: 'gameStarted', data: this.getGameStartData() };
    // startGame will now call a phase transition method.
    return this._transitionToWordShow();
  }

  selectWordAndImpostor() {
    const wordSet = WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)];
    this.currentWord = wordSet;

    const playerIds = Array.from(this.players.keys());
    if (playerIds.length === 0) {
      console.error("Attempted to select word and imposter with no players in the game.");
      throw new Error("No players to select imposter from.");
    }
    this.impostorId = playerIds[Math.floor(Math.random() * playerIds.length)];
    console.log(`Imposter selected: ${this.impostorId}. Word: ${this.currentWord.word}, Hint: ${this.currentWord.hint}`);
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
    if (this.phase !== GAME_PHASES.DISCUSSION) {
      throw new Error(`Cannot submit clue in phase: ${this.phase}. Must be in DISCUSSION phase.`);
    }
    if (this.playerClues.has(playerId)) {
      // Potentially allow clue changing, or forbid it. For now, forbid.
      throw new Error(`Player ${playerId} has already submitted a clue this round.`);
    }
    
    this.playerClues.set(playerId, clue);
    
    const humanPlayersCount = Array.from(this.players.values()).filter(p => !p.isBot && p.isConnected).length;
    const humanCluesCount = Array.from(this.playerClues.keys())
                               .filter(id => !this.players.get(id)?.isBot)
                               .length;
    // Phase transition is handled by timer, readyUp, or host action.
    // This broadcast informs clients about the new clue.
    return {
      broadcast: true,
      event: 'clueSubmitted',
      data: {
        playerId,
        playerName: this.players.get(playerId)?.name || 'Unknown Player',
        clue,
        allHumanCluesSubmitted: humanCluesCount === humanPlayersCount // For UI indication
      }
    };
  }

  submitVote(playerId, votedForPlayerId) {
    if (this.phase !== GAME_PHASES.VOTING) {
      throw new Error(`Cannot submit vote in phase: ${this.phase}. Must be in VOTING phase.`);
    }
    if (!this.players.has(votedForPlayerId)) {
      throw new Error('Voted for player does not exist.');
    }
    if (this.votes.has(playerId)) {
      // Potentially allow vote changing, or forbid it. For now, forbid.
      throw new Error(`Player ${playerId} has already voted this round.`);
    }
    
    this.votes.set(playerId, votedForPlayerId);

    // Phase transition is handled by timer, readyUp, or host action.
    // This broadcast informs clients about who has voted (anonymously or not, depending on game design).
    // For now, just confirm vote; client state will have full list at phase end.
    return {
      broadcast: true,
      event: 'voteSubmitted', // Client can use this to show "Player X has voted"
      data: {
        playerId, // Let clients know who voted
        // allVotesSubmitted: this.votes.size === Array.from(this.players.values()).filter(p => p.isConnected).length // For UI
      }
    };
  }

  triggerBotActions() {
    if (this.phase === GAME_PHASES.DISCUSSION) { // Updated phase
      this.players.forEach(player => {
        if (player.isBot && player.isConnected && !this.playerClues.has(player.id)) {
          this._botSubmitClue(player.id);
        }
      });
    } else if (this.phase === GAME_PHASES.VOTING) {
      this.players.forEach(player => {
        if (player.isBot && player.isConnected && !this.votes.has(player.id)) {
          this._botSubmitVote(player.id);
        }
      });
    }
  }

  _botSubmitClue(botId) {
    const bot = this.players.get(botId);
    if (!bot || !bot.isBot || this.phase !== GAME_PHASES.DISCUSSION || this.playerClues.has(botId)) { // Updated phase
      return;
    }

    let clue;
    const isImposter = this.impostorId === botId;

    if (isImposter) {
      clue = this.currentWord?.hint ? `It's something about ${this.currentWord.hint}` : "I am not sure";
    } else {
      clue = this.currentWord?.word ? `My clue is ${this.currentWord.word.charAt(0)}...` : "A specific thing";
    }
    const randomPhrases = ["Perhaps", "Maybe", "I think", "Could it be", "What about"];
    clue = `${randomPhrases[Math.floor(Math.random() * randomPhrases.length)]} ${clue}.`;

    console.log(`Bot ${bot.name} submitting clue: ${clue} (Imposter: ${isImposter})`);
    // Call the main submitClue method. It handles broadcasting and phase changes.
    this.submitClue(botId, clue);
  }

  _botSubmitVote(botId) {
    const bot = this.players.get(botId);
    if (!bot || !bot.isBot || this.phase !== GAME_PHASES.VOTING || this.votes.has(botId)) {
      return;
    }

    const potentialTargets = Array.from(this.players.values())
      .filter(p => p.isConnected && p.id !== botId) // Bots can vote for other bots or humans
      .map(p => p.id);

    if (potentialTargets.length === 0) {
      console.warn(`Bot ${bot.name} has no one to vote for.`);
      return;
    }

    const votedForPlayerId = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];

    console.log(`Bot ${bot.name} voting for player: ${votedForPlayerId}`);
    // Call the main submitVote method. It handles broadcasting and phase changes.
    this.submitVote(botId, votedForPlayerId);
  }

  // Modify startRound to trigger bot clue submission - This will be handled by new phase transition logic
  // startRound(playerId){
  //   const player = this.players.get(playerId);
  //   if (!player?.isHost) throw new Error('Only host can start round');
  //   this.phase = GAME_PHASES.DISCUSSION; // New phase name
  //   this.triggerBotActions(); // Make bots submit clues
  //   return { broadcast: true, event: 'phaseChanged', data: { phase: this.phase } };
  // }

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
    // No bots actions needed in WAITING phase specifically from transition
    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return { broadcast: true, event: 'phaseChanged', data: this.getClientState() };
  }

  _transitionToWordShow() {
    if (this.players.size < (config.minPlayersForGame || 3)) { // Assuming a min players config or default
      throw new Error('Not enough players to start Word Show.');
    }
    this.phase = GAME_PHASES.WORD_SHOW;
    this.selectWordAndImpostor(); // Sets currentWord and impostorId
    this.readyPlayers.clear();
    this._clearAllTimers(); // Clear any previous timers
    this.phaseStartTime = Date.now();

    // Auto-transition from WORD_SHOW to DISCUSSION after a delay
    this._startPhaseTimer(GAME_PHASES.WORD_SHOW, () => this._transitionToDiscussion());

    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    // getGameStartData() provides player-specific word/imposter status
    return { broadcast: true, event: 'phaseChanged', data: { ...this.getClientState(), gameSpecificData: this.getGameStartData() }};
  }

  _transitionToDiscussion() {
    this.phase = GAME_PHASES.DISCUSSION;
    this.playerClues.clear(); // Clear clues from any previous round, if applicable
    this.readyPlayers.clear();
    this._clearAllTimers();
    this.phaseStartTime = Date.now();

    this._startPhaseTimer(GAME_PHASES.DISCUSSION, () => this._transitionToVoting());
    this.triggerBotActions(); // Bots submit clues at the start of discussion

    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return { broadcast: true, event: 'phaseChanged', data: this.getClientState() };
  }

  _transitionToVoting() {
    this.phase = GAME_PHASES.VOTING;
    this.votes.clear(); // Clear votes from any previous round
    this.readyPlayers.clear();
    this._clearAllTimers();
    this.phaseStartTime = Date.now();

    this._startPhaseTimer(GAME_PHASES.VOTING, () => this._transitionToResults());
    this.triggerBotActions(); // Bots submit votes at the start of voting

    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return { broadcast: true, event: 'phaseChanged', data: this.getClientState() };
  }

  _transitionToResults() {
    this.phase = GAME_PHASES.RESULTS;
    this.readyPlayers.clear(); // Not typically used in results but good practice
    this._clearAllTimers();
    this.phaseStartTime = Date.now(); // Or null, as results might not be timed

    // Results are calculated on demand by getClientState or getResults
    console.log(`Game ${this.code} transitioning to ${this.phase}`);
    return { broadcast: true, event: 'phaseChanged', data: this.getClientState() };
  }

  _startPhaseTimer(phase, callback) {
    const duration = this.phaseDurations[phase];
    if (!duration) return;

    // Clear existing timer for this phase type before starting a new one
    if (phase === GAME_PHASES.DISCUSSION && this.discussionTimer) clearTimeout(this.discussionTimer);
    if (phase === GAME_PHASES.VOTING && this.votingTimer) clearTimeout(this.votingTimer);
    if (phase === GAME_PHASES.WORD_SHOW && this.wordShowTimer) clearTimeout(this.wordShowTimer);


    const timerId = setTimeout(() => {
      console.log(`Timer expired for phase ${phase} in game ${this.code}. Auto-transitioning.`);
      callback();
      // After callback, it's good to emit an event that the game state has changed due to timer
      // This is usually handled by the callback itself returning a broadcast object
      // For now, the callback (e.g., _transitionToVoting) handles broadcasting.
    }, duration);

    if (phase === GAME_PHASES.DISCUSSION) this.discussionTimer = timerId;
    else if (phase === GAME_PHASES.VOTING) this.votingTimer = timerId;
    else if (phase === GAME_PHASES.WORD_SHOW) this.wordShowTimer = timerId; // Need to define this.wordShowTimer
  }

  _clearAllTimers() {
    if (this.wordShowTimer) clearTimeout(this.wordShowTimer);
    if (this.discussionTimer) clearTimeout(this.discussionTimer);
    if (this.votingTimer) clearTimeout(this.votingTimer);
    this.wordShowTimer = null;
    this.discussionTimer = null;
    this.votingTimer = null;
  }

  // --- End Phase Transition Methods ---

  // --- Host Actions ---
  hostSkipWordShow(playerId) {
    if (!this.players.get(playerId)?.isHost) throw new Error('Only host can skip word show.');
    if (this.phase !== GAME_PHASES.WORD_SHOW) throw new Error(`Cannot skip word show from phase: ${this.phase}`);
    console.log(`Host ${playerId} skipping WORD_SHOW phase.`);
    this._clearAllTimers(); // Clear word show timer
    return this._transitionToDiscussion();
  }

  hostEndDiscussion(playerId) {
    if (!this.players.get(playerId)?.isHost) throw new Error('Only host can end discussion.');
    if (this.phase !== GAME_PHASES.DISCUSSION) throw new Error(`Cannot end discussion from phase: ${this.phase}`);
    console.log(`Host ${playerId} ending DISCUSSION phase.`);
    this._clearAllTimers(); // Clear discussion timer
    return this._transitionToVoting();
  }

  hostEndVoting(playerId) {
    if (!this.players.get(playerId)?.isHost) throw new Error('Only host can end voting.');
    if (this.phase !== GAME_PHASES.VOTING) throw new Error(`Cannot end voting from phase: ${this.phase}`);
    console.log(`Host ${playerId} ending VOTING phase.`);
    this._clearAllTimers(); // Clear voting timer
    return this._transitionToResults();
  }
  // --- End Host Actions ---

  // --- Player Actions ---
  readyUp(playerId) {
    const player = this.players.get(playerId);
    if (!player) throw new Error('Player not found.');
    if (player.isBot) {
      console.log(`Bot ${playerId} attempted to ready up. Bots do not participate in readying.`);
      return; // Bots don't use ready up, or return a non-broadcasting object
    }

    if (this.phase !== GAME_PHASES.WORD_SHOW &&
        this.phase !== GAME_PHASES.DISCUSSION &&
        this.phase !== GAME_PHASES.VOTING) {
      throw new Error(`Cannot ready up in phase: ${this.phase}`);
    }

    if (this.readyPlayers.has(playerId)) {
      console.log(`Player ${playerId} has already readied up in phase ${this.phase}.`);
      // Optionally, allow un-readying, but for now, it's a one-way action per phase.
      return { broadcast: false }; // No change, no broadcast needed.
    }

    this.readyPlayers.add(playerId);
    console.log(`Player ${playerId} readied up in phase ${this.phase}. Ready players: ${this.readyPlayers.size}`);

    const humanPlayers = Array.from(this.players.values()).filter(p => !p.isBot && p.isConnected);
    if (this.readyPlayers.size >= humanPlayers.length) { // Use >= for safety, though === should be sufficient
      console.log(`All ${humanPlayers.length} human players readied up. Ending phase ${this.phase} early.`);
      this._clearAllTimers();

      if (this.phase === GAME_PHASES.WORD_SHOW) {
        return this._transitionToDiscussion();
      } else if (this.phase === GAME_PHASES.DISCUSSION) {
        return this._transitionToVoting();
      } else if (this.phase === GAME_PHASES.VOTING) {
        return this._transitionToResults();
      }
    }

    // If not all ready, just acknowledge the ready up. The game state update will propagate readyPlayers.
    return { broadcast: true, event: 'playerReadiedUp', data: { playerId, readyCount: this.readyPlayers.size, totalHumanPlayers: humanPlayers.length, phase: this.phase } };
  }
  // --- End Player Actions ---


  getClientState(playerId = null) {
    const baseState = super.getClientState(playerId); // Gets basic player list, game code, phase, hostId, players, maxPlayers, availableAvatarStyles

    // Add phase-specific data
    baseState.readyPlayers = Array.from(this.readyPlayers);
    if (this.phaseStartTime && (this.phase === GAME_PHASES.DISCUSSION || this.phase === GAME_PHASES.VOTING || this.phase === GAME_PHASES.WORD_SHOW)) {
      const duration = this.phaseDurations[this.phase];
      const elapsed = Date.now() - this.phaseStartTime;
      baseState.timerRemaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
      baseState.timerDuration = Math.floor(duration / 1000);
    } else {
      baseState.timerRemaining = null;
      baseState.timerDuration = null;
    }

    if (playerId && this.phase === GAME_PHASES.WORD_SHOW && this.currentWord) {
      const isImpostor = playerId === this.impostorId;
      baseState.gameData = { // Player-specific data for word show
        word: isImpostor ? "Imposter" : this.currentWord.word,
        hint: this.currentWord.hint,
        isImpostor,
      };
    }

    // During DISCUSSION and VOTING (and RESULTS), clues are visible
    if (this.phase === GAME_PHASES.DISCUSSION || this.phase === GAME_PHASES.VOTING || this.phase === GAME_PHASES.RESULTS) {
      baseState.clues = Array.from(this.playerClues.entries()).map(([pId, clue]) => ({
        playerId: pId,
        playerName: this.players.get(pId)?.name || 'Unknown',
        clue
      }));
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

  getVoteDetails() { // Helper to get detailed vote info for results
    return Array.from(this.votes.entries()).map(([voterId, votedForId]) => ({
      voterId,
      voterName: this.players.get(voterId)?.name || 'Unknown',
      votedForId,
      votedForName: this.players.get(votedForId)?.name || 'Unknown',
    }));
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
    if (!player?.isHost) throw new Error('Only host can reset game.'); // This check is good here or in handleAction

    // Centralize reset logic via _transitionToWaiting
    console.log(`Game ${this.code} is being reset by host ${playerId}.`);
    return this._transitionToWaiting();
    // _transitionToWaiting handles state clearing, timer clearing, and broadcasting.
  }
}

module.exports = WordImpostorGame;
