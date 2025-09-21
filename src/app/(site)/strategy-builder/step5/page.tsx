"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import StrategyBuilderShell from "@/components/botforge/StrategyBuilderShell";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";
import { Card, CardTitle, Small } from "@/components/botforge/Card";
import { useBuilderStore, type RiskSettings } from "@/botforge/state/builderStore";
import { useRouter } from "next/navigation";

function Num({ value, onChange, min=0, max=9999, step=1 }:{ value:number; onChange:(v:number)=>void; min?:number; max?:number; step?:number }) {
  return <input type="number" className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={value} min={min} max={max} step={step} onChange={e=>onChange(Number(e.target.value))}/>;
}

export default function Step5Risk() {
  const { riskSettings, setRisk } = useBuilderStore();
  const r = riskSettings;
  const router = useRouter();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  function patch(next: Partial<RiskSettings>){ setRisk({ ...r, ...next }); }

  return (
    <StrategyBuilderShell>
      <PageHeader title="Risk Management" subtitle="Set risk parameters and advanced protections." />
      <Stepper current="risk" />

      <Card>
        <CardTitle right={<button onClick={()=>setRisk({ riskPerTradePct:1.5, leverage:3, maxConcurrentTrades:2, positionSizing:"Volatility" })} className="rounded-xl border px-3 py-1.5 text-sm">Return to Default</button>}>
          Core Risk Parameters
        </CardTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm"><div className="mb-1 opacity-70">Risk per Trade (%)</div><Num value={r.riskPerTradePct} onChange={(v)=>patch({riskPerTradePct:v})} step={0.1}/></label>
          <label className="text-sm"><div className="mb-1 opacity-70">Max Leverage (x)</div><Num value={r.leverage} onChange={(v)=>patch({leverage:v})} step={1}/></label>
          <label className="text-sm"><div className="mb-1 opacity-70">Max Concurrent Trades</div><Num value={r.maxConcurrentTrades} onChange={(v)=>patch({maxConcurrentTrades:v})} step={1}/></label>
        </div>
      </Card>

      <Card className="mt-2.5">
        <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors rounded-lg p-2 -m-2" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}>
          <div>
            <CardTitle>Advanced Risk Controls</CardTitle>
            <Small>Optional safeguards for additional protection.</Small>
          </div>
          <div className="flex items-center gap-2">
            {isAdvancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
        {isAdvancedOpen && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-sm"><div className="mb-1 opacity-70">Notional Cap per Trade ($)</div><Num value={r.notionalCapPerTrade ?? 0} onChange={(v)=>patch({notionalCapPerTrade:v})}/></label>
            <label className="text-sm"><div className="mb-1 opacity-70">Daily Drawdown Stop (%)</div><Num value={r.dailyDrawdownStopPct ?? 5} onChange={(v)=>patch({dailyDrawdownStopPct:v})} step={0.1}/></label>
            <label className="text-sm">
              <div className="mb-1 opacity-70">Position Sizing Method</div>
              <select value={r.positionSizing} onChange={(e)=>patch({positionSizing:e.target.value as any})} className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="FixedPct">Fixed %</option>
                <option value="Volatility">Volatility</option>
                <option value="Custom">Custom</option>
              </select>
            </label>
          </div>
        )}
      </Card>
      
      {/* Navigation Buttons */}
      <div className="mt-2.5 flex justify-between">
        <button onClick={()=>router.push("/strategy-builder/step4")} className="rounded-xl border border-gray-300 dark:border-neutral-600 px-6 py-3 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium">
          Back to Advanced Settings
        </button>
        <button onClick={()=>router.push("/strategy-builder/step7")} className="rounded-xl bg-blue-600 text-white px-6 py-3 shadow-sm hover:bg-blue-700 transition-colors font-medium">
          Continue to Strategy Review & Backtest
        </button>
      </div>
    </StrategyBuilderShell>
  );
}