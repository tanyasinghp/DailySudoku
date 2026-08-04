const TINTS = ["var(--sun)", "var(--berry)", "var(--sky)", "var(--leaf)", "var(--lilac)"];

const PIECES = Array.from({ length: 46 }, (_, i) => ({
  left: (i * 37) % 100,
  tint: TINTS[i % TINTS.length]!,
  delay: ((i * 13) % 22) / 10,
  dur: 2.6 + ((i * 7) % 18) / 10,
  drift: (((i * 29) % 200) - 100) * 1.1,
  size: 7 + ((i * 5) % 8),
  round: i % 3 === 0,
}));

export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.7),
            backgroundColor: p.tint,
            borderRadius: p.round ? "999px" : "3px",
            ["--delay" as string]: `${p.delay}s`,
            ["--dur" as string]: `${p.dur}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
