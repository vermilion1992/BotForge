"use client";
import { useMemo } from "react";
import { useBuilderStore, type RuleGroupMode } from "@/botforge/state/builderStore";
import { getRuleAlphaLabel } from "@/botforge/lib/ruleTitles";

export default function EntryLogicSelect() {
  const { 
    ruleGroupMode, 
    setRuleGroupMode, 
    sequence, 
    setSequence, 
    rules,
    advanced,
    setAdvanced,
    timeframe,
    setTimeframe
  } = useBuilderStore();

  const sortedRules = useMemo(() => {
    return (rules || []).sort((a, b) => a.id.localeCompare(b.id));
  }, [rules]);

  const hasEnoughRules = sortedRules.length >= 2;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <div className="mb-1 text-muted-foreground">Entry Logic</div>
          <select 
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={ruleGroupMode} 
            onChange={(e) => {
              const mode = e.target.value as RuleGroupMode;
              setRuleGroupMode(mode);
              // Also update the advanced.entry.logic for backward compatibility
              if (mode !== "SEQUENCE") {
                setAdvanced({...advanced, entry: {...advanced.entry, logic: mode as "AND" | "OR"}});
              }
            }}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
            <option value="SEQUENCE">SEQUENCE</option>
          </select>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-muted-foreground">Trade Direction</div>
          <select 
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={advanced.entry.tradeDirection}
            onChange={(e) => setAdvanced({...advanced, entry: {...advanced.entry, tradeDirection: e.target.value as any}})}
          >
            <option value="Both">Both</option>
            <option value="LongOnly">Long Only</option>
            <option value="ShortOnly">Short Only</option>
          </select>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-muted-foreground">Trading Timeframe</div>
          <select 
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            {["1m","5m","15m","1h","4h","1d"].map(tf=><option key={tf}>{tf}</option>)}
          </select>
        </label>
      </div>

      {ruleGroupMode === "SEQUENCE" && (
        <div className="mt-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Sequence Configuration</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">Require:</span>
            <select
              className="border-2 border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-w-0 flex-shrink"
              value={sequence?.ruleAId || ""}
              onChange={(e) => setSequence({ ruleAId: e.target.value || undefined })}
              disabled={!hasEnoughRules}
            >
              <option value="">— Rule A —</option>
              {sortedRules.map(rule => (
                <option key={rule.id} value={rule.id}>
                  {getRuleAlphaLabel(sortedRules, rule.id)}. {rule.left} {rule.operator} {rule.right}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-blue-400"></div>
              <span className="text-blue-600 dark:text-blue-400 font-medium text-xs whitespace-nowrap">within</span>
              <div className="w-4 h-0.5 bg-blue-400"></div>
            </div>
            <input
              type="number"
              min={1}
              step={1}
              className="border-2 border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1.5 w-16 text-sm bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center"
              value={sequence?.withinBars ?? 3}
              onChange={(e) => setSequence({ withinBars: Math.max(1, Number(e.target.value || 1)) })}
            />
            <span className="text-blue-600 dark:text-blue-400 font-medium text-xs whitespace-nowrap">bars</span>

            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-blue-400"></div>
              <span className="text-blue-600 dark:text-blue-400 font-medium text-xs whitespace-nowrap">then</span>
              <div className="w-4 h-0.5 bg-blue-400"></div>
            </div>
            <select
              className="border-2 border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-blue-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-w-0 flex-shrink"
              value={sequence?.ruleBId || ""}
              onChange={(e) => setSequence({ ruleBId: e.target.value || undefined })}
              disabled={!hasEnoughRules}
            >
              <option value="">— Rule B —</option>
              {sortedRules.map(rule => (
                <option key={rule.id} value={rule.id}>
                  {getRuleAlphaLabel(sortedRules, rule.id)}. {rule.left} {rule.operator} {rule.right}
                </option>
              ))}
            </select>
          </div>

          {!hasEnoughRules && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 text-amber-600 dark:text-amber-400">⚠️</div>
                <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                  Need at least 2 rules to use Sequence mode
                </span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
