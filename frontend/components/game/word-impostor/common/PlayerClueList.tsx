
import { Clue as ClueType, Player } from "@/lib/types";
import PlayerCard from "./PlayerCard";
import Clue from "./Clue";

interface PlayerClueListProps {
    player: Player;
    playerClues: ClueType[] | undefined;
}

const PlayerClueList = ({ player, playerClues }: PlayerClueListProps) => {
    return (
        <div className="flex flex-col gap-2 bg-muted/10 p-4 rounded-xl shadow-sm w-full md:max-w-xs">
        <PlayerCard name={player.name} avatarUrl={player.avatarUrl} />
        {playerClues && playerClues.length > 0 && (
            <div className="flex flex-col gap-1 mt-1 w-full">
            {playerClues.map(({ clue }, index) => (
                <Clue clue={clue} key={`${player.name}-clue-${index}`} />
            ))}
            </div>
        )}
        </div>
    );
};

export default PlayerClueList;
