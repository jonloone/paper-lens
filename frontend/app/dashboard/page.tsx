'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SystemStatusGrid } from '@/components/dashboard/SystemStatusGrid';
import { ProjectProgressCards } from '@/components/dashboard/ProjectProgressCards';
import { PriorityActionsPanel } from '@/components/dashboard/PriorityActionsPanel';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Enterprise Data Platform</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your data products with ODPS compliance
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              New Data Product
            </button>
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors">
              Import Project
            </button>
          </div>
        </div>
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* System Status - Full Width */}
          <div className="col-span-12">
            <SystemStatusGrid />
          </div>
          
          {/* Projects and Priority Actions */}
          <div className="col-span-8">
            <ProjectProgressCards />
          </div>
          
          <div className="col-span-4">
            <PriorityActionsPanel />
          </div>
          
          {/* Performance Metrics */}
          <div className="col-span-12">
            <PerformanceMetrics />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}