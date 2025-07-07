"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GameState } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { TimerProgressBar } from "../common/TimerProgressBar";
import { toast } from "sonner";
import PlayerListVirtualized from "../common/PlayerListVirtualized";

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
  console.log('game:', game);
  const [clue, setClue] = useState("");
  const [persistentPlayerId] = usePersistentPlayerId();

  const currentPlayer = useMemo(
    () => game.players.find((p) => p.id === persistentPlayerId),
    [game.players, persistentPlayerId]
  );

  const isImpostor = game.isImpostor ?? false;
  const isHost = currentPlayer?.isHost ?? false;
  const isPlayerReady = game.readyPlayers?.includes(persistentPlayerId ?? "") ?? false;
  const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;
  const submittedClues = game.clues.filter((c) => c.playerId === persistentPlayerId);
  const canPlayerReady = submittedClues.length > 0 || isImpostor;

  // Turn-based clue logic
  const isMyTurn =
    game.currentTurnPlayerId === persistentPlayerId;

  const handleSubmitClue = () => {
    const trimmed = clue.trim();
    if (!trimmed) {
      toast.error("Clue cannot be empty");
      return;
    }
    if (trimmed.includes(" ")) {
      toast.error("Only one word is allowed per clue");
      return;
    }

    submitClue(trimmed);
    setClue("");
    toast.success("Clue submitted!");
  };
  console.log("game", game);
  return (
    <>
      {game.timerRemaining !== undefined && (
        <TimerProgressBar duration={60} remaining={game.timerRemaining} />
      )}
      <div className="w-full flex flex-col items-center justify-center px-4 py-6">
        <Card className="w-full max-w-7xl bg-card/90 backdrop-blur-lg border border-border shadow-xl rounded-2xl">
          <CardHeader className="text-center border-b border-border/50 pb-4 pt-6">
            <CardTitle className="text-4xl font-extrabold text-primary background tracking-tight">
              Discussion
            </CardTitle>
            <div className="mt-3 text-base sm:text-lg text-accent-foreground font-mono tabular-nums">
              {"  |  "}
              <span>{game.readyPlayers?.length ?? 0}/{totalHumanPlayers} Ready</span>
            </div>
            <p className="text-muted-foreground pt-2 text-sm sm:text-base max-w-2xl mx-auto">
              {isImpostor
                ? "You are the Impostor. Blend in, observe clues, and prepare your defense."
                : "Submit one-word clues (multiple allowed), then discuss to find the impostor."}
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">

            {submittedClues.length > 0 && (
              <div className="text-center p-4 bg-secondary/70 rounded-lg shadow-inner">
                <p className="text-secondary-foreground font-medium text-base">
                  You've submitted {submittedClues.length} clue{submittedClues.length > 1 ? "s" : ""}.
                </p>
              </div>
            )}

            {game.players.length > 0 && <PlayerListVirtualized game={game} />}

            {/* Turn indicator */}
            {game.currentTurnPlayerId && (
              <div className="text-center mb-2">
                {isMyTurn ? (
                  <span className="text-green-600 font-bold text-lg">
                    Your turn to submit a clue!
                  </span>
                ) : (
                  <span className="text-yellow-600 font-medium text-lg">
                    Waiting for{" "}
                    {
                      game.players.find((p) => p.id === game.currentTurnPlayerId)
                        ?.name
                    }
                    's clue...
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/20 rounded-xl shadow">
              <Input
                placeholder="Enter your one-word clue..."
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && isMyTurn && handleSubmitClue()}
                className="flex-grow p-4 h-auto text-base rounded-md"
                disabled={!isMyTurn}
              />
              <Button
                onClick={handleSubmitClue}
                className="px-6 py-3 text-base rounded-md shadow-md h-auto w-full sm:w-auto"
                disabled={!isMyTurn}
              >
                Submit
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                onClick={readyUp}
                disabled={!canPlayerReady || isPlayerReady}
                className="flex-1 py-5 text-lg rounded-lg shadow-lg"
              >
                {isPlayerReady ? "✔️ Ready!" : "Ready to Vote"}
              </Button>
              {isHost && (
                <Button
                  onClick={hostEndDiscussion}
                  variant="outline"
                  className="flex-1 py-5 text-lg rounded-lg shadow-lg"
                >
                  End Discussion
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
