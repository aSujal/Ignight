import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { GAME_PHASES } from "@/lib/enum";
import { GameState, Player } from "@/lib/types";
import { PlayerList } from "@/components/player-list";

import { GameLobby } from "./GameLobby";
import ScreenLoader from "../loader";

interface WordImpostorGameProps {
  game: GameState;
  submitClue: (clue: string) => void;
  submitVote: (playerId: string) => void;
  resetGame: () => void;
  startGame: () => void;
  hostSkipWordShow: () => void;
  hostEndDiscussion: () => void;
  hostEndVoting: () => void;
  readyUp: () => void;
  addBotToGame: () => void;
  removePlayer: (playerId: string) => void;
}

export function WordImpostorGame({
  game,
  submitClue,
  submitVote,
  resetGame,
  startGame,
  hostSkipWordShow,
  hostEndDiscussion,
  hostEndVoting,
  readyUp,
  addBotToGame,
  removePlayer,
}: WordImpostorGameProps) {
  const [clue, setClue] = useState("");

  const [persistentPlayerId] = usePersistentPlayerId();

  const currentPlayer = game?.players.find(
    (p: Player) => p.id === persistentPlayerId
  );
  const isHost = currentPlayer?.isHost;
  const isCurrentPlayerImpostor = game.isImpostor ?? false;

  const handleSubmitClue = () => {
    if (clue.trim()) {
      submitClue(clue.trim());
      setClue("");
    }
  };

  if (game?.phase === GAME_PHASES.WORD_SHOW && game?.gameData) {
    const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;
    const isPlayerReady = game.readyPlayers?.includes(persistentPlayerId ?? "");

    return (
      <Card className="w-full max-w-lg mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl text-center">
        <CardHeader className="pt-8 pb-4">
          <CardTitle className="text-2xl font-semibold text-muted-foreground">
            Your Identity & Word
          </CardTitle>
          <div className="mt-2 text-base text-accent-foreground">
            <span>
              {game.readyPlayers?.length || 0} / {totalHumanPlayers} Players
              Ready
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6 min-h-[350px] flex flex-col justify-center items-center">
          <div
            className={`text-6xl font-extrabold tracking-tight p-8 rounded-xl shadow-2xl transition-all duration-300 ease-in-out w-full ${
              isCurrentPlayerImpostor
                ? "bg-gradient-to-br from-destructive via-destructive/90 to-red-700 text-destructive-foreground animate-pulse-slow"
                : "bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-primary-foreground"
            }`}
          >
            {isCurrentPlayerImpostor
              ? "🤫 YOU ARE THE IMPOSTOR 🤫"
              : game.gameData.word}
          </div>
          {!isCurrentPlayerImpostor && (
            <p className="text-2xl text-muted-foreground font-medium pt-2">
              Hint:{" "}
              <span className="text-accent-foreground">
                {game.gameData.hint}
              </span>
            </p>
          )}
          {isCurrentPlayerImpostor && (
            <p className="text-xl text-destructive-foreground/80 font-medium pt-2">
              Blend in. Don't reveal yourself!
            </p>
          )}
          {game.timerRemaining !== undefined && (
            <p className="text-accent-foreground text-3xl font-mono animate-pulse tabular-nums">
              {game.timerRemaining}s
            </p>
          )}
          <div className="w-full space-y-3 mt-6">
            <Button
              onClick={readyUp}
              disabled={isPlayerReady}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-green-500/50 disabled:opacity-70"
            >
              {isPlayerReady ? "✔️ Ready" : "I'm Ready!"}
            </Button>
            {isHost && (
              <Button
                onClick={hostSkipWordShow}
                variant="ghost"
                size="sm"
                className="w-full text-sm text-muted-foreground hover:text-accent-foreground opacity-90 hover:opacity-100 transition-opacity"
              >
                Skip Phase for All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (game?.phase === GAME_PHASES.DISCUSSION) {
    const hasSubmittedClue = !!game.clues?.find(
      (c) => c.playerId === persistentPlayerId
    );
    const canPlayerReady = hasSubmittedClue || isCurrentPlayerImpostor;
    const isPlayerReady = game.readyPlayers?.includes(persistentPlayerId ?? "");
    const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;

    return (
      <Card className="w-full max-w-2xl mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl">
        <CardHeader className="text-center border-b border-border/50 pb-4 pt-6">
          <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">
            Discussion
          </CardTitle>
          <div className="mt-3 text-lg text-accent-foreground font-mono tabular-nums">
            <span>Time: {game.timerRemaining ?? "N/A"}s</span> |{" "}
            <span>
              {game.readyPlayers?.length || 0}/{totalHumanPlayers} Ready
            </span>
          </div>
          <p className="text-muted-foreground pt-2 text-base">
            {isCurrentPlayerImpostor
              ? "You are the Impostor. Blend in, observe clues, and prepare your defense."
              : "Submit your unique one-word clue, then discuss to find the impostor."}
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {!hasSubmittedClue && !isCurrentPlayerImpostor && (
            <div className="flex gap-3 items-stretch p-1 bg-muted/30 rounded-lg shadow">
              <Input
                placeholder="Enter your one-word clue..."
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitClue()}
                className="flex-grow bg-input text-foreground placeholder:text-muted-foreground rounded-md text-base p-5 h-auto shadow-inner"
                disabled={hasSubmittedClue || isCurrentPlayerImpostor}
              />
              <Button
                onClick={handleSubmitClue}
                disabled={
                  !clue.trim() || hasSubmittedClue || isCurrentPlayerImpostor
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-base rounded-md shadow-lg transition-transform hover:scale-105"
              >
                Submit Clue
              </Button>
            </div>
          )}
          {(hasSubmittedClue || isCurrentPlayerImpostor) && (
            <div className="text-center p-4 bg-secondary/70 rounded-lg shadow-md">
              <p className="text-secondary-foreground font-medium text-base">
                {isCurrentPlayerImpostor
                  ? "You are the Impostor. Observe the clues and prepare to defend yourself."
                  : "Your clue is submitted! Discuss with other players."}
              </p>
            </div>
          )}

          {game.clues && game.clues.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-2xl font-semibold text-primary-foreground mb-3 text-center tracking-tight">
                Submitted Clues
              </h3>
              <div className="max-h-72 overflow-y-auto space-y-3 p-2 rounded-lg bg-background/50 custom-scrollbar shadow-inner">
                {game.clues.map(
                  ({ playerId: pId, playerName, clue: submittedClue }) => {
                    const cluePlayer = game.players.find((p) => p.id === pId);
                    return (
                      <div
                        key={pId}
                        className="flex items-center justify-between p-4 bg-muted/80 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
                      >
                        <div className="flex items-center gap-3">
                          {cluePlayer && (
                            <Image
                              src={cluePlayer.avatarUrl}
                              alt={`${playerName}'s avatar`}
                              width={40}
                              height={40}
                              className="rounded-full border-2 border-primary/60 shadow-sm"
                            />
                          )}
                          <span className="font-semibold text-foreground text-lg">
                            {playerName}:
                          </span>
                        </div>
                        <span className="font-bold text-2xl text-accent-foreground break-all text-right tracking-wide">
                          {submittedClue}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              onClick={readyUp}
              disabled={!canPlayerReady || isPlayerReady}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-green-500/50 disabled:opacity-70"
            >
              {isPlayerReady ? "✔️ Ready!" : "Ready to Vote"}
            </Button>
            {isHost && (
              <Button
                onClick={hostEndDiscussion}
                variant="outline"
                className="flex-1 border-accent text-accent-foreground hover:bg-accent/20 hover:border-accent/70 text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-accent/50"
              >
                End Discussion
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // VOTING Phase UI
  if (game?.phase === GAME_PHASES.VOTING) {
    const hasVoted = !!game.votes?.find(
      (v) => "voterId" in v && v.voterId === persistentPlayerId
    );
    const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;

    return (
      <Card className="w-full max-w-lg mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl">
        <CardHeader className="text-center border-b border-border/50 pb-4 pt-6">
          <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">
            Vote Now!
          </CardTitle>
          <div className="mt-3 text-lg text-accent-foreground font-mono tabular-nums">
            <span>Time: {game.timerRemaining ?? "N/A"}s</span> |{" "}
            <span>
              {game.readyPlayers?.length || 0}/{totalHumanPlayers} Ready
            </span>
          </div>
          <p className="text-muted-foreground pt-2 text-base">
            Select the player you suspect is the Impostor.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {game?.players
              .filter((p) => p.isConnected)
              .map((player) => (
                <Button
                  key={player.id}
                  variant="outline"
                  className={`w-full justify-start gap-3 text-lg p-8 rounded-lg shadow-md transition-all duration-150 ease-in-out focus:ring-4 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed
                            hover:shadow-xl hover:scale-105
                            ${
                              hasVoted &&
                              game.votes?.find(
                                (v) => v.voterId === persistentPlayerId
                              )?.votedForPlayerId === player.id
                                ? "ring-4 ring-primary ring-offset-background shadow-2xl scale-105 border-primary/80"
                                : "border-muted/70 hover:border-accent"
                            }
                            ${
                              player.id === persistentPlayerId
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                          `}
                  onClick={() => submitVote(player.id)}
                  disabled={
                    player.id === persistentPlayerId ||
                    !player.isConnected ||
                    hasVoted
                  }
                >
                  <Image
                    src={player.avatarUrl}
                    alt={`${player.name}'s avatar`}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-muted shadow-sm"
                  />
                  <span className="font-semibold text-base">{player.name}</span>
                </Button>
              ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              onClick={readyUp}
              disabled={
                !hasVoted ||
                !!game.readyPlayers?.includes(persistentPlayerId ?? "")
              }
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-green-500/50 disabled:opacity-70"
            >
              {!!game.readyPlayers?.includes(persistentPlayerId ?? "")
                ? "✔️ Ready!"
                : "Ready for Results"}
            </Button>
            {isHost && (
              <Button
                onClick={hostEndVoting}
                variant="outline"
                className="flex-1 border-accent text-accent-foreground hover:bg-accent/20 hover:border-accent/70 text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-accent/50"
              >
                End Voting
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // RESULTS Phase UI
  if (game?.phase === GAME_PHASES.RESULTS && game?.results) {
    const impostorPlayer = game?.players.find(
      (p) => p.id === game.results.impostorId
    );
    const mostVotedPlayer = game?.players.find(
      (p) => p.id === game.results.mostVotedId
    );

    return (
      <Card className="w-full max-w-xl mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl text-center">
        <CardHeader className="pt-8 pb-4 border-b border-border/50">
          <CardTitle
            className="text-5xl font-extrabold tracking-tight
            bg-clip-text text-transparent bg-gradient-to-r
            from-primary via-accent-foreground to-secondary-foreground"
          >
            Game Over!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div
            className={`p-6 rounded-xl shadow-xl text-3xl font-bold transition-all duration-500 ease-in-out transform hover:scale-105
              ${
                game.results.impostorCaught
                  ? "bg-gradient-to-br from-green-500 via-green-600 to-teal-500 text-white"
                  : "bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white"
              }`}
          >
            {game.results.impostorCaught
              ? "🎉 IMPOSTOR CAUGHT! 🎉"
              : "💀 IMPOSTOR ESCAPED! 💀"}
            <p className="text-lg font-normal mt-1 opacity-90">
              {game.results.impostorCaught
                ? "The crewmates win!"
                : "The impostor wins!"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
            <div className="p-5 bg-muted/70 rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-accent-foreground mb-3 border-b border-border/50 pb-2">
                The Impostor Was:
              </h4>
              {impostorPlayer ? (
                <div className="flex items-center gap-3">
                  <Image
                    src={impostorPlayer.avatarUrl}
                    alt={`${impostorPlayer.name}'s avatar`}
                    width={48}
                    height={48}
                    className="rounded-full border-3 border-destructive shadow-md"
                  />
                  <span className="text-2xl font-bold text-foreground tracking-wide">
                    {impostorPlayer.name}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Error: Impostor details not found.
                </p>
              )}
            </div>

            <div className="p-5 bg-muted/70 rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-accent-foreground mb-3 border-b border-border/50 pb-2">
                Most Voted Player:
              </h4>
              {mostVotedPlayer ? (
                <div className="flex items-center gap-3">
                  <Image
                    src={mostVotedPlayer.avatarUrl}
                    alt={`${mostVotedPlayer.name}'s avatar`}
                    width={48}
                    height={48}
                    className="rounded-full border-3 border-primary shadow-md"
                  />
                  <span className="text-2xl font-bold text-foreground tracking-wide">
                    {mostVotedPlayer.name}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No single player was decisively voted out.
                </p>
              )}
            </div>
          </div>

          {isHost && (
            <Button
              onClick={resetGame}
              className="w-full mt-8 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/80 hover:to-primary text-xl py-7 rounded-lg shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-primary/50"
            >
              ✨ Play Again ✨
            </Button>
          )}
          {!isHost && (
            <p className="text-center text-muted-foreground pt-6">
              Waiting for the host to start a new game...
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="text-center py-20">
      <ScreenLoader
        title="Loading Game"
        description={`Loading game for ${game?.code}`}
      />
    </div>
  );
}
