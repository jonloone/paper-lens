'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProjectList } from '@/components/projects/ProjectList';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  TrendingUp
} from 'lucide-react';

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Data Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage ODPS v4.0 compliant data products
            </p>
          </div>
          
          <Button onClick={() => setShowNewProjectModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Data Product
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search data products..." 
              className="pl-10"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>

          <div className="flex items-center gap-1 border rounded-lg">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              Active Projects
            </TabsTrigger>
            <TabsTrigger value="development">
              In Development
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived
            </TabsTrigger>
            <TabsTrigger value="templates">
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <ProjectList viewMode={viewMode} filter="active" />
          </TabsContent>

          <TabsContent value="development" className="mt-6">
            <ProjectList viewMode={viewMode} filter="development" />
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <ProjectList viewMode={viewMode} filter="archived" />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <ProjectList viewMode={viewMode} filter="templates" />
          </TabsContent>
        </Tabs>

        {/* New Project Modal */}
        <NewProjectModal 
          open={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
        />
      </div>
    </DashboardLayout>
  );
}