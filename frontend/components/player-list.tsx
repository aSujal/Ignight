"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown, Wifi, WifiOff, Clock, Trash2, UserRoundX } from "lucide-react";
import type { Player } from "@/lib/types";
import { useCallback } from "react";
import { Button } from "./ui/button";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  showConnectionStatus?: boolean;
  title?: string;
  removePlayer: (playerId: string) => void;
}

export function PlayerList({
  players,
  currentPlayerId,
  showConnectionStatus = true,
  title = "Players",
  removePlayer
}: PlayerListProps) {
  const connectedPlayers = players.filter((p) => p.isConnected);
  const disconnectedPlayers = players.filter((p) => !p.isConnected);
  const isHost = players.find((p) => p.isHost)?.id === currentPlayerId;
  console.log("PlayerList players:", players);

  const handleRemovePlayer = useCallback(
    (playerId: string) => {
      if (isHost) {
        removePlayer(playerId);
      }
    },
    [isHost]
  );

  return (
    <Card className="backdrop-blur-lg border-border shadow-xl rounded-xl">
      <CardHeader className="pb-4 pt-5 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
          <Users className="w-6 h-6 text-accent-foreground" />
          {title} ({players.length})
          {showConnectionStatus && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge
                variant="outline"
                className="border-green-500/50 bg-green-500/10 text-green-400 text-xs px-2 py-1"
              >
                <Wifi className="w-3 h-3 mr-1.5" />
                {connectedPlayers.length} Online
              </Badge>
              {disconnectedPlayers.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-red-500/50 bg-red-500/10 text-red-400 text-xs px-2 py-1"
                >
                  <WifiOff className="w-3 h-3 mr-1.5" />
                  {disconnectedPlayers.length} Offline
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <AnimatePresence>
            {connectedPlayers.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg shadow-sm hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={player.avatarUrl}
                    alt={`${player.name}'s avatar`}
                    className="w-10 h-10 rounded-full border-2 border-primary/60 shadow"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5" title="Host">
                      {player.isHost && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-base font-medium text-foreground">
                        {player.name}
                      </span>
                      {player.id === currentPlayerId && (
                        <span className="text-xs text-accent-foreground">
                          (You)
                        </span>
                      )}
                    </div>
                    {showConnectionStatus && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-muted-foreground">
                          Online
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  {currentPlayerId && currentPlayerId !== player.id && (
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
            ))}

            {disconnectedPlayers.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg shadow-sm opacity-70"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={player.avatarUrl}
                    alt={`${player.name}'s avatar`}
                    className="w-10 h-10 rounded-full border-2 border-muted/50 filter grayscale"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      {player.isHost && (
                        <Crown className="w-4 h-4 text-yellow-500/70" />
                      )}
                      <span className="text-base font-medium text-muted-foreground">
                        {player.name}
                      </span>
                      {player.id === currentPlayerId && (
                        <span className="text-xs text-muted-foreground/80">
                          (You)
                        </span>
                      )}
                    </div>
                    {showConnectionStatus && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-xs text-muted-foreground/80">
                          Offline
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-red-500/50 bg-red-500/10 text-red-400 text-xs px-2.5 py-1"
                  >
                    <Clock className="w-3 h-3 mr-1.5" />
                    Disconnected
                  </Badge>
                    <Button
                      onClick={() => handleRemovePlayer(player.id)}
                      variant="ghost"
                      className="hover:bg-destructive/20"
                      size="icon"
                      title="Remove player"
                    >
                      <UserRoundX className="w-4 h-4" />
                    </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}