import type { BeamInput, LoadCase, LoadCombo, Material, Section } from "../types/types";

export const STEEL: Material = {
  name: "Structural Steel",
  E: 200e9,
  yield: 250e6,
};

export const DEFAULT_SECTION: Section = {
  type: "RECT",
  b: 0.05,
  h: 0.10,
};

export const DEFAULT_INPUT: BeamInput = {
  L: 5,
  beamType: "SIMPLY_SUPPORTED",
  section: DEFAULT_SECTION,
  material: STEEL,
  fosTarget: 2.0,
  nElem: 100,
};

export const DEFAULT_LOAD_CASES: LoadCase[] = [
  {
    id: "D",
    name: "Dead Load",
    loads: [{ kind: "UDL", w: 1000, x1: 0, x2: 5 }],
  },
  {
    id: "L",
    name: "Live Load",
    loads: [{ kind: "POINT", P: 2000, x: 2.5 }],
  },
];

export const DEFAULT_COMBOS: LoadCombo[] = [
  {
    id: "C1",
    name: "1.0D + 1.0L",
    factors: { D: 1.0, L: 1.0 },
  },
  {
    id: "C2",
    name: "1.2D + 1.6L",
    factors: { D: 1.2, L: 1.6 },
  },
];
