export type BeamType = "SIMPLY_SUPPORTED" | "CANTILEVER" | "FIXED_FIXED";

export type Material = {
  name: string;
  E: number;      // Pa
  yield: number;  // Pa
};

export type Section =
  | { type: "RECT"; b: number; h: number }
  | { type: "CIRCLE"; d: number }
  | { type: "HOLLOW_CIRCLE"; do: number; di: number }
  | { type: "I_BEAM"; h: number; bf: number; tf: number; tw: number };

export type BeamInput = {
  L: number; // m
  beamType: BeamType;
  section: Section;
  material: Material;
  fosTarget: number;
  nElem: number; // discretization points/elems for diagrams/deflection
};

export type PointLoad = { kind: "POINT"; P: number; x: number };              // N at x (down +)
export type UDL = { kind: "UDL"; w: number; x1: number; x2: number };         // N/m on [x1,x2]
export type TriLoad = { kind: "TRI"; w1: number; w2: number; x1: number; x2: number }; // linear ramp

export type Load = PointLoad | UDL | TriLoad;

export type SectionProps = {
  I: number;  // m^4
  c: number;  // m (max distance to outer fiber)
  A: number;  // m^2
};

export type SamplePoint = {
  x: number;
  V: number;     // N
  M: number;     // N*m
  w: number;     // m (deflection)
  sigma: number; // Pa
};

export type AnalysisResult = {
  input: BeamInput;
  sectionProps: SectionProps;
  reactions: Partial<{ R0: number; RL: number; M0: number; ML: number }>;
  samples: SamplePoint[];
  max: {
    V: { value: number; x: number };
    M: { value: number; x: number };
    sigma: { value: number; x: number };
    deflection: { value: number; x: number };
  };
  safety: { fosActual: number; ok: boolean };
};

export type LoadCase = {
  id: string;
  name: string;
  loads: Load[];
};

export type LoadCombo = {
  id: string;
  name: string;
  factors: Record<string, number>; // caseId -> factor
};
