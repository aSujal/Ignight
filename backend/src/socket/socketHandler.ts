import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import config from '../config/config';
import gameService from '../services/GameService';
import { handleChatMessage, handleCreateRoom, handleDisconnect, handleGameAction, handleJoinRoom } from './gameHandlers';

export function initializeSocket(server: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.clientUrl || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Set up callback for games to emit phase change events
  gameService.setPhaseChangeEmitter((gameCode: string, event: any) => {
    console.log(`Emitting phase change for game ${gameCode}:`, event.event);

    // Emit the phase change event to all players in the room
    io.to(gameCode).emit(event.event, event.data);

    // Also emit individual game state updates to each player
    const game = gameService.getGame(gameCode);
    if (game) {
      for (const [id, player] of game.players.entries()) {
        const gameReturn = game.getClientState(id);
        if (player.socketId) {
          io.to(player.socketId).emit('gameStateUpdate', gameReturn);
        }
      }
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('User connected: ', socket.id);

    socket.on('createRoom', (data) => handleCreateRoom(socket, io, data));
    socket.on('joinRoom', (data) => handleJoinRoom(socket, io, data));
    socket.on('gameAction', (data) => handleGameAction(socket, io, data));
    socket.on('disconnect', () => handleDisconnect(socket, io));
    socket.on('chatMessage', (data) => handleChatMessage(socket, io, data));
  });

  return io;
}
