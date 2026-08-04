import type { ReactNode } from "react";
import { Eraser, Lightbulb, PenLine, RotateCcw, Undo2 } from "lucide-react";

type Props = {
  size: number;
  /** How many of each digit are still missing — dims exhausted digits. */
  remaining: Record<number, number>;
  locked: boolean;
  busy: boolean;
  notesMode: boolean;
  canUndo: boolean;
  onDigit: (n: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onReset: () => void;
  onHint: () => void;
  onToggleNotes: () => void;
};

function Pill({
  onClick,
  disabled,
  active,
  icon,
  label,
  trailing,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`press focus-ring flex h-11 flex-1 items-center justify-center gap-2 rounded-[1rem] text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "bg-accent text-accent-foreground shadow-soft"
          : "bg-secondary hover:bg-background hover:shadow-soft"
      }`}
    >
      {icon}
      <span>{label}</span>
      {trailing}
    </button>
  );
}

export function SudokuKeypad({
  size,
  remaining,
  locked,
  busy,
  notesMode,
  canUndo,
  onDigit,
  onErase,
  onUndo,
  onReset,
  onHint,
  onToggleNotes,
}: Props) {
  const off = locked || busy;

  return (
    <div className="mx-auto mt-3 w-full max-w-[min(34rem,76vh)]">
      <div className="flex items-stretch gap-2">
        <Pill
          onClick={onHint}
          disabled={busy}
          icon={<Lightbulb className="h-4 w-4" strokeWidth={2.4} />}
          label="Hint"
        />
        <Pill
          onClick={onToggleNotes}
          disabled={off}
          active={notesMode}
          icon={<PenLine className="h-4 w-4" strokeWidth={2.4} />}
          label="Notes"
          trailing={
            <span className="text-[0.7rem] font-bold tracking-wide opacity-60">
              {notesMode ? "ON" : "OFF"}
            </span>
          }
        />
        <Pill
          onClick={onReset}
          disabled={busy}
          icon={<RotateCcw className="h-4 w-4" strokeWidth={2.4} />}
          label="Reset"
        />
      </div>

      <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-6">
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onDigit(n)}
            disabled={off}
            className="press focus-ring bg-secondary hover:bg-background hover:shadow-soft relative grid aspect-[5/4] place-items-center rounded-[0.95rem] text-xl font-bold tabular-nums transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30 sm:text-2xl"
          >
            {n}
            <span className="text-muted-foreground absolute right-1.5 bottom-1 text-[0.6rem] font-bold tabular-nums">
              {remaining[n] ?? 0}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={onErase}
          disabled={off}
          className="press focus-ring bg-secondary hover:bg-background hover:shadow-soft grid aspect-[5/4] place-items-center gap-0.5 rounded-[0.95rem] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Eraser className="h-5 w-5" strokeWidth={2.2} />
          <span className="text-[0.62rem] font-bold tracking-wide uppercase">Erase</span>
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={busy || !canUndo}
          className="press focus-ring bg-secondary hover:bg-background hover:shadow-soft grid aspect-[5/4] place-items-center gap-0.5 rounded-[0.95rem] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Undo2 className="h-5 w-5" strokeWidth={2.2} />
          <span className="text-[0.62rem] font-bold tracking-wide uppercase">Undo</span>
        </button>
      </div>
    </div>
  );
}
