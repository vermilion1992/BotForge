"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StrategyBuilderShell from "@/components/botforge/StrategyBuilderShell";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";
import { useBuilderStore, type IndicatorSelection } from "@/botforge/state/builderStore";
import { fetchAllIndicatorMetas, getIndicatorMeta, findPreset } from "@/botforge/lib/indicators";
import { Search, ChevronDown, ChevronUp, Info, Zap, Shield, Target, TrendingUp, BarChart3, Filter } from "lucide-react";

/** Small UI helpers */
function Pill({ active, onClick, children }:{ active?:boolean; onClick:()=>void; children:React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-full border px-3 py-1 text-sm transition-colors ${
    active 
      ? "bg-blue-600 text-white border-blue-600" 
      : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
  }`}>{children}</button>;
}

function getStrategyIcon(designIntent: string, presetTier: string) {
  const iconClass = "w-8 h-8 text-blue-600 dark:text-blue-400";
  
  if (presetTier === "Hero") {
    switch (designIntent) {
      case "Momentum": return <Zap className={iconClass} />;
      case "MeanReversion": return <Target className={iconClass} />;
      case "Filter": return <Filter className={iconClass} />;
      case "Breakout": return <TrendingUp className={iconClass} />;
      case "Pullback": return <BarChart3 className={iconClass} />;
      default: return <Zap className={iconClass} />;
    }
  } else {
    switch (designIntent) {
      case "Momentum": return <TrendingUp className={iconClass} />;
      case "MeanReversion": return <Target className={iconClass} />;
      case "Filter": return <Filter className={iconClass} />;
      case "Breakout": return <Zap className={iconClass} />;
      case "Pullback": return <BarChart3 className={iconClass} />;
      default: return <TrendingUp className={iconClass} />;
    }
  }
}

function getRiskIcon(riskProfile: string) {
  const iconClass = "w-4 h-4";
  switch (riskProfile) {
    case "Conservative": return <Shield className={`${iconClass} text-green-600`} />;
    case "Balanced": return <Target className={`${iconClass} text-yellow-600`} />;
    case "Aggressive": return <Zap className={`${iconClass} text-red-600`} />;
    default: return <Shield className={`${iconClass} text-gray-600`} />;
  }
}

export default function Step3Strategy() {
  const router = useRouter();
  const { indicatorSelections, setIndicators, setSelectedPreset, setDirection, setInverseSignals, applyPresetById } = useBuilderStore();
  const [metas, setMetas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"indicators" | "strategies">("indicators");
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [navigationSource, setNavigationSource] = useState<"list" | "indicator">("list");
  const [designIntentFilter, setDesignIntentFilter] = useState<string>("All");

  useEffect(()=>{ 
    fetchAllIndicatorMetas().then(setMetas); 
  },[]);

  // Prune selections that no longer exist
  useEffect(()=>{
    if (!metas.length) return;
    const valid = new Set(metas.map((m:any)=>m.identity.id));
    const pruned = indicatorSelections.filter(s=>valid.has(s.id));
    if (pruned.length !== indicatorSelections.length) setIndicators(pruned);
  },[metas.length]);

  // Ensure each selection has a presetRef (fallback to first preset in meta)
  useEffect(()=>{
    (async ()=>{
      if (!indicatorSelections.length || !metas.length) return;
      const next = [...indicatorSelections];
      let changed = false;
      for (let i=0;i<next.length;i++){
        const sel = next[i];
        if (sel.presetRef) continue;
        const meta = await getIndicatorMeta(sel.id);
        const preset = findPreset(meta, undefined);
        if (preset?.id) {
          next[i] = { ...sel, presetRef: preset.id };
          changed = true;
        }
      }
      if (changed) setIndicators(next);
    })();
  },[indicatorSelections.length, metas.length]);


  // Get all presets from all indicators
  const allPresets = useMemo(() => {
    const presets: any[] = [];
    metas.forEach(meta => {
      if (meta.presets) {
        meta.presets.forEach((preset: any) => {
          presets.push({
            ...preset,
            indicatorId: meta.identity.id,
            indicatorLabel: meta.identity.label
          });
        });
      }
    });
    return presets;
  }, [metas]);

  const filteredIndicators = useMemo(() => {
    if (!search.trim()) return metas;
    const term = search.toLowerCase();
    return metas.filter((m:any) => {
      const hay = (m.identity?.label||"") + " " + (m.identity?.id||"") + " " + (m.docs?.tags||[]).join(" ");
      return hay.toLowerCase().includes(term);
    });
  }, [metas, search]);

  const filteredStrategies = useMemo(() => {
    let filtered = allPresets;
    
    // Filter by design intent
    if (designIntentFilter !== "All") {
      filtered = filtered.filter((preset: any) => preset.designIntent === designIntentFilter);
    }
    
    // Filter by search term
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter((preset: any) => {
        const hay = (preset.label||"") + " " + (preset.indicatorLabel||"") + " " + (preset.designIntent||"");
        return hay.toLowerCase().includes(term);
      });
    }
    
    return filtered;
  }, [allPresets, search, designIntentFilter]);

  function addIndicator(m:any){
    const id = m.identity.id as string;
    if (indicatorSelections.some(s=>s.id===id)) return;
    const presetRef = m?.presets?.[0]?.id || "default";
    const next: IndicatorSelection = { id, presetRef, params:{} };
    setIndicators([...indicatorSelections, next]);
  }

  function addStrategy(preset: any){
    // Store the selected preset for Step 4 to use
    setSelectedPreset(preset);
    
    // Add ALL indicators from the preset, not just the primary one
    const newSelections: IndicatorSelection[] = [];
    
    if (preset.indicators && Array.isArray(preset.indicators)) {
      for (const indicator of preset.indicators) {
        const id = indicator.id;
        if (!indicatorSelections.some(s => s.id === id)) {
          // Add new indicator with this preset
          newSelections.push({ 
            id, 
            presetRef: preset.id, 
            params: indicator.params || {} 
          });
        } else {
          // Update existing indicator with this preset
          const updated = indicatorSelections.map(s => 
            s.id === id ? { ...s, presetRef: preset.id, params: indicator.params || {} } : s
          );
          setIndicators(updated);
        }
      }
    }
    
    if (newSelections.length > 0) {
      setIndicators([...indicatorSelections, ...newSelections]);
    }
  }

  function removeIndicator(id:string){
    setIndicators(indicatorSelections.filter(s=>s.id!==id));
  }

  return (
    <StrategyBuilderShell>
      <PageHeader title="Strategy & Indicators" subtitle="Choose indicators and their strategy presets." />
      <Stepper current="strategy" />

      <div className="space-y-4">
        {/* Main Selection Tile */}
        <div className="rounded-2xl border p-4 shadow-sm bg-white dark:bg-neutral-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {viewMode === "indicators" ? "Available Indicators" : "Strategy Presets"}
            </h3>
            <div className="flex gap-2">
              <Pill active={viewMode === "indicators"} onClick={() => setViewMode("indicators")}>
                Indicators
              </Pill>
              <Pill active={viewMode === "strategies"} onClick={() => setViewMode("strategies")}>
                Strategies
              </Pill>
            </div>
          </div>
          
          {viewMode === "strategies" && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Pill active={designIntentFilter === "All"} onClick={() => setDesignIntentFilter("All")}>All</Pill>
              <Pill active={designIntentFilter === "Momentum"} onClick={() => setDesignIntentFilter("Momentum")}>Momentum</Pill>
              <Pill active={designIntentFilter === "Breakout"} onClick={() => setDesignIntentFilter("Breakout")}>Breakout</Pill>
              <Pill active={designIntentFilter === "MeanReversion"} onClick={() => setDesignIntentFilter("MeanReversion")}>Mean Reversion</Pill>
              <Pill active={designIntentFilter === "Filter"} onClick={() => setDesignIntentFilter("Filter")}>Filter</Pill>
              <Pill active={designIntentFilter === "Pullback"} onClick={() => setDesignIntentFilter("Pullback")}>Pullback</Pill>
            </div>
          )}
          
          <div className="mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm"
                placeholder={viewMode === "indicators" ? "Search indicators..." : "Search strategies..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

                 {viewMode === "indicators" ? (
                   <div className="space-y-4">
                     {filteredIndicators.length === 0 ? (
                       <div className="text-sm text-gray-500 text-center py-8">
                         No indicators available. Ensure meta files exist.
                       </div>
                     ) : expandedIndicator ? (
                       // Expanded view - show detailed info for selected indicator
                       <div className="space-y-4">
                         {filteredIndicators
                           .filter((meta: any) => meta.identity.id === expandedIndicator)
                           .map((meta: any) => {
                             const isSelected = indicatorSelections.some(s => s.id === meta.identity.id);
                             return (
                               <div key={meta.identity.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-gray-50 dark:bg-gray-800/50">
                                 <div className="flex items-start justify-between mb-6">
                                   <div className="flex items-start gap-4">
                                     <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                       <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                     </div>
                                     <div>
                                       <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{meta.identity.label}</h3>
                                       <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                         {meta.docs?.category || "Technical Indicator"}
                                       </p>
                                     </div>
                                   </div>
                                   <button
                                     onClick={() => setExpandedIndicator(null)}
                                     className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                   >
                                     <ChevronUp className="w-6 h-6" />
                                   </button>
                                 </div>

                                 <div className="space-y-6 mb-6">
                                   <div>
                                     <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Indicator Description</h4>
                                     <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                       {meta.docs?.longSummary || meta.docs?.blurb || "Technical analysis indicator for market analysis."}
                                     </p>
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="space-y-4">
                                       <div>
                                         <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How It Works</h4>
                                         <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                           <li className="flex items-start gap-2">
                                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                             <span>Calculates {meta.identity.label} based on price data over specified periods</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                             <span>Provides signals for {meta.docs?.category?.toLowerCase() || "market analysis"} patterns</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                             <span>Configurable parameters for different market conditions</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                             <span>Compatible with multiple timeframes and trading strategies</span>
                                           </li>
                                         </ul>
          </div>
        </div>

                                     <div>
                                       <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Strategies using {meta.identity.label}</h4>
          <div className="flex flex-wrap gap-2">
                                         {meta.presets?.map((preset: any) => (
                                           <button
                                             key={preset.id}
                                             onClick={() => {
                                               setExpandedIndicator(null);
                                               setExpandedStrategy(`${meta.identity.id}-${preset.id}`);
                                               setViewMode("strategies");
                                               setNavigationSource("indicator");
                                             }}
                                             className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                           >
                                             {preset.label}
                                           </button>
            ))}
          </div>
                                     </div>
          </div>
        </div>

                                 <div className="flex justify-between mt-6">
                                   <button
                                     onClick={() => setExpandedIndicator(null)}
                                     className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                   >
                                     Back to List
                                   </button>
                                   <button
                                     onClick={() => isSelected ? removeIndicator(meta.identity.id) : addIndicator(meta)}
                                     className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                                       isSelected
                                         ? "bg-red-600 text-white hover:bg-red-700"
                                         : "bg-blue-600 text-white hover:bg-blue-700"
                                     }`}
                                   >
                                     {isSelected ? "Deselect Indicator" : "Select This Indicator"}
                                   </button>
                                 </div>
                               </div>
                             );
                           })}
                       </div>
                     ) : (
                       // Grid view - show all indicators side by side
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {filteredIndicators.map((meta: any) => {
                           const isSelected = indicatorSelections.some(s => s.id === meta.identity.id);
                  return (
                    <div 
                               key={meta.identity.id}
                               className={`group border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                                 isSelected
                                   ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                                   : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm bg-white dark:bg-gray-800"
                               }`}
                               onClick={() => isSelected ? removeIndicator(meta.identity.id) : addIndicator(meta)}
                             >
                               <div className="flex items-start gap-3 mb-3">
                                 <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                   <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                 </div>
                        <div className="flex-1">
                                   <h3 className={`text-base font-bold transition-colors ${
                                     isSelected
                                       ? "text-black dark:text-white"
                                       : "text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300"
                                   }`}>
                                     {meta.identity.label}
                                   </h3>
                                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                     {meta.docs?.category || "Technical Indicator"}
                                   </p>
                          </div>
                               </div>

                               <div className="space-y-2 mb-3">
                                 <div className="flex items-center gap-2">
                                   <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                                     {meta.docs?.category || "Indicator"}
                                   </span>
                                 </div>

                                 <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                   {meta.docs?.blurb || "Technical analysis indicator for market analysis."}
                                 </p>
                               </div>

                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   {isSelected ? (
                                     <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs font-medium">
                                       <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                       Selected
                                     </div>
                                   ) : (
                                     <div className="text-xs text-gray-500 dark:text-gray-400">
                                       Click to select
                                     </div>
                                   )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                                     setExpandedIndicator(meta.identity.id);
                          }}
                                   className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors"
                        >
                          Learn More
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
                   </div>
                 ) : (
            <div className="space-y-4">
              {filteredStrategies.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  No strategy presets available.
                </div>
              ) : expandedStrategy ? (
                // Expanded view - show detailed info for selected strategy
                <div className="space-y-4">
                  {filteredStrategies
                    .filter((preset: any) => `${preset.indicatorId}-${preset.id}` === expandedStrategy)
                    .map((preset: any) => {
                      const isSelected = indicatorSelections.some(s => s.id === preset.indicatorId && s.presetRef === preset.id);
                  return (
                        <div key={`${preset.indicatorId}-${preset.id}`} className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-start gap-4">
                              {getStrategyIcon(preset.designIntent, preset.presetTier)}
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{preset.label}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {preset.indicatorLabel} Strategy
                                </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedStrategy(null)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                              <ChevronUp className="w-6 h-6" />
                        </button>
                      </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Strategy Description</h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  This strategy leverages {preset.indicators?.map((ind: any) => `${ind.id.toUpperCase()}`).join(" + ")} 
                                  indicators to identify {preset.designIntent.toLowerCase()} opportunities in the market. 
                                  The strategy is designed for traders seeking {preset.designIntent.toLowerCase()} patterns with 
                                  proven technical analysis approaches.
                                </p>
                          </div>
                          
                          <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How It Works</h4>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                  <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>Monitors {preset.indicators?.map((ind: any) => `${ind.id.toUpperCase()}`).join(" + ")} signals for {preset.designIntent.toLowerCase()} patterns</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>Generates entry signals based on indicator crossovers and thresholds</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>Uses optimized parameters for {preset.designIntent.toLowerCase()} market conditions</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span>Provides clear exit signals to lock in profits</span>
                                </li>
                            </ul>
                          </div>
                        </div>

                            <div className="space-y-6">
                          <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Best For</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{preset.designIntent} trading strategies</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Technical analysis focused</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Automated signal generation</span>
                                  </div>
                                </div>
                          </div>
                          
                          <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Strategy Profile</h4>
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 dark:text-gray-400">Trading Style:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{preset.designIntent}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 dark:text-gray-400">Indicators Used:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{preset.indicators?.length || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-600 dark:text-gray-400">Risk Profile:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{preset.riskProfile}</span>
                                  </div>
                            </div>
                          </div>
                        </div>
                      </div>

                                 <div className="flex justify-between mt-6">
                        <button
                                     onClick={() => {
                                       setExpandedStrategy(null);
                                       if (navigationSource === "indicator") {
                                         setViewMode("indicators");
                                         setNavigationSource("list");
                                       }
                                     }}
                                     className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                   >
                                     {navigationSource === "indicator" ? "Back to Indicator" : "Back to List"}
                        </button>
                        <button
                              onClick={() => isSelected ? removeIndicator(preset.indicatorId) : addStrategy(preset)}
                              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                                isSelected
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              {isSelected ? "Deselect Strategy" : "Select This Strategy"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              ) : (
                // Grid view - show all strategies side by side
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredStrategies.map((preset: any) => {
                    const isSelected = indicatorSelections.some(s => s.id === preset.indicatorId && s.presetRef === preset.id);
                  return (
                      <div 
                        key={`${preset.indicatorId}-${preset.id}`} 
                        className={`group border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm" 
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm bg-white dark:bg-gray-800"
                        }`}
                        onClick={() => isSelected ? removeIndicator(preset.indicatorId) : addStrategy(preset)}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {getStrategyIcon(preset.designIntent, preset.presetTier)}
                        <div className="flex-1">
                            <h3 className={`text-base font-bold transition-colors ${
                              isSelected 
                                ? "text-black dark:text-white" 
                                : "text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300"
                            }`}>
                              {preset.label}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {preset.indicatorLabel}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                              {preset.designIntent}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {preset.indicators?.map((ind: any) => `${ind.id.toUpperCase()}`).join(" + ")} strategy for {preset.designIntent.toLowerCase()} trading.
                          </p>
                                    </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs font-medium">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Selected
                                </div>
                              ) : (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Click to select
                              </div>
                              )}
                          </div>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setExpandedStrategy(`${preset.indicatorId}-${preset.id}`);
                                     setNavigationSource("list");
                                   }}
                                   className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors"
                                 >
                                   Learn More
                                 </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
        </div>

      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between">
                  <button
          onClick={() => router.push("/strategy-builder/step2")}
          className="rounded-xl border border-gray-300 dark:border-neutral-600 px-6 py-3 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium"
        >
          Back to Trading Pairs
        </button>
        <button
          onClick={() => {
            // Apply preset if one is selected
            const selectedPreset = useBuilderStore.getState().selectedPreset;
            if (selectedPreset) {
              applyPresetById(selectedPreset.id, selectedPreset);
            }
            // Set default direction
            setDirection("both");
            setInverseSignals(false);
            router.push("/strategy-builder/step4");
          }}
          disabled={indicatorSelections.length === 0}
          className={`rounded-xl px-6 py-3 shadow-sm font-medium transition-colors ${
            indicatorSelections.length === 0
              ? "opacity-60 cursor-not-allowed bg-gray-300 text-gray-500"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Continue to Advanced Settings
        </button>
      </div>
    </StrategyBuilderShell>
  );
}