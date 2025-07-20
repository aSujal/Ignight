"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GameState } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { CompactTimer } from "../common/CompactTimer";
import { PlayerStatusGrid } from "../common/PlayerStatusGrid";
import { ClueSubmissionArea } from "../common/ClueSubmissionArea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface DiscussionPhaseProps {
  game: GameState;
  submitClue: (clue: string) => void;
  readyUp: () => void;
  hostEndDiscussion: () => void;
}

export function DiscussionPhase({
  game,
  submitClue,
  readyUp,
  hostEndDiscussion,
}: DiscussionPhaseProps) {
  const [persistentPlayerId] = usePersistentPlayerId();

  const currentPlayer = useMemo(
    () => game.players.find((p) => p.id === persistentPlayerId),
    [game.players, persistentPlayerId]
  );

  const isImpostor = game.isImpostor ?? false;
  const isHost = currentPlayer?.isHost ?? false;
  const isPlayerReady = game.readyPlayers?.includes(persistentPlayerId ?? "") ?? false;
  const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;

  // Turn-based clue logic
  const isMyTurn = game.currentTurnPlayerId === persistentPlayerId;

  return (
    <>
      <div className="w-full flex flex-col items-center justify-center px-4 py-3">
        <Card className="w-full max-w-7xl bg-card/90 backdrop-blur-lg border border-border shadow-xl rounded-xl">
          <CardHeader className="text-center border-b border-border/50 pb-4 pt-4">
            {/* Enhanced header with prominent information display */}
            <div className="flex flex-col gap-3">
              {/* Top row: Title and Ready Count - prominently displayed */}
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                  Discussion
                </CardTitle>
                <AnimatePresence>
                  <motion.div
                    key={`ready-${game.readyPlayers?.length}`}
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-sm sm:text-base text-accent-foreground font-mono tabular-nums bg-muted/30 px-3 py-1 rounded-full"
                  >
                    <span>{game.readyPlayers?.length ?? 0}/{totalHumanPlayers} Ready</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              {game.timerDuration !== null && game.phaseStartTime !== null && (
                <div className="bg-white/10 rounded-lg p-4 space-y-3">
                  <CompactTimer
                    phaseStartTime={game.phaseStartTime}
                    duration={game.timerDuration}
                    label="Time remaining"
                    className="w-full"
                  />
                </div>
              )}
              {/* Prominent turn status display */}
              <AnimatePresence mode="wait">
                {game.currentTurnPlayerId && (
                  <motion.div
                    key={`turn-status-${game.currentTurnPlayerId}`}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      duration: 0.4
                    }}
                    className="w-full"
                  >
                    {isMyTurn ? (
                      <motion.div
                        className="bg-primary/10 border border-primary/30 rounded-lg p-3"
                        animate={{
                          borderColor: ["rgba(var(--primary), 0.3)", "rgba(var(--primary), 0.5)", "rgba(var(--primary), 0.3)"]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-2 h-2 bg-primary rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          <span className="text-primary font-semibold text-base">
                            YOUR TURN - Submit a clue
                          </span>
                          <motion.div
                            className="w-2 h-2 bg-primary rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.75
                            }}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="bg-muted/30 border border-muted-foreground/20 rounded-lg p-3"
                        animate={{
                          backgroundColor: ["rgba(var(--muted), 0.3)", "rgba(var(--muted), 0.4)", "rgba(var(--muted), 0.3)"]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          <span className="text-muted-foreground font-medium text-base">
                            Waiting for{" "}
                            <span className="font-semibold text-foreground">
                              {game.players.find((p) => p.id === game.currentTurnPlayerId)?.name}
                            </span>
                          </span>
                          <motion.div
                            className="w-2 h-2 bg-muted-foreground rounded-full"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.75
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Role description */}
              <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl mx-auto">
                {isImpostor
                  ? "You are the Impostor. Blend in, observe clues, and prepare your defense."
                  : "Submit one-word clues (multiple allowed), then discuss to find the impostor."}
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 space-y-3">
            {game.players.length > 0 && <PlayerStatusGrid game={game} />}

            <ClueSubmissionArea
              isMyTurn={isMyTurn}
              onClueSubmit={submitClue}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/30">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex-1"
              >
                <Button
                  onClick={readyUp}
                  className={cn(
                    "w-full py-3 text-base font-semibold rounded-lg shadow-md transition-all duration-300",
                    isPlayerReady && "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  )}
                  size="lg"
                >
                  {isPlayerReady ? (
                    <span className="">Unready</span>
                  ) : (
                    <span className="flex gap-2 items-center">
                      <motion.div initial={{ scale: 0.8, }}>
                        <Check />
                      </motion.div>
                      Ready for Voting
                    </span>
                  )}
                </Button>
              </motion.div>
              {isHost && (
                <motion.div
                  className="flex-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={hostEndDiscussion}
                    variant="outline"
                    className="w-full py-3 text-base font-semibold rounded-lg shadow-md transition-all duration-300 text-orange-500"
                    size="lg"
                  >
                    End Discussion (Host)
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}