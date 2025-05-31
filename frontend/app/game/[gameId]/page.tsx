"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Copy, Vote, Timer, ArrowLeft, AlertCircle, UserPlus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Chat } from "@/components/chat"
import { ConnectionStatus } from "@/components/connection-status"
import { useGameSocket } from "@/hooks/useGameSocket"

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameCode = params.gameId as string
  // Get username from localStorage
  const [storedUsername] = useLocalStorage("gamehub-username", "")

  const { game, error, loading, isConnected, joinRoom } = useGameSocket()

  useEffect(() => {
    if (gameCode && storedUsername) {
      joinRoom(gameCode, storedUsername)
    }
  }, [gameCode, storedUsername, joinRoom])

  console.log("game",game)

  const [playerAnswer, setPlayerAnswer] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [joinAttempted, setJoinAttempted] = useState(false)

  const handleLeaveRoom = async () => {
    // await leaveRoom()
    router.push("/")
  }

  const handleSubmitAnswer = async () => {
    if (!playerAnswer.trim()) return

    // await submitAnswer(playerAnswer.trim())
    setPlayerAnswer("")
  }

  const handleVote = async (playerId: string) => {
    const targetPlayer = game?.players.find((p) => p.id === playerId)

    // await vote(playerId)
  }

  const handleRetryJoin = () => {
    if (gameCode && storedUsername) {
      setJoinAttempted(false)
    }
  }



  // Error state - no room and no username
  if (!storedUsername && gameCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <UserPlus className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold mb-4">Username Required</h2>
          <p className="text-gray-300 mb-6">You need to set a username before joining a room.</p>
          <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-blue-500 to-cyan-600">
            Go to Home Page
          </Button>
        </div>
      </div>
    )
  }

  // Error state - room not found or other errors
  if (error && !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-4">Unable to Join Game</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-2">
            {gameCode && storedUsername && (
              <Button
                onClick={handleRetryJoin}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 mr-2"
                disabled={loading}
              >
                {loading ? "Retrying..." : "Try Again"}
              </Button>
            )}
            <Button onClick={() => router.push("/")} variant="outline" className="border-white/20 text-white">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Connection Status */}
      <ConnectionStatus
        isConnected={isConnected}
        onReconnect={handleRetryJoin}
        roomCode={game?.code}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLeaveRoom} className="hover:bg-white/10 text-white hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave
            </Button>
            <h1 className="text-3xl font-bold text-white">{game?.type}</h1>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && game && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-200 text-center">
              {error}
            </div>
          </motion.div>
        )}

        {game && (
          <AnimatePresence mode="wait">
            {game.phase === "waiting" && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Players List */}
                <div className="lg:col-span-2">
                  {/* <PlayerList players={room.players} currentPlayerId={currentPlayer?.id} showConnectionStatus={true} /> */}

                  {/* {game && !game.host && (
                    <div className="mt-4">
                      <Button
                        onClick={() => setReady(!currentPlayer.isReady)}
                        variant={currentPlayer.isReady ? "destructive" : "default"}
                        className="w-full"
                      >
                        {currentPlayer.isReady ? "Not Ready" : "Ready Up"}
                      </Button>
                    </div>
                  )} */}
                </div>

                {/* Game Controls */}
                <div>
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Game Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-300">Rounds</label>
                        {/* <div className="text-white font-medium">{game.maxRounds}</div> */}
                      </div>

                      {/* {currentPlayer?.isHost && (
                        <Button
                          onClick={startGame}
                          disabled={room.players.length < 3 || !room.players.every((p) => p.isReady)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          Start Game
                        </Button>
                      )} */}

                      {game.players.length < 3 && (
                        <p className="text-sm text-gray-400 text-center">Need at least 3 players to start</p>
                      )}
                      {/* {!game.players.every((p) => p.isReady) && game.players.length >= 3 && (
                        <p className="text-sm text-gray-400 text-center">All players must be ready</p>
                      )} */}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {game.phase === "playing" && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="max-w-2xl mx-auto"
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        {/* Round {game.currentRound} of {game.maxRounds} */}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-white">
                        <Timer className="w-4 h-4" />
                        {/* <span className="font-mono">{game.timeLeft}s</span> */}
                      </div>
                    </div>
                    {/* <Progress value={(game.timeLeft / 60) * 100} className="mt-2" /> */}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* {gameCode === "imposter" && gameData && gameData.word ? (
                      <>
                        <div className="text-center">
                          <div
                            className={`text-6xl font-bold mb-4 ${gameData.isImposter ? "text-red-400" : "text-blue-400"}`}
                          >
                            {gameData.word}
                          </div>
                          <Badge
                            variant={gameData.isImposter ? "destructive" : "default"}
                            className="text-lg px-4 py-2"
                          >
                            {gameData.isImposter ? "You are the IMPOSTER!" : "You are INNOCENT"}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <p className="text-gray-300 text-center">
                            {gameData.isImposter
                              ? "Say a word related to your word without being obvious!"
                              : "Say a word related to your word to prove you're innocent!"}
                          </p>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter your word..."
                              value={playerAnswer}
                              onChange={(e) => setPlayerAnswer(e.target.value)}
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                              onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                              maxLength={50}
                            />
                            <Button onClick={handleSubmitAnswer} disabled={!playerAnswer.trim()}>
                              Submit
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : gameCode === "imposter" && game.phase === "playing" ? (
                      // Loading state for imposter game
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white">Loading game data...</p>
                        <p className="text-sm text-gray-400 mt-2">Waiting for word assignment...</p>
                      </div>
                    ) : (
                      // Generic playing state for other games
                      <div className="text-center py-8">
                        <p className="text-white text-xl mb-4">Game in Progress</p>
                        <p className="text-gray-300">Game type: {game.type}</p>
                      </div>
                    )} */}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {game.phase === "voting" && (
              <motion.div
                key="voting"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="max-w-2xl mx-auto"
              >
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Vote className="w-5 h-5" />
                      Vote for the Imposter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* <div className="space-y-3">
                      {room.players
                        .filter((p) => !p.isEliminated)
                        .map((player) => (
                          <motion.div
                            key={player.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => handleVote(player.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-white font-medium">
                                {player.name} {player.id === currentPlayer?.id && "(You)"}
                              </span>
                              {player.votes > 0 && <Badge variant="destructive">{player.votes} votes</Badge>}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white"
                              disabled={player.id === currentPlayer?.id}
                            >
                              Vote
                            </Button>
                          </motion.div>
                        ))}
                    </div> */}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Chat Component */}
      {game && (
        <Chat
          messages={[]}
          onSendMessage={() => ("")}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </div>
  )
}
