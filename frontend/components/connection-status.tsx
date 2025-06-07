"use client"

import { Badge } from "@/components/ui/badge"
import { WifiOff, RefreshCw, CheckCircle } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
  roomCode?: string | null
}

export function ConnectionStatus({ isConnected, roomCode }: ConnectionStatusProps) {
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
      <Badge variant={getConnectionVariant()} className="flex items-center gap-2">
        {getConnectionIcon()}
        {getConnectionText()}
      </Badge>
      {roomCode && (
        <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
          Room: {roomCode}
        </Badge>
      )}
    </div>
  )
}
