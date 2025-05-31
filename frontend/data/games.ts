import { Users, Zap, Music, HelpCircle, Eye, Volume2, CheckCircle, Loader2 } from "lucide-react"

export const games = [
    {
      id: "imposter",
      title: "Who's the Imposter?",
      description: "Find the imposter among your friends in this word-based deduction game",
      icon: Eye,
      players: "3-10 players",
      duration: "5-15 min",
      color: "from-red-500 to-pink-600",
    },
    {
      id: "question",
      title: "Odd One Out",
      description: "Everyone gets the same question except one. Find who got the different question!",
      icon: HelpCircle,
      players: "4-12 players",
      duration: "10-20 min",
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: "music",
      title: "Guess the Sound",
      description: "AI-generated playlists challenge your music knowledge",
      icon: Volume2,
      players: "2-8 players",
      duration: "15-30 min",
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "would-you-rather",
      title: "Would You Rather",
      description: "Make impossible choices and see how your friends decide",
      icon: Zap,
      players: "2-12 players",
      duration: "10-25 min",
      color: "from-green-500 to-emerald-600",
    },
  ]