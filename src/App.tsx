import { useMemo, useState } from "react";
import "./index.css";
import { Sidebar } from "./components/Sidebar";
import { ResultsPanel } from "./components/ResultsPanel";
import { Diagrams } from "./components/Diagrams";
import { DEFAULT_INPUT, DEFAULT_LOAD_CASES, DEFAULT_COMBOS } from "./constants/constants";
import type { BeamInput, LoadCase, LoadCombo } from "./types/types";
import { analyzeBeam } from "./services/calculations";
import { buildComboLoads, combineResults } from "./services/calculations";

export default function App() {
  const [input, setInput] = useState<BeamInput>(DEFAULT_INPUT);
  const [loadCases, setLoadCases] = useState<LoadCase[]>(DEFAULT_LOAD_CASES);
  const [activeCaseId, setActiveCaseId] = useState<string>(DEFAULT_LOAD_CASES[0].id);

  const [combos, setCombos] = useState<LoadCombo[]>(DEFAULT_COMBOS);
  const [activeComboId, setActiveComboId] = useState<string>(DEFAULT_COMBOS[0].id);

  const activeCombo = useMemo(
    () => combos.find(c => c.id === activeComboId) ?? combos[0],
    [combos, activeComboId]
  );

  const caseResults = useMemo(() => {
    return loadCases.map(lc => ({
      id: lc.id,
      name: lc.name,
      result: analyzeBeam(input, lc.loads),
    }));
  }, [input, loadCases]);

  const comboResult = useMemo(() => {
    return combineResults(
      caseResults.map(cr => ({ id: cr.id, result: cr.result })),
      activeCombo
    );
  }, [caseResults, activeCombo]);

  const comboLoads = useMemo(() => buildComboLoads(loadCases, activeCombo), [loadCases, activeCombo]);

  const activeLoads = useMemo(
    () => (loadCases.find(lc => lc.id === activeCaseId) ?? loadCases[0]).loads,
    [loadCases, activeCaseId]
  );

  const setActiveLoads = (loads: any[]) => {
    setLoadCases(prev => prev.map(lc => (lc.id === activeCaseId ? { ...lc, loads } : lc)));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        input={input}
        setInput={setInput}
        loadCases={loadCases}
        setLoadCases={setLoadCases}
        activeCaseId={activeCaseId}
        setActiveCaseId={setActiveCaseId}
        combos={combos}
        setCombos={setCombos}
        activeComboId={activeComboId}
        setActiveComboId={setActiveComboId}
        activeLoads={activeLoads}
        setActiveLoads={setActiveLoads}
      />

      <main style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <ResultsPanel result={comboResult} />
        <Diagrams result={comboResult} loads={comboLoads} />
      </main>
    </div>
  );
}
