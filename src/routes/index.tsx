import { createFileRoute, Link } from "@tanstack/react-router";
import { StreakBadge } from "@/components/game/StreakBadge";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sudoku — A calm daily number puzzle" },
      {
        name: "description",
        content:
          "One gentle 6x6 Sudoku with notes, hints, undo and a timer. No ads, no clutter — just a quiet puzzle.",
      },
      { property: "og:title", content: "Sudoku — A calm daily number puzzle" },
      {
        property: "og:description",
        content: "A quiet Sudoku board with pencil marks, hints, undo and a solve timer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="bg-background min-h-screen">
      <header className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-6 md:px-10">
        <span className="display-sm">Sudoku</span>
        <div className="flex items-center gap-3">
          <StreakBadge />
          <Link
            to="/play"
            className="bg-primary text-primary-foreground press focus-ring rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Play now
          </Link>
        </div>
      </header>


      <section className="mx-auto grid max-w-[1400px] items-center gap-8 px-5 pt-4 pb-16 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-10">
        <div className="rise order-2 lg:order-1">
          <p className="text-muted-foreground text-sm font-semibold tracking-[0.18em] uppercase">
            Sudoku · Logic · Focus
          </p>
          <h1 className="display-hero mt-5 max-w-[15ch]">
            Sharpen your mind, one puzzle at a time.
          </h1>
          <p className="body-lead text-muted-foreground mt-6 max-w-[46ch]">
            Enjoy crafted Sudoku puzzles with multiple difficulty levels,
            daily streaks, and seamless progress saving. Whether you're just starting
            out or love a challenge, there's always a fresh puzzle waiting.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/play"
              className="bg-primary text-primary-foreground press focus-ring rounded-full px-7 py-4 text-base font-semibold"
            >
              Start Playing →
            </Link>
          </div>
        </div>


        <div className="mood-surface relative order-1 grid aspect-[5/4] max-h-[70vh] place-items-center overflow-hidden rounded-[2.5rem] p-8 lg:order-2 lg:aspect-[4/5]">
          <MiniGrid />
        </div>
      </section>




      <footer className="text-muted-foreground mx-auto max-w-[1400px] px-5 pb-12 text-sm md:px-10">
        <div className="border-border flex flex-wrap items-center justify-between gap-4 border-t pt-8">
          <span className="text-foreground display-sm">Sudoku</span>
          <p>Made calmly, for curious minds.</p>
        </div>
      </footer>
    </div>
  );
}

const PREVIEW = [
  [1, null, 3, null, 5, 6],
  [null, 5, 6, 1, null, 3],
  [3, null, 5, 6, 1, null],
  [6, 1, null, 3, 4, 5],
  [null, 3, 4, 5, null, 1],
  [5, 6, 1, null, 3, 4],
];

function MiniGrid() {
  return (
    <div
      aria-hidden="true"
      className="slate-board grid aspect-square w-full max-w-[22rem] rounded-[1.5rem] p-2"
      style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "2px" }}
    >
      {PREVIEW.flat().map((v, i) => (
        <span
          key={i}
          className="grid place-items-center rounded-[0.4rem] text-sm font-bold tabular-nums"
          style={{
            backgroundColor: v ? "oklch(0.3 0.016 60)" : "oklch(0.25 0.016 60)",
            color: "oklch(0.93 0.02 90 / 0.9)",
          }}
        >
          {v ?? ""}
        </span>
      ))}
    </div>
  );
}
