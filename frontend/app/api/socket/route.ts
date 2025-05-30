import { NextResponse } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { createServer } from "http"
import type { GameRoom, Player, ChatMessage } from "@/lib/types"

// Store the server instance globally
let io: SocketIOServer | undefined
let httpServer: any

// Game data
const gameData = {
  imposter: [
    { word: "Ocean", imposter: "Desert" },
    { word: "Pizza", imposter: "Salad" },
    { word: "Winter", imposter: "Summer" },
    { word: "Cat", imposter: "Dog" },
    { word: "Book", imposter: "Movie" },
    { word: "Coffee", imposter: "Tea" },
    { word: "Mountain", imposter: "Valley" },
    { word: "Fire", imposter: "Ice" },
  ],
}

// In-memory storage (in production, use Redis or database)
const rooms: Map<string, GameRoom> = new Map()
const playerSockets: Map<string, string> = new Map() // playerId -> socketId

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function createRoom(gameType: string, hostName: string): GameRoom {
  const roomCode = generateRoomCode()
  const hostPlayer: Player = {
    id: Date.now().toString(),
    name: hostName,
    isHost: true,
    isReady: true,
    votes: 0,
    isEliminated: false,
    isConnected: true,
  }

  const room: GameRoom = {
    id: roomCode,
    code: roomCode,
    gameType,
    players: [hostPlayer],
    gameState: "lobby",
    currentRound: 1,
    maxRounds: 3,
    timeLeft: 0,
    gameData: {},
    createdAt: new Date(),
  }

  rooms.set(roomCode, room)
  return room
}

function addPlayerToRoom(roomCode: string, playerName: string): { room: GameRoom; player: Player } | null {
  const room = rooms.get(roomCode)
  if (!room || room.gameState !== "lobby") return null

  if (room.players.some((p) => p.name === playerName)) return null

  const newPlayer: Player = {
    id: Date.now().toString() + Math.random(),
    name: playerName,
    isHost: false,
    isReady: false,
    votes: 0,
    isEliminated: false,
    isConnected: true,
  }

  room.players.push(newPlayer)
  rooms.set(roomCode, room)

  return { room, player: newPlayer }
}

function initializeSocketIO() {
  if (io) return io

  // Create HTTP server for Socket.io
  httpServer = createServer()

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)
    let currentRoom: string | null = null
    let currentPlayer: Player | null = null

    socket.on("room:create", (data: { gameType: string; playerName: string }) => {
      try {
        const room = createRoom(data.gameType, data.playerName)
        currentRoom = room.code
        currentPlayer = room.players[0]
        playerSockets.set(currentPlayer.id, socket.id)

        socket.join(room.code)
        socket.emit("room:joined", { room, playerId: currentPlayer.id })

        console.log(`Room ${room.code} created by ${data.playerName}`)
      } catch (error) {
        socket.emit("room:error", "Failed to create room")
      }
    })

    socket.on("room:join", (data: { roomCode: string; playerName: string }) => {
      try {
        const result = addPlayerToRoom(data.roomCode, data.playerName)
        if (!result) {
          socket.emit("room:error", "Room not found or game already started")
          return
        }

        currentRoom = result.room.code
        currentPlayer = result.player
        playerSockets.set(currentPlayer.id, socket.id)

        socket.join(result.room.code)
        socket.emit("room:joined", { room: result.room, playerId: result.player.id })
        socket.to(result.room.code).emit("room:update", result.room)

        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
          playerId: "system",
          playerName: "System",
          message: `${data.playerName} joined the room`,
          timestamp: new Date(),
          type: "system",
        }
        io!.to(result.room.code).emit("chat:receive", systemMessage)
      } catch (error) {
        socket.emit("room:error", "Failed to join room")
      }
    })

    socket.on("player:ready", (isReady: boolean) => {
      if (currentRoom && currentPlayer) {
        const room = rooms.get(currentRoom)
        if (room) {
          const player = room.players.find((p) => p.id === currentPlayer!.id)
          if (player) {
            player.isReady = isReady
            rooms.set(currentRoom, room)
            io!.to(currentRoom).emit("room:update", room)
          }
        }
      }
    })

    socket.on("game:start", () => {
      if (currentRoom && currentPlayer?.isHost) {
        const room = rooms.get(currentRoom)
        if (room && room.players.length >= 3) {
          room.gameState = "playing"
          room.timeLeft = 60

          if (room.gameType === "imposter") {
            const wordSet = gameData.imposter[Math.floor(Math.random() * gameData.imposter.length)]
            const imposterIndex = Math.floor(Math.random() * room.players.length)
            room.gameData = { wordSet, imposterIndex, playerAnswers: {} }
          }

          rooms.set(currentRoom, room)
          io!.to(currentRoom).emit("room:update", room)

          // Start timer
          const timer = setInterval(() => {
            const currentRoomData = rooms.get(currentRoom!)
            if (currentRoomData && currentRoomData.timeLeft > 0) {
              currentRoomData.timeLeft--
              rooms.set(currentRoom!, currentRoomData)
              io!.to(currentRoom!).emit("room:update", currentRoomData)
            } else {
              clearInterval(timer)
              if (currentRoomData) {
                currentRoomData.gameState = "voting"
                rooms.set(currentRoom!, currentRoomData)
                io!.to(currentRoom!).emit("room:update", currentRoomData)
              }
            }
          }, 1000)
        }
      }
    })

    socket.on("game:submit-answer", (answer: string) => {
      if (currentRoom && currentPlayer) {
        const room = rooms.get(currentRoom)
        if (room && room.gameState === "playing") {
          if (!room.gameData.playerAnswers) {
            room.gameData.playerAnswers = {}
          }
          room.gameData.playerAnswers[currentPlayer.id] = answer
          rooms.set(currentRoom, room)

          const systemMessage: ChatMessage = {
            id: Date.now().toString(),
            playerId: "system",
            playerName: "System",
            message: `${currentPlayer.name} submitted their answer`,
            timestamp: new Date(),
            type: "game",
          }
          io!.to(currentRoom).emit("chat:receive", systemMessage)
        }
      }
    })

    socket.on("game:vote", (targetPlayerId: string) => {
      if (currentRoom && currentPlayer) {
        const room = rooms.get(currentRoom)
        if (room && room.gameState === "voting") {
          const targetPlayer = room.players.find((p) => p.id === targetPlayerId)
          if (targetPlayer) {
            targetPlayer.votes++
            rooms.set(currentRoom, room)
            io!.to(currentRoom).emit("room:update", room)
          }
        }
      }
    })

    socket.on("chat:message", (message: string) => {
      if (currentRoom && currentPlayer && message.trim()) {
        const chatMessage: ChatMessage = {
          id: Date.now().toString(),
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          message: message.trim(),
          timestamp: new Date(),
          type: "chat",
        }
        io!.to(currentRoom).emit("chat:receive", chatMessage)
      }
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
      if (currentPlayer) {
        playerSockets.delete(currentPlayer.id)
      }
    })
  })

  // Start the HTTP server on a different port for Socket.io
  const port = process.env.SOCKET_PORT || 3001
  httpServer.listen(port, () => {
    console.log(`Socket.io server running on port ${port}`)
  })

  return io
}

export async function GET() {
  if (!io) {
    initializeSocketIO()
  }
  return NextResponse.json({ status: "Socket.io server running" })
}

export async function POST() {
  if (!io) {
    initializeSocketIO()
  }
  return NextResponse.json({ status: "Socket.io server initialized" })
}
