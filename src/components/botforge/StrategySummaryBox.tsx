"use client";
import { useBuilderStore } from "@/botforge/state/builderStore";
import { buildGuidedSummary, buildExpertSummary } from "@/botforge/lib/summary_modes";
import { useStrategySummary } from "@/botforge/summary/useStrategySummary";

export default function StrategySummaryBox() {
  // Get live strategy summary
  const { text: liveText } = useStrategySummary();
  
  // Subscribe to canonical keys + summaryVersion for live updates (keeping for fallback)
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

  // Use live summary as primary, fallback to legacy if needed
  const text = liveText || (store.summaryMode === "expert" ? buildExpertSummary(store) : buildGuidedSummary(store));

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

  // Parse the text to separate headers from content for styling
  const lines = text.split('\n').filter(Boolean);
  
  return (
    <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 shadow-sm">
      <div className="space-y-3">
        {lines.map((line, index) => {
          // For lines with multiple headers separated by •, we need to style each header/content pair
          if (line.includes(':')) {
            // Split by • to handle multiple sections on one line
            const sections = line.split(' • ');
            
            // First line (setup info) - spread evenly across full width
            if (index === 0 && sections.length > 2) {
              return (
                <div key={index} className="grid grid-cols-4 gap-x-4 text-sm">
                  {sections.map((section, sectionIndex) => {
                    const colonIndex = section.indexOf(':');
                    if (colonIndex > 0) {
                      const header = section.substring(0, colonIndex + 1);
                      const content = section.substring(colonIndex + 1).trim();
                      return (
                        <div key={sectionIndex} className="flex items-baseline">
                          <span className="font-semibold text-blue-900 dark:text-blue-100">{header}</span>
                          {content && <span className="text-blue-600 dark:text-blue-400 ml-1">{content}</span>}
                        </div>
                      );
                    } else {
                      return (
                        <div key={sectionIndex} className="text-blue-600 dark:text-blue-400">
                          {section}
                        </div>
                      );
                    }
                  })}
                </div>
              );
            } else {
              // Other lines - use standard layout
              return (
                <div key={index} className="text-sm flex">
                  <div className="flex flex-wrap items-baseline gap-x-1">
                    {sections.map((section, sectionIndex) => {
                      const colonIndex = section.indexOf(':');
                      if (colonIndex > 0) {
                        const header = section.substring(0, colonIndex + 1);
                        const content = section.substring(colonIndex + 1).trim();
                        return (
                          <span key={sectionIndex} className="flex items-baseline">
                            {sectionIndex > 0 && <span className="text-blue-600 dark:text-blue-400 mx-2">•</span>}
                            <span className="font-semibold text-blue-900 dark:text-blue-100">{header}</span>
                            {content && <span className="text-blue-600 dark:text-blue-400 ml-1">{content}</span>}
                          </span>
                        );
                      } else {
                        return (
                          <span key={sectionIndex} className="text-blue-600 dark:text-blue-400">
                            {sectionIndex > 0 && ' • '}{section}
                          </span>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            }
          } else {
            // Line without any headers - treat as plain content
            return (
              <div key={index} className="text-sm text-blue-600 dark:text-blue-400">
                {line}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
