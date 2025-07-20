const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 4000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Game-specific configs
  maxPlayersPerGame: process.env.MAX_PLAYERS_PER_GAME ? parseInt(process.env.MAX_PLAYERS_PER_GAME) : 10,
  minPlayersForGame: process.env.MIN_PLAYERS_FOR_GAME ? parseInt(process.env.MIN_PLAYERS_FOR_GAME) : 3,
  gameDurationMinutes: process.env.GAME_DURATION_MINUTES ? parseInt(process.env.GAME_DURATION_MINUTES) : 60,
  gameCodeLength: 6,
  discussionDurationSeconds: process.env.DISCUSSION_DURATION_SECONDS ? parseInt(process.env.DISCUSSION_DURATION_SECONDS) : 120,
  votingDurationSeconds: process.env.VOTING_DURATION_SECONDS ? parseInt(process.env.VOTING_DURATION_SECONDS) : 30,

  // Socket.IO configs
  socketOptions: {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  },

  availableAvatarStyles: ['micah', 'adventurer', 'shapes'],

};

export default config;
