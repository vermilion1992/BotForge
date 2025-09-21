import type { FilterClause, FiltersScope } from "@/botforge/content/filters_menu";
import { FILTER_FRIENDLY } from "@/botforge/content/filters_menu";

export function summarizeFilters(enabled: boolean, scope: FiltersScope, ref: string|undefined, clauses: FilterClause[]) {
  if (!enabled || !clauses?.length) return "Filters off";
  const pills = clauses.map(c => FILTER_FRIENDLY[c.type].pill(c));
  const scopeText = scope === "each" ? "Each Pair"
    : scope === "reference" ? `Reference: ${ref || "BTCUSDT"}`
    : `Both (${ref || "BTCUSDT"})`;
  return `Filters on • ${scopeText} • ` + pills.join(" • ");
}

export type FilterValidation = { errors: string[]; warnings: string[]; };

export function validateFilters(enabled: boolean, clauses: FilterClause[]): FilterValidation {
  const v: FilterValidation = { errors: [], warnings: [] };
  if (!enabled) return v;
  if (!clauses?.length) { v.errors.push("Add at least one filter or turn Filters off."); return v; }

  for (const c of clauses) {
    switch (c.type) {
      case "htf_trend":
        if (!c.length || (c.length < 5 || c.length > 500)) v.errors.push("HTF Trend: length must be 5–500.");
        if (!["1h","4h","1D"].includes(c.tf)) v.errors.push("HTF Trend: TF must be 1h/4h/1D.");
        break;
      case "atr_band":
        if (!c.length || c.length < 5 || c.length > 200) v.errors.push("ATR: length must be 5–200.");
        if (!(c.minPct < c.maxPct)) v.errors.push("ATR: min% must be less than max%.");
        if (c.minPct < 0.1) v.warnings.push("ATR min% is very low; may allow dead markets.");
        break;
      case "volume":
        if (!c.fast || !c.slow) v.errors.push("Volume: set fast & slow periods.");
        if (c.fast >= c.slow) v.errors.push("Volume: fast must be less than slow.");
        break;
    }
  }
  return v;
}


