"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Repeat, Search } from "lucide-react";
import StrategyBuilderShell from "@/components/botforge/StrategyBuilderShell";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";
import { Tile } from "@/components/botforge/Tile";
import { useBuilderStore } from "@/botforge/state/builderStore";

/** ---------- STATIC GROUPS (deterministic, CSV-equivalent) ---------- */
const TOP10 = ["BTC/USDT","ETH/USDT","BNB/USDT","SOL/USDT","XRP/USDT","ADA/USDT","DOGE/USDT","TRX/USDT","AVAX/USDT","DOT/USDT"];
const TOP30 = Array.from(new Set([...TOP10, "LINK/USDT","MATIC/USDT","OP/USDT","ARB/USDT","TON/USDT","ATOM/USDT","NEAR/USDT","APT/USDT","FIL/USDT","SUI/USDT","LTC/USDT","ETC/USDT","HBAR/USDT","ICP/USDT","FTM/USDT","GRT/USDT","INJ/USDT","AAVE/USDT","RUNE/USDT","ALGO/USDT"]));
const TOP50 = Array.from(new Set([...TOP30,
  "SAND/USDT","MANA/USDT","THETA/USDT","EGLD/USDT","XLM/USDT","MKR/USDT","DYDX/USDT","SNX/USDT","AXS/USDT","CHZ/USDT","ENJ/USDT",
  "KAVA/USDT","GMX/USDT","PYTH/USDT","JTO/USDT"
]));
const MEME  = ["DOGE/USDT","SHIB/USDT","PEPE/USDT","FLOKI/USDT","WIF/USDT","BONK/USDT"];

const ALL_UNIVERSE = Array.from(new Set([...TOP50, ...MEME])).sort();

/** tag map for the single segment filter */
const TAGS: Record<string,string[]> = Object.fromEntries(ALL_UNIVERSE.map(s=>[s,[]]));
for (const s of MEME) (TAGS[s] ||= []).push("meme");

function Pill({ active, onClick, children }:{ active?:boolean; onClick:()=>void; children:React.ReactNode }) {
  return <button onClick={onClick} className={`rounded-full border px-3 py-1 text-sm transition-colors ${
    active 
      ? "bg-blue-600 text-white border-blue-600" 
      : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
  }`}>{children}</button>;
}
function Chip({ symbol, selected, onToggle, tabIndex }:{ symbol:string; selected:boolean; onToggle:()=>void; tabIndex?:number }) {
  return (
    <button
      role="checkbox"
      aria-checked={selected}
      tabIndex={tabIndex}
      onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); onToggle(); } }}
      onClick={onToggle}
      className={`w-full rounded-full border px-3 py-2 text-sm transition-colors text-center ${
        selected 
          ? "bg-blue-600 text-white border-blue-600" 
          : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      }`}
      title={TAGS[symbol]?.join(", ")}
    >
      {symbol}
    </button>
  );
}

export default function Step1Market() {
  const { marketType, setMarketType, pairs, setPairs, setPairsPreset } = useBuilderStore();
  const [selection, setSelection] = useState<string[]>(pairs);
  const [search, setSearch] = useState("");
  const [universe, setUniverse] = useState<"All"|"Top 10"|"Top 30"|"Top 50">("Top 30");
  const [memeOnly, setMemeOnly] = useState(false);
  const [view, setView] = useState<"all"|"remaining"|"selected">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(()=>{ setSelection(pairs); },[]);

  /** base universe by selector */
  const baseUniverse = useMemo(()=>{
    if (universe==="Top 10") return TOP10;
    if (universe==="Top 30") return TOP30;
    if (universe==="Top 50") return TOP50;
    return ALL_UNIVERSE;
  },[universe]);

  /** filtered list (by segment + search + view) */
  const filtered = useMemo(()=>{
    let list = baseUniverse;
    if (memeOnly) list = list.filter(s => TAGS[s]?.includes("meme"));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => s.toLowerCase().includes(q));
    }
    
    // View mode logic
    if (view==="remaining") {
      // Show only unselected pairs
      list = list.filter(s => !selection.includes(s));
    } else if (view==="selected") {
      // Show only selected pairs
      list = list.filter(s => selection.includes(s));
    } else if (view==="all") {
      // Show all pairs in the current universe/filter
      // No additional filtering needed
    }
    
    return list;
  },[baseUniverse, memeOnly, search, view, selection]);

  /** (for Select All Filtered) — same filters but ignoring view mode */
  const filteredIgnoringView = useMemo(()=>{
    let list = baseUniverse;
    if (memeOnly) list = list.filter(s => TAGS[s]?.includes("meme"));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => s.toLowerCase().includes(q));
    }
    return list;
  },[baseUniverse, memeOnly, search]);

  /** helpers */
  function toggle(sym:string){ setSelection(prev => prev.includes(sym) ? prev.filter(s=>s!==sym) : [...prev, sym]); }
  function setBase(list:string[]){ setSelection(Array.from(new Set(list))); }
  function onAddFromSearch() {
    const raw = (search || "").trim().toUpperCase();
    if (!raw) return;
    const ok = /^[A-Z0-9]{2,10}\/[A-Z0-9]{2,10}$/.test(raw);
    if (!ok) return; // silent fail if format is bad
    if (!ALL_UNIVERSE.includes(raw)) ALL_UNIVERSE.push(raw);
    if (!TAGS[raw]) TAGS[raw] = [];
    if (!baseUniverse.includes(raw)) ; // allow adding even if not in base
    setSelection(prev => prev.includes(raw) ? prev : [...prev, raw]);
    setSearch("");
    inputRef.current?.blur();
  }

  const tooMany = selection.length > 30;
  return (
    <StrategyBuilderShell>
      <PageHeader title="Market Type & Trading Pairs" subtitle="Choose your market type and select trading pairs for this bot." />
      <Stepper current="market" />
      
      {/* Market Type Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Market Type</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <Tile active={marketType==="spot"} onClick={()=>setMarketType("spot")} title="Spot" desc="Trade on spot markets" icon={<Coins size={20}/>}/>
          <Tile active={marketType==="perp"} onClick={()=>setMarketType("perp")} title="Perpetual Futures" desc="Trade perpetual swaps" icon={<Repeat size={20}/>}/>
        </div>
      </div>

      {/* Trading Pairs Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Trading Pairs</h3>
        <div className="rounded-2xl border p-4 shadow-sm bg-white dark:bg-neutral-800">
          {/* sticky mini header */}
          <div className="sticky top-0 z-10 mb-3 -mt-4 rounded-t-2xl border-b bg-white/80 px-4 py-2 text-sm backdrop-blur dark:bg-neutral-900/80">
            <div className="flex items-center justify-between">
              <div className="text-black dark:text-white">Selected: <b>{selection.length}</b> / 30 {tooMany && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Large selection may slow backtests</span>}</div>
              <div className="flex items-center gap-2">
                <button className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  view === "all" 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white dark:bg-neutral-700 text-black dark:text-white border-gray-200 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`} onClick={()=>setView("all")}>Show All</button>
                <button className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  view === "remaining" 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white dark:bg-neutral-700 text-black dark:text-white border-gray-200 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`} onClick={()=>setView(view === "remaining" ? "all" : "remaining")}>Remaining</button>
                <button className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  view === "selected" 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white dark:bg-neutral-700 text-black dark:text-white border-gray-200 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`} onClick={()=>setView(view === "selected" ? "all" : "selected")}>Selected</button>
              </div>
            </div>
          </div>

          {/* search + add */}
          <div className="mb-3 flex items-center gap-2">
            <Search size={16} className="opacity-60" />
            <input
              ref={inputRef}
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
              placeholder="Search or type a custom pair, e.g. BTC/USDT"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==="Enter") onAddFromSearch(); }}
            />
            <button onClick={onAddFromSearch} className="rounded-xl border px-3 py-2 text-sm">Add</button>
          </div>

          {/* unified action buttons */}
          <div className="mb-3 flex flex-wrap gap-2">
            <button className="rounded-full border px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={()=>{ setUniverse("Top 10"); setBase(TOP10); setView("selected"); setMemeOnly(false); }}>Select Top 10</button>
            <button className="rounded-full border px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={()=>{ setUniverse("Top 30"); setBase(TOP30); setView("selected"); setMemeOnly(false); }}>Select Top 30</button>
            <button className="rounded-full border px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={()=>{ setUniverse("Top 50"); setBase(TOP50); setView("selected"); setMemeOnly(false); }}>Select Top 50</button>
            <button className="rounded-full border px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={()=>{ setMemeOnly(true); setBase(MEME); setView("selected"); setUniverse("All"); }}>Meme Coins</button>
            <button className="rounded-full border px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={()=>{
              const all = filteredIgnoringView;
              setSelection(prev => Array.from(new Set([...prev, ...all])));
              setView("selected");
            }}>Select All</button>
            <button className="rounded-full border px-3 py-1 text-sm bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={()=>{ setSelection([]); setView("all"); }}>Clear All</button>
          </div>

          {/* chip grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filtered.map((sym, i)=>(
              <Chip key={sym} symbol={sym} selected={selection.includes(sym)} onToggle={()=>toggle(sym)} tabIndex={0}/>
            ))}
            {filtered.length===0 && (
              <div className="col-span-full rounded-xl border px-3 py-2 text-sm text-gray-600 dark:text-gray-400 text-center">No symbols match the current filters.</div>
            )}
          </div>

          {/* soft-cap note */}
          {tooMany && (
            <div className="mt-3 text-xs opacity-70">
              Tip: You've selected more than 30 pairs. Consider narrowing the set for faster backtests.
            </div>
          )}
        </div>
      </div>

      {/* footer actions */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={()=>{ 
            setPairs(selection); 
            setPairsPreset({ setName: universe, symbols: selection, selectedCount: selection.length });
            router.push("/strategy-builder/step3"); 
          }}
          disabled={selection.length===0 || !marketType}
          title={selection.length===0 ? "Select at least one pair" : !marketType ? "Select a market type" : ""}
          className={`rounded-xl px-6 py-3 shadow-sm font-medium transition-colors ${
            selection.length===0 || !marketType
              ? "opacity-60 cursor-not-allowed bg-gray-300 text-gray-500" 
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Continue to Strategy & Indicators
        </button>
      </div>
    </StrategyBuilderShell>
  );
}