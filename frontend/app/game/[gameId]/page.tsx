"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Copy, Vote, Timer, ArrowLeft, AlertCircle, UserPlus } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { usePollingGame } from "@/hooks/usePollingGame"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Chat } from "@/components/chat"
import { ConnectionStatus } from "@/components/connection-status"
import { DebugPanel } from "@/components/debug-panel"
import { PlayerList } from "@/components/player-list"
import logger from "@/lib/logger"

export default function GamePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameId = params.gameId as string
  const roomCodeFromUrl = searchParams.get("room")

  // Get username from localStorage
  const [storedUsername] = useLocalStorage("gamehub-username", "")

  const {
    room,
    currentPlayer,
    chatMessages,
    error,
    connectionStatus,
    isLoading,
    leaveRoom,
    setReady,
    startGame,
    submitAnswer,
    vote,
    sendMessage,
    joinExistingRoom,
  } = usePollingGame()

  const [playerAnswer, setPlayerAnswer] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [gameData, setGameData] = useState<any>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [joinAttempted, setJoinAttempted] = useState(false)
  const [initializationTimeout, setInitializationTimeout] = useState(false)

  // Initialize logging for this page
  useEffect(() => {
    logger.info("Game page loaded", {
      gameId,
      roomCodeFromUrl,
      storedUsername,
      timestamp: new Date().toISOString(),
    })

    return () => {
      logger.info("Game page unloaded", { gameId, roomCodeFromUrl })
    }
  }, [gameId, roomCodeFromUrl, storedUsername])

  // Auto-join room if we have room code and username
  useEffect(() => {
    if (roomCodeFromUrl && storedUsername && !joinAttempted && !room && !isLoading && !initializationTimeout) {
      setJoinAttempted(true)
      logger.info("Auto-joining room from URL", {
        roomCode: roomCodeFromUrl,
        username: storedUsername,
      })

      joinExistingRoom(roomCodeFromUrl, storedUsername)
    }
  }, [roomCodeFromUrl, storedUsername, joinAttempted, room, isLoading, joinExistingRoom, initializationTimeout])

  // Handle initialization timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInitialized(true)
      setInitializationTimeout(true)

      if (!room && !error && !isLoading) {
        logger.warn("Game page timeout - no room data received", {
          gameId,
          roomCodeFromUrl,
          storedUsername,
          joinAttempted,
          connectionStatus,
        })

        if (!roomCodeFromUrl) {
          logger.info("No room code in URL, redirecting to home")
          router.push("/")
        } else if (!storedUsername) {
          logger.info("No stored username, redirecting to home")
          router.push("/")
        }
      }
    }, 3000) // Reduced to 3 seconds

    return () => clearTimeout(timer)
  }, [room, error, isLoading, gameId, roomCodeFromUrl, storedUsername, router, joinAttempted, connectionStatus])

  // Mark as initialized when we have room data
  useEffect(() => {
    if (room && !hasInitialized) {
      setHasInitialized(true)
      logger.info("Game page initialized with room data", {
        roomCode: room.code,
        gameState: room.gameState,
        playerCount: room.players.length,
      })
    }
  }, [room, hasInitialized])

  // Log room and player changes
  useEffect(() => {
    if (room) {
      logger.roomAction(
        room.code,
        "room_data_updated",
        `Room data updated - ${room.players.length} players, state: ${room.gameState}`,
        {
          playerCount: room.players.length,
          gameState: room.gameState,
          timeLeft: room.timeLeft,
          players: room.players.map((p) => ({
            id: p.id,
            name: p.name,
            isConnected: p.isConnected,
            isReady: p.isReady,
          })),
          gameData: room.gameData ? "present" : "missing",
        },
      )
    }
  }, [room])

  // Handle imposter game data with proper null checks
  useEffect(() => {
    if (
      room?.gameType === "imposter" &&
      room.gameData &&
      room.gameData.wordSet &&
      room.gameData.wordSet.word &&
      room.gameData.wordSet.imposter &&
      currentPlayer &&
      typeof room.gameData.imposterIndex === "number"
    ) {
      const isImposter = room.players.findIndex((p) => p.id === currentPlayer.id) === room.gameData.imposterIndex
      const word = isImposter ? room.gameData.wordSet.imposter : room.gameData.wordSet.word

      setGameData({ word, isImposter })

      logger.gameAction("imposter_role_assigned", `Player role assigned: ${isImposter ? "IMPOSTER" : "INNOCENT"}`, {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        word,
        isImposter,
        wordSet: room.gameData.wordSet,
        imposterIndex: room.gameData.imposterIndex,
      })
    } else if (room?.gameType === "imposter" && room.gameState === "playing" && !gameData) {
      // Game is playing but we don't have game data yet
      logger.warn("Imposter game is playing but game data is incomplete", {
        roomCode: room.code,
        gameState: room.gameState,
        hasGameData: !!room.gameData,
        hasWordSet: !!(room.gameData && room.gameData.wordSet),
        hasCurrentPlayer: !!currentPlayer,
        imposterIndex: room.gameData?.imposterIndex,
      })
    }
  }, [room, currentPlayer, gameData])

  const handleLeaveRoom = async () => {
    logger.playerAction(currentPlayer?.id || "unknown", "leave_game_page", "Player leaving game page", {
      gameId,
      roomCode: room?.code,
    })

    await leaveRoom()
    router.push("/")
  }

  const handleSubmitAnswer = async () => {
    if (!playerAnswer.trim()) return

    logger.playerAction(currentPlayer?.id || "unknown", "submit_answer", "Player submitting answer", {
      gameId,
      roomCode: room?.code,
      answerLength: playerAnswer.trim().length,
    })

    await submitAnswer(playerAnswer.trim())
    setPlayerAnswer("")
  }

  const handleVote = async (playerId: string) => {
    const targetPlayer = room?.players.find((p) => p.id === playerId)

    logger.playerAction(currentPlayer?.id || "unknown", "vote_cast", `Player voting for ${targetPlayer?.name}`, {
      gameId,
      roomCode: room?.code,
      targetPlayerId: playerId,
      targetPlayerName: targetPlayer?.name,
    })

    await vote(playerId)
  }

  const copyRoomCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code)
      logger.info("Room code copied to clipboard", { roomCode: room.code })
    }
  }

  const handleRetryJoin = () => {
    if (roomCodeFromUrl && storedUsername) {
      setJoinAttempted(false)
      setInitializationTimeout(false)
      setHasInitialized(false)
      logger.info("Retrying room join", {
        roomCode: roomCodeFromUrl,
        username: storedUsername,
      })
    }
  }

  const getGameTitle = () => {
    switch (gameId) {
      case "imposter":
        return "Who's the Imposter?"
      case "question":
        return "Odd One Out"
      case "music":
        return "Guess the Sound"
      case "would-you-rather":
        return "Would You Rather"
      default:
        return "Game"
    }
  }

  // Loading state - only show if we haven't initialized and are still within timeout
  if (!hasInitialized && !initializationTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl mb-2">Loading game...</p>
          <p className="text-sm text-gray-400">
            {connectionStatus === "connecting" ? "Connecting to room..." : "Initializing game..."}
          </p>
          {roomCodeFromUrl && <p className="text-sm text-gray-400 mt-2">Room: {roomCodeFromUrl}</p>}
        </div>
      </div>
    )
  }

  // Error state - no room and no username
  if (!storedUsername && roomCodeFromUrl) {
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
  if (error && !room && hasInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-4">Unable to Join Game</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-2">
            {roomCodeFromUrl && storedUsername && (
              <Button
                onClick={handleRetryJoin}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 mr-2"
                disabled={isLoading}
              >
                {isLoading ? "Retrying..." : "Try Again"}
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
        isConnected={connectionStatus === "connected"}
        connectionStatus={connectionStatus}
        roomCode={room?.code}
      />

      {/* Debug Panel */}
      <DebugPanel />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLeaveRoom} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave
            </Button>
            <h1 className="text-3xl font-bold text-white">{getGameTitle()}</h1>
          </div>

          {room && room.gameState === "lobby" && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                Room: {room.code}
              </Badge>
              <Button variant="ghost" size="sm" onClick={copyRoomCode} className="text-white hover:bg-white/10">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Error Display */}
        {error && room && (
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

        {room && (
          <AnimatePresence mode="wait">
            {room.gameState === "lobby" && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Players List */}
                <div className="lg:col-span-2">
                  <PlayerList players={room.players} currentPlayerId={currentPlayer?.id} showConnectionStatus={true} />

                  {currentPlayer && !currentPlayer.isHost && (
                    <div className="mt-4">
                      <Button
                        onClick={() => setReady(!currentPlayer.isReady)}
                        variant={currentPlayer.isReady ? "destructive" : "default"}
                        className="w-full"
                      >
                        {currentPlayer.isReady ? "Not Ready" : "Ready Up"}
                      </Button>
                    </div>
                  )}
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
                        <div className="text-white font-medium">{room.maxRounds}</div>
                      </div>

                      {currentPlayer?.isHost && (
                        <Button
                          onClick={startGame}
                          disabled={room.players.length < 3 || !room.players.every((p) => p.isReady)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          Start Game
                        </Button>
                      )}

                      {room.players.length < 3 && (
                        <p className="text-sm text-gray-400 text-center">Need at least 3 players to start</p>
                      )}
                      {!room.players.every((p) => p.isReady) && room.players.length >= 3 && (
                        <p className="text-sm text-gray-400 text-center">All players must be ready</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {room.gameState === "playing" && (
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
                        Round {room.currentRound} of {room.maxRounds}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-white">
                        <Timer className="w-4 h-4" />
                        <span className="font-mono">{room.timeLeft}s</span>
                      </div>
                    </div>
                    <Progress value={(room.timeLeft / 60) * 100} className="mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {gameId === "imposter" && gameData && gameData.word ? (
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
                              onKeyPress={(e) => e.key === "Enter" && handleSubmitAnswer()}
                              maxLength={50}
                            />
                            <Button onClick={handleSubmitAnswer} disabled={!playerAnswer.trim()}>
                              Submit
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : gameId === "imposter" && room.gameState === "playing" ? (
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
                        <p className="text-gray-300">Game type: {room.gameType}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {room.gameState === "voting" && (
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
                    <div className="space-y-3">
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
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Chat Component */}
      {room && (
        <Chat
          messages={chatMessages}
          onSendMessage={sendMessage}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </div>
  )
}
