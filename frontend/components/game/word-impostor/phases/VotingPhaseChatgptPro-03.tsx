import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GameState, Player } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { TimerProgressBar } from "../common/TimerProgressBar";
import { Badge } from "@/components/ui/badge";
import { Check, UserCheck } from "lucide-react";

interface VotingPhaseProps {
  game: GameState;
  voteForPlayer: (playerId: string) => void;
  readyUp: () => void;
  hostEndVoting: () => void;
}

export function VotingPhase({
  game,
  voteForPlayer,
  readyUp,
  hostEndVoting,
}: VotingPhaseProps) {
  const [persistentPlayerId] = usePersistentPlayerId();
  const currentPlayer = game.players.find((p) => p.id === persistentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;

  const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;
  const votesCast = game.votes?.length ?? 0;
  const playersWhoVoted = new Set(game.votes?.map((v) => v.voterId));

  const hasVoted = playersWhoVoted.has(persistentPlayerId);

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

  const readyPlayers = new Set(game.readyPlayers);
  const isReady = readyPlayers.has(persistentPlayerId);

  console.log(game);

  return (
    <Card className="w-full max-w-5xl mx-auto bg-card/90 backdrop-blur-md border-border shadow-2xl rounded-2xl">
      <CardHeader className="text-center border-b border-border/40 pb-4 pt-6 space-y-2">
        <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">
          Voting Time
        </CardTitle>

        <p className="text-muted-foreground pt-2 text-base">
          Vote for the player you believe is the impostor.
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <TimerProgressBar
          timeRemaining={game.timerRemaining || 0}
          duration={game.timerDuration || 0}
          label={`${votesCast}/${totalHumanPlayers} Voted`}
          className="max-w-md mx-auto"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {game.players.map((player) => {
            const voteCount = voteCounts[player.id] || 0;
            const youVotedForThisPlayer =
              game.votes?.find(
                (v) =>
                  v.voterId === persistentPlayerId &&
                  v.votedForPlayerId === player.id
              ) !== undefined;
            const playerHasVoted = playersWhoVoted.has(player.id);

            return (
              <div
                key={player.id}
                className={`relative flex flex-col items-center gap-3 p-5 bg-muted/70 rounded-xl shadow-sm transition-colors hover:bg-muted/60 ${
                  youVotedForThisPlayer ? "ring-2 ring-primary" : ""
                }`}
              >
                {voteCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 text-xs px-2 py-[2px]">
                    {voteCount}
                  </Badge>
                )}

                <div className="flex items-center gap-4">
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    width={80}
                    height={80}
                    className="rounded-full border-2 border-primary/50"
                  />

                  {playerHasVoted && (
                    <span className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                      <UserCheck className="h-4 w-4 text-white" />
                    </span>
                  )}
                </div>

                <p className="font-semibold text-lg text-center break-words max-w-[8rem]">
                  {player.name}
                </p>

                {!hasVoted && (
                  <Button
                    onClick={() => voteForPlayer(player.id)}
                    disabled={player.id === persistentPlayerId}
                    className="text-sm"
                  >
                    Vote
                  </Button>
                )}

                {youVotedForThisPlayer && (
                  <span className="text-xs font-medium text-primary">
                    Your vote
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {hasVoted && (
          <div className="text-center p-4 bg-secondary/70 rounded-lg shadow flex items-center justify-center gap-2">
            <Check className="h-5 w-5 text-secondary-foreground" />
            <p className="text-secondary-foreground font-medium text-base">
              Waiting for other players...
            </p>
          </div>
        )}

        {!isReady ? (
          <Button
            onClick={readyUp}
            className="w-full py-5 text-lg rounded-lg shadow-lg"
            variant="secondary"
          >
            I'm ready
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-lg">
            <Check className="h-6 w-6" /> Ready
          </div>
        )}
      </CardContent>
    </Card>
  );
}
