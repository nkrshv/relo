type Source = { label: string; accent?: boolean };

// Full source set for desktop; a trimmed, representative set for narrow
// screens so ten thin rails don't cramp on a phone.
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
  { label: "Visa and passports" },
  { label: "Climate and prices" },
  { label: "Salaries and taxes" },
  { label: "Advisories and maps" },
];

const NODE_X = 392;
const TOP = 26; // y of the first source
const STEP = 40; // vertical gap between sources
const CARD_W = 196;
const CARD_H = 148;

function layout(count: number) {
  const height = TOP + (count - 1) * STEP + TOP;
  const nodeY = TOP + ((count - 1) * STEP) / 2;
  return { height, nodeY };
}

function sourceY(i: number): number {
  return TOP + i * STEP;
}

function sourcePath(y: number, nodeY: number): string {
  return `M196 ${y} C 292 ${y} 306 ${nodeY} ${NODE_X - 30} ${nodeY}`;
}

/**
 * Assembly-line diagram: input plus live data ride their rails into one engine
 * node, which sparks and pushes a finished plan out. All motion shares a single
 * loop so it reads as cause and effect (arrive, spark, plan checks off), not
 * three unrelated loops. Pure CSS via offset-path, no JS.
 */
function Diagram({
  sources,
  className,
}: {
  sources: Source[];
  className: string;
}) {
  const { height, nodeY } = layout(sources.length);
  const outPath = `M${NODE_X + 30} ${nodeY} L 540 ${nodeY}`;
  const cardTop = nodeY - CARD_H / 2;
  const planRows = [0, 1, 2, 3];
  const barWidths = [134, 100, 118, 88];

  return (
    <svg
      viewBox={`0 0 746 ${height}`}
      role="img"
      aria-label="Your answers and live country data are combined into one personalized relocation plan"
      className={`mx-auto w-full max-w-4xl ${className}`}
    >
      {/* rails */}
      {sources.map((s, i) => (
        <path
          key={s.label}
          d={sourcePath(sourceY(i), nodeY)}
          fill="none"
          stroke="var(--color-stone-200)"
          strokeWidth="1.25"
        />
      ))}
      <path d={outPath} fill="none" stroke="var(--color-stone-200)" strokeWidth="1.25" />

      {/* source chips */}
      {sources.map((s, i) => {
        const y = sourceY(i);
        return (
          <g key={s.label}>
            <rect
              x="10"
              y={y - 14}
              width="186"
              height="28"
              rx="7"
              fill="white"
              stroke="var(--color-stone-200)"
            />
            <circle
              cx="28"
              cy={y}
              r="3"
              fill={s.accent ? "var(--color-amber-500)" : "var(--color-stone-300)"}
            />
            <text x="40" y={y + 3.5} className="fill-stone-600 text-[11px] font-medium">
              {s.label}
            </text>
          </g>
        );
      })}

      {/* travelling dots: staggered wave converging on the node */}
      {sources.map((s, i) => (
        <circle
          key={`dot-${s.label}`}
          r="2.75"
          fill={s.accent ? "var(--color-amber-500)" : "var(--color-stone-400)"}
          className="flow-dot"
          style={{
            offsetPath: `path("${sourcePath(sourceY(i), nodeY)}")`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}

      {/* engine node: ripple fires as the wave lands, then a plan ships out */}
      <circle
        className="node-ripple"
        cx={NODE_X}
        cy={nodeY}
        r="26"
        fill="none"
        stroke="var(--color-amber-400)"
      />
      <circle
        cx={NODE_X}
        cy={nodeY}
        r="26"
        fill="white"
        stroke="var(--color-stone-300)"
        className="pipeline-node"
      />
      <g
        stroke="var(--color-stone-500)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path
          className="node-spark"
          style={{ transformOrigin: `${NODE_X}px ${nodeY}px` }}
          d={`M${NODE_X} ${nodeY - 9} l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z`}
        />
      </g>
      <circle
        r="2.75"
        fill="var(--color-stone-400)"
        className="flow-dot-out"
        style={{ offsetPath: `path("${outPath}")` }}
      />

      {/* plan card: checks draw in one by one as output arrives */}
      <g>
        <rect
          x="540"
          y={cardTop}
          width={CARD_W}
          height={CARD_H}
          rx="10"
          fill="white"
          stroke="var(--color-stone-200)"
        />
        <text
          x="558"
          y={cardTop + 27}
          className="fill-stone-900 text-[12px] font-semibold"
        >
          Your relocation plan
        </text>
        {planRows.map((i) => {
          const rowY = cardTop + 45 + i * 22;
          return (
            <g key={i} className="plan-line" style={{ animationDelay: `${i * 0.16}s` }}>
              <path
                className="plan-check"
                pathLength={1}
                d={`M558 ${rowY} l3.5 3.5 6 -6`}
                fill="none"
                stroke="var(--color-emerald-600)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
              <rect
                x="576"
                y={rowY - 4}
                width={barWidths[i]}
                height="7"
                rx="3.5"
                fill="var(--color-stone-200)"
              />
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
      <Diagram sources={SOURCES} className="hidden sm:block" />
      <Diagram sources={SOURCES_MOBILE} className="sm:hidden" />
    </div>
  );
}
