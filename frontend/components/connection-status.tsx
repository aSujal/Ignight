"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw, Server, AlertTriangle, CheckCircle } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
  onReconnect?: () => void
  roomCode?: string
}

export function ConnectionStatus({ isConnected, onReconnect, roomCode }: ConnectionStatusProps) {

  const getConnectionIcon = () => {
    switch (isConnected) {
      case true:
        return <CheckCircle className="w-3 h-3" />
      case false:
        return <RefreshCw className="w-3 h-3 animate-spin" />
      default:
        return <WifiOff className="w-3 h-3" />
    }
  }

  const getConnectionVariant = () => {
    if (isConnected) {
      return "default"
    }
    return "destructive"
  }

  const getConnectionText = () => {
    if (isConnected) {
      return "Connected"
    }
    return "Disconnected"
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {/* Connection Status */}
      <Badge variant={getConnectionVariant()} className="flex items-center gap-2">
        {getConnectionIcon()}
        {getConnectionText()}
      </Badge>

      {/* Room Code */}
      {roomCode && (
        <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
          Room: {roomCode}
        </Badge>
      )}

      {/* Server Status */}
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className="flex items-center gap-2"
      >
        <Server className="w-3 h-3" />
        Server: {isConnected ? "Connected" : "Disconnected"}
      </Badge>

      {/* Action Buttons */}
      {!isConnected && (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onReconnect}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          {onReconnect && !isConnected && (
            <Button size="sm" onClick={onReconnect} className="bg-green-500 hover:bg-green-600 text-white">
              Reconnect
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
