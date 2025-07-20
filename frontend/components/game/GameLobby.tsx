import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarCustomizer } from "./avatar/avatar-customizer";
import { GameState, Player } from "@/lib/types";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface GameLobbyProps {
  game: GameState;
  isHost: boolean | undefined;
  currentPlayer?: Player;
  forceStartGame?: () => void;
  addBotToGame: () => void;
  updateAvatar: (style?: string, parts?: Record<string, string>) => void;
}

export const GameLobby = ({
  game,
  isHost,
  currentPlayer,
  forceStartGame,
  addBotToGame,
  updateAvatar,
}: GameLobbyProps) => {
  const minPlayers = game.type === "word-impostor" ? 3 : 2;
  const canStartGame = game.players.length >= minPlayers;
  const isMaxPlayers = game.players.length >= game.maxPlayers;
  const [copied, setCopied] = useState(false);

  const copyGameCode = () => {
    setCopied(true)
    navigator.clipboard.writeText(game.code);
    setTimeout(() => setCopied(false), 1000)
  }

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
              Game Code:
            </p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl font-mono tracking-wider text-accent-foreground py-2 px-4 bg-background rounded-md shadow select-all flex-1">
                {game.code}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyGameCode}
                className="h-10 w-10 rounded-md"
                title="Copy game code"
              >
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check size={18} className="text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Copy size={18} />
                  </motion.div>
                )}
              </Button>
            </div>
          </div>
          {isHost && (
            <>
              {forceStartGame && canStartGame && (
                <Button
                  onClick={forceStartGame}
                  variant="destructive"
                  className="w-full text-lg transition-all hover:scale-105"
                >
                  {canStartGame
                    ? "⚡ Force Start Game"
                    : `Need ${minPlayers - game.players.length} more player(s)`}
                </Button>
              )}
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
        <AvatarCustomizer
          currentPlayer={currentPlayer}
          onAvatarChange={updateAvatar}
          availableAvatarStyles={game.availableAvatarStyles || ["micah"]}
        />
      )}
    </div>
  );
};
