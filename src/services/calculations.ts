import type {
  AnalysisResult,
  BeamInput,
  Load,
  LoadCase,
  LoadCombo,
  SamplePoint,
  SectionProps,
} from "../types/types";

/**
 * StructCalc Pro — FE-based Euler–Bernoulli beam solver (1D, Hermite cubic).
 * - DOFs per node: [w, theta]
 * - w positive downward
 * - Loads: point (P>0 downward), UDL (w>0 downward), TRI (w1/w2 >0 downward)
 * - Supports:
 *   - Simply supported: w(0)=0, w(L)=0
 *   - Cantilever: w(0)=0, theta(0)=0
 *   - Fixed–fixed: w(0)=0, theta(0)=0, w(L)=0, theta(L)=0
 *
 * Educational / conceptual tool, not for certification.
 */

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

function nearlyEq(a: number, b: number, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

export function sectionPropsFrom(section: BeamInput["section"]): SectionProps {
  if (section.type === "RECT") {
    const b = section.b, h = section.h;
    return { I: (b * Math.pow(h, 3)) / 12, c: h / 2, A: b * h };
  }
  if (section.type === "CIRCLE") {
    const d = section.d;
    return { I: (Math.PI * Math.pow(d, 4)) / 64, c: d / 2, A: (Math.PI * d * d) / 4 };
  }
  if (section.type === "HOLLOW_CIRCLE") {
    const Do = section.do, Di = section.di;
    return { I: (Math.PI * (Math.pow(Do, 4) - Math.pow(Di, 4))) / 64, c: Do / 2, A: (Math.PI * (Do * Do - Di * Di)) / 4 };
  }
  // I-beam (symmetric about mid-height)
  const h = section.h, bf = section.bf, tf = section.tf, tw = section.tw;
  const webH = h - 2 * tf;
  const Iflange = (bf * Math.pow(tf, 3)) / 12;
  const d = (h / 2) - (tf / 2);
  const I = 2 * (Iflange + bf * tf * d * d) + (tw * Math.pow(webH, 3)) / 12;
  const A = 2 * bf * tf + tw * webH;
  return { I, c: h / 2, A };
}

// ---------- Small dense linear algebra (Gaussian elimination) ----------
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Deep copy
  const M = A.map(row => row.slice());
  const x = b.slice();

  for (let k = 0; k < n; k++) {
    // pivot
    let piv = k;
    let best = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(M[i][k]);
      if (v > best) { best = v; piv = i; }
    }
    if (best < 1e-14) throw new Error("Singular matrix in solver (check supports / inputs).");

    if (piv !== k) {
      [M[k], M[piv]] = [M[piv], M[k]];
      [x[k], x[piv]] = [x[piv], x[k]];
    }

    const diag = M[k][k];
    for (let j = k; j < n; j++) M[k][j] /= diag;
    x[k] /= diag;

    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const f = M[i][k];
      if (Math.abs(f) < 1e-14) continue;
      for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
      x[i] -= f * x[k];
    }
  }
  return x;
}

function zeros(n: number) { return Array.from({ length: n }, () => 0); }
function zeros2(n: number) { return Array.from({ length: n }, () => zeros(n)); }

// ---------- Shape functions (Hermite) ----------
function Nvec(s: number, Le: number): [number, number, number, number] {
  // s in [0,1]
  const s2 = s * s;
  const s3 = s2 * s;
  const N1 = 1 - 3 * s2 + 2 * s3;
  const N2 = Le * (s - 2 * s2 + s3);
  const N3 = 3 * s2 - 2 * s3;
  const N4 = Le * (-s2 + s3);
  return [N1, N2, N3, N4];
}

// second derivative d^2N/dx^2 for M = EI w''
function B2vec(s: number, Le: number): [number, number, number, number] {
  // w(x)=N*u, d/dx = (1/Le) d/ds
  // d2/dx2 = (1/Le^2) d2/ds2
  const d2N1 = (-6 + 12 * s) / (Le * Le);
  const d2N2 = (-4 + 6 * s) / Le;
  const d2N3 = (6 - 12 * s) / (Le * Le);
  const d2N4 = (-2 + 6 * s) / Le;
  return [d2N1, d2N2, d2N3, d2N4];
}

// third derivative d^3N/dx^3 for V = EI w'''
function B3vec(_s: number, Le: number): [number, number, number, number] {
  // d3/dx3 = (1/Le^3) d3/ds3; for cubic: constants
  const d3N1 = 12 / (Le * Le * Le);
  const d3N2 = 6 / (Le * Le);
  const d3N3 = -12 / (Le * Le * Le);
  const d3N4 = 6 / (Le * Le);
  return [d3N1, d3N2, d3N3, d3N4];
}

// ---------- Load intensity function q(x) from distributed loads ----------
function qDistributedAt(x: number, loads: Load[]): number {
  let q = 0;
  for (const L of loads) {
    if (L.kind === "UDL") {
      if (x >= Math.min(L.x1, L.x2) && x <= Math.max(L.x1, L.x2)) q += L.w;
    } else if (L.kind === "TRI") {
      const a = Math.min(L.x1, L.x2);
      const b = Math.max(L.x1, L.x2);
      if (x >= a && x <= b) {
        const t = (x - a) / (b - a || 1e-12);
        q += L.w1 + (L.w2 - L.w1) * t;
      }
    }
  }
  return q;
}

// ---------- FE assembly ----------
function beamElementKe(EI: number, Le: number): number[][] {
  const L = Le;
  const L2 = L * L;
  const L3 = L2 * L;
  const c = EI / L3;

  // Standard Euler–Bernoulli beam element stiffness (w,theta at each node)
  return [
    [12 * c, 6 * L * c, -12 * c, 6 * L * c],
    [6 * L * c, 4 * L2 * c, -6 * L * c, 2 * L2 * c],
    [-12 * c, -6 * L * c, 12 * c, -6 * L * c],
    [6 * L * c, 2 * L2 * c, -6 * L * c, 4 * L2 * c],
  ];
}

function assembleGlobal(input: BeamInput, loads: Load[]) {
  const L = input.L;
  const nElem = Math.max(2, Math.floor(input.nElem));
  const nNodes = nElem + 1;
  const dof = 2 * nNodes;
  const xs = Array.from({ length: nNodes }, (_, i) => (L * i) / nElem);

  const { I } = sectionPropsFrom(input.section);
  const EI = input.material.E * I;

  const K = zeros2(dof);
  const F = zeros(dof);

  // Gauss points (4-pt) on [-1,1]
  const gp = [-0.8611363116, -0.3399810436, 0.3399810436, 0.8611363116];
  const gw = [0.3478548451, 0.6521451549, 0.6521451549, 0.3478548451];

  // Assemble stiffness + consistent distributed loads via quadrature
  for (let e = 0; e < nElem; e++) {
    const x1 = xs[e];
    const x2 = xs[e + 1];
    const Le = x2 - x1;

    const ke = beamElementKe(EI, Le);
    const fe = [0, 0, 0, 0];

    // distributed loads: fe += ∫ N^T q(x) dx
    for (let k = 0; k < 4; k++) {
      const xi = gp[k]; // [-1,1]
      const s = (xi + 1) / 2; // [0,1]
      const x = x1 + s * Le;
      const q = qDistributedAt(x, loads);
      if (Math.abs(q) < 1e-14) continue;
      const N = Nvec(s, Le);
      const dx = (Le / 2) * gw[k];
      for (let i = 0; i < 4; i++) fe[i] += N[i] * q * dx;
    }

    // Scatter ke and fe
    const map = [2 * e, 2 * e + 1, 2 * (e + 1), 2 * (e + 1) + 1];
    for (let i = 0; i < 4; i++) {
      F[map[i]] += fe[i];
      for (let j = 0; j < 4; j++) K[map[i]][map[j]] += ke[i][j];
    }
  }

  // Point loads (consistent nodal using shape functions at location)
  for (const Ld of loads) {
    if (Ld.kind !== "POINT") continue;
    const xp = clamp(Ld.x, 0, L);
    // find element
    let e = Math.floor((xp / L) * nElem);
    e = clamp(e, 0, nElem - 1);
    const x1 = xs[e];
    const x2 = xs[e + 1];
    const Le = x2 - x1;
    const s = Le > 0 ? (xp - x1) / Le : 0;
    const N = Nvec(s, Le);
    const map = [2 * e, 2 * e + 1, 2 * (e + 1), 2 * (e + 1) + 1];
    for (let i = 0; i < 4; i++) F[map[i]] += N[i] * Ld.P;
  }

  return { K, F, xs };
}

function constrainedDofs(input: BeamInput, nNodes: number): number[] {
  const last = nNodes - 1;
  if (input.beamType === "SIMPLY_SUPPORTED") return [0, 2 * last]; // w0, wL
  if (input.beamType === "CANTILEVER") return [0, 1];              // w0, th0
  // FIXED_FIXED
  return [0, 1, 2 * last, 2 * last + 1]; // w0, th0, wL, thL
}

function applyConstraintsSolve(K: number[][], F: number[], fixed: number[]) {
  const n = F.length;
  const isFixed = Array.from({ length: n }, () => false);
  fixed.forEach(i => isFixed[i] = true);

  const free: number[] = [];
  for (let i = 0; i < n; i++) if (!isFixed[i]) free.push(i);

  const Kff = free.map(i => free.map(j => K[i][j]));
  const Ff = free.map(i => F[i]);

  const uf = solveLinearSystem(Kff, Ff);
  const u = zeros(n);
  for (let i = 0; i < free.length; i++) u[free[i]] = uf[i];

  // reactions: r = K u - F (at fixed dofs)
  const Ku = zeros(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += K[i][j] * u[j];
    Ku[i] = s;
  }
  const r = Ku.map((v, i) => v - F[i]);

  return { u, r };
}

// ---------- Public API ----------
export function analyzeBeam(input: BeamInput, loads: Load[]): AnalysisResult {
  const sectionProps = sectionPropsFrom(input.section);
  const nElem = Math.max(2, Math.floor(input.nElem));
  const nNodes = nElem + 1;

  const { K, F, xs } = assembleGlobal(input, loads);
  const fixed = constrainedDofs(input, nNodes);
  const { u, r } = applyConstraintsSolve(K, F, fixed);

  // Reactions mapping
  const reactions: AnalysisResult["reactions"] = {};
  const last = nNodes - 1;

  if (input.beamType === "SIMPLY_SUPPORTED") {
    reactions.R0 = r[0];
    reactions.RL = r[2 * last];
  } else if (input.beamType === "CANTILEVER") {
    reactions.R0 = r[0];
    reactions.M0 = r[1];
  } else {
    reactions.R0 = r[0];
    reactions.M0 = r[1];
    reactions.RL = r[2 * last];
    reactions.ML = r[2 * last + 1];
  }

  // Samples for diagrams
  const ns = Math.max(60, nElem * 6);
  const samples: SamplePoint[] = [];
  const { E } = input.material;
  const { I, c } = sectionProps;
  const EI = E * I;

  for (let i = 0; i <= ns; i++) {
    const x = (input.L * i) / ns;

    // locate element
    let e = Math.floor((x / input.L) * nElem);
    e = clamp(e, 0, nElem - 1);
    const x1 = xs[e];
    const x2 = xs[e + 1];
    const Le = x2 - x1;
    const s = Le > 0 ? (x - x1) / Le : 0;

    const map = [2 * e, 2 * e + 1, 2 * (e + 1), 2 * (e + 1) + 1];
    const ue = map.map(idx => u[idx]) as [number, number, number, number];

    const N = Nvec(s, Le);
    const B2 = B2vec(s, Le);
    const B3 = B3vec(s, Le);

    let w = 0, curv = 0, w3 = 0;
    for (let k = 0; k < 4; k++) {
      w += N[k] * ue[k];
      curv += B2[k] * ue[k];
      w3 += B3[k] * ue[k];
    }

    const M = EI * curv; // N*m
    const V = EI * w3;   // N (sign per convention)
    const sigma = Math.abs(M) * c / (I || 1e-18);

    samples.push({ x, V, M, w, sigma });
  }

  // Maxima
  const max = {
    V: { value: -Infinity, x: 0 },
    M: { value: -Infinity, x: 0 },
    sigma: { value: -Infinity, x: 0 },
    deflection: { value: -Infinity, x: 0 },
  };

  for (const s of samples) {
    const aV = Math.abs(s.V);
    const aM = Math.abs(s.M);
    const aS = Math.abs(s.sigma);
    const aW = Math.abs(s.w);

    if (aV > max.V.value) max.V = { value: aV, x: s.x };
    if (aM > max.M.value) max.M = { value: aM, x: s.x };
    if (aS > max.sigma.value) max.sigma = { value: aS, x: s.x };
    if (aW > max.deflection.value) max.deflection = { value: aW, x: s.x };
  }

  const fosActual = input.material.yield / (max.sigma.value || 1e-12);

  return {
    input,
    sectionProps,
    reactions,
    samples,
    max,
    safety: { fosActual, ok: fosActual >= input.fosTarget },
  };
}

// ---------- Load cases + combos (superposition) ----------
export function buildComboLoads(loadCases: LoadCase[], combo: LoadCombo): Load[] {
  const out: Load[] = [];
  for (const lc of loadCases) {
    const f = combo.factors[lc.id] ?? 0;
    if (Math.abs(f) < 1e-12) continue;

    for (const L of lc.loads) {
      if (L.kind === "POINT") out.push({ ...L, P: L.P * f });
      if (L.kind === "UDL") out.push({ ...L, w: L.w * f });
      if (L.kind === "TRI") out.push({ ...L, w1: L.w1 * f, w2: L.w2 * f });
    }
  }
  return out;
}

export function combineResults(
  caseResults: { id: string; result: AnalysisResult }[],
  combo: LoadCombo
): AnalysisResult {
  if (caseResults.length === 0) throw new Error("No load cases to combine.");

  const base = caseResults[0].result;

  const factorOf = (caseId: string) => combo.factors[caseId] ?? 0;

  // Combine samples by superposition (same x-grid assumed)
  const samples = base.samples.map((s, i) => {
    let V = 0, M = 0, w = 0;
    for (const cr of caseResults) {
      const f = factorOf(cr.id);
      const si = cr.result.samples[i];
      if (!nearlyEq(si.x, s.x, 1e-9)) {
        throw new Error("Incompatible x sampling between load cases. Use same nElem/L for all cases.");
      }
      V += f * si.V;
      M += f * si.M;
      w += f * si.w;
    }
    // Recompute sigma from combined M (best practice)
    const I = base.sectionProps.I || 1e-18;
    const c = base.sectionProps.c;
    const sigma = Math.abs(M) * c / I;

    return { x: s.x, V, M, w, sigma };
  });

  // Combine reactions
  const reactions: AnalysisResult["reactions"] = {};
  const keys: (keyof AnalysisResult["reactions"])[] = ["R0", "RL", "M0", "ML"];
  for (const k of keys) {
    let val = 0;
    let any = false;
    for (const cr of caseResults) {
      const f = factorOf(cr.id);
      const rk = cr.result.reactions[k];
      if (rk !== undefined) {
        val += f * rk;
        any = true;
      }
    }
    if (any) reactions[k] = val;
  }

  // Maxima
  const max = {
    V: { value: -Infinity, x: 0 },
    M: { value: -Infinity, x: 0 },
    sigma: { value: -Infinity, x: 0 },
    deflection: { value: -Infinity, x: 0 },
  };

  for (const s of samples) {
    const aV = Math.abs(s.V);
    const aM = Math.abs(s.M);
    const aS = Math.abs(s.sigma);
    const aW = Math.abs(s.w);

    if (aV > max.V.value) max.V = { value: aV, x: s.x };
    if (aM > max.M.value) max.M = { value: aM, x: s.x };
    if (aS > max.sigma.value) max.sigma = { value: aS, x: s.x };
    if (aW > max.deflection.value) max.deflection = { value: aW, x: s.x };
  }

  const fosActual = base.input.material.yield / (max.sigma.value || 1e-12);

  return {
    ...base,
    reactions,
    samples,
    max,
    safety: { fosActual, ok: fosActual >= base.input.fosTarget },
  };
}
