import { ruleSentence } from "@/botforge/lib/friendly";

type StoreShape = {
  selectedPreset?: any;
  ruleGroup?: { mode: "ALL"|"ANY"|"K_OF_N"; k?: number };
  rules?: Array<any>;               // already normalized & letter-tagged
  sequence?: { enabled: boolean; ruleAId?: string; ruleBId?: string; withinBars?: number };
  filters?: { trend?: boolean; volume?: boolean; atr?: boolean; note?: string };
  timeframe?: string;               // e.g., "1h"
  pairs?: { selectedCount?: number; setName?: string }; // e.g., "Top 30" + count
  risk?: {
    exits?: { defaultSLPct?: number; defaultTPPct?: number; tpStepsPct?: number[]; tpAllocPct?: number[] };
    breakeven?: { enabled?: boolean; offsetPct?: number };
    trailingTP?: { enabled?: boolean; mode?: "percent"|"atr"; valuePct?: number; atrMult?: number };
    timeStop?: { enabled?: boolean; bars?: number };
  };
};

function join(parts: string[], sep = ", ", lastSep = " and ") {
  const a = parts.filter(Boolean);
  if (a.length <= 1) return a.join("");
  return a.slice(0, -1).join(sep) + lastSep + a[a.length - 1];
}

function groupText(g?: StoreShape["ruleGroup"]) {
  if (!g) return "all entry rules";
  if (g.mode === "ALL") return "all of the following rules";
  if (g.mode === "ANY") return "any of the following rules";
  if (g.mode === "K_OF_N") return `at least ${g.k ?? 2} of the following rules`;
  return "the configured entry rules";
}

function seqText(s?: StoreShape["sequence"], findName?: (id?: string)=>string, findLetter?: (id?:string)=>string) {
  if (!s?.enabled) return "";
  const A = findLetter?.(s.ruleAId) || "A";
  const B = findLetter?.(s.ruleBId) || "B";
  const nA = findName?.(s.ruleAId) || "Rule A";
  const nB = findName?.(s.ruleBId) || "Rule B";
  const w = Math.max(1, Number(s.withinBars || 3));
  return ` in sequence: ${A} (${nA}) then ${B} (${nB}) within ${w} bars`;
}

function filtersText(f?: StoreShape["filters"]) {
  if (!f) return "";
  const list: string[] = [];
  if (f.trend)  list.push("trend filter");
  if (f.volume) list.push("volume filter");
  if (f.atr)    list.push("ATR activity filter");
  if (!list.length) return "";
  return ` Only when ${join(list)} are satisfied.`;
}

function exitsText(r?: StoreShape["risk"]) {
  if (!r) return "";
  const out: string[] = [];
  const ex = r.exits || {};
  const sl = ex.defaultSLPct;
  const tp = ex.defaultTPPct;
  if (sl != null && tp != null) out.push(`use a default Stop Loss of ${sl}% and Take Profit of ${tp}%`);
  if (Array.isArray(ex.tpStepsPct) && ex.tpStepsPct.length) {
    // simple multi-TP summary
    const steps = ex.tpStepsPct.map((v,i)=> (ex.tpAllocPct?.[i] != null ? `${v}% (${ex.tpAllocPct[i]}%)` : `${v}%`));
    out.push(`scale out at ${join(steps)}`);
  }
  if (r.breakeven?.enabled) out.push(`move stop to breakeven after +${r.breakeven.offsetPct ?? 0}%`);
  if (r.trailingTP?.enabled) {
    const t = r.trailingTP.mode === "atr"
      ? `ATR×${r.trailingTP.atrMult ?? 1}`
      : `${r.trailingTP.valuePct ?? 1}% trailing`;
    out.push(`trail profits with ${t}`);
  }
  if (r.timeStop?.enabled) out.push(`exit after ${r.timeStop.bars ?? 0} bars if still open`);
  if (!out.length) return " Exits have not been configured.";
  return " Exits: " + join(out, ", ", ", and ");
}

export function buildStrategySummary(store: StoreShape) {
  const preset = store.selectedPreset;
  const name = preset?.label || "Custom Strategy";
  const intent = preset?.designIntent || "Strategy";
  const tf = store.timeframe ? ` on ${store.timeframe}` : "";
  const pairs = store.pairs?.setName
    ? ` across ${store.pairs.setName} (${store.pairs.selectedCount ?? "multiple"} pairs)`
    : (store.pairs?.selectedCount ? ` across ${store.pairs.selectedCount} selected pairs` : "");
  const grp = groupText(store.ruleGroup);

  const rules = (store.rules || []);
  const findName   = (id?:string) => rules.find((r:any)=>r.id===id)?.friendly || rules.find((r:any)=>r.id===id)?.displayName || "";
  const findLetter = (id?:string) => rules.find((r:any)=>r.id===id)?._alpha || "";
  const seq = seqText(store.sequence, findName, findLetter);

  // One-line sentences for the first few rules
  const ruleLines = rules.slice(0, 6).map((r:any)=> `${r._alpha}. ${ruleSentence(r)}`);
  const rulePart = ruleLines.length ? ` Enter when ${grp} hold:\n- ${ruleLines.join("\n- ")}` : " Entry rules are not configured.";

  const filters = filtersText(store.filters);
  const exits   = exitsText(store.risk);

  const summary = `${name}: ${intent}${tf}${pairs}.${filters}${exits}`;
  return { summary, rulePart, seq };
}



