import http from 'http';
import express, { Application } from 'express';
import cors from 'cors';

import gameRoutes from './routes/gameRoutes';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket/socketHandler';
import config from './config/config';

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/api/games', gameRoutes);

app.use(errorHandler);

const server = http.createServer(app);
initializeSocket(server);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`Server listening on port ${config.port}`);
});
