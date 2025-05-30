import { NextResponse } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { createServer } from "http"
import type { GameRoom, Player, ChatMessage } from "@/lib/types"

// Global variables
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
    { word: "Apple", imposter: "Orange" },
    { word: "Guitar", imposter: "Piano" },
  ],
}

// In-memory storage (use Redis in production)
const rooms: Map<string, GameRoom> = new Map()
const playerSockets: Map<string, string> = new Map()

function generateRoomCode(): string {
  let code: string
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase()
  } while (rooms.has(code))
  return code
}

function createRoom(gameType: string, hostName: string): GameRoom {
  const roomCode = generateRoomCode()
  const hostPlayer: Player = {
    id: `host_${Date.now()}`,
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
  console.log(`✅ Room ${roomCode} created for game ${gameType}`)
  return room
}

function addPlayerToRoom(roomCode: string, playerName: string): { room: GameRoom; player: Player } | null {
  const room = rooms.get(roomCode)
  if (!room) {
    console.log(`❌ Room ${roomCode} not found`)
    return null
  }

  if (room.gameState !== "lobby") {
    console.log(`❌ Room ${roomCode} game already started`)
    return null
  }

  if (room.players.some((p) => p.name === playerName)) {
    console.log(`❌ Player name ${playerName} already exists in room ${roomCode}`)
    return null
  }

  const newPlayer: Player = {
    id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: playerName,
    isHost: false,
    isReady: false,
    votes: 0,
    isEliminated: false,
    isConnected: true,
  }

  room.players.push(newPlayer)
  rooms.set(roomCode, room)
  console.log(`✅ Player ${playerName} joined room ${roomCode}`)

  return { room, player: newPlayer }
}

function removePlayerFromRoom(roomCode: string, playerId: string): GameRoom | null {
  const room = rooms.get(roomCode)
  if (!room) return null

  const playerIndex = room.players.findIndex((p) => p.id === playerId)
  if (playerIndex === -1) return null

  const removedPlayer = room.players[playerIndex]
  room.players.splice(playerIndex, 1)

  // If host left, make another player host
  if (removedPlayer.isHost && room.players.length > 0) {
    room.players[0].isHost = true
    room.players[0].isReady = true
  }

  // If no players left, delete room
  if (room.players.length === 0) {
    rooms.delete(roomCode)
    console.log(`🗑️ Room ${roomCode} deleted (empty)`)
    return null
  }

  rooms.set(roomCode, room)
  console.log(`👋 Player ${removedPlayer.name} left room ${roomCode}`)
  return room
}

function startGame(roomCode: string): GameRoom | null {
  const room = rooms.get(roomCode)
  if (!room || room.players.length < 3) return null

  room.gameState = "playing"
  room.currentRound = 1
  room.timeLeft = 60

  // Initialize game based on type
  if (room.gameType === "imposter") {
    const wordSet = gameData.imposter[Math.floor(Math.random() * gameData.imposter.length)]
    const imposterIndex = Math.floor(Math.random() * room.players.length)

    room.gameData = {
      wordSet,
      imposterIndex,
      playerAnswers: {},
      roundAnswers: [],
    }
  }

  rooms.set(roomCode, room)
  console.log(`🎮 Game started in room ${roomCode}`)
  return room
}

function initializeSocketIO() {
  if (io) {
    console.log("♻️ Socket.io already initialized")
    return io
  }

  console.log("🚀 Initializing Socket.io server...")

  // Create HTTP server
  httpServer = createServer()

  // Initialize Socket.IO
  io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  })

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`)
    let currentRoom: string | null = null
    let currentPlayer: Player | null = null

    // Room management
    socket.on("room:create", (data: { gameType: string; playerName: string }) => {
      try {
        console.log(`🏠 Creating room for ${data.playerName}, game: ${data.gameType}`)
        const room = createRoom(data.gameType, data.playerName)
        currentRoom = room.code
        currentPlayer = room.players[0]
        playerSockets.set(currentPlayer.id, socket.id)

        socket.join(room.code)
        socket.emit("room:joined", { room, playerId: currentPlayer.id })

        console.log(`✅ Room ${room.code} created by ${data.playerName}`)
      } catch (error) {
        console.error("❌ Error creating room:", error)
        socket.emit("room:error", "Failed to create room")
      }
    })

    socket.on("room:join", (data: { roomCode: string; playerName: string }) => {
      try {
        console.log(`🚪 ${data.playerName} trying to join room ${data.roomCode}`)
        const result = addPlayerToRoom(data.roomCode, data.playerName)
        if (!result) {
          socket.emit("room:error", "Room not found, game already started, or name taken")
          return
        }

        currentRoom = result.room.code
        currentPlayer = result.player
        playerSockets.set(currentPlayer.id, socket.id)

        socket.join(result.room.code)
        socket.emit("room:joined", { room: result.room, playerId: result.player.id })
        socket.to(result.room.code).emit("room:update", result.room)

        // Send system message
        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
          playerId: "system",
          playerName: "System",
          message: `${data.playerName} joined the room`,
          timestamp: new Date(),
          type: "system",
        }
        io!.to(result.room.code).emit("chat:receive", systemMessage)

        console.log(`✅ ${data.playerName} joined room ${data.roomCode}`)
      } catch (error) {
        console.error("❌ Error joining room:", error)
        socket.emit("room:error", "Failed to join room")
      }
    })

    socket.on("room:leave", () => {
      if (currentRoom && currentPlayer) {
        const room = removePlayerFromRoom(currentRoom, currentPlayer.id)
        if (room) {
          socket.to(currentRoom).emit("room:update", room)

          const systemMessage: ChatMessage = {
            id: Date.now().toString(),
            playerId: "system",
            playerName: "System",
            message: `${currentPlayer.name} left the room`,
            timestamp: new Date(),
            type: "system",
          }
          io!.to(currentRoom).emit("chat:receive", systemMessage)
        }

        socket.leave(currentRoom)
        playerSockets.delete(currentPlayer.id)
        currentRoom = null
        currentPlayer = null
      }
    })

    // Player actions
    socket.on("player:ready", (isReady: boolean) => {
      if (currentRoom && currentPlayer) {
        const room = rooms.get(currentRoom)
        if (room) {
          const player = room.players.find((p) => p.id === currentPlayer!.id)
          if (player) {
            player.isReady = isReady
            rooms.set(currentRoom, room)
            io!.to(currentRoom).emit("room:update", room)
            console.log(`🎯 ${currentPlayer.name} is ${isReady ? "ready" : "not ready"}`)
          }
        }
      }
    })

    // Game actions
    socket.on("game:start", () => {
      if (currentRoom && currentPlayer?.isHost) {
        const room = startGame(currentRoom)
        if (room) {
          io!.to(currentRoom).emit("room:update", room)
          io!.to(currentRoom).emit("game:round-start", {
            round: room.currentRound,
            gameData: room.gameData,
          })

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
            message: `${currentPlayer.name} submitted their answer: "${answer}"`,
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
          if (targetPlayer && targetPlayer.id !== currentPlayer.id) {
            targetPlayer.votes++
            rooms.set(currentRoom, room)
            io!.to(currentRoom).emit("room:update", room)

            const systemMessage: ChatMessage = {
              id: Date.now().toString(),
              playerId: "system",
              playerName: "System",
              message: `${currentPlayer.name} voted for ${targetPlayer.name}`,
              timestamp: new Date(),
              type: "game",
            }
            io!.to(currentRoom).emit("chat:receive", systemMessage)
          }
        }
      }
    })

    // Chat
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

    // Disconnect handling
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`)
      if (currentRoom && currentPlayer) {
        const room = removePlayerFromRoom(currentRoom, currentPlayer.id)
        if (room) {
          socket.to(currentRoom).emit("room:update", room)

          const systemMessage: ChatMessage = {
            id: Date.now().toString(),
            playerId: "system",
            playerName: "System",
            message: `${currentPlayer.name} disconnected`,
            timestamp: new Date(),
            type: "system",
          }
          io!.to(currentRoom).emit("chat:receive", systemMessage)
        }
        playerSockets.delete(currentPlayer.id)
      }
    })
  })

  // Start the HTTP server
  const port = Number.parseInt(process.env.SOCKET_PORT || "3001")
  httpServer.listen(port, () => {
    console.log(`🚀 Socket.io server running on port ${port}`)
  })

  return io
}

export async function GET() {
  try {
    if (!io) {
      initializeSocketIO()
    }
    return NextResponse.json({
      status: "Socket.io server running",
      rooms: rooms.size,
      port: process.env.SOCKET_PORT || "3001",
    })
  } catch (error) {
    console.error("❌ Error in GET /api/socketio:", error)
    return NextResponse.json({ error: "Failed to initialize server" }, { status: 500 })
  }
}

export async function POST() {
  try {
    if (!io) {
      initializeSocketIO()
    }
    return NextResponse.json({
      status: "Socket.io server initialized",
      rooms: rooms.size,
      port: process.env.SOCKET_PORT || "3001",
    })
  } catch (error) {
    console.error("❌ Error in POST /api/socketio:", error)
    return NextResponse.json({ error: "Failed to initialize server" }, { status: 500 })
  }
}
