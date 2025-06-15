import { useState, useEffect, useRef } from 'react';

interface UseTimerProps {
  initialTimeRemaining: number | null;
  duration: number | null;
}

export function useTimer({ initialTimeRemaining, duration }: UseTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(initialTimeRemaining);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTimeRemaining(initialTimeRemaining);

    // Start countdown if we have a valid time
    if (initialTimeRemaining !== null && initialTimeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [initialTimeRemaining]);

  const progress = duration && timeRemaining !== null 
    ? Math.max(0, timeRemaining / duration) 
    : 0;

  return { timeRemaining, progress };
}