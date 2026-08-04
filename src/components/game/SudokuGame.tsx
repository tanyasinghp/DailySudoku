import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameStage } from "./GameStage";
import { PuzzleLoader, PuzzleLoaderOverlay, useDelayedFlag } from "./PuzzleLoader";
import { SudokuBoard, type UnitGlow } from "./SudokuBoard";
import { SudokuKeypad } from "./SudokuKeypad";
import {
  fetchSolveSummary,
  fetchSudokuHint,
  fetchSudokuPuzzle,
  resetSudoku,
  restoreSudokuGame,
  submitSudokuMove,
  undoSudokuMove,
} from "@/lib/sudoku/service";
import { clearSavedGame, loadSavedGame, saveElapsedSeconds } from "@/lib/sudoku/persistence";
import { DIFFICULTIES, type Difficulty } from "@/lib/sudoku/generator";
import type { SolveSummary, SudokuPuzzle, SudokuState } from "@/lib/sudoku/types";

const EMPTY_GLOW: UnitGlow = { delays: {}, token: 0 };

export function SudokuGame() {
  // Difficulty is seeded from the saved game so a refresh resumes the same board.
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => (loadSavedGame()?.difficulty as Difficulty | undefined) ?? "Medium",
  );
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const bootstrapped = useRef(false);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null);
  const [state, setState] = useState<SudokuState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [hintCell, setHintCell] = useState<number | null>(null);
  const [glow, setGlow] = useState<UnitGlow>(EMPTY_GLOW);
  const [status, setStatus] = useState("Pick a square, then choose a number.");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<SolveSummary | null>(null);
  const glowToken = useRef(0);
  const elapsed = useRef({ seconds: 0 });

  useEffect(() => {
    let alive = true;
    setPuzzle(null);
    setState(null);
    setSelected(null);
    setHintCell(null);
    setNotesMode(false);
    setSummary(null);
    setGlow(EMPTY_GLOW);
    elapsed.current.seconds = 0;
    setStatus("Pick a square, then choose a number.");

    // First mount: resume the last unfinished board instead of generating one.
    if (!bootstrapped.current) {
      bootstrapped.current = true;
      const resumed = restoreSudokuGame();
      if (resumed) {
        setPuzzle(resumed.puzzle);
        setState(resumed.state);
        setResumeSeconds(resumed.seconds);
        elapsed.current.seconds = resumed.seconds;
        setStatus("Picked up where you left off.");
        return () => {
          alive = false;
        };
      }
    }
    setResumeSeconds(0);

    fetchSudokuPuzzle(difficulty).then((p) => {
      if (!alive) return;
      setPuzzle(p);
      setState({
        cells: p.cells,
        conflicts: [],
        confirmed: [],
        solvedRows: [],
        solvedCols: [],
        solvedBoxes: [],
        filled: p.cells.filter((c) => c.value !== null).length,
        total: p.cells.length,
        complete: false,
        canUndo: false,
      });
    });
    return () => {
      alive = false;
    };
  }, [difficulty, puzzleKey]);

  /** Turns the freshly-solved units into a travelling glow. */
  const runUnitGlow = useCallback(
    (next: SudokuState, size: number, boxCols: number, boxRows: number) => {
      const delays: Record<number, number> = {};
      const add = (cell: number, step: number) => {
        delays[cell] = Math.min(delays[cell] ?? 9, step * 0.055);
      };
      next.solvedRows.forEach((r) => Array.from({ length: size }, (_, i) => add(r * size + i, i)));
      next.solvedCols.forEach((c) => Array.from({ length: size }, (_, i) => add(i * size + c, i)));
      next.solvedBoxes.forEach((b) => {
        const boxesPerRow = Math.max(1, Math.round(size / boxCols));
        const r0 = Math.floor(b / boxesPerRow) * boxRows;
        const c0 = (b % boxesPerRow) * boxCols;
        let step = 0;
        for (let r = 0; r < boxRows; r += 1)
          for (let c = 0; c < boxCols; c += 1) add((r0 + r) * size + c0 + c, step++);
      });
      if (Object.keys(delays).length === 0) return;
      glowToken.current += 1;
      setGlow({ delays, token: glowToken.current });
      setTimeout(() => setGlow({ delays: {}, token: glowToken.current }), 1600);
    },
    [],
  );

  const apply = useCallback(
    async (next: SudokuState) => {
      if (!puzzle) return;
      setState(next);
      if (next.message) setStatus(next.message);
      runUnitGlow(next, puzzle.size, puzzle.boxCols, puzzle.boxRows);
      if (next.complete && !summary) {
        clearSavedGame();
        const s = await fetchSolveSummary(puzzle.id, elapsed.current.seconds);
        setSummary(s);
      }
    },
    [puzzle, runUnitGlow, summary],
  );

  const locked = selected === null || (state?.cells[selected]?.given ?? false);

  const play = useCallback(
    async (value: number | null) => {
      if (!puzzle || selected === null || locked || summary) return;
      setBusy(true);
      setHintCell(null);
      const next = await submitSudokuMove(puzzle.id, {
        cell: selected,
        value,
        mode: notesMode && value !== null ? "note" : "value",
      });
      await apply(next);
      setBusy(false);
    },
    [apply, locked, notesMode, puzzle, selected, summary],
  );

  const onSelect = (cell: number) => {
    if (summary) return;
    setSelected(cell);
    setHintCell(null);
    setStatus(
      state?.cells[cell]?.given
        ? "That square is part of the puzzle — it can't be changed."
        : "Pick a number, or jot notes first.",
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!puzzle || summary) return;
      if (e.key >= "1" && e.key <= String(puzzle.size)) void play(Number(e.key));
      if (e.key === "Backspace" || e.key === "Delete") void play(null);
      if (e.key.toLowerCase() === "n") setNotesMode((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play, puzzle, summary]);

  const remaining = useMemo(() => {
    const counts: Record<number, number> = {};
    const size = puzzle?.size ?? 6;
    for (let n = 1; n <= size; n += 1) counts[n] = size;
    state?.cells.forEach((c) => {
      if (c.value) counts[c.value] = (counts[c.value] ?? 0) - 1;
    });
    return counts;
  }, [puzzle, state]);

  const showBusy = useDelayedFlag(busy);

  if (!puzzle || !state)
    return (
      <section className="surface-card stage-enter p-5 md:p-8">
        <PuzzleLoader />
      </section>
    );

  const doUndo = async () => {
    setBusy(true);
    await apply(await undoSudokuMove(puzzle.id));
    setBusy(false);
  };

  const doReset = async () => {
    setBusy(true);
    setSummary(null);
    setSelected(null);
    setHintCell(null);
    setGlow(EMPTY_GLOW);
    await apply(await resetSudoku(puzzle.id));
    setBusy(false);
  };

  const doHint = async () => {
    setBusy(true);
    const h = await fetchSudokuHint(puzzle.id);
    setSelected(h.cell);
    setHintCell(h.cell);
    await apply(h.state);
    setStatus(h.message);
    setTimeout(() => setHintCell(null), 2400);
    setBusy(false);
  };

  const newPuzzle = () => setPuzzleKey((k) => k + 1);

  return (
    <div className="relative">
      <PuzzleLoaderOverlay show={showBusy} />
      <GameStage
        name="Sudoku"
        skill="Pattern recognition"
        difficulty={puzzle.difficulty}
        progress={{ done: state.filled, total: state.total, label: "squares filled" }}
        status={status}
        tone={state.conflicts.length > 0 ? "warn" : "calm"}
        summary={summary}
        onPlayAgain={newPuzzle}
        difficulties={DIFFICULTIES}
        onDifficulty={(d) => setDifficulty(d as Difficulty)}
        onNewPuzzle={newPuzzle}
        busy={busy}
        resetKey={`${difficulty}-${puzzleKey}`}
        initialSeconds={resumeSeconds}
        onTick={(s) => {
          elapsed.current.seconds = s;
          if (!summary) saveElapsedSeconds(s);
        }}
        running={!summary}
        howTo={[
          "Tap a square, then choose a number.",
          `Every row, column and small box holds 1–${puzzle.size} once.`,
          "Use Notes to pencil in ideas before you commit.",
        ]}
        board={
          <SudokuBoard
            size={puzzle.size}
            boxCols={puzzle.boxCols}
            boxRows={puzzle.boxRows}
            cells={state.cells}
            selected={selected}
            conflicts={state.conflicts}
            confirmed={state.confirmed}
            hintCell={hintCell}
            glow={glow}
            onSelect={onSelect}
          />
        }
        controls={
          <SudokuKeypad
            size={puzzle.size}
            remaining={remaining}
            locked={locked}
            busy={busy || !!summary}
            notesMode={notesMode}
            canUndo={state.canUndo}
            onDigit={(n) => void play(n)}
            onErase={() => void play(null)}
            onUndo={() => void doUndo()}
            onReset={() => void doReset()}
            onHint={() => void doHint()}
            onToggleNotes={() => setNotesMode((m) => !m)}
          />
        }
      />
    </div>
  );
}
