// Simple in-memory store for game state (replace with Redis in production)
import type { GameRoom, Player, ChatMessage } from "@/lib/types"

class GameStore {
  private rooms: Map<string, GameRoom> = new Map()
  private chatMessages: Map<string, ChatMessage[]> = new Map()

  // Room management
  createRoom(gameType: string, hostName: string): GameRoom {
    const roomCode = this.generateRoomCode()
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

    this.rooms.set(roomCode, room)
    this.chatMessages.set(roomCode, [])
    console.log(`[GameStore] Room created: ${roomCode} for game ${gameType}`)
    return room
  }

  joinRoom(roomCode: string, playerName: string): { room: GameRoom; player: Player } | null {
    const room = this.rooms.get(roomCode)
    if (!room || room.gameState !== "lobby") {
      console.log(`[GameStore] Cannot join room ${roomCode}: ${!room ? "not found" : "game already started"}`)
      return null
    }

    if (room.players.some((p) => p.name === playerName)) {
      console.log(`[GameStore] Cannot join room ${roomCode}: player name ${playerName} already exists`)
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
    this.rooms.set(roomCode, room)

    // Add system message
    this.addChatMessage(roomCode, {
      id: Date.now().toString(),
      playerId: "system",
      playerName: "System",
      message: `${playerName} joined the room`,
      timestamp: new Date(),
      type: "system",
    })

    console.log(`[GameStore] Player ${playerName} joined room ${roomCode}`)
    return { room, player: newPlayer }
  }

  getRoom(roomCode: string): GameRoom | null {
    return this.rooms.get(roomCode) || null
  }

  updateRoom(roomCode: string, updates: Partial<GameRoom>): GameRoom | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    const updatedRoom = { ...room, ...updates }
    this.rooms.set(roomCode, updatedRoom)
    return updatedRoom
  }

  updatePlayer(roomCode: string, playerId: string, updates: Partial<Player>): GameRoom | null {
    const room = this.rooms.get(roomCode)
    if (!room) return null

    const playerIndex = room.players.findIndex((p) => p.id === playerId)
    if (playerIndex === -1) return null

    room.players[playerIndex] = { ...room.players[playerIndex], ...updates }
    this.rooms.set(roomCode, room)
    return room
  }

  removePlayer(roomCode: string, playerId: string): GameRoom | null {
    const room = this.rooms.get(roomCode)
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
      this.rooms.delete(roomCode)
      this.chatMessages.delete(roomCode)
      console.log(`[GameStore] Room ${roomCode} deleted (empty)`)
      return null
    }

    this.rooms.set(roomCode, room)

    // Add system message
    this.addChatMessage(roomCode, {
      id: Date.now().toString(),
      playerId: "system",
      playerName: "System",
      message: `${removedPlayer.name} left the room`,
      timestamp: new Date(),
      type: "system",
    })

    console.log(`[GameStore] Player ${removedPlayer.name} removed from room ${roomCode}`)
    return room
  }

  // Chat management
  addChatMessage(roomCode: string, message: ChatMessage): void {
    const messages = this.chatMessages.get(roomCode) || []
    messages.push(message)
    this.chatMessages.set(roomCode, messages)
  }

  getChatMessages(roomCode: string): ChatMessage[] {
    return this.chatMessages.get(roomCode) || []
  }

  // Game actions
  startGame(roomCode: string): GameRoom | null {
    const room = this.rooms.get(roomCode)
    if (!room || room.players.length < 3) {
      console.log(`[GameStore] Cannot start game in room ${roomCode}: ${!room ? "not found" : "not enough players"}`)
      return null
    }

    room.gameState = "playing"
    room.currentRound = 1
    room.timeLeft = 60

    // Initialize game based on type
    if (room.gameType === "imposter") {
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

      const wordSet = gameData.imposter[Math.floor(Math.random() * gameData.imposter.length)]
      const imposterIndex = Math.floor(Math.random() * room.players.length)

      room.gameData = {
        wordSet: {
          word: wordSet.word,
          imposter: wordSet.imposter,
        },
        imposterIndex,
        playerAnswers: {},
        roundAnswers: [],
      }

      console.log(`[GameStore] Imposter game started in room ${roomCode}`, {
        wordSet: room.gameData.wordSet,
        imposterIndex,
        imposterPlayer: room.players[imposterIndex]?.name,
      })
    }

    this.rooms.set(roomCode, room)

    // Add system message
    this.addChatMessage(roomCode, {
      id: Date.now().toString(),
      playerId: "system",
      playerName: "System",
      message: "Game started! Good luck everyone!",
      timestamp: new Date(),
      type: "system",
    })

    console.log(`[GameStore] Game started in room ${roomCode}`)
    return room
  }

  vote(roomCode: string, voterId: string, targetId: string): GameRoom | null {
    const room = this.rooms.get(roomCode)
    if (!room || room.gameState !== "voting") return null

    const targetPlayer = room.players.find((p) => p.id === targetId)
    const voter = room.players.find((p) => p.id === voterId)

    if (targetPlayer && voter && targetId !== voterId) {
      targetPlayer.votes++
      this.rooms.set(roomCode, room)

      // Add system message
      this.addChatMessage(roomCode, {
        id: Date.now().toString(),
        playerId: "system",
        playerName: "System",
        message: `${voter.name} voted for ${targetPlayer.name}`,
        timestamp: new Date(),
        type: "game",
      })

      console.log(`[GameStore] Vote cast in room ${roomCode}: ${voter.name} -> ${targetPlayer.name}`)
    }

    return room
  }

  private generateRoomCode(): string {
    let code: string
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (this.rooms.has(code))
    return code
  }
}

// Global instance
const gameStore = new GameStore()
export default gameStore
