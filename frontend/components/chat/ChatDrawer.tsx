"use client";

import { useState, useRef, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Player, ChatMessage } from "@/lib/types";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ChatDrawerProps {
    players: Player[];
    currentPlayerId: string;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
}

export function ChatDrawer({
  players,
  currentPlayerId,
  messages,
  onSendMessage,
}: ChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  console.log('messages:',messages);

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full p-3 shadow-lg bg-muted hover:bg-muted/80"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      {/* Drawer Panel */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-md h-full bg-card shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-primary">Game Chat</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Messages */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-muted/30"
            >
{messages.map((msg) => {
  if (msg.senderType === "server") {
    return (
      <div
        key={msg.id}
        className="text-center text-muted-foreground text-xs italic py-2"
      >
        {msg.message}
      </div>
    );
  }

  const sender = players.find((p) => p.id === msg.playerId);
  const isSelf = msg.playerId === currentPlayerId;

  return (
    <div
      key={msg.id}
      className={cn("flex items-start gap-3", isSelf && "flex-row-reverse")}
    >
      <Image
        src={sender?.avatarUrl || "/avatar.png"}
        alt={msg.playerName || "server-message"}
        width={32}
        height={32}
        className="rounded-full border border-border"
      />
      <div className="max-w-xs bg-background/80 p-3 rounded-lg shadow text-sm">
        <span className="font-medium block text-muted-foreground mb-1">
          {msg.playerName}
        </span>
        <span className="text-accent-foreground break-words">
          {msg.message}
        </span>
      </div>
    </div>
  );
})}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button onClick={handleSend} disabled={!message.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
