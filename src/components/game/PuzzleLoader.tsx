import { useEffect, useMemo, useState } from "react";

const MESSAGES = [
  "🧩 Building your next puzzle...",
  "🎲 Generating a fresh Sudoku...",
  "✨ Setting up your challenge...",
  "🧠 Preparing today's brain workout...",
  "🔢 Finding the perfect puzzle...",
  "🎯 Almost ready...",
  "🚀 Just a moment...",
];

/** Nine tiles, each drifting into place with a number fading through. */
const TILES = Array.from({ length: 9 }, (_, i) => ({
  digit: ((i * 4) % 9) + 1,
  delay: -(((i * 7) % 9) * 0.24),
}));

function useRotatingMessage() {
  const start = useMemo(() => Math.floor(Math.random() * MESSAGES.length), []);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => s + 1), 2200);
    return () => clearInterval(id);
  }, []);
  return MESSAGES[(start + step) % MESSAGES.length]!;
}

export function PuzzleLoaderMark() {
  return (
    <div
      className="grid grid-cols-3 gap-1.5"
      aria-hidden="true"
      style={{ width: "7.5rem", height: "7.5rem" }}
    >
      {TILES.map((t, i) => (
        <span
          key={i}
          className="loader-tile bg-secondary grid place-items-center rounded-xl text-sm font-bold"
          style={{ ["--tile-delay" as string]: `${t.delay}s` }}
        >
          {t.digit}
        </span>
      ))}
    </div>
  );
}

/** Full-panel loading state: animated grid + rotating friendly message. */
export function PuzzleLoader({ className = "" }: { className?: string }) {
  const message = useRotatingMessage();
  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 py-16 ${className}`}
      role="status"
      aria-live="polite"
    >
      <PuzzleLoaderMark />
      <p key={message} className="rise text-muted-foreground text-sm font-semibold">
        {message}
      </p>
    </div>
  );
}

/** Whole-screen version used while routes are still resolving. */
export function ScreenLoader() {
  return (
    <div className="bg-background grid min-h-screen place-items-center px-4">
      <PuzzleLoader />
    </div>
  );
}

/** Soft overlay for short in-place operations (hint, undo, new puzzle). */
export function PuzzleLoaderOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="loader-veil absolute inset-0 z-20 grid place-items-center rounded-[inherit] backdrop-blur-[2px]">
      <PuzzleLoader className="py-0" />
    </div>
  );
}

/** True only once `active` has stayed on for `delay` ms — avoids flicker. */
export function useDelayedFlag(active: boolean, delay = 200) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) {
      setOn(false);
      return;
    }
    const id = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(id);
  }, [active, delay]);
  return on;
}
