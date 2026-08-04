import { useEffect, useState } from "react";
import { currentStreak, type StreakData } from "@/lib/sudoku/streak";

/** Reads the local streak after hydration and keeps it in sync. */
export function useStreak(): StreakData {
  const [data, setData] = useState<StreakData>({ count: 0, best: 0, lastDate: null });

  useEffect(() => {
    // Always recompute from the browser's current local date — never cached.
    const sync = () => setData(currentStreak());
    sync();
    const onVisible = () => document.visibilityState === "visible" && sync();
    // Re-check every minute so a local midnight rollover is picked up live.
    const timer = window.setInterval(sync, 60_000);
    window.addEventListener("sudoku-streak-change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("sudoku-streak-change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return data;
}
