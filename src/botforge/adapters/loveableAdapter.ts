"use client";
import { useEffect } from "react";
import { useBuilderStore } from "@/botforge/state/builderStore";

async function resolveStrategyIdByLabel(label?: string): Promise<string|undefined> {
  if (!label) return;
  const res = await fetch("/api/sot").then(r=>r.json()).catch(()=>null);
  const m = res?.strategies?.find((s:any)=> String(s.label).toLowerCase() === String(label).toLowerCase());
  return m?.id;
}

export function useLoveableDefaultsOnce() {
  useEffect(() => {
    const key = "botforge_loveable_applied";
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key) === "1") return;

    (async () => {
      try {
        const resp = await fetch("/loveable-config.json", { cache: "no-store" });
        if (!resp.ok) return;
        const cfg = await resp.json();

        const st = useBuilderStore.getState();

        if (cfg.marketType) st.setMarketType(cfg.marketType);
        if (Array.isArray(cfg.pairs) && cfg.pairs.length) st.setPairs(cfg.pairs);
        if (cfg.timeframe) st.setTimeframe(cfg.timeframe);

        if (cfg.strategy?.id) st.setStrategy(cfg.strategy.id);
        else if (cfg.strategy?.label) {
          const sid = await resolveStrategyIdByLabel(cfg.strategy.label);
          if (sid) st.setStrategy(sid);
        }

        if (Array.isArray(cfg.indicators) && cfg.indicators.length) st.setIndicators(cfg.indicators);
        if (cfg.risk) st.setRisk(cfg.risk);

        localStorage.setItem(key, "1");
      } catch { /* silent */ }
    })();
  }, []);
}




