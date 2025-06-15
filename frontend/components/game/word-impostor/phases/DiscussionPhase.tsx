"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GameState } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { toast } from "sonner"; // Toaster system

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

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-6">
      <Card className="w-full max-w-3xl bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl">
        <CardHeader className="text-center border-b border-border/50 pb-4 pt-6">
          <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">
            Discussion
          </CardTitle>
          <div className="mt-3 text-lg text-accent-foreground font-mono tabular-nums">
            {game.timerRemaining !== undefined && (
              <span>Time: {game.timerRemaining}s</span>
            )}
            {"  |  "}
            <span>{game.readyPlayers?.length ?? 0}/{totalHumanPlayers} Ready</span>
          </div>
          <p className="text-muted-foreground pt-2 text-base">
            {isImpostor
              ? "You are the Impostor. Blend in, observe clues, and prepare your defense."
              : "Submit one-word clues (multiple allowed), then discuss to find the impostor."}
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* MULTIPLE CLUE SUBMISSIONS */}
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
              className="px-6 py-3 text-base rounded-md shadow-lg"
            >
              Submit
            </Button>
          </div>

          {submittedClues.length > 0 && (
            <div className="text-center p-4 bg-secondary/70 rounded-lg shadow-md">
              <p className="text-secondary-foreground font-medium text-base">
                You've submitted {submittedClues.length} clue{submittedClues.length > 1 ? "s" : ""}.
              </p>
            </div>
          )}

          {/* CLUE LIST */}
          {game.clues.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-2xl font-semibold text-primary-foreground mb-3 text-center">
                Submitted Clues
              </h3>
              <div className="max-h-72 overflow-y-auto space-y-3 p-2 bg-background/50 rounded-lg">
                {game.clues.map(({ playerId, playerName, clue }, idx) => {
                  const cluePlayer = game.players.find((p) => p.id === playerId);
                  return (
                    <div
                      key={`${playerId}-${idx}`}
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
    </div>
  );
}
