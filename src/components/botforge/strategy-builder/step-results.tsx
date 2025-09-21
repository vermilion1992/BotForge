import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2 } from 'lucide-react';

interface StepResultsProps {
  backtestResult: any;
  onExport: (format: 'python' | 'json', botName: string) => void;
  onShare: (botName: string) => void;
  onPrevious?: () => void;
}

export function StepResults({ backtestResult, onExport, onShare, onPrevious }: StepResultsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Strategy Results</h2>
        <p className="text-muted-foreground">
          Your strategy is ready! Export or share your bot configuration
        </p>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Export Your Bot</CardTitle>
          <CardDescription>
            Download your bot configuration in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => onExport('json', 'my-bot')}
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
            >
              <Download className="w-6 h-6" />
              <span>Export as JSON</span>
            </Button>
            <Button
              onClick={() => onExport('python', 'my-bot')}
              variant="outline"
              className="h-20 flex flex-col items-center gap-2"
            >
              <Download className="w-6 h-6" />
              <span>Export as Python</span>
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <Button
              onClick={() => onShare('my-bot')}
              variant="secondary"
              className="w-full h-12 flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share to Community
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
          onClick={() => window.location.href = '/strategy-builder'}
          size="lg"
          className="px-8"
        >
          Create Another Bot
        </Button>
      </div>
    </div>
  );
}