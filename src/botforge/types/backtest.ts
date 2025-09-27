export type KpiBadge = "Good" | "Neutral" | "Poor";

export interface BacktestKPIs {
  totalReturnPct: number;
  benchmarkReturnPct: number;
  sharpe: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitableTrades: number;
}

export interface TradeSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWinLoss: number; // ratio
}

export interface AdvancedStats {
  biggestWinner: string;
  biggestLoser: string;
  avgTradeDuration: string;
  longestTradeDuration: string;
  shortestTradeDuration: string;
  longShortSplit: string;
  longWinRatePct: number;
  shortWinRatePct: number;
  profitFactor: number;
  expectancy: string;
  kellyPct: number;
  tradeFrequency: string;
  equityPeak: string;
  equityValley: string;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  recoveryFactor: number;
  avgRRR: string;
  avgPositionSizePct: number;
  roiPct: number;
}

export interface SeriesPoint { t: string; a?: number; b?: number; value?: number; }

export interface TradeOutcomeBuckets {
  bigWins: number;
  smallWins: number;
  breakeven: number;
  smallLosses: number;
  bigLosses: number;
}

export interface BacktestResult {
  kpis: BacktestKPIs;
  tradeSummary: TradeSummary;
  advanced: AdvancedStats;
  equitySeries: SeriesPoint[];      // strategy vs benchmark
  monthlyReturns: SeriesPoint[];    // month, value
  outcomeBuckets: TradeOutcomeBuckets;
  drawdownSeries: SeriesPoint[];
}





