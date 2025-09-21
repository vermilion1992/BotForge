import type { IndicatorMeta, Ref } from "./types";

export function listIndicatorSeries(metas: IndicatorMeta[]): Ref[] {
  return metas.filter(m => m.outputs.shape === "series")
    .map(m => ({ id: m.id, label: m.label, shape: "series", baseId: m.id }));
}
export function listIndicatorScalars(metas: IndicatorMeta[]): Ref[] {
  return metas.filter(m => m.outputs.shape === "scalar")
    .map(m => ({ id: m.id, label: m.label, shape: "scalar", baseId: m.id }));
}

export function getMetaByKey(all: IndicatorMeta[], byId: Map<string,IndicatorMeta>, key?: string): IndicatorMeta | null {
  if (!key) return null;
  const k = key.toLowerCase();
  return byId.get(k) ?? all.find(m => k.includes(m.id.toLowerCase())) ?? null;
}
