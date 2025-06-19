'use client';

import { useEffect, useState } from 'react';

interface TimerProgressBarProps {
  duration: number;
  remaining: number;
}

const TimerProgressBar = ({ duration, remaining }: TimerProgressBarProps) => {
  const [localRemaining, setLocalRemaining] = useState(remaining);

  useEffect(() => {
    setLocalRemaining(remaining);
  }, [remaining]);

  useEffect(() => {
    if (localRemaining <= 0) return;
    const interval = setInterval(() => {
      setLocalRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [localRemaining]);

  const progress = Math.max((localRemaining / duration) * 100, 0);
  const isLow = progress < 50;

  // Smooth color interpolation from green → yellow → orange → red
  const getColor = (progress: number): string => {
    if (progress > 75) return '#22c55e'; // Green
    if (progress > 50) return '#84cc16'; // Lime
    if (progress > 30) return '#eab308'; // Yellow
    if (progress > 15) return '#f97316'; // Orange
    return '#ef4444';                    // Red
  };

  return (
    <div className="fixed top-0 left-0 w-full h-2 sm:h-3 bg-muted z-50 shadow-inner overflow-hidden">
      <div
        className="h-full transition-all duration-1000 ease-linear"
        style={{
          width: `${progress}%`,
          backgroundColor: getColor(progress),
        }}
      />
      <div
        className={`absolute inset-0 flex items-center justify-center font-semibold text-[.5rem] sm:text-xs ease-linear transition-all duration-1000 ${
          isLow ? 'text-foreground' : 'text-primary-foreground'
        }`}
      >
        {localRemaining}s
      </div>
    </div>
  );
};

export default TimerProgressBar;
