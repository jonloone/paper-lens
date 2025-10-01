'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkflowProgressBar } from '@/components/build/WorkflowProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Database,
  Table,
  Key,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

const foundationSteps = [
  { id: 'connect', name: 'Connect', description: 'Connect to source' },
  { id: 'discover', name: 'Discover', description: 'Auto-discover schema' },
  { id: 'configure', name: 'Configure', description: 'Set quality rules' },
  { id: 'deploy', name: 'Deploy', description: 'Deploy to catalog' }
];

function DiscoverPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const connection = searchParams.get('connection');

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'scanning' | 'complete'>('scanning');

  const discoverySteps = [
    { label: 'Connecting to source', done: progress >= 20 },
    { label: 'Scanning schema structure', done: progress >= 40 },
    { label: 'Profiling data samples', done: progress >= 60 },
    { label: 'Detecting relationships', done: progress >= 80 },
    { label: 'Generating metadata', done: progress >= 100 }
  ];

  useEffect(() => {
    if (status === 'scanning') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStatus('complete'), 500);
            return 100;
          }
          return prev + 20;
        });
      }, 600);

      return () => clearInterval(interval);
    }
  }, [status]);

  const mockDiscovery = {
    tables: 12,
    columns: 147,
    primaryKeys: 8,
    foreignKeys: 15,
    totalRows: '2.4M'
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <div className="font-semibold">Foundation Product</div>
                <div className="text-sm text-muted-foreground">Step 2 of 4</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/build/foundation/connect?type=${type}&connection=${connection}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Connect
            </Button>
          </div>
          <WorkflowProgressBar
            steps={foundationSteps}
            currentStep={1}
          />
        </Card>

        {/* Main Content */}
        {status === 'scanning' && (
          <div className="space-y-12 animate-in fade-in duration-500">

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 animate-pulse mb-4">
                <Database className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-4xl font-bold">Discovering Schema</h2>
              <p className="text-muted-foreground text-lg">
                Auto-discovering tables, columns, and relationships
              </p>
            </div>

            <Card className="p-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Discovery Progress</span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="space-y-4">
                  {discoverySteps.map((step, index) => (
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
          <div className="space-y-8 animate-in fade-in duration-500">

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <h2 className="text-3xl font-bold">Discovery Complete</h2>
              </div>
              <p className="text-muted-foreground text-lg">
                Found {mockDiscovery.tables} tables with {mockDiscovery.columns} columns
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-6 text-center">
                <Table className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-bold">{mockDiscovery.tables}</div>
                <div className="text-sm text-muted-foreground">Tables</div>
              </Card>
              <Card className="p-6 text-center">
                <Database className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-bold">{mockDiscovery.columns}</div>
                <div className="text-sm text-muted-foreground">Columns</div>
              </Card>
              <Card className="p-6 text-center">
                <Key className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-bold">{mockDiscovery.primaryKeys}</div>
                <div className="text-sm text-muted-foreground">Primary Keys</div>
              </Card>
              <Card className="p-6 text-center">
                <Hash className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-bold">{mockDiscovery.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="font-semibold text-lg">Top Tables Discovered</div>
                <div className="space-y-2">
                  {['customers', 'orders', 'products', 'transactions'].map((table, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Table className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{table}</span>
                      </div>
                      <Badge variant="outline">{Math.floor(Math.random() * 30 + 10)} columns</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.push(`/build/foundation/connect?type=${type}&connection=${connection}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                size="lg"
                onClick={() => router.push(`/build/foundation/configure?type=${type}&connection=${connection}`)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Continue to Configure
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function FoundationDiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DiscoverPageContent />
    </Suspense>
  );
}
