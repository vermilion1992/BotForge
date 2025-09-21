import type { RiskTier, RiskVariant } from "@/botforge/content/risk_tiles";
import { RISK_PRESETS } from "@/botforge/content/risk_tiles";

export function summarizeRiskConfig(tier: RiskTier, variant: RiskVariant): string {
  const p = RISK_PRESETS[tier][variant];
  const parts: string[] = [];
  if (num(p.exits.defaultSLPct)) parts.push(`SL ${fmtPct(p.exits.defaultSLPct!)}`);
  if (num(p.exits.defaultTPPct)) parts.push(`TP ${fmtPct(p.exits.defaultTPPct!)}`);
  if (p.exits.multiTP?.enabled && p.exits.multiTP.targets?.length) {
    const ts = p.exits.multiTP.targets.map(t => `${fmtPct(t.pct)} (${t.sizePct}%)`).join(" / ");
    parts.push(`TP ${ts}`);
  }
  if (p.breakeven?.enabled) {
    const off = num(p.breakeven.offsetPct) ? ` (+${p.breakeven.offsetPct!.toFixed(2)}%)` : "";
    parts.push(`BE @TP1${off}`);
  }
  if (p.trailingTP?.enabled) {
    if (p.trailingTP.mode === "percent" && num(p.trailingTP.valuePct)) parts.push(`Trail % ${p.trailingTP.valuePct!.toFixed(1)} after TP2`);
    if (p.trailingTP.mode === "atr" && num(p.trailingTP.atrMult)) parts.push(`Trail ATR×${p.trailingTP.atrMult} after TP2`);
  }
  if (p.atrStop?.enabled && num(p.atrStop.atrMult)) parts.push(`ATR Stop ×${p.atrStop.atrMult}`);
  if (p.timeStop?.enabled && num(p.timeStop.bars)) parts.push(`Time ${p.timeStop.bars} bars`);
  return parts.join(" • ");
}

export function applyRiskPresetToAdvanced(currentAdvanced: any, tier: RiskTier, variant: RiskVariant) {
  const p = RISK_PRESETS[tier][variant];
  const adv = structuredClone(currentAdvanced || {});
  adv.exits ??= {};
  adv.breakeven ??= { enabled: false };
  adv.trailingTP ??= { enabled: false };
  adv.timeStop ??= { enabled: false };
  adv.atrStop ??= { enabled: false };

  if (num(p.exits.defaultSLPct)) adv.exits.defaultSLPct = p.exits.defaultSLPct;
  if (num(p.exits.defaultTPPct)) { adv.exits.defaultTPPct = p.exits.defaultTPPct; adv.exits.multiTP = { enabled: false }; }

  if (p.exits.multiTP?.enabled) {
    adv.exits.defaultTPPct = undefined;
    adv.exits.multiTP = { enabled: true, targets: structuredClone(p.exits.multiTP.targets || []) };
  } else if (p.exits.multiTP) {
    adv.exits.multiTP = { enabled: false };
  }

  adv.breakeven = structuredClone(p.breakeven || { enabled: false });
  adv.trailingTP = structuredClone(p.trailingTP || { enabled: false });
  adv.timeStop = structuredClone(p.timeStop || { enabled: false });
  adv.atrStop = structuredClone(p.atrStop || { enabled: false });

  adv._riskTier = tier;
  adv._riskVariant = variant;
  return adv;
}

export function summarizeFromDraft(tier: RiskTier, variant: RiskVariant, draft: any) {
  const parts: string[] = [];
  const ex = draft?.exits || {};
  if (num(ex.defaultSLPct)) parts.push(`SL ${fmt(ex.defaultSLPct)}%`);
  if (num(ex.defaultTPPct)) parts.push(`TP ${fmt(ex.defaultTPPct)}%`);
  if (ex.multiTP?.enabled && Array.isArray(ex.multiTP.targets)) {
    const ts = ex.multiTP.targets.map((t:any)=> `${fmt(t.pct)}% (${t.sizePct ?? 0}%)`).join(" / ");
    if (ts.trim()) parts.push(`TP ${ts}`);
  }
  const be = draft?.breakeven;
  if (be?.enabled !== false && num(be?.offsetPct)) parts.push(`BE @TP1 (+${fmt(be.offsetPct)}%)`);
  const tr = draft?.trailingTP;
  if (tr?.enabled !== false) {
    if (tr?.mode === "percent" && num(tr?.valuePct)) parts.push(`Trail % ${fmt(tr.valuePct)} after TP2`);
    if (tr?.mode === "atr" && num(tr?.atrMult)) parts.push(`Trail ATR×${fmt(tr.atrMult)} after TP2`);
  }
  const as = draft?.atrStop;
  if (as?.enabled && num(as?.atrMult)) parts.push(`ATR Stop ×${fmt(as.atrMult)}`);
  const ts = draft?.timeStop;
  if (ts?.enabled !== false && num(ts?.bars)) parts.push(`Time ${fmt(ts.bars)} bars`);
  return parts.join(" • ");
}

export function applyDraftToAdvanced(currentAdvanced: any, tier: RiskTier, variant: RiskVariant, draft: any) {
  const base = applyRiskPresetToAdvanced(currentAdvanced, tier, variant);
  const out = structuredClone(base);
  const ex = draft?.exits || {};
  if (num(ex.defaultSLPct)) out.exits.defaultSLPct = Number(ex.defaultSLPct);
  if (num(ex.defaultTPPct)) { out.exits.defaultTPPct = Number(ex.defaultTPPct); out.exits.multiTP = { enabled: false }; }
  if (ex.multiTP?.enabled && Array.isArray(ex.multiTP.targets)) {
    out.exits.defaultTPPct = undefined;
    out.exits.multiTP = { enabled: true, targets: ex.multiTP.targets.map((t:any)=> ({ pct: Number(t.pct ?? 0), sizePct: Number(t.sizePct ?? 0) })) };
  } else if (ex.multiTP) { out.exits.multiTP = { enabled: false }; }
  if (draft?.breakeven) out.breakeven = { enabled: true, trigger: "after_tp1", offsetPct: Number(draft.breakeven.offsetPct ?? 0) };
  else out.breakeven = { enabled: false };
  if (draft?.trailingTP) {
    out.trailingTP = { ...(out.trailingTP||{}), enabled: true, mode: draft.trailingTP.mode || out.trailingTP.mode };
    if (num(draft.trailingTP.valuePct)) out.trailingTP.valuePct = Number(draft.trailingTP.valuePct);
    if (num(draft.trailingTP.atrMult)) out.trailingTP.atrMult = Number(draft.trailingTP.atrMult);
    out.trailingTP.activateAfter = "tp2";
  } else out.trailingTP = { enabled: false };
  if (draft?.timeStop) out.timeStop = { enabled: true, bars: Number(draft.timeStop.bars ?? 0) };
  else out.timeStop = { enabled: false };
  if (draft?.atrStop) out.atrStop = { enabled: true, atrMult: Number(draft.atrStop.atrMult ?? 0) };
  else out.atrStop = { enabled: false };
  out._riskTier = tier; out._riskVariant = variant;
  return out;
}

function num(v:any){ return typeof v==="number" && Number.isFinite(v); }
function fmt(n:number){ return Number(n).toFixed(n >= 10 ? 0 : 1); }
function fmtPct(n:number){ return `${fmt(n)}%`; }


