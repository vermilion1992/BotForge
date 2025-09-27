"use client";
import * as React from "react";

export function StrategyCard({
  label,
  categories,
  active,
  onClick,
}: { label: string; categories?: string[]; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 shadow-sm transition hover:shadow
        ${active ? "ring-2 ring-indigo-500" : ""}`}
    >
      <div className="font-semibold">{label}</div>
      {categories?.length ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {categories.map((c) => (
            <span key={c} className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] opacity-75 dark:bg-white/10">
              {c}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

export function IndicatorCard({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="mb-2 font-semibold">{title}</div>
      {children}
    </div>
  );
}

export function PresetChip({
  tier,
  intent,
  risk,
  active,
  onClick,
}: { tier: "Normal" | "Hero"; intent: string; risk: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-left text-sm transition hover:shadow
        ${active ? "ring-2 ring-indigo-500" : ""}`}
    >
      <div className="text-[10px] uppercase opacity-60">{tier}</div>
      <div className="text-sm font-medium">{intent}</div>
      <div className="text-[10px] opacity-60">{risk}</div>
    </button>
  );
}





