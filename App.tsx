import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';
import { Select } from './components/ui/Select';
import { UnitInput } from './components/ui/UnitInput';
import { Tooltip } from './components/ui/Tooltip';
import { Plus, Trash2, Info, Calculator, Ruler, PenTool, BarChart3, AlertCircle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { BeamConfig, Load, AnalysisResult, MATERIALS, SectionType, BeamType, MaterialKey } from './types';
import { calcSection, analyzeBeam } from './utils/calculations';
import { UnitSystem, getUnit, toDisplay } from './utils/units';
import BeamVisualizer from './components/BeamVisualizer';
import Diagram from './components/Diagram';

export default function App() {
  const [activeTab, setActiveTab] = useState<'beam' | 'section' | 'loads'>('beam');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('SI');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [cfg, setCfg] = useState<BeamConfig>({
    beamType: 'simply-supported',
    length: 6,
    material: 'steel-a36',
    sectionType: 'rectangle',
    sectionDims: { width: 0.2, height: 0.4 },
    factorOfSafety: 2,
    sectionProps: { area: 0, I: 0, c: 0 }
  });
  
  const [loads, setLoads] = useState<Load[]>([
    { id: '1', type: 'point', position: 3, magnitude: 10 }
  ]);
  
  const [res, setRes] = useState<AnalysisResult | null>(null);

  // Auto-calculate section properties when dims change
  useEffect(() => {
    setCfg(p => ({ ...p, sectionProps: calcSection(p.sectionType, p.sectionDims) }));
  }, [cfg.sectionType, cfg.sectionDims]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (cfg.length <= 0) {
      newErrors.length = "Length must be greater than 0";
      isValid = false;
    }

    if (cfg.factorOfSafety <= 0) {
      newErrors.fos = "Factor of Safety must be > 0";
      isValid = false;
    }

    // Section Validations
    const d = cfg.sectionDims;
    if (cfg.sectionType === 'rectangle') {
       if ((d.width || 0) <= 0) { newErrors.width = "Width must be > 0"; isValid = false; }
       if ((d.height || 0) <= 0) { newErrors.height = "Height must be > 0"; isValid = false; }
    } else if (cfg.sectionType === 'circle') {
       if ((d.diameter || 0) <= 0) { newErrors.diameter = "Diameter must be > 0"; isValid = false; }
    } else if (cfg.sectionType === 'hollow-circle') {
       if ((d.outerDiameter || 0) <= 0) { newErrors.outerDiameter = "Outer Dia must be > 0"; isValid = false; }
       if ((d.innerDiameter || 0) <= 0) { newErrors.innerDiameter = "Inner Dia must be > 0"; isValid = false; }
       if ((d.innerDiameter || 0) >= (d.outerDiameter || 0)) { newErrors.innerDiameter = "Must be < Outer Dia"; isValid = false; }
    } else if (cfg.sectionType === 'i-beam') {
       if ((d.flangeWidth || 0) <= 0) { newErrors.flangeWidth = "Flange Width > 0"; isValid = false; }
       if ((d.flangeThickness || 0) <= 0) { newErrors.flangeThickness = "Flange Thick > 0"; isValid = false; }
       if ((d.webHeight || 0) <= 0) { newErrors.webHeight = "Web Height > 0"; isValid = false; }
       if ((d.webThickness || 0) <= 0) { newErrors.webThickness = "Web Thick > 0"; isValid = false; }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRunAnalysis = () => {
    if (!validate()) {
      setRes({ error: "Please resolve configuration errors." });
      return;
    }
    const result = analyzeBeam(cfg, loads);
    setRes(result);
  };

  const addLoad = () => {
    const newLoad: Load = { 
      id: Math.random().toString(36).substr(2, 9), 
      type: 'point', 
      position: cfg.length / 2, 
      magnitude: 10,
      startPosition: 0,
      endPosition: cfg.length / 2,
      startMagnitude: 5,
      endMagnitude: 5
    };
    setLoads([...loads, newLoad]);
  };

  const updateLoad = (id: string, updates: Partial<Load>) => {
    setLoads(loads.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLoad = (id: string) => {
    setLoads(loads.filter(l => l.id !== id));
  };

  const clearError = (key: string) => {
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const u = (type: any) => getUnit(type, unitSystem);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Calculator size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">StructCalc Pro</h1>
              <p className="text-xs text-slate-500 font-medium">Professional Beam Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setUnitSystem('SI')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${unitSystem === 'SI' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  SI
                </button>
                <button 
                  onClick={() => setUnitSystem('Imperial')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${unitSystem === 'Imperial' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Imperial
                </button>
             </div>
             <Button onClick={handleRunAnalysis} size="default" className="bg-blue-600 hover:bg-blue-700">
               Run Analysis
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2"><PenTool size={18} /> Configuration</CardTitle>
            </CardHeader>
            <div className="p-1 bg-slate-100 m-4 rounded-lg flex">
               {(['beam', 'section', 'loads'] as const).map(tab => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                 >
                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
                 </button>
               ))}
            </div>

            <CardContent className="pt-2">
              {activeTab === 'beam' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div>
                    <Label>Beam Type</Label>
                    <Select 
                      value={cfg.beamType} 
                      onChange={(e: any) => setCfg({...cfg, beamType: e.target.value as BeamType})}
                      options={[
                        { value: 'simply-supported', label: 'Simply Supported' },
                        { value: 'cantilever', label: 'Cantilever' },
                        { value: 'fixed-fixed', label: 'Fixed-Fixed' }
                      ]}
                    />
                  </div>
                  <div>
                    <Label className={errors.length ? "text-red-500" : ""}>Length ({u('length')})</Label>
                    <UnitInput 
                      value={cfg.length} 
                      onChange={(v) => { setCfg({...cfg, length: v}); clearError('length'); }} 
                      unitSystem={unitSystem}
                      unitType="length"
                      className={errors.length ? "border-red-500 bg-red-50" : ""}
                    />
                    {errors.length && <p className="text-xs text-red-500 mt-1">{errors.length}</p>}
                  </div>
                  <div>
                    <Label>Material</Label>
                    <Select 
                      value={cfg.material} 
                      onChange={(e: any) => setCfg({...cfg, material: e.target.value as MaterialKey})}
                      options={Object.keys(MATERIALS).map(k => ({ value: k, label: MATERIALS[k as MaterialKey].name }))}
                    />
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 grid grid-cols-2 gap-2">
                      <Tooltip content="Young's Modulus: Measures stiffness. High E = Less deflection." className="cursor-help">
                        <span className="flex items-center gap-1 border-b border-dotted border-slate-300">
                          E: {toDisplay(MATERIALS[cfg.material].E, 'modulus', unitSystem).toFixed(0)} {u('modulus')}
                        </span>
                      </Tooltip>
                      <Tooltip content="Yield Strength: Stress limit before permanent deformation." className="cursor-help">
                        <span className="flex items-center gap-1 border-b border-dotted border-slate-300">
                          Yield: {toDisplay(MATERIALS[cfg.material].yieldStrength, 'stress', unitSystem).toFixed(0)} {u('stress')}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label className={errors.fos ? "text-red-500" : ""}>Factor of Safety</Label>
                      <Tooltip content="Design margin. Actual capacity / Required capacity. Typical values: 1.5 - 3.0.">
                        <HelpCircle size={14} className="text-slate-400 hover:text-blue-500 transition-colors" />
                      </Tooltip>
                    </div>
                    <Input
                      type="number"
                      step="0.1"
                      value={cfg.factorOfSafety}
                      onChange={(e) => { setCfg({...cfg, factorOfSafety: parseFloat(e.target.value)}); clearError('fos'); }}
                      className={errors.fos ? "border-red-500 bg-red-50" : ""}
                    />
                    {errors.fos && <p className="text-xs text-red-500 mt-1">{errors.fos}</p>}
                  </div>
                </div>
              )}

              {activeTab === 'section' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div>
                    <Label>Section Shape</Label>
                    <Select 
                      value={cfg.sectionType} 
                      onChange={(e: any) => { setCfg({...cfg, sectionType: e.target.value as SectionType}); setErrors({}); }}
                      options={[
                        { value: 'rectangle', label: 'Rectangle' },
                        { value: 'circle', label: 'Circle' },
                        { value: 'hollow-circle', label: 'Hollow Circle' },
                        { value: 'i-beam', label: 'I-Beam' }
                      ]}
                    />
                  </div>
                  
                  {/* Dynamic Inputs based on Shape */}
                  {cfg.sectionType === 'rectangle' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className={errors.width ? "text-red-500" : ""}>Width ({u('section')})</Label>
                        <UnitInput 
                          value={cfg.sectionDims.width} 
                          onChange={(v) => { setCfg({...cfg, sectionDims: {...cfg.sectionDims, width: v}}); clearError('width'); }} 
                          unitSystem={unitSystem} 
                          unitType="section" 
                          className={errors.width ? "border-red-500 bg-red-50" : ""}
                        />
                        {errors.width && <p className="text-xs text-red-500 mt-1">{errors.width}</p>}
                      </div>
                      <div>
                        <Label className={errors.height ? "text-red-500" : ""}>Height ({u('section')})</Label>
                        <UnitInput 
                          value={cfg.sectionDims.height} 
                          onChange={(v) => { setCfg({...cfg, sectionDims: {...cfg.sectionDims, height: v}}); clearError('height'); }} 
                          unitSystem={unitSystem} 
                          unitType="section" 
                          className={errors.height ? "border-red-500 bg-red-50" : ""}
                        />
                         {errors.height && <p className="text-xs text-red-500 mt-1">{errors.height}</p>}
                      </div>
                    </div>
                  )}
                  {cfg.sectionType === 'circle' && (
                     <div>
                       <Label className={errors.diameter ? "text-red-500" : ""}>Diameter ({u('section')})</Label>
                       <UnitInput 
                         value={cfg.sectionDims.diameter} 
                         onChange={(v) => { setCfg({...cfg, sectionDims: {diameter: v}}); clearError('diameter'); }} 
                         unitSystem={unitSystem} 
                         unitType="section" 
                         className={errors.diameter ? "border-red-500 bg-red-50" : ""}
                        />
                        {errors.diameter && <p className="text-xs text-red-500 mt-1">{errors.diameter}</p>}
                     </div>
                  )}
                  {cfg.sectionType === 'hollow-circle' && (
                    <div className="space-y-3">
                        <div>
                           <Label className={errors.outerDiameter ? "text-red-500" : ""}>Outer Diameter ({u('section')})</Label>
                           <UnitInput value={cfg.sectionDims.outerDiameter} onChange={(v) => { setCfg({...cfg, sectionDims: {...cfg.sectionDims, outerDiameter: v}}); clearError('outerDiameter'); clearError('innerDiameter'); }} unitSystem={unitSystem} unitType="section" className={errors.outerDiameter ? "border-red-500 bg-red-50" : ""} />
                           {errors.outerDiameter && <p className="text-xs text-red-500 mt-1">{errors.outerDiameter}</p>}
                        </div>
                        <div>
                           <Label className={errors.innerDiameter ? "text-red-500" : ""}>Inner Diameter ({u('section')})</Label>
                           <UnitInput value={cfg.sectionDims.innerDiameter} onChange={(v) => { setCfg({...cfg, sectionDims: {...cfg.sectionDims, innerDiameter: v}}); clearError('innerDiameter'); }} unitSystem={unitSystem} unitType="section" className={errors.innerDiameter ? "border-red-500 bg-red-50" : ""} />
                           {errors.innerDiameter && <p className="text-xs text-red-500 mt-1">{errors.innerDiameter}</p>}
                        </div>
                    </div>
                  )}
                  {cfg.sectionType === 'i-beam' && (
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className={errors.flangeWidth ? "text-red-500" : ""}>Flange Width</Label>
                          <UnitInput value={cfg.sectionDims.flangeWidth} onChange={(v) => { setCfg({...cfg, sectionDims: {...cfg.sectionDims, flangeWidth: v}}); clearError('flangeWidth'); }} unitSystem={unitSystem} unitType="section" className={errors.flangeWidth ? "border-red-500 bg-red-50" : ""} />
                          {errors.flangeWidth && <p className="text-xs text-red-500 mt-1">{errors.flangeWidth}</p>}
                        </div>
                        <div>
                          <Label className={errors.flangeThickness ? "text-red-500" : ""}>Flange Thick</Label>
                          <UnitInput value={cfg.sectionDims.flangeThickness} onChange={(v) => { setCfg({...cfg, sectionDims: {...cfg.sectionDims, flangeThickness: v}}); clearError('flangeThickness'); }} unitSystem={unitSystem} unitType="section" className={errors.flangeThickness ? "border-red-500 bg-red-50" : ""} />
                          {errors.flangeThickness && <p className="text-xs text-red-500 mt-1">{errors.flangeThickness}</p>}
                        </div>
                        <div>
                          <Label className={errors.webHeight ? "text-red-500" : ""}>Web Height</Label>
                          <UnitInput value={cfg.sectionDims.webHeight} onChange={(v) => { setCfg({...cfg, sectionDims: {...cfg.sectionDims, webHeight: v}}); clearError('webHeight'); }} unitSystem={unitSystem} unitType="section" className={errors.webHeight ? "border-red-500 bg-red-50" : ""} />
                          {errors.webHeight && <p className="text-xs text-red-500 mt-1">{errors.webHeight}</p>}
                        </div>
                        <div>
                          <Label className={errors.webThickness ? "text-red-500" : ""}>Web Thick</Label>
                          <UnitInput value={cfg.sectionDims.webThickness} onChange={(v) => { setCfg({...cfg, sectionDims: {...cfg.sectionDims, webThickness: v}}); clearError('webThickness'); }} unitSystem={unitSystem} unitType="section" className={errors.webThickness ? "border-red-500 bg-red-50" : ""} />
                          {errors.webThickness && <p className="text-xs text-red-500 mt-1">{errors.webThickness}</p>}
                        </div>
                     </div>
                  )}

                   <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 space-y-1">
                      <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
                        Calculated Properties
                        <Tooltip content="Geometric properties derived from dimensions.">
                          <Info size={12} className="text-slate-400" />
                        </Tooltip>
                      </div>
                      <div className="flex justify-between">
                        <Tooltip content="Cross-sectional Area">
                          <span className="border-b border-dotted border-slate-300 cursor-help">Area (A):</span>
                        </Tooltip>
                        <span>{toDisplay(cfg.sectionProps.area, 'area', unitSystem).toFixed(4)} {u('area')}</span>
                      </div>
                      <div className="flex justify-between">
                        <Tooltip content="Moment of Inertia (Second Moment of Area). Resistance to bending.">
                          <span className="border-b border-dotted border-slate-300 cursor-help">Inertia (I):</span>
                        </Tooltip>
                        <span>{toDisplay(cfg.sectionProps.I, 'inertia', unitSystem).toExponential(4)} {u('inertia')}</span>
                      </div>
                    </div>
                </div>
              )}

              {activeTab === 'loads' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                    {loads.map((ld, i) => (
                      <div key={ld.id} className="p-3 border border-slate-200 rounded-lg bg-white relative group hover:border-blue-400 transition-colors">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => removeLoad(ld.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Load {i + 1}</div>
                        
                        <div className="space-y-3">
                           <Select 
                            value={ld.type} 
                            onChange={(e: any) => updateLoad(ld.id, {type: e.target.value})}
                            options={[
                              { value: 'point', label: 'Point Load' },
                              { value: 'udl', label: 'UDL' },
                              { value: 'triangular', label: 'Triangular' }
                            ]}
                          />
                          {ld.type === 'point' ? (
                            <div className="grid grid-cols-2 gap-2">
                               <div><Label className="text-xs">Pos ({u('length')})</Label><UnitInput value={ld.position} onChange={(v) => updateLoad(ld.id, {position: v})} unitSystem={unitSystem} unitType="length" /></div>
                               <div><Label className="text-xs">Mag ({u('force')})</Label><UnitInput value={ld.magnitude} onChange={(v) => updateLoad(ld.id, {magnitude: v})} unitSystem={unitSystem} unitType="force" /></div>
                            </div>
                          ) : ld.type === 'udl' ? (
                             <div className="grid grid-cols-3 gap-2">
                               <div><Label className="text-xs">Start ({u('length')})</Label><UnitInput value={ld.startPosition} onChange={(v) => updateLoad(ld.id, {startPosition: v})} unitSystem={unitSystem} unitType="length" /></div>
                               <div><Label className="text-xs">End ({u('length')})</Label><UnitInput value={ld.endPosition} onChange={(v) => updateLoad(ld.id, {endPosition: v})} unitSystem={unitSystem} unitType="length" /></div>
                               <div><Label className="text-xs">Mag ({u('distributed')})</Label><UnitInput value={ld.magnitude} onChange={(v) => updateLoad(ld.id, {magnitude: v})} unitSystem={unitSystem} unitType="distributed" /></div>
                            </div>
                          ) : (
                             <div className="grid grid-cols-2 gap-2">
                               <div><Label className="text-xs">Start ({u('length')})</Label><UnitInput value={ld.startPosition} onChange={(v) => updateLoad(ld.id, {startPosition: v})} unitSystem={unitSystem} unitType="length" /></div>
                               <div><Label className="text-xs">End ({u('length')})</Label><UnitInput value={ld.endPosition} onChange={(v) => updateLoad(ld.id, {endPosition: v})} unitSystem={unitSystem} unitType="length" /></div>
                               <div><Label className="text-xs">Start Mag ({u('distributed')})</Label><UnitInput value={ld.startMagnitude} onChange={(v) => updateLoad(ld.id, {startMagnitude: v})} unitSystem={unitSystem} unitType="distributed" /></div>
                               <div><Label className="text-xs">End Mag ({u('distributed')})</Label><UnitInput value={ld.endMagnitude} onChange={(v) => updateLoad(ld.id, {endMagnitude: v})} unitSystem={unitSystem} unitType="distributed" /></div>
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={addLoad} variant="ghost" className="w-full border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600">
                    <Plus size={16} className="mr-2" /> Add Load
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Visualization & Results */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* FBD */}
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
               <CardTitle className="text-lg flex items-center gap-2"><Ruler size={18} /> System Visualization</CardTitle>
               {!res && <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1"><Info size={12}/> Analysis not run</div>}
            </CardHeader>
            <CardContent className="p-6">
              <BeamVisualizer cfg={cfg} loads={loads} res={res} unitSystem={unitSystem} />
            </CardContent>
          </Card>

          {/* Results Panel */}
          {res?.error ? (
              <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-lg bg-red-50 text-red-500 gap-2">
                 <div className="flex items-center gap-2 font-semibold">
                   <AlertCircle size={20} />
                   Analysis Error
                 </div>
                 <p className="text-sm">{res.error}</p>
              </div>
          ) : res ? (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* KPI Cards */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center shadow-sm ${
                    res.safetyStatus === 'safe' ? 'bg-green-50 border-green-200' :
                    res.safetyStatus === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <div className="text-xs font-bold uppercase tracking-wider opacity-70">Safety Status</div>
                       <Tooltip content="Overall structure status based on Factor of Safety.">
                          <HelpCircle size={10} className="text-slate-400" />
                       </Tooltip>
                    </div>
                    <div className={`text-2xl font-black flex items-center gap-2 ${
                        res.safetyStatus === 'safe' ? 'text-green-700' :
                        res.safetyStatus === 'warning' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {res.safetyStatus === 'safe' ? <CheckCircle size={24}/> : res.safetyStatus === 'warning' ? <AlertCircle size={24}/> : <XCircle size={24}/>}
                      {res.safetyStatus?.toUpperCase()}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200 text-center shadow-sm">
                     <div className="flex items-center gap-1 justify-center mb-1">
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Stress</div>
                       <Tooltip content="Highest stress value derived from Mc/I. Must be lower than Allowable Stress.">
                          <HelpCircle size={10} className="text-slate-300 hover:text-slate-500" />
                       </Tooltip>
                     </div>
                     <div className="text-xl font-bold text-slate-800">{toDisplay(res.maxStress, 'stress', unitSystem).toFixed(1)} <span className="text-sm font-normal text-slate-500">{u('stress')}</span></div>
                     <div className="text-[10px] text-slate-400 mt-1">Allowable: {toDisplay(res.allowableStress, 'stress', unitSystem).toFixed(1)} {u('stress')}</div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200 text-center shadow-sm">
                     <div className="flex items-center gap-1 justify-center mb-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Deflection</div>
                        <Tooltip content="Maximum calculated displacement from neutral axis.">
                          <HelpCircle size={10} className="text-slate-300 hover:text-slate-500" />
                       </Tooltip>
                     </div>
                     <div className="text-xl font-bold text-slate-800">{toDisplay(res.maxDeflection, 'deflection', unitSystem).toFixed(2)} <span className="text-sm font-normal text-slate-500">{u('deflection')}</span></div>
                     <div className="text-[10px] text-slate-400 mt-1">Est. Max</div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200 text-center shadow-sm">
                     <div className="flex items-center gap-1 justify-center mb-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Factor of Safety</div>
                        <Tooltip content="Yield Strength / Max Stress. Should be greater than user defined FOS.">
                          <HelpCircle size={10} className="text-slate-300 hover:text-slate-500" />
                       </Tooltip>
                     </div>
                     <div className="text-xl font-bold text-slate-800">{res.actualFOS?.toFixed(2)}</div>
                     <div className="text-[10px] text-slate-400 mt-1">Required: {cfg.factorOfSafety}</div>
                  </div>
               </div>

               {/* Diagrams */}
               <div className="grid grid-cols-1 gap-6">
                 <Card>
                    <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 size={16}/> Diagrams</CardTitle></CardHeader>
                    <CardContent>
                       {res.shearData && <Diagram data={res.shearData} type="shear" maxVal={res.maxShear || 0} len={cfg.length} unitSystem={unitSystem} />}
                       {res.momentData && <Diagram data={res.momentData} type="moment" maxVal={res.maxMoment || 0} len={cfg.length} unitSystem={unitSystem} />}
                    </CardContent>
                 </Card>
               </div>
             </div>
          ) : (
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
               Click "Run Analysis" to view results
            </div>
          )}
        </div>
      </main>
    </div>
  );
}