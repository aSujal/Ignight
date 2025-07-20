'use client';

import React, { useEffect } from 'react';
import { Timer } from 'lucide-react';
import { useSyncedTimer, TimerPhase } from '../hooks/useTimer';
import { cn } from '@/lib/utils';

interface CompactTimerProps {
    duration: number | null;
    phaseStartTime: number | null;
    label?: string;
    className?: string;
    onTimeExpired?: () => void;
    warningThreshold?: number; // seconds, default 30
    urgentThreshold?: number; // seconds, default 10
    countdownThreshold?: number; // seconds, default 5
}

export function CompactTimer({
    phaseStartTime,
    duration,
    label,
    className,
    onTimeExpired,
    warningThreshold = 30,
    urgentThreshold = 10,
    countdownThreshold = 5,
}: CompactTimerProps) {
    const { timeRemaining, progress, phase, isExpired } = useSyncedTimer({
        phaseStartTime,
        duration,
        warningThreshold,
        urgentThreshold,
        countdownThreshold,
        updateInterval: 500, // Update more frequently for smoother animations
    });

    // Handle time expiration
    useEffect(() => {
        if (isExpired && onTimeExpired) {
            onTimeExpired();
        }
    }, [isExpired, onTimeExpired]);

    if (timeRemaining === null || duration === null) {
        return null;
    }

    // Get color based on timer phase
    const getColorByPhase = (phase: TimerPhase): string => {
        switch (phase) {
            case 'normal':
                return '#22c55e'; // Green
            case 'warning':
                return '#eab308'; // Yellow/Warning
            case 'urgent':
            case 'countdown':
            case 'expired':
                return '#ef4444'; // Red/Urgent
            default:
                return '#22c55e'; // Default to green
        }
    };

    const percent = Math.max(progress * 100, 0);
    const color = getColorByPhase(phase);
    const isLow = percent < 50;

    // Determine if pulsing animation should be active
    const isPulsing = phase === 'urgent' || phase === 'countdown';

    // Determine if countdown overlay should be shown
    const showCountdown = phase === 'countdown';

    return (
        <div className={cn('flex flex-col gap-2 relative', className)}>
            <div className="flex justify-between items-center text-sm">
                {label && <span className="text-foreground text-xl">{label}</span>}
                <div className="flex items-center gap-2">
                    <Timer className={cn(
                        'w-4 h-4',
                        isPulsing && 'text-red-500'
                    )} />
                    <span className={cn(
                        'text-foreground font-mono tabular-nums',
                        isPulsing && 'text-red-500 font-bold'
                    )}>
                        {timeRemaining}s
                    </span>
                </div>
            </div>

            <div className="relative w-full h-3 bg-muted rounded overflow-hidden shadow-inner">
                <div
                    className={cn(
                        'h-full transition-all duration-500 ease-linear',
                        { 'animate-pulse': isPulsing }
                    )}
                    style={{
                        width: `${percent}%`,
                        backgroundColor: color,
                    }}
                />
                <div
                    className={cn(
                        'absolute inset-0 flex items-center justify-center font-semibold text-[.65rem] sm:text-xs transition-all duration-500',
                        isLow ? 'text-foreground' : 'text-primary-foreground'
                    )}
                >
                    {timeRemaining}s
                </div>
            </div>

            {/* Countdown overlay */}
            {showCountdown && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-background/80 rounded-full w-16 h-16 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <span className="text-3xl font-bold text-red-500 animate-pulse">{timeRemaining}</span>
                    </div>
                </div>
            )}

            {/* Phase transition notification */}
            {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-background/90 rounded-lg px-4 py-2 animate-in fade-in slide-in-from-bottom duration-300">
                        <span className="text-lg font-medium">Moving to next phase...</span>
                    </div>
                </div>
            )}
        </div>
    );
}