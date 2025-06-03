const config = {
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Game-specific configs
  maxPlayersPerGame: parseInt(process.env.MAX_PLAYERS_PER_GAME) || 10,
  gameCodeLength: 6,
  
  // Socket.IO configs
  socketOptions: {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  },
};


module.exports = config;
