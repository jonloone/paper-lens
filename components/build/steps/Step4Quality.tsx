'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QualityRulesBuilder } from '@/components/build/QualityRulesBuilder';
import { ArrowRight, ArrowLeft, Shield, Clock } from 'lucide-react';

export interface QualityRule {
  id: string;
  field: string;
  type: string;
  condition: string;
  value: string;
  severity: 'error' | 'warning';
}

export interface SLAConfig {
  freshnessTarget: string;
  freshnessUnit: 'minutes' | 'hours' | 'days';
  completenessThreshold: number;
  accuracyThreshold: number;
}

export interface Step4Data {
  qualityRules: QualityRule[];
  slaConfig: SLAConfig;
}

interface Step4QualityProps {
  initialData?: Partial<Step4Data>;
  schema: Array<{ name: string; type: string }>; // From Step 3
  onComplete: (data: Step4Data) => void;
  onBack: () => void;
}

export function Step4Quality({ initialData, schema, onComplete, onBack }: Step4QualityProps) {
  const [qualityRules, setQualityRules] = useState<QualityRule[]>(
    initialData?.qualityRules || []
  );
  const [slaConfig, setSLAConfig] = useState<SLAConfig>(
    initialData?.slaConfig || {
      freshnessTarget: '24',
      freshnessUnit: 'hours',
      completenessThreshold: 95,
      accuracyThreshold: 99
    }
  );

  const handleContinue = () => {
    onComplete({ qualityRules, slaConfig });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          How do you want to check data quality?
        </h2>
        <p className="text-muted-foreground text-lg">
          Set up automatic checks to make sure your data stays accurate and up-to-date
        </p>
      </div>

      {/* SLA Configuration */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Data Freshness & Quality Targets</h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Freshness */}
          <div className="space-y-2">
            <Label>How fresh should the data be?</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={slaConfig.freshnessTarget}
                onChange={(e) => setSLAConfig({
                  ...slaConfig,
                  freshnessTarget: e.target.value
                })}
                className="w-24"
              />
              <Select
                value={slaConfig.freshnessUnit}
                onValueChange={(value: any) => setSLAConfig({
                  ...slaConfig,
                  freshnessUnit: value
                })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Data older than this will trigger an alert
            </p>
          </div>

          {/* Completeness */}
          <div className="space-y-2">
            <Label>How complete should the data be?</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={slaConfig.completenessThreshold}
                onChange={(e) => setSLAConfig({
                  ...slaConfig,
                  completenessThreshold: Number(e.target.value)
                })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum % of rows with all required data filled in
            </p>
          </div>

          {/* Accuracy */}
          <div className="space-y-2">
            <Label>What's the acceptable quality level?</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={slaConfig.accuracyThreshold}
                onChange={(e) => setSLAConfig({
                  ...slaConfig,
                  accuracyThreshold: Number(e.target.value)
                })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum % of data that must pass validation checks
            </p>
          </div>
        </div>
      </Card>

      {/* Quality Rules */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Validation Checks</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add specific checks to validate your data (optional)
            </p>
          </div>
        </div>
        <QualityRulesBuilder
          rules={qualityRules}
          onChange={setQualityRules}
          availableFields={schema.map(f => f.name)}
        />
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Columns
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="min-w-[200px]"
        >
          Next: Deploy
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
