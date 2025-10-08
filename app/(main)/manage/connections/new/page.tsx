'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Database,
  Workflow,
  GitBranch,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  HardDrive,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { IngestionMode } from '@/lib/types/source-connections';

interface ModeOption {
  value: IngestionMode;
  title: string;
  description: string;
  icon: React.ElementType;
  characteristics: {
    label: string;
    value: string;
    icon: React.ElementType;
  }[];
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  useCases: string[];
}

const modeOptions: ModeOption[] = [
  {
    value: 'federated',
    title: 'Federated Query',
    description: 'Query source databases directly through Trino without copying data',
    icon: Database,
    characteristics: [
      { label: 'Latency', value: 'Real-time', icon: Zap },
      { label: 'Storage Cost', value: '$0', icon: HardDrive },
      { label: 'Ops Complexity', value: 'Low', icon: Shield },
    ],
    tradeoffs: {
      pros: [
        'Zero storage costs',
        'Always fresh data',
        'Simple operational model',
      ],
      cons: [
        'Source DB load impact',
        'Query latency varies',
        'No historical snapshots',
      ],
    },
    useCases: [
      'Dimension tables <100GB',
      'Lookup/reference data',
      'Low query frequency (<100 qps)',
    ],
  },
  {
    value: 'lakehouse',
    title: 'Lakehouse Pipeline',
    description: 'Ingest data into Iceberg tables for high-performance analytics and time-travel',
    icon: Workflow,
    characteristics: [
      { label: 'Latency', value: '1-5 min', icon: TrendingUp },
      { label: 'Storage Cost', value: '$$', icon: HardDrive },
      { label: 'Ops Complexity', value: 'Medium', icon: Shield },
    ],
    tradeoffs: {
      pros: [
        'Fast analytical queries',
        'Isolates source DB load',
        'Time-travel & snapshots',
      ],
      cons: [
        'Storage costs',
        'CDC pipeline to maintain',
        'Minutes of latency',
      ],
    },
    useCases: [
      'Fact tables >100GB',
      'High query frequency (>100 qps)',
      'Time-series/event data',
    ],
  },
  {
    value: 'hybrid',
    title: 'Hybrid Approach',
    description: 'Combine federated and lakehouse modes for optimal performance',
    icon: GitBranch,
    characteristics: [
      { label: 'Flexibility', value: 'Maximum', icon: GitBranch },
      { label: 'Storage Cost', value: '$-$$', icon: HardDrive },
      { label: 'Ops Complexity', value: 'High', icon: AlertCircle },
    ],
    tradeoffs: {
      pros: [
        'Optimize per table',
        'Balance cost & performance',
        'Maximum flexibility',
      ],
      cons: [
        'More complexity',
        'Requires planning',
        'Two systems to manage',
      ],
    },
    useCases: [
      'Large databases (50+ tables)',
      'Mixed dim/fact patterns',
      'Cost optimization priority',
    ],
  },
];

export default function NewSourcePage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<IngestionMode>('lakehouse');

  const handleContinue = () => {
    if (selectedMode === 'federated') {
      router.push('/manage/sources/new/federated/select-connector');
    } else if (selectedMode === 'lakehouse') {
      router.push('/manage/sources/new/lakehouse');
    } else if (selectedMode === 'hybrid') {
      router.push('/manage/sources/new/hybrid');
    }
  };

  const selectedOption = modeOptions.find(opt => opt.value === selectedMode);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-medium">Add Source Connection</h1>
          <p className="text-sm text-muted-foreground">
            Choose how to ingest data from your source database into the lakehouse
          </p>
        </div>

        {/* Mode Selection */}
        <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as IngestionMode)}>
          <div className="grid gap-6 md:grid-cols-3">
            {modeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedMode === option.value;

              return (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div onClick={() => setSelectedMode(option.value)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">
                        <Label htmlFor={option.value} className="cursor-pointer">
                          {option.title}
                        </Label>
                      </CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Characteristics */}
                      <div className="space-y-2">
                        {option.characteristics.map((char) => {
                          const CharIcon = char.icon;
                          return (
                            <div key={char.label} className="flex items-center gap-2 text-sm">
                              <CharIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{char.label}:</span>
                              <span className="font-medium">{char.value}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Use Cases */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Common use cases:</p>
                        <ul className="space-y-1">
                          {option.useCases.map((useCase, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>

                  {/* Tradeoffs - Only show for selected card */}
                  {isSelected && (
                    <div>
                      <Separator />
                      <div className="px-6 pb-6 pt-4 bg-muted/30 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Pros */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600/80" />
                              <p className="text-xs font-medium text-muted-foreground">Advantages</p>
                            </div>
                            <ul className="space-y-1">
                              {option.tradeoffs.pros.map((item, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground/90 flex items-start gap-1.5">
                                  <span className="text-green-600">+</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Cons */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600/80" />
                              <p className="text-xs font-medium text-muted-foreground">Limitations</p>
                            </div>
                            <ul className="space-y-1">
                              {option.tradeoffs.cons.map((item, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground/90 flex items-start gap-1.5">
                                  <span className="text-amber-600">-</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </RadioGroup>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => router.push('/manage/sources')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            size="lg"
            className="gap-2"
          >
            Continue with {selectedOption?.title}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
