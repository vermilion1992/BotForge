"use client";
import Link from "next/link";
const steps = [
  { id:"market", n:1, href:"/strategy-builder/step1", label:"Market Type & Trading Pairs" },
  { id:"strategy", n:2, href:"/strategy-builder/step3", label:"Strategy & Indicators" },
  { id:"advanced", n:3, href:"/strategy-builder/step4", label:"Advanced Settings" },
  { id:"risk", n:4, href:"/strategy-builder/step5", label:"Risk Management" },
  { id:"backtest", n:5, href:"/strategy-builder/step7", label:"Strategy Review & Backtest" },
  { id:"results", n:6, href:"/strategy-builder/step8", label:"Results" }
];
export default function Stepper({ current }:{ current: "market"|"strategy"|"advanced"|"risk"|"backtest"|"results" }) {
  const currentIndex = steps.findIndex(s => s.id === current);
  
  return (
    <nav className="mb-6 grid gap-3 md:grid-cols-4">
      {steps.map((s, index) => {
        const isActive = s.id === current;
        const isCompleted = index < currentIndex;
        const isUpcoming = index > currentIndex;
        
        return (
          <Link 
            key={s.id} 
            href={s.href} 
            className={`group relative overflow-hidden rounded-2xl border p-4 text-sm shadow-sm transition-all duration-300 hover:shadow-md ${
              isActive 
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg shadow-blue-500/25" 
                : isCompleted
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 text-black dark:text-white border-emerald-200 dark:border-emerald-700 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30"
                : "bg-white dark:bg-neutral-800 text-black dark:text-white border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700"
            }`}
          >
            {/* Background pattern for active state */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            )}
            
            <div className="relative flex items-center gap-3">
              {/* Step number circle */}
              <div className={`relative grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-all duration-300 ${
                isActive 
                  ? "bg-white/20 text-white border-2 border-white/30" 
                  : isCompleted
                  ? "bg-emerald-500 text-white border-2 border-emerald-500"
                  : "bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 border-2 border-gray-200 dark:border-neutral-600 group-hover:bg-gray-200 dark:group-hover:bg-neutral-600"
              }`}>
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              
              {/* Step label */}
              <div className="flex-1">
                <span className={`font-semibold transition-colors duration-300 ${
                  isActive 
                    ? "text-white" 
                    : isCompleted
                    ? "text-black dark:text-white"
                    : "text-black dark:text-white group-hover:text-gray-900 dark:group-hover:text-white"
                }`}>
                  {s.label}
                </span>
                <div className={`text-xs mt-0.5 transition-colors duration-300 ${
                  isActive 
                    ? "text-blue-100" 
                    : isCompleted
                    ? "text-gray-600 dark:text-gray-400"
                    : "text-gray-500 dark:text-gray-500"
                }`}>
                  Step {s.n}
                </div>
              </div>
            </div>
            
            {/* Progress indicator line */}
            {index < steps.length - 1 && (
              <div className={`absolute top-1/2 -right-1.5 h-0.5 w-3 -translate-y-1/2 transition-colors duration-300 ${
                isCompleted 
                  ? "bg-emerald-400" 
                  : isActive
                  ? "bg-blue-400"
                  : "bg-gray-200 dark:bg-neutral-600"
              }`}></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}