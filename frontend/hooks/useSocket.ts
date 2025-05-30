"use client"

import { useEffect, useState } from "react"
import type { Socket } from "socket.io-client"
import SocketManager from "@/lib/socket"
import type { GameRoom, Player, ChatMessage } from "@/lib/types"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const socketManager = SocketManager.getInstance()
    const socketInstance = socketManager.connect()
    setSocket(socketInstance)

    // Connection events
    socketInstance.on("connect", () => {
      setIsConnected(true)
      setError(null)
      console.log("Connected to server")
    })

    socketInstance.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from server")
    })

    socketInstance.on("error", (error: string) => {
      setError(error)
      console.error("Socket error:", error)
    })

    // Room events
    socketInstance.on("room:joined", (data: { room: GameRoom; playerId: string }) => {
      setRoom(data.room)
      const player = data.room.players.find((p) => p.id === data.playerId)
      setCurrentPlayer(player || null)
      setError(null)
    })

    socketInstance.on("room:update", (updatedRoom: GameRoom) => {
      setRoom(updatedRoom)
    })

    socketInstance.on("room:error", (error: string) => {
      setError(error)
    })

    // Chat events
    socketInstance.on("chat:receive", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message])
    })

    // Game events
    socketInstance.on("game:round-start", (roundData: any) => {
      console.log("Round started:", roundData)
    })

    return () => {
      socketManager.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [])

  const createRoom = (gameType: string, playerName: string) => {
    if (socket) {
      socket.emit("room:create", { gameType, playerName })
    }
  }

  const joinRoom = (roomCode: string, playerName: string) => {
    if (socket) {
      socket.emit("room:join", { roomCode, playerName })
    }
  }

  const leaveRoom = () => {
    if (socket) {
      socket.emit("room:leave")
      setRoom(null)
      setCurrentPlayer(null)
      setChatMessages([])
    }
  }

  const setReady = (isReady: boolean) => {
    if (socket) {
      socket.emit("player:ready", isReady)
    }
  }

  const startGame = () => {
    if (socket && currentPlayer?.isHost) {
      socket.emit("game:start")
    }
  }

  const submitAnswer = (answer: string) => {
    if (socket) {
      socket.emit("game:submit-answer", answer)
    }
  }

  const vote = (targetPlayerId: string) => {
    if (socket) {
      socket.emit("game:vote", targetPlayerId)
    }
  }

  const sendMessage = (message: string) => {
    if (socket) {
      socket.emit("chat:message", message)
    }
  }

  return {
    socket,
    isConnected,
    room,
    currentPlayer,
    chatMessages,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    submitAnswer,
    vote,
    sendMessage,
  }
}
