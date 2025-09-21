import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BacktestParams } from '@/types/botforge';

interface StepTimeframeProps {
  backtestParams: BacktestParams;
  onUpdate: (params: BacktestParams) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export function StepTimeframe({ backtestParams, onUpdate, onNext, onPrevious }: StepTimeframeProps) {
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

  const handleUpdate = (field: keyof BacktestParams, value: string | number) => {
    onUpdate({ ...backtestParams, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Timeframe Settings</h2>
        <p className="text-muted-foreground">
          Configure the timeframe and backtest parameters
        </p>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Timeframe Configuration</CardTitle>
          <CardDescription>
            Select the chart timeframe for your strategy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chart Timeframe</Label>
            <div className="grid grid-cols-4 gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={backtestParams.timeframe === tf ? "default" : "outline"}
                  onClick={() => handleUpdate('timeframe', tf)}
                  className="w-full"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPeriod">Max Period (hours)</Label>
              <Input
                id="maxPeriod"
                type="number"
                value={backtestParams.maxPeriod}
                onChange={(e) => handleUpdate('maxPeriod', parseInt(e.target.value))}
                min="1"
                max="8760"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candleCount">Candle Count</Label>
              <Input
                id="candleCount"
                type="number"
                value={backtestParams.candleCount}
                onChange={(e) => handleUpdate('candleCount', parseInt(e.target.value))}
                min="100"
                max="10000"
              />
            </div>
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
          Continue to Backtest
        </Button>
      </div>
    </div>
  );
}