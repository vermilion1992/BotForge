"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizePresetToStoreShape } from "@/botforge/utils/presetApply";

// ---------- Risk/Exits canonical shape helpers ----------
type PartialDeep<T> = { [K in keyof T]?: PartialDeep<T[K]> } & {};
function toNum(v:any){ const n = Number(v); return isFinite(n) ? n : undefined; }
function canonExits(ex:any, fallback?:any){
  const out:any = { ...fallback, ...ex };
  // Coerce numeric fields
  if (out.defaultSLPct != null) out.defaultSLPct = toNum(out.defaultSLPct);
  if (out.defaultTPPct != null) out.defaultTPPct = toNum(out.defaultTPPct);
  if (Array.isArray(out.tpStepsPct)) out.tpStepsPct = out.tpStepsPct.map(toNum).filter(x=>x!=null);
  if (Array.isArray(out.tpAllocPct)) out.tpAllocPct = out.tpAllocPct.map(toNum).filter(x=>x!=null);
  return out;
}

export type IndicatorSelection = { id: string; presetRef: string; params: Record<string, any> };

type RuleFamily = "Price"|"Momentum"|"Volatility"|"Volume";
type Rule = { id: string; family: RuleFamily; left: string; operator: string; right: string };

export interface AdvancedSettings {
  entry: { logic:"AND"|"OR"; tradeDirection:"LongOnly"|"ShortOnly"|"Both"; inverseSignals:boolean; };
  strategy: { confirmationBars:number; reentryCooldownBars:number; oneTradePerSession:boolean; };
  filters: {
    htfTrend: { enabled:boolean; timeframe:"15m"|"1h"|"4h"|"1d"; direction:"Up"|"Down"|"Both"; };
    volume: { enabled:boolean; min:number; };
    atrActivity: { enabled:boolean; min:number; };
  };
  exits: {
    defaultSLPct:number; defaultTPPct:number;
    multiTP:{ enabled:boolean; targets:Array<{ tpPct:number; allocationPct:number }> };
    breakeven:{ enabled:boolean; triggerRR:number };
    trailing:{ enabled:boolean; mode:"ATR"|"Percent"; atrMult:number; percent:number };
    atrStop:{ enabled:boolean; atrMult:number };
    timeExit:{ enabled:boolean; bars:number };
    priority:Array<"default"|"multiTP"|"breakeven"|"trailing"|"atrStop"|"timeExit">;
  };
}

export interface RiskSettings {
  riskPerTradePct: number;
  leverage: number;
  maxConcurrentTrades: number;
  notionalCapPerTrade?: number;
  dailyDrawdownStopPct?: number;
  positionSizing: "FixedPct"|"Volatility"|"Custom";
}

type Bias = "long_only" | "short_only" | "both";
type RuleGroup = { mode: "ALL"|"ANY"|"K_OF_N"; k?: number };

export type RuleGroupMode = "AND" | "OR" | "SEQUENCE";
export interface SequenceSpec {
  enabled: boolean;
  first?: string;     // "A" | "B" | ...
  then?: string;      // "B" | "C" | ...
  withinBars: number; // default 3
}

export interface BuilderState {
  marketType: "spot"|"perp";
  pairs: string[];
  timeframe?: string;
  lookback?: "7d"|"30d"|"90d"|"1y"|"3y";
  strategyId?: string;
  riskSettings: RiskSettings;
  indicatorSelections: IndicatorSelection[];
  rules: Rule[];
  advanced: AdvancedSettings;
  filters: {
    enabled: boolean;
    scope: "each" | "reference" | "both";
    referenceSymbol: string;
    clauses: Array<{ type: "htf_trend"; tf: "1h"|"4h"|"1D"; ma: "ema"|"sma"; length: number; mode: "price_above"|"slope_rising" } | { type: "atr_band"; length: number; minPct: number; maxPct: number } | { type: "volume"; mode: "sma_gt"; fast: number; slow: number }>;
  };
  sequence: {
    enabled: boolean;
    ruleAId?: string;
    ruleBId?: string;
    withinBars: number;
  };
  selectedPreset?: any;
  rulesInitialized: boolean;
  ruleGroup?: RuleGroup;
  ruleGroupMode: RuleGroupMode;
  sequence: SequenceSpec;
  ui: { ruleEditorOpenId: null | string; addingNew: boolean };

  // Canonical keys the summary reads
  pairsPreset?: { setName?: string; selectedCount?: number };
  direction?: Bias;
  inverseSignals?: boolean;
  riskProfile?: string;
  summaryVersion: number;
  summaryMode?: "guided" | "expert";
  risk?: any;

  setMarketType:(m:"spot"|"perp")=>void;
  setPairs:(p:string[])=>void;
  setTimeframe:(tf:string)=>void;
  setLookback:(w:BuilderState["lookback"])=>void;
  setStrategy:(id:string)=>void;
  setIndicators:(s:IndicatorSelection[])=>void;
  addRule:(r:Rule)=>void; removeRule:(i:number)=>void; updateRule:(id:string, updates:Partial<Rule>)=>void;
  setRisk:(r:RiskSettings)=>void;
  setAdvanced:(a:AdvancedSettings)=>void;
  setFilters:(f:Partial<BuilderState["filters"]>)=>void;
  setSequence:(s:Partial<BuilderState["sequence"]>)=>void;
  applyPresetById:(presetId: string, presetObj?: any)=>void;
  setSelectedPreset:(preset:any)=>void;
  setSummaryMode:(mode:"guided"|"expert")=>void;

  // Rule group and UI actions
  setRuleGroupMode: (mode: RuleGroupMode) => void;
  setSequence: (partial: Partial<SequenceSpec>) => void;
  beginAddRule: () => void;
  cancelRuleEdit: () => void;
  beginEditRule: (id: string) => void;
  addRuleFromTemplate: (template: { left: string; operator: string; right: any; label?: string }) => void;

  // New canonical actions
  setPairsPreset: (payload?: { setName?: string; symbols?: string[]; selectedCount?: number }) => void;
  setDirection: (bias: Bias) => void;
  setInverseSignals: (on: boolean) => void;
  setRiskProfile: (profile?: string, mergeDefaults?: any) => void;
  bumpSummaryVersion: () => void;
  
  // Risk/exits canonical actions
  setRisk: (partial: PartialDeep<any>) => void;
  setRiskField: (path: string, value: any) => void;
  setTPs: (stepsPct: any[], allocPct?: any[]) => void;
  setSingleTP: (tpPct: any) => void;
  enableTemplate: (key: "breakeven"|"trailingTP"|"atrStop"|"timeStop", enabled: boolean, params?: any) => void;
}

export function defaultAdvanced(): AdvancedSettings {
  return {
    entry:{ logic:"AND", tradeDirection:"Both", inverseSignals:false },
    strategy:{ confirmationBars:0, reentryCooldownBars:0, oneTradePerSession:false },
    filters:{ htfTrend:{enabled:false,timeframe:"1h",direction:"Both"}, volume:{enabled:false,min:0}, atrActivity:{enabled:false,min:0} },
    exits:{
      defaultSLPct:5, defaultTPPct:10,
      multiTP:{enabled:false,targets:[{tpPct:2,allocationPct:50},{tpPct:4,allocationPct:50}]},
      breakeven:{enabled:false,triggerRR:1},
      trailing:{enabled:false,mode:"ATR",atrMult:2,percent:1.5},
      atrStop:{enabled:false,atrMult:2},
      timeExit:{enabled:false,bars:100},
      priority:["default","multiTP","breakeven","trailing","atrStop","timeExit"]
    }
  };
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get)=>({
      marketType:"spot",
      pairs:["BTC/USDT","ETH/USDT"],
      timeframe:"15m",
      lookback:"1y",
      strategyId: undefined,
      riskSettings:{ riskPerTradePct:1.5, leverage:3, maxConcurrentTrades:2, positionSizing:"Volatility" },
      indicatorSelections: [],
      rules: [],
      advanced: defaultAdvanced(),
      filters: {
        enabled: false,
        scope: "each",
        referenceSymbol: "BTCUSDT",
        clauses: []
      },
      sequence: {
        enabled: false,
        ruleAId: undefined,
        ruleBId: undefined,
        withinBars: 5
      },
      selectedPreset: undefined,
      rulesInitialized: false,
      ruleGroupMode: "AND" as RuleGroupMode,
      sequence: { enabled: false, withinBars: 3 } as SequenceSpec,
      ui: { ruleEditorOpenId: null, addingNew: false },

      // Canonical keys the summary reads
      pairsPreset: undefined,
      direction: undefined,
      inverseSignals: false,
      riskProfile: undefined,
      summaryVersion: 0,
      summaryMode: "guided",
      risk: { exits: {} },

      setMarketType:(m)=>set((s)=>({marketType:m, summaryVersion: s.summaryVersion + 1})),
      setPairs:(p)=>set((s)=>({pairs:p, summaryVersion: s.summaryVersion + 1})),
      setTimeframe:(t)=>set((s)=>({timeframe:t, summaryVersion: s.summaryVersion + 1})),
      setLookback:(w)=>set((s)=>({lookback:w, summaryVersion: s.summaryVersion + 1})),
      setStrategy:(id)=>set((s)=>({strategyId:id, summaryVersion: s.summaryVersion + 1})),
      setIndicators:(s)=>set((state)=>({indicatorSelections:s, summaryVersion: state.summaryVersion + 1})),
      addRule:(r)=>set((s)=>({rules:[...s.rules, r], summaryVersion: s.summaryVersion + 1})),
      removeRule:(i)=>{ const arr=[...get().rules]; arr.splice(i,1); set((s)=>({rules:arr, summaryVersion: s.summaryVersion + 1})); },
      updateRule:(id, updates)=>set((s)=>({
        rules: s.rules.map(r => r.id === id ? {...r, ...updates} : r),
        summaryVersion: s.summaryVersion + 1
      })),
      setRisk:(r)=>set((s)=>({riskSettings:r, summaryVersion: s.summaryVersion + 1})),
      setAdvanced:(a)=>set((s)=>({advanced:a, summaryVersion: s.summaryVersion + 1})),
      setFilters:(f)=>set((s:any) => ({ filters: { ...(s.filters||{}), ...(f||{}) }, summaryVersion: s.summaryVersion + 1 })),
      setSequence:(s)=>set((state:any) => ({ sequence: { ...(state.sequence||{}), ...(s||{}) }, summaryVersion: state.summaryVersion + 1 })),
      applyPresetById: (presetId: string, presetObj?: any) => set((s:any) => {
        const preset = presetObj || (s.selectedPreset && s.selectedPreset.id === presetId ? s.selectedPreset : null) || null;
        if (!preset) return {};
        const { rules, sequence, group, riskDefaults } = normalizePresetToStoreShape(preset);
        
        // Convert RuleTile[] to Rule[] format expected by store
        const storeRules: Rule[] = rules.map(rule => ({
          id: rule.id,
          family: rule.family,
          left: rule.left.type === "number" ? String(rule.left.value) : 
                rule.left.type === "price" ? `price.${rule.left.field}` :
                rule.left.type === "indicator" ? `${rule.left.alias}.${rule.left.output}` : String(rule.left.value),
          operator: rule.operator,
          right: rule.right.type === "number" ? String(rule.right.value) :
                 rule.right.type === "price" ? `price.${rule.right.field}` :
                 rule.right.type === "indicator" ? `${rule.right.alias}.${rule.right.output}` : String(rule.right.value)
        }));
        
        return {
          rules: storeRules,
          ruleGroup: group,
          sequence: { ...(s.sequence||{}), ...sequence },
          risk: (() => {
            const merged = { ...(s.risk || {}), ...(riskDefaults || {}) };
            merged.exits = canonExits(merged.exits || {}, s.risk?.exits);
            return merged;
          })(),
          rulesInitialized: true,
          summaryVersion: s.summaryVersion + 1
        };
      }),
      setSelectedPreset:(preset:any)=>set((s:any) => ({ selectedPreset: preset, rulesInitialized: false, summaryVersion: s.summaryVersion + 1 })),

      // New canonical actions
      setPairsPreset: (payload) => set((s) => {
        if (!payload) return { pairsPreset: undefined, summaryVersion: s.summaryVersion + 1 };
        const { setName, symbols, selectedCount } = payload;
        return {
          pairsPreset: { setName, selectedCount: selectedCount ?? (Array.isArray(symbols) ? symbols.length : undefined) },
          summaryVersion: s.summaryVersion + 1
        };
      }),
      setDirection: (bias) => set((s) => ({ direction: bias, summaryVersion: s.summaryVersion + 1 })),
      setInverseSignals: (on) => set((s) => ({ inverseSignals: !!on, summaryVersion: s.summaryVersion + 1 })),
      setRiskProfile: (profile, mergeDefaults) => set((s) => ({
        riskProfile: profile,
        riskSettings: mergeDefaults ? { ...(s.riskSettings||{}), ...mergeDefaults } : s.riskSettings,
        summaryVersion: s.summaryVersion + 1
      })),
      bumpSummaryVersion: () => set((s) => ({ summaryVersion: s.summaryVersion + 1 })),
      setSummaryMode: (mode) => set((s) => ({ summaryMode: mode, summaryVersion: s.summaryVersion + 1 })),
      
      // Risk/exits canonical actions
      setRisk: (partial: PartialDeep<any>) => set((s) => {
        const next = { ...(s.risk || {}), ...(partial || {}) };
        // canonicalize exits branch
        next.exits = canonExits(next.exits || {}, s.risk?.exits);
        return { risk: next, summaryVersion: s.summaryVersion + 1 };
      }),
      setRiskField: (path: string, value: any) => set((s) => {
        const next = structuredClone(s.risk || {});
        const keys = path.split(".");
        let cur:any = next;
        for (let i=0;i<keys.length-1;i++){ cur[keys[i]] = cur[keys[i]] ?? {}; cur = cur[keys[i]]; }
        cur[keys[keys.length-1]] = value;
        next.exits = canonExits(next.exits || {}, s.risk?.exits);
        return { risk: next, summaryVersion: s.summaryVersion + 1 };
      }),
      setTPs: (stepsPct: any[], allocPct?: any[]) => set((s)=> {
        const next = structuredClone(s.risk || {});
        next.exits = canonExits({ ...(next.exits||{}), tpStepsPct: stepsPct, tpAllocPct: allocPct }, s.risk?.exits);
        // If steps set, remove single TP to avoid conflicting reads
        if (Array.isArray(stepsPct) && stepsPct.length) delete next.exits.defaultTPPct;
        return { risk: next, summaryVersion: s.summaryVersion + 1 };
      }),
      setSingleTP: (tpPct: any) => set((s)=> {
        const next = structuredClone(s.risk || {});
        next.exits = canonExits({ ...(next.exits||{}), defaultTPPct: tpPct }, s.risk?.exits);
        // If single TP set, clear steps to prevent ambiguity
        delete next.exits.tpStepsPct; delete next.exits.tpAllocPct;
        return { risk: next, summaryVersion: s.summaryVersion + 1 };
      }),
      enableTemplate: (key: "breakeven"|"trailingTP"|"atrStop"|"timeStop", enabled: boolean, params?: any) => set((s)=> {
        const next = structuredClone(s.risk || {});
        next[key] = { ...(next[key]||{}), ...(params||{}), enabled };
        next.exits = canonExits(next.exits || {}, s.risk?.exits);
        return { risk: next, summaryVersion: s.summaryVersion + 1 };
      }),

      // Rule group and UI actions
      setRuleGroupMode: (mode: RuleGroupMode) => set((s)=> ({
        ruleGroupMode: mode,
        sequence: mode === "SEQUENCE" ? { ...(s.sequence||{}), enabled: true } : { ...(s.sequence||{}), enabled: false },
        summaryVersion: s.summaryVersion + 1
      })),
      setSequence: (partial: Partial<SequenceSpec>) => set((s)=> ({
        sequence: { ...(s.sequence||{enabled:true, withinBars:3}), ...partial, enabled: true },
        summaryVersion: s.summaryVersion + 1
      })),
      beginAddRule: () => set((s)=> ({ 
        ui: { ...(s.ui||{}), addingNew: true, ruleEditorOpenId: null },
        summaryVersion: s.summaryVersion + 1
      })),
      cancelRuleEdit: () => set((s)=> ({ 
        ui: { ...(s.ui||{}), addingNew: false, ruleEditorOpenId: null },
        summaryVersion: s.summaryVersion + 1
      })),
      beginEditRule: (id: string) => set((s)=> ({ 
        ui: { ...(s.ui||{}), addingNew: false, ruleEditorOpenId: id },
        summaryVersion: s.summaryVersion + 1
      })),
      addRuleFromTemplate: (template: { left: string; operator: string; right: any; label?: string }) => set((s)=> {
        const newRule: Rule = {
          id: `rule_${Date.now()}`,
          family: "Price", // Default family, could be enhanced
          left: template.left || "",
          operator: template.operator || ">",
          right: template.right || ""
        };
        return {
          rules: [...s.rules, newRule],
          ui: { ...(s.ui||{}), addingNew: false, ruleEditorOpenId: null },
          summaryVersion: s.summaryVersion + 1
        };
      }),
    }),
    { name:"botforge_builder_v2" }
  )
);