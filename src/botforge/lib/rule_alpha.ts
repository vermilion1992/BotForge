export type RuleLike = { id: string; displayName?: string; label?: string; name?: string };

export function sortRulesAlpha<T extends RuleLike>(rules: T[]): Array<T & { _alpha: string; _sortKey: string }> {
  const toName = (r:any) => (r.displayName || r.friendly || r.label || r.name || r.id || "").toString();
  const withKeys = (rules||[]).map(r => ({ ...r, _sortKey: toName(r).toLocaleLowerCase() }));
  withKeys.sort((a,b) => a._sortKey.localeCompare(b._sortKey, undefined, { sensitivity:"base" }));
  return withKeys.map((r,i) => ({ ...r, _alpha: alpha(i) }));
}

export function alpha(i: number): string {
  // 0->A, 25->Z, 26->AA ...
  let n = i, s = "";
  do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return s;
}
