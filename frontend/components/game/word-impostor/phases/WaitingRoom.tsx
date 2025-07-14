// app/components/games/word-impostor/phases/waitingRoom.tsx

import { GameState, Player } from "@/lib/types";
import { PlayerList } from "@/components/player-list";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { GameLobby } from "../../GameLobby";

interface WaitingRoomProps {
  game: GameState;
  startGame: () => void;
  addBotToGame: () => void;
  removePlayer: (playerId: string) => void;
}

export function WaitingRoom({
  game,
  startGame,
  addBotToGame,
  removePlayer,
}: WaitingRoomProps) {
  const [persistentPlayerId] = usePersistentPlayerId();

  const currentPlayer = game?.players.find(
    (p: Player) => p.id === persistentPlayerId
  );
  const isHost = currentPlayer?.isHost;

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-2">
        <PlayerList
          players={game.players}
          currentPlayerId={persistentPlayerId}
          title="Players in Lobby"
          removePlayer={removePlayer}
        />
      </div>
      <GameLobby
        game={game}
        isHost={isHost}
        currentPlayer={currentPlayer}
        startGame={startGame}
        addBotToGame={addBotToGame}
      />
    </div>
  );
}
