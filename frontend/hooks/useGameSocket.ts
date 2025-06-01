"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameState } from "@/lib/types";
import socket from "@/lib/socket";
import { useRouter } from "next/navigation";
import { usePersistentPlayerId } from "./useLocalStorage";

export function useGameSocket() {
  const [persistentPlayerId] = usePersistentPlayerId();
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
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
      setLoading(false);
    });

    socket.on("message", (message: string) => {
      console.log("Socket Message:", message);
    });

    socket.on("connect", () => {
      console.log("connected");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      setError("Disconnected from server. Please check your connection.");
    });

    socket.on("roomCreated", (game: GameState) => {
      setGame(game);
      setLoading(false);
      setError(null);
      setLoading(false);
      router.push(`/game/${game.code}`);
    });

    socket.on("roomJoined", (game: GameState) => {
      console.log("roomJoined", game);
      setGame(game);
      setLoading(false);
      setError(null);
    });

    socket.on("gameStateUpdate", (updatedGame: GameState) => {
      setGame(updatedGame);
      setError(null);
      setLoading(false);
    });

    socket.on("playerJoined", (playerData: GameState["players"][0]) => {
      console.log("playerJoined", playerData);
      setGame((prevGame) => {
        if (!prevGame) return null;
        if (prevGame.players.find((p) => p.id === playerData.id)) {
          return prevGame;
        }
        return {
          ...prevGame,
          players: [...prevGame.players, playerData],
        };
      });
    });

    socket.on("playerLeft", (playerId: string) => {
      console.log("playerLeft", playerId);
      setGame((prevGame) => {
        if (!prevGame) return null;
        return {
          ...prevGame,
          players: prevGame.players.filter((p) => p.id !== playerId),
        };
      });
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
      socket.off("gameStateUpdate");
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("error");
    };
  }, [router]);

  const createRoom = useCallback((gameType: string, playerName: string) => {
    try {
      setLoading(true);
      socket.emit("createRoom", { gameType, playerName, playerId: persistentPlayerId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [socket, persistentPlayerId]);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    try {
      setLoading(true);
      socket.emit("joinRoom", { roomCode, playerName, playerId: persistentPlayerId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [socket, persistentPlayerId]);

  return { isConnected, game, error, loading, createRoom, joinRoom };
}
