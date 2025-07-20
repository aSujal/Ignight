
import { GAME_PHASES } from "../config/enums";
import config from "../config/config";
import { Game } from "./Game";
import { IMPOSTER_GAME_WORD_SETS } from "../data/imposterGameWordSets";

interface WordSet {
  word: string;
  hint: string;
}

interface Clue {
  id: string;
  text: string;
  timestamp: string;
}

interface ClueSubmissionEvent {
  broadcast: boolean;
  event: string;
  data: {
    playerId: string;
    playerName: string;
    clues: Clue[];
    allHumanCluesSubmitted: boolean;
    currentTurnPlayerId: string;
    turnOrder: string[];
  };
}

interface VoteSubmissionEvent {
  broadcast: boolean;
  event: string;
  data: {
    playerId: string;
  };
}

interface PhaseChangeEvent {
  broadcast: boolean;
  event: string;
  data: any;
}

interface VoteDetail {
  voterId: string;
  voterName: string;
  votedForId: string;
  votedForName: string;
}

interface Results {
  impostorId: string | null;
  mostVotedId: string | undefined;
  impostorCaught: boolean;
  votes: Record<string, number>;
}

type PlayerId = string;

class WordImpostorGame extends Game {
  currentWord: WordSet | null;
  impostorId: PlayerId | null;
  playerClues: Map<PlayerId, Clue[]>;
  votes: Map<PlayerId, PlayerId>;
  clueTurnIndex: number;
  turnOrder: PlayerId[];
  phaseDurations: Record<string, number>;

  constructor(hostId: string, hostName: string, socketId: string) {
    super(hostId, hostName, "word-impostor", socketId);

    this.currentWord = null;
    this.impostorId = null;
    this.playerClues = new Map<PlayerId, Clue[]>();
    this.votes = new Map<PlayerId, PlayerId>();
    this.clueTurnIndex = 0;
    this.turnOrder = [];
    this.phaseDurations = {
      [GAME_PHASES.DISCUSSION]: config.discussionDurationSeconds * 1000,
      [GAME_PHASES.VOTING]: config.votingDurationSeconds * 1000,
    };
  }

  _handleGameSpecificAction(
    playerId: PlayerId,
    action: string,
    data: any
  ): PhaseChangeEvent | ClueSubmissionEvent | VoteSubmissionEvent {
    switch (action) {
      case "startGame":
        return this.startGame(playerId);
      case "forceStartGame":
        return this.forceStartGame(playerId);
      case "submitClue":
        return this.submitClue(playerId, data.clue);
      case "submitVote":
        return this.submitVote(playerId, data.votedForPlayerId);
      case "hostEndWordShow":
        return this.hostEndWordShow(playerId);
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

  _handleAllPlayersReady(): PhaseChangeEvent | void {
    console.log(`All players ready in game ${this.code}`);
    this.clearAllTimers();
    console.log('phase:', this.phase);
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

  _getPhaseTimer(): { duration: number } | null {
    const duration = this.phaseDurations[this.phase];
    return duration ? { duration } : null;
  }

  startGame(playerId: PlayerId): PhaseChangeEvent {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error("Only host can start game");
    if (this.players.size < 3) throw new Error("Need at least 3 players");
    if (this.readyPlayers.size < this.players.size)
      throw new Error("All players must be ready to start the game");

    return this._transitionToWordShow();
  }

  forceStartGame(playerId: PlayerId): PhaseChangeEvent {
    const player = this.players.get(playerId);
    if (!player?.isHost) throw new Error("Only host can force start game");
    if (this.players.size < 3) throw new Error("Need at least 3 players");

    // Force start bypasses ready check - just start the game
    return this._transitionToWordShow();
  }

  selectWordAndImpostor(): void {
    const wordSet = IMPOSTER_GAME_WORD_SETS[
      Math.floor(Math.random() * IMPOSTER_GAME_WORD_SETS.length)
    ];
    this.currentWord = wordSet;

    const playerIds = Array.from(this.players.keys());
    if (playerIds.length === 0) {
      throw new Error("No players to select imposter from.");
    }

    this.impostorId = playerIds[Math.floor(Math.random() * playerIds.length)];
  }

  getGameStartData(): Record<PlayerId, { word: string; hint: string; isImpostor: boolean }> {
    const data: Record<PlayerId, { word: string; hint: string; isImpostor: boolean }> = {};
    for (const playerId of this.players.keys()) {
      data[playerId] = {
        word: playerId === this.impostorId ? "Imposter" : this.currentWord!.word,
        hint: this.currentWord!.hint,
        isImpostor: playerId === this.impostorId,
      };
    }
    return data;
  }

  submitClue(playerId: PlayerId, clueText: string): ClueSubmissionEvent {
    if (this.phase !== GAME_PHASES.DISCUSSION) {
      throw new Error(
        `Cannot submit clue in phase: ${this.phase}. Must be in DISCUSSION phase.`
      );
    }

    if (
      this.turnOrder &&
      this.turnOrder[this.clueTurnIndex] !== playerId
    ) {
      throw new Error("It's not your turn to submit a clue.");
    }

    if (!this.playerClues.has(playerId)) {
      this.playerClues.set(playerId, []);
    }

    const clueId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 11);

    const clue: Clue = {
      id: clueId,
      text: clueText,
      timestamp: new Date().toISOString(),
    };

    this.playerClues.get(playerId)!.push(clue);

    // Advance turn
    if (this.turnOrder.length > 0) {
      this.clueTurnIndex = (this.clueTurnIndex + 1) % this.turnOrder.length;
    }

    return {
      broadcast: true,
      event: "clueSubmitted",
      data: {
        playerId,
        playerName: this.players.get(playerId)?.name || "Unknown Player",
        clues: this.playerClues.get(playerId)!,
        allHumanCluesSubmitted: false, // You can update this logic if needed
        currentTurnPlayerId: this.turnOrder[this.clueTurnIndex],
        turnOrder: this.turnOrder,
      },
    };
  }

  submitVote(playerId: PlayerId, votedForPlayerId: PlayerId): VoteSubmissionEvent {
    if (this.phase !== GAME_PHASES.VOTING) {
      throw new Error(`Cannot submit vote in phase: ${this.phase}. Must be in VOTING phase.`);
    }

    if (!this.players.has(votedForPlayerId)) {
      throw new Error("Voted for player does not exist.");
    }

    if (this.votes.has(playerId)) {
      this.votes.delete(playerId);
    }

    this.votes.set(playerId, votedForPlayerId);

    return {
      broadcast: true,
      event: "voteSubmitted",
      data: {
        playerId,
      },
    };
  }

  triggerBotActions(): void {
    if (this.phase === GAME_PHASES.DISCUSSION) {
      this.players.forEach((player) => {
        // Bot clue submission logic (commented out in original)
      });
    } else if (this.phase === GAME_PHASES.VOTING) {
      this.players.forEach((player) => {
        if (player.isBot && player.isConnected && !this.votes.has(player.id)) {
          this._botSubmitVote(player.id);
        }
      });
    }
  }

  _botSubmitVote(botId: PlayerId): void {
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

  _transitionToWordShow(): PhaseChangeEvent {
    console.log(`Transitioning to word show phase in game ${this.code}`);
    if (this.players.size < (config.minPlayersForGame || 3)) {
      throw new Error("Not enough players to start Word Show.");
    }
    this._setPhase(GAME_PHASES.WORD_SHOW);
    this.selectWordAndImpostor();
    this.clueTurnIndex = 0;
    console.log('returning: ', {
      broadcast: true,
      event: "phaseChanged",
      data: {
        ...this.getClientState(),
        gameSpecificData: this.getGameStartData(),
      },
    });
    return {
      broadcast: true,
      event: "phaseChanged",
      data: {
        ...this.getClientState(),
        gameSpecificData: this.getGameStartData(),
      },
    };
  }

  _transitionToDiscussion(): PhaseChangeEvent {
    console.log(`Transitioning to discussion phase in game ${this.code}`);
    this._setPhase(GAME_PHASES.DISCUSSION);
    this.playerClues.clear();
    this.turnOrder = Array.from(this.players.values())
      .filter((p) => !p.isBot && p.isConnected)
      .map((p) => p.id);
    this.clueTurnIndex = 0;
    this._startTimer(
      "discussion",
      this.phaseDurations[GAME_PHASES.DISCUSSION],
      () => {
        // Timer callback - transition to voting phase and emit the event
        const phaseChangeEvent = this._transitionToVoting();
        if (this._phaseChangeCallback) {
          this._phaseChangeCallback(phaseChangeEvent);
        }
      }
    );
    // this.triggerBotActions();
    console.log('returning: ', {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    })
    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToVoting(): PhaseChangeEvent {
    this._setPhase(GAME_PHASES.VOTING);
    this.votes.clear();
    this.triggerBotActions();

    this._startTimer(
      "voting",
      this.phaseDurations[GAME_PHASES.VOTING],
      () => {
        const phaseChangeEvent = this._transitionToResults();
        if (this._phaseChangeCallback) {
          this._phaseChangeCallback(phaseChangeEvent);
        }
      }
    );
    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToResults(): PhaseChangeEvent {
    this._setPhase(GAME_PHASES.RESULTS);
    this.clearAllTimers();

    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  _transitionToWaiting(): PhaseChangeEvent {
    this._setPhase(GAME_PHASES.WAITING);
    this.currentWord = null;
    this.impostorId = null;
    this.playerClues.clear();
    this.votes.clear();
    this.clearAllTimers();

    return {
      broadcast: true,
      event: "phaseChanged",
      data: this.getClientState(),
    };
  }

  hostEndVoting(playerId: PlayerId): PhaseChangeEvent {
    if (!this.players.get(playerId)?.isHost)
      throw new Error("Only host can end voting.");
    if (this.phase !== GAME_PHASES.VOTING)
      throw new Error("Can only end voting phase when voting is active.");
    return this._transitionToResults();
  }

  hostEndDiscussion(playerId: PlayerId): PhaseChangeEvent {
    if (!this.players.get(playerId)?.isHost)
      throw new Error("Only host can end discussion.");
    if (this.phase !== GAME_PHASES.DISCUSSION)
      throw new Error("Can only end discussion phase when discussion is active.");
    return this._transitionToVoting();
  }

  hostEndWordShow(playerId: PlayerId): PhaseChangeEvent {
    if (!this.players.get(playerId)?.isHost)
      throw new Error("Only host can end word show.");
    if (this.phase !== GAME_PHASES.WORD_SHOW)
      throw new Error("Can only end word show phase when word show is active.");
    return this._transitionToDiscussion();
  }

  resetGame(playerId: PlayerId): PhaseChangeEvent {
    if (!this.players.get(playerId)?.isHost)
      throw new Error("Only host can reset the game.");
    return this._transitionToWaiting();
  }

  getResults(): Results {
    if (this.phase !== GAME_PHASES.RESULTS) {
      throw new Error("Results are only available in the RESULTS phase.");
    }

    // Count votes
    const voteCounts: Record<PlayerId, number> = {};
    for (const votedFor of this.votes.values()) {
      voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
    }

    // Determine who got the most votes
    const maxVotes = Math.max(0, ...Object.values(voteCounts));
    const mostVotedIds = Object.entries(voteCounts)
      .filter(([, count]) => count === maxVotes)
      .map(([playerId]) => playerId);

    // If tie, randomly pick one of most voted
    const mostVotedId =
      mostVotedIds.length > 0
        ? mostVotedIds[Math.floor(Math.random() * mostVotedIds.length)]
        : undefined;

    const impostorCaught = mostVotedId === this.impostorId;

    return {
      impostorId: this.impostorId,
      mostVotedId,
      impostorCaught,
      votes: voteCounts,
    };
  }

  getVoteDetails(): VoteDetail[] {
    const details: VoteDetail[] = [];
    this.votes.forEach((votedForId, voterId) => {
      const voter = this.players.get(voterId);
      const votedFor = this.players.get(votedForId);
      if (voter && votedFor) {
        details.push({
          voterId,
          voterName: voter.name,
          votedForId,
          votedForName: votedFor.name,
        });
      }
    });
    return details;
  }



  getClientState(playerId: PlayerId | null = null) {
    const baseState = super.getClientState(playerId) as any;

    if (playerId && this.phase === GAME_PHASES.WORD_SHOW && this.currentWord) {
      const isImpostor = playerId === this.impostorId;
      baseState.gameData = {
        word: isImpostor ? "Imposter" : this.currentWord.word,
        hint: this.currentWord.hint,
        isImpostor,
      };
    }

    // Clues, turn order info during Discussion, Voting, or Results
    if (([GAME_PHASES.DISCUSSION, GAME_PHASES.VOTING, GAME_PHASES.RESULTS] as string[]).includes(this.phase)) {
      baseState.clues = Array.from(this.playerClues.entries()).map(([pId, clues]) => ({
        playerId: pId,
        playerName: this.players.get(pId)?.name ?? "Unknown",
        clues,
      }));

      baseState.turnOrder = this.turnOrder;
      baseState.clueTurnIndex = this.clueTurnIndex;
      baseState.currentTurnPlayerId = this.turnOrder?.[this.clueTurnIndex] ?? null;
    }

    // Votes info during Voting or Results
    if (([GAME_PHASES.VOTING, GAME_PHASES.RESULTS] as string[]).includes(this.phase)) {
      baseState.votes = Array.from(this.votes.entries()).map(([voterId, votedForPlayerId]) => ({
        voterId,
        votedForPlayerId,
      }));
    }

    // Results info during Results phase
    if (this.phase === GAME_PHASES.RESULTS) {
      baseState.results = this.getResults();
    }

    // Impostor flag
    if (this.impostorId && playerId) {
      baseState.isImpostor = playerId === this.impostorId;
    } else {
      baseState.isImpostor = false;
    }

    return baseState;
  }
}

export default WordImpostorGame;
