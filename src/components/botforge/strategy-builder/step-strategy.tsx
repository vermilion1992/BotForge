import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Strategy, UserTier } from '@/types/botforge';

interface StepStrategyProps {
  selected: Strategy | null;
  onSelect: (strategy: Strategy) => void;
  onNext: () => void;
  onPrevious?: () => void;
  userTier: UserTier;
}

export function StepStrategy({ selected, onSelect, onNext, onPrevious, userTier }: StepStrategyProps) {
  const strategies = [
    {
      id: 'ema_crossover_pro',
      name: 'EMA Crossover Pro',
      description: 'Advanced exponential moving average crossover strategy',
      category: 'Trend',
      tier: 'pro' as UserTier
    },
    {
      id: 'rsi_range_momentum',
      name: 'RSI Range Momentum',
      description: 'RSI-based momentum strategy for range-bound markets',
      category: 'Momentum',
      tier: 'basic' as UserTier
    },
    {
      id: 'breakout_dc',
      name: 'Donchian Breakout',
      description: 'Breakout strategy using Donchian channels',
      category: 'Breakout',
      tier: 'expert' as UserTier
    }
  ];

  const availableStrategies = strategies.filter(strategy => 
    strategy.tier === 'basic' || 
    (strategy.tier === 'pro' && (userTier === 'pro' || userTier === 'expert')) ||
    (strategy.tier === 'expert' && userTier === 'expert')
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Trading Strategy</h2>
        <p className="text-muted-foreground">
          Select the trading strategy that best fits your market approach
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableStrategies.map((strategy) => (
          <Card
            key={strategy.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selected?.id === strategy.id
                ? 'ring-2 ring-green-500 border-green-500 bg-green-500/10'
                : 'border-border hover:border-purple-500 hover:bg-purple-500/10'
            }`}
            onClick={() => onSelect(strategy)}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl">{strategy.name}</CardTitle>
                <Badge variant="outline">{strategy.tier.toUpperCase()}</Badge>
              </div>
              <CardDescription>
                {strategy.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{strategy.category}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className={`flex ${onPrevious ? 'justify-between' : 'justify-center'}`}>
        {onPrevious && (
          <Button onClick={onPrevious} variant="outline" size="lg" className="px-8">
            Previous
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!selected}
          size="lg"
          className="px-8"
        >
          Continue to Advanced Settings
        </Button>
      </div>
    </div>
  );
}