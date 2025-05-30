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

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          {title} ({players.length})
          {showConnectionStatus && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="default" className="bg-green-500/20 text-green-300 text-xs">
                <Wifi className="w-3 h-3 mr-1" />
                {connectedPlayers.length} online
              </Badge>
              {disconnectedPlayers.length > 0 && (
                <Badge variant="destructive" className="bg-red-500/20 text-red-300 text-xs">
                  <WifiOff className="w-3 h-3 mr-1" />
                  {disconnectedPlayers.length} offline
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {/* Connected Players */}
            {connectedPlayers.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border-l-4 border-green-400"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {showConnectionStatus && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                    {player.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                    <span className="text-white font-medium">
                      {player.name} {player.id === currentPlayerId && "(You)"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {player.votes > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {player.votes} votes
                    </Badge>
                  )}
                  <Badge
                    variant={player.isReady ? "default" : "secondary"}
                    className={player.isReady ? "bg-green-500" : "bg-gray-500"}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border-l-4 border-red-400 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {showConnectionStatus && <div className="w-2 h-2 bg-red-400 rounded-full" />}
                    {player.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                    <span className="text-white font-medium">
                      {player.name} {player.id === currentPlayerId && "(You)"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="bg-red-500/20 text-red-300 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Disconnected
                  </Badge>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {players.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No players in the room</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
