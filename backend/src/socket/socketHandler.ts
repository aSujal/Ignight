import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import config from '../config/config';
import { handleChatMessage, handleCreateRoom, handleDisconnect, handleGameAction, handleJoinRoom } from './gameHandlers';

export function initializeSocket(server: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.clientUrl || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
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
