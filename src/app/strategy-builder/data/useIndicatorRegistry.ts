"use client";
import { useEffect, useMemo, useState } from "react";
import type { IndicatorMeta } from "@/app/strategy-builder/lib/types";

export function useIndicatorRegistry() {
  const [metas, setMetas] = useState<IndicatorMeta[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/indicators", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const list: any[] = Array.isArray(data?.metas) ? data.metas : [];
        const adapted = list.map((m:any) => {
          const id = String(m?.id ?? m?.identity?.id ?? "").trim();
          const label = String(m?.label ?? m?.identity?.label ?? id).trim();
          return {
            ...m,
            id,
            label,
            identity: { ...(m.identity||{}), id, label }
          };
        }).filter((m:any)=>m.id);
        if (alive) setMetas(adapted as any);
      } catch (e:any) {
        if (alive) setError(String(e));
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string,IndicatorMeta>();
    metas.forEach(x => {
      m.set(x.id.toLowerCase(), x);
      m.set(x.label.toLowerCase(), x);
    });
    return m;
  }, [metas]);

  return { ready, error, all: metas, byId };
}
