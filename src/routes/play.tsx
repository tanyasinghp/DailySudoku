import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SudokuGame } from "@/components/game/SudokuGame";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play Sudoku — Notes, hints, undo and a timer" },
      {
        name: "description",
        content:
          "Play a calm 6x6 Sudoku board: pencil marks, conflict highlighting, hints, undo, reset and a solve timer.",
      },
      { property: "og:title", content: "Play Sudoku — Notes, hints, undo and a timer" },
      {
        property: "og:description",
        content: "A calm 6x6 Sudoku board with pencil marks, hints, undo and a solve timer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayScreen,
});

function PlayScreen() {
  return (
    <div className="bg-background min-h-screen">
      <div className="rise mx-auto max-w-[46rem] px-4 py-6 md:px-6 md:py-10">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground focus-ring mb-4 inline-flex items-center gap-2 rounded-full text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          Home
        </Link>
        <SudokuGame />
      </div>
    </div>
  );
}
