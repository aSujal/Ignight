const GAME_TYPES = {
  WORD_IMPOSTOR: 'word-impostor',
  // Add more game types here
};

const GAME_PHASES = {
  WAITING: 'waiting',
  WORD_REVEAL: 'word-reveal',
  CLUE_GIVING: 'clue-giving',
  VOTING: 'voting',
  RESULTS: 'results'
};

module.exports = {
  GAME_TYPES,
  GAME_PHASES
};