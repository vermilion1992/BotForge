"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";
import { Card, CardTitle, Small } from "@/components/botforge/Card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Info, ChevronDown, ChevronRight } from "lucide-react";
import { useBuilderStore, type IndicatorSelection, type AdvancedSettings, defaultAdvanced } from "@/botforge/state/builderStore";
import { fetchAllIndicatorMetas, getIndicatorMeta, findPreset, paramsFromPresetFor, mergeRiskDefaults, draftRulesFrom } from "@/botforge/lib/indicators";
import { sortRulesAlpha } from "@/botforge/lib/rule_alpha";
import { ruleSentence } from "@/botforge/lib/friendly";
import { DEBUG_SUMMARY } from "@/botforge/lib/selectors/summarySelectors";
import { getFriendlyRuleTitle, getRuleAlphaLabel } from "@/botforge/lib/ruleTitles";
import ToggleSlider from "@/components/botforge/ToggleSlider";
import RiskControlsSection from "@/components/botforge/RiskControlsSection";
import StrategySummaryBox from "@/components/botforge/StrategySummaryBox";
import EntryLogicSelect from "./components/EntryLogicSelect";
import AddConditionModal from "./components/AddConditionModal";
import EntryConditionsEditor from "@/app/strategy-builder/components/EntryConditions/EntryConditionsEditor";
import type { Rule } from "@/app/strategy-builder/lib/types";

/** helpers */
function Section({ children }: any){ return <div className="grid gap-6 lg:grid-cols-2">{children}</div>; }
function Row({ children }: any){ return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>; }
function Num({ value, onChange, min=0, max=9999, step=1 }: any){
  return <input type="number" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={value}
    min={min} max={max} step={step} onChange={(e)=>onChange(Number(e.target.value))}/>;
}
function Sel<T extends string>({ value, onChange, options }: {value:T; onChange:(v:T)=>void; options:T[]}){
  return (
    <select className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={value} onChange={(e)=>onChange(e.target.value as T)}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Toggle({checked,onChange,label}:{checked:boolean; onChange:(v:boolean)=>void; label:string}){
  return <ToggleSlider checked={checked} onChange={onChange} label={label} size="sm" />;
}

export default function Step4Advanced() {
  const { 
    indicatorSelections, 
    setIndicators, 
    rules, 
    addRule, 
    removeRule, 
    updateRule, 
    advanced, 
    setAdvanced, 
    selectedPreset, 
    rulesInitialized, 
    applyPresetById,
    ui,
    beginAddRule,
    cancelRuleEdit,
    beginEditRule,
    summaryMode,
    setSummaryMode
  } = useBuilderStore();

  // load indicator metas for dynamic params editor (EMA etc.)
  const [metas, setMetas] = useState<any[]>([]);
  useEffect(()=>{ fetchAllIndicatorMetas().then(setMetas); }, []);
  const metaById = useMemo(()=> Object.fromEntries(metas.map((m:any)=>[m.identity.id,m])),[metas]);

  // New rules state for Entry Conditions Editor
  const [newRules, setNewRules] = useState<Rule[]>([]);

  // Auto-apply presets into params/risk/exits and seed rules (once)
  useEffect(()=>{
    (async ()=>{
      if (!indicatorSelections.length) return;

      // Snapshots we can mutate locally then commit once
      let nextSelections = [...indicatorSelections];
      let changedSelections = false;
      let riskSnap = {};
      let advSnap = structuredClone(advanced);

      for (let i=0;i<nextSelections.length;i++){
        const sel = nextSelections[i];
        const meta = await getIndicatorMeta(sel.id);
        if (!meta) continue;
        const preset = findPreset(meta, sel.presetRef);
        // Ensure presetRef is concrete
        if (preset?.id && sel.presetRef !== preset.id) {
          nextSelections[i] = { ...sel, presetRef: preset.id };
          changedSelections = true;
        }
        // If params empty, hydrate from preset
        if (!sel.params || Object.keys(sel.params).length===0) {
          const p = paramsFromPresetFor(meta, preset);
          nextSelections[i] = { ...nextSelections[i], params: { ...p } };
          changedSelections = true;
        }
        // Merge risk defaults from each preset
        const merged = mergeRiskDefaults({ risk: riskSnap, advanced: advSnap }, preset?.riskDefaults);
        riskSnap = merged.risk;
        advSnap = merged.advanced;
      }

      if (changedSelections) setIndicators(nextSelections);
      
      // Apply risk settings if any were merged
      if (Object.keys(riskSnap).length > 0) {
        // Note: riskSettings might not be available in this store, so we'll skip for now
        console.log('Risk settings would be applied:', riskSnap);
      }
      if (Object.keys(advSnap).length > 0) {
        setAdvanced(advSnap);
      }

      // Seed rules only if none exist
      const none = !rules || rules.length===0;
      if (none) {
        // Find the primary preset (the one that was selected as a strategy)
        const primaryPreset = nextSelections.find(sel => sel.presetRef && sel.presetRef !== 'default');
        if (primaryPreset) {
          const meta = await getIndicatorMeta(primaryPreset.id);
          const preset = findPreset(meta, primaryPreset.presetRef);
          const drafts = draftRulesFrom(meta, preset);
          if (drafts.length) {
            // Add each draft rule
            drafts.forEach((r)=>addRule({ 
              id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              family: "Price" as any,
              left: r.left || "",
              operator: r.operator || "",
              right: r.right || ""
            }));
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorSelections.length]);

  // Auto-apply preset rules and sequence when a preset is selected
  useEffect(() => {
    if (selectedPreset && !rulesInitialized) {
      applyPresetById(selectedPreset.id, selectedPreset);
      if (DEBUG_SUMMARY) {
        // eslint-disable-next-line no-console
        console.debug("[Summary] Auto-applied preset to populate rules/sequence/risk.");
      }
    }
  }, [selectedPreset, rulesInitialized, applyPresetById]);

  // collapsible sections state
  const [isAdvancedStrategyOpen, setIsAdvancedStrategyOpen] = useState(false);

  /** INDICATOR PARAMS */
  function updateParam(indId:string, key:string, value:any){
    const next = indicatorSelections.map(s=> s.id===indId ? {...s, params:{...s.params,[key]:value}} : s);
    setIndicators(next);
  }
  function resetIndicatorParams(){
    const cleared = indicatorSelections.map(s => ({...s, params: {}}));
    setIndicators(cleared);
  }

  /** ENTRY RULES */
  const operators = [">",">=","<","<=","==","crosses_above","crosses_below","rising","falling","within","outside"];
  const [draft,setDraft] = useState({ left:"", operator:">", right:"" });
  
  function addCondition(){
    if (!draft.left || !draft.operator) return;
    addRule({ 
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      family: "Price", // Default family
      left: draft.left, 
      operator: draft.operator as any, 
      right: draft.right 
    });
    setDraft({ left:"", operator:">", right:"" });
    cancelRuleEdit();
  }

  /** ADVANCED PATCH HELPERS */
  function patch<K extends keyof AdvancedSettings>(key: K, v: AdvancedSettings[K]){
    setAdvanced({ ...advanced, [key]: v });
  }
  function movePriority(idx:number, dir:-1|1){
    const p = [...advanced.exits.priority];
    const j = idx + dir; if (j<0 || j>=p.length) return;
    const t = p[idx]; p[idx]=p[j]; p[j]=t;
    patch("exits", { ...advanced.exits, priority: p });
  }
  function resetAllAdvanced(){ setAdvanced(defaultAdvanced()); }

  const priorityLabel: Record<string,string> = {
    default: "Default SL/TP",
    multiTP: "Multi-Target Profit Taking",
    breakeven: "Break-even Stop",
    trailing: "Trailing Stop",
    atrStop: "ATR Stop Loss",
    timeExit: "Time-based Exit"
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <PageHeader title="Advanced Settings" subtitle="Configure strategy parameters, entry logic, and exit controls for your bot" />
        <Stepper current="advanced" />


        {/* ————————————————— Entry Conditions */}
        <Card className="mt-2.5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Entry Conditions</CardTitle>
              <Small>Configure entry rules and logic for your strategy.</Small>
            </div>
          </div>
          
          
          <div className="mt-3">
            {/* Entry Logic, Trade Direction, and Trading Timeframe */}
            <div className="mb-4">
              <EntryLogicSelect />
            </div>

            {/* Add Condition Button */}
            <div className="mt-4 flex justify-between items-center">
              <AddConditionModal />
              <div className="text-sm text-muted-foreground">
                {rules.length} condition{rules.length !== 1 ? 's' : ''} configured
              </div>
            </div>

            {/* Rule Editor - Only show when adding or editing */}
            {(ui?.addingNew || ui?.ruleEditorOpenId) && (
              <div className="mt-4 rounded-lg border p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">
                    {ui.addingNew ? "Add New Condition" : "Edit Condition"}
                  </h4>
                  <button 
                    onClick={cancelRuleEdit}
                    className="text-xs underline"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm">
                    <div className="mb-1 text-muted-foreground">Left</div>
                    <input 
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="e.g., price.close, rsi.value" 
                      value={draft.left}
                      onChange={(e) => setDraft({...draft, left: e.target.value})}
                    />
                  </label>
                  <label className="text-sm">
                    <div className="mb-1 text-muted-foreground">Operator</div>
                    <Sel 
                      value={draft.operator as any} 
                      onChange={(v) => setDraft({...draft, operator: v})} 
                      options={operators as any}
                    />
                  </label>
                  <label className="text-sm">
                    <div className="mb-1 text-muted-foreground">Right</div>
                    <input 
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="e.g., 50, ema.value" 
                      value={draft.right}
                      onChange={(e) => setDraft({...draft, right: e.target.value})}
                    />
                  </label>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={addCondition} 
                    className="px-4 py-2 text-sm rounded-xl border bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    {ui.addingNew ? "Add Condition" : "Update Condition"}
                  </button>
                  <button 
                    onClick={cancelRuleEdit}
                    className="px-4 py-2 text-sm rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Entry Conditions Editor */}
            <div className="mt-4">
              <EntryConditionsEditor mode="Guided" value={newRules} onChange={setNewRules} />
            </div>


            {/* Configuration Chips - with visual context */}
            <div className="mt-6 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/30 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Advanced Configuration</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Select a configuration type to adjust settings</p>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAdvanced({...advanced, selectedConfig: advanced.selectedConfig === "indicators" ? null : "indicators"})}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    advanced.selectedConfig === "indicators" 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  }`}
                >
                  Indicator Settings
                </button>
                <button
                  onClick={() => setAdvanced({...advanced, selectedConfig: advanced.selectedConfig === "strategy" ? null : "strategy"})}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    advanced.selectedConfig === "strategy" 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  }`}
                >
                  Strategy Settings
                </button>
                <button
                  onClick={() => setAdvanced({...advanced, selectedConfig: advanced.selectedConfig === "filters" ? null : "filters"})}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    advanced.selectedConfig === "filters" 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  }`}
                >
                  Filters
                </button>
              </div>

              {/* Configuration Content - now inside the box */}
              {advanced.selectedConfig === "indicators" && (
                <div className="rounded-lg border p-4 bg-white dark:bg-neutral-800/50">
                  {indicatorSelections.length===0 ? (
                    <p className="text-xs text-muted-foreground">No indicator selected yet. Choose one in Step 3.</p>
                  ) : (
                    <div className="space-y-3">
                      {indicatorSelections.map((sel: IndicatorSelection)=>{
                        const meta = metaById[sel.id];
                        const isEMA = sel.id==="ema";
                        const title = isEMA ? "EMA" : `${meta?.identity?.label || sel.id}`;
                        const params = meta?.params || {};
                        const hasSchema = Object.keys(params).length>0;

                        // For EMA, render settings without tile wrapper
                        if (isEMA) {
                          return (
                            <div key={sel.id} className="space-y-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{title}</div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <label className="text-xs">
                                  <div className="mb-1 text-gray-900 dark:text-white">Length</div>
                                  <Num value={Number(sel.params?.length ?? 50)} onChange={(v)=>updateParam(sel.id,"length",v)} min={1} max={500}/>
                                </label>
                                <label className="text-xs">
                                  <div className="mb-1 text-gray-900 dark:text-white">Price Source</div>
                                  <Sel value={String(sel.params?.priceSource ?? "close")} onChange={(v)=>updateParam(sel.id,"priceSource",v)} options={["close","open","high","low","hl2","ohlc4"]}/>
                                </label>
                              </div>
                            </div>
                          );
                        }

                        // For other indicators, render with tile wrapper
                        return (
                          <div key={sel.id} className="rounded-lg border p-3 bg-white dark:bg-neutral-900/60">
                            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{title}</div>
                            {hasSchema ? (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {Object.keys(params).map((k)=>{
                                  const p = params[k];
                                  const val = sel.params?.[k] ?? p.default ?? 0;
                                  if (p?.enum?.length) {
                                    return (
                                      <label key={k} className="text-xs">
                                        <div className="mb-1 text-gray-900 dark:text-white">{p.label || k}</div>
                                        <Sel value={val} onChange={(v)=>updateParam(sel.id,k,v)} options={p.enum}/>
                                      </label>
                                    );
                                  }
                                  return (
                                    <label key={k} className="text-xs">
                                      <div className="mb-1 text-gray-900 dark:text-white">{p.label || k}</div>
                                      <Num value={val} onChange={(v)=>updateParam(sel.id,k,v)} min={p.min??0} max={p.max??1000} step={p.step??1}/>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2">
                                <label className="text-xs">
                                  <div className="mb-1 text-gray-900 dark:text-white">Length</div>
                                  <Num value={Number(sel.params?.length ?? 50)} onChange={(v)=>updateParam(sel.id,"length",v)} min={1} max={500}/>
                                </label>
                                <label className="text-xs">
                                  <div className="mb-1 text-gray-900 dark:text-white">Price Source</div>
                                  <Sel value={String(sel.params?.priceSource ?? "close")} onChange={(v)=>updateParam(sel.id,"priceSource",v)} options={["close","open","high","low","hl2","ohlc4"]}/>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {advanced.selectedConfig === "strategy" && (
                <div className="rounded-lg border p-4 bg-white dark:bg-neutral-800/50">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-xs">
                      <div className="mb-1 text-gray-900 dark:text-white">Confirmation Bars</div>
                      <Num value={advanced.strategy.confirmationBars} onChange={(v)=>setAdvanced({...advanced, strategy:{...advanced.strategy, confirmationBars:v}})} min={0} max={20}/>
                    </label>
                    <label className="text-xs">
                      <div className="mb-1 text-gray-900 dark:text-white">Max Entries per Candle</div>
                      <Num value={advanced.strategy.maxEntriesPerCandle || 1} onChange={(v)=>setAdvanced({...advanced, strategy:{...advanced.strategy, maxEntriesPerCandle:v}})} min={1} max={10}/>
                    </label>
                    <label className="text-xs">
                      <div className="mb-1 text-gray-900 dark:text-white">Re-entry Cooldown</div>
                      <Num value={advanced.strategy.reentryCooldownBars} onChange={(v)=>setAdvanced({...advanced, strategy:{...advanced.strategy, reentryCooldownBars:v}})} min={0} max={500}/>
                    </label>
                  </div>
                </div>
              )}

              {advanced.selectedConfig === "filters" && (
                <div className="rounded-lg border p-4 bg-white dark:bg-neutral-800/50">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-gray-900 dark:text-white">Higher Timeframe Trend</div>
                        <Toggle checked={advanced.filters.htfTrend.enabled} onChange={(v)=>setAdvanced({...advanced, filters:{...advanced.filters, htfTrend:{...advanced.filters.htfTrend, enabled:v}}})} />
                      </div>
                      <Sel value={advanced.filters.htfTrend.timeframe} onChange={(v)=>setAdvanced({...advanced, filters:{...advanced.filters, htfTrend:{...advanced.filters.htfTrend, timeframe:v}}})} options={["15m","1h","4h","1d"]}/>
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-gray-900 dark:text-white">Volume</div>
                        <Toggle checked={advanced.filters.volume.enabled} onChange={(v)=>setAdvanced({...advanced, filters:{...advanced.filters, volume:{...advanced.filters.volume, enabled:v}}})} />
                      </div>
                      <Num value={advanced.filters.volume.min} onChange={(v)=>setAdvanced({...advanced, filters:{...advanced.filters, volume:{...advanced.filters.volume, min:v}}})} min={0}/>
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-gray-900 dark:text-white">ATR Activity</div>
                        <Toggle checked={advanced.filters.atrActivity.enabled} onChange={(v)=>setAdvanced({...advanced, filters:{...advanced.filters, atrActivity:{...advanced.filters.atrActivity, enabled:v}}})} />
                      </div>
                      <Num value={advanced.filters.atrActivity.min} onChange={(v)=>setAdvanced({...advanced, filters:{...advanced.filters, atrActivity:{...advanced.filters.atrActivity, min:v}}})} min={0} step={0.1}/>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Risk Controls Section - moved here from bottom */}
            <div className="mt-6">
              <RiskControlsSection />
            </div>
          </div>
        </Card>

        {/* ————————————————— Strategy Summary */}
        <Card className="mt-2.5">
          <div className="flex items-center justify-between">
            <CardTitle>Strategy Summary</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <div className="inline-flex rounded-md border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSummaryMode("guided")}
                  className={`px-3 py-1.5 text-sm ${summaryMode === "guided" ? "bg-blue-500 text-white font-medium" : "bg-background hover:bg-gray-50"}`}
                  aria-pressed={summaryMode === "guided"}
                >
                  Guided
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryMode("expert")}
                  className={`px-3 py-1.5 text-sm border-l ${summaryMode === "expert" ? "bg-blue-500 text-white font-medium" : "bg-background hover:bg-gray-50"}`}
                  aria-pressed={summaryMode === "expert"}
                >
                  Expert
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <StrategySummaryBox />
          </div>
        </Card>






        {/* ————————————————— Navigation Buttons */}
        <div className="mt-2.5 flex justify-between">
          <button onClick={() => window.history.back()} className="rounded-xl border border-gray-300 dark:border-neutral-600 px-6 py-3 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium">
            Back to Strategy & Indicators
          </button>
          <button onClick={() => window.location.href = '/strategy-builder/step5'} className="rounded-xl bg-blue-600 text-white px-6 py-3 shadow-sm hover:bg-blue-700 transition-colors font-medium">
            Continue to Risk Management
          </button>
        </div>
        </div>
      </TooltipProvider>
  );
}