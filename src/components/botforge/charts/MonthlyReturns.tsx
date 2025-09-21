"use client";
import type { SeriesPoint } from "@/botforge/types/backtest";

export default function MonthlyReturns({ data }:{ data: SeriesPoint[] }) {
  const avgReturn = data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length;
  const maxReturn = Math.max(...data.map(item => item.value || 0));
  const minReturn = Math.min(...data.map(item => item.value || 0));
  
  return (
    <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Monthly Returns</div>
        <div className="text-sm text-gray-600 mb-4">Chart will be displayed here</div>
        <div className="text-xs text-gray-500 space-y-1">
          <div>Average: {avgReturn.toFixed(1)}%</div>
          <div>Best: {maxReturn.toFixed(1)}% | Worst: {minReturn.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
