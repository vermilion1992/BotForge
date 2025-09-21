import type { Operator } from "./types";

// Operators shown to the user in dropdowns
export const friendlyOperators: Operator[] = [
  "is above",
  "is below",
  "is equal to",
  "is not equal to",
  "crosses above",
  "crosses below",
];

// Whether an operator allows a *reference* on the right side (price field or indicator ref)
export function supportsRightRef(op: Operator): boolean {
  return (
    op === "is above" ||
    op === "is below" ||
    op === "is equal to" ||
    op === "is not equal to" ||
    op === "crosses above" ||
    op === "crosses below"
  );
}

// Whether an operator allows a *number* on the right side
export function supportsRightNumber(op: Operator): boolean {
  return (
    op === "is above" ||
    op === "is below" ||
    op === "is equal to" ||
    op === "is not equal to"
  );
}
