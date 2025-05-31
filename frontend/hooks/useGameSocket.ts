"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameState } from "@/lib/types";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (socket.connected) {
      console.log("Socket already connected");
      setIsConnected(true);
    }

    socket.onAny((event, ...args) => {
      console.log("Event received:", event, args);
    });

    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    socket.on("message", (message: string) => {
      console.log(message);
    });

    socket.on("connect", () => {
      console.log("connected");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("roomCreated", (game: GameState) => {
      setGame(game);
      setLoading(false);
      router.push(`/game/${game.code}`);
    });

    socket.on("roomJoined", (game: GameState) => {
      console.log("roomJoined", game);
      setGame(game);
      setLoading(false);
    });

    socket.on("error", (errorMessage: string) => {
      setError(errorMessage);
      setLoading(false);
    });

    return () => {
      socket.off("connect_error");
      socket.off("message");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("error");
    };
  }, []);

  const createRoom = useCallback((playerName: string, gameType: string) => {
    try {
      setLoading(true);
      socket.emit("createRoom", { gameType, playerName });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback((playerName: string, roomCode: string) => {
    try {
      setLoading(true);
      socket.emit("joinRoom", { roomCode, playerName });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { isConnected, game, error, loading, createRoom, joinRoom };
}
