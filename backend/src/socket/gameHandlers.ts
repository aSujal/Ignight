import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import gameService from '../services/GameService';
import { GAME_TYPES } from '../config/enums';
import { sendServerMessage } from './utils/sendServerMessage';

interface CreateRoomPayload {
  gameType: string;
  playerName: string;
  playerId: string;
  avatar: any;
}

interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  playerId: string;
  avatar: any;
}

interface GameActionPayload {
  roomCode: string;
  playerId: string;
  action: string;
  data: any;
}

interface ChatMessagePayload {
  roomCode: string;
  playerId: string;
  message: string;
}

function handleCreateRoom(socket: Socket, io: SocketIOServer, { gameType, playerName, playerId, avatar }: CreateRoomPayload) {
  try {
    const game = gameService.createGame(playerId, playerName, gameType, socket.id, avatar);
    socket.join(game.code);
    socket.emit('roomCreated', game.getClientState(playerId));
    console.log(`Player ${playerName} created room ${game.code}`);

    sendServerMessage(io, game.code, `${playerName} created the room.`);
  } catch (error: any) {
    socket.emit('error', error.message);
  }
}

function handleJoinRoom(socket: Socket, io: SocketIOServer, { roomCode, playerName, playerId, avatar }: JoinRoomPayload) {
  try {
    const { game } = gameService.joinGame(roomCode, playerId, playerName, socket.id, avatar);
    socket.join(game.code);
    const gameReturn = game.getClientState(playerId);
    socket.emit('roomJoined', gameReturn);
    io.to(game.code).emit('gameStateUpdate', gameReturn);
    console.log(`Player ${playerName} joined room ${roomCode}`);

    sendServerMessage(io, roomCode, `${playerName} joined the room.`);
  } catch (error: any) {
    socket.emit('error', error.message);
  }
}

function handleGameAction(socket: Socket, io: SocketIOServer, { roomCode, playerId, action, data }: GameActionPayload) {
  try {
    console.log(`Player ${playerId} performing action: ${action} in room ${roomCode}`);
    const game = gameService.getGame(roomCode);
    if (!game) throw new Error('Game not found');

    const result = game.handleAction(playerId, action, data);

    if (result.broadcast) {
      io.to(roomCode).emit(result.event, result.data);
    } else if (result.emit) {
      socket.emit(result.event, result.data);
    }

    for (const [id, player] of game.players.entries()) {
      const gameReturn = game.getClientState(id);
      io.to(player.socketId).emit('gameStateUpdate', gameReturn);
    }
  } catch (error: any) {
    socket.emit('error', error.message);
  }
}

function handleChatMessage(socket: Socket, io: SocketIOServer, data: ChatMessagePayload) {
  const { roomCode, playerId, message } = data;

  if (!roomCode || !playerId || !message?.trim()) return;

  const chatMessage = {
    id: uuidv4(),
    message,
    senderType: 'player',
    playerId,
    timestamp: new Date(),
    type: 'PLAYER',
  };

  io.to(roomCode).emit('chatMessage', chatMessage);
}

function handleDisconnect(socket: Socket, io: SocketIOServer) {
  const result = gameService.disconnectPlayer(socket.id);

  if (result) {
    const { game, player } = result;

    for (const [id, p] of game.players.entries()) {
      const gameReturn = game.getClientState(id);
      io.to(p.socketId).emit('gameStateUpdate', gameReturn);
    }

    if (player?.name) {
      sendServerMessage(io, game.code, `${player.name} left the game.`);
    }
  }
}

export {
  handleCreateRoom,
  handleJoinRoom,
  handleGameAction,
  handleDisconnect,
  handleChatMessage,
};
