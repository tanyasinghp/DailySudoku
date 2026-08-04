/**
 * Local Sudoku generator.
 *
 * Runs entirely in the browser: builds a random complete grid by randomized
 * backtracking, then carves clues away while a uniqueness check guarantees the
 * puzzle still has exactly one solution. Board geometry stays the project's
 * 6x6 / 3x2 regions so nothing in the UI changes.
 */

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];

export const SIZE = 6;
export const BOX_COLS = 3;
export const BOX_ROWS = 2;
const BOXES_PER_ROW = SIZE / BOX_COLS;
const CELLS = SIZE * SIZE;

/** Target number of clues left on the board per difficulty. */
const CLUE_TARGET: Record<Difficulty, number> = {
  Easy: 22,
  Medium: 18,
  Hard: 15,
  Expert: 12,
};

const peersCache: number[][] = [];

function peersOf(idx: number): number[] {
  const cached = peersCache[idx];
  if (cached) return cached;
  const r = Math.floor(idx / SIZE);
  const c = idx % SIZE;
  const r0 = Math.floor(r / BOX_ROWS) * BOX_ROWS;
  const c0 = Math.floor(c / BOX_COLS) * BOX_COLS;
  const set = new Set<number>();
  for (let i = 0; i < SIZE; i += 1) {
    set.add(r * SIZE + i);
    set.add(i * SIZE + c);
  }
  for (let dr = 0; dr < BOX_ROWS; dr += 1)
    for (let dc = 0; dc < BOX_COLS; dc += 1) set.add((r0 + dr) * SIZE + c0 + dc);
  set.delete(idx);
  const list = [...set];
  peersCache[idx] = list;
  return list;
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const fits = (grid: number[], idx: number, value: number) =>
  peersOf(idx).every((p) => grid[p] !== value);

/** Fills an empty grid with a random valid solution. */
function buildSolution(): number[] {
  const grid = new Array<number>(CELLS).fill(0);
  const fill = (idx: number): boolean => {
    if (idx === CELLS) return true;
    for (const v of shuffle(Array.from({ length: SIZE }, (_, i) => i + 1))) {
      if (!fits(grid, idx, v)) continue;
      grid[idx] = v;
      if (fill(idx + 1)) return true;
      grid[idx] = 0;
    }
    grid[idx] = 0;
    return false;
  };
  fill(0);
  return grid;
}

/** Counts solutions, stopping as soon as `limit` is reached. */
function countSolutions(grid: number[], limit = 2): number {
  let found = 0;
  const work = [...grid];

  const solve = (): void => {
    if (found >= limit) return;
    // Pick the empty cell with the fewest candidates (keeps this fast).
    let best = -1;
    let bestCandidates: number[] = [];
    for (let i = 0; i < CELLS; i += 1) {
      if (work[i] !== 0) continue;
      const candidates: number[] = [];
      for (let v = 1; v <= SIZE; v += 1) if (fits(work, i, v)) candidates.push(v);
      if (candidates.length === 0) return;
      if (best === -1 || candidates.length < bestCandidates.length) {
        best = i;
        bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }
    if (best === -1) {
      found += 1;
      return;
    }
    for (const v of bestCandidates) {
      work[best] = v;
      solve();
      work[best] = 0;
      if (found >= limit) return;
    }
  };

  solve();
  return found;
}

export type GeneratedPuzzle = {
  /** Clue values, 0 = empty. */
  puzzle: number[];
  solution: number[];
  difficulty: Difficulty;
  clues: number;
};

/**
 * Generates a puzzle with exactly one solution. Removal is randomized, so
 * repeated calls give different boards.
 */
export function generatePuzzle(difficulty: Difficulty = "Medium"): GeneratedPuzzle {
  const solution = buildSolution();
  const puzzle = [...solution];
  const target = CLUE_TARGET[difficulty];
  let clues = CELLS;

  for (const idx of shuffle(Array.from({ length: CELLS }, (_, i) => i))) {
    if (clues <= target) break;
    const kept = puzzle[idx]!;
    puzzle[idx] = 0;
    if (countSolutions(puzzle) === 1) {
      clues -= 1;
    } else {
      puzzle[idx] = kept;
    }
  }

  return { puzzle, solution, difficulty, clues };
}

/** Signature used to avoid handing back the same board twice in a row. */
export const puzzleSignature = (puzzle: number[]) => puzzle.join("");

/** Generates a puzzle that differs from `avoid` when possible. */
export function generateDistinctPuzzle(
  difficulty: Difficulty,
  avoid?: string,
  attempts = 4,
): GeneratedPuzzle {
  let last = generatePuzzle(difficulty);
  for (let i = 0; i < attempts && avoid && puzzleSignature(last.puzzle) === avoid; i += 1) {
    last = generatePuzzle(difficulty);
  }
  return last;
}
