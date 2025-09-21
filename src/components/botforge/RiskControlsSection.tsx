"use client";
import { useMemo, useState } from "react";
import { useBuilderStore } from "@/botforge/state/builderStore";
import { RISK_TILE_COPY, RISK_PRESETS, RiskTier, RiskVariant } from "@/botforge/content/risk_tiles";
import { summarizeFromDraft, applyDraftToAdvanced, summarizeRiskConfig } from "@/botforge/lib/risk";
import { validateRiskDraft, normalizeAllocations, sortAndSpaceTargets, disableTrailing, type Validation } from "@/botforge/lib/risk_validate";
import { BarChart3, Settings, Target } from "lucide-react";

/** Styling:
 * - Reuse same card look as Page-3 strategy tiles: rounded-2xl, border, subtle shadow, hover treatments.
 * - If a shared StrategyCard component exists, swap the outer <div> for it and keep the same inner content.
 */

export default function RiskControlsSection() {
  const { advanced, setAdvanced } = useBuilderStore() as any;

  const [expandedTier, setExpandedTier] = useState<RiskTier | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<RiskVariant>("balanced");
  const [draft, setDraft] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<RiskTier | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);

  const tiers: RiskTier[] = ["standard", "advanced", "expert"];

  // Validate draft whenever it changes
  useMemo(() => {
    if (draft && expandedTier) {
      const validationResult = validateRiskDraft(draft, expandedTier);
      setValidation(validationResult);
    } else {
      setValidation(null);
    }
  }, [draft, expandedTier]);

  const handleTileClick = (tier: RiskTier) => {
    if (selectedTier === tier) {
      // Deselect if already selected
      setSelectedTier(null);
      setExpandedTier(null);
      setDraft(null);
    } else {
      // Select and expand
      setSelectedTier(tier);
      setExpandedTier(tier);
      setSelectedVariant("balanced");
      setDraft(clonePreset(tier, "balanced"));
    }
  };

  const handleBack = () => {
    setExpandedTier(null);
    setDraft(null);
  };

  const handleSelectVariant = (variant: RiskVariant) => {
    setSelectedVariant(variant);
    setDraft(clonePreset(expandedTier!, variant));
  };

  const handleApply = () => {
    if (expandedTier && draft) {
      const merged = applyDraftToAdvanced(advanced, expandedTier, selectedVariant, draft);
      setAdvanced(merged);
      setExpandedTier(null);
      setDraft(null);
    }
  };

  const handleResetToDefault = () => {
    if (expandedTier) {
      setDraft(clonePreset(expandedTier, selectedVariant));
    }
  };

  // Validation and auto-fix handlers
  const handleNormalize = () => {
    if (draft && expandedTier) {
      const normalized = normalizeAllocations(draft);
      setDraft(normalized);
    }
  };

  const handleSortSpace = () => {
    if (draft && expandedTier) {
      const sorted = sortAndSpaceTargets(draft);
      setDraft(sorted);
    }
  };

  const handleDisableTrailing = () => {
    if (draft && expandedTier) {
      const disabled = disableTrailing(draft);
      setDraft(disabled);
    }
  };

  const handleFixAll = () => {
    if (draft && expandedTier) {
      let fixed = draft;
      fixed = normalizeAllocations(fixed);
      fixed = sortAndSpaceTargets(fixed);
      setDraft(fixed);
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Controls</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Exits only — does not change indicators or entry rules.</p>
      </div>
      
      <div>
        {expandedTier ? (
          <ExpandedTile
            tier={expandedTier}
            variant={selectedVariant}
            draft={draft}
            validation={validation}
            onBack={handleBack}
            onSelectVariant={handleSelectVariant}
            onApply={handleApply}
            onResetToDefault={handleResetToDefault}
            onNormalize={handleNormalize}
            onSortSpace={handleSortSpace}
            onDisableTrailing={handleDisableTrailing}
            onFixAll={handleFixAll}
            setDraft={setDraft}
          />
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <CompactTile
                key={tier}
                tier={tier}
                isSelected={selectedTier === tier}
                onClick={() => handleTileClick(tier)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompactTile({ tier, isSelected, onClick }: { tier: RiskTier; isSelected: boolean; onClick: () => void }) {
  const copy = RISK_TILE_COPY[tier];
  const summary = summarizeRiskConfig(tier, "balanced");

  const getIcon = (tier: RiskTier) => {
    const iconClass = "w-4 h-4 text-blue-600 dark:text-blue-400";
    switch (tier) {
      case "standard": return <BarChart3 className={iconClass} />;
      case "advanced": return <Settings className={iconClass} />;
      case "expert": return <Target className={iconClass} />;
      default: return <BarChart3 className={iconClass} />;
    }
  };

  return (
    <div className={`rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer ${
      isSelected 
        ? "ring-2 ring-blue-500/40 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600" 
        : "bg-white dark:bg-neutral-900/60 hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-600"
    }`}>
      <button onClick={onClick} className="w-full text-left p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              {getIcon(tier)}
            </div>
            <div>
              <div className="text-base font-semibold text-gray-900 dark:text-white">{copy.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{copy.blurb}</div>
            </div>
          </div>
          <div className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap">
            Learn More
          </div>
        </div>
      </button>
    </div>
  );
}

function ExpandedTile({ 
  tier, 
  variant, 
  draft, 
  validation,
  onBack, 
  onSelectVariant, 
  onApply, 
  onResetToDefault,
  onNormalize,
  onSortSpace,
  onDisableTrailing,
  onFixAll,
  setDraft 
}: { 
  tier: RiskTier; 
  variant: RiskVariant; 
  draft: any; 
  validation: Validation | null;
  onBack: () => void; 
  onSelectVariant: (v: RiskVariant) => void; 
  onApply: () => void; 
  onResetToDefault: () => void;
  onNormalize: () => void;
  onSortSpace: () => void;
  onDisableTrailing: () => void;
  onFixAll: () => void;
  setDraft: (d: any) => void; 
}) {
  const copy = RISK_TILE_COPY[tier];
  const variants: RiskVariant[] = ["conservative", "balanced", "aggressive"];
  const summary = useMemo(() => summarizeFromDraft(tier, variant, draft), [tier, variant, draft]);

  const getIcon = (tier: RiskTier) => {
    switch (tier) {
      case "standard": return "📊";
      case "advanced": return "⚙️";
      case "expert": return "🎯";
      default: return "📈";
    }
  };

  const getChipLabel = (tier: RiskTier, variant: RiskVariant) => {
    const baseLabel = RISK_PRESETS[tier][variant].label;
    // Remove prefixes like "Adv–" and "Expert–"
    return baseLabel.replace(/^(Adv–|Expert–)/, '');
  };

  return (
    <div className="rounded-2xl border bg-white dark:bg-neutral-900/60 shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg font-medium">
              {getIcon(tier)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{copy.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{copy.blurb}</p>
            </div>
          </div>
        </div>

        {/* 3 Preset Chips */}
        <div className="flex gap-2 mb-6">
          {variants.map(v => (
            <button
              key={v}
              onClick={() => onSelectVariant(v)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                variant === v 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            >
              {getChipLabel(tier, v)}
            </button>
          ))}
        </div>

        {/* Risk Management Description */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Risk Management Approach</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            This {tier} risk management strategy uses {tier === "standard" ? "fixed stop-loss and take-profit levels" : tier === "advanced" ? "multi-target scaling with trailing stops" : "ATR-based adaptive exits and advanced risk controls"} to protect your capital and maximize profit potential. The {variant} variant provides {variant === "conservative" ? "lower risk with tighter controls" : variant === "balanced" ? "moderate risk with balanced protection" : "higher risk tolerance with aggressive profit targets"}.
          </p>
          
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">How It Works</h5>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5 list-disc list-inside">
              {tier === "standard" ? (
                <>
                  <li>Sets fixed stop-loss and take-profit levels for each trade</li>
                  <li>Provides clear exit signals based on price targets</li>
                  <li>Uses simple percentage-based risk management</li>
                  <li>Offers straightforward profit and loss protection</li>
                </>
              ) : tier === "advanced" ? (
                <>
                  <li>Scales out positions across multiple profit targets</li>
                  <li>Moves stop to break-even after first target hits</li>
                  <li>Trails remaining position with percentage-based stops</li>
                  <li>Includes time-based exits to prevent stale positions</li>
                </>
              ) : (
                <>
                  <li>Uses ATR-based trailing stops for market-adaptive exits</li>
                  <li>Implements ATR safety stops for maximum risk control</li>
                  <li>Combines multi-target scaling with dynamic risk management</li>
                  <li>Provides sophisticated exit strategies for experienced traders</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Configuration Settings */}
        <div className="mb-6 p-4 border border-gray-200 dark:border-neutral-700 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Configuration</h4>
            <button
              onClick={onResetToDefault}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
            >
              Reset to Default
            </button>
          </div>
          
          {/* Current Settings Summary */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Current Settings</h5>
            <p className="text-sm text-gray-600 dark:text-gray-300">{summary}</p>
          </div>
          
          <Editors tier={tier} draft={draft} setDraft={setDraft} />
        </div>

        {/* Validation Messages */}
        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="mb-6 p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            {validation.errors.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Errors (must be fixed):</h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {validation.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {validation.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.suggestions.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Suggestions:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  {validation.suggestions.map((suggestion, i) => (
                    <li key={i}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Quick Fix Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {validation.canNormalize && (
                <button
                  onClick={onNormalize}
                  className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Normalize
                </button>
              )}
              {validation.canSortSpace && (
                <button
                  onClick={onSortSpace}
                  className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Sort & Space
                </button>
              )}
              {validation.canDisableTrailing && (
                <button
                  onClick={onDisableTrailing}
                  className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Disable Trailing
                </button>
              )}
              {(validation.canNormalize || validation.canSortSpace) && (
                <button
                  onClick={onFixAll}
                  className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  Fix All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-neutral-700">
          <button 
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Back to List
          </button>
          <button 
            onClick={onApply}
            disabled={validation?.errors.length ? validation.errors.length > 0 : false}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              validation?.errors.length && validation.errors.length > 0
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Select This Risk Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function Editors({ tier, draft, setDraft }: { tier: RiskTier; draft: any; setDraft: (d:any)=>void }) {
  const onNum = (path: string, v: number|undefined) => {
    const next = structuredClone(draft || {});
    deepSet(next, path, (isNum(v) ? Number(v) : undefined));
    setDraft(next);
  };
  const onToggle = (path: string, enabled: boolean, extra?: (next:any)=>void) => {
    const next = structuredClone(draft || {});
    deepSet(next, path, enabled);
    if (extra) extra(next);
    setDraft(next);
  };

  return (
    <div className="grid gap-3">
      { tier === "standard" && (
        <div className="grid grid-cols-3 gap-3">
          <NumField label="Stop Loss (%)" value={draft?.exits?.defaultSLPct} onChange={v=>onNum("exits.defaultSLPct", v)} />
          <NumField label="Take Profit (%)" value={draft?.exits?.defaultTPPct} onChange={v=>onNum("exits.defaultTPPct", v)} />
          <div></div>
        </div>
      )}

      { (tier === "advanced" || tier === "expert") && (
        <>
          <div className="grid grid-cols-3 gap-3">
            { [0,1,2].map(i => (
              <NumField key={`tp-${i}`} label={`TP${i+1} (%)`} value={draft?.exits?.multiTP?.targets?.[i]?.pct} onChange={(v)=>{
                const next = structuredClone(draft); ensureTargets(next);
                next.exits.multiTP.targets[i].pct = isNum(v) ? Number(v) : undefined; setDraft(next);
              }} />
            )) }
          </div>
          <div className="grid grid-cols-3 gap-3">
            { [0,1,2].map(i => (
              <NumField key={`alloc-${i}`} label={`TP${i+1} Allocation (%)`} value={draft?.exits?.multiTP?.targets?.[i]?.sizePct} onChange={(v)=>{
                const next = structuredClone(draft); ensureTargets(next);
                next.exits.multiTP.targets[i].sizePct = isNum(v) ? Number(v) : undefined; setDraft(next);
              }} />
            )) }
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumFieldWithToggle 
              label="Stop Loss (%)" 
              value={draft?.exits?.defaultSLPct} 
              onChange={v=>onNum("exits.defaultSLPct", v)} 
              checked={!!draft?.exits?.defaultSLPct}
              onToggle={(enabled)=>{
                const next = structuredClone(draft || {});
                if (enabled) {
                  // Disable ATR Stop when enabling Stop Loss
                  next.atrStop = { ...next.atrStop, enabled: false };
                  next.exits = { ...next.exits, defaultSLPct: 2 };
                } else {
                  next.exits = { ...next.exits, defaultSLPct: undefined };
                }
                setDraft(next);
              }}
            />
            <NumFieldWithToggle 
              label="Breakeven Offset (%)" 
              value={draft?.breakeven?.offsetPct} 
              onChange={v=>onNum("breakeven.offsetPct", v)} 
              checked={draft?.breakeven?.enabled !== false}
              onToggle={on=>onToggle("breakeven.enabled", on)}
              hint="Applied when TP1 fills"
            />
            <NumFieldWithToggle 
              label="Time Stop (bars)" 
              value={draft?.timeStop?.bars} 
              onChange={v=>onNum("timeStop.bars", v)} 
              checked={draft?.timeStop?.enabled !== false}
              onToggle={on=>onToggle("timeStop.enabled", on)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            { tier === "advanced" ? (
              <NumFieldWithToggle 
                label="Trailing % (starts after TP2)" 
                value={draft?.trailingTP?.valuePct} 
                onChange={v=>{ const n = structuredClone(draft); n.trailingTP ??= { enabled: true, mode: "percent", activateAfter: "tp2" }; n.trailingTP.mode = "percent"; n.trailingTP.valuePct = isNum(v) ? Number(v) : undefined; setDraft(n); }} 
                checked={(draft?.trailingTP?.enabled !== false) && draft?.trailingTP?.mode === "percent"}
                onToggle={on=>onToggle("trailingTP.enabled", on, (n)=>{
                  n.trailingTP ??= { enabled: on, mode: "percent", activateAfter: "tp2" };
                  n.trailingTP.mode = "percent";
                })}
              />
            ) : tier === "expert" ? (
              <NumFieldWithToggle 
                label="Trailing ATR × (starts after TP2)" 
                value={draft?.trailingTP?.atrMult} 
                onChange={v=>{ const n = structuredClone(draft); n.trailingTP ??= { enabled: true, mode: "atr", activateAfter: "tp2" }; n.trailingTP.mode = "atr"; n.trailingTP.atrMult = isNum(v) ? Number(v) : undefined; setDraft(n); }} 
                checked={(draft?.trailingTP?.enabled !== false) && draft?.trailingTP?.mode === "atr"}
                onToggle={on=>onToggle("trailingTP.enabled", on, (n)=>{
                  n.trailingTP ??= { enabled: on, mode: "atr", activateAfter: "tp2" };
                  n.trailingTP.mode = "atr";
                })}
              />
            ) : (
              <div></div>
            )}
            <NumFieldWithToggle 
              label="ATR Stop ×" 
              value={draft?.atrStop?.atrMult} 
              onChange={v=>onNum("atrStop.atrMult", v)} 
              checked={!!draft?.atrStop?.enabled}
              onToggle={(enabled)=>{
                const next = structuredClone(draft || {});
                if (enabled) {
                  // Disable Stop Loss when enabling ATR Stop
                  next.exits = { ...next.exits, defaultSLPct: undefined };
                  next.atrStop = { ...next.atrStop, enabled: true, atrMult: 2 };
                } else {
                  next.atrStop = { ...next.atrStop, enabled: false };
                }
                setDraft(next);
              }}
            />
            <div></div>
          </div>
        </>
      )}
    </div>
  );
}

function NumField({ label, value, onChange, hint, disabled }: { label: string; value?: number; onChange: (v:number|undefined)=>void; hint?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</div>
      <input
        type="number"
        step="0.1"
        disabled={disabled}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled 
            ? "border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            : "border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        }`}
        value={value ?? ""}
        onChange={(e)=> onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
      {hint ? <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</div> : null}
    </label>
  );
}

function NumFieldWithToggle({ label, value, onChange, hint, checked, onToggle }: { 
  label: string; 
  value?: number; 
  onChange: (v:number|undefined)=>void; 
  hint?: string; 
  checked?: boolean; 
  onToggle?: (b:boolean)=>void; 
}) {
  const disabled = checked === false;
  
  return (
    <label className="block">
      <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        <span>{label}</span>
        {onToggle && (
          <input 
            type="checkbox" 
            className="h-4 w-4" 
            checked={checked !== false} 
            onChange={(e)=>onToggle(e.target.checked)} 
          />
        )}
      </div>
      <input
        type="number"
        step="0.1"
        disabled={disabled}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled 
            ? "border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            : "border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        }`}
        value={value ?? ""}
        onChange={(e)=> onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
      {hint ? <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</div> : null}
    </label>
  );
}

function clonePreset(tier: RiskTier, variant: RiskVariant) {
  return structuredClone(RISK_PRESETS[tier][variant]);
}

function ensureTargets(draft: any) {
  draft.exits ??= {};
  draft.exits.multiTP ??= { enabled: true, targets: [] };
  draft.exits.multiTP.targets ??= [];
  for (let i=0;i<3;i++) draft.exits.multiTP.targets[i] ??= { pct: undefined, sizePct: undefined };
}

function deepSet(obj:any, path:string, val:any) {
  const parts = path.split(".");
  let cur = obj;
  for (let i=0;i<parts.length-1;i++){ cur[parts[i]] ??= {}; cur = cur[parts[i]]; }
  cur[parts[parts.length-1]] = val;
}

function isNum(v:any){ return typeof v==="number" && Number.isFinite(v); }
