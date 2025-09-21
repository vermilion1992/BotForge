import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PairTemplate, UserTier } from '@/types/botforge';

interface StepPairTemplateProps {
  selected: PairTemplate | null;
  onSelect: (template: PairTemplate) => void;
  onNext: () => void;
  onPrevious?: () => void;
  userTier: UserTier;
}

export function StepPairTemplate({ selected, onSelect, onNext, onPrevious, userTier }: StepPairTemplateProps) {
  const pairTemplates = [
    {
      id: 'major-pairs',
      name: 'Major Pairs',
      description: 'BTC, ETH, and other major cryptocurrencies',
      pairs: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
      tier: 'basic' as UserTier
    },
    {
      id: 'altcoins',
      name: 'Altcoins',
      description: 'Popular altcoins and DeFi tokens',
      pairs: ['SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT'],
      tier: 'pro' as UserTier
    },
    {
      id: 'custom',
      name: 'Custom Selection',
      description: 'Choose your own trading pairs',
      pairs: [],
      tier: 'expert' as UserTier
    }
  ];

  const availableTemplates = pairTemplates.filter(template => 
    template.tier === 'basic' || 
    (template.tier === 'pro' && (userTier === 'pro' || userTier === 'expert')) ||
    (template.tier === 'expert' && userTier === 'expert')
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Select Trading Pairs</h2>
        <p className="text-muted-foreground">
          Choose the cryptocurrency pairs for your trading strategy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selected?.id === template.id
                ? 'ring-2 ring-green-500 border-green-500 bg-green-500/10'
                : 'border-border hover:border-purple-500 hover:bg-purple-500/10'
            }`}
            onClick={() => onSelect(template)}
          >
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <Badge variant="outline">{template.tier.toUpperCase()}</Badge>
              </div>
              <CardDescription>
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {template.pairs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Included pairs:</p>
                  <div className="flex flex-wrap gap-2">
                    {template.pairs.map((pair) => (
                      <Badge key={pair} variant="secondary" className="text-xs">
                        {pair}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
          Continue to Strategy Selection
        </Button>
      </div>
    </div>
  );
}