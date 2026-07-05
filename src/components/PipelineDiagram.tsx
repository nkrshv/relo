const SOURCES = [
  { label: "Your answers", y: 32, accent: true },
  { label: "Official advisories", y: 78, accent: false },
  { label: "Live FX rates", y: 124, accent: false },
  { label: "Country facts", y: 170, accent: false },
];

const NODE = { x: 356, y: 101 };

function sourcePath(y: number): string {
  return `M172 ${y} C 250 ${y} 268 ${NODE.y} ${NODE.x - 30} ${NODE.y}`;
}

const OUT_PATH = `M${NODE.x + 30} ${NODE.y} L 520 ${NODE.y}`;

/**
 * Assembly-line diagram: data sources flow into one engine node,
 * a finished plan comes out. Pure CSS motion (offset-path), no JS.
 */
export default function PipelineDiagram() {
  return (
    <svg
      viewBox="0 0 720 202"
      role="img"
      aria-label="Your answers and live country data are combined into one personalized relocation plan"
      className="mx-auto mt-10 w-full max-w-2xl"
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
            width="162"
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
            animationDelay: `${i * 0.55}s`,
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
          x="520"
          y="41"
          width="190"
          height="120"
          rx="10"
          fill="white"
          stroke="var(--color-stone-200)"
        />
        <text x="538" y="68" className="fill-stone-900 text-[12px] font-semibold">
          Your relocation plan
        </text>
        {[0, 1, 2].map((i) => (
          <g key={i} className="plan-line" style={{ animationDelay: `${1.1 + i * 0.7}s` }}>
            <path
              d={`M538 ${86 + i * 22} l3.5 3.5 6 -6`}
              fill="none"
              stroke="var(--color-emerald-600)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="556"
              y={82 + i * 22}
              width={[128, 96, 112][i]}
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
