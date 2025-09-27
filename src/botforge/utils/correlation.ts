import type { IndicatorMeta, StrategyMeta } from "../sot/schemas";
export function allowedIndicatorsForStrategy(strategy: StrategyMeta, metas: IndicatorMeta[]) {
  const allowed = new Set(strategy.allowedIndicators);
  return metas.filter(m => allowed.has(m.identity.id));
}





