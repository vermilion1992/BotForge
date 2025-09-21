import { buildAliasMeta, ruleToSentence, ruleTitle } from "@/botforge/lib/beginnerLabels";

// ---------- TP extraction helpers ----------
type TPItem = { pct: number, alloc?: number };
function roundN(v: any, n=2) {
  const x = Number(v);
  if (!isFinite(x)) return undefined;
  const f = Math.pow(10, n);
  return Math.round(x * f) / f;
}
function normalizeSteps(steps?: any[], alloc?: any[]): TPItem[] {
  if (!Array.isArray(steps) || steps.length === 0) return [];
  return steps.map((p: any, i: number) => {
    const pct = roundN(p);
    const a = Array.isArray(alloc) ? roundN(alloc[i]) : undefined;
    return pct != null ? { pct, alloc: a } : undefined;
  }).filter(Boolean) as TPItem[];
}
function fromTargetsArr(targets?: any[]): TPItem[] {
  if (!Array.isArray(targets)) return [];
  const out: TPItem[] = [];
  for (const t of targets) {
    const pct = roundN(t?.percent ?? t?.pct ?? t?.tpPct);
    const alloc = roundN(t?.alloc ?? t?.allocationPct ?? t?.sizePct);
    if (pct != null) out.push({ pct, alloc });
  }
  return out;
}
function getTPConfig(risk: any, selectedPreset?: any): { steps: TPItem[], single?: number } {
  const ex = risk?.exits || {};
  // Primary shape
  let steps = normalizeSteps(ex.tpStepsPct, ex.tpAllocPct);
  // Targets array shape
  if (steps.length === 0 && Array.isArray(ex.targets)) steps = fromTargetsArr(ex.targets);
  // Legacy: trailingTP holds step defaults
  if (steps.length === 0) {
    const tt = risk?.trailingTP || {};
    steps = normalizeSteps(tt.takeProfitSteps ?? tt.takeProfitStepsDefault, tt.takeProfitAlloc ?? tt.takeProfitAllocDefault);
  }
  // Preset defaults fallback
  if (steps.length === 0 && selectedPreset?.riskDefaults?.exits) {
    const pex = selectedPreset.riskDefaults.exits;
    steps = normalizeSteps(pex.tpStepsPct, pex.tpAllocPct);
    if (steps.length === 0 && Array.isArray(pex.targets)) steps = fromTargetsArr(pex.targets);
  }
  // Single TP
  let single = ex.defaultTPPct;
  if (single == null && selectedPreset?.riskDefaults?.exits?.defaultTPPct != null) {
    single = selectedPreset.riskDefaults.exits.defaultTPPct;
  }
  single = single != null ? roundN(single) : undefined;
  return { steps, single };
}

function joinHuman(parts: string[], sep=", ", last=" and ") {
  const a = parts.filter(Boolean);
  if (a.length <= 1) return a.join("");
  return a.slice(0, -1).join(sep) + last + a[a.length - 1];
}

function resolveHeader(timeframe?: string, pairs?: any, showLong?: boolean, showShort?: boolean, inverse?: boolean) {
  const tfTxt = timeframe || "Please select timeframe";
  let pairsTxt = "Please select pairs";
  if (pairs?.setName) {
    const n = String(pairs.setName);
    pairsTxt = /pairs/i.test(n) ? n : `${n} pairs`;
  } else if (pairs?.selectedCount) {
    pairsTxt = `${pairs.selectedCount} selected pairs`;
  }
  let dirTxt = "Please select direction";
  if (showLong && showShort) dirTxt = `Long & Short (${inverse ? "inverse on" : "inverse off"})`;
  else if (showLong && !showShort) dirTxt = "Long-only (short disabled)";
  else if (!showLong && showShort) dirTxt = "Short-only";
  return `**Timeframe:** ${tfTxt}  |  **Pairs:** ${pairsTxt}  |  **Direction:** ${dirTxt}`;
}

function filtersPhrase(filters: any): string {
  if (!filters?.enabled) return "";
  if (!Array.isArray(filters?.clauses) || filters.clauses.length === 0) return "";
  const list: string[] = [];
  for (const c of filters.clauses) {
    if (c.type === "htf_trend") list.push("trend filter");
    else if (c.type === "atr_band") {
      if (c.minPct != null && c.maxPct != null) list.push(`volatility ${c.minPct}%–${c.maxPct}%`);
      else list.push("volatility filter");
    } else if (c.type === "volume") list.push("volume filter");
  }
  return list.length ? `filtered by ${joinHuman(list)}` : "";
}

function seqLine(sequence: any, listed: any[]): string {
  if (!sequence?.enabled) return "";
  const A = listed.find((r:any)=> r.id === sequence.ruleAId);
  const B = listed.find((r:any)=> r.id === sequence.ruleBId);
  const w = Math.max(1, Number(sequence.withinBars || 3));
  if (!A && !B) return `Sequence: (Please select Rule A and Rule B) within ${w} candles.`;
  if (!A) return `Sequence: (Please select Rule A) then B within ${w} candles.`;
  if (!B) return `Sequence: first A then (Please select Rule B) within ${w} candles.`;
  return `Sequence: ${A._alpha}→${B._alpha} within ${w} candles.`;
}

function mirrorForShort(lines: string[]): string[] {
  return lines.map((s) => s
    .replace(/goes up through/g, "goes down through")
    .replace(/goes down through/g, "goes up through")
    .replace(/is at or above/g, "is at or below")
    .replace(/is at or below/g, "is at or above")
    .replace(/recent high band/g, "recent low band")
    .replace(/recent low band/g, "recent high band")
    .replace(/is trending up/g, "is trending down")
    .replace(/is trending down/g, "is trending up")
  );
}

function exitsFriendly(risk: any, riskProfile?: string, side: "long"|"short"="long", selectedPreset?: any): string {
  const ex = risk?.exits || {};
  const sl = ex.defaultSLPct;
  const { steps, single } = getTPConfig(risk, selectedPreset);
  const sents: string[] = [];
  if (steps.length > 0) {
    const parts = steps.map((t, i) => {
      const name = `TP${i+1}`;
      return t.alloc != null ? `${name} +${t.pct}% (${t.alloc}%)` : `${name} +${t.pct}%`;
    });
    const plural = steps.length > 1 ? "steps" : "step";
    sents.push(`The bot scales out in ${steps.length} ${plural} — ${parts.join(", ")}`);
  } else if (single != null) {
    sents.push(`Takes profit at +${single}%`);
  }
  if (sl != null) {
    const sign = side === "long" ? "−" : "+";
    sents.push(`The stop loss starts at ${sign}${sl}%`);
  }
  if (risk?.breakeven?.enabled) {
    const off = risk?.breakeven?.offsetPct != null ? risk.breakeven.offsetPct : 0;
    sents.push(`${steps.length ? "After TP1" : "After the first profit target"}, the stop moves to breakeven (+${off}% buffer)`);
  }
  if (risk?.trailingTP?.enabled) {
    const mode = risk.trailingTP.mode || "atr";
    if (mode === "atr") {
      const m = risk.trailingTP.atrMult ?? risk.trailingTP.atrMultDefault ?? 1.0;
      sents.push(`${steps.length > 1 ? "After TP2" : "After the second profit target"}, a volatility-aware trailing stop (ATR×${m}) follows price`);
    } else {
      const p = risk.trailingTP.stepPct ?? risk.trailingTP.stepPctDefault ?? 1.0;
      sents.push(`${steps.length > 1 ? "After TP2" : "After the second profit target"}, a trailing stop of ${p}% follows price`);
    }
  }
  if (risk?.atrStop?.enabled) {
    const m = risk.atrStop.atrMult ?? risk.atrStop.atrMultDefault ?? 2.0;
    sents.push(`A protective ATR stop (×${m}) runs in parallel`);
  }
  if (risk?.timeStop?.enabled && risk?.timeStop?.bars != null) {
    sents.push(`Any open position auto-closes after ${risk.timeStop.bars} candles`);
  }
  let txt = sents.join(". ") + ".";
  if (!riskProfile) txt += " (Please select a Risk Profile)";
  return `Exits: ${txt}`;
}

function exitsCompact(risk: any, riskProfile?: string, side: "long"|"short"="long", selectedPreset?: any): string {
  const ex = risk?.exits || {};
  const sl = ex.defaultSLPct;
  const { steps, single } = getTPConfig(risk, selectedPreset);
  const tpPart = steps.length
    ? steps.map((t)=> t.alloc != null ? `+${t.pct}%(${t.alloc}%)` : `+${t.pct}%`).join("/")
    : (single != null ? `+${single}%` : "");

  const bits: string[] = [];
  if (sl!=null) bits.push(`SL ${sl}%`);
  if (tpPart) bits.push(`TP ${tpPart}`);
  if (risk?.breakeven?.enabled) {
    const off = risk?.breakeven?.offsetPct != null ? risk.breakeven.offsetPct : 0;
    bits.push(`BE @TP1 (+${off}%)`);
  }
  if (risk?.trailingTP?.enabled) {
    const mode = risk.trailingTP.mode || "atr";
    if (mode === "atr") {
      const m = risk.trailingTP.atrMult ?? risk.trailingTP.atrMultDefault ?? 1.0;
      bits.push(`Trail ATR×${m} after TP2`);
    } else {
      const p = risk.trailingTP.stepPct ?? risk.trailingTP.stepPctDefault ?? 1.0;
      bits.push(`Trail ${p}% after TP2`);
    }
  }
  if (risk?.atrStop?.enabled) {
    const m = risk.atrStop.atrMult ?? risk.atrStop.atrMultDefault ?? 2.0;
    bits.push(`ATR Stop ×${m}`);
  }
  if (risk?.timeStop?.enabled && risk?.timeStop?.bars != null) bits.push(`Time ${risk.timeStop.bars} candles`);
  if (!riskProfile) bits.push("Select Risk Profile");
  return `Exits${side==="long"?"": " (Short)"}: ${bits.join(" • ")}`;
}

export function buildGuidedSummary(store: any) {
  const { selectedPreset, ruleGroup, rules = [], sequence, filters, timeframe, pairs, risk, riskProfile, direction, inverseSignals } = store || {};
  const { meta: aliasMeta, counts: countsById } = buildAliasMeta(selectedPreset);
  const listed = (rules || []).map((r:any, i:number) => ({ ...r, _alpha: r._alpha || String.fromCharCode(65 + i) }));

  const showLong = direction === "long_only" || direction === "both";
  const showShort = direction === "short_only" || (direction === "both" && !!inverseSignals);

  const ruleSentences = listed.map((r:any)=> ruleToSentence(r, { aliasMeta, countsById }));

  // Build inline numbered clause: (1) x, (2) y, (3) z
  const numbered = ruleSentences.length
    ? ruleSentences.map((s:string, i:number)=> `(${i+1}) ${s}`).join(", ")
    : "(Please add entry rules)";

  const logicWord =
    ruleGroup?.mode === "ALL" ? "all of the following are satisfied"
    : ruleGroup?.mode === "ANY" ? "any one of the following is satisfied"
    : `at least ${ruleGroup?.k ?? 2} of the following are satisfied`;

  const filtTxt = filtersPhrase(filters);
  const entryLine = `Entries: The bot will operate on the ${timeframe || "Please select timeframe"} time frame across the ${pairs?.setName ? (/pairs/i.test(pairs.setName) ? pairs.setName : pairs.setName + " pairs") : (pairs?.selectedCount ? pairs.selectedCount + " selected pairs" : "Please select pairs")}; it enters only if ${logicWord}: ${numbered}.` + (filtTxt ? ` Entries are ${filtTxt}.` : "");

  const longBlock = showLong ? entryLine : "";

  let shortBlock = "";
  if (showShort) {
    const mirrored = ruleSentences.length ? mirrorForShort(ruleSentences) : [];
    const numberedS = mirrored.length
      ? mirrored.map((s:string, i:number)=> `(${i+1}) ${s}`).join(", ")
      : "(Please add short entry rules or enable inverse)";
    const logicS =
      ruleGroup?.mode === "ALL" ? "all of the following are satisfied"
      : ruleGroup?.mode === "ANY" ? "any one of the following is satisfied"
      : `at least ${ruleGroup?.k ?? 2} of the following are satisfied`;
    shortBlock = `Entries (Short): It enters only if ${logicS}: ${numberedS}.` + (filtTxt ? ` Entries are ${filtTxt}.` : "");
  }

  // Sequence line (only when enabled), reference by numbers 1/2, not A/B
  const seqTxt = sequence?.enabled ? (() => {
    const idx = (id:string|undefined) => {
      const pos = listed.findIndex((x:any)=> x.id === id);
      return pos >= 0 ? (pos + 1) : undefined;
    };
    const a = idx(sequence.ruleAId);
    const b = idx(sequence.ruleBId);
    const w = Math.max(1, Number(sequence.withinBars || 3));
    if (!a && !b) return `Sequence: (1) and (2) must be selected within ${w} candles.`;
    if (!a) return `Sequence: (1) must be selected before (${b ?? 2}) within ${w} candles.`;
    if (!b) return `Sequence: (${a}) must occur before (2) within ${w} candles.`;
    return `Sequence: (${a}) must occur before (${b}) within ${w} candles.`;
  })() : "";

  const exitsL = showLong ? exitsFriendly(risk, riskProfile, "long", selectedPreset) : "";
  const exitsS = showShort ? exitsFriendly(risk, riskProfile, "short", selectedPreset) : "";

  // No header; just entries/sequence/short/exits in plain text
  return [longBlock, seqTxt, shortBlock, exitsL, exitsS].filter(Boolean).join("\n\n");
}

export function buildExpertSummary(store: any) {
  const { selectedPreset, ruleGroup, rules = [], sequence, filters, timeframe, pairs, risk, riskProfile, direction, inverseSignals } = store || {};
  const { meta: aliasMeta, counts: countsById } = buildAliasMeta(selectedPreset);
  const listed = (rules || []).map((r:any, i:number) => ({ ...r, _alpha: r._alpha || String.fromCharCode(65 + i) }));

  const showLong = direction === "long_only" || direction === "both";
  const showShort = direction === "short_only" || (direction === "both" && !!inverseSignals);

  const shortSentences = listed.map((r:any)=> {
    const s = ruleToSentence(r, { aliasMeta, countsById });
    return `${r._alpha}. ${s}`;
  });
  const seqTxt = sequence?.enabled ? ` • Seq ${(() => {
    const A = listed.find((x:any)=> x.id === sequence.ruleAId)?._alpha || "A";
    const B = listed.find((x:any)=> x.id === sequence.ruleBId)?._alpha || "B";
    return `${A}→${B} ≤${Math.max(1, Number(sequence.withinBars || 3))}`;
  })()} candles` : "";
  const filtTxt = (() => {
    const t = filtersPhrase(filters);
    return t ? ` • ${t}` : "";
  })();

  const tf = timeframe || "TF?";
  const ps = pairs?.setName ? (/pairs/i.test(pairs.setName) ? pairs.setName : pairs.setName + " pairs") : (pairs?.selectedCount ? `${pairs.selectedCount} pairs` : "Pairs?");
  const logic =
    ruleGroup?.mode === "ALL" ? "all"
    : ruleGroup?.mode === "ANY" ? "any"
    : `≥${ruleGroup?.k ?? 2}`;

  const entriesLine = `Entries: ${tf} · ${ps} — ${logic}: ${shortSentences.join(" • ")}${seqTxt}${filtTxt}`;

  const longPart = showLong ? entriesLine : "";
  const shortPart = showShort ? `Entries (Short): ${tf} · ${ps} — mirrored ${logic}${seqTxt}${filtTxt}` : "";

  const exitsL = showLong ? exitsCompact(risk, riskProfile, "long", selectedPreset) : "";
  const exitsS = showShort ? exitsCompact(risk, riskProfile, "short", selectedPreset) : "";

  // No header; just entries and exits
  return [longPart, shortPart, exitsL, exitsS].filter(Boolean).join("\n\n");
}
