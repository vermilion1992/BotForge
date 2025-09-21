import type { IndicatorId, PriceField } from "../lib/types";

// Single source of truth for price fields (lowercase)
export const priceFields: PriceField[] = ["open", "high", "low", "close", "hl2", "hlc3", "ohlc4"];

// Single source of truth for indicators (UPPERCASE ids)
export const indicatorRegistry: Record<IndicatorId, { id: IndicatorId; label: string; kind: "indicator" }> = {
  ATR: { id: "ATR", label: "ATR", kind: "indicator" },
  EMA: { id: "EMA", label: "EMA", kind: "indicator" },
  RSI: { id: "RSI", label: "RSI", kind: "indicator" },
} as const;
