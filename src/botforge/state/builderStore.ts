import { create } from "zustand";

export interface IndicatorSelection {
  id: string;
  presetRef?: string;
  params?: Record<string, any>;
}

export interface Rule {
  id: string;
  left: any;
  operator: string;
  right: any;
}

export type RuleGroupMode = "AND" | "OR" | "SEQUENCE";

export interface Sequence {
  ruleAId?: string;
  ruleBId?: string;
  withinBars?: number;
}

export interface RiskSettings {
  startingCapital?: number;
  riskPerTradePct?: number;
  maxConcurrentTrades?: number;
  maxLeverage?: number;
  notionalCapPerTrade?: number | null;
  dailyDrawdownStopPct?: number | null;
  useCurrentEquityForSizing?: boolean;
  perAssetExposureCapPct?: number | null;
  lossStreakLockoutN?: number | null;
}

export interface AdvancedSettings {
  confirmationBars?: number;
  maxEntriesPerCandle?: number;
  oneTradePerSession?: boolean;
  entry?: {
    logic?: "AND" | "OR";
    tradeDirection?: "Both" | "LongOnly" | "ShortOnly";
  };
  strategy?: {
    confirmationBars?: number;
    maxEntriesPerCandle?: number;
    reentryCooldownBars?: number;
  };
  filters?: {
    htfTrend?: {
      enabled?: boolean;
      timeframe?: string;
    };
    volume?: {
      enabled?: boolean;
      min?: number;
    };
    atrActivity?: {
      enabled?: boolean;
      min?: number;
    };
  };
}

export const defaultAdvanced: AdvancedSettings = {
  confirmationBars: 0,
  maxEntriesPerCandle: 1,
  oneTradePerSession: false,
  entry: {
    logic: "AND",
    tradeDirection: "Both",
  },
  strategy: {
    confirmationBars: 0,
    maxEntriesPerCandle: 1,
    reentryCooldownBars: 0,
  },
  filters: {
    htfTrend: {
      enabled: false,
      timeframe: "1h",
    },
    volume: {
      enabled: false,
      min: 0,
    },
    atrActivity: {
      enabled: false,
      min: 0,
    },
  },
};

export const defaultRiskSettings: RiskSettings = {
  startingCapital: 10000,
  riskPerTradePct: 1,
  maxConcurrentTrades: 3,
  maxLeverage: 5,
  notionalCapPerTrade: null,
  dailyDrawdownStopPct: null,
  useCurrentEquityForSizing: true,
  perAssetExposureCapPct: null,
  lossStreakLockoutN: null,
};

export const useBuilderStore = create((set, get) => ({
  // State
  indicatorSelections: [],
  rules: [],
  selectedPreset: null,
  direction: "both",
  inverseSignals: false,
  summaryMode: "guided",
  
  // Step 1 - Market & Pairs
  marketType: null,
  pairs: [],
  pairsPreset: null,
  
  // Step 4 - Advanced Settings
  advanced: defaultAdvanced,
  rulesInitialized: false,
  ruleGroupMode: "AND" as RuleGroupMode,
  sequence: null as Sequence | null,
  timeframe: "1h",
  
  // Step 5 - Risk Settings
  riskSettings: defaultRiskSettings,
  
  // Actions
  setIndicators: (selections) => set({ indicatorSelections: selections }),
  setSelectedPreset: (preset) => set({ selectedPreset: preset }),
  setDirection: (direction) => set({ direction }),
  setInverseSignals: (inverse) => set({ inverseSignals: inverse }),
  setSummaryMode: (mode) => set({ summaryMode: mode }),
  
  // Step 1 Actions
  setMarketType: (marketType) => set({ marketType }),
  setPairs: (pairs) => set({ pairs }),
  setPairsPreset: (preset) => set({ pairsPreset: preset }),
  
  // Step 4 Actions
  setAdvanced: (advanced) => set({ advanced }),
  setRuleGroupMode: (mode) => set({ ruleGroupMode: mode }),
  setSequence: (sequence) => set((state) => ({ 
    sequence: { ...state.sequence, ...sequence } 
  })),
  setTimeframe: (timeframe) => set({ timeframe }),
  
  // Step 5 Actions
  setRisk: (riskSettings) => set({ riskSettings }),
  
  applyPresetById: (presetId, presetObj) => set((state) => {
    const preset = presetObj || state.selectedPreset;
    if (!preset) return {};
    
    console.log("🎯 Applying preset:", { presetId, preset });
    
    const storeRules = [];
    let ruleGroupMode: RuleGroupMode = "AND";
    
    // Handle simple rules array
    if (preset.rules && Array.isArray(preset.rules)) {
      preset.rules.forEach((rule, index) => {
        const storeRule = {
          id: rule.id || `rule-${index}`,
          left: rule.left,  // Keep original object for formatRuleForDisplay to handle
          operator: rule.op || rule.operator || "is_above",
          right: rule.right
        };
        storeRules.push(storeRule);
        console.log("🔧 Converted rule:", { original: rule, converted: storeRule });
      });
    }
    
    // Handle sequence structure (like "Oversold Spring")
    if (preset.sequence && Array.isArray(preset.sequence)) {
      ruleGroupMode = "SEQUENCE";
      preset.sequence.forEach((step, stepIndex) => {
        if (step.rules && Array.isArray(step.rules)) {
          step.rules.forEach((rule, ruleIndex) => {
            const storeRule = {
              id: rule.id || `${step.name || 'step'}-${stepIndex}-${ruleIndex}`,
              left: rule.left,  // Keep original object for formatRuleForDisplay to handle
              operator: rule.op || rule.operator || "is_above",
              right: rule.right
            };
            storeRules.push(storeRule);
            console.log("🔧 Converted sequence rule:", { step: step.name, original: rule, converted: storeRule });
          });
        }
      });
    }
    
    return {
      rules: storeRules,
      ruleGroupMode,
      selectedPreset: preset,
      rulesInitialized: true,
    };
  }),
  
  // Stubs for compatibility
  addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
  removeRule: (index) => set((state) => ({ rules: state.rules.filter((_, i) => i !== index) })),
  updateRule: (id, updates) => set((state) => ({ rules: state.rules.map(r => r.id === id ? {...r, ...updates} : r) })),
  setRules: (rules) => set((state) => ({ ...state, rules: [...rules] })),
  beginAddRule: () => {},
  cancelRuleEdit: () => {},
  beginEditRule: () => {},
  ui: {}
}));
