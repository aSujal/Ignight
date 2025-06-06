"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Crown, Wifi, WifiOff, Clock } from "lucide-react"
import type { Player } from "@/lib/types"

interface PlayerListProps {
  players: Player[]
  currentPlayerId?: string
  showConnectionStatus?: boolean
  title?: string
}

export function PlayerList({
  players,
  currentPlayerId,
  showConnectionStatus = true,
  title = "Players",
}: PlayerListProps) {
  const connectedPlayers = players.filter((p) => p.isConnected)
  const disconnectedPlayers = players.filter((p) => !p.isConnected)

  // Consistent card styling with WordImpostorGame.tsx
  return (
    <Card className="bg-card/90 backdrop-blur-lg border-border shadow-xl rounded-xl">
      <CardHeader className="pb-4 pt-5 border-b border-border/50">
        <CardTitle className="text-primary-foreground flex items-center gap-2 text-2xl font-semibold">
          <Users className="w-6 h-6 text-accent-foreground" />
          {title} ({players.length})
          {showConnectionStatus && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400 text-xs px-2 py-1">
                <Wifi className="w-3 h-3 mr-1.5" />
                {connectedPlayers.length} Online
              </Badge>
              {disconnectedPlayers.length > 0 && (
                <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-400 text-xs px-2 py-1">
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
            {/* Connected Players */}
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
                    <div className="flex items-center gap-1.5">
                      {player.isHost && <Crown className="w-4 h-4 text-yellow-500" title="Host" />}
                      <span className="text-base font-medium text-foreground">
                        {player.name}
                      </span>
                      {player.id === currentPlayerId && <span className="text-xs text-accent-foreground">(You)</span>}
                    </div>
                     {showConnectionStatus && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Assuming player.votes might be part of Player type from backend at some point for other games */}
                  {/* {player.votes > 0 && (
                    <Badge variant="outline" className="text-xs border-destructive/50 text-destructive-foreground bg-destructive/20">
                      {player.votes} votes
                    </Badge>
                  )} */}
                  <Badge
                    variant={player.isReady ? "default" : "outline"}
                    className={player.isReady
                      ? "bg-green-600 text-primary-foreground border-green-600 text-xs px-2.5 py-1"
                      : "border-muted-foreground/50 text-muted-foreground text-xs px-2.5 py-1"}
                  >
                    {player.isReady ? "Ready" : "Not Ready"}
                  </Badge>
                </div>
              </motion.div>
            ))}

            {/* Disconnected Players */}
            {disconnectedPlayers.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.7, y: 0 }} // Slightly less opacity for disconnected
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
                      {player.isHost && <Crown className="w-4 h-4 text-yellow-500/70" title="Host" />}
                      <span className="text-base font-medium text-muted-foreground">
                        {player.name}
                      </span>
                      {player.id === currentPlayerId && <span className="text-xs text-muted-foreground/80">(You)</span>}
                    </div>
                    {showConnectionStatus && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-xs text-muted-foreground/80">Offline</span>
                        </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-400 text-xs px-2.5 py-1">
                    <Clock className="w-3 h-3 mr-1.5" />
                    Disconnected
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {players.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No players in the room yet.</p>
              <p className="text-sm opacity-70">Share the game code to invite others!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
