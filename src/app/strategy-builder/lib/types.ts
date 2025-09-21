export type SideKind = "price" | "indicator" | "number";

export type OperatorId =
  | "gt"            // is above
  | "lt"            // is below
  | "crossesAbove"  // crosses above
  | "crossesBelow"  // crosses below
  | "rising"        // is rising
  | "falling"       // is falling
  | "equals"        // equals
  | "withinPct";    // within % of (number only right)

export type PriceField = "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4";

// Minimal indicator ids used by the registry
export type IndicatorId = "ATR" | "EMA" | "RSI";

export type IndicatorOutputId = "value"; // keep simple for EMA/RSI/ATR

export type IndicatorParam = {
  key: string;                // e.g. "length"
  label: string;              // e.g. "Length"
  type: "int" | "float";
  default: number;
  min?: number;
  max?: number;
};

export type IndicatorMeta = {
  id: string;                 // "ema" | "rsi" | "atr"
  label: string;              // "EMA" | "RSI" | "ATR"
  params: IndicatorParam[];
  outputs: IndicatorOutputId[]; // ["value"]
};

export type PriceRef = {
  kind: "price";
  field: PriceField;
};

export type IndicatorRef = {
  kind: "indicator";
  indicatorId: string;          // "ema" | "rsi" | "atr"
  output: IndicatorOutputId;    // "value"
  // params hold the effective settings for the indicator instance
  params?: Record<string, number>;
};

export type NumberRef = {
  kind: "number";
  value: number;
};

export type LeftRef = PriceRef | IndicatorRef;
export type RightRef = IndicatorRef | NumberRef | null; // some operators don't require right

export type Rule = {
  left: LeftRef;
  operator: OperatorId;
  right: RightRef;
};

export type ValidationResult = { ok: boolean; errors: string[] };

export const isPrice = (v: any): v is PriceRef => v && v.kind === "price";
export const isIndicator = (v: any): v is IndicatorRef => v && v.kind === "indicator";
export const isNumberRef = (v: any): v is NumberRef => v && v.kind === "number";

export type RefKind = "price" | "indicator";

export type PriceField = "Close" | "Open" | "High" | "Low";

export type IndicatorId = "ATR" | "EMA" | "RSI";

export type Ref =
  | { kind: "price"; field: PriceField }
  | { kind: "indicator"; id: IndicatorId };

export type Operator =
  | "is above"
  | "is below"
  | "crosses above"
  | "crosses below"
  | "is rising"
  | "is falling"
  | "is equal to";

export type Rule = {
  leftRef: Ref;
  operator: Operator;
  rightRef?: Ref;
  rightNumber?: number;
};

export type Mode = "Guided" | "Expert";

export type Shape = "series" | "scalar" | "state";
export type Operator =
  | ">"
  | ">="
  | "<"
  | "<="
  | "=="
  | "crosses_above"
  | "crosses_below"
  | "rising"
  | "falling";

export type IndicatorMeta = {
  id: string;
  label: string;
  outputs: { shape: Shape; subseries?: string[] };
  supportedOperators: Operator[];
  params?: Record<string, any>;
  ui?: { displayKeyParam?: string };
};

export type Ref = { id: string; label?: string; shape?: Shape; baseId?: string; sub?: string };

export type Rule = {
  leftRef: Ref | null;
  operator: Operator | null;
  rightRef?: Ref | null;
  rightNumber?: number | null;
  // legacy (for migration only)
  left?: any;
  right?: any;
};
