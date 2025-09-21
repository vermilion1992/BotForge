export interface WizardStatus {
  step1_marketType: boolean;
  step2_pairs: boolean;
  step3_strategy: boolean;
  step4_advanced: boolean;
  step5_risk: boolean;
  step6_backtest: boolean;
  step7_results: boolean;
}

export function getWizardStatus(): WizardStatus {
  if (typeof window === "undefined") {
  return {
    step1_marketType: false,
    step2_pairs: false,
    step3_strategy: false,
    step4_advanced: false,
    step5_risk: false,
    step6_backtest: false,
    step7_results: false,
  };
  }

  return {
    step1_marketType: localStorage.getItem("bf_market_type") !== null,
    step2_pairs: localStorage.getItem("bf_pairs") !== null,
    step3_strategy: localStorage.getItem("bf_strategy") !== null,
    step4_advanced: localStorage.getItem("bf_indicators") !== null,
    step5_risk: localStorage.getItem("bf_risk") !== null,
    step6_backtest: localStorage.getItem("bf_backtest") !== null,
    step7_results: localStorage.getItem("bf_results") !== null,
  };
}

export function markStepComplete(step: keyof WizardStatus): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(`bf_${step}`, "true");
}



