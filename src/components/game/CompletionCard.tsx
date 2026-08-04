import { Link } from "@tanstack/react-router";
import { Confetti } from "./Confetti";
import { formatClock } from "@/lib/sudoku/useElapsed";
import type { SolveSummary } from "@/lib/sudoku/types";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

export function CompletionCard({
  gameName,
  summary,
  onPlayAgain,
}: {
  gameName: string;
  summary: SolveSummary;
  onPlayAgain: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center p-4">
      <div className="veil-in bg-background/70 absolute inset-0 backdrop-blur-md" />
      <Confetti />
      <div
        role="dialog"
        aria-label={`${gameName} complete`}
        className="card-in surface-card relative w-full max-w-md overflow-hidden p-7 text-center md:p-9"
      >
        <div
          className="mx-auto grid h-16 w-16 place-items-center rounded-3xl"
          style={{ backgroundColor: "var(--mood-figure)" }}
        >
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <path
              d="M8 17l5.5 5.5L24 11"
              className="tick-in"
              fill="none"
              stroke="var(--cream)"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="display-lg mt-5">{summary.headline}</h2>
        <p className="text-muted-foreground body-lead mx-auto mt-3 max-w-[32ch]">
          {summary.encouragement}
        </p>

        {summary.milestone ? (
          <p className="bg-accent text-accent-foreground milestone-pop mx-auto mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold">
            <span aria-hidden="true" className="flame-flicker text-base leading-none">
              🔥
            </span>
            {summary.milestone}-day streak — milestone unlocked!
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-secondary rounded-3xl p-4">
            <p className="display-md">{formatClock(summary.seconds)}</p>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Solve time
            </p>
          </div>
          <div className="bg-secondary rounded-3xl p-4">
            <p className="display-md">
              <span aria-hidden="true" className="flame-flicker mr-1">
                🔥
              </span>
              {summary.streak} {summary.streak === 1 ? "day" : "days"}
            </p>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {summary.best && summary.best > summary.streak
                ? `Streak · best ${summary.best}`
                : "Daily streak"}
            </p>
          </div>
        </div>


        <div className="bg-secondary mt-3 rounded-3xl p-4">
          <div className="flex justify-between gap-1.5">
            {WEEK.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`grid aspect-square w-full max-w-9 place-items-center rounded-xl text-[0.7rem] font-bold ${
                    i < summary.streak
                      ? "bg-accent text-accent-foreground cell-pop"
                      : "bg-background text-muted-foreground"
                  }`}
                  style={i < summary.streak ? { animationDelay: `${0.28 + i * 0.06}s` } : undefined}
                >
                  {i < summary.streak ? "✓" : d}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={onPlayAgain}
            className="bg-accent text-accent-foreground press focus-ring flex h-14 items-center justify-center rounded-[1.3rem] text-base font-bold"
          >
            New game
          </button>
          <Link
            to="/"
            className="bg-secondary press focus-ring flex h-12 items-center justify-center rounded-[1.2rem] text-sm font-semibold"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
