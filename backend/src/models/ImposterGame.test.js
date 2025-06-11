const WordImpostorGame = require('./ImposterGame');
const { GAME_PHASES } = require('../config/enums');
const config = require('../config/config');

// Mock the config module
jest.mock('../config/config', () => ({
  // Provide default mock values, these can be overridden in tests if needed
  discussionDurationSeconds: 30, // Short duration for testing
  votingDurationSeconds: 20,    // Short duration for testing
  gameCodeLength: 6,
  maxPlayersPerGame: 10,
  // Add any other config values used by ImposterGame or its parent Game class
  // For example, if Game.js uses minPlayersForGame from config:
  minPlayersForGame: 3,
}));

// Mock the base Game class if necessary, or specific methods
// For now, we'll try to test ImposterGame as a whole unit.
// If Game.js constructor or methods cause issues (e.g. complex external dependencies),
// we might need to mock it.
// jest.mock('./Game', () => {
//   return jest.fn().mockImplementation((hostId, hostName, gameType, socketId) => {
//     return {
//       code: 'TESTGR',
//       type: gameType,
//       phase: GAME_PHASES.WAITING,
//       players: new Map(),
//       hostId: hostId,
//       createdAt: new Date(),
//       addPlayer: jest.fn((id, name, sid, isHost) => {
//         const player = { id, name, socketId: sid, isHost, isConnected: true, isBot: false, avatarUrl: `https://api.dicebear.com/8.x/micah/svg?seed=${id}` };
//         this.players.set(id, player);
//         return player;
//       }),
//       generateCode: jest.fn().mockReturnValue('TESTGR'),
//       // Mock other Game methods used by ImposterGame if they cause trouble
//     };
//   });
// });


describe('WordImpostorGame', () => {
  let game;
  const hostId = 'host123';
  const hostName = 'HostPlayer';
  const hostSocketId = 'socketHost';

  const player1Id = 'player1';
  const player1Name = 'PlayerOne';
  const player1SocketId = 'socket1';

  const player2Id = 'player2';
  const player2Name = 'PlayerTwo';
  const player2SocketId = 'socket2';

  const player3Id = 'player3';
  const player3Name = 'PlayerThree';
  const player3SocketId = 'socket3';


  beforeEach(() => {
    // Reset and re-initialize game before each test
    // The mocked config will be used here
    game = new WordImpostorGame(hostId, hostName, hostSocketId);
    // Add a few more players for common test scenarios
    game.addPlayer(player1Id, player1Name, player1SocketId);
    game.addPlayer(player2Id, player2Name, player2SocketId);
    // Player 3 is added in some tests that need more players
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
    jest.useRealTimers(); // Restore real timers
  });

  describe('Initialization and Player Management', () => {
    it('should initialize with WAITING phase and host player', () => {
      expect(game.phase).toBe(GAME_PHASES.WAITING);
      expect(game.players.size).toBe(3); // Host + 2 players from beforeEach
      const hostPlayer = game.players.get(hostId);
      expect(hostPlayer).toBeDefined();
      expect(hostPlayer.isHost).toBe(true);
      expect(hostPlayer.name).toBe(hostName);
      expect(hostPlayer.avatarUrl).toBeDefined();
    });

    it('should add players correctly', () => {
      game.addPlayer(player3Id, player3Name, player3SocketId);
      expect(game.players.size).toBe(4);
      const newPlayer = game.players.get(player3Id);
      expect(newPlayer).toBeDefined();
      expect(newPlayer.name).toBe(player3Name);
      expect(newPlayer.isBot).toBe(false); // Explicitly from Game.js's Player class
      expect(newPlayer.avatarUrl).toBeDefined();
    });

    it('should add bot players via constructor', () => {
      // Create a new game with bots
      const gameWithBots = new WordImpostorGame(hostId, hostName, hostSocketId, 2); // 1 host + 2 bots
      expect(gameWithBots.players.size).toBe(3); // Host + 2 bots
      let botCount = 0;
      gameWithBots.players.forEach(player => {
        if (player.isBot) {
          botCount++;
          expect(player.avatarUrl).toBeDefined();
          expect(player.socketId).toBeNull(); // Bots don't have sockets
        }
      });
      expect(botCount).toBe(2);
    });
  });

  // More describe blocks for phases, actions, bot logic, edge cases will follow
  // For example:
  describe('Game Start and WORD_SHOW Phase', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    it('should not start game with insufficient players (less than 3)', () => {
        const gameSmall = new WordImpostorGame(hostId, hostName, hostSocketId); // Only host
        gameSmall.addPlayer(player1Id, player1Name, player1SocketId); // Host + 1 player = 2
        expect(() => gameSmall.startGame(hostId)).toThrow('Not enough players to start');
    });

    it('startGame action should transition to WORD_SHOW and set game data', () => {
        // Ensure enough players (host + player1 + player2 = 3)
        const actionResult = game.startGame(hostId);

        expect(actionResult.broadcast).toBe(true);
        expect(actionResult.event).toBe('phaseChanged');
        expect(game.phase).toBe(GAME_PHASES.WORD_SHOW);
        expect(game.currentWord).toBeDefined();
        expect(game.impostorId).toBeDefined();

        const gameSpecificData = actionResult.data.gameSpecificData;
        expect(gameSpecificData).toBeDefined();

        let imposterCount = 0;
        let nonImposterWordCount = 0;

        game.players.forEach(player => {
            const playerData = gameSpecificData[player.id];
            expect(playerData).toBeDefined();
            expect(playerData.hint).toBe(game.currentWord.hint);
            if (player.id === game.impostorId) {
                expect(playerData.word).toBe('Imposter');
                expect(playerData.isImpostor).toBe(true);
                imposterCount++;
            } else {
                expect(playerData.word).toBe(game.currentWord.word);
                expect(playerData.isImpostor).toBe(false);
                nonImposterWordCount++;
            }
        });
        expect(imposterCount).toBe(1);
        expect(nonImposterWordCount).toBe(game.players.size - 1);

        // Check for timer auto-transition to DISCUSSION
        expect(game.wordShowTimer).toBeDefined(); // Timer should be set

        // Advance timer to trigger transition from WORD_SHOW to DISCUSSION
        // The duration is mocked in config to 5000ms (default for WORD_SHOW in ImposterGame.js)
        // or can be explicitly set if WORD_SHOW duration in phaseDurations is also mocked/overridden.
        // For now, assume phaseDurations[GAME_PHASES.WORD_SHOW] is 5000
        jest.advanceTimersByTime(game.phaseDurations[GAME_PHASES.WORD_SHOW] + 100); // Advance by its duration

        // This part of the test will be more effective when _transitionToDiscussion is also tested
        // For now, we only check if the timer was set. The actual transition check will be in phase transition tests.
        // expect(game.phase).toBe(GAME_PHASES.DISCUSSION); // This would be ideal but depends on callback execution
    });

    it('hostSkipWordShow action should transition to DISCUSSION', () => {
        game.startGame(hostId); // Move to WORD_SHOW
        expect(game.phase).toBe(GAME_PHASES.WORD_SHOW);

        const actionResult = game.hostSkipWordShow(hostId);
        expect(actionResult.broadcast).toBe(true);
        expect(game.phase).toBe(GAME_PHASES.DISCUSSION);
        expect(game.wordShowTimer).toBeNull(); // Timer should be cleared
    });

    it('hostSkipWordShow should fail if not host', () => {
        game.startGame(hostId); // Move to WORD_SHOW
        expect(() => game.hostSkipWordShow(player1Id)).toThrow('Only host can skip word show.');
    });

     it('hostSkipWordShow should fail if not in WORD_SHOW phase', () => {
        expect(game.phase).toBe(GAME_PHASES.WAITING); // Initial phase
        expect(() => game.hostSkipWordShow(hostId)).toThrow('Cannot skip word show from phase: waiting');
    });

  });

  // TODO: Add more describe blocks for DISCUSSION, VOTING, RESULTS phases,
  // clue/vote submission, readyUp, host controls for other phases,
  // bot actions, and other edge cases.

  describe('DISCUSSION Phase', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Ensure game is in DISCUSSION phase before these tests
      // Host + player1 + player2 are in the game from outer beforeEach
      game.startGame(hostId); // Moves to WORD_SHOW
      // Advance timer or skip to get to DISCUSSION
      jest.advanceTimersByTime(game.phaseDurations[GAME_PHASES.WORD_SHOW] + 100);
      // Verify we are in DISCUSSION phase
      expect(game.phase).toBe(GAME_PHASES.DISCUSSION);
      // Player clues and readyPlayers should be clear at the start of DISCUSSION
      expect(game.playerClues.size).toBe(0);
      expect(game.readyPlayers.size).toBe(0);
    });

    it('should auto-transition from WORD_SHOW to DISCUSSION after timer', () => {
        // This test's core logic is covered by the beforeEach setup of this describe block.
        // We re-initialize a game and test its transition explicitly here for clarity.
        const freshGame = new WordImpostorGame(hostId, hostName, hostSocketId);
        freshGame.addPlayer(player1Id, player1Name, player1SocketId);
        freshGame.addPlayer(player2Id, player2Name, player2SocketId);

        freshGame.startGame(hostId);
        expect(freshGame.phase).toBe(GAME_PHASES.WORD_SHOW);
        expect(freshGame.wordShowTimer).not.toBeNull();

        const wordShowDuration = freshGame.phaseDurations[GAME_PHASES.WORD_SHOW];
        jest.advanceTimersByTime(wordShowDuration + 10); // Advance past timer

        expect(freshGame.phase).toBe(GAME_PHASES.DISCUSSION);
        expect(freshGame.discussionTimer).not.toBeNull(); // Discussion timer should start
        expect(freshGame.wordShowTimer).toBeNull(); // Word show timer should be cleared
    });

    it('bots should submit clues upon entering DISCUSSION phase', () => {
        const gameWithBots = new WordImpostorGame(hostId, hostName, hostSocketId, 1); // Host, 1 Bot
        gameWithBots.addPlayer(player1Id, player1Name, player1SocketId); // Add one more human player

        gameWithBots.startGame(hostId); // To WORD_SHOW
        jest.advanceTimersByTime(gameWithBots.phaseDurations[GAME_PHASES.WORD_SHOW] + 10); // To DISCUSSION

        expect(gameWithBots.phase).toBe(GAME_PHASES.DISCUSSION);

        let botClueSubmitted = false;
        gameWithBots.players.forEach(player => {
            if (player.isBot) {
                expect(gameWithBots.playerClues.has(player.id)).toBe(true);
                botClueSubmitted = true;
            }
        });
        expect(botClueSubmitted).toBe(true);
        // Also check that it transitions to VOTING if only bots and all clues (theirs) are in.
        // This depends on how submitClue handles phase transition with bots.
        // Current submitClue doesn't auto-transition based on bot clues alone.
    });

    it('should allow players to submit clues during DISCUSSION', () => {
      const clueText = "TestClue";
      const actionResult = game.submitClue(player1Id, clueText);

      expect(game.playerClues.get(player1Id)).toBe(clueText);
      expect(actionResult.broadcast).toBe(true);
      expect(actionResult.event).toBe('clueSubmitted');
      expect(actionResult.data.playerId).toBe(player1Id);
      expect(actionResult.data.clue).toBe(clueText);
    });

    it('should not allow submitting clues outside DISCUSSION phase', () => {
      game.phase = GAME_PHASES.WAITING; // Set to a different phase
      expect(() => game.submitClue(player1Id, "LateClue")).toThrow('Cannot submit clue in phase: waiting');
    });

    it('should track ready players and transition to VOTING if all humans ready up', () => {
      // game has host, player1, player2 (all human)
      // Imposter does not submit a clue through submitClue usually, so they might be able to ready up differently.
      // For this test, assume all human players (including imposter) must submit a clue to ready up,
      // or that the isImpostor check in canPlayerReady works.
      // Let's make player1 the imposter for this test for clarity on canPlayerReady
      game.impostorId = player1Id;
      // (In a real game, isImpostor would be set in game.gameData by WordImpostorGame)
      // Simulate gameData for isImpostor check in canPlayerReady (if WordImpostorGame.DISCUSSION checks it)
      // This part is tricky as game.gameData is not usually set directly like this.
      // Let's assume for now `canPlayerReady` in WordImpostorGame relies on `hasSubmittedClue` primarily for non-imposters
      // and imposters can ready up without submitting a normal clue.
      // To simplify test, ensure all players submit clues.

      game.submitClue(hostId, "HostClue");
      game.submitClue(player1Id, "Player1Clue_ImposterSpecialMaybe"); // Imposter might submit a fake clue
      game.submitClue(player2Id, "Player2Clue");

      game.readyUp(hostId);
      expect(game.readyPlayers.has(hostId)).toBe(true);
      expect(game.phase).toBe(GAME_PHASES.DISCUSSION); // Not all ready yet

      game.readyUp(player2Id);
      expect(game.readyPlayers.has(player2Id)).toBe(true);
      expect(game.phase).toBe(GAME_PHASES.DISCUSSION);

      const actionResult = game.readyUp(player1Id); // Last human player readies up
      expect(game.readyPlayers.has(player1Id)).toBe(true);
      expect(actionResult.broadcast).toBe(true); // This will be the transition broadcast
      expect(game.phase).toBe(GAME_PHASES.VOTING);
      expect(game.discussionTimer).toBeNull(); // Timer should be cleared
    });

    it('should transition to VOTING after discussion timer expires', () => {
      const discussionDuration = config.discussionDurationSeconds * 1000;
      expect(game.discussionTimer).not.toBeNull();

      jest.advanceTimersByTime(discussionDuration + 100);

      expect(game.phase).toBe(GAME_PHASES.VOTING);
      expect(game.discussionTimer).toBeNull(); // Timer should be cleared by _clearAllTimers
      expect(game.votingTimer).not.toBeNull(); // Voting timer should start
    });

    it('hostEndDiscussion action should transition to VOTING', () => {
      const actionResult = game.hostEndDiscussion(hostId);
      expect(actionResult.broadcast).toBe(true);
      expect(game.phase).toBe(GAME_PHASES.VOTING);
      expect(game.discussionTimer).toBeNull(); // Timer should be cleared
    });

    it('hostEndDiscussion should fail if not host', () => {
      expect(() => game.hostEndDiscussion(player1Id)).toThrow('Only host can end discussion.');
    });

    it('hostEndDiscussion should fail if not in DISCUSSION phase', () => {
      game.phase = GAME_PHASES.WAITING;
      expect(() => game.hostEndDiscussion(hostId)).toThrow('Cannot end discussion from phase: waiting');
    });
  });

  describe('VOTING Phase', () => {
    let gameWithBotsAndHumans;

    beforeEach(() => {
      jest.useFakeTimers();
      // Setup a game instance that includes bots and humans for comprehensive testing
      gameWithBotsAndHumans = new WordImpostorGame(hostId, hostName, hostSocketId, 1); // Host, 1 Bot
      gameWithBotsAndHumans.addPlayer(player1Id, player1Name, player1SocketId);
      gameWithBotsAndHumans.addPlayer(player2Id, player2Name, player2SocketId);
      // Total: Host (human), Bot, Player1 (human), Player2 (human)

      // Transition to VOTING phase
      gameWithBotsAndHumans.startGame(hostId); // WORD_SHOW
      jest.advanceTimersByTime(gameWithBotsAndHumans.phaseDurations[GAME_PHASES.WORD_SHOW] + 10); // DISCUSSION
      // Simulate all human players submitting clues to enable readyUp or auto-transition if all clues are in (though timer is main driver)
      gameWithBotsAndHumans.players.forEach(p => {
        if (!p.isBot && !gameWithBotsAndHumans.playerClues.has(p.id)) {
          gameWithBotsAndHumans.submitClue(p.id, `${p.name}sClue`);
        }
      });
      jest.advanceTimersByTime(config.discussionDurationSeconds * 1000 + 10); // VOTING

      expect(gameWithBotsAndHumans.phase).toBe(GAME_PHASES.VOTING);
      expect(gameWithBotsAndHumans.votes.size).toBe(0); // Votes should be clear
      // Bots should have voted by now as triggerBotActions is called in _transitionToVoting
    });

    it('bots should submit votes upon entering VOTING phase', () => {
      let botVoted = false;
      gameWithBotsAndHumans.players.forEach(player => {
        if (player.isBot) {
          expect(gameWithBotsAndHumans.votes.has(player.id)).toBe(true);
          const botVoteTarget = gameWithBotsAndHumans.votes.get(player.id);
          expect(botVoteTarget).toBeDefined();
          expect(botVoteTarget).not.toBe(player.id); // Bot should not vote for itself
          botVoted = true;
        }
      });
      expect(botVoted).toBe(true);
    });

    it('should allow players to submit votes during VOTING phase', () => {
      // Host votes for player1
      const actionResult = gameWithBotsAndHumans.submitVote(hostId, player1Id);
      expect(gameWithBotsAndHumans.votes.get(hostId)).toBe(player1Id);
      expect(actionResult.broadcast).toBe(true);
      expect(actionResult.event).toBe('voteSubmitted');
      expect(actionResult.data.playerId).toBe(hostId);
    });

    it('should not allow submitting votes outside VOTING phase', () => {
      gameWithBotsAndHumans.phase = GAME_PHASES.DISCUSSION;
      expect(() => gameWithBotsAndHumans.submitVote(hostId, player1Id)).toThrow('Not voting phase');
    });

    it('should not allow voting for a non-existent player', () => {
        expect(() => gameWithBotsAndHumans.submitVote(hostId, 'nonExistentPlayer')).toThrow('Voted for player does not exist');
    });

    it('should track ready players and transition to RESULTS if all humans ready up', () => {
      // Bot has already voted. Humans: hostId, player1Id, player2Id
      gameWithBotsAndHumans.submitVote(hostId, player1Id);
      gameWithBotsAndHumans.submitVote(player1Id, player2Id);
      // player2Id is the last human to vote and ready up

      gameWithBotsAndHumans.readyUp(hostId);
      expect(gameWithBotsAndHumans.readyPlayers.has(hostId)).toBe(true);
      expect(gameWithBotsAndHumans.phase).toBe(GAME_PHASES.VOTING);

      gameWithBotsAndHumans.readyUp(player1Id);
      expect(gameWithBotsAndHumans.readyPlayers.has(player1Id)).toBe(true);
      expect(gameWithBotsAndHumans.phase).toBe(GAME_PHASES.VOTING);

      // Last human player (player2) submits vote and then readies up
      gameWithBotsAndHumans.submitVote(player2Id, hostId);
      const actionResult = gameWithBotsAndHumans.readyUp(player2Id);

      expect(gameWithBotsAndHumans.readyPlayers.has(player2Id)).toBe(true);
      expect(actionResult.broadcast).toBe(true);
      expect(gameWithBotsAndHumans.phase).toBe(GAME_PHASES.RESULTS);
      expect(gameWithBotsAndHumans.votingTimer).toBeNull(); // Timer should be cleared
    });

    it('should transition to RESULTS after voting timer expires', () => {
      const votingDuration = config.votingDurationSeconds * 1000;
      expect(gameWithBotsAndHumans.votingTimer).not.toBeNull();

      // Simulate some votes
      gameWithBotsAndHumans.submitVote(hostId, player1Id);
      gameWithBotsAndHumans.submitVote(player1Id, hostId);
      // Bot has already voted. player2Id hasn't.

      jest.advanceTimersByTime(votingDuration + 100);

      expect(gameWithBotsAndHumans.phase).toBe(GAME_PHASES.RESULTS);
      expect(gameWithBotsAndHumans.votingTimer).toBeNull();
    });

    it('hostEndVoting action should transition to RESULTS', () => {
      const actionResult = gameWithBotsAndHumans.hostEndVoting(hostId);
      expect(actionResult.broadcast).toBe(true);
      expect(gameWithBotsAndHumans.phase).toBe(GAME_PHASES.RESULTS);
      expect(gameWithBotsAndHumans.votingTimer).toBeNull();
    });

    it('hostEndVoting should fail if not host', () => {
      expect(() => gameWithBotsAndHumans.hostEndVoting(player1Id)).toThrow('Only host can end voting.');
    });

    it('hostEndVoting should fail if not in VOTING phase', () => {
      gameWithBotsAndHumans.phase = GAME_PHASES.DISCUSSION;
      expect(() => gameWithBotsAndHumans.hostEndVoting(hostId)).toThrow('Cannot end voting from phase: discussion');
    });
  });

  describe('RESULTS Phase and Game Reset', () => {
    let gameInstance; // Use a generic name for clarity as it's reset often

    beforeEach(() => {
      jest.useFakeTimers();
      gameInstance = new WordImpostorGame(hostId, hostName, hostSocketId);
      gameInstance.addPlayer(player1Id, player1Name, player1SocketId);
      gameInstance.addPlayer(player2Id, player2Name, player2SocketId);
      // gameInstance.addPlayer(player3Id, player3Name, player3SocketId); // Add more if needed for specific result scenarios

      // Transition to RESULTS phase
      gameInstance.startGame(hostId); // WORD_SHOW
      jest.advanceTimersByTime(gameInstance.phaseDurations[GAME_PHASES.WORD_SHOW] + 10); // DISCUSSION
      // Simulate clues
      gameInstance.impostorId = player1Id; // Let's define an imposter for result calculation
      gameInstance.players.forEach(p => {
        if (!gameInstance.playerClues.has(p.id)) gameInstance.submitClue(p.id, `${p.name}Clue`);
      });
      jest.advanceTimersByTime(config.discussionDurationSeconds * 1000 + 10); // VOTING
      // Simulate votes - this will determine the outcome
    });

    it('should correctly calculate results when imposter is caught', () => {
      // All vote for the imposter (player1Id)
      gameInstance.submitVote(hostId, player1Id);
      gameInstance.submitVote(player2Id, player1Id);
      // Assuming bot (if any) also votes for player1Id or its vote doesn't change outcome significantly for this test.
      // If there was a bot, its vote would have been cast upon entering VOTING phase.

      jest.advanceTimersByTime(config.votingDurationSeconds * 1000 + 10); // To RESULTS
      expect(gameInstance.phase).toBe(GAME_PHASES.RESULTS);

      const results = gameInstance.getResults();
      expect(results.impostorId).toBe(player1Id);
      expect(results.mostVotedId).toBe(player1Id);
      expect(results.impostorCaught).toBe(true);
    });

    it('should correctly calculate results when imposter escapes (innocent player voted out)', () => {
      // All vote for an innocent player (player2Id)
      gameInstance.submitVote(hostId, player2Id);
      gameInstance.submitVote(player1Id, player2Id); // Imposter votes for innocent
      // Bot votes (if any) might vary, assume they don't change player2Id being mostVoted

      jest.advanceTimersByTime(config.votingDurationSeconds * 1000 + 10); // To RESULTS
      expect(gameInstance.phase).toBe(GAME_PHASES.RESULTS);

      const results = gameInstance.getResults();
      expect(results.impostorId).toBe(player1Id); // player1Id is still the imposter
      expect(results.mostVotedId).toBe(player2Id);
      expect(results.impostorCaught).toBe(false);
    });

    it('should correctly calculate results when imposter escapes (votes scattered, imposter not most voted)', () => {
      // Votes are scattered, imposter (player1Id) is not the most voted
      gameInstance.submitVote(hostId, player2Id); // Host votes player2
      gameInstance.submitVote(player2Id, hostId); // Player2 votes host
      // Imposter (player1Id) votes for player2 to create a tie or make player2 most voted
      gameInstance.submitVote(player1Id, player2Id);

      jest.advanceTimersByTime(config.votingDurationSeconds * 1000 + 10); // To RESULTS
      expect(gameInstance.phase).toBe(GAME_PHASES.RESULTS);

      const results = gameInstance.getResults();
      expect(results.impostorId).toBe(player1Id);
      // Most voted could be player2Id in this scenario
      expect(results.mostVotedId).not.toBe(player1Id);
      expect(results.impostorCaught).toBe(false);
    });

    it('resetGame action should reset game to WAITING phase and clear data', () => {
      // Get to some phase beyond WAITING, e.g., VOTING
      jest.advanceTimersByTime(config.votingDurationSeconds * 1000 + 10); // To RESULTS
      expect(gameInstance.phase).toBe(GAME_PHASES.RESULTS);

      // Set some data that should be cleared
      gameInstance.readyPlayers.add(hostId);
      gameInstance.playerClues.set(hostId, "AClue");
      gameInstance.votes.set(hostId, player1Id);
      // Timers would be set if we were in a timed phase

      const actionResult = gameInstance.resetGame(hostId); // Host resets

      expect(actionResult.broadcast).toBe(true);
      expect(gameInstance.phase).toBe(GAME_PHASES.WAITING);
      expect(gameInstance.currentWord).toBeNull();
      expect(gameInstance.impostorId).toBeNull();
      expect(gameInstance.playerClues.size).toBe(0);
      expect(gameInstance.votes.size).toBe(0);
      expect(gameInstance.readyPlayers.size).toBe(0);
      expect(gameInstance.discussionTimer).toBeNull();
      expect(gameInstance.votingTimer).toBeNull();
      expect(gameInstance.wordShowTimer).toBeNull();
    });

    it('resetGame should fail if not host', () => {
      jest.advanceTimersByTime(config.votingDurationSeconds * 1000 + 10); // To RESULTS
      expect(() => gameInstance.resetGame(player1Id)).toThrow('Only host can reset game');
    });
  });

  describe('Bot Specific Logic', () => {
    let gameWithBots;
    beforeEach(() => {
        jest.useFakeTimers();
        gameWithBots = new WordImpostorGame(hostId, hostName, hostSocketId, 1); // Host + 1 Bot
        gameWithBots.addPlayer(player1Id, player1Name, player1SocketId); // Human player
        gameWithBots.addPlayer(player2Id, player2Name, player2SocketId); // Another human player
    });

    it('_botSubmitClue generates different clues for imposter and non-imposter bots', () => {
        gameWithBots.startGame(hostId); // WORD_SHOW

        const botPlayer = Array.from(gameWithBots.players.values()).find(p => p.isBot);
        expect(botPlayer).toBeDefined();

        // Scenario 1: Bot is NOT the imposter
        gameWithBots.impostorId = player1Id; // Human is imposter
        gameWithBots.currentWord = { word: "APPLE", hint: "Fruit" }; // Set a word for the bot to use

        // Manually trigger _botSubmitClue for testing its logic directly (if needed, or test via phase transition)
        // For this test, let's assume phase transition to DISCUSSION handles it.
        const originalClueSize = gameWithBots.playerClues.size;
        gameWithBots._transitionToDiscussion(); // This will call triggerBotActions -> _botSubmitClue

        expect(gameWithBots.playerClues.has(botPlayer.id)).toBe(true);
        const botClue1 = gameWithBots.playerClues.get(botPlayer.id);
        expect(botClue1).not.toContain("Imposter"); // Should be related to the word/hint
        expect(botClue1).toMatch(/A...|Fruit/i); // Example check, depends on bot's clue logic

        // Scenario 2: Bot IS the imposter
        gameWithBots.playerClues.clear(); // Clear previous clue
        gameWithBots.impostorId = botPlayer.id; // Bot is imposter
        gameWithBots.currentWord = { word: "BANANA", hint: "Fruit" }; // New word context

        gameWithBots._transitionToDiscussion(); // Re-trigger for new scenario (or a fresh game instance)

        expect(gameWithBots.playerClues.has(botPlayer.id)).toBe(true);
        const botClue2 = gameWithBots.playerClues.get(botPlayer.id);
        expect(botClue2).not.toBe(botClue1); // Clue should ideally change with role/word
        // Imposter bot clue logic: "It's something about ${this.currentWord.hint}" or "I am not sure"
        // And prepended with random phrase
        expect(botClue2).toMatch(/Fruit|not sure/i);
    });

    // _botSubmitVote is implicitly tested in VOTING phase tests where bot votes are checked.
  });

});
