import { Player, PlayerClues } from "@/lib/types";
import PlayerCard from "./PlayerCard";
import Clue from "./Clue";

interface PlayerClueListProps {
    playerClues: PlayerClues;
    player: Player;
    highlight?: boolean; // Add this prop
}

const PlayerClueList = ({ playerClues, player, highlight = false }: PlayerClueListProps) => {
    const { playerName, clues } = playerClues;
    const playerAvatar = player?.avatarUrl;

    return (
        <div className="flex flex-col gap-2 bg-muted/10 p-4 rounded-xl shadow-sm w-full md:max-w-xs">
        <PlayerCard name={playerName} avatarUrl={playerAvatar} highlight={highlight} />
        {clues && clues.length > 0 && (
            <div className="flex flex-col gap-1 mt-1 w-full">
            {clues.map((clue, index) => (
                <Clue clue={clue} key={`${playerName}-clue-${index}`} />
            ))}
            </div>
        )}
        </div>
    );
};

export default PlayerClueList;
