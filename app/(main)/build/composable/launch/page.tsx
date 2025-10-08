'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkflowProgressBar } from '@/components/build/WorkflowProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  Database,
  FileText,
  Play,
  Rocket,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const composableSteps = [
  { id: 'problem', name: 'Problem', description: 'Describe what you need' },
  { id: 'compose', name: 'Compose', description: 'Select & combine products' },
  { id: 'output', name: 'Output', description: 'Configure delivery' },
  { id: 'launch', name: 'Launch', description: 'Deploy & monitor' }
];

function LaunchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'deploying' | 'complete'>('deploying');

  const deploymentSteps = [
    { label: 'Validating composition', done: progress >= 20 },
    { label: 'Generating combined schema', done: progress >= 40 },
    { label: 'Configuring data pipelines', done: progress >= 60 },
    { label: 'Deploying to development', done: progress >= 80 },
    { label: 'Setting up monitoring', done: progress >= 100 }
  ];

  useEffect(() => {
    if (status === 'deploying') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStatus('complete'), 500);
            return 100;
          }
          return prev + 20;
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [status]);

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

  let context;
  try {
    context = JSON.parse(decodeURIComponent(dataParam));
  } catch (error) {
    context = { business_need: 'Composed Data Product' };
  }

  const productName = context.business_need
    ?.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50) || 'composed_product';

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6 border-green-200 bg-green-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <div className="font-semibold">Solution Product</div>
                <div className="text-sm text-muted-foreground">Step 4 of 4</div>
              </div>
            </div>
          </div>
          <WorkflowProgressBar
            steps={composableSteps}
            currentStep={3}
          />
        </Card>

        {/* Main Content */}
        {status === 'deploying' && (
          <div className="space-y-12 animate-in fade-in duration-500">

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 animate-pulse mb-4">
                <Sparkles className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold">Deploying Your Product</h2>
              <p className="text-muted-foreground text-lg">
                This usually takes 2-3 minutes • You can safely close this page
              </p>
            </div>

            <Card className="p-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="space-y-4">
                  {deploymentSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        step.done ? "bg-green-500" : "bg-muted"
                      )}>
                        {step.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className={cn(
                        "text-sm",
                        step.done ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-border space-y-2">
                  <div className="text-sm text-muted-foreground">Accessible via:</div>
                  <div className="space-y-1">
                    <div className="text-sm font-mono bg-muted/50 px-3 py-2 rounded">
                      SQL: iceberg.dev.{productName}
                    </div>
                    <div className="text-sm font-mono bg-muted/50 px-3 py-2 rounded">
                      Docs: Auto-generated in DataHub
                    </div>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        )}

        {status === 'complete' && (
          <div className="space-y-12 animate-in fade-in duration-500">

            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold">Product Deployed!</h2>
              <p className="text-muted-foreground text-lg">
                <span className="text-foreground font-semibold font-mono">{productName}</span> is ready in development
              </p>
            </div>

            <Card className="p-10 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Next steps:</h3>
                <div className="grid gap-4">
                  <Button size="lg" className="w-full justify-start gap-3 bg-green-600 hover:bg-green-700">
                    <Play className="w-5 h-5" />
                    View in Airflow - Monitor pipeline runs
                  </Button>
                  <Button variant="outline" size="lg" className="w-full justify-start gap-3">
                    <Database className="w-5 h-5" />
                    Test with Query - Try SQL queries
                  </Button>
                  <Button variant="outline" size="lg" className="w-full justify-start gap-3">
                    <FileText className="w-5 h-5" />
                    View Documentation - See DataHub catalog
                  </Button>
                  <Button variant="outline" size="lg" className="w-full justify-start gap-3">
                    <Rocket className="w-5 h-5" />
                    Promote to Prod - When ready
                  </Button>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => router.push('/build/composable/problem')}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Another
              </Button>
              <Button variant="outline" onClick={() => router.push('/build')}>
                Back to Build Hub
              </Button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function ComposableLaunchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LaunchPageContent />
    </Suspense>
  );
}
