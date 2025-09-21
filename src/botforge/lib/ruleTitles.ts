/**
 * Helper functions for generating friendly rule titles
 */

export function getFriendlyRuleTitle(rule: { left: string; operator: string; right: string; family?: string }): string {
  const { left, operator, right, family } = rule;
  
  // Handle common patterns
  if (left === "price.close" && operator === ">" && right.includes("ema")) {
    return `Close > ${right.replace("ema", "EMA").replace(".value", "")}`;
  }
  
  if (left === "price.close" && operator === "<" && right.includes("ema")) {
    return `Close < ${right.replace("ema", "EMA").replace(".value", "")}`;
  }
  
  if (left === "price.close" && operator === ">" && right.includes("donch")) {
    return `Close > Donchian Upper`;
  }
  
  if (left === "price.close" && operator === "<" && right.includes("donch")) {
    return `Close < Donchian Lower`;
  }
  
  if (left.includes("rsi") && operator === ">") {
    return `RSI > ${right}`;
  }
  
  if (left.includes("rsi") && operator === "<") {
    return `RSI < ${right}`;
  }
  
  if (left.includes("atr") && operator === "rising") {
    return `ATR rising`;
  }
  
  if (left.includes("atr") && operator === "falling") {
    return `ATR falling`;
  }
  
  if (left.includes("volume") && operator === ">") {
    return `Volume > avg`;
  }
  
  // Fallback to simple format
  const leftClean = left.replace("price.", "").replace(".value", "");
  const rightClean = right.replace("price.", "").replace(".value", "");
  
  return `${leftClean} ${operator} ${rightClean}`;
}

export function getRuleAlphaLabel(rules: any[], ruleId: string): string {
  const sorted = rules.sort((a, b) => a.id.localeCompare(b.id));
  const index = sorted.findIndex(r => r.id === ruleId);
  if (index >= 0) {
    return String.fromCharCode(65 + index); // A, B, C, etc.
  }
  return "?";
}


