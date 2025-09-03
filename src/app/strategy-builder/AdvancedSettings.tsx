"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * AdvancedSettings
 * - Loads /botforge_combined_config.json
 * - Reads selected strategy key from localStorage ("bf_selected_strategy")
 * - Renders only the indicator panels & entry tiles allowed for that strategy
 * - Provides a GENERIC panel renderer so every indicator in the config works (20/20 coverage)
 * - Builds operator-only rule boxes (LHS • Operator • RHS) with ruleCap guard
 * - Seeds default rules from config on first load
 */

// ---------- Small generic field renderers (works for all indicators) ----------
type FieldSpec = {
  type: "int" | "float" | "enum";
  default: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  tooltip?: string;
};

// A simple controlled input set that will handle int/float/enum fields
function FieldInput({
  id,
  spec,
  value,
  onChange,
}: {
  id: string;
  spec: FieldSpec;
  value: any;
  onChange: (v: any) => void;
}) {
  if (spec.type === "enum" && spec.options?.length) {
    return (
      <select
        title={spec.tooltip || ""}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "6px", width: "100%" }}
      >
        {spec.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  const inputType = "number";
  const step =
    spec.step ??
    (spec.type === "float" ? 0.1 : 1); // sensible default if not provided

  return (
    <input
      title={spec.tooltip || ""}
      type={inputType}
      step={step}
      min={spec.min !== undefined ? spec.min : undefined}
      max={spec.max !== undefined ? spec.max : undefined}
      value={Number(value)}
      onChange={(e) => onChange(spec.type === "float" ? parseFloat(e.target.value) : parseInt(e.target.value))}
      style={{ padding: "6px", width: "100%" }}
    />
  );
}

// Generic panel that renders any indicator by the fields spec inside the config
function GenericIndicatorPanel({
  panelKey,
  fieldsSpec,
  onChange,
}: {
  panelKey: string;
  fieldsSpec: Record<string, FieldSpec>;
  onChange?: (k: string, v: any) => void;
}) {
  const [local, setLocal] = useState<Record<string, any>>(
    Object.fromEntries(
      Object.entries(fieldsSpec || {}).map(([k, spec]) => [k, (spec as FieldSpec).default])
    )
  );

  useEffect(() => {
    // reset if spec changes
    setLocal(
      Object.fromEntries(
        Object.entries(fieldsSpec || {}).map(([k, spec]) => [k, (spec as FieldSpec).default])
      )
    );
  }, [panelKey, fieldsSpec]);

  const update = (k: string, v: any) => {
    setLocal((prev) => {
      const next = { ...prev, [k]: v };
      onChange?.(k, v);
      return next;
    });
  };

  return (
    <div style={{ border: "1px solid var(--border, #333)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{panelKey.toUpperCase()} Settings</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {Object.entries(fieldsSpec || {}).map(([fieldKey, spec]) => (
          <label key={fieldKey} style={{ display: "grid", gap: 6 }}>
            <span title={(spec as FieldSpec).tooltip || ""}>{fieldKey}</span>
            <FieldInput
              id={`${panelKey}.${fieldKey}`}
              spec={spec as FieldSpec}
              value={local[fieldKey]}
              onChange={(v) => update(fieldKey, v)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

// If you have custom fancy components for some indicators, register them here
const PANEL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // Example:
  // ema: EmaSettingsPanel,
  // macd: MacdSettingsPanel,
  // rsi: RsiSettingsPanel,
  // If not provided, we fall back to <GenericIndicatorPanel />
};

// ---------- Main component ----------
export default function AdvancedSettings() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load JSON config once
  useEffect(() => {
    fetch("/botforge_combined_config.json")
      .then((r) => r.json())
      .then((j) => {
        setConfig(j);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Selected strategy key from Page 3; fallback to EMA Crossover Pro
  const selectedKey =
    typeof window !== "undefined"
      ? localStorage.getItem("bf_selected_strategy") || "ema_crossover_pro"
      : "ema_crossover_pro";

  const strat = config?.strategies?.[selectedKey];

  // State: rules, combiner, direction, inverse
  const [rules, setRules] = useState<any[]>([]);
  const [combiner, setCombiner] = useState<string>("AND");
  const [direction, setDirection] = useState<string>("BOTH");
  const [inverse, setInverse] = useState<boolean>(false);

  // Seed default rules on first render for a strategy
  useEffect(() => {
    if (!config || !strat) return;
    setRules((prev) => {
      if (Array.isArray(prev) && prev.length > 0) return prev;
      const cap = config.global?.ruleCap ?? 5;
      const seeds = (strat.defaultSeeds || []).slice(0, cap);
      return seeds.map((r: any, i: number) => ({ ...r, _id: `seed_${i}` }));
    });
    setCombiner("AND");
    setDirection("BOTH");
    setInverse(false);
  }, [config, selectedKey]);

  const allowedPanels: string[] = useMemo(
    () => Object.keys(strat?.indicatorSettings || {}),
    [strat]
  );

  const allowedTiles: string[] = useMemo(() => strat?.tiles || [], [strat]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!config || !strat)
    return (
      <div style={{ padding: 24 }}>
        Could not load configuration or strategy. Selected key: {selectedKey}
      </div>
    );

  // Helpers
  const operatorOptions =
    config.global?.operators?.map((o: any) => ({ id: o.id, label: o.label, tooltip: o.tooltip })) || [];

  const getOperandsForTile = (tileId: string): string[] => {
    return strat?.operands?.[tileId] || [];
  };

  const addTileRule = (tileId: string) => {
    const cap = config.global?.ruleCap ?? 5;
    if (rules.length >= cap) return;
    // Basic default rule per tile
    const ops = getOperandsForTile(tileId);
    let newRule: any;
    if (ops.length >= 2) {
      newRule = { lhs: ops[0], op: "is_above", rhs: ops[1], _tile: tileId, _id: `r_${Date.now()}` };
    } else if (ops.length === 1) {
      newRule = { lhs: ops[0], op: "is_true", _tile: tileId, _id: `r_${Date.now()}` };
    } else {
      return;
    }

    // prevent duplicate identical rules
    const sig = JSON.stringify({ lhs: newRule.lhs, op: newRule.op, rhs: newRule.rhs, tile: tileId });
    const exists = rules.some((r) => JSON.stringify({ lhs: r.lhs, op: r.op, rhs: r.rhs, tile: r._tile }) === sig);
    if (exists) return;

    setRules((prev) => [...prev, newRule]);
  };

  const removeTileRules = (tileId: string) => {
    setRules((prev) => prev.filter((r) => r._tile !== tileId));
  };

  const toggleTile = (tileId: string) => {
    const on = rules.some((r) => r._tile === tileId);
    if (on) removeTileRules(tileId);
    else addTileRule(tileId);
  };

  const updateRule = (id: string, patch: Partial<any>) => {
    setRules((prev) => prev.map((r) => (r._id === id ? { ...r, ...patch } : r)));
  };

  const resetToDefaults = () => {
    const cap = config.global?.ruleCap ?? 5;
    const seeds = (strat.defaultSeeds || []).slice(0, cap);
    setRules(seeds.map((r: any, i: number) => ({ ...r, _id: `seed_${i}` })));
    setCombiner("AND");
    setDirection("BOTH");
    setInverse(false);
  };

  return (
    <div style={{ padding: "24px", display: "grid", gap: 24 }}>
      {/* Heading / Blurb */}
      <div>
        <h1 style={{ margin: 0 }}>Advanced Settings</h1>
        <div style={{ opacity: 0.75, marginTop: 6 }}>{strat.entryBlurb || "Configure strategy-specific parameters."}</div>
      </div>

      {/* Indicator Settings */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Indicator Settings</h2>
          <button onClick={resetToDefaults} style={{ padding: "6px 10px" }}>Return to Default</button>
        </div>

        {allowedPanels.length === 0 && (
          <div style={{ opacity: 0.7 }}>No indicator settings for this strategy.</div>
        )}

        {allowedPanels.map((panelKey) => {
          const Custom = PANEL_COMPONENTS[panelKey];
          const fields = strat.indicatorSettings?.[panelKey]?.fields || {};
          if (Custom) return <Custom key={panelKey} defaults={fields} />;
          return <GenericIndicatorPanel key={panelKey} panelKey={panelKey} fieldsSpec={fields} />;
        })}
      </section>

      {/* Entry Conditions */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Entry Conditions</h2>
          <button onClick={resetToDefaults} style={{ padding: "6px 10px" }}>Return to Default</button>
        </div>

        {/* Logic header */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <label>
            Combiner{" "}
            <select value={combiner} onChange={(e) => setCombiner(e.target.value)} style={{ padding: 6 }}>
              {(config.global?.combiner?.options || []).map((o: any) => (
                <option key={o.id} value={o.id} title={o.tooltip || ""}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Direction{" "}
            <select value={direction} onChange={(e) => setDirection(e.target.value)} style={{ padding: 6 }}>
              {(config.global?.direction?.options || []).map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label title={config.global?.direction?.inverseTooltip || ""}>
            <input type="checkbox" checked={inverse} onChange={(e) => setInverse(e.target.checked)} /> Inverse signals
          </label>
        </div>

        {/* Tiles */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {allowedTiles.map((tileId) => {
            const active = rules.some((r) => r._tile === tileId);
            return (
              <button
                key={tileId}
                onClick={() => toggleTile(tileId)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #444",
                  background: active ? "rgba(100, 200, 255, 0.15)" : "transparent",
                }}
                title={`Click to ${active ? "remove" : "add"} ${tileId} condition`}
              >
                {tileId.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Rules list */}
        <div style={{ display: "grid", gap: 10 }}>
          {rules.map((r) => {
            // Which tile this rule belongs to (for operand scoping)
            const opsForTile = getOperandsForTile(r._tile || allowedTiles[0]) || [];
            return (
              <div
                key={r._id}
                style={{
                  border: "1px solid var(--border, #333)",
                  borderRadius: 10,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 180px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                {/* LHS */}
                <select
                  value={r.lhs || ""}
                  onChange={(e) => updateRule(r._id, { lhs: e.target.value })}
                  style={{ padding: 6 }}
                >
                  {opsForTile.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={r.op || ""}
                  onChange={(e) => updateRule(r._id, { op: e.target.value })}
                  style={{ padding: 6 }}
                  title={operatorOptions.find((o: any) => o.id === r.op)?.tooltip || ""}
                >
                  {operatorOptions.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {/* RHS (optional for is_true) */}
                {r.op === "is_true" ? (
                  <div style={{ opacity: 0.7, fontStyle: "italic" }}>—</div>
                ) : (
                  <select
                    value={r.rhs ?? ""}
                    onChange={(e) => updateRule(r._id, { rhs: e.target.value })}
                    style={{ padding: 6 }}
                  >
                    {/* RHS can be a series or a simple named level if present in ops */}
                    <option value="">(choose)</option>
                    {opsForTile.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                    {/* Common numeric constants */}
                    <option value="50">50</option>
                    <option value="0">0</option>
                  </select>
                )}

                <button onClick={() => setRules((prev) => prev.filter((x) => x._id !== r._id))} style={{ padding: "6px 10px" }}>
                  Remove
                </button>

                {/* Preview */}
                <div style={{ gridColumn: "1 / -1", opacity: 0.75, fontSize: 12 }}>
                  Preview: {String(r.lhs)} {String(operatorOptions.find((o: any) => o.id === r.op)?.label || r.op)}{" "}
                  {r.op === "is_true" ? "(true/false)" : String(r.rhs)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

