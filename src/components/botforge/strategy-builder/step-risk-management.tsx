import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RiskManagement, UserTier, MarketType } from '@/types/botforge';

interface StepRiskManagementProps {
  riskManagement: RiskManagement;
  onUpdate: (risk: RiskManagement) => void;
  onNext: () => void;
  onPrevious?: () => void;
  userTier: UserTier;
  marketType: MarketType | null;
}

export function StepRiskManagement({ 
  riskManagement, 
  onUpdate, 
  onNext, 
  onPrevious, 
  userTier, 
  marketType 
}: StepRiskManagementProps) {
  const handleUpdate = (field: keyof RiskManagement, value: number) => {
    onUpdate({ ...riskManagement, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Risk Management</h2>
        <p className="text-muted-foreground">
          Configure risk parameters to protect your capital
        </p>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Risk Parameters</CardTitle>
          <CardDescription>
            Set your risk tolerance and position sizing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss (%)</Label>
              <Input
                id="stopLoss"
                type="number"
                value={riskManagement.stopLoss}
                onChange={(e) => handleUpdate('stopLoss', parseFloat(e.target.value))}
                step="0.1"
                min="0"
                max="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="takeProfit">Take Profit (%)</Label>
              <Input
                id="takeProfit"
                type="number"
                value={riskManagement.takeProfit}
                onChange={(e) => handleUpdate('takeProfit', parseFloat(e.target.value))}
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentPerTrade">Risk Per Trade (%)</Label>
              <Input
                id="percentPerTrade"
                type="number"
                value={riskManagement.percentPerTrade}
                onChange={(e) => handleUpdate('percentPerTrade', parseFloat(e.target.value))}
                step="0.1"
                min="0.1"
                max="10"
              />
            </div>
            {marketType === 'perps' && (
              <div className="space-y-2">
                <Label htmlFor="leverageMultiplier">Leverage</Label>
                <Input
                  id="leverageMultiplier"
                  type="number"
                  value={riskManagement.leverageMultiplier}
                  onChange={(e) => handleUpdate('leverageMultiplier', parseFloat(e.target.value))}
                  step="1"
                  min="1"
                  max="100"
                />
              </div>
            )}
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
          Continue to Timeframe
        </Button>
      </div>
    </div>
  );
}