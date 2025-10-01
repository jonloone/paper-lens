'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Zap,
  Box,
  Code,
  Sliders,
  CheckCircle2,
  Activity
} from 'lucide-react';

const steps = [
  { id: 'define', name: 'Define', description: 'What are you building?' },
  { id: 'source', name: 'Source', description: 'Where is your data?' },
  { id: 'transform', name: 'Transform', description: 'Shape your data' },
  { id: 'deliver', name: 'Deliver', description: 'How to access' }
];

interface ProductType {
  id: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  name: string;
}

const productTypes: ProductType[] = [
  {
    id: 'source',
    icon: Zap,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    name: 'Foundation Product'
  },
  {
    id: 'entity',
    icon: Box,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    name: 'Domain Product'
  },
  {
    id: 'solution',
    icon: Sparkles,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    name: 'Solution Product'
  }
];

function TransformPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const contractParam = searchParams.get('contract');
  const [contract, setContract] = useState<any>(null);

  // Transform options
  const [transformMethod, setTransformMethod] = useState<'sql' | 'visual'>('sql');
  const [sqlQuery, setSqlQuery] = useState('');
  const [qualityRules, setQualityRules] = useState<string[]>([]);

  useEffect(() => {
    if (contractParam) {
      try {
        const parsed = JSON.parse(contractParam);
        setContract(parsed);

        // Set default SQL based on product type
        if (parsed.type === 'source') {
          setSqlQuery(`-- Foundation Product: Raw data with event mapping\nSELECT \n  id,\n  event_type,\n  timestamp,\n  payload\nFROM source_events\nWHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'`);
        } else if (parsed.type === 'entity') {
          setSqlQuery(`-- Domain Product: Unified entity from multiple sources\nSELECT \n  c.customer_id,\n  c.email,\n  c.name,\n  o.total_orders,\n  o.lifetime_value\nFROM customers c\nLEFT JOIN order_summary o ON c.customer_id = o.customer_id`);
        } else if (parsed.type === 'solution') {
          setSqlQuery(`-- Solution Product: Business metric calculation\nSELECT \n  customer_id,\n  CASE \n    WHEN days_since_last_order > 90 THEN 'high_risk'\n    WHEN days_since_last_order > 60 THEN 'medium_risk'\n    ELSE 'active'\n  END as churn_risk_level,\n  predicted_churn_probability\nFROM customer_metrics`);
        }
      } catch (error) {
        console.error('Failed to parse contract:', error);
      }
    }
  }, [contractParam]);

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No contract data found</p>
          <Button onClick={() => router.push('/build/new/define')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Define
          </Button>
        </div>
      </div>
    );
  }

  const selectedType = productTypes.find(t => t.id === contract.type);
  const Icon = selectedType?.icon;

  const handleContinue = () => {
    const updatedContract = {
      ...contract,
      transform: {
        method: transformMethod,
        sql: sqlQuery,
        qualityRules
      }
    };

    const params = new URLSearchParams({
      contract: JSON.stringify(updatedContract)
    });
    router.push(`/build/new/deliver?${params.toString()}`);
  };

  const addQualityRule = (rule: string) => {
    if (!qualityRules.includes(rule)) {
      setQualityRules([...qualityRules, rule]);
    }
  };

  const removeQualityRule = (rule: string) => {
    setQualityRules(qualityRules.filter(r => r !== rule));
  };

  const suggestedRules = {
    source: ['Not null on primary key', 'Valid timestamp format', 'Schema validation'],
    entity: ['Unique entity ID', 'No duplicate records', 'Referential integrity'],
    solution: ['Valid metric range', 'No null predictions', 'Confidence threshold > 0.7']
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <div className="font-semibold">Transform</div>
                <div className="text-sm text-muted-foreground">Step 3 of 4</div>
              </div>
            </div>
            {selectedType && (
              <Badge className="flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />}
                {selectedType.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-full h-2 rounded-full ${
                    idx <= 2 ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <div className="text-xs mt-2 text-center font-medium">
                    {step.name}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-muted mx-2" />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">

          <div>
            <h2 className="text-3xl font-bold">Transform your data</h2>
            <p className="text-muted-foreground text-lg mt-2">
              {contract.type === 'source' && 'Define event mapping and data structure'}
              {contract.type === 'entity' && 'Configure business logic and entity rules'}
              {contract.type === 'solution' && 'Build metrics and analytical logic'}
            </p>
          </div>

          {/* Transform Method Selector */}
          <Card className="p-6">
            <Label className="mb-3">Transformation Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  transformMethod === 'sql'
                    ? 'border-2 border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setTransformMethod('sql')}
              >
                <div className="flex items-center gap-3">
                  <Code className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">SQL Editor</div>
                    <div className="text-xs text-muted-foreground">Write custom queries</div>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all ${
                  transformMethod === 'visual'
                    ? 'border-2 border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setTransformMethod('visual')}
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">Visual Builder</div>
                    <div className="text-xs text-muted-foreground">Drag-and-drop interface</div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>

          {/* SQL Editor */}
          {transformMethod === 'sql' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">SQL Transformation</h3>
                <Button variant="outline" size="sm">
                  <Activity className="w-4 h-4 mr-2" />
                  Test Query
                </Button>
              </div>

              <Textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
                placeholder="SELECT * FROM ..."
              />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Syntax valid • Will run on Trino</span>
              </div>
            </Card>
          )}

          {/* Visual Builder (Placeholder) */}
          {transformMethod === 'visual' && (
            <Card className="p-12 text-center border-dashed">
              <Sliders className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Visual Builder Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag-and-drop transformation interface will be available in the next release
              </p>
              <Button onClick={() => setTransformMethod('sql')} variant="outline">
                Use SQL Editor Instead
              </Button>
            </Card>
          )}

          {/* Type-Specific Configuration */}
          {contract.type === 'source' && (
            <Card className="p-6 border-amber-200 bg-amber-50/30 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                Foundation Product Settings
              </h3>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">Event Type Mapping</div>
                    <div className="text-xs text-muted-foreground">Map source events to standard schema</div>
                  </div>
                  <Badge>Auto-detected</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">Incremental Loading</div>
                    <div className="text-xs text-muted-foreground">Only process new/changed records</div>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </div>
            </Card>
          )}

          {contract.type === 'entity' && (
            <Card className="p-6 border-blue-200 bg-blue-50/30 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600" />
                Domain Product Settings
              </h3>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">Entity Resolution</div>
                    <div className="text-xs text-muted-foreground">Merge records from multiple sources</div>
                  </div>
                  <Badge>customer_id</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">Slowly Changing Dimension</div>
                    <div className="text-xs text-muted-foreground">Track historical changes (Type 2 SCD)</div>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </div>
            </Card>
          )}

          {contract.type === 'solution' && (
            <Card className="p-6 border-green-200 bg-green-50/30 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                Solution Product Settings
              </h3>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">Business Logic</div>
                    <div className="text-xs text-muted-foreground">Custom metric calculations</div>
                  </div>
                  <Badge>3 rules defined</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">Materialization</div>
                    <div className="text-xs text-muted-foreground">Pre-compute for performance</div>
                  </div>
                  <Badge variant="outline">Daily refresh</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Quality Rules */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Data Quality Rules</h3>
            <p className="text-sm text-muted-foreground">
              Select validation rules to ensure data quality
            </p>

            <div className="space-y-2">
              {suggestedRules[contract.type as keyof typeof suggestedRules].map((rule) => {
                const isSelected = qualityRules.includes(rule);
                return (
                  <div
                    key={rule}
                    className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => isSelected ? removeQualityRule(rule) : addQualityRule(rule)}
                  >
                    <span className="text-sm">{rule}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                );
              })}
            </div>

            {qualityRules.length > 0 && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded text-sm">
                <div className="font-medium text-primary">
                  {qualityRules.length} rule{qualityRules.length > 1 ? 's' : ''} selected
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Great Expectations will validate these on every run
                </div>
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push(`/build/new/source?${new URLSearchParams({ contract: contractParam || '' })}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!sqlQuery.trim()}
            >
              Continue to Deliver
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function TransformPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TransformPageContent />
    </Suspense>
  );
}
