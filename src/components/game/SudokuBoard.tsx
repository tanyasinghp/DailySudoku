import { memo } from "react";
import type { SudokuCell } from "@/lib/sudoku/types";

export type UnitGlow = {
  /** cell index -> animation delay in seconds, so the glow travels. */
  delays: Record<number, number>;
  /** bumped each time a new glow starts, so React restarts the animation. */
  token: number;
};

type Props = {
  size: number;
  boxCols: number;
  boxRows: number;
  cells: SudokuCell[];
  selected: number | null;
  conflicts: number[];
  confirmed: number[];
  hintCell: number | null;
  glow: UnitGlow;
  onSelect: (cell: number) => void;
};

function SudokuBoardBase({
  size,
  boxCols,
  boxRows,
  cells,
  selected,
  conflicts,
  confirmed,
  hintCell,
  glow,
  onSelect,
}: Props) {
  const rowOf = (i: number) => Math.floor(i / size);
  const colOf = (i: number) => i % size;
  const boxesPerRow = Math.max(1, Math.round(size / boxCols));
  const boxOf = (i: number) =>
    Math.floor(rowOf(i) / boxRows) * boxesPerRow + Math.floor(colOf(i) / boxCols);

  const selRow = selected === null ? -1 : rowOf(selected);
  const selCol = selected === null ? -1 : colOf(selected);
  const selBox = selected === null ? -1 : boxOf(selected);
  const selValue = selected === null ? null : (cells[selected]?.value ?? null);

  return (
    <div
      role="grid"
      aria-label="Sudoku board"
      className="slate-board mx-auto aspect-square w-full max-w-[min(26rem,62vh)] rounded-[1.75rem] p-2 sm:p-3"
    >
      <div
        className="grid h-full w-full overflow-hidden rounded-[1.15rem]"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          backgroundColor: "oklch(0.44 0.015 62 / 0.55)",
          gap: "1px",
          padding: "1px",
        }}
      >
        {cells.map((cell, i) => {
          const r = rowOf(i);
          const c = colOf(i);
          const isSelected = selected === i;
          const isPeer =
            !isSelected &&
            (r === selRow || c === selCol || boxOf(i) === selBox) &&
            selected !== null;
          const sameValue =
            !isSelected && selValue !== null && cell.value !== null && cell.value === selValue;
          const conflicted = conflicts.includes(i);
          const delay = glow.delays[i];

          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-label={`Row ${r + 1} column ${c + 1}${cell.value ? `, ${cell.value}` : ", empty"}${
                cell.given ? ", fixed" : ""
              }`}
              aria-selected={isSelected}
              onClick={() => onSelect(i)}
              className="focus-ring relative grid place-items-center transition-colors duration-200 outline-none"
              style={{
                backgroundColor: isSelected
                  ? "color-mix(in oklab, var(--leaf) 30%, oklch(0.27 0.018 60))"
                  : sameValue
                    ? "color-mix(in oklab, var(--leaf) 13%, oklch(0.27 0.018 60))"
                    : isPeer
                      ? "oklch(0.315 0.016 60)"
                      : "oklch(0.265 0.016 60)",
                marginRight: (c + 1) % boxCols === 0 && c !== size - 1 ? "3px" : undefined,
                marginBottom: (r + 1) % boxRows === 0 && r !== size - 1 ? "3px" : undefined,
              }}
            >
              {/* selection halo */}
              {isSelected && (
                <span
                  className="value-in pointer-events-none absolute inset-[7%] rounded-[0.5rem]"
                  style={{
                    boxShadow: "inset 0 0 0 2px color-mix(in oklab, var(--leaf) 72%, transparent)",
                  }}
                />
              )}

              {/* conflict stripes */}
              {conflicted && (
                <>
                  <span className="conflict-stripes pointer-events-none absolute inset-0 opacity-45" />
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundColor: "color-mix(in oklab, var(--berry) 16%, transparent)",
                    }}
                  />
                </>
              )}

              {/* completed unit glow */}
              {delay !== undefined && (
                <span
                  key={`${glow.token}-${i}`}
                  className="unit-sweep pointer-events-none absolute inset-0"
                  style={{
                    ["--delay" as string]: `${delay}s`,
                    background:
                      "radial-gradient(70% 70% at 50% 50%, color-mix(in oklab, var(--leaf) 55%, transparent) 0%, transparent 100%)",
                  }}
                />
              )}

              {/* correct-placement bloom */}
              {confirmed.includes(i) && (
                <span
                  key={`ok-${i}-${cell.value}`}
                  className="confirm-bloom pointer-events-none absolute inset-[6%] rounded-[0.55rem]"
                  style={{
                    boxShadow: "0 0 0 2px color-mix(in oklab, var(--leaf) 70%, transparent)",
                    background: "color-mix(in oklab, var(--leaf) 22%, transparent)",
                  }}
                />
              )}

              {/* hint pulse */}
              {hintCell === i && (
                <span
                  className="hint-glow pointer-events-none absolute inset-[8%] rounded-[0.5rem]"
                  style={{ backgroundColor: "color-mix(in oklab, var(--sun) 40%, transparent)" }}
                />
              )}

              {cell.value !== null ? (
                <span
                  key={`v-${cell.value}-${cell.given ? "g" : "u"}`}
                  className={`${cell.given ? "" : "value-in"} relative text-[clamp(0.95rem,3.4vw,1.6rem)] leading-none tabular-nums`}
                  style={{
                    fontWeight: cell.given ? 800 : 500,
                    color: conflicted
                      ? "color-mix(in oklab, var(--berry) 78%, white)"
                      : cell.given
                        ? "oklch(0.97 0.008 90)"
                        : "oklch(0.88 0.02 90 / 0.88)",
                  }}
                >
                  {cell.value}
                </span>
              ) : cell.notes.length > 0 ? (
                <span
                  className="relative grid h-full w-full p-[7%]"
                  style={{
                    gridTemplateColumns: `repeat(${boxCols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${Math.ceil(size / boxCols)}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: size }, (_, n) => (
                    <span
                      key={n}
                      className={`grid place-items-center text-[clamp(0.38rem,1.35vw,0.62rem)] leading-none font-semibold ${
                        cell.notes.includes(n + 1) ? "note-in" : ""
                      }`}
                      style={{
                        color: cell.notes.includes(n + 1)
                          ? "oklch(0.8 0.02 90 / 0.72)"
                          : "transparent",
                      }}
                    >
                      {n + 1}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const SudokuBoard = memo(SudokuBoardBase);
