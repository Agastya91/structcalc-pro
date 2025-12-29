import type { AnalysisResult, Load } from "../types/types";

export function FBDVisualizer({ result, loads }: { result: AnalysisResult; loads: Load[] }) {
  const L = result.input.L;
  const w = 800, h = 160, pad = 30;

  const xToSvg = (x: number) => pad + (x / L) * (w - 2 * pad);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Free Body Diagram (scaled)</div>

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {/* beam */}
        <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="black" strokeWidth="4" />

        {/* loads */}
        {loads.map((Ld, i) => {
          if (Ld.kind === "POINT") {
            const x = xToSvg(Ld.x);
            return (
              <g key={i}>
                <line x1={x} y1={h / 2 - 50} x2={x} y2={h / 2} stroke="red" strokeWidth="3" />
                <polygon points={`${x-6},${h/2-10} ${x+6},${h/2-10} ${x},${h/2}`} fill="red" />
              </g>
            );
          }
          return null;
        })}
      </svg>

      <div style={{ fontSize: 12, color: "#555" }}>
        Note: distributed loads aren’t drawn yet (we’ll add next). Point loads shown in red.
      </div>
    </div>
  );
}
