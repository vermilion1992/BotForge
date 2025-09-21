import { buildAliasMeta, ruleToSentence, ruleTitle } from "@/botforge/lib/beginnerLabels";

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

function exitsPhrase(risk: any, riskProfile?: string, side: "long"|"short"="long"): { text: string; warnings: string[] } {
  const warns: string[] = [];
  const ex = risk || {};
  const parts: string[] = [];
  const sl = ex.defaultSLPct;
  const hasSL = sl != null;
  const hasATRStop = risk.atrStop?.enabled;

  if (!hasSL && !hasATRStop) warns.push("Heads up: no Stop Loss is set.");

  // Handle stop loss
  if (hasSL) {
    parts.push(side === "long"
      ? `price falls ${sl}% (stop)`
      : `price rises ${sl}% (stop)`);
  }

  // Handle multi-target scaling (Advanced/Expert)
  if (ex.multiTP?.enabled && Array.isArray(ex.multiTP.targets)) {
    const targets = ex.multiTP.targets.filter((t: any) => t.pct != null);
    if (targets.length > 0) {
      const steps = targets.map((t: any) => 
        t.sizePct != null ? `${t.pct}% (${t.sizePct}%)` : `${t.pct}%`
      );
      parts.push(`scale out at ${joinHuman(steps)}`);
    }
  } else if (ex.defaultTPPct != null) {
    // Single take profit (Standard)
    parts.push(side === "long"
      ? `price rises ${ex.defaultTPPct}% (take profit)`
      : `price falls ${ex.defaultTPPct}% (take profit)`);
  }

  // Handle advanced exits - these are at the top level of the risk object
  if (risk.breakeven?.enabled) {
    const trigger = risk.breakeven.trigger === "after_tp1" ? "after first target" : "after a small gain";
    const offset = risk.breakeven.offsetPct != null ? ` (${risk.breakeven.offsetPct}% offset)` : "";
    parts.push(`move stop to entry ${trigger}${offset}`);
  }
  
  if (risk.trailingTP?.enabled) {
    if (risk.trailingTP.mode === "atr") {
      const atrMult = risk.trailingTP.atrMult != null ? risk.trailingTP.atrMult : 1.0;
      parts.push(`trail profits with ATR-based trailing stop (${atrMult}x ATR) after TP2`);
    } else {
      const valuePct = risk.trailingTP.valuePct != null ? risk.trailingTP.valuePct : 1.0;
      parts.push(`trail profits with ${valuePct}% trailing stop after TP2`);
    }
  }
  
  if (risk.atrStop?.enabled) {
    const atrMult = risk.atrStop.atrMult != null ? risk.atrStop.atrMult : 2.0;
    parts.push(`use ATR-based stop (${atrMult}x ATR)`);
  }
  
  if (risk.timeStop?.enabled && risk.timeStop.bars != null) {
    parts.push(`close after ${risk.timeStop.bars} candles if still open`);
  }

  let text = parts.length ? `Exits (${side}): ${joinHuman(parts)}.` : "";
  if (!riskProfile) text += (text ? " " : "") + "(Please select a Risk Profile)";
  return { text, warnings: warns };
}

function header(timeframe?: string, pairs?: any, showLong?: boolean, showShort?: boolean, inverse?: boolean) {
  const tfTxt = timeframe || "Please select timeframe";
  const pairsTxt = pairs?.setName ? pairs.setName : (pairs?.selectedCount ? `${pairs.selectedCount} selected pairs` : "Please select pairs");
  let dirTxt = "Please select direction";
  if (showLong && showShort) dirTxt = `Long & Short (${inverse ? "inverse on" : "inverse off"})`;
  else if (showLong && !showShort) dirTxt = "Long-only (short disabled)";
  else if (!showLong && showShort) dirTxt = "Short-only";
  return `**Timeframe:** ${tfTxt}  |  **Pairs:** ${pairsTxt}  |  **Direction:** ${dirTxt}`;
}

function sequenceLine(sequence: any, listed: any[]): string {
  if (!sequence?.enabled) return "";
  const A = listed.find((r:any)=> r.id === sequence.ruleAId);
  const B = listed.find((r:any)=> r.id === sequence.ruleBId);
  const w = Math.max(1, Number(sequence.withinBars || 3));
  if (!A && !B) return `In order: (Please select Rule A and Rule B) within ${w} candles.`;
  if (!A) return `In order: (Please select Rule A) then B within ${w} candles.`;
  if (!B) return `In order: first A then (Please select Rule B) within ${w} candles.`;
  return `Order matters: first ${A._alpha}, then ${B._alpha} within ${w} candles.`;
}

export function buildDirectionalSummary(store: any) {
  const { selectedPreset, ruleGroup, rules = [], sequence, filters, timeframe, pairs, risk, riskProfile, direction, inverseSignals } = store || {};
  const { meta: aliasMeta, counts: countsById } = buildAliasMeta(selectedPreset);
  const listed = (rules || []).map((r:any, i:number) => ({ ...r, _alpha: r._alpha || String.fromCharCode(65 + i) }));
  const grpTxt = groupPhrase(ruleGroup);

  const ruleLines = listed.map((r:any)=> {
    const sentence = ruleToSentence(r, { aliasMeta, countsById });
    const title = ruleTitle(r, sentence);
    return `${r._alpha}. ${title}: ${sentence}`;
  });

  const seqTxt = sequenceLine(sequence, listed);
  const filtersTxt = filtersPhrase(filters);

  const showLong = direction === "long_only" || direction === "both";
  const showShort = direction === "short_only" || (direction === "both" && !!inverseSignals);

  const headerLine = header(timeframe, pairs, showLong, showShort, inverseSignals);

  const longBlock = showLong
    ? [
        `**When it will open a long trade (${grpTxt}):**`,
        ruleLines.length ? `- ${ruleLines.join("\n- ")}` : "- Please add entry rules",
        seqTxt
      ].filter(Boolean).join("\n")
    : "";

  let shortBlock = "";
  if (showShort) {
    // If no explicit short rules, mirror phrasing (down/low/trending down). We do not fabricate if rules are empty.
    const mirrored = ruleLines.length
      ? ruleLines.map((s:string)=> s
          .replace(/goes up through/g, "goes down through")
          .replace(/goes down through/g, "goes up through") // keep order safe if both present
          .replace(/recent high band/g, "recent low band")
          .replace(/recent low band/g, "recent high band")
          .replace(/is trending up/g, "is trending down")
          .replace(/is trending down/g, "is trending up")
          .replace(/is at or above/g, "is at or below")
          .replace(/is at or below/g, "is at or above"))
      : [];
    shortBlock = [
      `**When it will open a short trade (${grpTxt}):**`,
      mirrored.length ? `- ${mirrored.join("\n- ")}` : "- Please add entry rules for short or enable inverse signals",
      seqTxt
    ].filter(Boolean).join("\n");
  }

  const exitsLong = showLong ? exitsPhrase(risk, riskProfile, "long").text : "";
  const exitsShort = showShort ? exitsPhrase(risk, riskProfile, "short").text : "";
  const warnings = [
    exitsPhrase(risk, riskProfile, "long").warnings.join(" "),
    showShort ? exitsPhrase(risk, riskProfile, "short").warnings.join(" ") : ""
  ].filter(Boolean).join(" ");

  return [
    headerLine,
    longBlock,
    shortBlock,
    filtersTxt,
    [exitsLong, exitsShort].filter(Boolean).join("\n"),
    warnings
  ].filter(Boolean).join("\n\n");
}
