type Source = { label: string; accent?: boolean };

// Full source set for desktop; a trimmed, representative set for narrow
// screens so ten labels don't crowd the ring on a phone.
const SOURCES: Source[] = [
  { label: "Your answers", accent: true },
  { label: "Visa rules and passports" },
  { label: "Official advisories" },
  { label: "Live FX rates" },
  { label: "Climate and air quality" },
  { label: "Prices and taxes" },
  { label: "Salaries from job listings" },
  { label: "Messenger reachability" },
  { label: "Migration statistics" },
  { label: "Local offices and maps" },
];

const SOURCES_MOBILE: Source[] = [
  { label: "Your answers", accent: true },
  { label: "Visa rules" },
  { label: "Climate" },
  { label: "Prices" },
  { label: "Advisories" },
  { label: "Salaries" },
];

// Representative tasks shown inside the central plan card. These mirror the
// real checklist output (honest, not oversold) so the card reads as a finished
// plan rather than a loading skeleton.
const PLAN_TASKS = [
  "Apply for residence permit",
  "Register your address",
  "Open a bank account",
  "Exchange driver's license",
];

type Config = {
  vbW: number;
  vbH: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  cardW: number;
  cardH: number;
  chipFont: number;
  titleFont: number;
  rowFont: number;
};

const DESKTOP: Config = {
  vbW: 860,
  vbH: 560,
  cx: 430,
  cy: 280,
  rx: 268,
  ry: 208,
  cardW: 240,
  cardH: 176,
  chipFont: 11,
  titleFont: 12.5,
  rowFont: 11.5,
};

const MOBILE: Config = {
  vbW: 560,
  vbH: 560,
  cx: 280,
  cy: 270,
  rx: 210,
  ry: 214,
  cardW: 196,
  cardH: 158,
  chipFont: 12,
  titleFont: 12,
  rowFont: 11,
};

// Deterministic hash + PRNG so the scatter is identical on server and client
// (Math.random() at render time would break hydration).
function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Stable pseudo-random in [-1, 1) from a string key.
function jitter(key: string): number {
  let x = seedFrom(key) || 1;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >> 17;
  x ^= x << 5;
  x >>>= 0;
  return (x >>> 0) / 2147483648 - 1;
}

function chipAngle(i: number, count: number): number {
  // Even spacing around the ring, starting at the top (-90deg).
  return (-90 + (360 / count) * i) * (Math.PI / 180);
}

/**
 * Radial assembly: input plus live data sit around the ring and their dots
 * converge on the central plan card, which pulses and ripples as the wave lands,
 * then the plan's checks draw in one by one. One shared 5.5s loop drives every
 * part so it reads as cause and effect. Pure CSS via offset-path, no JS.
 */
function Diagram({
  sources,
  cfg,
  className,
}: {
  sources: Source[];
  cfg: Config;
  className: string;
}) {
  const { cx, cy, rx, ry, cardW, cardH } = cfg;
  const hw = cardW / 2;
  const hh = cardH / 2;
  const cardX = cx - hw;
  const cardY = cy - hh;

  const count = sources.length;
  const slot = (2 * Math.PI) / count;
  const nodes = sources.map((s, i) => {
    // Scatter each source off the perfect ring: nudge its angle within its own
    // slot and its radius in/out, deterministically per label. The accent
    // ("Your answers") stays near the top and steady so it reads as the input.
    const aScatter = s.accent ? 0 : jitter(s.label) * slot * 0.34;
    const rScatter = s.accent ? 0.04 : jitter(`${s.label}#r`) * 0.16;
    const a = chipAngle(i, count) + aScatter;
    const x = cx + rx * (1 + rScatter) * Math.cos(a);
    const y = cy + ry * (1 + rScatter) * Math.sin(a);
    // Where the rail meets the card: project the chip direction onto the card edge.
    const dx = x - cx;
    const dy = y - cy;
    const t = 1 / Math.max(Math.abs(dx) / (hw + 6), Math.abs(dy) / (hh + 6));
    const ex = cx + dx * t;
    const ey = cy + dy * t;
    // Gentle inward-curving rail.
    const mx = (x + ex) / 2;
    const my = (y + ey) / 2;
    const ctrlx = mx + (cx - mx) * 0.28;
    const ctrly = my + (cy - my) * 0.28;
    const path = `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${ctrlx.toFixed(1)} ${ctrly.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;

    // Label placement: outer side of the dot, away from the card.
    const nearVertical = Math.abs(dx) < rx * 0.25;
    let anchor: "start" | "middle" | "end";
    let tx: number;
    let ty: number;
    if (nearVertical) {
      anchor = "middle";
      tx = x;
      ty = y < cy ? y - 12 : y + 18;
    } else if (x < cx) {
      anchor = "end";
      tx = x - 10;
      ty = y + 4;
    } else {
      anchor = "start";
      tx = x + 10;
      ty = y + 4;
    }
    return { s, x, y, path, anchor, tx, ty };
  });

  return (
    <svg
      viewBox={`0 0 ${cfg.vbW} ${cfg.vbH}`}
      role="img"
      aria-label="Your answers and live country data converge into one personalized relocation plan"
      className={`mx-auto w-full ${className}`}
    >
      {/* rails */}
      {nodes.map(({ s, path }) => (
        <path
          key={`rail-${s.label}`}
          d={path}
          fill="none"
          stroke="var(--color-stone-200)"
          strokeWidth="1.25"
        />
      ))}

      {/* source dots + labels around the ring */}
      {nodes.map(({ s, x, y, anchor, tx, ty }) => (
        <g key={`chip-${s.label}`}>
          <circle
            cx={x}
            cy={y}
            r="3.25"
            fill={s.accent ? "var(--color-amber-500)" : "var(--color-stone-400)"}
          />
          <text
            x={tx}
            y={ty}
            textAnchor={anchor}
            className={s.accent ? "fill-stone-800 font-semibold" : "fill-stone-600 font-medium"}
            style={{ fontSize: `${cfg.chipFont}px` }}
          >
            {s.label}
          </text>
        </g>
      ))}

      {/* travelling dots: staggered wave converging on the card */}
      {nodes.map(({ s, path }, i) => (
        <circle
          key={`dot-${s.label}`}
          r="2.75"
          fill={s.accent ? "var(--color-amber-500)" : "var(--color-stone-400)"}
          className="flow-dot"
          style={{
            offsetPath: `path("${path}")`,
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}

      {/* ripple that fires on the card as the wave lands */}
      <rect
        className="plan-ripple"
        x={cardX - 6}
        y={cardY - 6}
        width={cardW + 12}
        height={cardH + 12}
        rx="14"
        fill="none"
        stroke="var(--color-amber-400)"
      />

      {/* central plan card: checks draw in one by one as output arrives */}
      <g className="plan-card-pulse">
        <rect
          x={cardX}
          y={cardY}
          width={cardW}
          height={cardH}
          rx="12"
          fill="white"
          stroke="var(--color-stone-300)"
        />
        <text
          x={cardX + 18}
          y={cardY + 26}
          className="fill-stone-900 font-semibold"
          style={{ fontSize: `${cfg.titleFont}px` }}
        >
          Your relocation plan
        </text>
        {PLAN_TASKS.map((task, i) => {
          const cY = cardY + 52 + i * 26;
          const box = cfg.rowFont + 2.5;
          const bx = cardX + 18;
          const by = cY - box / 2;
          const check = `M ${(bx + box * 0.26).toFixed(1)} ${(by + box * 0.52).toFixed(1)} L ${(bx + box * 0.44).toFixed(1)} ${(by + box * 0.7).toFixed(1)} L ${(bx + box * 0.76).toFixed(1)} ${(by + box * 0.34).toFixed(1)}`;
          return (
            <g key={task}>
              {/* rounded-square checkbox that fills as it gets checked off,
                  matching the product's toggle */}
              <rect
                className="plan-box"
                x={bx}
                y={by}
                width={box}
                height={box}
                rx="3.5"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
              <path
                className="plan-check"
                pathLength={1}
                d={check}
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
              <text
                x={bx + box + 8}
                y={cY + cfg.rowFont * 0.34}
                className="fill-stone-700"
                style={{ fontSize: `${cfg.rowFont}px` }}
              >
                {task}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default function PipelineDiagram() {
  return (
    <div className="mt-10">
      <Diagram sources={SOURCES} cfg={DESKTOP} className="hidden sm:block" />
      <Diagram sources={SOURCES_MOBILE} cfg={MOBILE} className="sm:hidden" />
    </div>
  );
}
