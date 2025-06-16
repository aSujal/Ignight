import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, UserCheck } from "lucide-react";
import { GameState, Player } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { TimerProgressBar } from "../common/TimerProgressBar";
import { cn } from "@/lib/utils";

interface VotingPhaseProps {
  game: GameState;
  voteForPlayer: (playerId: string) => void;
  hostEndVoting: () => void;
  readyUp: () => void;
}

export function VotingPhase({
  game,
  voteForPlayer,
  hostEndVoting,
  readyUp,
}: VotingPhaseProps) {
  const [persistentPlayerId] = usePersistentPlayerId();
  const currentPlayer = game.players.find((p) => p.id === persistentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const [isReady, setIsReady] = useState(false);

  const hasVoted = game.votes?.some((v) => v.voterId === persistentPlayerId);
  const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;
  const votesCast = game.votes?.length ?? 0;
  const allVoted = votesCast === totalHumanPlayers;

  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    game.votes?.forEach(({ votedForPlayerId }) => {
      counts[votedForPlayerId] = (counts[votedForPlayerId] || 0) + 1;
    });
    return counts;
  }, [game.votes]);

  const alreadyVotedFor = game.votes?.find(
    (v) => v.voterId === persistentPlayerId
  )?.votedForPlayerId;

  const handleReadyUp = () => {
    readyUp();
    setIsReady(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-card/95 backdrop-blur-lg border-border/50 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="text-center border-b border-border/30 pb-6 pt-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardTitle className="text-3xl font-bold text-primary-foreground flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" />
            Voting Phase
          </CardTitle>
          <div className="mt-4 max-w-md mx-auto">
            <TimerProgressBar
              timeRemaining={game.timerRemaining || 0}
              duration={game.timerDuration || 0}
              label={`${votesCast}/${totalHumanPlayers} Voted`}
              className="h-3 rounded-full bg-muted/50"
            />
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            Select the player you suspect is the impostor.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {game.players.map((player) => {
              const voteCount = voteCounts[player.id] || 0;
              const isVoted = alreadyVotedFor === player.id;
              const hasPlayerVoted = game.votes?.some((v) => v.voterId === player.id);
              const isPlayerReady = game.readyPlayers.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={cn(
                    "relative flex items-center gap-4 p-4 rounded-xl bg-muted/40 transition-all duration-300 hover:bg-muted/60 hover:shadow-md",
                    isVoted && "ring-2 ring-primary/50",
                    !player.isConnected && "opacity-50"
                  )}
                >
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    width={48}
                    height={48}
                    className="rounded-full border-2 border-primary/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-base">{player.name}</p>
                      {hasPlayerVoted && (
                        <Badge variant="secondary" className="text-xs">
                          Voted
                        </Badge>
                      )}
                      {isPlayerReady && (
                        <UserCheck className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Votes: {voteCount}
                    </p>
                  </div>
                  {!hasVoted && player.isConnected && player.id !== persistentPlayerId && (
                    <Button
                      onClick={() => voteForPlayer(player.id)}
                      disabled={hasVoted || player.id === persistentPlayerId}
                      size="sm"
                      className="text-xs px-3 py-1"
                    >
                      Vote
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {hasVoted && (
            <div className="text-center p-4 bg-secondary/20 rounded-xl shadow-sm">
              <p className="text-secondary-foreground font-medium text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                You voted for{" "}
                <strong>
                  {game.players.find((p) => p.id === alreadyVotedFor)?.name ??
                    "Unknown"}
                </strong>
                . {allVoted ? "All players have voted!" : "Waiting for others..."}
              </p>
              {!isReady && (
                <Button
                  onClick={handleReadyUp}
                  className="mt-4 px-6 py-2 text-sm bg-green-600 hover:bg-green-700"
                >
                  Ready Up
                </Button>
              )}
              {isReady && (
                <p className="text-green-500 text-sm mt-2 flex items-center justify-center gap-1">
                  <UserCheck className="w-4 h-4" />
                  You are ready!
                </p>
              )}
            </div>
          )}

          {isHost && (
            <div className="pt-6 text-center">
              <Button
                onClick={hostEndVoting}
                variant="default"
                className="w-full sm:w-auto px-8 py-5 text-base rounded-xl shadow-lg bg-primary hover:bg-primary/90"
                disabled={!allVoted}
              >
                End Voting
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}