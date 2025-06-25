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
  avatarStyle?: string;
  avatarParts?: Record<string, string>;
  isBot?: boolean;
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
    votes: Vote[];
  };
  /**
   * A mapping of player IDs to the IDs of the players they voted for.
   */
  votes: Vote[];
  readyPlayers: string[];
  maxPlayers: number;
  availableAvatarStyles?: string[];
  isImpostor?: boolean;
  timerRemaining?: number;
  timerDuration?: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  type: typeof GAME_PHASES;
}

export type Vote = {
  voterId: string;
  votedForPlayerId: string;
};

export type Clue = {
  playerId: string;
  clue: string;
};

export interface AvatarConfig {
  style: string;
  seed: string;
  hair?: string[];
  eyes?: string[];
  mouth?: string[];
  skinColor?: string[];
  backgroundColor?: string[];
}

export interface AvatarPreferences {
  style: string;
  seed: string;
  customizations: Record<string, string>;
}
