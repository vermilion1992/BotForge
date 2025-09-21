export type UserTier = 'basic' | 'pro' | 'expert';

export type MarketType = 'spot' | 'perps';

export interface PairTemplate {
  id: string;
  name: string;
  description: string;
  pairs: string[];
  tier: UserTier;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: UserTier;
}

export interface IndicatorConfig {
  id: string;
  presetRef: string;
  params: Record<string, any>;
}

export interface RiskManagement {
  capitalAllocation: number;
  stopLoss: number;
  takeProfit: number;
  trailingTakeProfit: number;
  leverageMultiplier: number;
  percentPerTrade: number;
}

export interface BacktestParams {
  timeframe: string;
  maxPeriod: number;
  candleCount: number;
}

export interface WizardStep {
  step: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}