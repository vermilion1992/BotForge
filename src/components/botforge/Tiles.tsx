"use client";
import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

export const Tile = forwardRef<HTMLButtonElement, {
  title: string; desc?: string; icon?: LucideIcon; active?: boolean; onClick?: () => void;
}>(({ title, desc, icon: Icon, active, onClick }, ref) => (
  <button ref={ref} onClick={onClick}
    className={`w-full text-left rounded-2xl border p-4 shadow-sm transition hover:shadow ${active?"ring-2 ring-indigo-500":""}`}>
    <div className="flex items-center gap-3">
      {Icon ? <Icon className="opacity-80" size={20}/> : null}
      <div className="font-semibold">{title}</div>
    </div>
    {desc ? <p className="mt-1 text-sm opacity-70">{desc}</p> : null}
  </button>
));
Tile.displayName = "Tile";

export function Chip({ label, active, onClick }:{label:string; active?:boolean; onClick?:()=>void}) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm border transition hover:shadow ${active?"bg-black/90 text-white dark:bg-white dark:text-black":""}`}>
      {label}
    </button>
  );
}