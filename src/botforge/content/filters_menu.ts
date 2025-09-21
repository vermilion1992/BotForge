export type FilterType = "htf_trend" | "atr_band" | "volume";

export type FiltersScope = "each" | "reference" | "both";

export type FilterClause =
  | { type: "htf_trend"; tf: "1h"|"4h"|"1D"; ma: "ema"|"sma"; length: number; mode: "price_above"|"slope_rising" }
  | { type: "atr_band"; length: number; minPct: number; maxPct: number }
  | { type: "volume"; mode: "sma_gt"; fast: number; slow: number };

export const FILTER_FRIENDLY = {
  htf_trend: {
    label: "Higher-TF Trend",
    pill: (c: any) =>
      c.mode === "slope_rising"
        ? `HTF ${c.tf} ${c.ma?.toUpperCase?.() || "EMA"}${c.length} rising`
        : `HTF ${c.tf} price above ${c.ma?.toUpperCase?.() || "EMA"}${c.length}`,
  },
  atr_band: {
    label: "Volatility Band (ATR%)",
    pill: (c: any) => `ATR(${c.length}) ${c.minPct}–${c.maxPct}%`,
  },
  volume: {
    label: "Volume Filter",
    pill: (c: any) => `Vol SMA${c.fast} > SMA${c.slow}`,
  },
} as const;

export const FILTER_DEFAULTS: Record<FilterType, FilterClause> = {
  htf_trend: { type: "htf_trend", tf: "4h", ma: "ema", length: 200, mode: "slope_rising" },
  atr_band: { type: "atr_band", length: 14, minPct: 0.6, maxPct: 3.0 },
  volume:   { type: "volume", mode: "sma_gt", fast: 20, slow: 50 },
};


