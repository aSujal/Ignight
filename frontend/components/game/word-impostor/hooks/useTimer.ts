import { useState, useEffect } from 'react';

interface UseSyncedTimerProps {
  phaseStartTime: number | null; // Unix timestamp (ms)
  duration: number | null; // seconds
  updateInterval?: number; // ms, default 1000
  warningThreshold?: number; // seconds, default 30
  urgentThreshold?: number; // seconds, default 10
  countdownThreshold?: number; // seconds, default 5
}

export type TimerPhase = 'normal' | 'warning' | 'urgent' | 'countdown' | 'expired';

interface TimerState {
  timeRemaining: number | null;
  progress: number;
  phase: TimerPhase;
  isExpired: boolean;
}

export function useSyncedTimer({
  phaseStartTime,
  duration,
  updateInterval = 1000,
  warningThreshold = 30,
  urgentThreshold = 10,
  countdownThreshold = 5
}: UseSyncedTimerProps): TimerState {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [phase, setPhase] = useState<TimerPhase>('normal');

  useEffect(() => {
    if (!phaseStartTime || !duration) {
      setTimeRemaining(null);
      setPhase('normal');
      return;
    }

    const update = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - phaseStartTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);

      // Update timer phase based on remaining time
      if (remaining === 0) {
        setPhase('expired');
      } else if (remaining <= countdownThreshold) {
        setPhase('countdown');
      } else if (remaining <= urgentThreshold) {
        setPhase('urgent');
      } else if (remaining <= warningThreshold) {
        setPhase('warning');
      } else {
        setPhase('normal');
      }
    };

    update(); // initial run

    const interval = setInterval(update, updateInterval);
    return () => clearInterval(interval);
  }, [phaseStartTime, duration, updateInterval, warningThreshold, urgentThreshold, countdownThreshold]);

  const progress =
    duration && timeRemaining !== null ? Math.max(0, timeRemaining / duration) : 0;

  return {
    timeRemaining,
    progress,
    phase,
    isExpired: phase === 'expired'
  };
}
