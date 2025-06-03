const http = require("http");
const express = require("express");
const cors = require("cors");
const config = require("./src/config/config");
const gameRoutes = require("./src/routes/gameRoutes");
const { errorHandler } = require("./src/middleware/errorHandler");
const { initializeSocket } = require("./src/socket/socketHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/games", gameRoutes);

app.use(errorHandler);

const server = http.createServer(app);
initializeSocket(server);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
