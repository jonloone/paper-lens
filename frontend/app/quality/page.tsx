'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { QualityManagement } from '@/components/quality/QualityManagement';

export default function QualityPage() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)]">
        <QualityManagement />
      </div>
    </DashboardLayout>
  );
}