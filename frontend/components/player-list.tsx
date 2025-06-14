"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Crown,
  Wifi,
  WifiOff,
  Clock,
  Trash2,
  UserRoundX,
} from "lucide-react";
import type { Player } from "@/lib/types";
import { useCallback } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  showConnectionStatus?: boolean;
  title?: string;
  removePlayer: (playerId: string) => void;
  readyUp: () => void;
}

export function PlayerList({
  players,
  currentPlayerId,
  showConnectionStatus = true,
  title = "Players",
  removePlayer,
  readyUp,
}: PlayerListProps) {
  const connectedPlayers = players.filter((p) => p.isConnected);
  const disconnectedPlayers = players.filter((p) => !p.isConnected);
  const isHost = players.find((p) => p.isHost)?.id === currentPlayerId;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isReady = currentPlayer?.isReady;

  const handleRemovePlayer = useCallback(
    (playerId: string) => {
      if (isHost) {
        removePlayer(playerId);
      }
    },
    [isHost, removePlayer]
  );

  const handleReadyUp = useCallback(() => {
    if (!isReady) {
      readyUp();
    }
  }, [isReady, readyUp]);

  console.log(players);
  return (
    <Card className="backdrop-blur-lg border-border shadow-xl rounded-xl">
      <CardHeader className="pb-4 pt-5 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
          <Users className="w-6 h-6 text-accent-foreground" />
          {title} ({players.length})
          {showConnectionStatus && (
            <Badge
              variant="outline"
              className={cn(
                "border-green-500/50 bg-green-500/10 text-green-400 text-xs px-2 py-1",
                disconnectedPlayers.length > 0 &&
                  "border-red-500/50 bg-red-500/10 text-red-400"
              )}
            >
              <Wifi className="w-3 h-3 mr-1.5" />
              {connectedPlayers.length} Online
              {disconnectedPlayers.length > 0 && (
                <>
                  <span className="mx-1">/</span>
                  <WifiOff className="w-3 h-3 mr-1.5" />
                  {disconnectedPlayers.length} Offline
                </>
              )}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <AnimatePresence>
            {players.map((player) => {
              const isConnected = player.isConnected;
              const isCurrent = player.id === currentPlayerId;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg shadow-sm transition-colors",
                    isConnected
                      ? "bg-muted/50 hover:bg-muted/70"
                      : "bg-muted/30 opacity-70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={player.avatarUrl}
                      alt={`${player.name}'s avatar`}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 shadow",
                        isConnected
                          ? "border-primary/60"
                          : "border-muted/50 filter grayscale"
                      )}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        {player.isHost && (
                          <Crown
                            className={cn(
                              "w-4 h-4",
                              isConnected
                                ? "text-yellow-500"
                                : "text-yellow-500/70"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "text-base font-medium",
                            isConnected
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {player.name}
                        </span>
                        {isCurrent && (
                          <span
                            className={cn(
                              "text-xs",
                              isConnected
                                ? "text-accent-foreground"
                                : "text-muted-foreground/80"
                            )}
                          >
                            (You)
                          </span>
                        )}
                      </div>
                      {showConnectionStatus && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              isConnected
                                ? "bg-green-500 animate-pulse"
                                : "bg-red-500"
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs",
                              isConnected
                                ? "text-muted-foreground"
                                : "text-muted-foreground/80"
                            )}
                          >
                            {isConnected ? "Online" : "Offline"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Badge
                        variant={player.isReady ? "default" : "outline"}
                        className={
                          player.isReady
                            ? "bg-green-600 text-primary-foreground border-green-600 text-xs px-2.5 py-1"
                            : "border-muted-foreground/50 text-muted-foreground text-xs px-2.5 py-1"
                        }
                      >
                        {player.isReady ? "Ready" : "Not Ready"}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-red-500/50 bg-red-500/10 text-red-400 text-xs px-2.5 py-1"
                      >
                        <Clock className="w-3 h-3 mr-1.5" />
                        Disconnected
                      </Badge>
                    )}

                    {isHost && !isCurrent && (
                      <Button
                        onClick={() => handleRemovePlayer(player.id)}
                        variant="ghost"
                        className="hover:bg-destructive/20"
                        size="icon"
                        title="Remove player"
                      >
                        <UserRoundX className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="mt-3 flex justify-center">
          <Button
            onClick={handleReadyUp}
            className="text-lg"
            disabled={isReady}
            variant={isReady ? "secondary" : "default"}
          >
            {isReady ? "Ready!" : "Ready Up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
