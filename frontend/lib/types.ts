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
  clues: PlayerClues[];
  results: {
    impostorId: string;
    mostVotedId: string;
    impostorCaught: boolean;
    votes: Vote[];
  };
  votes: Vote[];
  readyPlayers: string[];
  maxPlayers: number;
  availableAvatarStyles?: string[];
  isImpostor?: boolean;
  phaseStartTime: number | null;
  timerDuration: number | null;
  currentTurnPlayerId: string;
}

export type SenderType = "player" | "server";

export interface ChatMessage {
  id: string;
  senderType: SenderType;
  playerId?: string;
  playerName?: string;
  message: string;
  timestamp: Date;
  type: (typeof GAME_PHASES)[keyof typeof GAME_PHASES] | "SYSTEM"; // SYSTEM for server messages
}

export type Vote = {
  voterId: string;
  votedForPlayerId: string;
};

export type IndividualClue = {
  id: string; // optional but good for keying in UI
  text: string;
  timestamp?: Date;
};

export type PlayerClues = {
  playerId: string;
  playerName: string;
  clues: IndividualClue[];
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
