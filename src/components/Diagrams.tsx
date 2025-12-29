import type { AnalysisResult, Load } from "../types/types";
import { FBDVisualizer } from "./FBDVisualizer";

function Sparkline({ y, title }: { y: number[]; title: string }) {
  const w = 800, h = 180, pad = 12;
  const ymin = Math.min(...y), ymax = Math.max(...y);
  const span = (ymax - ymin) || 1;

  const pts = y.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / (y.length - 1);
    const yy = h - pad - ((v - ymin) * (h - 2 * pad)) / span;
    return `${x.toFixed(2)},${yy.toFixed(2)}`;
  }).join(" ");

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline fill="none" stroke="black" strokeWidth="2" points={pts} />
        <line x1="0" y1={h - pad} x2={w} y2={h - pad} stroke="#bbb" />
      </svg>
      <div style={{ fontSize: 12, color: "#555" }}>min={ymin.toFixed(2)} • max={ymax.toFixed(2)}</div>
    </div>
  );
}

export function Diagrams({ result, loads }: { result: AnalysisResult; loads: Load[] }) {
  const V = result.samples.map(s => s.V);
  const M = result.samples.map(s => s.M);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <FBDVisualizer result={result} loads={loads} />
      <Sparkline title="Shear Force Diagram V(x) [N]" y={V} />
      <Sparkline title="Bending Moment Diagram M(x) [N·m]" y={M} />
    </div>
  );
}
