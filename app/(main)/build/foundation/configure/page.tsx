'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkflowProgressBar } from '@/components/build/WorkflowProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Clock,
  Shield,
  TrendingUp
} from 'lucide-react';

const foundationSteps = [
  { id: 'connect', name: 'Connect', description: 'Connect to source' },
  { id: 'discover', name: 'Discover', description: 'Auto-discover schema' },
  { id: 'configure', name: 'Configure', description: 'Set quality rules' },
  { id: 'deploy', name: 'Deploy', description: 'Deploy to catalog' }
];

function ConfigurePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const connection = searchParams.get('connection');

  const [refreshSchedule, setRefreshSchedule] = useState('daily');
  const [selectedRules, setSelectedRules] = useState<string[]>(['freshness', 'completeness']);

  const qualityRules = [
    { id: 'freshness', name: 'Freshness Check', description: 'Alert if data is >24h old', recommended: true },
    { id: 'completeness', name: 'Completeness Check', description: 'Ensure no critical nulls', recommended: true },
    { id: 'uniqueness', name: 'Uniqueness Check', description: 'Validate primary key constraints', recommended: true },
    { id: 'schema', name: 'Schema Validation', description: 'Detect schema drift', recommended: false }
  ];

  const handleRuleToggle = (ruleId: string) => {
    setSelectedRules(rules =>
      rules.includes(ruleId)
        ? rules.filter(r => r !== ruleId)
        : [...rules, ruleId]
    );
  };

  const handleDeploy = () => {
    const params = new URLSearchParams({
      type: type || '',
      connection: connection || '',
      schedule: refreshSchedule,
      rules: selectedRules.join(',')
    });
    router.push(`/build/foundation/deploy?${params.toString()}`);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <div className="font-semibold">Foundation Product</div>
                <div className="text-sm text-muted-foreground">Step 3 of 4</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/build/foundation/discover?type=${type}&connection=${connection}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Button>
          </div>
          <WorkflowProgressBar
            steps={foundationSteps}
            currentStep={2}
          />
        </Card>

        {/* Main Content */}
        <div className="space-y-8">

          <div className="space-y-3">
            <h2 className="text-3xl font-bold">Configure Quality & Refresh</h2>
            <p className="text-muted-foreground text-lg">
              Set up quality rules and refresh schedule
            </p>
          </div>

          {/* Refresh Schedule */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Refresh Schedule
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['hourly', 'daily', 'weekly', 'manual'].map((schedule) => (
                <Card
                  key={schedule}
                  className={`p-4 cursor-pointer transition-all ${
                    refreshSchedule === schedule
                      ? 'border-2 border-amber-500 bg-amber-50/50'
                      : 'border-2 hover:border-border/60'
                  }`}
                  onClick={() => setRefreshSchedule(schedule)}
                >
                  <div className="text-center">
                    <div className="font-semibold capitalize">{schedule}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Quality Rules */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Quality Rules
            </Label>
            <div className="space-y-3">
              {qualityRules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedRules.includes(rule.id)
                      ? 'border-2 border-amber-500 bg-amber-50/50'
                      : 'border-2 hover:border-border/60'
                  }`}
                  onClick={() => handleRuleToggle(rule.id)}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedRules.includes(rule.id)}
                      className="w-5 h-5 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{rule.name}</div>
                        {rule.recommended && (
                          <Badge variant="secondary" className="text-xs">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Summary Card */}
          <Card className="p-6 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <div className="font-semibold">Configuration Summary</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Data will refresh <strong>{refreshSchedule}</strong></p>
                  <p>• {selectedRules.length} quality rules enabled</p>
                  <p>• Alerts will be sent to #data-quality channel</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push(`/build/foundation/discover?type=${type}&connection=${connection}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleDeploy}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Deploy to Catalog
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function FoundationConfigurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfigurePageContent />
    </Suspense>
  );
}
