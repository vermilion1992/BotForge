"use client";
import React, { useMemo } from "react";
import type { Mode, Rule, Ref, Operator } from "../../lib/types";
import { friendlyOperators, supportsRightNumber, supportsRightRef } from "../../lib/operators";
import { priceFields, indicatorRegistry } from "../../data/indicatorRegistry";
import { coerceRule, validateRule } from "../../lib/validation";

type Props = { mode: Mode; value: Rule[]; onChange: (rules: Rule[]) => void };

function serializeRef(ref: Ref): string { return JSON.stringify(ref); }
function parseRef(value: string): Ref | undefined { try { return JSON.parse(value) as Ref; } catch { return undefined; } }

export default function EntryConditionsEditor({ mode, value, onChange }: Props) {
  // Option lists (stable hooks order)
  const leftOptions = useMemo(() => {
    const price = priceFields.map((f) => ({ label: `Price: ${f}`, ref: { kind: "price", field: f as any } as Ref }));
    const indicators = (Object.keys(indicatorRegistry) as Array<keyof typeof indicatorRegistry>).map((k) => {
      const it = indicatorRegistry[k];
      return { label: `Indicator: ${it.label}`, ref: { kind: "indicator", id: it.id } as Ref };
    });
    return [...price, ...indicators];
  }, []);

  function setRule(idx: number, next: Rule) {
    const coerced = coerceRule(next);
    const res = validateRule(coerced);
    if (res.ok) {
      const copy = value.slice();
      copy[idx] = coerced;
      onChange(copy);
    } else {
      // invalid: still update locally but ensure shape; don't throw
      const copy = value.slice();
      copy[idx] = coerced;
      onChange(copy);
    }
  }

  function addRule() {
    const d: Rule = { leftRef: { kind: "price", field: "Close" }, operator: "is above", rightNumber: 0 };
    onChange([...(value || []), d]);
  }

  function removeRule(i: number) {
    const copy = value.slice();
    copy.splice(i, 1);
    onChange(copy);
  }

  return (
    <div className="space-y-3">
      {(value || []).map((r, i) => {
        const rule = coerceRule(r);
        const op = rule.operator as Operator;

        // Right choices based on left
        const rightRefOptions = leftOptions; // allow price or indicator on right when supported

        return (
          <div key={i} className="grid grid-cols-[2fr,1fr,2fr,auto] gap-2 items-center">
            {/* Left Ref */}
            <select
              value={serializeRef(rule.leftRef)}
              onChange={(e) => {
                const nextRef = parseRef(e.target.value);
                if (nextRef) setRule(i, { ...rule, leftRef: nextRef });
              }}
            >
              {leftOptions.map((o) => (
                <option key={o.label} value={serializeRef(o.ref)}>{o.label}</option>
              ))}
            </select>

            {/* Operator */}
            <select
              value={op}
              onChange={(e) => {
                const nextOp = e.target.value as Operator;
                let next: Rule = { ...rule, operator: nextOp };
                // If switching invalidates right side, clear it
                if (!supportsRightRef(nextOp)) next = { ...next, rightRef: undefined };
                if (!supportsRightNumber(nextOp)) next = { ...next, rightNumber: undefined };
                setRule(i, next);
              }}
            >
              {friendlyOperators.map((fo) => (
                <option key={fo} value={fo}>{fo}</option>
              ))}
            </select>

            {/* Right side */}
            <div className="grid grid-cols-1 gap-2">
              {supportsRightRef(op) && (
                <select
                  value={rule.rightRef ? serializeRef(rule.rightRef) : ""}
                  onChange={(e) => {
                    const rr = e.target.value ? parseRef(e.target.value) : undefined;
                    setRule(i, { ...rule, rightRef: rr, rightNumber: undefined });
                  }}
                >
                  <option value="">Select source</option>
                  {rightRefOptions.map((o) => (
                    <option key={`r-${o.label}`} value={serializeRef(o.ref)}>{o.label}</option>
                  ))}
                </select>
              )}

              {supportsRightNumber(op) && (
                <input
                  type="number"
                  value={typeof rule.rightNumber === "number" ? rule.rightNumber : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRule(i, { ...rule, rightNumber: v === "" ? undefined : Number(v), rightRef: undefined });
                  }}
                  placeholder="Enter value"
                />
              )}
            </div>

            <button onClick={() => removeRule(i)} className="text-xs underline">
              Delete
            </button>
          </div>
        );
      })}

      <div>
        <button onClick={addRule} className="px-3 py-1 rounded border text-sm">Add condition</button>
      </div>
    </div>
  );
}


