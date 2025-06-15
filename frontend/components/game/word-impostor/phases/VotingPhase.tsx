import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GameState, Player } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { TimerProgressBar } from "../common/TimerProgressBar";

interface VotingPhaseProps {
  game: GameState;
  voteForPlayer: (playerId: string) => void;
  hostEndVoting: () => void;
}

export function VotingPhase({
  game,
  voteForPlayer,
  hostEndVoting,
}: VotingPhaseProps) {
  const [persistentPlayerId] = usePersistentPlayerId();
  const currentPlayer = game.players.find((p) => p.id === persistentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;

  const hasVoted = game.votes?.some((v) => v.voterId === persistentPlayerId);
  const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;
  const votesCast = game.votes?.length ?? 0;

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

  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/90 backdrop-blur-md border-border shadow-2xl rounded-xl">
      <CardHeader className="text-center border-b border-border/40 pb-4 pt-6">
        <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">
          Voting Time
        </CardTitle>
        <div className="mt-3">
          <TimerProgressBar
            timeRemaining={game.timerRemaining || 0}
            duration={game.timerDuration || 0}
            label={`${votesCast}/${totalHumanPlayers} Voted`}
            className="max-w-md mx-auto"
          />
        </div>
        <p className="text-muted-foreground pt-2 text-base">
          Vote for the player you believe is the impostor.
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {game.players.map((player) => {
            const voteCount = voteCounts[player.id] || 0;
            const isVoted = alreadyVotedFor === player.id;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 bg-muted/80 rounded-lg transition shadow-sm ${
                  isVoted ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    width={50}
                    height={50}
                    className="rounded-full border-2 border-primary/50"
                  />
                  <div>
                    <p className="font-semibold text-lg">{player.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Votes: {voteCount}
                    </p>
                  </div>
                </div>
                {!hasVoted && (
                  <Button
                    onClick={() => voteForPlayer(player.id)}
                    disabled={hasVoted || player.id === persistentPlayerId}
                    className="text-sm"
                  >
                    Vote
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* VOTED CONFIRMATION */}
        {hasVoted && (
          <div className="text-center p-4 bg-secondary/70 rounded-lg shadow">
            <p className="text-secondary-foreground font-medium text-base">
              You voted for{" "}
              <strong>
                {game.players.find((p) => p.id === alreadyVotedFor)?.name ??
                  "Unknown"}
              </strong>
              . Waiting for other players...
            </p>
          </div>
        )}

        {/* HOST CONTROL */}
        {isHost && (
          <div className="pt-6 text-center">
            <Button
              onClick={hostEndVoting}
              variant="outline"
              className="w-full py-5 text-lg rounded-lg shadow-lg"
              // disabled={votesCast < totalHumanPlayers}
            >
              End Voting
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
