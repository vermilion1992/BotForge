"use client";
import { cn } from "./cn";
export function Tile({ active, onClick, title, desc, icon }: { active?:boolean; onClick?:()=>void; title:string; desc?:string; icon?:React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full rounded-2xl p-4 text-left shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-600",
      active 
        ? "border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20" 
        : "border bg-white dark:bg-neutral-900/60"
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
