'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wrench, 
  Database, 
  Layers, 
  Play,
  Activity
} from 'lucide-react';

// Import components (to be created)
import { PipelineStudio } from '@/components/build/PipelineStudio';
import { TemplateGallery } from '@/components/build/TemplateGallery';
import { DeploymentDashboard } from '@/components/build/DeploymentDashboard';

export default function BuildDeployPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get('tab');
  
  // Redirect deprecated 'sql' tab to studio or handle other invalid tabs
  const activeTab = tabParam === 'sql' || !['studio', 'templates', 'deploy'].includes(tabParam || '') 
    ? 'studio' 
    : tabParam;
  
  const handleTabChange = (value: string) => {
    router.push(`/build?tab=${value}`);
  };

  return (
    <div className="flex-1 space-y-4 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Wrench className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Build & Deploy</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage data pipelines with real tool integration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-sm">All systems operational</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="studio" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Pipeline Studio
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="deploy" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Deployment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="space-y-4">
          <PipelineStudio />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplateGallery />
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4">
          <DeploymentDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}