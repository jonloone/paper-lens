'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface Step4Data {
  rules: any[];
}

interface Step4QualityRulesProps {
  initialData?: Partial<Step4Data>;
  sql: string;
  onComplete: (data: Step4Data) => void;
  onBack: () => void;
}

export function Step4QualityRules({ initialData, sql, onComplete, onBack }: Step4QualityRulesProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quality Rules</h2>
        <p className="text-muted-foreground text-lg">
          Define data quality expectations for your product
        </p>
      </div>

      {/* Phase 2 Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Quality rules builder coming in Phase 2 (Week 9-10). For now, basic quality checks will be auto-generated based on your schema.
        </AlertDescription>
      </Alert>

      {/* Preview of Auto-Generated Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Generated Quality Checks</CardTitle>
          <CardDescription>
            These basic checks will be included in your data product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Row count validation (ensure data exists)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Schema validation (column types match contract)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Freshness check (data updated within SLA)</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to SQL
        </Button>
        <Button onClick={() => onComplete({ rules: [] })} size="lg" className="min-w-[200px]">
          Continue to Delivery
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
