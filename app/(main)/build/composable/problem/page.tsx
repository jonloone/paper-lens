'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationEntry } from '@/components/build/ConversationEntry';
import { WorkflowProgressBar } from '@/components/build/WorkflowProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const composableSteps = [
  { id: 'problem', name: 'Problem', description: 'Describe what you need' },
  { id: 'compose', name: 'Compose', description: 'Select & combine products' },
  { id: 'output', name: 'Output', description: 'Configure delivery' },
  { id: 'launch', name: 'Launch', description: 'Deploy & monitor' }
];

export default function ComposableProblemPage() {
  const router = useRouter();

  const handleComplete = (context: any) => {
    // Navigate to compose step with context
    const params = new URLSearchParams({
      data: encodeURIComponent(JSON.stringify(context))
    });
    router.push(`/build/composable/compose?${params.toString()}`);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6 border-green-200 bg-green-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <div className="font-semibold">Solution Product</div>
                <div className="text-sm text-muted-foreground">Step 1 of 4</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/build')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Type
            </Button>
          </div>
          <WorkflowProgressBar
            steps={composableSteps}
            currentStep={0}
          />
        </Card>

        {/* Main Content */}
        <ConversationEntry onComplete={handleComplete} />

      </div>
    </div>
  );
}
