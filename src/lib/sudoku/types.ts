/**
 * Sudoku contracts.
 *
 * These types describe what the puzzle service sends to the client and what
 * the client sends back. The frontend never decides whether a move is
 * correct — it only renders state and forwards user intent.
 */

export type CellIndex = number;

export type SolveSummary = {
  seconds: number;
  streak: number;
  /** Longest streak ever reached. */
  best?: number;
  /** Set when this solve landed on a milestone streak (3, 5, 7, 10...). */
  milestone?: number | null;
  headline: string;
  encouragement: string;
};


export type SudokuCell = {
  /** null = empty. */
  value: number | null;
  /** Preset clue — locked, cannot be edited. */
  given: boolean;
  /** Candidate marks the player jotted down. */
  notes: number[];
};

export type SudokuPuzzle = {
  id: string;
  /** Board is size x size. */
  size: number;
  boxCols: number;
  boxRows: number;
  difficulty: string;
  cells: SudokuCell[];
};

/**
 * Full board state after any action. The service owns every judgement here —
 * the client only renders and animates what it is told.
 */
export type SudokuState = {
  cells: SudokuCell[];
  /** Cells that duplicate a value in their row, column or box. */
  conflicts: CellIndex[];
  /** Cells just confirmed as correctly placed. */
  confirmed: CellIndex[];
  /** Units that became fully correct on this action (indices). */
  solvedRows: number[];
  solvedCols: number[];
  solvedBoxes: number[];
  filled: number;
  total: number;
  complete: boolean;
  canUndo: boolean;
  message?: string;
};

export type SudokuHint = {
  cell: CellIndex;
  value: number;
  message: string;
  state: SudokuState;
};
