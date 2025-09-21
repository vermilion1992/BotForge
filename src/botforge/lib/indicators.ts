"use client";

/** Cached fetch of all indicator metas from /api/indicators */
let _cache: any[] | null = null;

export async function fetchAllIndicatorMetas(): Promise<any[]> {
  // Always fetch fresh data to ensure we get the latest presets
  const res = await fetch("/api/indicators", { cache: "no-store" });
  const data = await res.json();
  const freshData = Array.isArray(data) ? data : [];
  _cache = freshData;
  return freshData;
}

export async function getIndicatorMeta(id: string): Promise<any | undefined> {
  const all = await fetchAllIndicatorMetas();
  return all.find((m: any) => m?.identity?.id === id);
}

/** Pick a preset by id or fall back to the first meta.presets[] */
export function findPreset(meta: any, presetRef?: string) {
  if (!meta?.presets?.length) return undefined;
  if (!presetRef) return meta.presets[0];
  return meta.presets.find((p: any) => p.id === presetRef) || meta.presets[0];
}

/** Extract this indicator's params from a preset's indicators[] list */
export function paramsFromPresetFor(meta: any, preset: any) {
  const self = preset?.indicators?.find((x: any) => x.id === meta?.identity?.id);
  return (self && self.params) ? self.params : {};
}

/** Merge risk defaults from preset into current risk/advanced snapshots */
export function mergeRiskDefaults(current: { risk: any; advanced: any }, riskDefaults?: any) {
  if (!riskDefaults) return current;
  const out = { risk: { ...current.risk }, advanced: structuredClone(current.advanced) };
  if (riskDefaults.positionSizing) out.risk = { ...out.risk, ...riskDefaults.positionSizing };
  if (riskDefaults.exits) out.advanced.exits = { ...out.advanced.exits, ...riskDefaults.exits };
  if (riskDefaults.guards?.atrStop) {
    out.advanced.atrStop = { ...(out.advanced.atrStop || {}), ...riskDefaults.guards.atrStop };
    if (out.advanced.exits?.atrStop) out.advanced.exits.atrStop = { ...out.advanced.exits.atrStop, ...riskDefaults.guards.atrStop };
  }
  return out;
}

/** Draft 1–2 starter rules from meta.signals guided by preset.designIntent (no UI changes) */
export function draftRulesFrom(meta: any, preset: any): Array<{left:string;operator:string;right:any}> {
  const sigs = Array.isArray(meta?.signals) ? meta.signals : [];
  const intent = preset?.designIntent || "Momentum";
  const rules: Array<{left:string;operator:string;right:any}> = [];

  const pick = (kw: string[]) => sigs.find((s: any) => {
    const hay = (s.id + " " + s.label).toLowerCase();
    return kw.some(k => hay.includes(k));
  });

  if (intent === "MeanReversion") {
    const up = pick(["oversold","crosses_above","crosses up"]);
    const down = pick(["overbought","crosses_below","crosses down"]);
    if (up?.when) rules.push({ left: up.when.left, operator: up.when.operator, right: up.when.right });
    if (down?.when) rules.push({ left: down.when.left, operator: down.when.operator, right: down.when.right });
  } else if (intent === "Filter") {
    const mid = pick(["midline","above"]);
    if (mid?.when) rules.push({ left: mid.when.left, operator: ">", right: "params.midline" });
  } else if (intent === "Momentum") {
    // For momentum, look for rising/falling signals
    const rise = pick(["rising","expansion"]);
    const fall = pick(["falling","contraction"]);
    if (rise?.when) rules.push({ left: rise.when.left, operator: rise.when.operator, right: rise.when.right });
    if (fall?.when && rules.length < 2) rules.push({ left: fall.when.left, operator: fall.when.operator, right: fall.when.right });
  } else {
    // Default: try rising first, then any available signal
    const rise = pick(["rising"]);
    const mid = pick(["midline","above"]);
    if (rise?.when) rules.push({ left: rise.when.left, operator: rise.when.operator, right: rise.when.right });
    else if (mid?.when) rules.push({ left: mid.when.left, operator: ">", right: "params.midline" });
  }

  if (!rules.length && sigs[0]?.when) {
    const w = sigs[0].when;
    rules.push({ left: w.left, operator: w.operator, right: w.right });
  }
  return rules.slice(0, 2);
}
