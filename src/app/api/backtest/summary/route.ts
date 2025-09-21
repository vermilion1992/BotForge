// App Router version (use NextResponse). If Pages Router, export default handler(req,res).
import { NextResponse } from "next/server";
import type { BacktestResult } from "@/botforge/types/backtest";

export async function GET() {
  const data: BacktestResult = {
    kpis: {
      totalReturnPct: 23.5,
      benchmarkReturnPct: -2.1,
      sharpe: 1.8,
      maxDrawdownPct: -8.2,
      winRatePct: 67.3,
      profitableTrades: 105,
    },
    tradeSummary: {
      totalTrades: 156,
      winningTrades: 105,
      losingTrades: 51,
      avgWinLoss: 1.85,
    },
    advanced: {
      biggestWinner: "+$2,450 (18.3%)",
      biggestLoser: "-$890 (6.2%)",
      avgTradeDuration: "2.4 days",
      longestTradeDuration: "12.3 days",
      shortestTradeDuration: "0.3 days",
      longShortSplit: "68% Long / 32% Short",
      longWinRatePct: 71.2,
      shortWinRatePct: 58.9,
      profitFactor: 1.85,
      expectancy: "$45.20",
      kellyPct: 12.3,
      tradeFrequency: "13 per month",
      equityPeak: "$13,200",
      equityValley: "$9,850",
      maxConsecutiveWins: 8,
      maxConsecutiveLosses: 4,
      recoveryFactor: 2.87,
      avgRRR: "1:1.9",
      avgPositionSizePct: 8.5,
      roiPct: 23.5
    },
    equitySeries: [
      { t: "Start", a: 10000, b: 10000 },
      { t: "Feb",   a: 10300, b: 9950  },
      { t: "Apr",   a: 10650, b: 9900  },
      { t: "Jun",   a: 11050, b: 9870  },
      { t: "Aug",   a: 11320, b: 9840  },
      { t: "Oct",   a: 11850, b: 9810  },
      { t: "Dec",   a: 12350, b: 9790  }
    ],
    monthlyReturns: [
      { t: "Jan", value: 1.2 }, { t: "Feb", value: -1.0 }, { t: "Mar", value: 2.1 },
      { t: "Apr", value: 3.3 }, { t: "May", value: -0.8 }, { t: "Jun", value: 1.9 },
      { t: "Jul", value: 2.6 }, { t: "Aug", value: -1.4 }, { t: "Sep", value: 1.1 },
      { t: "Oct", value: 4.0 }, { t: "Nov", value: 0.7 }, { t: "Dec", value: 1.9 }
    ],
    outcomeBuckets: {
      bigWins: 28, smallWins: 77, breakeven: 5, smallLosses: 37, bigLosses: 9
    },
    drawdownSeries: [
      { t: "Start", value: 0 }, { t: "Feb", value: -2.1 }, { t: "Apr", value: -4.0 },
      { t: "Jun", value: -5.7 }, { t: "Aug", value: -6.9 }, { t: "Oct", value: -8.2 }, { t: "Dec", value: -3.5 }
    ]
  };
  return NextResponse.json(data);
}




