import { Clue, GameState, Player } from '@/lib/types'
import React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Image from 'next/image';

interface PlayerClueListProps {
    player: Player;
    playerClues: Clue[] | undefined;
}

const PlayerClueList = ({player, playerClues}: PlayerClueListProps) => {
    const {name: playerName, avatarUrl} = player;

    return (
        <div className="flex flex-col items-center gap-3 bg-muted/10 px-6 py-4 rounded-lg max-w-[12rem]">
            <Tooltip key={`${playerName}`}>
                <TooltipTrigger className="cursor-default w-full">
                    <div className="flex items-start justify-start gap-3 w-full rounded-lg max-w-[12rem]">
                        <Image
                            src={avatarUrl}
                            alt={`${playerName}'s avatar`}
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-primary/60"
                            />
                        <span className="font-semibold text-lg w-full truncate overflow-hidden whitespace-nowrap">{playerName}:</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>{playerName}</TooltipContent>
            </Tooltip>
            {playerClues && playerClues.length > 0 && (
                <div className='flex flex-col items-start justify-start w-full'>
                    {playerClues.map(({ clue }, index) => {
                        return (
                            <span className="font-bold text-xl text-right w-full  truncate overflow-hidden whitespace-nowrap" key={`${playerName}-clue-${index}`}>{clue}</span>
                        );
                    })}
                </div>
            )
            }
        </div>
    )
}

export default PlayerClueList