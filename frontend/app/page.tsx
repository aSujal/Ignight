"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Zap, Music, HelpCircle, Eye, Volume2, CheckCircle, Loader2 } from "lucide-react"
import { usePollingGame } from "@/hooks/usePollingGame"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useRouter } from "next/navigation"

const games = [
  {
    id: "imposter",
    title: "Who's the Imposter?",
    description: "Find the imposter among your friends in this word-based deduction game",
    icon: Eye,
    players: "3-10 players",
    duration: "5-15 min",
    color: "from-red-500 to-pink-600",
  },
  {
    id: "question",
    title: "Odd One Out",
    description: "Everyone gets the same question except one. Find who got the different question!",
    icon: HelpCircle,
    players: "4-12 players",
    duration: "10-20 min",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "music",
    title: "Guess the Sound",
    description: "AI-generated playlists challenge your music knowledge",
    icon: Volume2,
    players: "2-8 players",
    duration: "15-30 min",
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "would-you-rather",
    title: "Would You Rather",
    description: "Make impossible choices and see how your friends decide",
    icon: Zap,
    players: "2-12 players",
    duration: "10-25 min",
    color: "from-green-500 to-emerald-600",
  },
]

export default function HomePage() {
  // Use localStorage for persistent username
  const [playerName, setPlayerName] = useLocalStorage("gamehub-username", "")
  const [roomCode, setRoomCode] = useState("")
  const [creatingRoom, setCreatingRoom] = useState<string | null>(null)

  const { isConnected, createRoom, joinRoom, error, isLoading } = usePollingGame()
  const router = useRouter()

  const handleCreateRoom = async (gameId: string) => {
    if (!playerName.trim()) return

    setCreatingRoom(gameId)
    try {
      const result = await createRoom(gameId, playerName.trim())
      if (result?.room) {
        // Navigate to the game page with the room code
        router.push(`/game/${gameId}?room=${result.room.code}`)
      }
    } catch (error) {
      console.error("Failed to create room:", error)
    } finally {
      setCreatingRoom(null)
    }
  }

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return

    const result = await joinRoom(roomCode.trim().toUpperCase(), playerName.trim())
    if (result?.room) {
      // Navigate to the game page with the room code
      router.push(`/game/${result.room.gameType}?room=${result.room.code}`)
    }
  }

  const handlePlayerNameChange = (value: string) => {
    setPlayerName(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50">
        <Badge variant="default" className="flex items-center gap-2 bg-green-500">
          <CheckCircle className="w-3 h-3" />
          Connected
        </Badge>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-4">
            GameHub
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Play amazing multiplayer games with friends online. Real-time multiplayer with HTTP polling!
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mb-6">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-200 text-center">
              {error}
            </div>
          </motion.div>
        )}

        {/* Player Setup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md mx-auto mb-12"
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center">Join the Fun</CardTitle>
              {playerName && (
                <p className="text-center text-sm text-gray-300">
                  Welcome back, <span className="text-purple-300 font-medium">{playerName}</span>!
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => handlePlayerNameChange(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                maxLength={20}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={!playerName.trim() || !roomCode.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {games.map((game, index) => {
            const IconComponent = game.icon
            const isCreating = creatingRoom === game.id

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: isCreating ? 1 : 1.02 }}
                whileTap={{ scale: isCreating ? 1 : 0.98 }}
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${game.color}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white group-hover:text-purple-200 transition-colors">
                          {game.title}
                        </CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {game.players}
                          </Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                            {game.duration}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-gray-300">{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCreateRoom(game.id)}
                      disabled={!playerName.trim() || isCreating}
                      className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 transition-opacity`}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Creating Room...
                        </>
                      ) : (
                        "Create Room"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap justify-center gap-6 text-gray-300">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Real-time HTTP Polling</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-400" />
              <span>AI-Generated Content</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Up to 12 Players</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
