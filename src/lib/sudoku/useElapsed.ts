import { useEffect, useRef, useState } from "react";

/** Wall-clock timer for a puzzle session. */
export function useElapsed(running: boolean, initial = 0) {
  const [seconds, setSeconds] = useState(initial);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    if (startRef.current === null) startRef.current = Date.now() - seconds * 1000;
    const id = setInterval(() => {
      if (startRef.current !== null) {
        setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  /** Restarts the clock, optionally from a resumed elapsed time. */
  const reset = (from = 0) => {
    startRef.current = Date.now() - from * 1000;
    setSeconds(from);
  };

  return { seconds, reset };
}

export function formatClock(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
