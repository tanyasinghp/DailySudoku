/**
 * Daily streak tracking — local calendar days, localStorage only.
 * No accounts, no network. Safe to import during SSR (all reads are guarded).
 */

const KEY = "sudoku.streak.v1";

export const MILESTONES = [3, 5, 7, 10, 14, 21, 30, 50, 100];

export type StreakData = {
  /** Current consecutive-day streak. */
  count: number;
  /** Best streak ever reached. */
  best: number;
  /** Local calendar date of the last completed puzzle, YYYY-MM-DD. */
  lastDate: string | null;
};

const EMPTY: StreakData = { count: 0, best: 0, lastDate: null };

/** Local (not UTC) calendar date key. */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const parseKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  // Noon local time keeps DST shifts from moving the day boundary.
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
};

/** Whole days between two local date keys. */
export function daysBetween(from: string, to: string): number {
  const ms = parseKey(to).getTime() - parseKey(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function readStreak(): StreakData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StreakData>;
    return {
      count: Number(parsed.count) || 0,
      best: Number(parsed.best) || 0,
      lastDate: typeof parsed.lastDate === "string" ? parsed.lastDate : null,
    };
  } catch {
    return EMPTY;
  }
}

/** Streak as it stands today: a missed day means the run is already broken. */
export function currentStreak(): StreakData {
  const data = readStreak();
  if (!data.lastDate) return data;
  const gap = daysBetween(data.lastDate, localDateKey());
  if (gap > 1) return { ...data, count: 0 };
  return data;
}

export type StreakResult = StreakData & {
  /** True when this completion is the first one today. */
  extended: boolean;
  /** Set when the new count hits a milestone for the first time today. */
  milestone: number | null;
};

/** Records a completed puzzle for today and returns the updated streak. */
export function recordCompletion(now: Date = new Date()): StreakResult {
  const today = localDateKey(now);
  const data = readStreak();

  if (data.lastDate === today) {
    return { ...data, extended: false, milestone: null };
  }

  const gap = data.lastDate ? daysBetween(data.lastDate, today) : Infinity;
  const count = gap === 1 ? data.count + 1 : 1;
  const next: StreakData = {
    count,
    best: Math.max(count, data.best),
    lastDate: today,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("sudoku-streak-change"));
    } catch {
      /* storage unavailable — streak just won't persist */
    }
  }

  return {
    ...next,
    extended: true,
    milestone: MILESTONES.includes(count) ? count : null,
  };
}
