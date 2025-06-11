const GAME_TYPES = {
  WORD_IMPOSTOR: 'word-impostor',
};

const GAME_PHASES = {
  WAITING: 'waiting',        // Players gather, game setup
  WORD_SHOW: 'word-show',      // Word/Imposter role is shown briefly
  DISCUSSION: 'discussion',    // Players give clues and discuss
  VOTING: 'voting',          // Players vote for the imposter
  RESULTS: 'results'         // Results are shown, game ends or new round
};

module.exports = {
  GAME_TYPES,
  GAME_PHASES
};