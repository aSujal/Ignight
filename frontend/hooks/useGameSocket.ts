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
      setGame(null);
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
      console.log("gameStateUpdate", updatedGame);
      setGame(updatedGame);
      setError(null);
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
      socket.off("gameStateUpdate");
      socket.off("error");
    };
  }, [router]);

  const createRoom = useCallback(
    (gameType: string, playerName: string) => {
      try {
        setLoading(true);
        socket.emit("createRoom", {
          gameType,
          playerName,
          playerId: persistentPlayerId,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [socket, persistentPlayerId]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      try {
        setLoading(true);
        socket.emit("joinRoom", {
          roomCode,
          playerName,
          playerId: persistentPlayerId,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [socket, persistentPlayerId]
  );

  const startGame = useCallback(() => {
    socket.emit("gameAction", {
      roomCode: game?.code,
      playerId: persistentPlayerId,
      action: "startGame",
    });
  }, [socket, game?.code, persistentPlayerId]);

  const startRound = useCallback(() => {
    console.log("game", game)
    socket.emit("gameAction", {
      roomCode: game?.code,
      playerId: persistentPlayerId,
      action: "startRound",
    });
  }, [socket, game?.code, persistentPlayerId]);

  const submitClue = useCallback(
    (clue: string) => {
      socket.emit("gameAction", {
        roomCode: game?.code,
        playerId: persistentPlayerId,
        action: "submitClue",
        data: { clue },
      });
    },
    [socket, game?.code, persistentPlayerId]
  );

  const submitVote = useCallback(
    (votedForPlayerId: string) => {
      socket.emit("gameAction", {
        roomCode: game?.code,
        playerId: persistentPlayerId,
        action: "submitVote",
        data: { votedForPlayerId },
      });
    },
    [socket, game?.code, persistentPlayerId]
  );

  const resetGame = useCallback(() => {
    console.log("game", game)
    socket.emit("gameAction", {
      roomCode: game?.code,
      playerId: persistentPlayerId,
      action: "resetGame",
    });
  }, [socket, game?.code, persistentPlayerId]);
  console.log("gameo", game)

  // Host actions
  const hostSkipWordShow = useCallback(() => {
    socket.emit("gameAction", { roomCode: game?.code, playerId: persistentPlayerId, action: "hostSkipWordShow" });
  }, [socket, game?.code, persistentPlayerId]);

  const hostEndDiscussion = useCallback(() => {
    socket.emit("gameAction", { roomCode: game?.code, playerId: persistentPlayerId, action: "hostEndDiscussion" });
  }, [socket, game?.code, persistentPlayerId]);

  const hostEndVoting = useCallback(() => {
    socket.emit("gameAction", { roomCode: game?.code, playerId: persistentPlayerId, action: "hostEndVoting" });
  }, [socket, game?.code, persistentPlayerId]);

  // Player actions
  const readyUp = useCallback(() => {
    socket.emit("gameAction", { roomCode: game?.code, playerId: persistentPlayerId, action: "readyUp" });
  }, [socket, game?.code, persistentPlayerId]);

  // New function to add a bot
  const addBotToGame = useCallback(() => {
    socket.emit("gameAction", {
      roomCode: game?.code,
      playerId: persistentPlayerId, // Host is adding the bot
      action: "addBot",
    });
  }, [socket, game?.code, persistentPlayerId]);

  const updateAvatarStyle = useCallback(
    (style: string) => {
      socket.emit("gameAction", {
        roomCode: game?.code,
        playerId: persistentPlayerId,
        action: "changeAvatarStyle",
        data: { style },
      });
    },
    [socket, game?.code, persistentPlayerId]
  );

  const removePlayer = useCallback(
    (playerId: string) => {
      socket.emit("gameAction", {
        roomCode: game?.code,
        playerId: persistentPlayerId,
        action: "removePlayer",
        data: { playerId },
      });
    },
    [socket, game?.code, persistentPlayerId]
  );

  return {
    isConnected,
    game,
    error,
    loading,
    createRoom,
    joinRoom,
    startGame,
    startRound,
    submitClue,
    submitVote,
    resetGame,
    // Host actions
    hostSkipWordShow,
    hostEndDiscussion,
    hostEndVoting,
    // Player actions
    readyUp,
    addBotToGame,
    removePlayer,
  };
}
