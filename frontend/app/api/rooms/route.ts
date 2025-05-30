import { type NextRequest, NextResponse } from "next/server"
import gameStore from "@/lib/game-store"

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    console.log(`[API] Room action: ${action}`, data)

    switch (action) {
      case "create": {
        const { gameType, playerName } = data
        if (!gameType || !playerName) {
          return NextResponse.json({ success: false, error: "Missing gameType or playerName" })
        }

        const room = gameStore.createRoom(gameType, playerName)
        console.log(`[API] Room created: ${room.code}`)
        return NextResponse.json({ success: true, room, playerId: room.players[0].id })
      }

      case "join": {
        const { roomCode, playerName } = data
        if (!roomCode || !playerName) {
          return NextResponse.json({ success: false, error: "Missing roomCode or playerName" })
        }

        const result = gameStore.joinRoom(roomCode, playerName)
        if (!result) {
          console.log(`[API] Failed to join room: ${roomCode}`)
          return NextResponse.json({ success: false, error: "Room not found, game already started, or name taken" })
        }

        console.log(`[API] Player joined room: ${roomCode}`)
        return NextResponse.json({ success: true, room: result.room, playerId: result.player.id })
      }

      case "leave": {
        const { roomCode, playerId } = data
        if (!roomCode || !playerId) {
          return NextResponse.json({ success: false, error: "Missing roomCode or playerId" })
        }

        const room = gameStore.removePlayer(roomCode, playerId)
        console.log(`[API] Player left room: ${roomCode}`)
        return NextResponse.json({ success: true, room })
      }

      case "ready": {
        const { roomCode, playerId, isReady } = data
        if (!roomCode || !playerId || typeof isReady !== "boolean") {
          return NextResponse.json({ success: false, error: "Missing roomCode, playerId, or isReady" })
        }

        const room = gameStore.updatePlayer(roomCode, playerId, { isReady })
        if (!room) {
          return NextResponse.json({ success: false, error: "Room or player not found" })
        }

        console.log(`[API] Player ready status updated: ${roomCode}`)
        return NextResponse.json({ success: true, room })
      }

      case "start": {
        const { roomCode } = data
        if (!roomCode) {
          return NextResponse.json({ success: false, error: "Missing roomCode" })
        }

        const room = gameStore.startGame(roomCode)
        if (!room) {
          return NextResponse.json({ success: false, error: "Cannot start game - need at least 3 players" })
        }

        console.log(`[API] Game started: ${roomCode}`)
        return NextResponse.json({ success: true, room })
      }

      case "vote": {
        const { roomCode, voterId, targetId } = data
        if (!roomCode || !voterId || !targetId) {
          return NextResponse.json({ success: false, error: "Missing roomCode, voterId, or targetId" })
        }

        const room = gameStore.vote(roomCode, voterId, targetId)
        if (!room) {
          return NextResponse.json({ success: false, error: "Room not found or not in voting phase" })
        }

        console.log(`[API] Vote cast: ${roomCode}`)
        return NextResponse.json({ success: true, room })
      }

      case "submit-answer": {
        const { roomCode, playerId, answer } = data
        if (!roomCode || !playerId || !answer) {
          return NextResponse.json({ success: false, error: "Missing roomCode, playerId, or answer" })
        }

        const room = gameStore.getRoom(roomCode)
        if (!room || room.gameState !== "playing") {
          return NextResponse.json({ success: false, error: "Room not found or not in playing state" })
        }

        if (!room.gameData.playerAnswers) {
          room.gameData.playerAnswers = {}
        }
        room.gameData.playerAnswers[playerId] = answer
        gameStore.updateRoom(roomCode, { gameData: room.gameData })

        // Add system message
        const player = room.players.find((p) => p.id === playerId)
        if (player) {
          gameStore.addChatMessage(roomCode, {
            id: Date.now().toString(),
            playerId: "system",
            playerName: "System",
            message: `${player.name} submitted their answer: "${answer}"`,
            timestamp: new Date(),
            type: "game",
          })
        }

        console.log(`[API] Answer submitted: ${roomCode}`)
        return NextResponse.json({ success: true, room: gameStore.getRoom(roomCode) })
      }

      default:
        return NextResponse.json({ success: false, error: "Invalid action" })
    }
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get("roomCode")

    if (!roomCode) {
      return NextResponse.json({ success: false, error: "Room code required" })
    }

    const room = gameStore.getRoom(roomCode)
    const messages = gameStore.getChatMessages(roomCode)

    if (!room) {
      console.log(`[API] Room not found: ${roomCode}`)
      return NextResponse.json({ success: false, error: "Room not found" })
    }

    console.log(`[API] Room data retrieved: ${roomCode}`, {
      playerCount: room.players.length,
      gameState: room.gameState,
      hasGameData: !!room.gameData,
      gameDataKeys: Object.keys(room.gameData || {}),
    })
    return NextResponse.json({ success: true, room, messages })
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
