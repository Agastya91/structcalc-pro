import type { AnalysisResult } from "../types/types";

export function ResultsPanel({ result }: { result: AnalysisResult }) {
  const { reactions, max, safety } = result;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
      <h2 style={{ margin: 0 }}>Results (Active Combination)</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div>
          <h3 style={{ margin: "0 0 6px 0" }}>Reactions</h3>
          <div>R0: {reactions.R0?.toFixed(2) ?? "—"} N</div>
          <div>RL: {reactions.RL?.toFixed(2) ?? "—"} N</div>
          <div>M0: {reactions.M0?.toFixed(2) ?? "—"} N·m</div>
          <div>ML: {reactions.ML?.toFixed(2) ?? "—"} N·m</div>
        </div>

        <div>
          <h3 style={{ margin: "0 0 6px 0" }}>Max</h3>
          <div>Max |V|: {max.V.value.toFixed(2)} N @ x={max.V.x.toFixed(3)} m</div>
          <div>Max |M|: {max.M.value.toFixed(2)} N·m @ x={max.M.x.toFixed(3)} m</div>
          <div>Max σ: {(max.sigma.value / 1e6).toFixed(2)} MPa</div>
          <div>Max |δ|: {(max.deflection.value * 1e3).toFixed(3)} mm</div>
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: safety.ok ? "#eaffea" : "#ffecec" }}>
        <strong>Safety:</strong>{" "}
        FOS(actual) = {safety.fosActual.toFixed(2)}{" "}
        {safety.ok ? "✅ OK" : "❌ FAIL"}
      </div>
    </div>
  );
}
