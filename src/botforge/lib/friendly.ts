export type RefTok =
  | { type: "price"; field: "close"|"open"|"high"|"low"|"hl2"|"ohlc4"; label?: string }
  | { type: "indicator"; alias: string; output: string; pretty?: string }
  | { type: "number"; value: number };

export const PRICE_LABEL: Record<string,string> = {
  close:"Close", open:"Open", high:"High", low:"Low", hl2:"HL2", ohlc4:"OHLC4"
};

export function prettyRef(tok?: RefTok): string {
  if (!tok) return "—";
  if (tok.type === "price") return PRICE_LABEL[tok.field] || "Price";
  if (tok.type === "number") return String(tok.value);
  // indicator
  const base = tok.pretty || tok.alias.toUpperCase();
  const out = tok.output && tok.output !== "value" ? ` ${niceOutput(tok.output)}` : "";
  return `${base}${out}`;
}

export function niceOutput(out: string): string {
  if (out === "upper") return "Upper";
  if (out === "lower") return "Lower";
  if (out === "basis") return "Basis";
  if (out === "hist") return "Histogram";
  return out;
}

export function prettyOperator(op: string): string {
  switch (op) {
    case "crosses_above": return "crosses above";
    case "crosses_below": return "crosses below";
    case "rising": return "is rising";
    case "falling": return "is falling";
    case "within": return "is within";
    case "outside": return "is outside";
    case ">": case ">=": case "<": case "<=": case "==": return op;
    default: return op;
  }
}

export function parseStringToRefTok(value: string): RefTok {
  if (!value) return { type: "number", value: 0 };
  
  // Check if it's a number
  const num = Number(value);
  if (!isNaN(num)) return { type: "number", value: num };
  
  // Check if it's a price reference
  if (value.startsWith("price.")) {
    const field = value.split(".")[1] as "close"|"open"|"high"|"low"|"hl2"|"ohlc4";
    return { type: "price", field: field || "close" };
  }
  
  // Check if it's an indicator reference
  if (value.includes(".")) {
    const [alias, output] = value.split(".");
    return { type: "indicator", alias, output: output || "value" };
  }
  
  // Default to number
  return { type: "number", value: 0 };
}

export function ruleSentence(rule: {
  displayName?: string;
  operator: string;
  left?: RefTok | string;
  right?: RefTok | string;
}): string {
  const op = rule.operator;
  const L = prettyRef(typeof rule.left === 'string' ? parseStringToRefTok(rule.left) : rule.left);
  if (op === "rising" || op === "falling") {
    return `${L} ${prettyOperator(op)}`;
  }
  const R = prettyRef(typeof rule.right === 'string' ? parseStringToRefTok(rule.right) : rule.right);
  return `${L} ${prettyOperator(op)} ${R}`;
}
