export type Tier = "standard" | "advanced" | "expert";

type TP = { pct?: number; sizePct?: number };
type Draft = {
  exits?: {
    defaultSLPct?: number;
    defaultTPPct?: number;
    multiTP?: { enabled?: boolean; targets?: TP[] };
  };
  breakeven?: { enabled?: boolean; offsetPct?: number; trigger?: "after_tp1" };
  trailingTP?: { enabled?: boolean; mode?: "percent" | "atr"; valuePct?: number; atrMult?: number; activateAfter?: "tp2" };
  timeStop?: { enabled?: boolean; bars?: number };
  atrStop?: { enabled?: boolean; atrMult?: number };
};

export type Validation = {
  errors: string[];          // blocks Apply
  warnings: string[];        // informative only
  canNormalize: boolean;
  canSortSpace: boolean;
  canDisableTrailing: boolean;
  suggestions: string[];     // textual hints shown with warnings
};

const LIMITS = {
  slPct: { min: 0.5, max: 20 },
  singleTPPct: { min: 1, max: 50 },
  multiTPPct: { min: 1, max: 50 },
  allocPct: { min: 1, max: 100 },
  beOffset: { min: 0, max: 1.0 },
  trailPct: { min: 0.3, max: 5.0 },
  atrTrail: { min: 0.5, max: 5.0 },
  atrStop: { min: 0.5, max: 5.0 },
  timeBars: { min: 5, max: 1000 },
  spacingMin: 0.5,      // min % gap between TP1/2/3
  allocTotal: 100,
  allocTol: 0.5,        // +- tolerance before we say it's not 100
};

export function validateRiskDraft(draft: Draft, tier: Tier): Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let canNormalize = false;
  let canSortSpace = false;
  let canDisableTrailing = false;

  // Standard tier validation
  if (tier === "standard") {
    const sl = draft.exits?.defaultSLPct;
    const tp = draft.exits?.defaultTPPct;
    
    if (!isNum(sl) || sl < LIMITS.slPct.min || sl > LIMITS.slPct.max) {
      errors.push(`Stop Loss must be between ${LIMITS.slPct.min}% and ${LIMITS.slPct.max}%`);
    }
    if (!isNum(tp) || tp < LIMITS.singleTPPct.min || tp > LIMITS.singleTPPct.max) {
      errors.push(`Take Profit must be between ${LIMITS.singleTPPct.min}% and ${LIMITS.singleTPPct.max}%`);
    }
    if (isNum(sl) && isNum(tp) && tp <= sl) {
      errors.push("Take Profit must be greater than Stop Loss");
    }
  }

  // Advanced/Expert tier validation
  if (tier === "advanced" || tier === "expert") {
    const multiTP = draft.exits?.multiTP;
    if (multiTP?.enabled && multiTP.targets?.length) {
      const targets = multiTP.targets;
      
      // Validate each target
      targets.forEach((t, i) => {
        if (!isNum(t.pct) || t.pct < LIMITS.multiTPPct.min || t.pct > LIMITS.multiTPPct.max) {
          errors.push(`TP${i+1} must be between ${LIMITS.multiTPPct.min}% and ${LIMITS.multiTPPct.max}%`);
        }
        if (!isNum(t.sizePct) || t.sizePct < LIMITS.allocPct.min || t.sizePct > LIMITS.allocPct.max) {
          errors.push(`TP${i+1} Allocation must be between ${LIMITS.allocPct.min}% and ${LIMITS.allocPct.max}%`);
        }
      });

      // Check for proper spacing between targets
      const sortedPcts = targets.map(t => t.pct).filter(isNum).sort((a, b) => a - b);
      if (sortedPcts.length > 1) {
        for (let i = 1; i < sortedPcts.length; i++) {
          if (sortedPcts[i] - sortedPcts[i-1] < LIMITS.spacingMin) {
            warnings.push(`TP targets should be at least ${LIMITS.spacingMin}% apart`);
            canSortSpace = true;
            break;
          }
        }
      }

      // Check allocation total
      const totalAlloc = targets.reduce((sum, t) => sum + (t.sizePct || 0), 0);
      if (Math.abs(totalAlloc - LIMITS.allocTotal) > LIMITS.allocTol) {
        warnings.push(`Total allocation should be ${LIMITS.allocTotal}% (currently ${totalAlloc.toFixed(1)}%)`);
        canNormalize = true;
      }
    }

    // Breakeven validation
    const be = draft.breakeven;
    if (be?.enabled && isNum(be.offsetPct)) {
      if (be.offsetPct < LIMITS.beOffset.min || be.offsetPct > LIMITS.beOffset.max) {
        errors.push(`Breakeven offset must be between ${LIMITS.beOffset.min}% and ${LIMITS.beOffset.max}%`);
      }
    }

    // Trailing TP validation
    const trail = draft.trailingTP;
    if (trail?.enabled) {
      if (trail.mode === "percent" && isNum(trail.valuePct)) {
        if (trail.valuePct < LIMITS.trailPct.min || trail.valuePct > LIMITS.trailPct.max) {
          errors.push(`Trailing % must be between ${LIMITS.trailPct.min}% and ${LIMITS.trailPct.max}%`);
        }
      } else if (trail.mode === "atr" && isNum(trail.atrMult)) {
        if (trail.atrMult < LIMITS.atrTrail.min || trail.atrMult > LIMITS.atrTrail.max) {
          errors.push(`Trailing ATR multiplier must be between ${LIMITS.atrTrail.min} and ${LIMITS.atrTrail.max}`);
        }
      }
    }

    // Time stop validation
    const timeStop = draft.timeStop;
    if (timeStop?.enabled && isNum(timeStop.bars)) {
      if (timeStop.bars < LIMITS.timeBars.min || timeStop.bars > LIMITS.timeBars.max) {
        errors.push(`Time stop must be between ${LIMITS.timeBars.min} and ${LIMITS.timeBars.max} bars`);
      }
    }

    // ATR stop validation (Expert only)
    if (tier === "expert") {
      const atrStop = draft.atrStop;
      if (atrStop?.enabled && isNum(atrStop.atrMult)) {
        if (atrStop.atrMult < LIMITS.atrStop.min || atrStop.atrMult > LIMITS.atrStop.max) {
          errors.push(`ATR Stop multiplier must be between ${LIMITS.atrStop.min} and ${LIMITS.atrStop.max}`);
        }
      }
    }

    // Check if trailing can be disabled
    if (trail?.enabled) {
      canDisableTrailing = true;
    }
  }

  // Protective exit requirement
  const hasSL = isNum(draft.exits?.defaultSLPct);
  const hasATRStop = !!(draft?.atrStop?.enabled && isNum(draft?.atrStop?.atrMult));
  if (!hasSL && !hasATRStop) {
    errors.push("Protective exit required: set Stop Loss (%) or enable ATR Stop ×.");
  }

  // Trailing is not a hard stop (warn if trailing is ON but no SL)
  const trailingOn =
    draft?.trailingTP?.enabled !== false &&
    ((draft?.trailingTP?.mode === "percent" && isNum(draft?.trailingTP?.valuePct)) ||
     (draft?.trailingTP?.mode === "atr" && isNum(draft?.trailingTP?.atrMult)));
  if (trailingOn && !hasSL && !hasATRStop) {
    warnings.push("Trailing alone isn't a protective stop. Add SL% or ATR Stop ×.");
  }

  // Mutually exclusive trailing modes (defensive check)
  const trailingPercentOn = draft?.trailingTP?.mode === "percent" && isNum(draft?.trailingTP?.valuePct);
  const trailingATROn     = draft?.trailingTP?.mode === "atr"     && isNum(draft?.trailingTP?.atrMult);
  if (trailingPercentOn && trailingATROn) {
    errors.push("Choose either Trailing % or Trailing ATR×, not both.");
  }

  // Generate suggestions
  if (tier === "advanced" || tier === "expert") {
    if (draft.exits?.multiTP?.enabled && draft.exits.multiTP.targets?.length) {
      const targets = draft.exits.multiTP.targets;
      const hasEmptyTargets = targets.some(t => !isNum(t.pct) || !isNum(t.sizePct));
      if (hasEmptyTargets) {
        suggestions.push("Fill in all target percentages and allocations");
      }
    }
  }

  return {
    errors,
    warnings,
    canNormalize,
    canSortSpace,
    canDisableTrailing,
    suggestions
  };
}

export function normalizeAllocations(draft: Draft): Draft {
  const next = structuredClone(draft);
  const multiTP = next.exits?.multiTP;
  if (!multiTP?.enabled || !multiTP.targets?.length) return next;

  const targets = multiTP.targets;
  const total = targets.reduce((sum, t) => sum + (t.sizePct || 0), 0);
  
  if (total > 0) {
    const factor = LIMITS.allocTotal / total;
    targets.forEach(t => {
      if (isNum(t.sizePct)) {
        t.sizePct = Math.round(t.sizePct * factor * 10) / 10; // Round to 1 decimal
      }
    });
  }

  return next;
}

export function sortAndSpaceTargets(draft: Draft): Draft {
  const next = structuredClone(draft);
  const multiTP = next.exits?.multiTP;
  if (!multiTP?.enabled || !multiTP.targets?.length) return next;

  const targets = multiTP.targets;
  
  // Sort by percentage
  targets.sort((a, b) => (a.pct || 0) - (b.pct || 0));
  
  // Ensure minimum spacing
  for (let i = 1; i < targets.length; i++) {
    const prev = targets[i-1].pct || 0;
    const curr = targets[i].pct || 0;
    if (curr - prev < LIMITS.spacingMin) {
      targets[i].pct = prev + LIMITS.spacingMin;
    }
  }

  return next;
}

export function disableTrailing(draft: Draft): Draft {
  const next = structuredClone(draft);
  if (next.trailingTP) {
    next.trailingTP.enabled = false;
  }
  return next;
}

// Utility functions
function isNum(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v) && !Number.isNaN(v);
}

function deepSet(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) current[key] = {};
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}
