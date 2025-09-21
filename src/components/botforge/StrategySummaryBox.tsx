"use client";
import { useBuilderStore } from "@/botforge/state/builderStore";
import { buildGuidedSummary, buildExpertSummary } from "@/botforge/lib/summary_modes";

export default function StrategySummaryBox() {
  // Subscribe to canonical keys + summaryVersion for live updates
  const store = useBuilderStore((s:any)=>({
    selectedPreset: s.selectedPreset,
    ruleGroup: s.ruleGroup,
    rules: s.rules,
    sequence: s.sequence,
    filters: s.filters,
    timeframe: s.timeframe,
    pairs: s.pairsPreset,
    risk: s.risk || {},
    riskProfile: s.riskProfile,
    direction: s.direction,
    inverseSignals: s.inverseSignals,
    _v: s.summaryVersion,
    summaryMode: s.summaryMode,
  }));

  const text = store.summaryMode === "expert" ? buildExpertSummary(store) : buildGuidedSummary(store);

  // Debug logging (opt-in)
  if (typeof window !== "undefined" && (localStorage.getItem("summaryDebug") === "1" || process.env.NEXT_PUBLIC_SUMMARY_DEBUG === "1")) {
    // Minimal noise: one group per render
    // eslint-disable-next-line no-console
    console.groupCollapsed("[SummaryDebug] render", new Date().toISOString());
    // eslint-disable-next-line no-console
    console.log("timeframe", store.timeframe, "pairs", store.pairs, "direction", store.direction, "inverse", store.inverseSignals);
    // eslint-disable-next-line no-console
    console.log("riskProfile", store.riskProfile);
    // eslint-disable-next-line no-console
    console.log("risk.exits", store.risk?.exits);
    // eslint-disable-next-line no-console
    console.log("risk.breakeven", store.risk?.breakeven, "risk.trailingTP", store.risk?.trailingTP, "risk.atrStop", store.risk?.atrStop, "risk.timeStop", store.risk?.timeStop);
    // eslint-disable-next-line no-console
    console.log("rules", store.rules, "group", store.ruleGroup, "sequence", store.sequence);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  return (
    <div className="rounded-lg border p-3">
      <p className="text-base md:text-lg leading-6 whitespace-pre-line">{text}</p>
    </div>
  );
}
