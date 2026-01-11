export type BeamType = 'simply-supported' | 'cantilever' | 'fixed-fixed';
export type MaterialKey = 'steel-a36' | 'steel-a572' | 'al-6061' | 'al-7075' | 'titanium' | 'concrete-28' | 'concrete-35' | 'douglas-fir' | 'southern-pine' | 'carbon-fiber';
export type SectionType = 'rectangle' | 'circle' | 'hollow-circle' | 'i-beam';
export type LoadType = 'point' | 'udl' | 'triangular';

export interface Material {
  name: string;
  E: number; // GPa
  yieldStrength: number; // MPa
}

export interface SectionDimensions {
  width?: number;
  height?: number;
  diameter?: number;
  outerDiameter?: number;
  innerDiameter?: number;
  flangeWidth?: number;
  flangeThickness?: number;
  webHeight?: number;
  webThickness?: number;
}

export interface SectionProperties {
  area: number;
  I: number;
  c: number;
}

export interface BeamConfig {
  beamType: BeamType;
  length: number;
  material: MaterialKey;
  sectionType: SectionType;
  sectionDims: SectionDimensions;
  factorOfSafety: number;
  sectionProps: SectionProperties;
}

export interface Load {
  id: string;
  type: LoadType;
  // Point load
  position?: number;
  // UDL / Triangular
  startPosition?: number;
  endPosition?: number;
  // Magnitudes
  magnitude?: number;
  startMagnitude?: number;
  endMagnitude?: number;
}

export interface AnalysisResult {
  reactions?: {
    R1: number;
    R2: number;
    M1: number;
  };
  shearData?: { x: number; V: number }[];
  momentData?: { x: number; M: number }[];
  maxShear?: number;
  maxMoment?: number;
  maxStress?: number;
  maxDeflection?: number;
  actualFOS?: number;
  safetyStatus?: 'safe' | 'warning' | 'failure';
  allowableStress?: number;
  error?: string;
}

export const MATERIALS: Record<MaterialKey, Material> = {
  'steel-a36': { name: 'Steel A36', E: 200, yieldStrength: 250 },
  'steel-a572': { name: 'Steel A572', E: 200, yieldStrength: 345 },
  'al-6061': { name: 'Aluminum 6061', E: 69, yieldStrength: 240 },
  'al-7075': { name: 'Aluminum 7075', E: 71.7, yieldStrength: 503 },
  'titanium': { name: 'Titanium', E: 113.8, yieldStrength: 880 },
  'concrete-28': { name: 'Concrete 28MPa', E: 30, yieldStrength: 28 },
  'concrete-35': { name: 'Concrete 35MPa', E: 32, yieldStrength: 35 },
  'douglas-fir': { name: 'Douglas Fir', E: 13, yieldStrength: 50 },
  'southern-pine': { name: 'Southern Pine', E: 11, yieldStrength: 45 },
  'carbon-fiber': { name: 'Carbon Fiber', E: 150, yieldStrength: 600 }
};