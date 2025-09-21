import { friendlyOperators, supportsRightNumber, supportsRightRef } from "./operators";

// Type is intentionally permissive to avoid breaking strict builds while wiring UI.
export function coerceRule(rule: any): any {
  if (!rule || typeof rule !== "object") return rule;

  const out: any = { ...rule };
  const op: string = out.operator;

  // Normalize right-hand side based on operator needs
  if (supportsRightNumber(op)) {
    if (typeof out.right !== "number") {
      const raw = out.right;
      const num = Number(typeof raw === "string" ? raw.trim() : (raw?.value ?? raw));
      out.right = Number.isFinite(num) ? num : 0;
    }
  } else if (supportsRightRef(op)) {
    const r = out.right;
    if (!r || typeof r !== "object") {
      // default to a price field ref
      out.right = { type: "price", field: "close" };
    } else {
      // normalize price field casing
      if (r.type === "price" && typeof r.field === "string") {
        out.right = { type: "price", field: r.field.toLowerCase() };
      }
    }
  } else {
    // operators that don't require a right-hand side
    if ("right" in out) delete out.right;
  }

  return out;
}

export function validateRule(rule: any): { ok: boolean; reason?: string } {
  if (!rule || typeof rule !== "object") return { ok: false, reason: "Missing rule." };

  const op: string = rule.operator;
  if (!friendlyOperators.includes(op)) {
    return { ok: false, reason: "Unknown operator." };
  }

  if (supportsRightNumber(op)) {
    if (typeof rule.right !== "number" || Number.isNaN(rule.right)) {
      return { ok: false, reason: "Right side must be a number." };
    }
  }

  if (supportsRightRef(op)) {
    if (!rule.right || typeof rule.right !== "object") {
      return { ok: false, reason: "Right side must be a reference." };
    }
    if (rule.right.type === "price" && typeof rule.right.field !== "string") {
      return { ok: false, reason: "Price reference must include a field." };
    }
  }

  return { ok: true };
}
