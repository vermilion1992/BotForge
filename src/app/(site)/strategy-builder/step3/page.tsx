"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StrategyBuilderShell from "@/components/botforge/StrategyBuilderShell";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";
import { useBuilderStore, type IndicatorSelection } from "@/botforge/state/builderStore";
import { Search, ChevronDown, ChevronUp, Info, Zap, Shield, Target, TrendingUp, BarChart3, Filter } from "lucide-react";

// Safely get indicator id from either a string ("ema") or object ({ id: "ema", params })
const getIndId = (ind: any) =>
  (typeof ind === "string" ? ind : ind?.id) ? String(typeof ind === "string" ? ind : ind?.id).trim() : "";

/** Small UI helpers */
function Pill({ active, onClick, children }:{ active?:boolean; onClick:()=>void; children:React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-full border px-3 py-1 text-sm transition-colors ${
    active 
      ? "bg-blue-600 text-white border-blue-600" 
      : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
  }`}>{children}</button>;
}

function getStrategyIcon(designIntent: string, presetTier: string, compact = false) {
  const iconClass = compact ? "w-4 h-4 text-blue-600 dark:text-blue-400" : "w-8 h-8 text-blue-600 dark:text-blue-400";
  
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
  const { indicatorSelections = [], setIndicators, setSelectedPreset, setDirection, setInverseSignals, applyPresetById } = useBuilderStore();
  const [metas, setMetas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"indicators" | "strategies">("indicators");
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(new Set());
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());
  const [navigationSource, setNavigationSource] = useState<"list" | "indicator">("list");
  const [designIntentFilter, setDesignIntentFilter] = useState<string>("All");
  const [strategyBackContext, setStrategyBackContext] = useState<{ type: 'strategies' | 'indicator', indicatorId?: string, indicatorName?: string } | null>(null);

  // Sync local UI state with builder store on mount and when store changes
  useEffect(() => {
    const indicatorIds = new Set(indicatorSelections.map(sel => sel.id));
    setSelectedIndicators(indicatorIds);
  }, [indicatorSelections]);

  useEffect(()=>{ 
    (async () => {
      try {
        const res = await fetch("/api/indicators", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        
        // Handle different API response shapes: array | { metas } | { value }
        let normalizedMetas: any[] = [];
        if (Array.isArray(raw)) {
          normalizedMetas = raw;
        } else if (raw.metas && Array.isArray(raw.metas)) {
          normalizedMetas = raw.metas;
        } else if (raw.value && Array.isArray(raw.value)) {
          normalizedMetas = raw.value;
        }
        
        // Ensure every meta has id/label at both top-level and inside identity
        const enrichedMetas = normalizedMetas.map((meta: any) => ({
          ...meta,
          id: meta.id || meta.identity?.id || "unknown",
          label: meta.label || meta.identity?.label || meta.identity?.id || "Unknown",
          identity: {
            ...meta.identity,
            id: meta.identity?.id || meta.id || "unknown",
            label: meta.identity?.label || meta.label || meta.identity?.id || "Unknown"
          }
        }));
        
        setMetas(enrichedMetas);
      } catch (err) {
        console.error("Failed to fetch indicators:", err);
        setMetas([]);
      }
    })();
  }, []);

  const selectedPreset = useBuilderStore(state => state.selectedPreset);

  // Filter and flatten all strategies from all indicators
  const allStrategies = useMemo(() => {
    const strategies: any[] = [];
    metas.forEach(meta => {
      if (meta.presets && Array.isArray(meta.presets)) {
        meta.presets.forEach((preset: any) => {
          strategies.push({
            ...preset,
            indicatorId: meta.identity.id,
            indicatorLabel: meta.identity.label,
            presetTier: preset.tier || "Normal"
          });
        });
      }
    });
    return strategies;
  }, [metas]);

  const filteredIndicators = useMemo(() => 
    metas.filter(meta => 
      !search || meta.identity.label.toLowerCase().includes(search.toLowerCase())
    )
  , [metas, search]);

  const filteredStrategies = useMemo(() => {
    let filtered = allStrategies;
    
    // Filter by search
    if (search) {
      filtered = filtered.filter(preset => 
        preset.name?.toLowerCase().includes(search.toLowerCase()) ||
        preset.title?.toLowerCase().includes(search.toLowerCase()) ||
        preset.summary?.toLowerCase().includes(search.toLowerCase()) ||
        preset.indicatorLabel?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by design intent
    if (designIntentFilter !== "All") {
      filtered = filtered.filter(preset => preset.designIntent === designIntentFilter);
    }
    
    return filtered;
  }, [allStrategies, search, designIntentFilter]);

  function addIndicator(meta: any) {
    const id = meta.identity.id.toLowerCase();
    // Don't auto-assign a preset when just selecting an indicator
    const next: IndicatorSelection = { id, presetRef: "default", params:{} };
    setIndicators([...indicatorSelections, next]);
  }

  function addStrategy(preset: any){
    // Store the selected preset for Step 4 to use
    setSelectedPreset(preset);
    
    // Add ALL indicators from the preset, not just the primary one
    const newSelections: IndicatorSelection[] = [];
    
    if (preset.indicators && Array.isArray(preset.indicators)) {
      for (const indicator of preset.indicators) {
        const id: string = typeof indicator === "string" ? indicator.toLowerCase() : String(indicator.id || "").toLowerCase();
        const params: any = typeof indicator === "string" ? {} : (indicator.params || {});
        if (!id) continue;
        
        // Check if this exact combination already exists
        const existingIndex = indicatorSelections.findIndex(s => s.id === id && s.presetRef === preset.id);
        if (existingIndex === -1) {
          newSelections.push({ id, presetRef: preset.id, params });
        }
      }
    }
    
    if (newSelections.length > 0) {
      setIndicators([...indicatorSelections, ...newSelections]);
    }
  }

  function removeStrategy(preset: any) {
    // Remove all indicators that were added by this specific preset
    if (preset.indicators && Array.isArray(preset.indicators)) {
      const indicatorsToRemove = preset.indicators.map(indicator => 
        typeof indicator === "string" ? indicator.toLowerCase() : String(indicator.id || "").toLowerCase()
      ).filter(Boolean);
      
      const updatedSelections = indicatorSelections.filter(selection => 
        !(indicatorsToRemove.includes(selection.id) && selection.presetRef === preset.id)
      );
      
      setIndicators(updatedSelections);
      
      // Clear selected preset if this was the selected one
      if (selectedPreset?.id === preset.id) {
        setSelectedPreset(null);
      }
    }
  }

  function isStrategySelected(preset: any): boolean {
    if (!preset.indicators || !Array.isArray(preset.indicators)) return false;
    
    const requiredIndicators = preset.indicators.map(indicator => 
      typeof indicator === "string" ? indicator.toLowerCase() : String(indicator.id || "").toLowerCase()
    ).filter(Boolean);
    
    // Check if ALL indicators from this preset are selected with the correct presetRef
    return requiredIndicators.every(indicatorId => 
      indicatorSelections.some(selection => 
        selection.id === indicatorId && selection.presetRef === preset.id
      )
    );
  }

  function removeIndicator(id:string){
    setIndicators(indicatorSelections.filter(s=>s.id!==id));
  }

  // New handlers for select/deselect + Learn More
  function handleIndicatorSelect(indicatorId: string) {
    const newSelected = new Set(selectedIndicators);
    if (newSelected.has(indicatorId)) {
      newSelected.delete(indicatorId);
    } else {
      newSelected.add(indicatorId);
    }
    setSelectedIndicators(newSelected);
    
    // Also update the store
    if (newSelected.has(indicatorId)) {
      const meta = metas.find(m => m.identity.id === indicatorId);
      if (meta) addIndicator(meta);
    } else {
      removeIndicator(indicatorId);
    }
  }

  function handleStrategySelect(strategyId: string, preset: any) {
    const newSelected = new Set(selectedStrategies);
    if (newSelected.has(strategyId)) {
      newSelected.delete(strategyId);
      removeStrategy(preset);
    } else {
      newSelected.add(strategyId);
      addStrategy(preset);
    }
    setSelectedStrategies(newSelected);
  }

  function handleIndicatorLearnMore(indicatorId: string) {
    // First select the indicator if not already selected
    if (!selectedIndicators.has(indicatorId)) {
      setSelectedIndicators(prev => new Set(prev).add(indicatorId));
      const meta = metas.find(m => m.identity.id === indicatorId);
      if (meta) addIndicator(meta);
    }
    // Then expand it
    setExpandedIndicator(indicatorId);
  }

  function handleStrategyLearnMore(strategyId: string, preset: any) {
    // Set back context to strategies list
    setStrategyBackContext({ type: 'strategies' });
    // Expand strategy details without auto-selecting
    setExpandedStrategy(strategyId);
  }

  function handleStrategyFromIndicator(preset: any) {
    // Select strategy and close indicator view
    handleStrategySelect(preset.id, preset);
    setExpandedIndicator(null);
  }

  function handleStrategyLearnMoreFromIndicator(preset: any) {
    // Set back context, close indicator view, and open strategy expanded view (without auto-selecting)
    const currentIndicatorMeta = metas.find(m => m.identity.id === expandedIndicator);
    setStrategyBackContext({
      type: 'indicator',
      indicatorId: expandedIndicator || '',
      indicatorName: currentIndicatorMeta?.identity?.label || 'Indicator'
    });
    setExpandedIndicator(null);
    setExpandedStrategy(preset.id);
  }

  function handleStrategyBackNavigation() {
    if (strategyBackContext?.type === 'indicator' && strategyBackContext.indicatorId) {
      // Go back to indicator expanded view
      setExpandedStrategy(null);
      setExpandedIndicator(strategyBackContext.indicatorId);
      setStrategyBackContext(null);
    } else {
      // Default back to strategies list
      setExpandedStrategy(null);
      setStrategyBackContext(null);
    }
  }

  function handleStrategyToggle(strategyId: string, strategy: any) {
    if (selectedStrategies.has(strategyId)) {
      // Deselect strategy
      setSelectedStrategies(prev => {
        const newSet = new Set(prev);
        newSet.delete(strategyId);
        return newSet;
      });
      removeStrategy(strategy);
    } else {
      // Select strategy
      setSelectedStrategies(prev => new Set(prev).add(strategyId));
      addStrategy(strategy);
    }
  }

  return (
    <StrategyBuilderShell>
      <PageHeader title="Strategy & Indicators" subtitle="Choose indicators and their strategy presets." />
      <Stepper current="strategy" />

        <div className="mb-2.5">
          <div className="rounded-2xl border p-6 shadow-sm bg-white dark:bg-neutral-800">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
            expandedStrategy ? (
              // Expanded Strategy View from Indicator
              <ExpandedStrategyView
                strategyId={expandedStrategy}
                strategy={allStrategies.find(s => s.id === expandedStrategy)}
                onBack={handleStrategyBackNavigation}
                backContext={strategyBackContext}
                selectedStrategies={selectedStrategies}
                onStrategyToggle={handleStrategyToggle}
              />
                     ) : expandedIndicator ? (
              // Expanded Indicator View
              <ExpandedIndicatorView
                indicatorId={expandedIndicator}
                meta={metas.find(m => m.identity.id === expandedIndicator)}
                onBack={() => setExpandedIndicator(null)}
                onStrategySelect={handleStrategyFromIndicator}
                onStrategyLearnMore={handleStrategyLearnMoreFromIndicator}
                selectedStrategies={selectedStrategies}
                setSelectedStrategies={setSelectedStrategies}
                removeStrategy={removeStrategy}
              />
            ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {filteredIndicators.map((meta: any) => {
                  const isSelected = selectedIndicators.has(meta.identity.id);
                  return (
                    <div 
                               key={meta.identity.id}
                      className={`rounded-2xl shadow-sm transition-all duration-200 cursor-pointer ${
                                 isSelected
                          ? "border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20" 
                          : "border bg-white dark:bg-neutral-900/60 hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-600"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          {/* Main tile content - clickable for selection */}
                          <button 
                            onClick={() => handleIndicatorSelect(meta.identity.id)} 
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                                 <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                   <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                 </div>
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                     {meta.identity.label}
                                   </h3>
                                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Technical Indicator
                              </p>
                              {isSelected && (
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs font-medium mt-1">
                                       <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                       Selected
                                     </div>
                                   )}
                        </div>
                          </button>
                          
                          {/* Learn More button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                              handleIndicatorLearnMore(meta.identity.id);
                          }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Learn More
                        </button>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            expandedStrategy ? (
              // Expanded Strategy View
              <ExpandedStrategyView
                strategyId={expandedStrategy}
                strategy={allStrategies.find(s => s.id === expandedStrategy)}
                onBack={handleStrategyBackNavigation}
                backContext={strategyBackContext}
                selectedStrategies={selectedStrategies}
                onStrategyToggle={handleStrategyToggle}
              />
            ) : (
              <div>
                {/* Strategy Filter Pills */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <Pill active={designIntentFilter === "All"} onClick={() => setDesignIntentFilter("All")}>All</Pill>
                  <Pill active={designIntentFilter === "Momentum"} onClick={() => setDesignIntentFilter("Momentum")}>Momentum</Pill>
                  <Pill active={designIntentFilter === "Breakout"} onClick={() => setDesignIntentFilter("Breakout")}>Breakout</Pill>
                  <Pill active={designIntentFilter === "MeanReversion"} onClick={() => setDesignIntentFilter("MeanReversion")}>Mean Reversion</Pill>
                </div>

                {/* Strategy Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredStrategies.map((preset: any, idx: number) => {
                    const pid = String(preset.id ?? preset.preset_id ?? idx);
                    const presetWithId = { ...preset, id: pid };
                    const isSelected = selectedStrategies.has(pid);
                    const displayTitle = (preset.name?.trim?.() || preset.title?.trim?.() || preset.label || pid);
                    const displaySummary = (preset.summary?.trim?.() || "");
                  return (
                      <div 
                        key={`${preset.indicatorId}-${pid}`} 
                        className={`rounded-2xl shadow-sm transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? "border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20" 
                            : "border bg-white dark:bg-neutral-900/60 hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-600"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            {/* Main content - clickable for selection */}
                            <button 
                              onClick={() => handleStrategySelect(pid, presetWithId)} 
                              className="flex items-start gap-3 flex-1 text-left"
                            >
                          {getStrategyIcon(preset.designIntent, preset.presetTier)}
                        <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                  {displayTitle}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {preset.indicatorLabel}
                            </p>
                          </div>
                            </button>
                            
                            {/* Learn More button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStrategyLearnMore(pid, presetWithId);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                              Learn More
                            </button>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                              {preset.designIntent}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              {displaySummary || `${preset.indicators?.map((ind: any) => `${getIndId(ind).toUpperCase()}`).join(" + ")} strategy for ${preset.designIntent?.toLowerCase?.() || ""} trading.`}
                          </p>
                                    </div>

                          {isSelected && (
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs font-medium">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Selected
                              </div>
                              )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              </div>
            )
            )}
          </div>
        </div>

      {/* Selected Indicators Summary */}
      {indicatorSelections.length > 0 && (
        <div className="mt-2.5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Your Selection ({indicatorSelections.length} {indicatorSelections.length === 1 ? 'item' : 'items'})
          </h4>
          <div className="flex flex-wrap gap-2">
            {indicatorSelections.map((selection, idx) => {
              // Find the strategy name for better display
              const strategy = allStrategies.find(s => s.id === selection.presetRef);
              let displayName;
              
              if (selection.presetRef && selection.presetRef !== 'default' && strategy) {
                // This is a strategy selection - show indicator + strategy name
                displayName = `${selection.id.toUpperCase()}: ${strategy.name || strategy.title || selection.presetRef}`;
              } else {
                // This is just an indicator selection - show only indicator name
                const indicatorMeta = metas.find(m => m.identity.id === selection.id);
                displayName = indicatorMeta?.identity?.label || selection.id.toUpperCase();
              }
              
              return (
                <div 
                  key={`${selection.id}-${selection.presetRef}-${idx}`}
                  className="group flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                >
                  <span>{displayName}</span>
                  <button
                    onClick={() => {
                      // Remove this specific selection
                      const updatedSelections = indicatorSelections.filter((_, i) => i !== idx);
                      setIndicators(updatedSelections);
                      
                      // Also update local state if it's a strategy
                      if (selection.presetRef && selection.presetRef !== 'default') {
                        setSelectedStrategies(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(selection.presetRef);
                          return newSet;
                        });
                      }
                      
                      // Update indicator state
                      setSelectedIndicators(prev => {
                        const newSet = new Set(prev);
                        // Only remove if no other selections use this indicator
                        const stillUsed = updatedSelections.some(s => s.id === selection.id);
                        if (!stillUsed) {
                          newSet.delete(selection.id);
                        }
                        return newSet;
                      });
                    }}
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 opacity-60 group-hover:opacity-100 transition-opacity"
                    title="Remove this selection"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
      </div>
      )}

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between">
                  <button
          onClick={() => router.push("/strategy-builder/step1")}
          className="rounded-xl border border-gray-300 dark:border-neutral-600 px-6 py-3 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium"
        >
          Back to Market Type
        </button>
        <button
          onClick={() => {
            // Apply preset if one is selected
            if (selectedPreset) {
              applyPresetById(selectedPreset.id, selectedPreset);
            }
            
            // Set default direction
            setDirection("both");
            setInverseSignals(false);
            
            router.push("/strategy-builder/step4");
          }}
          className="rounded-xl px-6 py-3 shadow-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue to Advanced Settings {indicatorSelections.length > 0 && `(${indicatorSelections.length} selected)`}
        </button>
      </div>
    </StrategyBuilderShell>
  );
}

// Expanded Indicator View Component
function ExpandedIndicatorView({ indicatorId, meta, onBack, onStrategySelect, onStrategyLearnMore, selectedStrategies, setSelectedStrategies, removeStrategy }: {
  indicatorId: string;
  meta: any;
  onBack: () => void;
  onStrategySelect: (preset: any) => void;
  onStrategyLearnMore: (preset: any) => void;
  selectedStrategies: Set<string>;
  setSelectedStrategies: (strategies: Set<string>) => void;
  removeStrategy: (preset: any) => void;
}) {
  if (!meta) return null;

  const strategies = meta.presets || [];
  const [showAllStrategies, setShowAllStrategies] = useState(false);
  const displayedStrategies = showAllStrategies ? strategies : strategies.slice(0, 2);

  return (
    <div className="rounded-2xl border bg-white dark:bg-neutral-900/60 shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{meta.identity?.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Technical Indicator</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">About This Indicator</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {meta.identity?.blurb || `${meta.identity?.label} is a technical indicator used for market analysis and trading decisions.`}
          </p>
          
          {meta.identity?.longSummary && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {meta.identity.longSummary}
            </p>
          )}
        </div>

        {/* Available Strategies */}
        {strategies.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Available Strategies</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Choose from pre-configured trading strategies that use {meta.identity?.label}:
            </p>
            
            <div className="grid md:grid-cols-2 gap-3">
              {displayedStrategies.map((preset: any, idx: number) => {
                const pid = String(preset.id ?? idx);
                const displayTitle = preset.name || preset.title || `Strategy ${idx + 1}`;
                const displaySummary = preset.summary || preset.teaser || `A trading strategy using ${meta.identity?.label}.`;
                
                const isStrategySelected = selectedStrategies.has(pid);
                
                return (
                  <div
                    key={pid}
                    className={`rounded-2xl shadow-sm transition-all duration-200 cursor-pointer ${
                      isStrategySelected 
                        ? "border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20" 
                        : "border bg-white dark:bg-neutral-900/60 hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        {/* Main tile content - clickable for selection */}
                        <button 
                          onClick={() => {
                            if (isStrategySelected) {
                              // Deselect strategy
                              setSelectedStrategies(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(pid);
                                return newSet;
                              });
                              removeStrategy({ ...preset, id: pid });
                            } else {
                              // Select strategy
                              onStrategySelect({ ...preset, id: pid });
                            }
                          }}
                          className="flex items-start gap-3 flex-1 text-left"
                        >
                          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                            {getStrategyIcon(preset.designIntent, preset.tier || "Normal", true)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-sm text-gray-900 dark:text-white">
                              {displayTitle}
                            </h5>
                            <div className="mt-1 mb-2">
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                                {preset.designIntent}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              {displaySummary}
                            </p>
                            {isStrategySelected && (
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs font-medium mt-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Selected
                              </div>
                            )}
                          </div>
                        </button>
                        
                        {/* Learn More button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onStrategyLearnMore({ ...preset, id: pid });
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Learn More
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {strategies.length > 2 && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowAllStrategies(!showAllStrategies)}
                  className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  {showAllStrategies ? `Show Less (${displayedStrategies.length} of ${strategies.length})` : `Show All (${strategies.length} strategies)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-neutral-700">
          <button 
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Back to Indicators
          </button>
        </div>
      </div>
    </div>
  );
}

// Expanded Strategy View Component
function ExpandedStrategyView({ strategyId, strategy, onBack, backContext, selectedStrategies, onStrategyToggle }: {
  strategyId: string;
  strategy: any;
  onBack: () => void;
  backContext?: { type: 'strategies' | 'indicator', indicatorId?: string, indicatorName?: string };
  selectedStrategies: Set<string>;
  onStrategyToggle: (strategyId: string, strategy: any) => void;
}) {
  if (!strategy) return null;

  const displayTitle = strategy.name || strategy.title || strategyId;
  const displaySummary = strategy.summary || strategy.teaser || `A trading strategy using ${strategy.indicatorLabel}.`;

  return (
    <div className="rounded-2xl border bg-white dark:bg-neutral-900/60 shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              {getStrategyIcon(strategy.designIntent, strategy.presetTier)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{displayTitle}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {strategy.indicatorLabel} Strategy
              </p>
            </div>
          </div>
        </div>

        {/* Strategy Tags */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
            {strategy.designIntent}
          </span>
          {strategy.riskProfile && (
            <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              {getRiskIcon(strategy.riskProfile)}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{strategy.riskProfile}</span>
            </div>
          )}
          {strategy.presetTier === "Hero" && (
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full">
              Featured
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Strategy Overview</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {displaySummary}
          </p>
          
          {strategy.whyUnique && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">What Makes This Strategy Unique</h5>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {strategy.whyUnique}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Indicators Used</h5>
              <div className="flex flex-wrap gap-1">
                {strategy.indicators?.map((ind: any, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
                    {typeof ind === 'string' ? ind.toUpperCase() : ind.id?.toUpperCase() || 'Unknown'}
                  </span>
                )) || [
                  <span key="default" className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
                    {strategy.indicatorLabel}
                  </span>
                ]}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Market Approach</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {strategy.designIntent === 'Momentum' ? 'Trades in the direction of market momentum' :
                 strategy.designIntent === 'MeanReversion' ? 'Capitalizes on price reversals from extremes' :
                 strategy.designIntent === 'Breakout' ? 'Enters positions when price breaks key levels' :
                 strategy.designIntent === 'Pullback' ? 'Enters on temporary retracements in trends' :
                 'Systematic approach to market entry and exit'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-neutral-700">
          <button 
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {backContext?.type === 'indicator' 
              ? `Back to ${backContext.indicatorName || 'Indicator'}` 
              : 'Back to Strategies'
            }
          </button>
          
          <div className="flex items-center gap-3">
            {selectedStrategies.has(strategyId) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Selected
              </div>
            )}
            <button 
              onClick={() => onStrategyToggle(strategyId, strategy)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                selectedStrategies.has(strategyId)
                  ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
              {selectedStrategies.has(strategyId) ? 'Deselect Strategy' : 'Select Strategy'}
        </button>
      </div>
        </div>
      </div>
    </div>
  );
}