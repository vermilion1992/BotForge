"use client";
import type { SeriesPoint } from "@/botforge/types/backtest";

export default function StrategyVsBenchmark({ data }:{ data: SeriesPoint[] }) {
  return (
    <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Strategy vs Benchmark Performance</div>
        <div className="text-sm text-gray-600 mb-4">Chart will be displayed here</div>
        <div className="text-xs text-gray-500">
          Data points: {data.length} | Strategy: ${data[data.length-1]?.a || 0} | Benchmark: ${data[data.length-1]?.b || 0}
        </div>
      </div>
    </div>
  );
}
