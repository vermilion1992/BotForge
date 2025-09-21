"use client";
import React from "react";
import useSWR from "swr";
import PageHeader from "@/components/botforge/PageHeader";
import Stepper from "@/components/botforge/Stepper";
import { KPI, Collapsible } from "@/components/botforge/ResultsPrimitives";
import StrategyVsBenchmark from "@/components/botforge/charts/StrategyVsBenchmark";
import MonthlyReturns from "@/components/botforge/charts/MonthlyReturns";
import TradeOutcome from "@/components/botforge/charts/TradeOutcome";
import Drawdown from "@/components/botforge/charts/Drawdown";
import type { BacktestResult } from "@/botforge/types/backtest";

const fetcher = (url:string)=>fetch(url).then(r=>r.json());

export default function ResultsPage() {
  const { data } = useSWR<BacktestResult>("/api/backtest/summary", fetcher, { revalidateOnFocus: false });

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-6">
        <PageHeader title="Backtest Results" subtitle="Loading analysis…" />
        <Stepper current="results" />
        <div className="rounded-2xl border p-6 text-sm opacity-70">Computing results…</div>
      </div>
    );
  }

  const k = data.kpis;
  const s = data.tradeSummary;
  const a = data.advanced;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <PageHeader title="Backtest Results" subtitle="Professional analysis of your strategy's historical performance" />
      <Stepper current="results" />

      {/* Top KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <KPI label="Total Return" value={`${k.totalReturnPct.toFixed(1)}%`} sub={`vs ${k.benchmarkReturnPct}% benchmark`} />
        <KPI label="Sharpe Ratio" value={k.sharpe.toFixed(1)} sub="Risk-adjusted return" />
        <KPI label="Max Drawdown" value={`${k.maxDrawdownPct}%`} sub="Worst losing streak" />
        <KPI label="Win Rate" value={`${k.winRatePct}%`} sub={`${k.profitableTrades} profitable trades`} />
      </div>

      {/* Trade Analysis Summary */}
      <div className="mt-2.5 rounded-2xl border p-4 shadow-sm bg-white/80 dark:bg-neutral-900/60">
        <div className="mb-4 text-lg font-semibold text-black dark:text-white">Trade Analysis Summary</div>
        <div className="grid gap-3 sm:grid-cols-4 text-sm">
          <div><div className="text-gray-600 dark:text-gray-400">Total Trades</div><div className="text-xl font-bold text-black dark:text-white">{s.totalTrades}</div></div>
          <div><div className="text-gray-600 dark:text-gray-400">Winning Trades</div><div className="text-xl font-bold text-black dark:text-white">{s.winningTrades}</div></div>
          <div><div className="text-gray-600 dark:text-gray-400">Losing Trades</div><div className="text-xl font-bold text-black dark:text-white">{s.losingTrades}</div></div>
          <div><div className="text-gray-600 dark:text-gray-400">Avg Win/Loss</div><div className="text-xl font-bold text-black dark:text-white">{s.avgWinLoss.toFixed(2)}</div></div>
        </div>
      </div>

      {/* Advanced Stats (collapsible) */}
      <div className="mt-2.5">
        <Collapsible title="Advanced Statistics" defaultOpen={false}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <Stat label="Biggest Winner" value={a.biggestWinner}/>
            <Stat label="Biggest Loser" value={a.biggestLoser}/>
            <Stat label="Average Trade Duration" value={a.avgTradeDuration}/>
            <Stat label="Longest Trade Duration" value={a.longestTradeDuration}/>
            <Stat label="Shortest Trade Duration" value={a.shortestTradeDuration}/>
            <Stat label="Long vs Short Breakdown" value={a.longShortSplit}/>
            <Stat label="Win Rate (Longs)" value={`${a.longWinRatePct}%`}/>
            <Stat label="Win Rate (Shorts)" value={`${a.shortWinRatePct}%`}/>
            <Stat label="Profit Factor" value={a.profitFactor.toFixed(2)}/>
            <Stat label="Expectancy" value={a.expectancy}/>
            <Stat label="Kelly %" value={`${a.kellyPct}%`}/>
            <Stat label="Trade Frequency" value={a.tradeFrequency}/>
            <Stat label="Equity Peak vs Valley" value={`${a.equityPeak} / ${a.equityValley}`}/>
            <Stat label="Max Consecutive Wins" value={`${a.maxConsecutiveWins} trades`}/>
            <Stat label="Max Consecutive Losses" value={`${a.maxConsecutiveLosses} trades`}/>
            <Stat label="Recovery Factor" value={a.recoveryFactor.toFixed(2)}/>
            <Stat label="Average Risk:Reward Ratio" value={a.avgRRR}/>
            <Stat label="Average Position Size" value={`${a.avgPositionSizePct}%`}/>
            <Stat label="Return on Investment" value={`${a.roiPct}%`}/>
          </div>
        </Collapsible>
      </div>

      {/* Charts */}
      <div className="mt-2.5">
        <ChartGrid data={data} />
      </div>
    </div>
  );
}

function ChartGrid({ data }: { data: BacktestResult }) {
  const [expandedChart, setExpandedChart] = React.useState<string | null>(null);

  const charts = [
    {
      id: 'strategy-vs-benchmark',
      title: 'Strategy vs Benchmark',
      summary: `${data.kpis.totalReturnPct.toFixed(1)}% vs ${data.kpis.benchmarkReturnPct}%`,
      component: <StrategyVsBenchmark data={data.equitySeries}/>
    },
    {
      id: 'monthly-returns',
      title: 'Monthly Returns',
      summary: `${data.monthlyReturns.length} months analyzed`,
      component: <MonthlyReturns data={data.monthlyReturns}/>
    },
    {
      id: 'trade-outcome',
      title: 'Trade Outcomes',
      summary: `${data.kpis.winRatePct}% win rate`,
      component: <TradeOutcome data={data.outcomeBuckets}/>
    },
    {
      id: 'drawdown',
      title: 'Drawdown Analysis',
      summary: `Max: ${Math.min(...data.drawdownSeries.map(d=>d.value||0))}%`,
      component: <Drawdown data={data.drawdownSeries}/>
    }
  ];

  return (
    <div className="space-y-3">
      {/* Chart Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {charts.map((chart) => {
          const isExpanded = expandedChart === chart.id;
          const shouldShow = !expandedChart || isExpanded;
          
          if (!shouldShow) return null;
          
          return (
            <ChartCard
              key={chart.id}
              title={chart.title}
              summary={chart.summary}
              expanded={isExpanded}
              onToggle={() => setExpandedChart(isExpanded ? null : chart.id)}
              className={isExpanded ? "sm:col-span-2" : ""}
            >
              {chart.component}
            </ChartCard>
          );
        })}
      </div>
      
      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <button onClick={()=>window.history.back()} className="rounded-xl border border-gray-300 dark:border-neutral-600 px-6 py-3 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium">
          Back to Backtest
        </button>
        <button onClick={()=>window.location.href = '/strategy-builder'} className="rounded-xl bg-blue-600 text-white px-6 py-3 shadow-sm hover:bg-blue-700 transition-colors font-medium">
          Create New Strategy
        </button>
      </div>
    </div>
  );
}

function ChartCard({ 
  title, 
  summary, 
  children, 
  expanded = false, 
  onToggle,
  className = ""
}: { 
  title: string; 
  summary?: string; 
  children: React.ReactNode; 
  expanded?: boolean; 
  onToggle?: () => void;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm bg-white/80 dark:bg-neutral-900/60 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-lg font-semibold text-black dark:text-white">{title}</div>
          {summary && <div className="text-sm text-gray-600 dark:text-gray-400">{summary}</div>}
        </div>
        <button
          onClick={onToggle}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {expanded ? 'Collapse' : 'Learn More'}
        </button>
      </div>
      {expanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function Stat({label, value}:{label:string; value:React.ReactNode}) {
  return (
    <div className="rounded-xl border p-3 bg-white/60 dark:bg-neutral-800/40 hover:bg-white/80 dark:hover:bg-neutral-800/60 transition-colors">
      <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
      <div className="text-base font-medium text-black dark:text-white">{value}</div>
    </div>
  );
}