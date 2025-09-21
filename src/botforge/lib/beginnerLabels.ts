type PriceField = "close"|"open"|"high"|"low"|"hl2"|"ohlc4";

export const PRICE_WORD: Record<PriceField,string> = {
  close: "price", open: "opening price", high: "high", low: "low", hl2: "average of high/low", ohlc4: "average of open/high/low/close"
};

type IndicatorMeta = { id: string; alias?: string; params?: { length?: number } };

export function buildAliasMeta(selectedPreset?: { indicators?: IndicatorMeta[] }) {
  const meta: Record<string, { id: string; length?: number }> = {};
  const counts: Record<string, number[]> = {};
  (selectedPreset?.indicators || []).forEach((x) => {
    if (!x.alias) return;
    meta[x.alias] = { id: x.id, length: x.params?.length };
    if (!counts[x.id]) counts[x.id] = [];
    if (x.params?.length != null) counts[x.id].push(x.params.length);
  });
  return { meta, counts };
}

export function friendlyIndicatorName(
  alias: string | undefined,
  aliasMeta: Record<string, { id: string; length?: number }>,
  countsById: Record<string, number[]>
): string {
  if (!alias) return "indicator";
  const m = aliasMeta[alias];
  if (!m) {
    // Fallback by alias hint
    if (/ema/i.test(alias)) return "your EMA";
    if (/rsi/i.test(alias)) return "your RSI";
    if (/donch/i.test(alias)) return "recent band";
    return alias.toUpperCase();
  }
  const id = m.id;
  if (id === "ema") {
    // Two EMAs? Name fast/slow by length percentile
    const lengths = countsById["ema"] || [];
    if (lengths.length >= 2 && m.length != null) {
      const sorted = [...lengths].sort((a,b)=>a-b);
      const isFast = m.length <= sorted[Math.floor(sorted.length/2)];
      return isFast ? "fast EMA" : "slow EMA";
    }
    return "your EMA";
  }
  if (id === "rsi") return "your RSI";
  if (id === "donchian_channels") return "recent band";
  if (id === "bollinger_bands") return "Bollinger band";
  if (id === "vwap") return "VWAP";
  return id.toUpperCase();
}

export function friendlyBand(alias: string | undefined, output: string | undefined): string {
  // Donchian upper/lower -> recent high/low band; Bollinger basis/upper/lower → mid/high/low band
  const out = (output || "value").toLowerCase();
  if (/donch/i.test(alias || "")) {
    if (out === "upper") return "recent high band";
    if (out === "lower") return "recent low band";
    return "recent band";
  }
  if (/boll/i.test(alias || "")) {
    if (out === "upper") return "upper band";
    if (out === "lower") return "lower band";
    if (out === "basis") return "middle band";
    return "band";
  }
  return out === "value" ? "" : out;
}

export function friendlyOperator(op: string): string {
  switch (op) {
    case "crosses_above": return "goes up through";
    case "crosses_below": return "goes down through";
    case "rising": return "is trending up";
    case "falling": return "is trending down";
    case ">=": return "is at or above";
    case "<=": return "is at or below";
    case ">": return "is above";
    case "<": return "is below";
    case "==": return "is equal to";
    case "within": return "is between";
    case "outside": return "is outside";
    default: return op;
  }
}

// Build a plain sentence from a normalized rule token set
export function ruleToSentence(rule: any, ctx: {
  aliasMeta: Record<string, { id: string; length?: number }>;
  countsById: Record<string, number[]>;
}): string {
  const op = rule?.operator || "";
  const left = rule?.left;
  const right = rule?.right;

  const isPriceRef = (tok:any) => {
    if (!tok) return false;
    if (tok?.type === "price") return true;
    if (typeof tok === "object" && tok.ref) return String(tok.ref).startsWith("price.");
    if (typeof tok === "string") return tok.startsWith("price.");
    return false;
  };

  const L = refToWords(left, ctx);
  const R = refToWords(right, ctx);

  // Slope-only ops
  if (op === "rising" || op === "falling") return `${L} ${friendlyOperator(op)}`;

  // Price comparisons → use "closes above/below/at or …"
  const priceOnEitherSide = isPriceRef(left) || isPriceRef(right);
  if (priceOnEitherSide) {
    if (op === ">")  return `price closes above ${R === "price" ? L : (L==="price" ? R : R)}`;
    if (op === ">=") return `price closes at or above ${R === "price" ? L : R}`;
    if (op === "<")  return `price closes below ${R === "price" ? L : R}`;
    if (op === "<=") return `price closes at or below ${R === "price" ? L : R}`;
    if (op === "==") return `price closes equal to ${R === "price" ? L : R}`;
  }

  if (op === "within" || op === "outside") {
    // expect R as range {min,max} or array; fallback to text
    if (Array.isArray(R)) return `${L} ${friendlyOperator(op)} ${R[0]} and ${R[1]}`;
  }
  if (op === "crosses_above" || op === "crosses_below") return `${L} ${friendlyOperator(op)} ${R}`;
  return `${L} ${friendlyOperator(op)} ${R}`;
}

function refToWords(tok: any, ctx: { aliasMeta: Record<string, { id: string; length?: number }>; countsById: Record<string, number[]> }): string {
  if (!tok) return "Please select value";
  if (tok.type === "number") return typeof tok.value === "number" ? `${tok.value}` : String(tok.value);
  if (tok.type === "price") return tok.field ? (tok.field === "close" ? "price" : PRICE_WORD[tok.field] || "price") : "price";
  if (tok.type === "indicator") {
    const name = friendlyIndicatorName(tok.alias, ctx.aliasMeta, ctx.countsById);
    const band = friendlyBand(tok.alias, tok.output);
    return band ? band : name;
  }
  if (typeof tok === "object" && tok.ref) {
    // Legacy {ref:"ema21.value"} etc.
    const [alias, output] = String(tok.ref).split(".");
    if (alias === "price") {
      const f = (output || "close") as PriceField;
      return f === "close" ? "price" : PRICE_WORD[f] || "price";
    }
    const name = friendlyIndicatorName(alias, ctx.aliasMeta, ctx.countsById);
    const band = friendlyBand(alias, output);
    return band ? band : name;
  }
  if (typeof tok === "string") {
    // Accept raw string refs like "price.close" or "donch20.upper"
    const [alias, output] = tok.split(".");
    if (alias === "price") {
      const f = (output || "close") as PriceField;
      return f === "close" ? "price" : PRICE_WORD[f] || "price";
    }
    const name = friendlyIndicatorName(alias, ctx.aliasMeta, ctx.countsById);
    const band = friendlyBand(alias, output);
    return band ? band : name;
  }
  return String(tok);
}

// Tiny titles to avoid "codey" A/B/C lines
export function ruleTitle(rule: any, sentence: string): string {
  const op = (rule?.operator || "").toLowerCase();

  // Try to inspect left/right tokens for smarter labels
  const left = rule?.left;
  const right = rule?.right;

  const refToId = (tok: any): { id?: string; alias?: string; output?: string; type?: string } => {
    if (!tok) return {};
    if (typeof tok === "object" && tok.type === "indicator") return { id: tok.id, alias: tok.alias, output: tok.output, type: "indicator" };
    if (typeof tok === "object" && tok.type === "price") return { type: "price" };
    if (typeof tok === "object" && tok.ref) {
      const [alias, output] = String(tok.ref).split(".");
      return { alias, output, type: alias === "price" ? "price" : "indicator" };
    }
    if (typeof tok === "string") {
      const [alias, output] = tok.split(".");
      return { alias, output, type: alias === "price" ? "price" : "indicator" };
    }
    return {};
  };

  const L = refToId(left);
  const R = refToId(right);

  // Strong heuristics first (bands & slope)
  if (op === "crosses_above" && /upper|high band/.test((R.output || R.alias || "").toLowerCase())) return "Breakout";
  if (op === "crosses_below" && /lower|low band/.test((R.output || R.alias || "").toLowerCase())) return "Breakdown";
  if (op === "rising") return "Trend";
  if (op === "falling") return "Trend";
  if ((op === ">=" || op === ">") && /upper|high band/.test((R.output || R.alias || "").toLowerCase())) return "Hold";
  if ((op === "<=" || op === "<") && /lower|low band/.test((R.output || R.alias || "").toLowerCase())) return "Hold";

  // EMA / price relationships
  const isEMA_L = (L.alias || L.id || "").toLowerCase().includes("ema");
  const isEMA_R = (R.alias || R.id || "").toLowerCase().includes("ema");
  const isPrice_L = L.type === "price";
  const isPrice_R = R.type === "price";
  if ((isPrice_L && isEMA_R && (op === ">" || op === ">=")) || (isEMA_L && isPrice_R && (op === "<" || op === "<="))) {
    return "Above EMA";
  }
  if ((isPrice_L && isEMA_R && (op === "<" || op === "<=")) || (isEMA_L && isPrice_R && (op === ">" || op === ">="))) {
    return "Below EMA";
  }

  // RSI thresholds
  const isRSI_L = (L.alias || L.id || "").toLowerCase().includes("rsi");
  const isRSI_R = (R.alias || R.id || "").toLowerCase().includes("rsi");
  const rightNum = typeof right?.value === "number" ? right.value : (typeof right === "number" ? right : undefined);
  if ((isRSI_L || isRSI_R) && (op === ">" || op === ">=")) {
    if (rightNum != null && rightNum >= 50) return "Momentum";
    return "RSI Above Threshold";
  }
  if ((isRSI_L || isRSI_R) && (op === "<" || op === "<=")) {
    if (rightNum != null && rightNum <= 50) return "Weakness";
    return "RSI Below Threshold";
  }

  // Fallbacks that avoid "price/your/condition"
  const first = sentence.split(" ")[0]?.replace(/[:.,]/g, "").toLowerCase();
  if (!first || first === "price" || first === "your" || first === "the" || first === "condition") return "Signal";
  return first.charAt(0).toUpperCase() + first.slice(1);
}
