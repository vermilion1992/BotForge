import { buildAliasMeta, ruleToSentence } from "@/botforge/lib/beginnerLabels";

function joinHuman(parts: string[], sep=", ", last=" and ") {
  const a = parts.filter(Boolean);
  if (a.length <= 1) return a.join("");
  return a.slice(0, -1).join(sep) + last + a[a.length - 1];
}

function groupPhrase(group?: { mode: "ALL"|"ANY"|"K_OF_N"; k?: number }) {
  if (!group) return "all rules are true";
  if (group.mode === "ALL") return "all of these are true";
  if (group.mode === "ANY") return "any of these is true";
  if (group.mode === "K_OF_N") return `at least ${group.k ?? 2} of these are true`;
  return "the rules are satisfied";
}

function filtersPhrase(filters: any): string {
  if (!filters?.enabled) return "";
  if (!Array.isArray(filters?.clauses) || filters.clauses.length === 0) return "";
  const list: string[] = [];
  for (const c of filters.clauses) {
    if (c.type === "htf_trend") list.push("trend filter is on");
    else if (c.type === "atr_band") {
      if (c.minPct != null && c.maxPct != null) list.push(`volatility is between ${c.minPct}% and ${c.maxPct}%`);
      else list.push("volatility filter is on");
    } else if (c.type === "volume") list.push("volume filter is on");
  }
  return list.length ? `Only trade when ${joinHuman(list)}.` : "";
}

function exitsPhrase(risk: any, riskProfile?: string): { text: string; warnings: string[] } {
  const warns: string[] = [];
  const ex = risk?.exits || {};
  const parts: string[] = [];
  const sl = ex.defaultSLPct;
  const tp = ex.defaultTPPct;
  const hasSL = sl != null;
  const hasTP = tp != null;

  if (!hasSL) warns.push("Heads up: no Stop Loss is set.");
  if (hasSL && hasTP) parts.push(`price falls ${sl}% (stop) or rises ${tp}% (take profit)`);
  else if (hasSL) parts.push(`price falls ${sl}% (stop)`);
  else if (hasTP) parts.push(`price rises ${tp}% (take profit)`);

  if (Array.isArray(ex.tpStepsPct) && ex.tpStepsPct.length) {
    const steps = ex.tpStepsPct.map((v:number,i:number)=> ex.tpAllocPct?.[i]!=null ? `${v}% (${ex.tpAllocPct[i]}%)` : `${v}%`);
    parts.push(`scale out at ${joinHuman(steps)}`);
  }
  if (risk?.breakeven?.enabled) parts.push(`move stop to entry after a small gain`);
  if (risk?.trailingTP?.enabled) parts.push(`trail profits with a trailing stop`);
  if (risk?.timeStop?.enabled && risk?.timeStop?.bars != null) parts.push(`close after ${risk.timeStop.bars} candles if still open`);

  let text = parts.length ? `It will close the trade when ${joinHuman(parts)}.` : "Exits haven't been configured.";
  if (!riskProfile) text += " (Please select a Risk Profile)";
  return { text, warnings: warns };
}

function directionPhrase(direction?: string, inverse?: boolean) {
  if (!direction && inverse == null) return "Please select direction";
  // direction could be "long_only" | "short_only" | "both"
  const invOn = !!inverse;
  if (direction === "long_only") return invOn ? "Long-only (inverse signals on)" : "Long-only";
  if (direction === "short_only") return invOn ? "Short-only (inverse signals on)" : "Short-only";
  return invOn ? "Long & Short (inverse signals on)" : "Long & Short";
}

export function buildSummaryFromStore(store: any) {
  const { selectedPreset, ruleGroup, rules = [], sequence, filters, timeframe, pairs, risk, riskProfile, direction, inverseSignals } = store || {};

  const tfTxt = timeframe ? `${timeframe}` : "Please select timeframe";
  const pairsTxt = pairs?.setName ? `${pairs.setName}` : (pairs?.selectedCount ? `${pairs.selectedCount} selected pairs` : "Please select pairs");
  const dirTxt = directionPhrase(direction, inverseSignals);

  const { meta: aliasMeta, counts: countsById } = buildAliasMeta(selectedPreset);
  const listed = rules.map((r:any, i:number) => ({ ...r, _alpha: r._alpha || String.fromCharCode(65 + i) }));

  // Build readable rule bullets
  const ruleSentences = listed.map((r:any)=> `${r._alpha}. ${ruleToSentence(r, { aliasMeta, countsById })}`);
  const grpTxt = groupPhrase(ruleGroup);

  // Sequence text
  let seqTxt = "";
  if (sequence?.enabled) {
    const A = listed.find((r:any)=> r.id === sequence.ruleAId);
    const B = listed.find((r:any)=> r.id === sequence.ruleBId);
    if (!A || !B) {
      const missing = !A && !B ? "Rule A and Rule B" : !A ? "Rule A" : "Rule B";
      seqTxt = `In order: (Please select ${missing}) within ${Math.max(1, Number(sequence.withinBars || 3))} candles.`;
    } else {
      seqTxt = `In order: first ${A._alpha}, then ${B._alpha} within ${Math.max(1, Number(sequence.withinBars || 3))} candles.`;
    }
  }

  const filtersTxt = filtersPhrase(filters);
  const { text: exitsTxt, warnings } = exitsPhrase(risk, riskProfile);

  const header = `**Timeframe:** ${tfTxt}  |  **Pairs:** ${pairsTxt}  |  **Direction:** ${dirTxt}`;
  const intro = `Your bot will open a trade when ${grpTxt}:`;
  const rulesBlock = ruleSentences.length ? `\n- ${ruleSentences.join("\n- ")}` : "\n- Please add entry rules";
  const paragraph = [
    header,
    intro,
    rulesBlock,
    seqTxt,
    filtersTxt,
    exitsTxt,
    warnings.length ? warnings.join(" ") : ""
  ].filter(Boolean).join("\n\n");

  return paragraph;
}


