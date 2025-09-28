"use client";
import Link from "next/link";
import { useBuilderStore } from "@/botforge/state/builderStore";
import { validateStep, canNavigateToStep } from "@/botforge/lib/stepValidation";

const steps = [
  { id:"market", n:1, href:"/strategy-builder/step1", label:"Market & Training Pairs" },
  { id:"strategy", n:2, href:"/strategy-builder/step3", label:"Strategy & Indicators" },
  { id:"advanced", n:3, href:"/strategy-builder/step4", label:"Advanced Settings" },
  { id:"backtest", n:4, href:"/strategy-builder/step7", label:"Review & Backtest" },
  { id:"results", n:5, href:"/strategy-builder/step8", label:"Results & Analysis" }
];

export default function Stepper({ current }:{ current: "market"|"strategy"|"advanced"|"backtest"|"results" }) {
  const currentIndex = steps.findIndex(s => s.id === current);
  
  // Get state for validation
  const state = useBuilderStore((state) => ({
    marketType: state.marketType,
    pairs: state.pairs,
    indicatorSelections: state.indicatorSelections,
    selectedPreset: state.selectedPreset,
    rules: state.rules,
    advanced: state.advanced,
    timeframe: state.timeframe,
    backtestCompleted: state.backtestCompleted
  }));
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-2 shadow-sm">
        {steps.map((step, index) => {
          const isActive = step.id === current;
          const validation = validateStep(step.id, state, state.backtestCompleted);
          // Show as completed if user has progressed past this step
          // Special case: Results step only complete if backtest actually ran
          const isCompleted = step.id === "results" ? validation.isComplete : index < currentIndex;
          const isNext = index === currentIndex + 1;
          const navigation = canNavigateToStep(step.id, current, state);
          const canNavigate = navigation.allowed;
          
          const stepContent = (
            <>
              {/* Step indicator */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isCompleted
                  ? "bg-emerald-600 text-white"
                  : canNavigate && isNext
                  ? "bg-gray-300 dark:bg-neutral-600 text-gray-700 dark:text-gray-300"
                  : "bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-gray-500"
              }`}>
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : !canNavigate && !isActive ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.n
                )}
              </div>
              
              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  isActive
                    ? "text-blue-900 dark:text-blue-100"
                    : isCompleted
                    ? "text-emerald-700 dark:text-emerald-300"
                    : canNavigate && isNext
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-400"
                }`}>
                  {step.label}
                </div>
                <div className={`text-xs ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : !canNavigate && !isActive
                    ? "text-gray-500 dark:text-gray-500"
                    : "text-gray-500 dark:text-gray-500"
                }`}>
                  {isActive ? "Current" : 
                   isCompleted ? "Complete" : 
                   !canNavigate && !isActive ? "Complete previous steps" :
                   `Step ${step.n}`}
                </div>
              </div>
            </>
          );

          return (
            <div key={step.id} className="flex items-center flex-1">
              {canNavigate ? (
                <Link 
                  href={step.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 w-full ${
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" 
                      : isCompleted
                      ? "hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                      : isNext
                      ? "hover:bg-gray-50 dark:hover:bg-neutral-700/50"
                      : "opacity-60 hover:opacity-80"
                  }`}
                >
                  {stepContent}
                </Link>
              ) : (
                <div 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full cursor-not-allowed ${
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" 
                      : "opacity-40"
                  }`}
                  title={navigation.reason || "Complete the current step to continue"}
                >
                  {stepContent}
                </div>
              )}
              
              {/* Separator */}
              {index < steps.length - 1 && (
                <div className="flex-shrink-0 px-2">
                  <svg className="w-4 h-4 text-gray-300 dark:text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}