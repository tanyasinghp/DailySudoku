/**
 * Local save-game storage.
 *
 * Keeps the in-progress board (puzzle, solution, player values, pencil marks,
 * fixed cells, history, timer and difficulty) in localStorage so a refresh or
 * browser restart resumes exactly where the player left off. Completed games
 * are dropped so the next visit starts fresh. No network, no accounts.
 */
import type { Difficulty } from "./generator";
import type { SudokuCell } from "./types";

const KEY = "sudoku.game.v1";

export type SavedGame = {
  version: 1;
  difficulty: Difficulty;
  /** Clue values, 0 = empty. */
  givens: number[];
  solution: number[];
  cells: SudokuCell[];
  history: SudokuCell[][];
  /** Wrong values currently sitting on the board. */
  mistakes: number;
  /** Elapsed solve time in seconds. */
  seconds: number;
  complete: boolean;
  savedAt: number;
};

const isCell = (c: unknown): c is SudokuCell => {
  if (!c || typeof c !== "object") return false;
  const cell = c as SudokuCell;
  return (
    (cell.value === null || typeof cell.value === "number") &&
    typeof cell.given === "boolean" &&
    Array.isArray(cell.notes)
  );
};

function isValid(data: unknown): data is SavedGame {
  if (!data || typeof data !== "object") return false;
  const g = data as SavedGame;
  return (
    g.version === 1 &&
    typeof g.difficulty === "string" &&
    Array.isArray(g.givens) &&
    Array.isArray(g.solution) &&
    g.givens.length === g.solution.length &&
    g.givens.length > 0 &&
    Array.isArray(g.cells) &&
    g.cells.length === g.givens.length &&
    g.cells.every(isCell) &&
    Array.isArray(g.history)
  );
}

export function loadSavedGame(): SavedGame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed) || parsed.complete) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGame(game: Omit<SavedGame, "version" | "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    if (game.complete) {
      clearSavedGame();
      return;
    }
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...game, version: 1, savedAt: Date.now() } satisfies SavedGame),
    );
  } catch {
    /* storage full or blocked — the game still plays, it just won't resume. */
  }
}

/** Updates only the timer on the stored game (called once per second). */
export function saveElapsedSeconds(seconds: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed)) return;
    window.localStorage.setItem(KEY, JSON.stringify({ ...parsed, seconds }));
  } catch {
    /* ignore */
  }
}

export function clearSavedGame(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
