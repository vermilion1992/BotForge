import { z } from "zod";

export const operatorList = [
  ">", ">=", "<", "<=", "==",
  "crosses_above", "crosses_below",
  "rising", "falling", "within", "outside",
] as const;
export type Operator = typeof operatorList[number];

export const extrasList = [
  "regimeFilter","confirmationIndicator","timeWindow","riskGuard",
  "priority","signalCooldown","directionBias","multiTFConfirm",
] as const;
export type Extra = typeof extrasList[number];

export const indicatorPresetSchema = z.object({
  id: z.string(),
  presetTier: z.enum(["Normal","Hero"]),
  designIntent: z.enum(["Breakout","Pullback","Filter","Momentum","MeanReversion"]),
  riskProfile: z.enum(["Conservative","Balanced","Aggressive"]),
  extras: z.array(z.enum(extrasList)).max(2),
  riskDefaults: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  cooldownBars: z.number().int().min(0).max(500).optional(),
});

export const indicatorMetaSchema = z.object({
  identity: z.object({ id: z.string(), label: z.string(), tier: z.enum(["CORE","PRO"]) }),
  docs: z.object({
    category: z.enum(["Trend","Momentum","Volatility","Volume","Other"]),
    tags: z.array(z.string()).default([]),
    blurb: z.string(),
    longSummary: z.string(),
    mathSummary: z.string(),
    references: z.array(z.string()).min(1),
  }),
  params: z.record(z.object({
    type: z.enum(["number","string","boolean"]),
    default: z.union([z.number(), z.string(), z.boolean()]).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    unit: z.string().optional(),
  })),
  outputs: z.array(z.string()).min(1),
  supportedOperators: z.array(z.enum(operatorList)).nonempty(),
  signals: z.object({ bullish: z.array(z.string()).default([]), bearish: z.array(z.string()).default([]) }).default({bullish:[],bearish:[]}),
  ui: z.object({ tooltips: z.record(z.string()) }),
  constraints: z.object({ recommendedTF: z.array(z.string()).default([]) }).default({recommendedTF:[]}),
  examples: z.array(z.object({ name: z.string(), presetRef: z.string() })).length(6),
  riskTemplates: z.object({
    atrStop: z.object({ enabledDefault: z.boolean(), atrMultiple: z.number().default(1.5) }),
    trailingTP: z.object({ enabledDefault: z.boolean(), trailPct: z.number().default(0.7) }),
    breakeven: z.object({ enabledDefault: z.boolean(), triggerRR: z.number().default(1.0) }),
    timeStop: z.object({ enabledDefault: z.boolean(), bars: z.number().default(96) }),
  }),
  presets: z.array(indicatorPresetSchema).length(6),
  deprecated: z.boolean().default(false),
});
export type IndicatorMeta = z.infer<typeof indicatorMetaSchema>;

export const strategySchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.array(z.string()),
  maxRules: z.number().int().min(1).max(10).default(5),
  allowedIndicators: z.array(z.string()),
});
export type StrategyMeta = z.infer<typeof strategySchema>;

export const uiRulesSchema = z.object({
  steps: z.array(z.object({ id: z.string(), title: z.string() })),
  completeCriteria: z.record(z.string(), z.array(z.string())),
});
export type UIRules = z.infer<typeof uiRulesSchema>;

