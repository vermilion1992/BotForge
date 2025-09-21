import type { FilterClause, FiltersScope } from "@/botforge/content/filters_menu";

/**
 * Evaluate Filters as a pre-condition.
 * This is engine-agnostic. Wire the accessors in `providers`.
 */
export type EvalProviders = {
  // Get last CONFIRMED value (no repaint) for an MA on a given TF/symbol
  getMA: (symbol: string, tf: "1h"|"4h"|"1D", ma: "ema"|"sma", length: number) => number|undefined;
  // Get current close price on given TF/symbol
  getPrice: (symbol: string, tf: "1h"|"4h"|"1D") => number|undefined;
  // Get ATR% (ATR/price*100) on current TF/symbol for a given length
  getATRpct: (symbol: string, length: number) => number|undefined;
  // Volume SMAs on current TF/symbol
  getVolSMA: (symbol: string, length: number) => number|undefined;
};

export function evaluateFilters(
  enabled: boolean,
  scope: FiltersScope,
  refSymbol: string|undefined,
  clauses: FilterClause[],
  ctx: { symbol: string },
  providers: EvalProviders
): boolean {
  if (!enabled || clauses.length === 0) return true;

  const ref = refSymbol || "BTCUSDT";
  const passEach = evaluateOn(ctx.symbol, clauses, providers);
  if (scope === "each") return passEach;

  const passRef = evaluateOn(ref, clauses, providers);
  if (scope === "reference") return passRef;

  // both
  return passRef && passEach;
}

function evaluateOn(symbol: string, clauses: FilterClause[], p: EvalProviders): boolean {
  for (const c of clauses) {
    let ok = false;
    switch (c.type) {
      case "htf_trend": {
        const ma = p.getMA(symbol, c.tf, c.ma, c.length);
        const price = p.getPrice(symbol, c.tf);
        if (ma == null || price == null) return false;
        ok = c.mode === "slope_rising"
          ? isRising(symbol, c.tf, c.ma, c.length, p)
          : price > ma;
        break;
      }
      case "atr_band": {
        const atrPct = p.getATRpct(symbol, c.length);
        if (atrPct == null) return false;
        ok = atrPct >= c.minPct && atrPct <= c.maxPct;
        break;
      }
      case "volume": {
        const f = p.getVolSMA(symbol, c.fast);
        const s = p.getVolSMA(symbol, c.slow);
        if (f == null || s == null) return false;
        ok = f > s;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}

// Simple slope check using two points (replace with your native slope util if available)
function isRising(symbol: string, tf: "1h"|"4h"|"1D", ma: "ema"|"sma", length: number, p: EvalProviders) {
  const cur = p.getMA(symbol, tf, ma, length);
  const prev = p.getMA(symbol, tf, ma, length); // NOTE: if you can, fetch prev bar; else treat as non-rising
  if (cur == null || prev == null) return false;
  // If provider cannot fetch historical prev, assume non-rising; replace with your real implementation.
  return cur > prev;
}


