import { ruleToSentence } from "@/botforge/lib/beginnerLabels";

export function joinHuman(parts: string[], sep=", ", last=" and ") {
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
  if (!filters?.enabled || !filters?.clauses?.length) return "";
  const bits: string[] = [];
  for (const c of filters.clauses) {
    switch (c.type) {
      case "htf_trend":
        bits.push("trend filter is on");
        break;
      case "atr_band":
        bits.push(c.minPct!=null && c.maxPct!=null ? `volatility is between ${c.minPct}% and ${c.maxPct}%` : "volatility filter is on");
        break;
      case "volume":
        bits.push("volume filter is on");
        break;
    }
  }
  return bits.length ? `Only trade when ${joinHuman(bits)}.` : "";
}

function exitsPhrase(risk: any): { text: string; warnings: string[] } {
  const warns: string[] = [];
  const ex = risk?.exits || {};
  const parts: string[] = [];
  if (ex.defaultSLPct == null) warns.push("Heads up: no Stop Loss is set.");
  if (ex.defaultSLPct != null && ex.defaultTPPct != null) {
    parts.push(`price falls ${ex.defaultSLPct}% (stop) or rises ${ex.defaultTPPct}% (take profit)`);
  } else if (ex.defaultSLPct != null) {
    parts.push(`price falls ${ex.defaultSLPct}% (stop)`);
  } else if (ex.defaultTPPct != null) {
    parts.push(`price rises ${ex.defaultTPPct}% (take profit)`);
  }
  if (Array.isArray(ex.tpStepsPct) && ex.tpStepsPct.length) {
    const steps = ex.tpStepsPct.map((v:number,i:number)=> ex.tpAllocPct?.[i]!=null ? `${v}% (${ex.tpAllocPct[i]}%)` : `${v}%`);
    parts.push(`scale out at ${joinHuman(steps)}`);
  }
  if (risk?.breakeven?.enabled) parts.push(`move stop to entry after a small gain`);
  if (risk?.trailingTP?.enabled) {
    const t = risk.trailingTP.mode === "atr" ? `an ATR-based trailing stop` : `a trailing stop`;
    parts.push(`trail profits with ${t}`);
  }
  if (risk?.timeStop?.enabled && risk?.timeStop?.bars != null) parts.push(`close after ${risk.timeStop.bars} candles if still open`);
  const text = parts.length ? `It will close the trade when ${joinHuman(parts)}.` : "Exits haven't been configured.";
  return { text, warnings: warns };
}

export function buildBeginnerSummary(store: any) {
  const { selectedPreset, ruleGroup, rules = [], sequence, filters, timeframe, pairs, risk } = store || {};
  // Alpha letters already computed upstream; if not, index order
  const listed = rules.map((r:any, i:number) => ({ ...r, _alpha: r._alpha || String.fromCharCode(65 + i) }));

  // Rule sentences (hide indicator lengths)
  const ctx = {
    aliasMeta: (() => {
      const meta: Record<string,{id:string;length?:number}> = {};
      (selectedPreset?.indicators || []).forEach((x:any)=>{ if (x.alias) meta[x.alias] = { id:x.id, length:x.params?.length }; });
      return meta;
    })(),
    countsById: (() => {
      const m: Record<string, number[]> = {};
      (selectedPreset?.indicators || []).forEach((x:any)=> {
        m[x.id] = m[x.id] || [];
        if (x.params?.length != null) m[x.id].push(x.params.length);
      });
      return m;
    })(),
  };

  const sentences = listed.map((r:any)=> `${r._alpha}. ${ruleToSentence(r, ctx)}`);

  // Group + Sequence
  const groupTxt = groupPhrase(ruleGroup);
  let seqTxt = "";
  if (sequence?.enabled && sequence.ruleAId && sequence.ruleBId) {
    const A = listed.find((r:any)=> r.id === sequence.ruleAId);
    const B = listed.find((r:any)=> r.id === sequence.ruleBId);
    if (A && B) {
      seqTxt = `In order: first ${A._alpha}, then ${B._alpha} within ${Math.max(1, Number(sequence.withinBars || 3))} candles.`;
    }
  }

  // Scope
  const tfTxt = timeframe ? ` on ${timeframe}` : "";
  const pairsTxt = pairs?.setName ? ` across ${pairs.setName}` : (pairs?.selectedCount ? ` across ${pairs.selectedCount} selected pairs` : "");
  const intro = `Your bot will open a trade when ${groupTxt}:${sentences.length ? "" : " (no rules set yet)"}`;

  // Filters + Exits
  const filtersTxt = filtersPhrase(filters);
  const { text: exitsTxt, warnings } = exitsPhrase(risk);

  // Assemble
  const paragraph = [
    intro + tfTxt + pairsTxt,
    sentences.length ? `\n- ${sentences.join("\n- ")}` : "",
    seqTxt,
    filtersTxt,
    exitsTxt,
    warnings.length ? warnings.join(" ") : ""
  ].filter(Boolean).join("\n");

  return paragraph;
}


