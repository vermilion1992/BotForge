# BotForge – Lovable Handoff Document (Private Repo Access)

## 🔹 Purpose
This document provides Lovable with everything needed to begin building BotForge using the NextAdmin dashboard template and the Master Prompt specification.

---

## 🔹 Assets Provided

1. **GitHub Repository (Source Code)**
   - Repo: https://github.com/vermilion1992/BotForge (🔒 Private)
   - Action: You will need to provide Lovable with access.
     - Go to your GitHub repo → Settings → Collaborators → Add collaborator.
     - Add the Lovable developer’s GitHub username/email.

2. **Vercel Deployment (Live Preview)**
   - Live site: https://bot-forge-eight.vercel.app/
   - Purpose: Preview the running dashboard environment.

3. **Master Prompt Specification**
   - File: `BotForge_Master_Prompt.md`
   - Contains: Full app logic, wizard flow, strategies, indicators, tiers, and UX rules.

---

## 🔹 What Lovable Needs To Do

1. **Clone Repo**
   - Pull down from GitHub (after collaborator access is granted).

2. **Integrate Wizard Flow**
   - Implement the Strategy Builder exactly as specified in the Master Prompt.
   - Ensure Advanced Settings, greyed-out tier features, and tooltips are in place.

3. **Dashboard Adjustments**
   - Use NextAdmin dark theme as the default.
   - Customize navigation tabs: Strategy Builder, Bot Community, My Bots, AI Chat.
   - Add widgets for credits, recent bots, leaderboard previews, etc.

4. **Bot Export**
   - Ensure Generate Bot → downloads `.zip` with `.py`.
   - Copy from Bot Community → `.json` for backtest/edit only.

5. **Bot Community**
   - Build leaderboard/community features with +1 credit reward for sharing.

6. **Backtester Integration**
   - Run Bybit Spot + Perp data (max 3 years).
   - Enforce candle caps (1m=7d, 5m=30d, 15m=90d, 1h=1y, 4h=3y, 1d=3y).
   - Display estimated candles + motivational one-liner before execution.

7. **Tier Gating**
   - Basic → Top 10 pairs, simple strategies, no filter indicators.
   - Pro → Top 30 pairs, filter indicators, partial advanced.
   - Expert → Full 100 pairs, all strategies, all indicators, full customization.

---

## 🔹 Deliverables Expected from Lovable
- Working BotForge app deployed to Vercel using the repo.  
- Strategy Builder wizard flow integrated with visuals, tooltips, and tier gating.  
- Download + Share flow functional.  
- Bot Community page with credit reward system.  
- My Bots page with naming + downloading.  
- AI Chat plugin connected.  

---

## 🔹 Notes
- API keys are **never** part of BotForge.  
- No live trading or tracking — everything is backtest/simulation-based.  
- UX must remain simple: Strategy first, indicators second, risk third.  
- Advanced Settings box is consistent across strategies, indicators, and risk.  

---

# ✅ Summary
Lovable should work **inside the GitHub repo**, deploy updates automatically to Vercel, and follow the Master Prompt spec to implement the Strategy Builder and BotForge ecosystem.  

⚠️ Important: Please make sure to add Lovable as a **GitHub repo collaborator** so they can access the private repo.
