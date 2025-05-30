import { io, type Socket } from "socket.io-client"

class SocketManager {
  private socket: Socket | null = null
  private static instance: SocketManager

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  connect(): Socket {
    if (!this.socket) {
      // Use the current domain for production, localhost for development
      const socketUrl =
        process.env.NODE_ENV === "production"
          ? window.location.origin
          : `http://localhost:${process.env.NEXT_PUBLIC_SOCKET_PORT || 3001}`

      console.log("Connecting to Socket.io server at:", socketUrl)

      this.socket = io(socketUrl, {
        path: "/api/socketio",
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      })

      this.socket.on("connect", () => {
        console.log("✅ Connected to Socket.io server")
      })

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from Socket.io server:", reason)
      })

      this.socket.on("connect_error", (error) => {
        console.error("🔴 Connection error:", error)
      })

      this.socket.on("reconnect", (attemptNumber) => {
        console.log("🔄 Reconnected after", attemptNumber, "attempts")
      })
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export default SocketManager
