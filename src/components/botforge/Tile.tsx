"use client";
import { cn } from "./cn";
export function Tile({ active, onClick, title, desc, icon }: { active?:boolean; onClick?:()=>void; title:string; desc?:string; icon?:React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full rounded-2xl border p-4 text-left shadow-sm transition hover:shadow bg-white/80 dark:bg-neutral-900/60 hover:bg-white dark:hover:bg-neutral-900",
      active ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
    )}>
      <div className="flex items-center gap-3">
        {icon ? <div className="grid h-10 w-10 place-items-center rounded-xl border">{icon}</div> : null}
        <div>
          <div className="font-semibold text-black dark:text-white">{title}</div>
          {desc ? <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">{desc}</div> : null}
        </div>
      </div>
    </button>
  );
}
