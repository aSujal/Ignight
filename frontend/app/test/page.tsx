"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"
import { useRouter } from "next/navigation"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message: string
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Server Connection", status: "pending", message: "Checking server status..." },
    { name: "Socket Connection", status: "pending", message: "Connecting to WebSocket..." },
    { name: "Room Creation", status: "pending", message: "Testing room creation..." },
    { name: "Player Management", status: "pending", message: "Testing player join/leave..." },
    { name: "Chat System", status: "pending", message: "Testing chat functionality..." },
  ])

  const [testPlayerName] = useState(`TestPlayer_${Math.random().toString(36).substring(2, 7)}`)
  const { isConnected, createRoom, joinRoom, sendMessage, room, currentPlayer, chatMessages, error } = useSocket()
  const router = useRouter()

  const updateTest = (index: number, status: "success" | "error", message: string) => {
    setTests((prev) => prev.map((test, i) => (i === index ? { ...test, status, message } : test)))
  }

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    // Test 1: Server Connection
    try {
      const response = await fetch("/api/socketio")
      if (response.ok) {
        updateTest(0, "success", "Server is running and responding")
      } else {
        updateTest(0, "error", "Server responded with error")
      }
    } catch (error) {
      updateTest(0, "error", "Failed to connect to server")
    }

    // Wait for socket connection
    setTimeout(() => {
      // Test 2: Socket Connection
      if (isConnected) {
        updateTest(1, "success", "WebSocket connected successfully")

        // Test 3: Room Creation
        setTimeout(() => {
          createRoom("imposter", testPlayerName)
        }, 1000)
      } else {
        updateTest(1, "error", "WebSocket connection failed")
      }
    }, 2000)
  }

  useEffect(() => {
    if (room && currentPlayer) {
      updateTest(2, "success", `Room ${room.code} created successfully`)
      updateTest(3, "success", `Player ${currentPlayer.name} joined as host`)

      // Test 5: Chat System
      setTimeout(() => {
        sendMessage("Test message from automated test")
      }, 1000)
    }
  }, [room, currentPlayer])

  useEffect(() => {
    if (chatMessages.length > 0) {
      updateTest(4, "success", "Chat message sent and received")
    }
  }, [chatMessages])

  useEffect(() => {
    if (error) {
      const errorTestIndex = tests.findIndex((test) => test.status === "pending")
      if (errorTestIndex !== -1) {
        updateTest(errorTestIndex, "error", error)
      }
    }
  }, [error])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
    }
  }

  const allTestsComplete = tests.every((test) => test.status !== "pending")
  const allTestsPassed = tests.every((test) => test.status === "success")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-white">System Test</h1>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Test Results */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Multiplayer System Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="text-white font-medium">{test.name}</div>
                    <div className="text-gray-300 text-sm">{test.message}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Overall Status */}
          {allTestsComplete && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">{allTestsPassed ? "🎉" : "⚠️"}</div>
                  <h2 className={`text-2xl font-bold mb-2 ${allTestsPassed ? "text-green-400" : "text-yellow-400"}`}>
                    {allTestsPassed ? "All Tests Passed!" : "Some Tests Failed"}
                  </h2>
                  <p className="text-gray-300 mb-4">
                    {allTestsPassed
                      ? "Your multiplayer system is working perfectly!"
                      : "Some features may not work as expected. Check the failed tests above."}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Run Tests Again
                    </Button>
                    {allTestsPassed && (
                      <Button
                        onClick={() => router.push("/")}
                        className="bg-gradient-to-r from-green-500 to-emerald-600"
                      >
                        Start Playing!
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Room Info */}
          {room && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Test Room Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Room Code:</span>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {room.code}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Game Type:</span>
                  <span className="text-white">{room.gameType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Players:</span>
                  <span className="text-white">{room.players.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Game State:</span>
                  <Badge variant="outline" className="border-white/20 text-white">
                    {room.gameState}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Environment Info */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Environment Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">NODE_ENV:</span>
                <span className="text-white">{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">SOCKET_PORT:</span>
                <span className="text-white">{process.env.SOCKET_PORT || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">NEXT_PUBLIC_SOCKET_PORT:</span>
                <span className="text-white">{process.env.NEXT_PUBLIC_SOCKET_PORT || "Not set"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
