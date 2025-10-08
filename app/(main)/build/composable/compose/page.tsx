'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ContextConfirmation } from '@/components/build/ContextConfirmation';
import { WorkflowProgressBar } from '@/components/build/WorkflowProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const composableSteps = [
  { id: 'problem', name: 'Problem', description: 'Describe what you need' },
  { id: 'compose', name: 'Compose', description: 'Select & combine products' },
  { id: 'output', name: 'Output', description: 'Configure delivery' },
  { id: 'launch', name: 'Launch', description: 'Deploy & monitor' }
];

function ComposePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');

  if (!dataParam) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <p className="text-muted-foreground">No context data found. Please start from the beginning.</p>
        <Button
          onClick={() => router.push('/build/composable/problem')}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Problem
        </Button>
      </div>
    );
  }

  let context;
  try {
    context = JSON.parse(decodeURIComponent(dataParam));
  } catch (error) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <p className="text-destructive">Failed to parse context data. Please try again.</p>
        <Button
          onClick={() => router.push('/build/composable/problem')}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Problem
        </Button>
      </div>
    );
  }

  const handleContinue = (confirmed: any) => {
    // Navigate to output step with confirmed context
    const params = new URLSearchParams({
      data: encodeURIComponent(JSON.stringify(confirmed))
    });
    router.push(`/build/composable/output?${params.toString()}`);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6 border-green-200 bg-green-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <div className="font-semibold">Solution Product</div>
                <div className="text-sm text-muted-foreground">Step 2 of 4</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/build/composable/problem')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Problem
            </Button>
          </div>
          <WorkflowProgressBar
            steps={composableSteps}
            currentStep={1}
          />
        </Card>

        {/* Main Content */}
        <ContextConfirmation
          context={context}
          onContinue={handleContinue}
        />

      </div>
    </div>
  );
}

export default function ComposableComposePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ComposePageContent />
    </Suspense>
  );
}
