/**
 * useQuizTimer — hooks/useQuizTimer.ts
 *
 * Counts down to a server-set deadline and fires onExpire exactly once at zero.
 * Always derives from deadlineAt (server clock), never from client timeLimitSec,
 * so resume-after-refresh works correctly.
 *
 * @param deadlineAt  ISO 8601 string from the server, or null for untimed quizzes.
 * @param onExpire    Callback fired exactly once when countdown reaches 0.
 * @returns           { remainingSec } — null for untimed quizzes.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

function computeRemaining(deadlineAt: string): number {
  return Math.max(
    0,
    Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000),
  );
}

export function useQuizTimer(
  deadlineAt: string | null,
  onExpire: () => void,
): { remainingSec: number | null } {
  const [remainingSec, setRemainingSec] = useState<number | null>(() => {
    if (!deadlineAt) return null;
    return computeRemaining(deadlineAt);
  });

  // Stable ref so the interval closure always sees the latest callback
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const firedRef = useRef(false);

  useEffect(() => {
    if (!deadlineAt) {
      setRemainingSec(null);
      return;
    }

    // Reset if deadline changes (new attempt)
    firedRef.current = false;
    setRemainingSec(computeRemaining(deadlineAt));

    const interval = setInterval(() => {
      const secs = computeRemaining(deadlineAt);
      setRemainingSec(secs);

      if (secs <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt]);

  return { remainingSec };
}
