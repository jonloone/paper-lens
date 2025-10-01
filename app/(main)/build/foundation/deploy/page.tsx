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
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

const foundationSteps = [
  { id: 'connect', name: 'Connect', description: 'Connect to source' },
  { id: 'discover', name: 'Discover', description: 'Auto-discover schema' },
  { id: 'configure', name: 'Configure', description: 'Set quality rules' },
  { id: 'deploy', name: 'Deploy', description: 'Deploy to catalog' }
];

function DeployPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'deploying' | 'complete'>('deploying');

  const deploymentSteps = [
    { label: 'Creating catalog entries', done: progress >= 25 },
    { label: 'Registering tables in DataHub', done: progress >= 50 },
    { label: 'Configuring quality rules', done: progress >= 75 },
    { label: 'Setting up refresh schedule', done: progress >= 100 }
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
          return prev + 25;
        });
      }, 700);

      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <div className="font-semibold">Foundation Product</div>
                <div className="text-sm text-muted-foreground">Step 4 of 4</div>
              </div>
            </div>
          </div>
          <WorkflowProgressBar
            steps={foundationSteps}
            currentStep={3}
          />
        </Card>

        {/* Main Content */}
        {status === 'deploying' && (
          <div className="space-y-12 animate-in fade-in duration-500">

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 animate-pulse mb-4">
                <Sparkles className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-4xl font-bold">Deploying to Catalog</h2>
              <p className="text-muted-foreground text-lg">
                Publishing metadata and configuring monitoring
              </p>
            </div>

            <Card className="p-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Deployment Progress</span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="space-y-4">
                  {deploymentSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        step.done ? "bg-amber-500" : "bg-muted"
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
              </div>
            </Card>

          </div>
        )}

        {status === 'complete' && (
          <div className="space-y-12 animate-in fade-in duration-500">

            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/10 mb-4">
                <CheckCircle2 className="w-12 h-12 text-amber-600" />
              </div>
              <h2 className="text-4xl font-bold">Data Source Connected!</h2>
              <p className="text-muted-foreground text-lg">
                Your data is now discoverable in the catalog
              </p>
            </div>

            <Card className="p-10 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Next steps:</h3>
                <div className="grid gap-4">
                  <Button size="lg" className="w-full justify-start gap-3 bg-amber-600 hover:bg-amber-700">
                    <Database className="w-5 h-5" />
                    View in DataHub Catalog
                  </Button>
                  <Button variant="outline" size="lg" className="w-full justify-start gap-3">
                    <Play className="w-5 h-5" />
                    Monitor Data Quality
                  </Button>
                  <Button variant="outline" size="lg" className="w-full justify-start gap-3">
                    <FileText className="w-5 h-5" />
                    View Documentation
                  </Button>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => router.push('/build/foundation/connect')}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Connect Another Source
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

export default function FoundationDeployPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DeployPageContent />
    </Suspense>
  );
}
