import { useState, useEffect } from 'react';

interface UseSyncedTimerProps {
  phaseStartTime: number | null; // Unix timestamp (ms)
  duration: number | null; // seconds
}

export function useSyncedTimer({ phaseStartTime, duration }: UseSyncedTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!phaseStartTime || !duration) {
      setTimeRemaining(null);
      return;
    }

    const update = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - phaseStartTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);
    };

    update(); // initial run

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [phaseStartTime, duration]);

  const progress =
    duration && timeRemaining !== null ? Math.max(0, timeRemaining / duration) : 0;

  return { timeRemaining, progress };
}
