"use client";
import { useState } from "react";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";
import { Card, CardTitle, Small } from "@/components/botforge/Card";
import { useBuilderStore } from "@/botforge/state/builderStore";
import { useRouter } from "next/navigation";
import { validateStep } from "@/botforge/lib/stepValidation";

function Pill({ active, onClick, children }:{ active?:boolean; onClick:()=>void; children:React.ReactNode }) {
  return (
    <button 
      onClick={onClick} 
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active 
          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
          : "bg-white/80 text-black border-gray-300 hover:bg-gray-50 dark:bg-neutral-800/60 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700/60"
      }`}
    >
      {children}
    </button>
  );
}

export default function Step7Backtest() {
  const { lookback, setLookback, marketType, pairs, indicatorSelections, selectedPreset, rules, advanced, timeframe, setBacktestCompleted } = useBuilderStore() as any;
  const [running, setRunning] = useState(false);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const router = useRouter();

  // Calculate max date (3 years from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Calculate min date (3 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 3);
  const minDateString = minDate.toISOString().split('T')[0];

  async function run() {
    // Validate before running
    const validation = validateStep("backtest", {
      marketType,
      pairs,
      indicatorSelections,
      selectedPreset,
      rules,
      advanced,
      timeframe
    });
    
    if (!validation.canProceed) {
      alert("Please complete all required steps before running backtest:\n" + validation.errors.join('\n'));
      return;
    }
    
    setRunning(true);
    await fetch("/api/backtest/summary", { method: "GET" }); // warm mock
    setBacktestCompleted(true); // Mark backtest as completed
    setTimeout(()=>router.push("/strategy-builder/step8"), 400);
  }
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <PageHeader title="Strategy Review & Backtest" subtitle="Review your strategy configuration, set timeframe, and execute the backtest." />
      <Stepper current="backtest" />
      
      <Card>
        <CardTitle>Configuration Summary</CardTitle>
        <Small>Your strategy is ready for backtesting. Configure the timeframe and date range below, then run the backtest.</Small>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>• Market type and training pairs selected</p>
          <p>• Strategy and indicators configured</p>
          <p>• Advanced settings applied</p>
          <p>• Risk management parameters set</p>
          <p>• Ready to configure timeframe and run backtest</p>
        </div>
      </Card>

      <Card className="mt-2.5">
        <CardTitle>Backtest Data Window</CardTitle>
        <div className="text-sm">
          <div className="mb-1 opacity-70">Backtest Range</div>
          <div className="flex flex-wrap gap-2">
            {(["7d","30d","90d","1y"] as const).map(w=><Pill key={w} active={lookback===w && !useCustomRange} onClick={()=>{setLookback(w); setUseCustomRange(false);}}>{w === "1y" ? "1 Year" : w.replace("d"," Days")}</Pill>)}
            <Pill active={useCustomRange} onClick={()=>setUseCustomRange(true)}>Custom Range</Pill>
          </div>
        </div>
      </Card>

      {useCustomRange && (
        <Card className="mt-2.5">
          <CardTitle>Custom Date Range</CardTitle>
          <Small>Select a specific date range for your backtest (maximum 3 years from today).</Small>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <div className="mb-1 opacity-70">Start Date</div>
              <input 
                type="date" 
                className="w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-neutral-800/60 border-gray-300 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={startDate} 
                onChange={(e)=>setStartDate(e.target.value)}
                min={minDateString}
                max={maxDateString}
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 opacity-70">End Date</div>
              <input 
                type="date" 
                className="w-full rounded-xl border px-3 py-2 bg-white/80 dark:bg-neutral-800/60 border-gray-300 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={endDate} 
                onChange={(e)=>setEndDate(e.target.value)}
                min={startDate || minDateString}
                max={maxDateString}
              />
            </label>
          </div>
          {startDate && endDate && (
            <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
              Selected range: {startDate} to {endDate}
            </div>
          )}
        </Card>
      )}

      <div className="mt-2.5 rounded-2xl border p-6 text-sm bg-white dark:bg-neutral-800">
        <div className="mb-4 text-base font-medium text-black dark:text-white">Ready to Backtest</div>
        <p className="text-gray-600 dark:text-gray-400">Your strategy configuration is complete. Run a backtest to see historical performance metrics.</p>
      </div>

      {/* footer actions */}
      <div className="mt-4 flex items-center justify-between">
        <button onClick={()=>router.push("/strategy-builder/step4")} className="rounded-xl border border-gray-300 dark:border-neutral-600 px-6 py-3 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium">
          Back to Advanced Settings
        </button>
        <button
          onClick={run}
          disabled={running}
          className="rounded-xl bg-blue-600 text-white px-6 py-3 shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {running ? "Running…" : "Run Backtest"}
        </button>
      </div>
    </div>
  );
}