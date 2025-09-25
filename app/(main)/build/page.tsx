'use client';

import React from 'react';
import { LinearWorkflow } from '@/components/build/LinearWorkflow';
import { Badge } from '@/components/ui/badge';
import { Database, Activity } from 'lucide-react';

export default function BuildPage() {
  const handleDataProductComplete = (dataProduct: any) => {
    console.log('Data product created:', dataProduct);
    // Handle completion - could navigate to a success page or show a modal
  };

  return (
    <div className="w-full px-8 lg:px-12 xl:px-16 py-6">
      <div className="space-y-6 max-w-[1920px] mx-auto">
        {/* Clean minimal header matching Catalog style */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Build</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and deploy data products through intelligent workflows
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Database className="h-3 w-3 mr-1" />
              5 In Progress
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />
              12 This Week
            </Badge>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mt-8">
          <LinearWorkflow onComplete={handleDataProductComplete} />
        </div>
      </div>
    </div>
  );
}