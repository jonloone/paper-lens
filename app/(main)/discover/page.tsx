'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileCode } from 'lucide-react';
import { ModelsTab } from '@/components/discover/tabs/ModelsTab';
import { TablesTab } from '@/components/discover/tabs/TablesTab';
import { QueriesTab } from '@/components/discover/tabs/QueriesTab';

/**
 * Discover Page - Phase 1: DBT Model Discovery
 *
 * Purpose: Central hub for discovering and accessing data assets
 *
 * Phase 1 Focus:
 * - Models: DBT models organized by domain (PRIMARY)
 * - Queries: Saved queries and query library (FUTURE)
 * - Tables: Raw table catalog (FUTURE)
 */
export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<string>('models');

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Discover</h1>
          <p className="text-muted-foreground text-lg">
            Find and explore data models, tables, and products
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-fit bg-white border shadow-sm">
            <TabsTrigger value="models" className="gap-2">
              <FileCode className="h-4 w-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="queries" className="gap-2">
              <FileCode className="h-4 w-4" />
              Queries
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <Database className="h-4 w-4" />
              Tables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="m-0">
            <ModelsTab />
          </TabsContent>

          <TabsContent value="queries" className="m-0">
            <QueriesTab />
          </TabsContent>

          <TabsContent value="tables" className="m-0">
            <TablesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
