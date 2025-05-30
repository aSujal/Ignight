export interface Player {
  id: string
  name: string
  isHost: boolean
  isReady: boolean
  votes: number
  isEliminated: boolean
  isConnected: boolean
  avatar?: string
}

export interface GameRoom {
  id: string
  code: string
  gameType: string
  players: Player[]
  gameState: "lobby" | "playing" | "voting" | "results"
  currentRound: number
  maxRounds: number
  timeLeft: number
  gameData: any
  createdAt: Date
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  message: string
  timestamp: Date
  type: "chat" | "system" | "game"
}

export interface GameEvents {
  // Room events
  "room:join": (data: { roomCode: string; playerName: string }) => void
  "room:leave": () => void
  "room:create": (data: { gameType: string; playerName: string }) => void
  "room:update": (room: GameRoom) => void
  "room:joined": (data: { room: GameRoom; playerId: string }) => void
  "room:error": (error: string) => void

  // Player events
  "player:ready": (isReady: boolean) => void
  "player:disconnect": (playerId: string) => void
  "player:reconnect": (playerId: string) => void

  // Game events
  "game:start": () => void
  "game:state-update": (gameData: any) => void
  "game:round-start": (roundData: any) => void
  "game:submit-answer": (answer: string) => void
  "game:vote": (targetPlayerId: string) => void
  "game:end": (results: any) => void

  // Chat events
  "chat:message": (message: string) => void
  "chat:receive": (message: ChatMessage) => void

  // System events
  error: (error: string) => void
  disconnect: () => void
  connect: () => void
}
