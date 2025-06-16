import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Users, Vote, Crown } from "lucide-react";
import { GameState, Player } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { TimerProgressBar } from "../common/TimerProgressBar";

interface VotingPhaseProps {
  game: GameState;
  voteForPlayer: (playerId: string) => void;
  hostEndVoting: () => void;
  readyUp?: () => void; // Add ready up function
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
  const isReady = game.readyPlayers?.includes(persistentPlayerId) ?? false;

  const hasVoted = game.votes?.some((v) => v.voterId === persistentPlayerId);
  const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;
  const votesCast = game.votes?.length ?? 0;
  const readyCount = game.readyPlayers?.length ?? 0;

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

  const votingProgress = (votesCast / totalHumanPlayers) * 100;
  const readyProgress = (readyCount / totalHumanPlayers) * 100;

  // Check who has voted (for display purposes)
  const playersWhoVoted = game.votes?.map(v => v.voterId) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
      <Card className="w-full max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
              <Vote className="w-8 h-8 text-purple-400" />
              Voting Phase
            </CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Users className="w-4 h-4 mr-1" />
              {totalHumanPlayers} Players
            </Badge>
          </div>
          
          <div className="space-y-4">
            <TimerProgressBar
              timeRemaining={game.timerRemaining || 0}
              duration={game.timerDuration || 0}
              label={`Time Remaining`}
              className="max-w-md mx-auto"
            />
            
            {/* Voting Progress */}
            <div className="bg-white/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/90 font-medium">Voting Progress</span>
                <span className="text-white/70 text-sm">{votesCast}/{totalHumanPlayers}</span>
              </div>
              <Progress value={votingProgress} className="h-2 bg-white/20" />
              
              {/* Ready Status */}
              {hasVoted && (
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-white/90 font-medium">Ready for Results</span>
                  <span className="text-white/70 text-sm">{readyCount}/{totalHumanPlayers}</span>
                </div>
              )}
              {hasVoted && <Progress value={readyProgress} className="h-2 bg-white/20" />}
            </div>
          </div>
          
          <p className="text-white/80 text-center mt-4">
            Vote for the player you believe is the impostor
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {/* Player Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {game.players.map((player) => {
              const voteCount = voteCounts[player.id] || 0;
              const isVoted = alreadyVotedFor === player.id;
              const hasPlayerVoted = playersWhoVoted.includes(player.id);
              const isCurrentPlayer = player.id === persistentPlayerId;

              return (
                <Card
                  key={player.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isVoted
                      ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50 shadow-lg scale-105"
                      : "bg-white/5 hover:bg-white/10 border-white/10"
                  } ${isCurrentPlayer ? "border-yellow-400/50" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Image
                            src={player.avatarUrl}
                            alt={player.name}
                            width={60}
                            height={60}
                            className="rounded-full border-2 border-white/30"
                          />
                          {player.isHost && (
                            <Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400" />
                          )}
                          {hasPlayerVoted && !isCurrentPlayer && (
                            <CheckCircle2 className="absolute -bottom-1 -right-1 w-5 h-5 text-green-400 bg-slate-900 rounded-full" />
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-lg">
                              {player.name}
                            </p>
                            {isCurrentPlayer && (
                              <Badge variant="outline" className="text-xs border-yellow-400/50 text-yellow-400">
                                You
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-white/70">
                              Votes: <span className="font-semibold text-white">{voteCount}</span>
                            </span>
                            {hasPlayerVoted && !isCurrentPlayer && (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                                Voted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vote Button */}
                      {!hasVoted && !isCurrentPlayer && (
                        <Button
                          onClick={() => voteForPlayer(player.id)}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          Vote
                        </Button>
                      )}
                      
                      {isVoted && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2">
                          Your Vote
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Voted Confirmation */}
          {hasVoted && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30 mb-6">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <p className="text-white font-medium text-lg">
                    You voted for{" "}
                    <span className="font-bold text-green-400">
                      {game.players.find((p) => p.id === alreadyVotedFor)?.name ?? "Unknown"}
                    </span>
                  </p>
                </div>
                
                {!isReady && readyUp && (
                  <div className="mt-4">
                    <Button
                      onClick={readyUp}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium px-8 py-2 rounded-lg transition-all duration-200"
                    >
                      Ready for Results
                    </Button>
                  </div>
                )}
                
                {isReady && (
                  <Badge className="bg-green-500/20 text-green-400 mt-2">
                    Ready! Waiting for others...
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Host Controls */}
          {isHost && (
            <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-400/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">Host Controls</p>
                      <p className="text-white/70 text-sm">End voting when ready</p>
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
    </div>
  );
}
