"use client";
import * as React from "react";

export function KPI({ label, value, sub, badge="Good" }:{
  label: string; value: string; sub?: string; badge?: "Good"|"Neutral"|"Poor";
}) {
  const badgeColor = badge==="Good" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    : badge==="Neutral" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white/80 dark:bg-neutral-900/60">
      <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>{badge}</div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label}</div>
      <div className="text-2xl font-bold mt-1 text-black dark:text-white">{value}</div>
      {sub ? <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{sub}</div> : null}
    </div>
  );
}

export function Collapsible({ title, children, defaultOpen=false }:{
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-2xl border shadow-sm bg-white/80 dark:bg-neutral-900/60">
      <button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
        <span className="text-lg font-semibold text-black dark:text-white">{title}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

