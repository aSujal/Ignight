"use client"

interface LogEntry {
  timestamp: Date
  level: "info" | "warn" | "error" | "debug"
  message: string
  context?: any
  userId?: string
  roomCode?: string
  action?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private listeners: ((logs: LogEntry[]) => void)[] = []

  private log(level: LogEntry["level"], message: string, context?: any, metadata?: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      ...metadata,
    }

    this.logs.unshift(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Console logging with colors
    const timestamp = entry.timestamp.toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    switch (level) {
      case "error":
        console.error(`🔴 ${prefix}`, message, context)
        break
      case "warn":
        console.warn(`🟡 ${prefix}`, message, context)
        break
      case "info":
        console.info(`🔵 ${prefix}`, message, context)
        break
      case "debug":
        console.debug(`⚪ ${prefix}`, message, context)
        break
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener([...this.logs]))
  }

  info(message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.log("info", message, context, metadata)
  }

  warn(message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.log("warn", message, context, metadata)
  }

  error(message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.log("error", message, context, metadata)
  }

  debug(message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.log("debug", message, context, metadata)
  }

  // Game-specific logging methods
  gameAction(action: string, message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.info(message, context, { action, ...metadata })
  }

  playerAction(playerId: string, action: string, message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.info(message, context, { action, userId: playerId, ...metadata })
  }

  roomAction(roomCode: string, action: string, message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.info(message, context, { action, roomCode, ...metadata })
  }

  connectionEvent(event: string, message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.info(message, context, { action: `connection:${event}`, ...metadata })
  }

  apiCall(endpoint: string, method: string, message: string, context?: any, metadata?: Partial<LogEntry>) {
    this.debug(message, context, { action: `api:${method}:${endpoint}`, ...metadata })
  }

  // Get logs
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Subscribe to log updates
  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  // Clear logs
  clear() {
    this.logs = []
    this.listeners.forEach((listener) => listener([]))
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Get filtered logs
  getFilteredLogs(filters: {
    level?: LogEntry["level"]
    action?: string
    roomCode?: string
    userId?: string
    since?: Date
  }): LogEntry[] {
    return this.logs.filter((log) => {
      if (filters.level && log.level !== filters.level) return false
      if (filters.action && log.action !== filters.action) return false
      if (filters.roomCode && log.roomCode !== filters.roomCode) return false
      if (filters.userId && log.userId !== filters.userId) return false
      if (filters.since && log.timestamp < filters.since) return false
      return true
    })
  }
}

// Global logger instance
const logger = new Logger()
export default logger
