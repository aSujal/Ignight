import { type NextRequest, NextResponse } from "next/server"
import gameStore from "@/lib/game-store"

export async function POST(request: NextRequest) {
  try {
    const { roomCode, playerId, message } = await request.json()

    const room = gameStore.getRoom(roomCode)
    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" })
    }

    const player = room.players.find((p) => p.id === playerId)
    if (!player) {
      return NextResponse.json({ success: false, error: "Player not found" })
    }

    const chatMessage = {
      id: Date.now().toString(),
      playerId,
      playerName: player.name,
      message: message.trim(),
      timestamp: new Date(),
      type: "chat" as const,
    }

    gameStore.addChatMessage(roomCode, chatMessage)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get("roomCode")

    if (!roomCode) {
      return NextResponse.json({ success: false, error: "Room code required" })
    }

    const messages = gameStore.getChatMessages(roomCode)
    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" })
  }
}
