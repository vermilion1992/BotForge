import { PRICE_LABEL, type RefTok } from "@/botforge/lib/friendly";

type MetaRule = {
  id: string;
  label?: string;
  when: {
    left: number | { ref: string };
    operator: ">"|">="|"<"|"<="|"=="|"crosses_above"|"crosses_below"|"rising"|"falling"|"within"|"outside";
    right: number | { ref: string } | 0;
  };
};

type MetaPreset = {
  id: string;
  indicators?: Array<{ id: string; alias?: string; params?: any }>;
  entry?: {
    group?: { mode: "ALL"|"ANY"|"K_OF_N"; k?: number };
    rules?: MetaRule[];
    sequence?: { enabled: boolean; ruleAId?: string; ruleBId?: string; withinBars: number };
  };
  riskDefaults?: any;
};

type RuleTile = {
  id: string;
  displayName: string;
  family: "Price"|"Momentum"|"Volatility"|"Volume";
  operator: MetaRule["when"]["operator"];
  left: RefTok;
  right: RefTok | NumTok;
};

function parseRef(ref: string, aliases: Record<string,string>): RefTok {
  if (!ref) return { type:"number", value: 0 };
  const [head, tail] = ref.split(".");
  if (head === "price") {
    const field = (tail || "close") as RefTok & any;
    return { type:"price", field };
  }
  const alias = head;
  const output = tail || "value";
  const prettyBase = aliases[alias] || alias.toUpperCase();
  return { type:"indicator", alias, output, pretty: prettyBase.replace(/([A-Z]+)(\d+)/, "$1($2)") };
}

function isCompleteToken(t:any) {
  if (!t) return false;
  if (t.type === "number") return true;
  if (t.type === "price") return !!t.field;
  if (t.type === "indicator") return !!t.alias;
  return false;
}

function familyFromRule(r: MetaRule): RuleTile["family"] {
  const op = r.when.operator;
  if (op === "rising" || op === "falling") return "Momentum";
  // crude but effective defaults:
  if (typeof r.when.left !== "number" && "ref" in r.when.left && r.when.left.ref.startsWith("donch")) return "Volatility";
  return "Price";
}

export function normalizePresetToStoreShape(preset: MetaPreset) {
  const indAliases: Record<string,string> = {};
  (preset.indicators || []).forEach(x => {
    if (x.alias) {
      // Nice label: EMA(21), RSI(14), Donchian(20), etc.
      const len = (x.params && x.params.length) ? `(${x.params.length})` : "";
      const base = x.id.toUpperCase().replace("_"," ");
      indAliases[x.alias] = `${base}${len}`;
    }
  });

  const rules: RuleTile[] = (preset.entry?.rules || []).map((r) => {
    const left = typeof r.when.left === "number"
      ? { type:"number", value: r.when.left } as RefTok
      : parseRef(r.when.left.ref, indAliases);

    const right = typeof r.when.right === "number"
      ? { type:"number", value: r.when.right } as RefTok
      : ("ref" in (r.when.right as any) ? parseRef((r.when.right as any).ref, indAliases)
         : { type:"number", value: 0 } as RefTok);

    return {
      id: r.id,
      displayName: r.label || r.id,
      family: familyFromRule(r),
      operator: r.when.operator,
      left,
      right
    };
  });

  // Filter and deduplicate rules
  const seen = new Set<string>();
  const cleaned = rules.filter(r => {
    if (!r || !r.id || seen.has(r.id)) return false;
    seen.add(r.id);
    // For rising/falling we only require LEFT. For others require LEFT and RIGHT.
    const needsRight = !["rising","falling"].includes(r.operator);
    const okLeft = isCompleteToken(r.left);
    const okRight = needsRight ? isCompleteToken(r.right) : true;
    return okLeft && okRight;
  });

  const sequence = preset.entry?.sequence
    ? {
        enabled: !!preset.entry.sequence.enabled,
        ruleAId: preset.entry.sequence.ruleAId,
        ruleBId: preset.entry.sequence.ruleBId,
        withinBars: Math.max(1, Number(preset.entry.sequence.withinBars || 3))
      }
    : { enabled: false, ruleAId: undefined, ruleBId: undefined, withinBars: 3 };

  const group = preset.entry?.group || { mode: "ALL" as const };

  return { rules: cleaned, sequence, group, riskDefaults: preset.riskDefaults || {} };
}
