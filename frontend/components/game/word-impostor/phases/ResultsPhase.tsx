import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GameState, Player } from "@/lib/types";

interface ResultsPhaseProps {
  game: GameState;
  resetGame: () => void;
}

export function ResultsPhase({ game, resetGame }: ResultsPhaseProps) {
  if (!game.results) return null;

  const impostorPlayer = game.players.find(p => p.id === game.results.impostorId);
  const mostVotedPlayer = game.players.find(p => p.id === game.results.mostVotedId);

  return (
    <Card className="w-full max-w-xl mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl text-center">
      <CardHeader className="pt-8 pb-4 border-b border-border/50">
        <CardTitle className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent-foreground to-secondary-foreground">
          Game Over!
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        <div
          className={`p-6 rounded-xl shadow-xl text-3xl font-bold transition-all duration-500 ease-in-out transform hover:scale-105 ${
            game.results.impostorCaught
              ? "bg-gradient-to-br from-green-500 via-green-600 to-teal-500 text-white"
              : "bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white"
          }`}
        >
          {game.results.impostorCaught
            ? "🎉 IMPOSTOR CAUGHT! 🎉"
            : "💀 IMPOSTOR ESCAPED! 💀"}
          <p className="text-lg font-normal mt-1 opacity-90">
            {game.results.impostorCaught
              ? "The crewmates win!"
              : "The impostor wins!"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
          <div className="p-5 bg-muted/70 rounded-xl shadow-lg">
            <h4 className="text-xl font-semibold text-accent-foreground mb-3 border-b border-border/50 pb-2">
              The Impostor Was:
            </h4>
            {impostorPlayer ? (
              <div className="flex items-center gap-3">
                <Image
                  src={impostorPlayer.avatarUrl}
                  alt={`${impostorPlayer.name}'s avatar`}
                  width={48}
                  height={48}
                  className="rounded-full border-3 border-destructive shadow-md"
                />
                <span className="text-2xl font-bold text-foreground tracking-wide">
                  {impostorPlayer.name}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">Impostor not found.</p>
            )}
          </div>

          <div className="p-5 bg-muted/70 rounded-xl shadow-lg">
            <h4 className="text-xl font-semibold text-accent-foreground mb-3 border-b border-border/50 pb-2">
              Most Voted Player:
            </h4>
            {mostVotedPlayer ? (
              <div className="flex items-center gap-3">
                <Image
                  src={mostVotedPlayer.avatarUrl}
                  alt={`${mostVotedPlayer.name}'s avatar`}
                  width={48}
                  height={48}
                  className="rounded-full border-3 border-primary shadow-md"
                />
                <span className="text-2xl font-bold text-foreground tracking-wide">
                  {mostVotedPlayer.name}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No single player was decisively voted out.
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={resetGame}
          className="w-full mt-8 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xl py-6 rounded-lg shadow-lg hover:from-primary/90 hover:to-primary"
        >
          🔁 Play Again
        </Button>
      </CardContent>
    </Card>
  );
}
