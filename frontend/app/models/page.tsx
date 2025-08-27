'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProcessingConfiguration } from '@/components/configuration/ProcessingConfiguration';

export default function ModelsPage() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)]">
        <ProcessingConfiguration />
      </div>
    </DashboardLayout>
  );
}