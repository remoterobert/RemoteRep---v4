/**
 * Decorative animated background for the auth marketing panel: a network of
 * nodes joined by curved lines, with little dots that trace along each line —
 * evoking RemoteRep "connecting" reps with companies. Pure SVG/SMIL, so it
 * animates with no client JavaScript. Purely decorative (aria-hidden).
 */

// Endpoint nodes, positioned within the 500 × 850 viewBox.
const NODES: [number, number][] = [
  [70, 110],
  [410, 170],
  [150, 380],
  [440, 470],
  [95, 660],
  [360, 770],
];

// Curved connectors between nodes, each with a dot tracing along it.
const LINKS: { d: string; dur: number; begin: number }[] = [
  { d: "M70 110 Q 260 120 410 170", dur: 5.5, begin: 0 },
  { d: "M70 110 Q 55 260 150 380", dur: 6.5, begin: -1.5 },
  { d: "M410 170 Q 480 320 440 470", dur: 5, begin: -3 },
  { d: "M150 380 Q 300 405 440 470", dur: 6, begin: -2 },
  { d: "M150 380 Q 70 525 95 660", dur: 7, begin: -4 },
  { d: "M440 470 Q 430 650 360 770", dur: 5.5, begin: -1 },
  { d: "M95 660 Q 220 750 360 770", dur: 6, begin: -2.5 },
];

export default function ConnectingLines({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 500 850"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="cl-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* connecting lines */}
      {LINKS.map((l, i) => (
        <path
          key={`p${i}`}
          id={`cl-path-${i}`}
          d={l.d}
          stroke="#4a90e2"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
      ))}

      {/* endpoint nodes with a gentle pulse */}
      {NODES.map(([cx, cy], i) => (
        <g key={`n${i}`}>
          <circle cx={cx} cy={cy} r="9" fill="#4a90e2" opacity="0.12" />
          <circle cx={cx} cy={cy} r="3.5" fill="#7ab8ff">
            <animate
              attributeName="opacity"
              values="0.5;1;0.5"
              dur="3s"
              begin={`${-i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* dots tracing along each line */}
      {LINKS.map((l, i) => (
        <circle key={`d${i}`} r="3" fill="#fbdc3b" filter="url(#cl-glow)">
          <animateMotion
            dur={`${l.dur}s`}
            begin={`${l.begin}s`}
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="linear"
          >
            <mpath href={`#cl-path-${i}`} />
          </animateMotion>
        </circle>
      ))}
    </svg>
  );
}
