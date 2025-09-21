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
    riskPerTradePct: z.number().min(0).max(100).default(1.75),
    leverage: z.number().min(1).max(125).default(2)
  }).default({ riskPerTradePct: 1.75, leverage: 2 })
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




