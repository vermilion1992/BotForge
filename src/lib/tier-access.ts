export type UserTier = 'basic' | 'pro' | 'expert';

export function getTierAccess(tier: UserTier) {
  return {
    canUseAdvancedIndicators: tier === 'pro' || tier === 'expert',
    canUseCustomPairs: tier === 'expert',
    canUseHighLeverage: tier === 'expert',
    maxIndicators: tier === 'basic' ? 3 : tier === 'pro' ? 5 : 10,
    canExportPython: tier === 'pro' || tier === 'expert',
    canShareToCommunity: tier === 'expert',
  };
}




