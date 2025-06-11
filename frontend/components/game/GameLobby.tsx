import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { GameState } from "@/lib/types";

interface GameLobbyProps {
  game: GameState;
  isHost: boolean | undefined;
  currentPlayer?: {
    avatarUrl: string;
    avatarStyle?: string;
    name: string;
  };
  startGame: () => void;
  addBotToGame: () => void;
}

export const GameLobby = ({
  game,
  isHost,
  currentPlayer,
  startGame,
  addBotToGame,
}: GameLobbyProps) => {
  const minPlayers = game.type === "word-impostor" ? 3 : 2;
  const canStartGame = game.players.length >= minPlayers;
  const isMaxPlayers = game.players.length >= game.maxPlayers;
  return (
    <div className="md:col-span-1 space-y-6">
      <Card className="backdrop-blur-lg border-border shadow-2xl rounded-xl">
        <CardHeader className="text-center pt-6 pb-4">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            Game Lobby
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="p-4 bg-muted/70 rounded-lg text-center shadow-inner">
            <p className="text-sm text-muted-foreground mb-1">
              Game Code (Share with friends):
            </p>
            <p className="text-4xl font-mono tracking-wider text-accent-foreground py-2 bg-background rounded-md shadow select-all">
              {game.code}
            </p>
          </div>
          {isHost && (
            <>
              <Button
                onClick={startGame}
                className="w-full text-lg transition-all hover:scale-105 focus:ring-4 focus:ring-primary/50"
                disabled={!canStartGame}
              >
                {canStartGame
                  ? "🚀 Launch Game!"
                  : `Need ${minPlayers - game.players.length} more player(s)`}
              </Button>
              <Button
                onClick={addBotToGame}
                variant="outline"
                className="w-full border-accent text-accent-foreground hover:bg-accent/20 text-md transition-all hover:scale-105"
                disabled={isMaxPlayers}
              >
                {isMaxPlayers ? "Max Players Reached" : "🤖 Add Bot Player"}
              </Button>
            </>
          )}
          {!isHost && (
            <div className="text-center p-4 bg-secondary/70 rounded-lg shadow">
              <p className="text-secondary-foreground font-medium">
                Waiting for the host to start the game...
              </p>
              {game.players.length < minPlayers && (
                <p className="text-xs text-muted-foreground mt-1">
                  ({minPlayers - game.players.length} more player(s) needed)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {currentPlayer && (
        <Card className="backdrop-blur-lg border-border shadow-2xl rounded-xl">
          <CardHeader className="text-center pt-5 pb-3">
            <CardTitle className="text-xl font-semibold">
              Customize Your Avatar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 items-center flex flex-col">
            <Image
              src={currentPlayer.avatarUrl}
              alt={`${currentPlayer.name}'s current avatar`}
              width={80}
              height={80}
              className="rounded-full border-3 border-primary shadow-lg mb-3"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
