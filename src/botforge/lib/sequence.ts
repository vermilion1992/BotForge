export type SequenceCfg = {
  enabled: boolean;
  ruleAId?: string;
  ruleBId?: string;
  withinBars: number;
};

/** A lightweight, per-symbol in-memory state for sequence arming */
type ArmState = { armed: boolean; expiresAt: number; aBar: number; lastConsumedABar?: number };
const SEQ_STATE: Map<string /*symbol*/, ArmState> = new Map();

export function summarizeSequence(seq: SequenceCfg, rules: Array<{id:string; displayName?:string; label?:string; name?:string}> = []) {
  if (!seq?.enabled) return "Sequence off";
  const nameOf = (id?:string) => {
    const r = rules.find(x => x.id === id);
    return (r?.displayName || r?.label || r?.name || r?.id || "—");
  };
  return `Sequence on • ${nameOf(seq.ruleAId)} → ${nameOf(seq.ruleBId)} within ${seq.withinBars} bars`;
}

/**
 * Evaluate sequence for the current bar.
 * - `isRuleTrue(id)` must return true on this bar if the rule is satisfied on this bar (confirmed).
 * - `ctx.barIndex` should be a monotonically increasing integer.
 * Behavior:
 *   A triggers → arm window for N bars; if B occurs before expiry → pass on that bar, then disarm.
 */
export function evaluateSequence(seq: SequenceCfg, ctx: { symbol: string; barIndex: number }, isRuleTrue: (id: string) => boolean): boolean {
  if (!seq?.enabled) return true;
  if (!seq.ruleAId || !seq.ruleBId || !(seq.withinBars > 0)) return false;

  const key = ctx.symbol;
  const st = SEQ_STATE.get(key) || { armed: false, expiresAt: -1, aBar: -1 } as ArmState;

  // Check if A occurs on this bar (event or state becoming true)
  const aNow = isRuleTrue(seq.ruleAId);
  const bNow = isRuleTrue(seq.ruleBId);

  // Arm when A occurs (and avoid reusing the same A bar twice)
  if (aNow && (!st.armed || st.aBar !== ctx.barIndex)) {
    st.armed = true;
    st.aBar = ctx.barIndex;
    st.expiresAt = ctx.barIndex + seq.withinBars;
  }

  // If armed, check B within window
  if (st.armed) {
    if (ctx.barIndex > st.expiresAt) {
      // window expired — disarm and wait for next A
      st.armed = false;
    } else if (bNow && ctx.barIndex > st.aBar) {
      // Pass on B bar, then disarm
      st.lastConsumedABar = st.aBar;
      st.armed = false;
      SEQ_STATE.set(key, st);
      return true;
    }
  }

  SEQ_STATE.set(key, st);
  return false;
}


