"use client";
import { useMemo } from "react";
import { useBuilderStore } from "@/botforge/state/builderStore";
import { sortRulesAlpha } from "@/botforge/lib/rule_alpha";
import { summarizeSequence } from "@/botforge/lib/sequence";
import { ruleSentence } from "@/botforge/lib/friendly";

export default function EntrySequenceRow() {
  const { sequence, setSequence, rules } = useBuilderStore() as any;
  const sorted = useMemo(() => sortRulesAlpha(rules || []), [rules]);
  const summary = useMemo(() => {
    if (!sequence?.enabled) return "Sequence off";
    
    const letterOf = (id?: string) => {
      const idx = sorted.findIndex(r => r.id === id);
      return idx >= 0 ? sorted[idx]._alpha : "?";
    };
    
    const nameOf = (id?: string) => {
      const r = (rules || []).find((x: any) => x.id === id);
      if (!r) return "—";
      return ruleSentence({
        displayName: r.displayName,
        operator: r.operator,
        left: r.left,
        right: r.right
      });
    };
    
    return `Sequence on • ${letterOf(sequence.ruleAId)}: ${nameOf(sequence.ruleAId)} → ${letterOf(sequence.ruleBId)}: ${nameOf(sequence.ruleBId)} within ${sequence.withinBars} bars`;
  }, [sequence, rules, sorted]);

  const hasA = !!sequence?.ruleAId;
  const hasB = !!sequence?.ruleBId;
  const ready = hasA && hasB;

  return (
    <div className="mt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Sequence</div>
          <div className="text-xs text-muted-foreground">{summary}</div>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            className="h-3.5 w-3.5"
            checked={!!sequence?.enabled}
            onChange={(e)=> setSequence({ enabled: e.target.checked })}
          />
          Enable
        </label>
      </div>

      {sequence?.enabled && (
        <div className="mt-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Require:</span>
            <select
              className="border rounded px-2 py-1 text-xs"
              value={sequence.ruleAId || ""}
              onChange={(e)=> setSequence({ ruleAId: e.target.value || undefined })}
            >
              <option value="">— Rule A —</option>
              {sorted.map(r => (
                <option key={r.id} value={r.id}>{`${r._alpha}. ${r.displayName || r.label || r.name || r.id}`}</option>
              ))}
            </select>

            <span className="text-xs">→ within</span>
            <input
              type="number"
              min={1}
              step={1}
              className="border rounded px-2 py-1 w-16 text-xs"
              value={sequence.withinBars ?? 5}
              onChange={(e)=> setSequence({ withinBars: Math.max(1, Number(e.target.value || 1)) })}
            />
            <span className="text-xs">bars →</span>

            <select
              className="border rounded px-2 py-1 text-xs"
              value={sequence.ruleBId || ""}
              onChange={(e)=> setSequence({ ruleBId: e.target.value || undefined })}
            >
              <option value="">— Rule B —</option>
              {sorted.map(r => (
                <option key={r.id} value={r.id}>{`${r._alpha}. ${r.displayName || r.label || r.name || r.id}`}</option>
              ))}
            </select>
          </div>

          {!ready && (
            <div className="mt-2 text-xs text-red-600">Pick both Rule A and Rule B to enable Sequence.</div>
          )}
        </div>
      )}
    </div>
  );
}
