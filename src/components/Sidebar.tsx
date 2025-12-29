import type { BeamInput, Load, LoadCase, LoadCombo } from "../types/types";

function num(v: string) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function Sidebar(props: {
  input: BeamInput;
  setInput: (v: BeamInput) => void;

  loadCases: LoadCase[];
  setLoadCases: (v: LoadCase[]) => void;
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;

  combos: LoadCombo[];
  setCombos: (v: LoadCombo[]) => void;
  activeComboId: string;
  setActiveComboId: (id: string) => void;

  activeLoads: Load[];
  setActiveLoads: (v: Load[]) => void;
}) {
  const { input, setInput, loadCases, activeCaseId, setActiveCaseId, combos, activeComboId, setActiveComboId, activeLoads, setActiveLoads } = props;

  const addPoint = () => setActiveLoads([...activeLoads, { kind: "POINT", P: 1000, x: input.L / 2 }]);

  return (
    <aside style={{ width: 360, borderRight: "1px solid #ddd", padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>StructCalc Pro</div>
        <div style={{ fontSize: 12, color: "#555" }}>Functional build (cases + combos)</div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Beam</div>

        <label style={{ display: "block", fontSize: 12, color: "#555" }}>Length L (m)</label>
        <input
          style={{ width: "100%", padding: 8, marginTop: 4 }}
          type="number"
          value={input.L}
          onChange={(e) => setInput({ ...input, L: num(e.target.value) })}
        />

        <label style={{ display: "block", fontSize: 12, color: "#555", marginTop: 10 }}>Type</label>
        <select
          style={{ width: "100%", padding: 8, marginTop: 4 }}
          value={input.beamType}
          onChange={(e) => setInput({ ...input, beamType: e.target.value as any })}
        >
          <option value="SIMPLY_SUPPORTED">Simply supported</option>
          <option value="CANTILEVER">Cantilever</option>
          <option value="FIXED_FIXED">Fixed–fixed</option>
        </select>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Active Load Case</div>
        <select
          style={{ width: "100%", padding: 8 }}
          value={activeCaseId}
          onChange={(e) => setActiveCaseId(e.target.value)}
        >
          {loadCases.map(lc => <option key={lc.id} value={lc.id}>{lc.name}</option>)}
        </select>

        <button style={{ marginTop: 10, width: "100%", padding: 10 }} onClick={addPoint}>
          + Add Point Load
        </button>

        <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
          Loads in this case: {activeLoads.length}
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Active Combination</div>
        <select
          style={{ width: "100%", padding: 8 }}
          value={activeComboId}
          onChange={(e) => setActiveComboId(e.target.value)}
        >
          {combos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
          (Next step: editable combo factors + full load editor UI)
        </div>
      </div>
    </aside>
  );
}
