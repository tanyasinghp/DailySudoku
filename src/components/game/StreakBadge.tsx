import { useStreak } from "@/lib/sudoku/useStreak";

/**
 * Shows the player's current daily streak. Renders nothing until a streak
 * exists, so a first-time visitor sees a clean screen.
 */
export function StreakBadge({ className = "" }: { className?: string }) {
  const { count, best } = useStreak();
  if (count < 1) return null;

  return (
    <span
      className={`bg-secondary flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold tabular-nums ${className}`}
      title={best > count ? `Best streak: ${best} days` : undefined}
      aria-label={`Current streak: ${count} ${count === 1 ? "day" : "days"}`}
    >
      <span aria-hidden="true" className="flame-flicker text-base leading-none">
        🔥
      </span>
      {count}-Day Streak
    </span>
  );
}
