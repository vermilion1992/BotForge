import type { IndicatorMeta } from "./types";

const DEFAULT_OPS = {
  series: [">",">=","<","<=","==","crosses_above","crosses_below","rising","falling"],
  scalar: [">",">=","<","<=","==","rising","falling"],
  state:  ["=="]
} as const;

export function normalizeMeta(m: any): IndicatorMeta {
  const id = m?.id ?? m?.identity?.id ?? "";
  const label = m?.label ?? m?.identity?.label ?? (id || "UNKNOWN");
  const shape = m?.outputs?.shape ?? (id.toLowerCase().includes("ema") ? "series" : id.toLowerCase().includes("rsi") ? "scalar" : id.toLowerCase().includes("atr") ? "scalar" : "series");
  const supportedOperators = Array.isArray(m?.supportedOperators) && m.supportedOperators.length ? m.supportedOperators : (DEFAULT_OPS as any)[shape];

  return {
    id, label,
    outputs: { shape, subseries: m?.outputs?.subseries ?? [] },
    supportedOperators,
    params: m?.params ?? {},
    ui: m?.ui ?? {}
  };
}
