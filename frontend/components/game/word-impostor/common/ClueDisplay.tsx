'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { IndividualClue } from '@/lib/types';

interface ClueDisplayProps {
    clues: IndividualClue[];
    playerId: string;
    playerName: string;
    compact?: boolean;
}

export function ClueDisplay({
    clues,
    playerId,
    playerName,
    compact = false,
}: ClueDisplayProps) {
    // Sort clues by timestamp (newest first)
    const sortedClues = useMemo(() => {
        return [...clues].sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
        });
    }, [clues]);

    // Format relative time for tooltip
    const getRelativeTime = (timestamp: Date | undefined) => {
        try {
            if (!timestamp) return 'recently';
            return formatDistanceToNow(timestamp, { addSuffix: true });
        } catch (e) {
            return 'recently';
        }
    };

    if (clues.length === 0) return null;

    return (
        <div className={compact ? "inline-flex flex-wrap gap-1" : "flex flex-wrap gap-1.5 p-2"}>
            <AnimatePresence>
                {sortedClues.map((clue) => (
                    <Tooltip key={clue.id}>
                        <TooltipTrigger asChild>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="inline-block"
                            >
                                <Badge
                                    variant={compact ? "outline" : "secondary"}
                                    className={compact ? "px-1.5 py-0 text-[10px] h-4" : "px-2 py-0.5 text-xs"}
                                >
                                    {clue.text}
                                </Badge>
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center" className="text-xs p-2">
                            <p className="font-medium">{playerName}'s clue</p>
                            <p className="text-muted-foreground">
                                Submitted {getRelativeTime(clue.timestamp)}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </AnimatePresence>
        </div>
    );
}