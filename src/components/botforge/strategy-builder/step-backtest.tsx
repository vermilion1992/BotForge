import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StepBacktestProps {
  onNext: () => void;
  onPrevious?: () => void;
  onRunBacktest: () => void;
}

export function StepBacktest({ onNext, onPrevious, onRunBacktest }: StepBacktestProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Backtest Your Strategy</h2>
        <p className="text-muted-foreground">
          Run a backtest to see how your strategy would have performed
        </p>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Backtest Configuration</CardTitle>
          <CardDescription>
            Review your strategy settings before running the backtest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Backtest functionality will be implemented here.
            </p>
            <Button onClick={onRunBacktest} size="lg">
              Run Backtest
            </Button>
          </div>
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
          Continue to Results
        </Button>
      </div>
    </div>
  );
}