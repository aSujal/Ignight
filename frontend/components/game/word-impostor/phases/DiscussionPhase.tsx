import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GameState, Player } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { TimerProgressBar } from "../common/TimerProgressBar";

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
  const [clue, setClue] = useState("");
  const [persistentPlayerId] = usePersistentPlayerId();

  const currentPlayer = game.players.find((p) => p.id === persistentPlayerId);
  const isImpostor = game.isImpostor ?? false;
  const isHost = currentPlayer?.isHost ?? false;

  const hasSubmittedClue = !!game.clues?.some((c) => c.playerId === persistentPlayerId);
  const isPlayerReady = game.readyPlayers?.includes(persistentPlayerId ?? "") ?? false;
  const canPlayerReady = hasSubmittedClue || isImpostor;
  const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;

  const handleSubmitClue = () => {
    if (clue.trim()) {
      submitClue(clue.trim());
      setClue("");
    }
  };
  console.log("game", game);
  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl">
      <CardHeader className="text-center border-b border-border/50 pb-4 pt-6">
        <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">
          Discussion
        </CardTitle>
        <div className="mt-3 text-lg text-accent-foreground font-mono tabular-nums">
          <TimerProgressBar
              timeRemaining={game.timerRemaining || 0}
              duration={game.timerDuration || 0}
              className="max-w-md mx-auto"
            />
          <span>{game.readyPlayers?.length ?? 0}/{totalHumanPlayers} Ready</span>
        </div>
        <p className="text-muted-foreground pt-2 text-base">
          {isImpostor
            ? "You are the Impostor. Blend in, observe clues, and prepare your defense."
            : "Submit your one-word clue, then discuss to find the impostor."}
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* CLUE INPUT OR CONFIRMATION */}
        {!hasSubmittedClue && (
          <div className="flex gap-3 items-stretch p-1 bg-muted/30 rounded-lg shadow">
            <Input
              placeholder="Enter your one-word clue..."
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitClue()}
              className="flex-grow p-5 h-auto text-base rounded-md"
            />
            <Button
              onClick={handleSubmitClue}
              disabled={!clue.trim()}
              className="px-8 py-3 text-base rounded-md shadow-lg"
            >
              Submit
            </Button>
          </div>
        )}

        {hasSubmittedClue && (
          <div className="text-center p-4 bg-secondary/70 rounded-lg shadow-md">
            <p className="text-secondary-foreground font-medium text-base">
              Your clue is submitted! Discuss with other players.
            </p>
          </div>
        )}

        {/* CLUE LIST */}
        {game.clues && game.clues.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-2xl font-semibold text-primary-foreground mb-3 text-center">
              Submitted Clues
            </h3>
            <div className="max-h-72 overflow-y-auto space-y-3 p-2 bg-background/50 rounded-lg">
              {game.clues.map(({ playerId, playerName, clue }) => {
                const cluePlayer = game.players.find((p) => p.id === playerId);
                return (
                  <div
                    key={playerId}
                    className="flex items-center justify-between p-4 bg-muted/80 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {cluePlayer && (
                        <Image
                          src={cluePlayer.avatarUrl}
                          alt={`${playerName}'s avatar`}
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-primary/60"
                        />
                      )}
                      <span className="font-semibold text-lg">{playerName}:</span>
                    </div>
                    <span className="font-bold text-xl text-right">{clue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* READY + HOST CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <Button
            onClick={readyUp}
            disabled={!canPlayerReady || isPlayerReady}
            className="flex-1 py-6 text-lg rounded-lg shadow-lg"
          >
            {isPlayerReady ? "✔️ Ready!" : "Ready to Vote"}
          </Button>
          {isHost && (
            <Button
              onClick={hostEndDiscussion}
              variant="outline"
              className="flex-1 py-6 text-lg rounded-lg shadow-lg"
            >
              End Discussion
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
