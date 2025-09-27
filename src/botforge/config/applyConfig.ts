"use client";
import { configSchema, type ImportConfig, resolveStrategyId } from "./configSchema";
import { useBuilderStore } from "@/botforge/state/builderStore";

export async function applyImportedConfig(raw: unknown): Promise<{ ok: boolean; message: string }> {
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Invalid config: " + JSON.stringify(parsed.error.format()) };
  }
  const cfg: ImportConfig = parsed.data;
  const sid = await resolveStrategyId(cfg.strategy);

  // Apply to store
  if (cfg.marketType) useBuilderStore.getState().setMarketType(cfg.marketType);
  if (cfg.pairs?.length) useBuilderStore.getState().setPairs(cfg.pairs);
  if (cfg.timeframe) useBuilderStore.getState().setTimeframe(cfg.timeframe);
  if (sid) useBuilderStore.getState().setStrategy(sid);
  if (cfg.indicators?.length) useBuilderStore.getState().setIndicators(cfg.indicators);
  if (cfg.risk) useBuilderStore.getState().setRisk(cfg.risk);

  return { ok: true, message: "Settings applied." };
}

export function exportCurrentConfig(): string {
  const s = useBuilderStore.getState();
  const payload = {
    marketType: s.marketType,
    pairs: s.pairs,
    timeframe: s.timeframe,
    strategy: { id: s.strategyId },
    indicators: s.indicatorSelections,
    risk: s.riskSettings
  };
  return JSON.stringify(payload, null, 2);
}





