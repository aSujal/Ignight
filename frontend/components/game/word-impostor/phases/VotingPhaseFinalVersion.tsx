import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GameState, Player } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { TimerProgressBar } from "../common/TimerProgressBar";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Crown, UserCheck, Users, Vote } from "lucide-react";

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

  const totalPlayers = game.players.length;
  const playersWhoVoted = new Set(game.votes?.map((v) => v.voterId));

  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    game.votes?.forEach(({ votedForPlayerId }) => {
      counts[votedForPlayerId] = (counts[votedForPlayerId] || 0) + 1;
    });
    return counts;
  }, [game.votes]);

  const readyPlayers = new Set(game.readyPlayers);
  const isReady = readyPlayers.has(persistentPlayerId);

  console.log(game);

  const renderVotes = (currentPlayerId: string, voteCount: number) => {
    if (false) {
      return (
        <Badge className="absolute -top-2 -right-2 text-xs px-2 py-[2px]">
          {voteCount}
        </Badge>
      );
    }
    const votes = game.votes?.filter((v) => v.votedForPlayerId === currentPlayerId).map((v) => game.players.find((p) => p.id === v.voterId));
    if (!votes) return null;
    return (
      <div className="flex items-end max-w-[10rem] flex-wrap gap-1 absolute -top-2 -right-2">
        {votes.map((player: Player | undefined, index) => (
          player && (
            <div
              key={index}
              className="relative group"
            >
              <Image
                src={player.avatarUrl}
                alt={player.name}
                width={30}
                height={30}
                className="rounded-full border border-primary/30 bg-muted"
              />
              <span
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
              >
                {player.name}
              </span>
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-5xl mx-auto bg-card/90 backdrop-blur-md border-border shadow-2xl rounded-2xl">
      <CardHeader className="border-b border-border/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
            <Vote className="w-8 h-8" />
            Voting Phase
          </CardTitle>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white border-white/30"
          >
            <Users className="w-4 h-4 mr-1" />
            {readyPlayers?.size}/{totalPlayers} Ready
          </Badge>
        </div>

        <div className="bg-white/10 rounded-lg p-4 space-y-3">
          <TimerProgressBar
            timeRemaining={game.timerRemaining || 0}
            duration={game.timerDuration || 0}
            label="Time remaining"
            className="w-full"
          />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <p className="text-muted-foreground text-center pt-2 text-base">
          Vote for the player you believe is the impostor
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {game.players.map((player: Player) => {
            const voteCount = voteCounts[player.id] || 0;
            const youVotedForThisPlayer =
              game.votes?.find(
                (v) =>
                  v.voterId === persistentPlayerId &&
                  v.votedForPlayerId === player.id
              ) !== undefined;
            const playerHasVoted = playersWhoVoted.has(player.id);
            const isPlayerReady = readyPlayers.has(player.id);
            return (
              <div
                key={player.id}
                className={`relative flex flex-col items-center gap-3 p-5 bg-muted/70 rounded-xl shadow-sm transition-colors hover:bg-muted/60 ${
                  youVotedForThisPlayer ? "ring-2 ring-primary" : ""
                }`}
              >
                {voteCount > 0 && renderVotes(player.id, voteCount)}
                <div className="flex items-center gap-4 relative">
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    width={80}
                    height={80}
                    className={`rounded-full border-4 ${isPlayerReady ? "border-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]" : "border-gray-400 shadow-none"}`}
                  />
                  {player.isHost && (
                    <Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400" />
                  )}
                  {playerHasVoted && (
                    <span className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                      <UserCheck className="h-4 w-4 text-white" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <p className="font-semibold text-lg text-center break-words max-w-[8rem]">
                    {player.name}
                  </p>
                  {player.id === persistentPlayerId && (
                    <Badge
                      variant="outline"
                      className="text-xs border-yellow-400/50 text-yellow-400"
                    >
                      You
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => voteForPlayer(player.id)}
                  disabled={player.id === persistentPlayerId}
                  className="text-sm"
                >
                  Vote
                </Button>
                {youVotedForThisPlayer && (
                  <span className="text-xs font-medium text-primary">
                    Your vote
                  </span>
                )}
              </div>
            );
          })}
        </div>

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

        {isHost && (
          <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <div>
                    <p className="text-white font-medium">Host Controls</p>
                    <p className="text-white/70 text-sm">
                      End voting when ready
                    </p>
                  </div>
                </div>

                <Button
                  onClick={hostEndVoting}
                  variant="outline"
                  className="border-orange-400/50 text-orange-400 hover:bg-orange-400/10 font-medium px-6 py-2"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  End Voting
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
