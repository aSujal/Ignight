import { useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { GameState, Player } from "@/lib/types";
import { CheckCircle2, Users, ShieldCheck, VoteIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface VotingPhaseProps {
  game: GameState;
  voteForPlayer: (playerId: string) => void;
  hostEndVoting: () => void;
  readyUpForResults: () => void; 
  persistentPlayerId: string | null; // The problematic hook has been replaced with a prop.
}

export function VotingPhase({
  game,
  voteForPlayer,
  hostEndVoting,
  readyUpForResults,
  persistentPlayerId, // Now receiving the player ID as a prop.
}: VotingPhaseProps) {
  const isHost = game.players.find((p) => p.id === persistentPlayerId)?.isHost ?? false;

  const votesCast = game.votes?.length ?? 0;
  const totalPlayers = game.players.length;
  
  const hasVoted = useMemo(() => 
    game.votes?.some((v) => v.voterId === persistentPlayerId)
  , [game.votes, persistentPlayerId]);
  
  const hasReadiedUp = useMemo(() => 
    game.readyForResults?.includes(persistentPlayerId ?? '')
  , [game.readyForResults, persistentPlayerId]);

  const votedForPlayerId = useMemo(() => {
    return game.votes?.find((v) => v.voterId === persistentPlayerId)?.votedForPlayerId;
  }, [game.votes, persistentPlayerId]);

  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    game.players.forEach(p => { counts[p.id] = 0 });
    game.votes?.forEach(({ votedForPlayerId }) => {
      counts[votedForPlayerId] = (counts[votedForPlayerId] || 0) + 1;
    });
    return counts;
  }, [game.votes, game.players]);

  const voters = useMemo(() => new Set(game.votes?.map(v => v.voterId) ?? []), [game.votes]);
  const readyPlayers = useMemo(() => new Set(game.readyForResults ?? []), [game.readyForResults]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <Card className="bg-card/90 backdrop-blur-sm border-border shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center p-6 border-b border-border/40">
          <CardTitle className="text-3xl md:text-4xl font-bold tracking-tighter text-primary-foreground">
            VOTING PHASE
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Vote for the player you believe is the Impostor.
          </CardDescription>
          <div className="mt-4 max-w-lg mx-auto">
             <div className="flex justify-between items-center mb-1 text-sm font-medium text-muted-foreground">
                <span>Voting Progress</span>
                <span>{votesCast} / {totalPlayers} Voted</span>
            </div>
            <Progress value={(votesCast / totalPlayers) * 100} className="w-full h-2" />
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {game.players.map((player) => {
              const isVotedForByCurrentUser = votedForPlayerId === player.id;
              const hasPlayerVoted = voters.has(player.id);
              const hasPlayerReadiedUp = readyPlayers.has(player.id);
              
              return (
                <div
                  key={player.id}
                  className={cn(
                    "rounded-lg p-4 transition-all duration-300 flex flex-col justify-between gap-3",
                    "bg-muted/50 border border-transparent",
                    isVotedForByCurrentUser && "border-primary ring-2 ring-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarImage src={player.avatarUrl} alt={player.name} />
                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-lg text-foreground">{player.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{voteCounts[player.id] || 0} votes</span>
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center gap-3" title={`${player.name} status`}>
                        {hasPlayerVoted && <CheckCircle2 className="h-5 w-5 text-green-500" title={`${player.name} has voted.`}/>}
                        {hasPlayerReadiedUp && <ShieldCheck className="h-5 w-5 text-sky-400" title={`${player.name} is ready for results.`} />}
                    </div>
                  </div>
                 
                  {!hasVoted && player.id !== persistentPlayerId && (
                     <Button
                        onClick={() => voteForPlayer(player.id)}
                        variant="outline"
                        className="w-full mt-2"
                      >
                       <VoteIcon className="h-4 w-4 mr-2" />
                        Vote for {player.name}
                      </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        
        <CardFooter className="p-6 flex flex-col gap-4 bg-background/20 border-t border-border/40">
            {hasVoted && (
                <div className="text-center p-4 w-full bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">
                        You voted for{" "}
                        <strong className="text-primary">
                            {game.players.find((p) => p.id === votedForPlayerId)?.name ?? "Unknown"}
                        </strong>.
                    </p>
                    <Button 
                        onClick={readyUpForResults}
                        disabled={hasReadiedUp}
                        className="mt-3 w-full max-w-xs mx-auto"
                        variant={hasReadiedUp ? "secondary" : "default"}
                    >
                        {hasReadiedUp ? (
                            <>
                                <ShieldCheck className="h-4 w-4 mr-2 animate-pulse" />
                                Waiting for others...
                            </>
                        ) : (
                             <>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Ready for Results
                            </>
                        )}
                    </Button>
                </div>
            )}

            {isHost && (
                <Button
                    onClick={hostEndVoting}
                    variant="destructive"
                    className="w-full py-5 text-lg rounded-lg shadow-lg"
                >
                    End Voting & Show Results
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
