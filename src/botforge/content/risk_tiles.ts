export type RiskTier = "standard" | "advanced" | "expert";
export type RiskVariant = "conservative" | "balanced" | "aggressive";

export const RISK_TILE_COPY = {
  standard: { title: "Standard", blurb: "One clean target. Simple and fast." },
  advanced: { title: "Advanced", blurb: "Scale out and lock gains; trail winners." },
  expert: { title: "Expert", blurb: "Adaptive exits: ATR trail + ATR safety stop." }
} as const;

export const RISK_PRESETS: Record<RiskTier, Record<RiskVariant, {
  label: string;
  explain: string;
  exits: {
    defaultSLPct?: number;
    defaultTPPct?: number;
    multiTP?: { enabled: boolean; targets?: Array<{ pct: number; sizePct: number }> };
  };
  breakeven?: { enabled: boolean; trigger?: "after_tp1"; offsetPct?: number };
  trailingTP?: { enabled: boolean; mode?: "percent" | "atr"; valuePct?: number; atrMult?: number; activateAfter?: "tp2" };
  timeStop?: { enabled: boolean; bars?: number };
  atrStop?: { enabled: boolean; atrMult?: number };
}>> = {
  standard: {
    conservative: {
      label: "Conservative",
      explain: "Single target exits; minimal risk with tight stop.",
      exits: { defaultSLPct: 3, defaultTPPct: 6, multiTP: { enabled: false } },
      breakeven: { enabled: false }, trailingTP: { enabled: false },
      timeStop: { enabled: false }, atrStop: { enabled: false }
    },
    balanced: {
      label: "Balanced",
      explain: "Simple risk/reward target, no trailing.",
      exits: { defaultSLPct: 5, defaultTPPct: 10, multiTP: { enabled: false } },
      breakeven: { enabled: false }, trailingTP: { enabled: false },
      timeStop: { enabled: false }, atrStop: { enabled: false }
    },
    aggressive: {
      label: "Aggressive",
      explain: "Wider stop and target; lets winners breathe.",
      exits: { defaultSLPct: 7, defaultTPPct: 14, multiTP: { enabled: false } },
      breakeven: { enabled: false }, trailingTP: { enabled: false },
      timeStop: { enabled: false }, atrStop: { enabled: false }
    }
  },
  advanced: {
    conservative: {
      label: "Adv–Conservative",
      explain: "Scale out 3 steps; BE after TP1; gentle % trail after TP2; optional time stop.",
      exits: { defaultSLPct: 4, multiTP: { enabled: true, targets: [
        { pct: 5, sizePct: 40 }, { pct: 8, sizePct: 35 }, { pct: 12, sizePct: 25 }
      ]}},
      breakeven: { enabled: true, trigger: "after_tp1", offsetPct: 0.10 },
      trailingTP: { enabled: true, mode: "percent", valuePct: 0.8, activateAfter: "tp2" },
      timeStop: { enabled: true, bars: 30 }, atrStop: { enabled: false }
    },
    balanced: {
      label: "Adv–Balanced",
      explain: "Balanced scale-out; trail 1.0% after TP2; time stop 60 bars.",
      exits: { defaultSLPct: 5, multiTP: { enabled: true, targets: [
        { pct: 6, sizePct: 35 }, { pct: 10, sizePct: 35 }, { pct: 15, sizePct: 30 }
      ]}},
      breakeven: { enabled: true, trigger: "after_tp1", offsetPct: 0.10 },
      trailingTP: { enabled: true, mode: "percent", valuePct: 1.0, activateAfter: "tp2" },
      timeStop: { enabled: true, bars: 60 }, atrStop: { enabled: false }
    },
    aggressive: {
      label: "Adv–Aggressive",
      explain: "Let winners run; stronger trail after TP2; longer time stop.",
      exits: { defaultSLPct: 7, multiTP: { enabled: true, targets: [
        { pct: 7, sizePct: 30 }, { pct: 12, sizePct: 30 }, { pct: 20, sizePct: 40 }
      ]}},
      breakeven: { enabled: true, trigger: "after_tp1", offsetPct: 0.15 },
      trailingTP: { enabled: true, mode: "percent", valuePct: 1.3, activateAfter: "tp2" },
      timeStop: { enabled: true, bars: 90 }, atrStop: { enabled: false }
    }
  },
  expert: {
    conservative: {
      label: "Expert–Conservative",
      explain: "Scale out + ATR trailing after TP2; ATR safety stop; time stop.",
      exits: { defaultSLPct: 4, multiTP: { enabled: true, targets: [
        { pct: 5, sizePct: 40 }, { pct: 8, sizePct: 35 }, { pct: 12, sizePct: 25 }
      ]}},
      breakeven: { enabled: true, trigger: "after_tp1", offsetPct: 0.10 },
      trailingTP: { enabled: true, mode: "atr", atrMult: 0.8, activateAfter: "tp2" },
      timeStop: { enabled: true, bars: 30 },
      atrStop: { enabled: true, atrMult: 1.8 }
    },
    balanced: {
      label: "Expert–Balanced",
      explain: "ATR trail ×1.0 after TP2; ATR stop ×2.0; time stop 60 bars.",
      exits: { defaultSLPct: 5, multiTP: { enabled: true, targets: [
        { pct: 6, sizePct: 35 }, { pct: 10, sizePct: 35 }, { pct: 15, sizePct: 30 }
      ]}},
      breakeven: { enabled: true, trigger: "after_tp1", offsetPct: 0.10 },
      trailingTP: { enabled: true, mode: "atr", atrMult: 1.0, activateAfter: "tp2" },
      timeStop: { enabled: true, bars: 60 },
      atrStop: { enabled: true, atrMult: 2.0 }
    },
    aggressive: {
      label: "Expert–Aggressive",
      explain: "Max run potential with stronger ATR trail/stop; long time stop.",
      exits: { defaultSLPct: 7, multiTP: { enabled: true, targets: [
        { pct: 7, sizePct: 30 }, { pct: 12, sizePct: 30 }, { pct: 20, sizePct: 40 }
      ]}},
      breakeven: { enabled: true, trigger: "after_tp1", offsetPct: 0.15 },
      trailingTP: { enabled: true, mode: "atr", atrMult: 1.3, activateAfter: "tp2" },
      timeStop: { enabled: true, bars: 90 },
      atrStop: { enabled: true, atrMult: 2.5 }
    }
  }
};



