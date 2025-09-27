"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";
import { Card } from "@/components/botforge/Card";
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
import RiskAndCapitalSection from "@/components/botforge/RiskAndCapitalSection";
import StrategySummaryBox from "@/components/botforge/StrategySummaryBox";
import EntryLogicSelect from "./components/EntryLogicSelect";
import AddConditionModal from "./components/AddConditionModal";
import EntryConditionsEditor from "@/app/strategy-builder/components/EntryConditions/EntryConditionsEditor";
import { FieldWithTooltip } from "@/components/ui/FieldWithTooltip";
import { useTooltips } from "@/hooks/useTooltips";
import type { Rule } from "@/app/strategy-builder/lib/types";

/** helpers */
function Section({ children }: any){ return <div className="grid gap-6 lg:grid-cols-2">{children}</div>; }
function Row({ children }: any){ return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>; }
function Num({ value, onChange, min=0, max=9999, step=1, disabled=false }: any){
  return <input type="number" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-400" value={value}
    min={min} max={max} step={step} disabled={disabled} onChange={(e)=>onChange(Number(e.target.value))}/>;
}
function Sel<T extends string>({ value, onChange, options, disabled=false }: {value:T; onChange:(v:T)=>void; options:T[]; disabled?:boolean}){
  return (
    <select className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-400" value={value} disabled={disabled} onChange={(e)=>onChange(e.target.value as T)}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function RSINum({ value, onChange, min=0, max=9999, step=1, disabled=false }: any){
  return <input type="number" className="w-full border-2 border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-400" value={value}
    min={min} max={max} step={step} disabled={disabled} onChange={(e)=>onChange(Number(e.target.value))}/>;
}
function RSISel<T extends string>({ value, onChange, options, disabled=false }: {value:T; onChange:(v:T)=>void; options:T[]; disabled?:boolean}){
  return (
    <select className="w-full border-2 border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-400" value={value} disabled={disabled} onChange={(e)=>onChange(e.target.value as T)}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Toggle({checked,onChange,label}:{checked:boolean; onChange:(v:boolean)=>void; label:string}){
  return <ToggleSlider checked={checked} onChange={onChange} label={label} size="sm" />;
}

function formatRuleForDisplay(rule: any): string {
  try {
    if (!rule) return "Invalid rule";
    
    // If this looks like an old/invalid rule, suggest clearing it
    if ((!rule.left || rule.left === "") && (!rule.right || rule.right === "") && (!rule.operator || rule.operator === "")) {
      return "Empty rule - consider removing";
    }
    
    let left = "Unknown";
    let operator = String(rule.operator || "unknown");
    let right = "Unknown";
  
    // Format left side - handle all possible types safely
    if (rule.left?.type === "indicator") {
      left = rule.left.id?.toUpperCase() || "Indicator";
    } else if (rule.left?.type === "price") {
      left = `Price ${rule.left.field || "close"}`;
    } else if (typeof rule.left === "string" && rule.left.trim() !== "") {
      left = rule.left;
    } else if (typeof rule.left === "number") {
      left = String(rule.left);
    } else if (rule.left && typeof rule.left === "object") {
      left = `[${rule.left.type || "object"}]`;
    }
    
    // Format operator
    const operatorMap: Record<string, string> = {
      "crosses_above": "crosses above",
      "crosses_below": "crosses below", 
      ">": "is above",
      "<": "is below",
      ">=": "is above or equal to",
      "<=": "is below or equal to",
      "==": "equals",
      "rising": "is rising",
      "falling": "is falling"
    };
    operator = operatorMap[operator] || operator;
    
    // Format right side - handle all possible types safely
    if (rule.right?.type === "indicator_param") {
      const paramName = rule.right.param || "parameter";
      const paramValue = rule.right.param === "oversold" ? "30" : 
                        rule.right.param === "overbought" ? "70" :
                        rule.right.param === "midline" ? "50" : "value";
      right = `${paramName} (${paramValue})`;
    } else if (rule.right?.type === "indicator") {
      right = rule.right.id?.toUpperCase() || "Indicator";
    } else if (rule.right?.type === "price") {
      right = `Price ${rule.right.field || "close"}`;
    } else if (typeof rule.right === "string" && rule.right.trim() !== "") {
      right = rule.right;
    } else if (typeof rule.right === "number") {
      right = String(rule.right);
    } else if (rule.right && typeof rule.right === "object") {
      right = `[${rule.right.type || "object"}]`;
    }
    
    // Add step name prefix for sequence rules
    let stepPrefix = "";
    if (rule.id && rule.id.includes("-")) {
      const parts = rule.id.split("-");
      if (parts.length >= 2) {
        const stepName = parts[0];
        if (stepName.toLowerCase() !== "rule") {
          stepPrefix = `${stepName}: `;
        }
      }
    }
    
    const result = `${stepPrefix}${left} ${operator} ${right}`;
    return result;
    
  } catch (error) {
    console.error("Error formatting rule:", error, rule);
    return "Error formatting rule";
  }
}

export default function Step4Advanced() {
  const { getTooltip } = useTooltips();
  const { 
    indicatorSelections, 
    setIndicators, 
    rules, 
    addRule, 
    removeRule, 
    updateRule, 
    setRules,
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

      // Seed rules only if none exist AND a specific strategy preset was selected (not just an indicator)
      const none = !rules || rules.length===0;
      const hasAppliedPreset = selectedPreset && rulesInitialized;
      if (none && !hasAppliedPreset) {
        // Find the primary preset (the one that was selected as a strategy with actual preset rules)
        const primaryPreset = nextSelections.find(sel => sel.presetRef && sel.presetRef !== 'default');
        if (primaryPreset) {
          const meta = await getIndicatorMeta(primaryPreset.id);
          const preset = findPreset(meta, primaryPreset.presetRef);
          
          // Only create rules if this preset actually has defined rules or a sequence
          // This prevents empty rules when someone just selects an indicator without a strategy
          if (preset && (preset.rules?.length > 0 || preset.sequence?.length > 0)) {
          const drafts = draftRulesFrom(meta, preset);
          if (drafts.length) {
              // Only add rules that have valid content (not empty)
              drafts.forEach((r)=> {
                if (r.left && r.operator && r.right) {
                  addRule({ 
              id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    family: "Price" as any,
                    left: r.left,
                    operator: r.operator,
                    right: r.right
                  });
                }
              });
            }
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

  /** INDICATOR PARAMS */
  function updateParam(indId:string, key:string, value:any){
    const next = indicatorSelections.map(s=> s.id===indId ? {...s, params:{...s.params,[key]:value}} : s);
    setIndicators(next);
  }

  /** RULE BUILDER STATE */
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [newRule, setNewRule] = useState({
    left: "",
    operator: "",
    right: ""
  });

  /** LOCAL RULE ORDER STATE */
  const [localRules, setLocalRules] = useState(rules);
  const [lastStoreRulesLength, setLastStoreRulesLength] = useState(rules.length);
  
  // Only sync when rules are added/removed, not when reordering
  useEffect(() => {
    // Only sync if the number of rules changed (add/remove) or if local rules is empty
    if (rules.length !== lastStoreRulesLength || localRules.length === 0) {
      setLocalRules(rules);
      setLastStoreRulesLength(rules.length);
    }
  }, [rules, lastStoreRulesLength, localRules.length]);

  /** ADVANCED PATCH HELPERS */
  function patch<K extends keyof AdvancedSettings>(key: K, v: AdvancedSettings[K]){
    setAdvanced({ ...advanced, [key]: v });
  }

  /** RULE BUILDER FUNCTIONS */
  function openRuleBuilder() {
    setShowRuleBuilder(true);
    setEditingRuleIndex(null);
    setNewRule({ left: "", operator: "", right: "" });
  }

  function openRuleEditor(ruleIndex: number) {
    const rule = rules[ruleIndex];
    if (!rule) return;

    // Convert rule back to form format
    let left = "";
    if (rule.left?.type === "indicator") {
      left = `${rule.left.id}.${rule.left.output || "value"}`;
    } else if (rule.left?.type === "price") {
      left = `price.${rule.left.field || "close"}`;
    } else if (typeof rule.left === "string") {
      left = rule.left;
    }

    let right = "";
    if (rule.right?.type === "indicator_param") {
      right = `${rule.right.indicator}_param_${rule.right.param}`;
    } else if (rule.right?.type === "indicator") {
      right = `${rule.right.id}.${rule.right.output || "value"}`;
    } else if (rule.right?.type === "price") {
      right = `price.${rule.right.field || "close"}`;
    } else if (typeof rule.right === "string" || typeof rule.right === "number") {
      right = String(rule.right);
    }

    setNewRule({
      left,
      operator: rule.operator || "",
      right
    });
    setEditingRuleIndex(ruleIndex);
    setShowRuleBuilder(true);
  }

  function closeRuleBuilder() {
    setShowRuleBuilder(false);
    setEditingRuleIndex(null);
    setNewRule({ left: "", operator: "", right: "" });
  }

  function saveRule() {
    if (!newRule.left || !newRule.operator || !newRule.right) {
      alert("Please fill in all fields");
      return;
    }

    const rule = {
      id: editingRuleIndex !== null ? rules[editingRuleIndex].id : `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      left: newRule.left.includes(".") ? 
        { type: newRule.left.startsWith("price.") ? "price" : "indicator", 
          id: newRule.left.split(".")[0], 
          output: newRule.left.split(".")[1],
          field: newRule.left.startsWith("price.") ? newRule.left.split(".")[1] : undefined 
        } :
        newRule.left,
      operator: newRule.operator,
      right: newRule.right.includes("_param_") ?
        { type: "indicator_param", indicator: newRule.right.split("_param_")[0], param: newRule.right.split("_param_")[1] } :
        newRule.right.includes(".") ?
        { type: newRule.right.startsWith("price.") ? "price" : "indicator",
          id: newRule.right.split(".")[0],
          output: newRule.right.split(".")[1],
          field: newRule.right.startsWith("price.") ? newRule.right.split(".")[1] : undefined
        } :
        newRule.right
    };

    if (editingRuleIndex !== null) {
      // Update existing rule
      updateRule(rule.id, rule);
    } else {
      // Add new rule
      addRule(rule);
    }
    
    closeRuleBuilder();
  }

  /** RULE REORDERING FUNCTIONS */
  function moveRuleUp(index: number) {
    if (index <= 0) return;
    
    // Update local rules immediately for instant visual feedback
    const newLocalRules = [...localRules];
    [newLocalRules[index - 1], newLocalRules[index]] = [newLocalRules[index], newLocalRules[index - 1]];
    setLocalRules(newLocalRules);
    
    // Update the store with the new order (won't trigger sync because length is same)
    setRules(newLocalRules);
  }

  function moveRuleDown(index: number) {
    if (index >= localRules.length - 1) return;
    
    // Update local rules immediately for instant visual feedback
    const newLocalRules = [...localRules];
    [newLocalRules[index], newLocalRules[index + 1]] = [newLocalRules[index + 1], newLocalRules[index]];
    setLocalRules(newLocalRules);
    
    // Update the store with the new order (won't trigger sync because length is same)
    setRules(newLocalRules);
  }

  /** GET OPTIONS FOR SELECTED INDICATORS */
  function getLeftOptions() {
    const options: Array<{value: string, label: string}> = [];
    
    // Add price options
    options.push(
      { value: "price.close", label: "Price Close" },
      { value: "price.open", label: "Price Open" },
      { value: "price.high", label: "Price High" },
      { value: "price.low", label: "Price Low" }
    );

    // Add indicator options based on selected indicators
    indicatorSelections.forEach(sel => {
      const meta = metaById[sel.id];
      if (meta) {
        options.push({
          value: `${sel.id}.value`,
          label: `${meta.identity?.label || sel.id.toUpperCase()} Value`
        });
      }
    });

    return options;
  }

  function getOperatorOptions() {
    return [
      { value: ">", label: "is above" },
      { value: "<", label: "is below" },
      { value: ">=", label: "is above or equal to" },
      { value: "<=", label: "is below or equal to" },
      { value: "==", label: "equals" },
      { value: "crosses_above", label: "crosses above" },
      { value: "crosses_below", label: "crosses below" },
      { value: "rising", label: "is rising" },
      { value: "falling", label: "is falling" }
    ];
  }

  function getRightOptions() {
    const options: Array<{value: string, label: string}> = [];
    
    // Add price options
    options.push(
      { value: "price.close", label: "Price Close" },
      { value: "price.open", label: "Price Open" },
      { value: "price.high", label: "Price High" },
      { value: "price.low", label: "Price Low" }
    );

    // Add indicator values
    indicatorSelections.forEach(sel => {
      const meta = metaById[sel.id];
      if (meta) {
        options.push({
          value: `${sel.id}.value`,
          label: `${meta.identity?.label || sel.id.toUpperCase()} Value`
        });

        // Add indicator parameters (like RSI overbought, oversold, etc.)
        if (meta.params) {
          Object.keys(meta.params).forEach(paramKey => {
            const param = meta.params[paramKey];
            if (param.type === "number") {
              options.push({
                value: `${sel.id}_param_${paramKey}`,
                label: `${meta.identity?.label || sel.id.toUpperCase()} ${param.label || paramKey} (${param.default})`
              });
            }
          });
        }
      }
    });

    // Add static numbers
    for (let i = 0; i <= 100; i += 10) {
      options.push({ value: i.toString(), label: i.toString() });
    }

    return options;
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <PageHeader title="Advanced Settings" subtitle="Configure strategy parameters, entry logic, and exit controls for your bot" />
        <Stepper current="advanced" />

        {/* Entry Conditions */}
        <Card className="mt-2.5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entry Conditions</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure entry rules and logic for your strategy.</p>
            </div>
          </div>
          
          <div className="mt-3">
            <EntryLogicSelect />

            {/* Advanced Settings - Direct render, no gap */}
            {showAdvancedSettings && (
              <>
                {/* Indicator Settings - Full Width when present */}
                {indicatorSelections.length > 0 && (
                  <div className="mt-4 mb-4">
                    <div className="space-y-3">
                      {Array.from(new Map(indicatorSelections.map(sel => [sel.id, sel])).values()).map((sel: IndicatorSelection) => {
                        const meta = metaById[sel.id];
                        const isEMA = sel.id === "ema";
                        const title = isEMA ? "EMA" : `${meta?.identity?.label || sel.id}`;
                        const params = meta?.params || {};
                        const hasSchema = Object.keys(params).length > 0;

                        // For EMA, render settings without tile wrapper
                        if (isEMA) {
                          return (
                            <div key={sel.id} className="space-y-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{title}</div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <label className="text-sm">
                                  <div className="mb-2 font-medium text-gray-900 dark:text-white">Length</div>
                                  <Num value={Number(sel.params?.length ?? 50)} onChange={(v)=>updateParam(sel.id,"length",v)} min={1} max={500}/>
                                </label>
                                <label className="text-sm">
                                  <div className="mb-2 font-medium text-gray-900 dark:text-white">Price Source</div>
                                  <Sel value={String(sel.params?.priceSource ?? "close")} onChange={(v)=>updateParam(sel.id,"priceSource",v)} options={["close","open","high","low","hl2","ohlc4"]}/>
                                </label>
                              </div>
                            </div>
                          );
                        }

                        // For other indicators, render with tile wrapper
                        return (
                          <div key={sel.id} className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">{title}</div>
                            </div>
                            {hasSchema ? (
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.keys(params).map((k) => {
                                  const p = params[k];
                                  const val = sel.params?.[k] ?? p.default ?? 0;
                                  if (p?.enum?.length) {
                                    return (
                                      <FieldWithTooltip
                                        key={k} 
                                        label={p.label || k}
                                        tooltip={getTooltip(`indicators.${sel.id.toLowerCase()}.${k.toLowerCase()}`) || `Configure ${p.label || k} parameter`}
                                      >
                                        <RSISel value={val} onChange={(v)=>updateParam(sel.id,k,v)} options={p.enum}/>
                                      </FieldWithTooltip>
                                    );
                                  }
                                  return (
                                    <FieldWithTooltip
                                      key={k} 
                                      label={p.label || k}
                                      tooltip={getTooltip(`indicators.${sel.id.toLowerCase()}.${k.toLowerCase()}`) || `Configure ${p.label || k} parameter`}
                                    >
                                      <RSINum value={val} onChange={(v)=>updateParam(sel.id,k,v)} min={p.min} max={p.max} step={p.step}/>
                                    </FieldWithTooltip>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400">No configurable parameters for this indicator.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Strategy & Filter Settings Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4 mb-4">
                  {/* Strategy Settings */}
                  <FieldWithTooltip 
                    label="Confirmation Bars" 
                    tooltip={getTooltip('step4.confirmationBars')}
                  >
                    <Num value={advanced.strategy?.confirmationBars || 0} onChange={(v)=>setAdvanced({...advanced, strategy:{...(advanced.strategy || {}), confirmationBars:v}})} min={0} max={20}/>
                  </FieldWithTooltip>
                  <FieldWithTooltip 
                    label="Max Entries per Candle" 
                    tooltip={getTooltip('step4.maxEntriesPerCandle')}
                  >
                    <Num value={advanced.strategy?.maxEntriesPerCandle || 1} onChange={(v)=>setAdvanced({...advanced, strategy:{...(advanced.strategy || {}), maxEntriesPerCandle:v}})} min={1} max={10}/>
                  </FieldWithTooltip>
                  <FieldWithTooltip 
                    label="Re-entry Cooldown" 
                    tooltip={getTooltip('step4.reentryCooldown')}
                  >
                    <Num value={advanced.strategy?.reentryCooldownBars || 0} onChange={(v)=>setAdvanced({...advanced, strategy:{...(advanced.strategy || {}), reentryCooldownBars:v}})} min={0} max={500}/>
                  </FieldWithTooltip>

                  {/* Filters */}
                  <FieldWithTooltip 
                    label="Higher Timeframe Filter" 
                    tooltip={getTooltip('step4.higherTimeframeFilter')}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={advanced.filters?.htfTrend?.enabled || false}
                        onChange={(e) => setAdvanced({...advanced, filters:{...(advanced.filters || {}), htfTrend:{...(advanced.filters?.htfTrend || {}), enabled:e.target.checked}}})}
                        className="rounded"
                      />
                      <Sel 
                        value={advanced.filters?.htfTrend?.timeframe || "1h"} 
                        onChange={(v)=>setAdvanced({...advanced, filters:{...(advanced.filters || {}), htfTrend:{...(advanced.filters?.htfTrend || {}), timeframe:v}}})} 
                        options={["15m","1h","4h","1d"]}
                        disabled={!advanced.filters?.htfTrend?.enabled}
                      />
                    </div>
                  </FieldWithTooltip>
                  <FieldWithTooltip 
                    label="Volume Filter" 
                    tooltip={getTooltip('step4.volumeFilter')}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={advanced.filters?.volume?.enabled || false}
                        onChange={(e) => setAdvanced({...advanced, filters:{...(advanced.filters || {}), volume:{...(advanced.filters?.volume || {}), enabled:e.target.checked, min: e.target.checked ? (advanced.filters?.volume?.min || 1000) : 0}}})}
                        className="rounded"
                      />
                      <Num 
                        value={advanced.filters?.volume?.min || 1000} 
                        onChange={(v)=>setAdvanced({...advanced, filters:{...(advanced.filters || {}), volume:{...(advanced.filters?.volume || {}), min:v}}})} 
                        min={0}
                        disabled={!advanced.filters?.volume?.enabled}
                      />
                    </div>
                  </FieldWithTooltip>
                  <FieldWithTooltip 
                    label="ATR Activity Filter" 
                    tooltip={getTooltip('step4.atrActivityFilter')}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={advanced.filters?.atrActivity?.enabled || false}
                        onChange={(e) => setAdvanced({...advanced, filters:{...(advanced.filters || {}), atrActivity:{...(advanced.filters?.atrActivity || {}), enabled:e.target.checked, min: e.target.checked ? (advanced.filters?.atrActivity?.min || 1.0) : 0}}})}
                        className="rounded"
                      />
                      <Num 
                        value={advanced.filters?.atrActivity?.min || 1.0} 
                        onChange={(v)=>setAdvanced({...advanced, filters:{...(advanced.filters || {}), atrActivity:{...(advanced.filters?.atrActivity || {}), min:v}}})} 
                        min={0} 
                        step={0.1}
                        disabled={!advanced.filters?.atrActivity?.enabled}
                      />
                    </div>
                  </FieldWithTooltip>
                </div>
              </>
            )}

            {/* Add Condition (Left) and Show More/Less (Center) - Same Line */}
            <div className="flex items-center mt-4 mb-4 relative">
              <button
                onClick={openRuleBuilder}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Condition
              </button>
              
              <button 
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors rounded text-xs text-gray-500 absolute left-1/2 -translate-x-1/2"
              >
                <span>{showAdvancedSettings ? 'Show less' : 'Show more'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedSettings ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Rule Builder Form */}
            {showRuleBuilder && (
              <div className="mb-4 p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {editingRuleIndex !== null ? `Edit Condition ${String.fromCharCode(65 + editingRuleIndex)}` : 'Add New Condition'}
                  </h4>
                  <button 
                    onClick={closeRuleBuilder}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Left Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Left Side</label>
                    <select
                      value={newRule.left}
                      onChange={(e) => setNewRule({...newRule, left: e.target.value})}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select left side...</option>
                      {getLeftOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Operator Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Operator</label>
                    <select
                      value={newRule.operator}
                      onChange={(e) => setNewRule({...newRule, operator: e.target.value})}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select operator...</option>
                      {getOperatorOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                </div>
                
                  {/* Right Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Right Side</label>
                    <select
                      value={newRule.right}
                      onChange={(e) => setNewRule({...newRule, right: e.target.value})}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select right side...</option>
                      {getRightOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <button 
                    onClick={closeRuleBuilder}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRule}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    {editingRuleIndex !== null ? 'Update Condition' : 'Add Condition'}
                  </button>
                </div>
              </div>
            )}

            {/* Entry Conditions Display */}
            <div className="mt-4 space-y-3">
              {localRules.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-blue-600 dark:text-blue-400 font-medium">No entry conditions configured yet.</p>
                  <p className="text-sm mt-1 text-muted-foreground">Select a strategy on Step 2 to auto-populate conditions, or click "Add Condition" above.</p>
                </div>
              ) : (
                localRules.map((rule, index) => (
                  <div key={String(rule.id || `rule-${index}`)} className="flex items-center gap-3 p-3 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {formatRuleForDisplay(rule)}
                      </div>
                    </div>
                          <div className="flex items-center gap-2">
                      {/* Reorder buttons */}
                      <div className="flex flex-col">
                        <button 
                          onClick={() => moveRuleUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                            index === 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400'
                          }`}
                          title="Move up"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => moveRuleDown(index)}
                          disabled={index === localRules.length - 1}
                          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                            index === localRules.length - 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400'
                          }`}
                          title="Move down"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                          </div>
                      
                      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                      
                            <button 
                        onClick={() => {
                          // Find the corresponding index in the store
                          const ruleToEdit = localRules[index];
                          const storeIndex = rules.findIndex(r => r.id === ruleToEdit.id);
                          if (storeIndex !== -1) {
                            openRuleEditor(storeIndex);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm underline"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                          // Find the rule in the store and remove it
                          const ruleToRemove = localRules[index];
                          const storeIndex = rules.findIndex(r => r.id === ruleToRemove.id);
                          if (storeIndex !== -1) {
                            removeRule(storeIndex);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 text-sm underline"
                      >
                        Remove
                            </button>
                          </div>
                        </div>
                ))
              )}
            </div>
          </div>

        </Card>


        {/* Exit Conditions Section */}
        <Card className="mt-2.5">
          <RiskControlsSection />
        </Card>

        {/* Risk and Capital Section */}
        <Card className="mt-2.5">
          <RiskAndCapitalSection />
        </Card>

        {/* Strategy Summary */}
          <Card className="mt-2.5">
          <div className="flex items-center justify-between mb-4">
            <div>
                <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strategy Summary</h3>
                </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review your strategy configuration</p>
                    </div>
                  </div>
          <StrategySummaryBox />
          </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button onClick={() => window.location.href = '/strategy-builder/step3'} className="rounded-xl border border-gray-300 dark:border-neutral-600 px-6 py-3 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium">
            Back to Strategy & Indicators
          </button>
          <button onClick={() => window.location.href = '/strategy-builder/step7'} className="rounded-xl bg-blue-600 text-white px-6 py-3 shadow-sm hover:bg-blue-700 transition-colors font-medium">
            Continue to Strategy Review & Backtest
          </button>
        </div>
      </div>
    </div>
  );
}
