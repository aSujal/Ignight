"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw, Server, AlertTriangle, CheckCircle } from "lucide-react"
import logger from "@/lib/logger"

interface ConnectionStatusProps {
  isConnected: boolean
  connectionStatus: "connecting" | "connected" | "disconnected" | "error"
  onReconnect?: () => void
  roomCode?: string
}

export function ConnectionStatus({ isConnected, connectionStatus, onReconnect, roomCode }: ConnectionStatusProps) {
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking")

  const checkServerStatus = async () => {
    try {
      setServerStatus("checking")
      logger.connectionEvent("server_check", "Checking server status")

      const response = await fetch("/api/socketio")
      if (response.ok) {
        setServerStatus("online")
        logger.connectionEvent("server_check", "Server is online")
      } else {
        setServerStatus("offline")
        logger.connectionEvent("server_check", "Server responded with error", { status: response.status })
      }
    } catch (error) {
      setServerStatus("offline")
      logger.error("Server status check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const initializeServer = async () => {
    try {
      logger.connectionEvent("server_init", "Initializing server")
      await fetch("/api/socketio", { method: "POST" })
      setTimeout(checkServerStatus, 1000)
    } catch (error) {
      logger.error("Failed to initialize server", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  useEffect(() => {
    checkServerStatus()
  }, [])

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle className="w-3 h-3" />
      case "connecting":
        return <RefreshCw className="w-3 h-3 animate-spin" />
      case "error":
        return <AlertTriangle className="w-3 h-3" />
      case "disconnected":
      default:
        return <WifiOff className="w-3 h-3" />
    }
  }

  const getConnectionVariant = () => {
    if (isConnected && connectionStatus === "connected") {
      return "default"
    }
    switch (connectionStatus) {
      case "connecting":
        return "secondary"
      case "error":
        return "destructive"
      case "disconnected":
      default:
        return "destructive"
    }
  }

  const getConnectionText = () => {
    if (isConnected && connectionStatus === "connected") {
      return "Connected"
    }
    switch (connectionStatus) {
      case "connecting":
        return "Connecting..."
      case "error":
        return "Connection Error"
      case "disconnected":
      default:
        return "Disconnected"
    }
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
        variant={serverStatus === "online" ? "default" : serverStatus === "offline" ? "destructive" : "secondary"}
        className="flex items-center gap-2"
      >
        <Server className="w-3 h-3" />
        Server: {serverStatus}
      </Badge>

      {/* Action Buttons */}
      {(connectionStatus === "error" || connectionStatus === "disconnected" || serverStatus === "offline") && (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={checkServerStatus}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          {serverStatus === "offline" && (
            <Button size="sm" onClick={initializeServer} className="bg-blue-500 hover:bg-blue-600 text-white">
              Start Server
            </Button>
          )}
          {onReconnect && connectionStatus === "error" && (
            <Button size="sm" onClick={onReconnect} className="bg-green-500 hover:bg-green-600 text-white">
              Reconnect
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
