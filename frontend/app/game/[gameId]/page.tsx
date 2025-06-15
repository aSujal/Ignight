"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Chat } from "@/components/chat";
import { ConnectionStatus } from "@/components/connection-status";
import { useGameSocket } from "@/hooks/useGameSocket";
import { WordImpostorGame } from "@/components/game/word-impostor/WordImpostorGame";
import ErrorMessage from "@/components/error-message";
import ScreenLoader from "@/components/loader";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameCode = params.gameId as string;
  const [storedUsername] = useLocalStorage("ignight-username", "");

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
    hostEndWordShow,
    hostEndDiscussion,
    hostEndVoting,
    readyUp,
    addBotToGame,
    removePlayer,
  } = useGameSocket();

  useEffect(() => {
    if (gameCode && storedUsername) {
      joinRoom(gameCode, storedUsername);
    }
  }, [gameCode, storedUsername, joinRoom]);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLeaveRoom = async () => {
    router.push("/");
  };

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

  console.log("GamePage game state:", game);
  if (loading && !game) {
    return (
      <ScreenLoader
        title="Joining Game Room"
        description={`Game Code: ${gameCode}`}
      />
    );
  }

  if (!game && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-center max-w-md p-8 bg-card/80 backdrop-blur-lg rounded-xl shadow-2xl"
        >
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-400" />
          <h2 className="text-3xl font-bold mb-4">Game Not Found</h2>
          <p className="text-gray-300 mb-8">
            The game with code{" "}
            <span className="font-bold text-accent-foreground">{gameCode}</span>{" "}
            could not be found, or you may have been disconnected.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-slate-900/50 to-background text-foreground">
      <ConnectionStatus isConnected={isConnected} roomCode={game?.code} />
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
              onClick={handleLeaveRoom}
              className="hover:bg-muted/20 rounded-full"
              aria-label="Leave game"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {game?.type?.slice(0, 1)?.toUpperCase()}
              {game?.type?.slice(1, game?.type?.length)?.replace("-", " ")}
            </h1>
          </div>
        </motion.div>
        {error && <ErrorMessage error={error} />}
        {game && (
          <AnimatePresence mode="wait">
            {game.type === "word-impostor" ? (
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
                  hostEndWordShow={hostEndWordShow}
                  hostEndDiscussion={hostEndDiscussion}
                  hostEndVoting={hostEndVoting}
                  readyUp={readyUp}
                  addBotToGame={addBotToGame}
                  removePlayer={removePlayer}
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
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h2 className="text-2xl font-semibold text-primary-foreground mb-3">
                    Unknown Game Type
                  </h2>
                  <p className="text-muted-foreground">
                    The game type "
                    <span className="font-medium text-accent-foreground">
                      {game.type}
                    </span>
                    " is not supported by this client.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      {game && (
        <Chat
          messages={[]}
          onSendMessage={() => {}}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </div>
  );
}
