"use client";
import { useMemo, useState } from "react";
import { useBuilderStore } from "@/botforge/state/builderStore";
import { FILTER_DEFAULTS, FILTER_FRIENDLY, type FilterClause, type FilterType, type FiltersScope } from "@/botforge/content/filters_menu";
import { summarizeFilters, validateFilters } from "@/botforge/lib/filters";

export default function EntryFiltersRow() {
  const { filters, setFilters } = useBuilderStore() as any;
  const [openPicker, setOpenPicker] = useState(false);

  const summary = useMemo(() => summarizeFilters(filters?.enabled, filters?.scope, filters?.referenceSymbol, filters?.clauses||[]), [filters]);
  const validation = useMemo(() => validateFilters(filters?.enabled, filters?.clauses||[]), [filters]);

  const addClause = (type: FilterType) => {
    const d = structuredClone(filters || {});
    d.enabled = true;
    d.clauses = [...(d.clauses||[]), structuredClone(FILTER_DEFAULTS[type])];
    setFilters(d);
    setOpenPicker(false);
  };
  const removeClause = (i: number) => {
    const d = structuredClone(filters || {});
    d.clauses.splice(i,1);
    if (!d.clauses.length) d.enabled = false;
    setFilters(d);
  };
  const updateClause = (i: number, patch: Partial<FilterClause>) => {
    const d = structuredClone(filters || {});
    d.clauses[i] = { ...d.clauses[i], ...patch };
    setFilters(d);
  };

  return (
    <div className="mt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Filters</div>
          <div className="text-xs text-muted-foreground">{summary}</div>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" className="h-3.5 w-3.5" checked={!!filters?.enabled} onChange={(e)=> setFilters({ enabled: e.target.checked })} />
          Enable
        </label>
      </div>

      {filters?.enabled && (
        <>
          {/* Scope row */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ScopeChip label="Each Pair" active={(filters.scope||"each")==="each"} onClick={()=>setFilters({ scope: "each" })} />
            <ScopeChip label="Reference Symbol" active={filters.scope==="reference"} onClick={()=>setFilters({ scope: "reference" })} />
            <ScopeChip label="Both" active={filters.scope==="both"} onClick={()=>setFilters({ scope: "both" })} />
            {filters.scope !== "each" && (
              <input
                value={filters.referenceSymbol||"BTCUSDT"}
                onChange={(e)=> setFilters({ referenceSymbol: e.target.value.toUpperCase() })}
                className="rounded-lg border px-2 py-1 text-xs"
                placeholder="BTCUSDT"
              />
            )}
          </div>

          {/* Pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {(filters.clauses||[]).map((c:FilterClause, i:number) => (
              <FilterPill key={i} clause={c} onRemove={()=>removeClause(i)}>
                <ClauseEditor clause={c} onChange={(p)=>updateClause(i,p)} />
              </FilterPill>
            ))}
            <button onClick={()=>setOpenPicker(true)} className="px-2 py-1 rounded-full border text-xs hover:bg-muted">+ Add Filter</button>
          </div>

          {/* Light validation surface (no restyle) */}
          {(validation.errors.length>0 || validation.warnings.length>0) && (
            <div className="mt-2 rounded-lg border bg-muted/40 p-2 text-xs">
              {validation.errors.length>0 && (
                <div className="text-red-600">
                  <div className="font-medium">Please fix:</div>
                  <ul className="list-disc ml-5">{validation.errors.map((e,i)=>(<li key={`e-${i}`}>{e}</li>))}</ul>
                </div>
              )}
              {validation.warnings.length>0 && (
                <div className="text-amber-600 mt-1">
                  <div className="font-medium">Hints:</div>
                  <ul className="list-disc ml-5">{validation.warnings.map((w,i)=>(<li key={`w-${i}`}>{w}</li>))}</ul>
                </div>
              )}
            </div>
          )}

          {/* Minimal picker (only 3 options) */}
          {openPicker && (
            <div className="mt-2 rounded-xl border p-3">
              <div className="text-xs mb-2">Choose a filter:</div>
              <div className="flex flex-wrap gap-2">
                <AddChip label="Higher-TF Trend" onClick={()=>addClause("htf_trend")} />
                <AddChip label="Volatility Band (ATR%)" onClick={()=>addClause("atr_band")} />
                <AddChip label="Volume Filter" onClick={()=>addClause("volume")} />
                <button className="px-2 py-1 rounded-full border text-xs hover:bg-muted" onClick={()=>setOpenPicker(false)}>Close</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ——— Tiny UI bits (reuse your chip classes as on Page-3) ——— */
function ScopeChip({label, active, onClick}:{label:string; active:boolean; onClick:()=>void}) {
  return (
    <button onClick={onClick} className={`px-2 py-1 rounded-full border text-xs ${active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>{label}</button>
  );
}

function AddChip({label, onClick}:{label:string; onClick:()=>void}) {
  return <button onClick={onClick} className="px-2 py-1 rounded-full border text-xs hover:bg-muted">{label}</button>;
}

function FilterPill({clause, onRemove, children}:{clause: any; onRemove:()=>void; children: React.ReactNode}) {
  const text = FILTER_FRIENDLY[clause.type].pill(clause);
  return (
    <div className="rounded-full border px-3 py-1 text-xs flex items-center gap-2">
      <span>{text}</span>
      <button onClick={onRemove} className="opacity-60 hover:opacity-100">×</button>
      {/* inline editor content lives beside pill, same row */}
      <div className="ml-2">{children}</div>
    </div>
  );
}

function ClauseEditor({ clause, onChange }:{ clause:any; onChange:(p:any)=>void }) {
  switch (clause.type) {
    case "htf_trend":
      return (
        <div className="flex items-center gap-2 text-[11px]">
          <select className="border rounded px-1 py-0.5" value={clause.tf} onChange={e=>onChange({ tf: e.target.value })}>
            <option value="1h">1h</option><option value="4h">4h</option><option value="1D">1D</option>
          </select>
          <select className="border rounded px-1 py-0.5" value={clause.ma} onChange={e=>onChange({ ma: e.target.value })}>
            <option value="ema">EMA</option><option value="sma">SMA</option>
          </select>
          <input type="number" className="border rounded px-1 py-0.5 w-16" value={clause.length} onChange={e=>onChange({ length: Number(e.target.value||0) })} />
          <select className="border rounded px-1 py-0.5" value={clause.mode} onChange={e=>onChange({ mode: e.target.value })}>
            <option value="slope_rising">Rising</option><option value="price_above">Price &gt; MA</option>
          </select>
        </div>
      );
    case "atr_band":
      return (
        <div className="flex items-center gap-2 text-[11px]">
          <span>len</span>
          <input type="number" className="border rounded px-1 py-0.5 w-14" value={clause.length} onChange={e=>onChange({ length: Number(e.target.value||0) })} />
          <span>min%</span>
          <input step="0.1" type="number" className="border rounded px-1 py-0.5 w-14" value={clause.minPct} onChange={e=>onChange({ minPct: Number(e.target.value||0) })} />
          <span>max%</span>
          <input step="0.1" type="number" className="border rounded px-1 py-0.5 w-14" value={clause.maxPct} onChange={e=>onChange({ maxPct: Number(e.target.value||0) })} />
        </div>
      );
    case "volume":
      return (
        <div className="flex items-center gap-2 text-[11px]">
          <span>SMA</span>
          <input type="number" className="border rounded px-1 py-0.5 w-14" value={clause.fast} onChange={e=>onChange({ fast: Number(e.target.value||0) })} />
          <span>&gt;</span>
          <input type="number" className="border rounded px-1 py-0.5 w-14" value={clause.slow} onChange={e=>onChange({ slow: Number(e.target.value||0) })} />
        </div>
      );
    default:
      return null;
  }
}
