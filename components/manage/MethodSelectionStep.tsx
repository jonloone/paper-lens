'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Zap,
  Clock,
  TrendingUp,
  FileUp,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  Activity,
  Shield,
} from 'lucide-react';
import type { IngestionMethod } from '@/lib/types/source-connections';

interface MethodSelectionStepProps {
  onMethodSelected: (method: IngestionMethod) => void;
  sourceCategory?: string;
  onBack?: () => void;
}

const methodOptions = [
  {
    value: 'federated' as IngestionMethod,
    label: 'Federated Query',
    description: 'Query data in place without replication',
    icon: Database,
    bestFor: ['Small reference tables', 'Low query volume', 'Always need latest data'],
    latency: 'Query-time only',
    complexity: 'Low',
    monthlyCost: '$',
    tools: ['Trino'],
    pros: ['No storage cost', 'Always up-to-date', 'No sync delay', 'Simple setup'],
    cons: ['Query performance depends on source', 'Network dependency', 'Higher query costs at scale'],
  },
  {
    value: 'incremental_query' as IngestionMethod,
    label: 'Incremental Sync',
    description: 'Timestamp-based periodic replication',
    icon: TrendingUp,
    bestFor: ['Medium tables with update timestamps', 'Hourly/daily freshness OK', 'Append-mostly data'],
    latency: 'Minutes to hours',
    complexity: 'Low',
    monthlyCost: '$$',
    tools: ['Spark', 'Airflow', 'Trino'],
    pros: ['Simple to configure', 'Works with any timestamp column', 'Predictable costs', 'Good performance'],
    cons: ['Requires timestamp column', 'No delete capture', 'Delayed updates'],
  },
  {
    value: 'batch_cdc' as IngestionMethod,
    label: 'Batch CDC',
    description: 'Scheduled change data capture',
    icon: Clock,
    bestFor: ['Large transactional tables', 'Need delete tracking', 'Hourly freshness acceptable'],
    latency: 'Minutes',
    complexity: 'Medium',
    monthlyCost: '$$$',
    tools: ['Debezium', 'Kafka', 'NiFi', 'Iceberg'],
    pros: ['Captures deletes', 'Lower cost than streaming', 'Full audit trail', 'Schema evolution'],
    cons: ['Higher latency than streaming', 'Requires CDC setup', 'Batch intervals'],
  },
  {
    value: 'streaming_cdc' as IngestionMethod,
    label: 'Streaming CDC',
    description: 'Real-time change data capture',
    icon: Zap,
    bestFor: ['Mission-critical tables', 'Real-time analytics', 'Event-driven workflows'],
    latency: '< 1 second',
    complexity: 'High',
    monthlyCost: '$$$$',
    tools: ['Debezium', 'Kafka', 'Flink', 'Iceberg'],
    pros: ['Real-time replication', 'Event-driven', 'Captures all changes', 'Low latency'],
    cons: ['Highest infrastructure cost', 'Complex setup', 'Requires Kafka expertise'],
  },
];

const fileUploadOption = {
  value: 'file_upload' as const,
  label: 'File Upload',
  description: 'Upload CSV/Parquet/JSON files directly',
  icon: FileUp,
  bestFor: ['One-time data loads', 'Small datasets', 'Ad-hoc analysis'],
  latency: 'Immediate',
  complexity: 'Very Low',
  monthlyCost: '$',
  tools: ['S3', 'Trino'],
};

type GuidedAnswer = {
  freshness?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  volume?: 'small' | 'medium' | 'large' | 'xlarge';
  criticality?: 'low' | 'medium' | 'high' | 'critical';
};

export function MethodSelectionStep({
  onMethodSelected,
  sourceCategory,
  onBack,
}: MethodSelectionStepProps) {
  const [activeTab, setActiveTab] = useState<'guided' | 'direct'>('guided');
  const [selectedMethod, setSelectedMethod] = useState<IngestionMethod | null>(null);
  const [guidedAnswers, setGuidedAnswers] = useState<GuidedAnswer>({});

  // Guided path: Get recommendations based on answers
  const getRecommendations = (): typeof methodOptions => {
    const { freshness, volume, criticality } = guidedAnswers;
    const scored = methodOptions.map(method => {
      let score = 0;

      // Freshness scoring
      if (freshness === 'realtime' && method.value === 'streaming_cdc') score += 10;
      if (freshness === 'hourly' && method.value === 'incremental_query') score += 8;
      if (freshness === 'hourly' && method.value === 'batch_cdc') score += 7;
      if (freshness === 'daily' && method.value === 'incremental_query') score += 9;
      if (freshness === 'daily' && method.value === 'batch_cdc') score += 8;
      if (freshness === 'weekly' && method.value === 'federated') score += 10;

      // Volume scoring
      if (volume === 'small' && method.value === 'federated') score += 10;
      if (volume === 'medium' && method.value === 'incremental_query') score += 9;
      if (volume === 'large' && method.value === 'batch_cdc') score += 8;
      if (volume === 'xlarge' && method.value === 'streaming_cdc') score += 7;

      // Criticality scoring
      if (criticality === 'critical' && method.value === 'streaming_cdc') score += 10;
      if (criticality === 'high' && method.value === 'batch_cdc') score += 9;
      if (criticality === 'medium' && method.value === 'incremental_query') score += 8;
      if (criticality === 'low' && method.value === 'federated') score += 10;

      return { ...method, score };
    });

    return scored.sort((a, b) => b.score - a.score);
  };

  const isGuidedComplete = guidedAnswers.freshness && guidedAnswers.volume && guidedAnswers.criticality;
  const recommendations = isGuidedComplete ? getRecommendations() : [];

  const handleMethodSelect = (method: IngestionMethod) => {
    setSelectedMethod(method);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      onMethodSelected(selectedMethod);
    } else if (activeTab === 'guided' && recommendations.length > 0) {
      // Auto-select top recommendation
      onMethodSelected(recommendations[0].value);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Ingestion Method</h2>
        <p className="text-muted-foreground">
          Choose how you want to access and replicate data from your source
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'guided' | 'direct')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guided" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Help Me Choose
          </TabsTrigger>
          <TabsTrigger value="direct" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            I Know My Method
          </TabsTrigger>
        </TabsList>

        {/* Guided Selection */}
        <TabsContent value="guided" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Answer a few questions
              </CardTitle>
              <CardDescription>
                We'll recommend the best ingestion method based on your requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question 1: Data Freshness */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  How fresh does your data need to be?
                </Label>
                <RadioGroup
                  value={guidedAnswers.freshness}
                  onValueChange={(v) => setGuidedAnswers({ ...guidedAnswers, freshness: v as any })}
                >
                  <div className="grid gap-2">
                    {[
                      { value: 'realtime', label: 'Real-time', desc: '< 1 second latency' },
                      { value: 'hourly', label: 'Hourly', desc: 'Updates every hour' },
                      { value: 'daily', label: 'Daily', desc: 'Updates once per day' },
                      { value: 'weekly', label: 'Weekly or less', desc: 'Rarely changes' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      >
                        <RadioGroupItem value={option.value} />
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Question 2: Data Volume */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  What's the expected data volume?
                </Label>
                <RadioGroup
                  value={guidedAnswers.volume}
                  onValueChange={(v) => setGuidedAnswers({ ...guidedAnswers, volume: v as any })}
                >
                  <div className="grid gap-2">
                    {[
                      { value: 'small', label: 'Small', desc: '< 1 GB, few thousand rows' },
                      { value: 'medium', label: 'Medium', desc: '1-100 GB, millions of rows' },
                      { value: 'large', label: 'Large', desc: '100 GB - 1 TB, billions of rows' },
                      { value: 'xlarge', label: 'Very Large', desc: '> 1 TB, massive scale' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      >
                        <RadioGroupItem value={option.value} />
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Question 3: Criticality */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  How critical is this data for operations?
                </Label>
                <RadioGroup
                  value={guidedAnswers.criticality}
                  onValueChange={(v) => setGuidedAnswers({ ...guidedAnswers, criticality: v as any })}
                >
                  <div className="grid gap-2">
                    {[
                      { value: 'critical', label: 'Mission Critical', desc: 'Powers core business operations' },
                      { value: 'high', label: 'High Priority', desc: 'Important for decision making' },
                      { value: 'medium', label: 'Medium Priority', desc: 'Used for analysis and reporting' },
                      { value: 'low', label: 'Low Priority', desc: 'Reference data, ad-hoc queries' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      >
                        <RadioGroupItem value={option.value} />
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {isGuidedComplete && recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recommended Methods
              </h3>
              <div className="grid gap-3">
                {recommendations.slice(0, 3).map((method, index) => {
                  const Icon = method.icon;
                  const isRecommended = index === 0;
                  return (
                    <Card
                      key={method.value}
                      className={`cursor-pointer transition-all ${
                        selectedMethod === method.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'hover:border-primary/50'
                      } ${isRecommended ? 'border-primary' : ''}`}
                      onClick={() => handleMethodSelect(method.value)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 mt-1" />
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {method.label}
                                {isRecommended && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                                    Best Match
                                  </span>
                                )}
                              </CardTitle>
                              <CardDescription>{method.description}</CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">Latency</div>
                            <div className="font-medium">{method.latency}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Complexity</div>
                            <div className="font-medium">{method.complexity}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Cost</div>
                            <div className="font-medium">{method.monthlyCost}</div>
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="text-muted-foreground mb-1">Best for:</div>
                          <div className="flex flex-wrap gap-1">
                            {method.bestFor.map((item) => (
                              <span key={item} className="px-2 py-1 bg-muted rounded text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Direct Selection */}
        <TabsContent value="direct" className="space-y-4 mt-6">
          <div className="space-y-3">
            {methodOptions.map((method) => {
              const Icon = method.icon;
              return (
                <Card
                  key={method.value}
                  className={`cursor-pointer transition-all ${
                    selectedMethod === method.value
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleMethodSelect(method.value)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-1" />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{method.label}</CardTitle>
                        <CardDescription>{method.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Latency</div>
                        <div className="font-medium">{method.latency}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Complexity</div>
                        <div className="font-medium">{method.complexity}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Cost
                        </div>
                        <div className="font-medium">{method.monthlyCost}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Tools</div>
                        <div className="font-medium text-xs">{method.tools.join(', ')}</div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-green-600 font-medium mb-1">Pros</div>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          {method.pros.map((pro) => (
                            <li key={pro} className="text-xs">{pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-amber-600 font-medium mb-1">Cons</div>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          {method.cons.map((con) => (
                            <li key={con} className="text-xs">{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Method Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Quick Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">Method</th>
                      <th className="text-left py-2 font-semibold">Latency</th>
                      <th className="text-left py-2 font-semibold">Complexity</th>
                      <th className="text-left py-2 font-semibold">Cost</th>
                      <th className="text-left py-2 font-semibold">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {methodOptions.map((method) => (
                      <tr key={method.value} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-medium">{method.label}</td>
                        <td className="py-2">{method.latency}</td>
                        <td className="py-2">{method.complexity}</td>
                        <td className="py-2">{method.monthlyCost}</td>
                        <td className="py-2 text-xs text-muted-foreground">{method.bestFor[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handleContinue}
          disabled={!selectedMethod && (!isGuidedComplete || recommendations.length === 0)}
          className="flex items-center gap-2"
        >
          Continue with {selectedMethod ? methodOptions.find(m => m.value === selectedMethod)?.label : 'Recommended Method'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
