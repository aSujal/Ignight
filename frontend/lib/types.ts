import { games } from "@/data/games";
import { GAME_PHASES } from "./enum";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  votes: number;
  isEliminated: boolean;
  isConnected: boolean;
  avatarUrl: string;
  avatarStyle?: string; // Added avatarStyle
}

export interface GameState {
  id: string;
  host: string;
  code: string;
  players: Player[];
  type: (typeof games)[number]["id"];
  phase: string;
  gameData: {
    word: string;
    hint: string;
    isImpostor: boolean;
  };
  clues: {
    playerId: string;
    playerName: string;
    clue: string;
  }[];
  results: {
    impostorId: string;
    mostVotedId: string;
    impostorCaught: boolean;
    votes: Record<string, string>;
  };
  maxPlayers: number;
  availableAvatarStyles?: string[];
  isImpostor?: boolean; // Added for the current player's imposter status
  // currentRound?: number;
  // maxRounds?: number;
  // currentWord?: string;
  // isImposter?: boolean;
  // votes?: Record<string, string>;
  // timeRemaining?: number;
  // createdAt: Date;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  type: typeof GAME_PHASES;
}
