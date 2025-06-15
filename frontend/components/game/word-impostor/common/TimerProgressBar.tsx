import React from "react";
import { useTimer } from "../hooks/useTimer";

interface TimerProgressBarProps {
  timeRemaining: number | null;
  duration: number | null;
  label?: string;
  className?: string;
}

export function TimerProgressBar({
  timeRemaining,
  duration,
  label,
  className,
}: TimerProgressBarProps) {
  const { timeRemaining: currentTime, progress } = useTimer({
    initialTimeRemaining: timeRemaining,
    duration,
  });

  if (currentTime === null || duration === null) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        {label && <span className="text-muted-foreground">{label}</span>}
        <span className={`font-mono tabular-nums ${className}`}>
          {formatTime(currentTime)}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
