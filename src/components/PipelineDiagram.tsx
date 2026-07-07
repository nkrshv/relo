const SOURCES = [
  { label: "Your answers", y: 26, accent: true },
  { label: "Visa rules and passports", y: 66, accent: false },
  { label: "Official advisories", y: 106, accent: false },
  { label: "Live FX rates", y: 146, accent: false },
  { label: "Climate and air quality", y: 186, accent: false },
  { label: "Prices and taxes", y: 226, accent: false },
  { label: "Salaries from job listings", y: 266, accent: false },
  { label: "Messenger reachability", y: 306, accent: false },
  { label: "Migration statistics", y: 346, accent: false },
  { label: "Local offices and maps", y: 386, accent: false },
];

const NODE = { x: 392, y: 206 };

function sourcePath(y: number): string {
  return `M196 ${y} C 292 ${y} 306 ${NODE.y} ${NODE.x - 30} ${NODE.y}`;
}

const OUT_PATH = `M${NODE.x + 30} ${NODE.y} L 540 ${NODE.y}`;

/**
 * Assembly-line diagram: data sources flow into one engine node,
 * a finished plan comes out. Pure CSS motion (offset-path), no JS.
 */
export default function PipelineDiagram() {
  return (
    <svg
      viewBox="0 0 746 412"
      role="img"
      aria-label="Your answers and live country data are combined into one personalized relocation plan"
      className="mx-auto mt-10 w-full max-w-4xl"
    >
      {/* rails */}
      {SOURCES.map((s) => (
        <path
          key={s.y}
          d={sourcePath(s.y)}
          fill="none"
          stroke="var(--color-stone-200)"
          strokeWidth="1.25"
        />
      ))}
      <path
        d={OUT_PATH}
        fill="none"
        stroke="var(--color-stone-200)"
        strokeWidth="1.25"
      />

      {/* source chips */}
      {SOURCES.map((s) => (
        <g key={s.label}>
          <rect
            x="10"
            y={s.y - 14}
            width="186"
            height="28"
            rx="7"
            fill="white"
            stroke="var(--color-stone-200)"
          />
          <circle
            cx="28"
            cy={s.y}
            r="3"
            fill={s.accent ? "var(--color-amber-500)" : "var(--color-stone-300)"}
          />
          <text
            x="40"
            y={s.y + 3.5}
            className="fill-stone-600 text-[11px] font-medium"
          >
            {s.label}
          </text>
        </g>
      ))}

      {/* travelling dots */}
      {SOURCES.map((s, i) => (
        <circle
          key={`dot-${s.y}`}
          r="2.75"
          fill={s.accent ? "var(--color-amber-500)" : "var(--color-stone-400)"}
          className="flow-dot"
          style={{
            offsetPath: `path("${sourcePath(s.y)}")`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
      <circle
        r="2.75"
        fill="var(--color-stone-400)"
        className="flow-dot flow-dot-out"
        style={{ offsetPath: `path("${OUT_PATH}")` }}
      />

      {/* engine node */}
      <circle
        cx={NODE.x}
        cy={NODE.y}
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
        {/* spark glyph */}
        <path
          d={`M${NODE.x} ${NODE.y - 9} l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z`}
        />
      </g>

      {/* plan card */}
      <g>
        <rect
          x="540"
          y="132"
          width="196"
          height="148"
          rx="10"
          fill="white"
          stroke="var(--color-stone-200)"
        />
        <text x="558" y="159" className="fill-stone-900 text-[12px] font-semibold">
          Your relocation plan
        </text>
        {[0, 1, 2, 3].map((i) => (
          <g key={i} className="plan-line" style={{ animationDelay: `${1.1 + i * 0.6}s` }}>
            <path
              d={`M558 ${177 + i * 22} l3.5 3.5 6 -6`}
              fill="none"
              stroke="var(--color-emerald-600)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="576"
              y={173 + i * 22}
              width={[134, 100, 118, 88][i]}
              height="7"
              rx="3.5"
              fill="var(--color-stone-200)"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
