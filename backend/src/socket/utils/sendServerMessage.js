const { v4: uuidv4 } = require("uuid");

function sendServerMessage(io, roomCode, message) {
    const serverMessage = {
        id: uuidv4(),
        senderType: "server",
        message,
        timestamp: new Date(),
        type: "SYSTEM",
    };

    io.to(roomCode).emit("chatMessage", serverMessage);
}

module.exports = { sendServerMessage };