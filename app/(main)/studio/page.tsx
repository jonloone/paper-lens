'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { StudioMode } from '@/components/studio/ProfessionalStudio';

// Dynamic import to avoid SSR issues with ReactFlow
const ProfessionalStudio = dynamic(
  () => import('@/components/studio/ProfessionalStudio'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Studio...</p>
        </div>
      </div>
    )
  }
);

export default function StudioPage() {
  const searchParams = useSearchParams();
  const [initialMode, setInitialMode] = useState<StudioMode>('build');
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [pipelineName, setPipelineName] = useState<string>('New Pipeline');
  
  useEffect(() => {
    // Get mode from query params (e.g., ?mode=operate)
    const mode = searchParams.get('mode') as StudioMode;
    if (mode && ['build', 'operate', 'optimize', 'monitor'].includes(mode)) {
      setInitialMode(mode);
    }
    
    // Get pipeline from query params (e.g., ?pipeline=customer_etl)
    const pipeline = searchParams.get('pipeline');
    if (pipeline) {
      setPipelineId(pipeline);
      setPipelineName(pipeline.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
    
    // Get action from query params (e.g., ?action=fix)
    const action = searchParams.get('action');
    if (action === 'fix') {
      setInitialMode('operate');
    } else if (action === 'monitor') {
      setInitialMode('monitor');
    } else if (action === 'optimize') {
      setInitialMode('optimize');
    }
  }, [searchParams]);
  
  return (
    <div className="h-screen">
      <ProfessionalStudio
        initialMode={initialMode}
        pipelineId={pipelineId}
        pipelineName={pipelineName}
        onModeChange={(mode) => {
          // Update URL without navigation
          const url = new URL(window.location.href);
          url.searchParams.set('mode', mode);
          window.history.replaceState({}, '', url);
        }}
      />
    </div>
  );
}