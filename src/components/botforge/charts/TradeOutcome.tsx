"use client";
import type { TradeOutcomeBuckets } from "@/botforge/types/backtest";

export default function TradeOutcome({ data }:{ data: TradeOutcomeBuckets }) {
  const total = data.bigWins + data.smallWins + data.breakeven + data.smallLosses + data.bigLosses;
  const winRate = ((data.bigWins + data.smallWins) / total * 100).toFixed(1);
  
  return (
    <div className="h-72 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Trade Outcome Breakdown</div>
        <div className="text-sm text-gray-600 mb-4">Chart will be displayed here</div>
        <div className="text-xs text-gray-500 space-y-1">
          <div>Total Trades: {total}</div>
          <div>Win Rate: {winRate}%</div>
          <div>Big Wins: {data.bigWins} | Small Wins: {data.smallWins}</div>
          <div>Small Losses: {data.smallLosses} | Big Losses: {data.bigLosses}</div>
        </div>
      </div>
    </div>
  );
}
