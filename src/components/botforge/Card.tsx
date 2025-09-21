"use client";
import * as React from "react";
export function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const hasCustomBg = className?.includes('bg-');
  const defaultBg = hasCustomBg ? '' : 'bg-white/80 dark:bg-neutral-900/60';
  return <div className={`rounded-2xl border p-4 shadow-sm ${defaultBg} ${className || ''}`} style={style}>{children}</div>;
}
export function CardTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="text-lg font-semibold text-black dark:text-white">{children}</div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
export function Small({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 dark:text-gray-400">{children}</p>;
}

