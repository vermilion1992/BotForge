"use client";
import React from "react";

const STRATEGIES = [
  ["ema_crossover_pro", "EMA Crossover Pro"],
  ["sma_crossover", "SMA Crossover"],
  ["rsi_bias", "RSI Bias"],
  ["macd_cross", "MACD Cross"],
  ["macd_rsi_swing", "MACD + RSI Swing"],
  ["stochastic_kd", "Stochastic (K/D)"],
  ["bollinger_reversion", "Bollinger Reversion"],
  ["donchian_breakout", "Donchian Breakout"],
  ["atr_channel", "ATR Channel / Breakout"],
  ["vwap_mean_revert", "VWAP Mean Revert"],
  ["obv_trend", "OBV Trend"],
  ["cci_trend", "CCI Trend"],
  ["momentum_roc", "Momentum ROC"],
  ["adx_di_trend", "ADX + DI"],
  ["ichimoku_trend", "Ichimoku Trend"],
  ["vwma_trend", "VWMA Trend"],
  ["hybrid_momentum", "Hybrid Momentum"],
  ["market_breadth_gate", "Market Breadth Gate"],
  ["market_neutral", "Market-Neutral"],
  ["price_vs_ma", "Price vs MA Trend"],
];

export default function StrategySelect() {
  const select = (key: string) => {
    localStorage.setItem("bf_selected_strategy", key);
    alert(`Selected: ${key}. Now go to Advanced Settings.`);
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 10 }}>
      <h1>Choose Strategy</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {STRATEGIES.map(([key, label]) => (
          <button key={key} onClick={() => select(key)} style={{ padding: 12, borderRadius: 8, border: "1px solid #444" }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

