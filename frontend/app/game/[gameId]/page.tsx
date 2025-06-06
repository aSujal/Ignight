"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Vote,
  Timer,
  ArrowLeft,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Chat } from "@/components/chat";
import { ConnectionStatus } from "@/components/connection-status";
import { useGameSocket } from "@/hooks/useGameSocket";
import { PlayerList } from "@/components/player-list";
import { WordImpostorGame } from "@/components/game/WordImpostorGame";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage"; // Keep for any top-level needs if any, or remove if fully delegated

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameCode = params.gameId as string;
  const [storedUsername] = useLocalStorage("ignight-username", "");
  // persistentPlayerId might not be directly needed here anymore if WordImpostorGame handles its own internal logic for it.
  // const [persistentPlayerId] = usePersistentPlayerId();

  // Destructure all functions from useGameSocket
  const {
    game,
    error,
    loading,
    isConnected,
    joinRoom,
    startGame,
    submitClue,
    submitVote,
    resetGame,
    hostSkipWordShow,
    hostEndDiscussion,
    hostEndVoting,
    readyUp,
    addBotToGame,
    updateAvatarStyle // Destructure new function
    // leaveRoom
  } = useGameSocket();

  useEffect(() => {
    if (gameCode && storedUsername) {
      joinRoom(gameCode, storedUsername);
    }
  }, [gameCode, storedUsername, joinRoom]);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLeaveRoom = async () => {
    // await leaveRoom()
    router.push("/");
  };

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
                onClick={handleLeaveRoom}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 mr-2"
                disabled={loading}
              >
                Leave Room
              </Button>
            )}
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="border-white/20"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  console.log("GamePage game state:", game); // Log game state in page.tsx as well for debugging
  // Error state is already handled above

  // Loading state
  if (loading && !game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <svg className="mx-auto h-16 w-16 text-blue-400 animate-spin mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-2xl font-semibold mb-2">Joining game room...</p>
          <p className="text-lg text-muted-foreground">Game Code: {gameCode}</p>
        </motion.div>
      </div>
    );
  }

  // Game not found or player not in game (if game object is null after loading and no error)
  if (!game && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-center max-w-md p-8 bg-card/80 backdrop-blur-lg rounded-xl shadow-2xl"
        >
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
          <h2 className="text-3xl font-bold mb-4">Game Not Found</h2>
          <p className="text-gray-300 mb-8">
            The game with code <span className="font-bold text-accent-foreground">{gameCode}</span> could not be found, or you may have been disconnected.
          </p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="border-white/30 hover:bg-white/10 text-lg px-8 py-3 rounded-lg"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // This is where the main game UI rendering happens
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-slate-900/50 to-background text-foreground"> {/* Use theme variables */}
      <ConnectionStatus
        isConnected={isConnected}
        // onReconnect={handleLeaveRoom} // Reconnect logic is usually handled by socket.io itself
        roomCode={game?.code}
      />

      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLeaveRoom} // Consider if leaveRoom action from useGameSocket is needed
              className="hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-full"
              aria-label="Leave game"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {/* Display game type dynamically, maybe with an icon */}
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight">{game?.type.replace('-', ' ')}</h1>
          </div>
          {/* Add other global controls if any, e.g., theme switcher, sound toggle */}
        </motion.div>

        {/* Top-level error display for issues that occur after joining */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-4 text-destructive-foreground text-center shadow-md">
              <p className="font-medium">Error: {error}</p>
            </div>
          </motion.div>
        )}

        {/* Dynamic Game Component Rendering */}
        {game && (
          <AnimatePresence mode="wait">
            {game.gameType === 'word-impostor' ? (
              <motion.div
                key="word-impostor-game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full"
              >
                <WordImpostorGame
                  game={game}
                  submitClue={submitClue}
                  submitVote={submitVote}
                  resetGame={resetGame}
                  startGame={startGame}
                  hostSkipWordShow={hostSkipWordShow}
                  hostEndDiscussion={hostEndDiscussion}
                  hostEndVoting={hostEndVoting}
                  readyUp={readyUp}
                  addBotToGame={addBotToGame}
                  updateAvatarStyle={updateAvatarStyle} // Pass down new function
                />
              </motion.div>
            ) : (
              <motion.div
                key="unknown-game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <Card className="max-w-md mx-auto bg-card/80 backdrop-blur-lg border-border shadow-xl p-8 rounded-xl">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <h2 className="text-2xl font-semibold text-primary-foreground mb-3">Unknown Game Type</h2>
                  <p className="text-muted-foreground">
                    The game type "<span className="font-medium text-accent-foreground">{game.gameType}</span>" is not supported by this client.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Chat Component - Can remain here as it's a global overlay */}
      {game && (
        <Chat
          messages={[]} // Assuming messages come from game state or another source
          onSendMessage={() => {}} // Pass actual send message function
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </div>
  );
}
            {/* Removed specific phase rendering like "waiting", "playing", "voting" from here. */}
            {/* This will be handled by the specific game component e.g. WordImpostorGame */}
          </AnimatePresence>
        )}
      </div>

      {/* Chat Component - Can remain here as it's a global overlay */}
      {game && (
        <Chat
          messages={[]}
          onSendMessage={() => ""}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </div>
  );
}
