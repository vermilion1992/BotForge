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
        const j = await r.json();
        if (alive) setMetas(j.metas ?? []);
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
