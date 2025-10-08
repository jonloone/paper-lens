'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkflowProgressBar } from '@/components/build/WorkflowProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Database,
  Globe,
  Zap,
  Calendar
} from 'lucide-react';

const composableSteps = [
  { id: 'problem', name: 'Problem', description: 'Describe what you need' },
  { id: 'compose', name: 'Compose', description: 'Select & combine products' },
  { id: 'output', name: 'Output', description: 'Configure delivery' },
  { id: 'launch', name: 'Launch', description: 'Deploy & monitor' }
];

interface DeliveryMethod {
  id: string;
  icon: any;
  name: string;
  description: string;
  status: 'included' | 'optional' | 'coming-soon';
  cost?: string;
}

function OutputPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');

  const [selectedMethods, setSelectedMethods] = useState<string[]>(['sql']);
  const [schedule, setSchedule] = useState('daily');

  const deliveryMethods: DeliveryMethod[] = [
    {
      id: 'sql',
      icon: Database,
      name: 'SQL Table',
      description: 'Query-ready table in your data warehouse',
      status: 'included'
    },
    {
      id: 'api',
      icon: Globe,
      name: 'REST API',
      description: 'Real-time API endpoint for applications',
      status: 'optional',
      cost: '+$50/month'
    },
    {
      id: 'streaming',
      icon: Zap,
      name: 'Streaming',
      description: 'Live event stream for real-time processing',
      status: 'coming-soon'
    }
  ];

  if (!dataParam) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <p className="text-muted-foreground">No context data found. Please start from the beginning.</p>
        <Button
          onClick={() => router.push('/build/composable/problem')}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    );
  }

  const handleMethodToggle = (id: string) => {
    if (id === 'sql') return; // SQL is always selected
    setSelectedMethods(methods =>
      methods.includes(id)
        ? methods.filter(m => m !== id)
        : [...methods, id]
    );
  };

  const handleLaunch = () => {
    const params = new URLSearchParams({
      data: dataParam,
      methods: selectedMethods.join(','),
      schedule
    });
    router.push(`/build/composable/launch?${params.toString()}`);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6 border-green-200 bg-green-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <div className="font-semibold">Solution Product</div>
                <div className="text-sm text-muted-foreground">Step 3 of 4</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/build/composable/compose?data=${dataParam}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Compose
            </Button>
          </div>
          <WorkflowProgressBar
            steps={composableSteps}
            currentStep={2}
          />
        </Card>

        {/* Main Content */}
        <div className="space-y-8">

          <div className="space-y-3">
            <h2 className="text-3xl font-bold">Configure Output</h2>
            <p className="text-muted-foreground text-lg">
              Choose how your composed data product will be delivered
            </p>
          </div>

          {/* Delivery Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delivery Methods</h3>
            {deliveryMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Card
                  key={method.id}
                  className={`p-6 transition-all cursor-pointer ${
                    selectedMethods.includes(method.id)
                      ? 'border-2 border-green-500 bg-green-50/50'
                      : 'border-2 hover:border-border/60'
                  } ${method.status === 'coming-soon' && 'opacity-60 cursor-not-allowed'}`}
                  onClick={() => method.status !== 'coming-soon' && handleMethodToggle(method.id)}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedMethods.includes(method.id)}
                      disabled={method.id === 'sql' || method.status === 'coming-soon'}
                      className="w-5 h-5 mt-1"
                    />
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">{method.name}</div>
                        {method.status === 'included' && (
                          <Badge variant="secondary" className="text-xs">Included</Badge>
                        )}
                        {method.status === 'optional' && method.cost && (
                          <Badge variant="outline" className="text-xs">{method.cost}</Badge>
                        )}
                        {method.status === 'coming-soon' && (
                          <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Refresh Schedule
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['hourly', 'daily', 'weekly', 'real-time'].map((sched) => (
                <Card
                  key={sched}
                  className={`p-4 cursor-pointer transition-all ${
                    schedule === sched
                      ? 'border-2 border-green-500 bg-green-50/50'
                      : 'border-2 hover:border-border/60'
                  }`}
                  onClick={() => setSchedule(sched)}
                >
                  <div className="text-center">
                    <div className="font-semibold capitalize">{sched}</div>
                    {sched === 'real-time' && (
                      <Badge variant="outline" className="text-xs mt-2">Requires API</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push(`/build/composable/compose?data=${dataParam}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleLaunch}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Launch
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function ComposableOutputPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OutputPageContent />
    </Suspense>
  );
}
