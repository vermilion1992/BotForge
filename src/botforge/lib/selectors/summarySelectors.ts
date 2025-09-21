/* Normalizes various store shapes into what the Summary builder expects */
export type SummaryShape = {
  selectedPreset?: any;
  ruleGroup?: { mode: "ALL"|"ANY"|"K_OF_N"; k?: number };
  rules?: any[];
  sequence?: any;
  filters?: any;
  timeframe?: string | undefined;
  pairs?: { setName?: string; selectedCount?: number } | undefined;
  risk?: any;
  riskProfile?: string | undefined;
  direction?: "long_only"|"short_only"|"both" | undefined;
  inverseSignals?: boolean | undefined;
};

export const DEBUG_SUMMARY = true; // set true for console.debug traces

function coerceTimeframe(s: any): string | undefined {
  const tf = s?.timeframe ?? s?.settings?.timeframe ?? s?.builder?.timeframe ?? s?.chart?.tf ?? s?.chart?.timeframe;
  if (!tf) return undefined;
  return typeof tf === "string" ? tf : (tf.value || tf.label || String(tf));
}

function coercePairs(s: any): { setName?: string; selectedCount?: number } | undefined {
  const setName =
    s?.pairs?.setName ??
    s?.universe?.activeSetName ??
    s?.assets?.activeSetName ??
    s?.selection?.pairsSetName;

  const selectedCount =
    s?.pairs?.selectedCount ??
    (Array.isArray(s?.assets?.selectedSymbols) ? s.assets.selectedSymbols.length : undefined) ??
    (Array.isArray(s?.selection?.pairs) ? s.selection.pairs.length : undefined);

  if (!setName && !selectedCount) return undefined;
  return { setName, selectedCount };
}

function coerceDirection(s: any): "long_only"|"short_only"|"both" | undefined {
  const d = s?.direction ?? s?.regime?.bias ?? s?.entry?.direction;
  if (!d) return undefined;
  if (d === "both" || d === "long_only" || d === "short_only") return d;
  // Map common variants
  if (d === "long" || d === "LONG") return "long_only";
  if (d === "short" || d === "SHORT") return "short_only";
  return "both";
}

function coerceInverse(s: any): boolean | undefined {
  const v = s?.inverseSignals ?? s?.regime?.inverse ?? s?.entry?.inverseSignals;
  return typeof v === "boolean" ? v : undefined;
}

function coerceRiskProfile(s: any): string | undefined {
  return s?.riskProfile ?? s?.risk?.profile ?? s?.presets?.riskProfile ?? s?.strategy?.risk?.profile;
}

function coerceRules(s: any): any[] | undefined {
  return s?.rules ?? s?.entry?.rules ?? undefined;
}

function coerceRuleGroup(s: any): any {
  return s?.ruleGroup ?? s?.entry?.group ?? undefined;
}

function coerceSequence(s: any): any {
  return s?.sequence ?? s?.entry?.sequence ?? undefined;
}

function coerceFilters(s: any): any {
  return s?.filters ?? s?.gates ?? undefined;
}

function coerceRisk(s: any): any {
  return s?.risk ?? s?.strategy?.risk ?? s?.presets?.risk ?? undefined;
}

function coercePreset(s: any): any {
  return s?.selectedPreset ?? s?.preset?.selected ?? undefined;
}

export function selectSummaryState(s: any): SummaryShape {
  const normalized: SummaryShape = {
    selectedPreset: coercePreset(s),
    ruleGroup: coerceRuleGroup(s),
    rules: coerceRules(s),
    sequence: coerceSequence(s),
    filters: coerceFilters(s),
    timeframe: coerceTimeframe(s),
    pairs: coercePairs(s),
    risk: coerceRisk(s),
    riskProfile: coerceRiskProfile(s),
    direction: coerceDirection(s),
    inverseSignals: coerceInverse(s),
  };

  if (DEBUG_SUMMARY) {
    // Lightweight trace of resolved vs a few raw candidates
    // eslint-disable-next-line no-console
    console.debug("[Summary] normalized:", normalized, {
      raw: {
        timeframe: s?.timeframe, settingsTf: s?.settings?.timeframe, builderTf: s?.builder?.timeframe, chartTf: s?.chart?.tf,
        pairsSetName: s?.pairs?.setName, universeSet: s?.universe?.activeSetName, selectedSymbolsLen: s?.assets?.selectedSymbols?.length,
        direction: s?.direction, regimeBias: s?.regime?.bias, inverseSignals: s?.inverseSignals,
      }
    });
  }

  return normalized;
}
