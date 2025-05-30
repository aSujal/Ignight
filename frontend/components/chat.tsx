"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle, X } from "lucide-react"
import type { ChatMessage } from "@/lib/types"

interface ChatProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function Chat({ messages, onSendMessage, isOpen, onToggle }: ChatProps) {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div className="fixed bottom-4 right-4 z-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={onToggle}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {messages.length > 0 && !isOpen && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 text-xs">
              {messages.length > 99 ? "99+" : messages.length}
            </Badge>
          )}
        </Button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-4 bottom-20 z-40 w-80 h-96"
          >
            <Card className="h-full bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full p-3 pt-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-2 rounded-lg text-sm ${
                          message.type === "system"
                            ? "bg-yellow-500/20 text-yellow-200"
                            : message.type === "game"
                              ? "bg-blue-500/20 text-blue-200"
                              : "bg-white/10 text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs">{message.playerName}</span>
                          <span className="text-xs opacity-60">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div>{message.message}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-sm"
                    maxLength={200}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
