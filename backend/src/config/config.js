const config = {
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Game-specific configs
  maxPlayersPerGame: parseInt(process.env.MAX_PLAYERS_PER_GAME) || 10,
  gameDurationMinutes: parseInt(process.env.GAME_DURATION_MINUTES) || 60,
  gameCodeLength: 6,
  discussionDurationSeconds: parseInt(process.env.DISCUSSION_DURATION_SECONDS) || 60,
  votingDurationSeconds: parseInt(process.env.VOTING_DURATION_SECONDS) || 30,
  
  // Socket.IO configs
  socketOptions: {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  },
  availableAvatarStyles: [
    'micah', 'adventurer', 'fun-emoji', 'identicon', 'pixel-art',
    'initials', 'lorelei', 'notionists', 'shapes', 'thumbs'
  ], // Added list of styles
};


module.exports = config;
