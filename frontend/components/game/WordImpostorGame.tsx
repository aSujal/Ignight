import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGameSocket } from "@/hooks/useGameSocket";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { GAME_PHASES } from "@/lib/enum";
import { GameState } from "@/lib/types";

export function WordImpostorGame({ game }: { game: GameState }) {
  const [clue, setClue] = useState("");
  const { submitClue, submitVote, resetGame, startRound } = useGameSocket();

  console.log("game", game);
  const [persistentPlayerId] = usePersistentPlayerId();

  const currentPlayer = game?.players.find((p) => p.id === persistentPlayerId);
  const isHost = currentPlayer?.isHost;

  const handleSubmitClue = () => {
    if (clue.trim()) {
      submitClue(clue.trim());
      setClue("");
    }
  };
  if (game?.phase === GAME_PHASES.WORD_REVEAL && game?.gameData) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 text-center py-8">
          <div
            className={`text-4xl font-bold ${
              game.gameData.isImpostor ? "text-red-500" : "text-blue-500"
            }`}
          >
            {game.gameData.word || "Imposter"}
          </div>
          <p className="text-gray-600">{game.gameData.hint}</p>
          {isHost && (
            <Button
              onClick={() => startRound()}
              className="bg-gradient-to-r from-green-500 to-green-600"
            >
              Start Round
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (game?.phase === GAME_PHASES.CLUE_GIVING) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Give Your Clue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your clue..."
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitClue()}
            />
            <Button onClick={handleSubmitClue} disabled={!clue.trim()}>
              Submit
            </Button>
          </div>

          {game.clues && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Submitted Clues:</h3>
              {game.clues.map(({ playerId: pId, playerName, clue }) => (
                <div key={pId} className="flex justify-between py-1">
                  <span>{playerName}:</span>
                  <span className="font-medium">{clue}</span>
                </div>
              ))}
            </div>
          )}

          <Button onClick={() => resetGame()}>
            go back to startGame phase
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (game?.phase === GAME_PHASES.VOTING) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vote for the Impostor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {game?.players.map((player) => (
              <Button
                key={player.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => submitVote(player.id)}
                disabled={player.id === persistentPlayerId}
              >
                {player.name} {player.id === persistentPlayerId && "(You)"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (game?.phase === GAME_PHASES.RESULTS && game?.results) {
    const impostorName = game?.players.find(
      (p) => p.id === game.results.impostorId
    )?.name;
    const mostVotedName = game?.players.find(
      (p) => p.id === game.results.mostVotedId
    )?.name;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <p className="text-lg mb-2">
              The impostor was: <strong>{impostorName}</strong>
            </p>
            <p className="text-lg mb-4">
              Most voted: <strong>{mostVotedName}</strong>
            </p>
            <Badge
              variant={game.results.impostorCaught ? "default" : "destructive"}
            >
              {game.results.impostorCaught
                ? "Impostor Caught!"
                : "Impostor Won!"}
            </Badge>
          </div>

          {isHost && (
            <Button onClick={resetGame} className="w-full">
              Play Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
