import { useEffect, useRef, type ReactNode } from "react";
import { Clock, Sparkles } from "lucide-react";
import { CompletionCard } from "./CompletionCard";
import { StreakBadge } from "./StreakBadge";

import { formatClock, useElapsed } from "@/lib/sudoku/useElapsed";
import type { SolveSummary } from "@/lib/sudoku/types";

type Props = {
  name: string;
  skill: string;
  difficulty: string;
  board: ReactNode;
  controls: ReactNode;
  status: string;
  tone?: "calm" | "warn" | "win";
  progress: { done: number; total: number; label: string };
  howTo: string[];
  summary: SolveSummary | null;
  running: boolean;
  onTick: (seconds: number) => void;
  onPlayAgain: () => void;
  /** Difficulty picker + "New puzzle" controls. */
  difficulties?: readonly string[];
  onDifficulty?: (value: string) => void;
  onNewPuzzle?: () => void;
  busy?: boolean;
  /** Changing this restarts the clock (new puzzle). */
  resetKey?: string | number;
  /** Elapsed seconds to resume from when a saved game is restored. */
  initialSeconds?: number;
};

export function GameStage({
  name,
  skill,
  difficulty,
  board,
  controls,
  status,
  tone = "calm",
  progress,
  howTo,
  summary,
  running,
  onTick,
  onPlayAgain,
  difficulties,
  onDifficulty,
  onNewPuzzle,
  busy,
  resetKey,
  initialSeconds = 0,
}: Props) {
  const { seconds, reset: resetClock } = useElapsed(running, initialSeconds);
  const resumeFrom = useRef(initialSeconds);
  resumeFrom.current = initialSeconds;

  useEffect(() => {
    onTick(seconds);
  }, [seconds, onTick]);

  useEffect(() => {
    resetClock(resumeFrom.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="surface-card stage-enter relative overflow-hidden p-5 md:p-8">
      <header className="stage-chrome flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase">
            Today's puzzle
          </p>
          <h1 className="display-lg mt-1.5">{name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge />
          <span className="bg-secondary rounded-full px-4 py-2 text-sm font-semibold">
            {skill} · {difficulty}
          </span>

          <span
            className="bg-secondary stage-chrome flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold tabular-nums"
            style={{ animationDelay: "0.12s" }}
          >
            <Clock className="h-4 w-4" strokeWidth={2.4} />
            {formatClock(seconds)}
          </span>
        </div>
      </header>

      {(difficulties || onNewPuzzle) && (
        <div className="stage-chrome mt-4 flex flex-wrap items-center justify-between gap-2">
          {difficulties && (
            <div className="bg-secondary flex items-center gap-1 rounded-full p-1">
              {difficulties.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDifficulty?.(d)}
                  disabled={busy}
                  aria-pressed={d === difficulty}
                  className={`press focus-ring rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
                    d === difficulty
                      ? "bg-accent text-accent-foreground shadow-soft"
                      : "hover:bg-background"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          {onNewPuzzle && (
            <button
              type="button"
              onClick={onNewPuzzle}
              disabled={busy}
              className="press focus-ring bg-accent text-accent-foreground shadow-soft flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
              New Puzzle
            </button>
          )}
        </div>
      )}

      <div className="stage-board mt-5">{board}</div>

      <div className="mx-auto w-full max-w-[36rem]">
        <div className="stage-controls">{controls}</div>

        <div className="bg-secondary mt-4 rounded-[1.4rem] p-4">
          <div className="flex items-center justify-between gap-3">
            <p
              key={status}
              className="rise text-sm font-medium"
              style={{ color: tone === "warn" ? "var(--berry)" : undefined }}
              aria-live="polite"
            >
              {status}
            </p>
            <span className="text-muted-foreground shrink-0 text-xs font-semibold tabular-nums">
              {progress.done}/{progress.total} {progress.label}
            </span>
          </div>
          <div className="bg-background mt-3 h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${pct}%`, backgroundColor: "var(--mood-figure)" }}
            />
          </div>
        </div>

        <details className="bg-secondary group mt-3 rounded-[1.4rem] px-5 py-4">
          <summary className="focus-ring cursor-pointer list-none text-sm font-semibold">
            How to play
          </summary>
          <ol className="text-muted-foreground mt-3 space-y-1.5 text-sm leading-relaxed">
            {howTo.map((h, i) => (
              <li key={h}>
                <span className="text-foreground font-semibold">{i + 1}.</span> {h}
              </li>
            ))}
          </ol>
        </details>
      </div>

      {summary && (
        <CompletionCard
          gameName={name}
          summary={summary}
          onPlayAgain={() => {
            resetClock(0);
            onPlayAgain();
          }}
        />
      )}
    </section>
  );
}

GameStage.Skeleton = function GameStageSkeleton() {
  return (
    <section className="surface-card p-5 md:p-8">
      <div className="bg-secondary h-9 w-52 animate-pulse rounded-2xl" />
      <div className="bg-secondary mx-auto mt-5 aspect-square w-full max-w-[36rem] animate-pulse rounded-[2.2rem]" />
      <div className="bg-secondary mx-auto mt-4 h-13 w-full max-w-[36rem] animate-pulse rounded-[1.2rem]" />
    </section>
  );
};
