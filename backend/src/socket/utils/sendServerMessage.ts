import { Server as SocketIOServer } from "socket.io";
import { v4 as uuidv4 } from "uuid";

function sendServerMessage(io: SocketIOServer, roomCode: string, message: string) {
  const serverMessage = {
    id: uuidv4(),
    senderType: "server",
    message,
    timestamp: new Date(),
    type: "SYSTEM",
  };

  io.to(roomCode).emit("chatMessage", serverMessage);
}

export { sendServerMessage };
