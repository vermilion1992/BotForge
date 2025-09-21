"use client";
import type { SeriesPoint } from "@/botforge/types/backtest";

export default function Drawdown({ data }:{ data: SeriesPoint[] }) {
  const maxDrawdown = Math.min(...data.map(item => item.value || 0));
  const currentDrawdown = data[data.length - 1]?.value || 0;
  
  return (
    <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Drawdown Over Time</div>
        <div className="text-sm text-gray-600 mb-4">Chart will be displayed here</div>
        <div className="text-xs text-gray-500 space-y-1">
          <div>Max Drawdown: {maxDrawdown.toFixed(1)}%</div>
          <div>Current: {currentDrawdown.toFixed(1)}%</div>
          <div>Data Points: {data.length}</div>
        </div>
      </div>
    </div>
  );
}
