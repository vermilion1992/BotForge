import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Strategy, UserTier, IndicatorConfig } from '@/types/botforge';

interface StepAdvancedSettingsProps {
  strategy: Strategy | null;
  filterIndicators: IndicatorConfig[];
  onUpdateFilters: (indicators: IndicatorConfig[]) => void;
  onNext: () => void;
  onPrevious?: () => void;
  userTier: UserTier;
}

export function StepAdvancedSettings({ 
  strategy, 
  filterIndicators, 
  onUpdateFilters, 
  onNext, 
  onPrevious, 
  userTier 
}: StepAdvancedSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Advanced Settings</h2>
        <p className="text-muted-foreground">
          Configure advanced parameters for your trading strategy
        </p>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Indicator Configuration</CardTitle>
          <CardDescription>
            Configure the technical indicators for your strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Advanced indicator configuration will be implemented here.
            This will integrate with your existing BotForge SOT.
          </p>
        </CardContent>
      </Card>

      <div className={`flex ${onPrevious ? 'justify-between' : 'justify-center'}`}>
        {onPrevious && (
          <Button onClick={onPrevious} variant="outline" size="lg" className="px-8">
            Previous
          </Button>
        )}
        <Button
          onClick={onNext}
          size="lg"
          className="px-8"
        >
          Continue to Risk Management
        </Button>
      </div>
    </div>
  );
}





