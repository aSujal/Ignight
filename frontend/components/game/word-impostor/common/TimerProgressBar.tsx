import React from "react";
import { useTimer } from "../hooks/useTimer";
import { Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        {label && <span className="text-foreground text-xl">{label}</span>}
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4" />
          <span className="text-foreground">{currentTime}s</span>
        </div>
      </div>
      <Progress value={progress * 100}/>
    </div>
  );
}
