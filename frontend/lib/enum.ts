export const GAME_TYPES = {
  WORD_IMPOSTOR: "word-impostor",
};

export const GAME_PHASES = {
  WAITING: "waiting",
  WORD_REVEAL: "word-reveal",
  CLUE_GIVING: "clue-giving",
  VOTING: "voting",
  RESULTS: "results",
};

export enum GAME_ACTIONS {
  JOIN = "join",
  LEAVE = "leave",
  READY = "ready",
  UNREADY = "unready",
  GIVE_CLUE = "give-clue",
  VOTE = "vote",
  REVEAL = "reveal",
  NEXT = "next",
  RESTART = "restart",
  END = "end",
}
