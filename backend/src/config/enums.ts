export const GAME_TYPES = {
  WORD_IMPOSTOR: 'word-impostor',
} as const;

export type GameType = typeof GAME_TYPES[keyof typeof GAME_TYPES];

export const GAME_PHASES = {
  WAITING: 'waiting',        // Players gather, game setup
  WORD_SHOW: 'word-show',      // Word/Imposter role is shown briefly
  DISCUSSION: 'discussion',    // Players give clues and discuss
  VOTING: 'voting',          // Players vote for the imposter
  RESULTS: 'results'         // Results are shown, game ends or new round
} as const;


export type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];