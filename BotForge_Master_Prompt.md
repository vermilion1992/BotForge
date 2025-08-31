# BotForge Master Prompt (Final Spec)

## 🔹 Overview
- **App Name**: BotForge
- **Purpose**: Let users build, backtest, and share trading bots without coding.
- **Output Files**:
  - Generated bot → `.zip` containing `.py` file (named by user).
  - Copied bot from community → `.json` (for backtest/edit only).
- **Rule**: No API keys, no live trading data. All simulation-based.

---

## 🔹 Main Tabs
1. **Strategy Builder** – Wizard flow for bot creation/backtest.
2. **Bot Community** – Leaderboard for sharing/copying bots (+1 credit reward for sharing).
3. **My Bots** – User’s generated/downloaded bots.
4. **AI Chat** – Simple chatbot plugin (Framer integration).

---

## 🔹 Strategy Builder Wizard Flow

**Step 1 – Market Type**
- Choose: Spot or Perps.

**Step 2 – Pair Template**
- Options: Top 10, Top 30, Meme, Volatility, Random Sampler, Pick Your Own (tier-restricted).
- Tiers:
  - Basic → Top 10 only.
  - Pro → Top 30 only.
  - Expert → All 100.

**Step 3 – Strategy or Indicator Template**
- Choose from **20 premade strategies** (multi-indicator recipes) OR a single indicator strategy.
- Once chosen:
  - **Default indicators** for that strategy auto-load (e.g., EMA Crossover shows EMA Fast + EMA Slow).
  - Optional: **Add Filter Indicator** (Pro/Expert only; Basic sees greyed-out option).

**Step 4 – Advanced Settings**
- Every strategy, indicator, or filter has an **Advanced Settings checkbox**.
- If ticked → expands to show configurable parameters (periods, thresholds, multipliers, etc.).
- If unticked → defaults are used.
- Advanced box is available across all paid tiers (limited by strategy availability).

**Step 5 – Risk Management**
- Fields: Capital allocation, stop loss, take profit.
- Trailing take profit: greyed out unless unlocked.
- Includes **Advanced Settings box** for risk parameters (e.g., % per trade, leverage).

**Step 6 – Backtest Parameters**
- Timeframe + max period (enforce candle caps).
- Rules:
  - 1m → 7 days
  - 5m → 30 days
  - 15m → 90 days
  - 1h → 1 year
  - 4h → 3 years
  - 1d → 3 years
- Always display candle count estimate before execution.

**Step 7 – Execution Summary**
- Show:
  - Chosen pairs
  - Strategy + filters
  - Candle count
  - Est runtime
  - Rotating motivational one-liner (*“All the insights without the manual grind”*).

**Step 8 – Results & Save**
- Show stats: ROI, Sharpe, DD, Winrate, Avg trades, pie chart, equity curve.
- User names bot.
- Options:
  - **Download Bot** → `.zip` with `.py` file.
  - **Share with Bot Community** → +1 credit reward.

---

## 🔹 Indicators (20)
1. EMA  
2. SMA  
3. RSI  
4. MACD  
5. ATR  
6. Bollinger Bands  
7. Stochastic  
8. VWAP  
9. OBV  
10. CCI  
11. Parabolic SAR  
12. Ichimoku Cloud  
13. Donchian Channels  
14. Keltner Channels  
15. ADX  
16. Williams %R  
17. Chaikin Money Flow (CMF)  
18. ROC  
19. Momentum  
20. Volume Profile  

---

## 🔹 Strategies (20)
### Basic (Top 10 pairs only)
1. EMA Crossover Pro – EMA fast/slow crossovers.  
2. RSI Mean Reversion – RSI extremes + ATR filter.  
3. MACD Confirmation – MACD cross aligned with EMA trend.  
4. Bollinger Band Bounce – Bollinger + RSI.  
5. Stochastic Swing Filter – Stochastic + SMA filter.  

### Pro (Top 30 pairs)
6. ATR Trailing Stops – EMA + ATR trailing exit.  
7. VWAP Trend Rider – VWAP + RSI.  
8. CCI Breakout Filter – Donchian breakout + CCI.  
9. ADX Momentum Confirmation – EMA trend + ADX filter.  
10. Parabolic SAR Rider – SAR + MACD.  
11. Keltner Expansion – Keltner channel + OBV.  
12. Williams %R Pullback – Williams %R pullbacks + SMA filter.  
13. CMF Divergence – CMF + RSI divergence.  

### Expert (Full 100 pairs)
14. Ichimoku Cloud Breakout – Cloud + ADX.  
15. Donchian Trend Breaker – Donchian + ATR stop + EMA filter.  
16. Bollinger + MACD Squeeze – Bollinger squeeze + MACD + volume.  
17. ROC Momentum Divergence – ROC vs MACD disagreement.  
18. Multi-MA Trend Rider – EMA + SMA + ADX.  
19. Vol Spike Breakout – ATR/vol spike + EMA.  
20. Breadth-Adjusted Exposure (Turbo K6) – Breadth filter + Top-K momentum rotation.  

---

## 🔹 Tier Rules
- **Basic** → Top 10 pairs only. Simple strategies. No filter indicators. No trailing TP.  
- **Pro** → Top 30 pairs. Can add filter indicators. Partial advanced strategies.  
- **Expert** → Full 100 pairs. All strategies, indicators, filters, and advanced options.  

---

## 🔹 Motivational Liners (Examples)
- *All the insights without the manual grind.*  
- *Every great bot starts with a backtest.*  
- *Because guessing isn’t a strategy.*  
- *Your edge begins here.*  
- *Save hours, test in seconds.*  

---

# 🔹 Next Steps for Build
1. **Finalize UX**: Wizard flow screens + tooltips for every setting.  
2. **Backtester Integration**: Ensure Bybit spot/perp data (up to 3 years). Enforce candle caps.  
3. **Strategy Library**: Implement 20 strategies + indicator combos.  
4. **Tier Gating**: Grey-out unavailable features with tooltips suggesting upgrade.  
5. **Export System**: Generate `.zip` with `.py` bot files + `.json` for copied bots.  
6. **Bot Community**: Enable share/copy flow with +1 credit reward.  
7. **Deploy**: Vercel for front-end, serverless backtester running heavy tasks server-side.  

---
