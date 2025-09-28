import { z } from "zod";

export const indicatorSelSchema = z.object({
  id: z.string(),
  presetRef: z.string(),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).default({})
});

export const configSchema = z.object({
  marketType: z.enum(["spot","perp"]).optional(),
  pairs: z.array(z.string()).default([]),
  timeframe: z.string().optional(),
  strategy: z.object({
    id: z.string().optional(),
    label: z.string().optional()
  }).default({}),
  indicators: z.array(indicatorSelSchema).default([]),
  risk: z.object({
    startingCapital: z.number().min(100).default(1000),
    riskPerTradePct: z.number().min(0.1).max(10).default(1),
    maxConcurrentTrades: z.number().min(1).default(3),
    maxLeverage: z.number().min(1).max(125).default(1),
    notionalCapPerTrade: z.number().nullable().default(null),
    dailyDrawdownStopPct: z.number().nullable().default(null),
    useCurrentEquityForSizing: z.boolean().default(false),
    perAssetExposureCapPct: z.number().nullable().default(null),
    lossStreakLockoutN: z.number().nullable().default(null)
  }).default({
    startingCapital: 1000,
    riskPerTradePct: 1,
    maxConcurrentTrades: 3,
    maxLeverage: 1,
    notionalCapPerTrade: null,
    dailyDrawdownStopPct: null,
    useCurrentEquityForSizing: false,
    perAssetExposureCapPct: null,
    lossStreakLockoutN: null
  })
});

export type ImportConfig = z.infer<typeof configSchema>;

// resolve strategy by id or label (fetches /api/sot)
export async function resolveStrategyId(input: { id?: string; label?: string }): Promise<string|undefined> {
  if (input?.id) return input.id;
  if (!input?.label) return undefined;
  const res = await fetch("/api/sot").then(r=>r.json()).catch(()=>null);
  const match = res?.strategies?.find((s:any)=> String(s.label).toLowerCase() === String(input.label).toLowerCase());
  return match?.id;
}





