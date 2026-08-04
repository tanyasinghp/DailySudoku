/**
 * Sudoku service — the single seam between the UI and the game backend.
 *
 * Every function here is async and returns exactly the shape the real API
 * will return. The stand-in data below is intentionally isolated in this one
 * module: swap these bodies for `fetch`/server-function calls and no UI
 * component needs to change. Components must never re-implement any of this.
 */
import type {
  CellIndex,
  SolveSummary,
  SudokuCell,
  SudokuHint,
  SudokuPuzzle,
  SudokuState,
} from "./types";

const latency = <T,>(value: T, ms = 160): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

import { recordCompletion } from "./streak";
import { clearSavedGame, loadSavedGame, saveGame } from "./persistence";



import {
  BOX_COLS as SQ_BOX_COLS,
  BOX_ROWS as SQ_BOX_ROWS,
  SIZE as SQ_SIZE,
  generateDistinctPuzzle,
  puzzleSignature,
  type Difficulty,
} from "./generator";

const SQ_BOXES_PER_ROW = SQ_SIZE / SQ_BOX_COLS;

const rowCells = (r: number) => Array.from({ length: SQ_SIZE }, (_, i) => r * SQ_SIZE + i);
const colCells = (c: number) => Array.from({ length: SQ_SIZE }, (_, i) => i * SQ_SIZE + c);
const boxCells = (b: number) => {
  const r0 = Math.floor(b / SQ_BOXES_PER_ROW) * SQ_BOX_ROWS;
  const c0 = (b % SQ_BOXES_PER_ROW) * SQ_BOX_COLS;
  const out: number[] = [];
  for (let r = 0; r < SQ_BOX_ROWS; r += 1)
    for (let c = 0; c < SQ_BOX_COLS; c += 1) out.push((r0 + r) * SQ_SIZE + c0 + c);
  return out;
};

type SqSession = {
  /** Solution for this session's puzzle. Never sent whole to the client. */
  solution: number[];
  /** Clue values, 0 = empty. */
  givens: number[];
  difficulty: Difficulty;
  cells: SudokuCell[];
  history: SudokuCell[][];
  solvedRows: Set<number>;
  solvedCols: Set<number>;
  solvedBoxes: Set<number>;
};

const sqSessions = new Map<string, SqSession>();
/** Last board handed out per difficulty, so the next one differs. */
const lastSignature = new Map<Difficulty, string>();

const cellsFrom = (givens: number[]): SudokuCell[] =>
  givens.map((v) => ({ value: v === 0 ? null : v, given: v !== 0, notes: [] }));

const cloneCells = (cells: SudokuCell[]) => cells.map((c) => ({ ...c, notes: [...c.notes] }));

function createSession(id: string, difficulty: Difficulty): SqSession {
  const generated = generateDistinctPuzzle(difficulty, lastSignature.get(difficulty));
  lastSignature.set(difficulty, puzzleSignature(generated.puzzle));
  const session: SqSession = {
    solution: generated.solution,
    givens: generated.puzzle,
    difficulty,
    cells: cellsFrom(generated.puzzle),
    history: [],
    solvedRows: new Set(),
    solvedCols: new Set(),
    solvedBoxes: new Set(),
  };
  sqSessions.set(id, session);
  return session;
}

function sqSession(id: string): SqSession {
  return sqSessions.get(id) ?? createSession(id, "Medium");
}

function conflictsFor(cells: SudokuCell[]): number[] {
  const bad = new Set<number>();
  const scan = (group: number[]) => {
    const seen = new Map<number, number[]>();
    group.forEach((idx) => {
      const v = cells[idx]?.value;
      if (!v) return;
      seen.set(v, [...(seen.get(v) ?? []), idx]);
    });
    seen.forEach((list) => list.length > 1 && list.forEach((i) => bad.add(i)));
  };
  for (let i = 0; i < SQ_SIZE; i += 1) {
    scan(rowCells(i));
    scan(colCells(i));
    scan(boxCells(i));
  }
  return [...bad];
}

const unitSolved = (session: SqSession, group: number[]) =>
  group.every((i) => session.cells[i]!.value === session.solution[i]);

/** Marks every already-correct unit as seen so a resumed game doesn't re-glow. */
function seedSolvedUnits(session: SqSession) {
  session.solvedRows.clear();
  session.solvedCols.clear();
  session.solvedBoxes.clear();
  for (let i = 0; i < SQ_SIZE; i += 1) {
    if (unitSolved(session, rowCells(i))) session.solvedRows.add(i);
    if (unitSolved(session, colCells(i))) session.solvedCols.add(i);
    if (unitSolved(session, boxCells(i))) session.solvedBoxes.add(i);
  }
}

const mistakesIn = (session: SqSession) =>
  session.cells.filter((c, i) => !c.given && c.value !== null && c.value !== session.solution[i])
    .length;

/** Mirrors the live session into localStorage so a refresh can resume it. */
function persist(session: SqSession, complete: boolean, seconds?: number) {
  saveGame({
    difficulty: session.difficulty,
    givens: session.givens,
    solution: session.solution,
    cells: cloneCells(session.cells),
    history: session.history.map(cloneCells),
    mistakes: mistakesIn(session),
    seconds: seconds ?? loadSavedGame()?.seconds ?? 0,
    complete,
  });
}


function snapshot(session: SqSession, message: string, confirmed: number[]): SudokuState {
  const { cells } = session;
  const newRows: number[] = [];
  const newCols: number[] = [];
  const newBoxes: number[] = [];

  for (let i = 0; i < SQ_SIZE; i += 1) {
    const r = unitSolved(session, rowCells(i));
    if (r && !session.solvedRows.has(i)) newRows.push(i);
    r ? session.solvedRows.add(i) : session.solvedRows.delete(i);

    const c = unitSolved(session, colCells(i));
    if (c && !session.solvedCols.has(i)) newCols.push(i);
    c ? session.solvedCols.add(i) : session.solvedCols.delete(i);

    const b = unitSolved(session, boxCells(i));
    if (b && !session.solvedBoxes.has(i)) newBoxes.push(i);
    b ? session.solvedBoxes.add(i) : session.solvedBoxes.delete(i);
  }

  const filled = cells.filter((c) => c.value !== null).length;
  const complete = cells.every((c, i) => c.value === session.solution[i]);

  persist(session, complete);

  return {
    cells: cloneCells(cells),
    conflicts: conflictsFor(cells),
    confirmed,
    solvedRows: newRows,
    solvedCols: newCols,
    solvedBoxes: newBoxes,
    filled,
    total: SQ_SIZE * SQ_SIZE,
    complete,
    canUndo: session.history.length > 0,
    message: complete ? "Every number in its right place." : message,
  };
}

const SESSION_ID = "sudoku-daily";

const describe = (session: SqSession): SudokuPuzzle => ({
  id: SESSION_ID,
  size: SQ_SIZE,
  boxCols: SQ_BOX_COLS,
  boxRows: SQ_BOX_ROWS,
  difficulty: session.difficulty,
  cells: cloneCells(session.cells),
});

/** Generates a brand-new puzzle for the given difficulty. */
export async function fetchSudokuPuzzle(difficulty: Difficulty = "Medium"): Promise<SudokuPuzzle> {
  clearSavedGame();
  const session = createSession(SESSION_ID, difficulty);
  persist(session, false, 0);
  return latency(describe(session));
}

export type RestoredGame = {
  puzzle: SudokuPuzzle;
  state: SudokuState;
  seconds: number;
  difficulty: Difficulty;
};

/**
 * Rebuilds the last unfinished game from localStorage. Returns null when there
 * is nothing to resume (or the stored game was already solved).
 */
export function restoreSudokuGame(): RestoredGame | null {
  const saved = loadSavedGame();
  if (!saved) return null;
  const session: SqSession = {
    solution: saved.solution,
    givens: saved.givens,
    difficulty: saved.difficulty,
    cells: saved.cells.map((c) => ({ ...c, notes: [...c.notes] })),
    history: saved.history.map(cloneCells),
    solvedRows: new Set(),
    solvedCols: new Set(),
    solvedBoxes: new Set(),
  };
  seedSolvedUnits(session);
  sqSessions.set(SESSION_ID, session);
  lastSignature.set(saved.difficulty, puzzleSignature(saved.givens));
  return {
    puzzle: describe(session),
    state: snapshot(session, "Picked up where you left off.", []),
    seconds: saved.seconds,
    difficulty: saved.difficulty,
  };
}




export async function submitSudokuMove(
  puzzleId: string,
  move: { cell: CellIndex; value: number | null; mode: "value" | "note" },
): Promise<SudokuState> {
  const session = sqSession(puzzleId);
  const target = session.cells[move.cell];
  if (!target || target.given) {
    return latency(snapshot(session, "That number is part of the puzzle — it stays put.", []), 80);
  }

  session.history.push(cloneCells(session.cells));

  let message = "Keep going.";
  const confirmed: number[] = [];

  if (move.mode === "note") {
    if (move.value === null) {
      target.notes = [];
      message = "Notes cleared.";
    } else {
      target.notes = target.notes.includes(move.value)
        ? target.notes.filter((n) => n !== move.value)
        : [...target.notes, move.value].sort((a, b) => a - b);
      message = "Noted — nothing committed yet.";
    }
  } else if (move.value === null) {
    target.value = null;
    message = "Cleared.";
  } else {
    target.value = move.value;
    target.notes = [];
    if (session.solution[move.cell] === move.value) {
      confirmed.push(move.cell);
      message = "That one fits.";
    } else {
      message = "That number clashes with another. Take another look.";
    }
  }

  return latency(snapshot(session, message, confirmed), 110);
}

export async function undoSudokuMove(puzzleId: string): Promise<SudokuState> {
  const session = sqSession(puzzleId);
  const prev = session.history.pop();
  if (prev) session.cells = prev;
  return latency(snapshot(session, prev ? "Stepped back one move." : "Nothing to undo.", []), 80);
}

/** Clears the player's work but keeps the same puzzle. */
export async function resetSudoku(puzzleId: string): Promise<SudokuState> {
  const session = sqSession(puzzleId);
  session.cells = cellsFrom(session.givens);
  session.history = [];
  session.solvedRows.clear();
  session.solvedCols.clear();
  session.solvedBoxes.clear();
  return latency(snapshot(session, "Fresh board. Take your time.", []), 80);
}


export async function fetchSudokuHint(puzzleId: string): Promise<SudokuHint> {
  const session = sqSession(puzzleId);
  const wrongFirst = session.cells.findIndex(
    (c, i) => !c.given && c.value !== null && c.value !== session.solution[i],
  );
  const emptyFirst = session.cells.findIndex((c) => !c.given && c.value === null);
  const cell = wrongFirst > -1 ? wrongFirst : emptyFirst;
  if (cell < 0) {
    return latency({
      cell: 0,
      value: session.solution[0]!,
      message: "The board is already full — check it over.",
      state: snapshot(session, "The board is already full.", []),
    });
  }
  session.history.push(cloneCells(session.cells));
  const value = session.solution[cell]!;
  session.cells[cell]!.value = value;
  session.cells[cell]!.notes = [];
  return latency({
    cell,
    value,
    message: "Here's one square, filled in for you.",
    state: snapshot(session, "Here's one square, filled in for you.", [cell]),
  });
}

export async function fetchSolveSummary(
  _puzzleId: string,
  seconds: number,
): Promise<SolveSummary> {
  const streak = recordCompletion();
  return latency({
    seconds,
    streak: streak.count,
    best: streak.best,
    milestone: streak.milestone,
    headline: "You thought it all the way through",
    encouragement:
      "You kept trying different routes instead of guessing. That's exactly how good thinking works.",
  });
}

