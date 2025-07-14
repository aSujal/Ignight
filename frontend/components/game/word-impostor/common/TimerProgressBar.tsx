'use client';

import React from 'react';
import { Timer } from 'lucide-react';
import { useSyncedTimer } from '../hooks/useTimer';

interface TimerProgressBarProps {
  duration: number | null;
  phaseStartTime: number | null;
  label?: string;
  className?: string;
}

export function TimerProgressBar({
  phaseStartTime,
  duration,
  label,
  className,
}: TimerProgressBarProps) {
  const { timeRemaining: currentTime, progress } = useSyncedTimer({
    phaseStartTime,
    duration,
  });

  if (currentTime === null || duration === null) {
    return null;
  }

  // Get smooth color based on progress
  const getColor = (progress: number): string => {
    if (progress > 75) return '#22c55e'; // Green
    if (progress > 66) return '#84cc16'; // Lime
    if (progress > 33) return '#eab308'; // Yellow
    if (progress > 20) return '#f97316'; // Orange
    return '#ef4444';                    // Red
  };

  const percent = Math.max(progress * 100, 0);
  const isLow = percent < 50;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        {label && <span className="text-foreground text-xl">{label}</span>}
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4" />
          <span className="text-foreground">{currentTime}s</span>
        </div>
      </div>

      <div className="relative w-full h-3 bg-muted rounded overflow-hidden shadow-inner">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${percent}%`,
            backgroundColor: getColor(percent),
          }}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center font-semibold text-[.65rem] sm:text-xs ease-linear transition-all duration-1000 ${
            isLow ? 'text-foreground' : 'text-primary-foreground'
          }`}
        >
          {currentTime}s
        </div>
      </div>
    </div>
  );
}
