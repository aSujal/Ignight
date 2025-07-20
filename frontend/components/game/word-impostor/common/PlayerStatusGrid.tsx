'use client';

import { GameState } from '@/lib/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePersistentPlayerId } from '@/hooks/useLocalStorage';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerStatusGridProps {
    game: GameState;
}

export function PlayerStatusGrid({ game }: PlayerStatusGridProps) {
    const [persistentPlayerId] = usePersistentPlayerId();
    const { players, clues, readyPlayers, currentTurnPlayerId } = game;

    // Calculate optimal grid layout based on player count
    const gridCols = useMemo(() => {
        const count = players.length;
        if (count <= 4) return 'grid-cols-1 sm:grid-cols-2';
        if (count <= 8) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
    }, [players.length]);

    if (!players || players.length === 0) return null;

    return (
        <div className="w-full">
            <div className={cn("grid gap-1.5", gridCols)}>
                <AnimatePresence initial={false} mode="popLayout">
                    {players.map((player) => {
                        const isCurrentTurn = player.id === currentTurnPlayerId;
                        const isReady = readyPlayers?.includes(player.id) || false;
                        const playerClues = clues.find(c => c.playerId === player.id)?.clues || [];
                        const isCurrentPlayer = player.id === persistentPlayerId;

                        // Status is determined by the player's state

                        // Determine status icon
                        const StatusIcon = isReady
                            ? Check
                            : isCurrentTurn
                                ? MessageCircle
                                : Clock;

                        return (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <motion.div
                                            className={cn(
                                                "flex items-center py-2 px-3 rounded-lg transition-all duration-300",
                                                isReady
                                                    ? "bg-primary/10 shadow-sm"
                                                    : isCurrentTurn
                                                        ? "bg-secondary/20 shadow-sm"
                                                        : "bg-card/60",
                                                isCurrentPlayer ? "ring-2 ring-primary/50" : "",
                                                "hover:shadow-md hover:scale-[1.02]"
                                            )}
                                            animate={{
                                                backgroundColor: isReady
                                                    ? ["rgba(var(--primary), 0.1)", "rgba(var(--primary), 0.15)", "rgba(var(--primary), 0.1)"]
                                                    : isCurrentTurn
                                                        ? ["rgba(var(--secondary), 0.2)", "rgba(var(--secondary), 0.25)", "rgba(var(--secondary), 0.2)"]
                                                        : "rgba(var(--card), 0.6)"
                                            }}
                                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                        >
                                            {/* Avatar with enhanced status indicators */}
                                            <div className="relative flex-shrink-0">
                                                <Image
                                                    src={player.avatarUrl}
                                                    alt={`${player.name}'s avatar`}
                                                    width={28}
                                                    height={28}
                                                    className={cn(
                                                        "rounded-full border-2 transition-all duration-300",
                                                        isReady
                                                            ? "border-primary shadow-sm"
                                                            : isCurrentTurn
                                                                ? "border-secondary shadow-sm"
                                                                : "border-muted-foreground/30"
                                                    )}
                                                />
                                                {/* Enhanced status indicator on avatar */}
                                                {(isCurrentTurn || isReady) && (
                                                    <motion.div
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className={cn(
                                                            "absolute -top-1 -right-1 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs font-bold shadow-sm",
                                                            isReady ? "bg-primary" : "bg-secondary"
                                                        )}
                                                    >
                                                        {isReady ? "✓" : "●"}
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Enhanced name and clue info */}
                                            <div className="ml-2 min-w-0 flex-1">
                                                <div className="flex items-center gap-1">
                                                    <p className={cn(
                                                        "text-sm font-medium truncate max-w-[80px]",
                                                        isReady ? "text-primary" : isCurrentTurn ? "text-secondary-foreground" : "text-foreground"
                                                    )}>
                                                        {player.name}
                                                    </p>
                                                    {isCurrentPlayer && (
                                                        <Badge variant="outline" className="px-1 py-0 text-[9px] h-3">
                                                            YOU
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Enhanced clue display */}
                                                <div className="flex flex-col gap-1 mt-1">
                                                    {playerClues.length > 0 ? (
                                                        <motion.div
                                                            initial={{ scale: 0.9, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        >
                                                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                                {playerClues.length <= 2 ? (
                                                                    // Show individual clues if there are only 1-2
                                                                    playerClues.map((clue, idx) => (
                                                                        <Badge
                                                                            key={`${player.id}-clue-${idx}`}
                                                                            variant="secondary"
                                                                            className={cn(
                                                                                "px-1.5 py-0 text-[10px] h-4 font-semibold truncate max-w-full",
                                                                                isReady ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary-foreground"
                                                                            )}
                                                                        >
                                                                            {clue.text}
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    // Show count if there are more than 2 clues
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={cn(
                                                                            "px-1.5 py-0 text-[10px] h-4 font-semibold",
                                                                            isReady ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary-foreground"
                                                                        )}
                                                                    >
                                                                        {playerClues.length} clue{playerClues.length !== 1 ? 's' : ''}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground">No clues</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Enhanced status indicator */}
                                            <div className="ml-2 flex-shrink-0">
                                                <motion.div
                                                    key={`status-${player.id}-${isReady}-${isCurrentTurn}`}
                                                    initial={{ scale: 0.5, opacity: 0.5 }}
                                                    animate={{
                                                        scale: 1,
                                                        opacity: 1,
                                                        rotate: isReady ? [0, 360] : 0
                                                    }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 30,
                                                        rotate: { duration: 0.6, ease: "easeInOut" }
                                                    }}
                                                    className={cn(
                                                        "rounded-full p-1 shadow-sm",
                                                        isReady
                                                            ? "bg-primary text-primary-foreground"
                                                            : isCurrentTurn
                                                                ? "bg-secondary text-secondary-foreground"
                                                                : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    <StatusIcon className="w-3 h-3" />
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="center" className="text-xs p-2">
                                        <p className="font-medium">{player.name}</p>
                                        <p className="text-muted-foreground">
                                            {playerClues.length} clue{playerClues.length !== 1 ? 's' : ''} •
                                            {isReady ? ' Ready' : isCurrentTurn ? ' Current turn' : ' Waiting'}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}