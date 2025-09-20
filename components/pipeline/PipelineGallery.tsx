import React, { useState, useMemo } from 'react';
import { Search, Filter, Clock, Database, Activity, TrendingUp, GitBranch, Users, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  type: 'ETL' | 'ELT' | 'Streaming' | 'ML' | 'Real-time';
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  components: number;
  stages: {
    ingest: number;
    transform: number;
    store: number;
    consume: number;
  };
  lastModified: string;
  owner: string;
  runs: number;
  successRate: number;
}

const mockPipelines: Pipeline[] = [
  {
    id: 'pl-001',
    name: 'Customer Data ETL',
    description: 'Daily customer data synchronization from CRM to data warehouse',
    type: 'ETL',
    status: 'active',
    components: 12,
    stages: { ingest: 3, transform: 5, store: 2, consume: 2 },
    lastModified: '2024-01-15T10:30:00Z',
    owner: 'data-team',
    runs: 1250,
    successRate: 98.5
  },
  {
    id: 'pl-002',
    name: 'Real-time Event Processing',
    description: 'Process streaming events from Kafka to analytics dashboard',
    type: 'Streaming',
    status: 'active',
    components: 8,
    stages: { ingest: 2, transform: 3, store: 2, consume: 1 },
    lastModified: '2024-01-14T14:20:00Z',
    owner: 'streaming-team',
    runs: 15420,
    successRate: 99.2
  },
  {
    id: 'pl-003',
    name: 'ML Feature Pipeline',
    description: 'Feature engineering pipeline for recommendation models',
    type: 'ML',
    status: 'maintenance',
    components: 15,
    stages: { ingest: 4, transform: 7, store: 3, consume: 1 },
    lastModified: '2024-01-13T09:15:00Z',
    owner: 'ml-team',
    runs: 450,
    successRate: 94.3
  },
  {
    id: 'pl-004',
    name: 'Financial Data ELT',
    description: 'Load financial transactions and transform in data warehouse',
    type: 'ELT',
    status: 'active',
    components: 10,
    stages: { ingest: 2, transform: 4, store: 2, consume: 2 },
    lastModified: '2024-01-12T16:45:00Z',
    owner: 'finance-team',
    runs: 890,
    successRate: 99.8
  },
  {
    id: 'pl-005',
    name: 'Log Analytics Pipeline',
    description: 'Aggregate and analyze application logs for monitoring',
    type: 'Real-time',
    status: 'error',
    components: 11,
    stages: { ingest: 3, transform: 4, store: 2, consume: 2 },
    lastModified: '2024-01-11T11:30:00Z',
    owner: 'platform-team',
    runs: 3200,
    successRate: 87.4
  }
];

interface PipelineGalleryProps {
  onSelectPipeline?: (pipeline: Pipeline) => void;
  onCreateNew?: () => void;
}

export const PipelineGallery: React.FC<PipelineGalleryProps> = ({ 
  onSelectPipeline,
  onCreateNew 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredPipelines = useMemo(() => {
    return mockPipelines.filter(pipeline => {
      const matchesSearch = pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pipeline.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || pipeline.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || pipeline.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, selectedType, selectedStatus]);

  const getStatusColor = (status: Pipeline['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTypeIcon = (type: Pipeline['type']) => {
    switch (type) {
      case 'ETL':
        return <Database className="w-4 h-4" />;
      case 'ELT':
        return <GitBranch className="w-4 h-4" />;
      case 'Streaming':
        return <Activity className="w-4 h-4" />;
      case 'ML':
        return <TrendingUp className="w-4 h-4" />;
      case 'Real-time':
        return <Activity className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Pipeline Gallery</h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage your organization's data pipelines
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create New Pipeline
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pipelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="ETL">ETL</option>
            <option value="ELT">ELT</option>
            <option value="Streaming">Streaming</option>
            <option value="ML">ML</option>
            <option value="Real-time">Real-time</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Pipeline Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPipelines.map(pipeline => (
            <div
              key={pipeline.id}
              onClick={() => onSelectPipeline?.(pipeline)}
              className="bg-card border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
            >
              {/* Pipeline Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(pipeline.type)}
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {pipeline.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {pipeline.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full border",
                  getStatusColor(pipeline.status)
                )}>
                  {pipeline.status.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {pipeline.type}
                </span>
              </div>

              {/* Pipeline Stages */}
              <div className="flex items-center gap-1 mb-3">
                <div className="flex-1 bg-blue-500/20 rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                    style={{ width: `${(pipeline.stages.ingest / pipeline.components) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-purple-500/20 rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-purple-500 rounded-full"
                    style={{ width: `${(pipeline.stages.transform / pipeline.components) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-green-500/20 rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                    style={{ width: `${(pipeline.stages.store / pipeline.components) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-orange-500/20 rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                    style={{ width: `${(pipeline.stages.consume / pipeline.components) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stage Labels */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>Ingest ({pipeline.stages.ingest})</span>
                <span>Transform ({pipeline.stages.transform})</span>
                <span>Store ({pipeline.stages.store})</span>
                <span>Consume ({pipeline.stages.consume})</span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">{pipeline.components}</div>
                  <div className="text-xs text-muted-foreground">Components</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{pipeline.runs.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Runs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{pipeline.successRate}%</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{pipeline.owner}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(pipeline.lastModified)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPipelines.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Database className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No pipelines found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new pipeline</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {filteredPipelines.length} of {mockPipelines.length} pipelines
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              Active: {mockPipelines.filter(p => p.status === 'active').length}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              Error: {mockPipelines.filter(p => p.status === 'error').length}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              Maintenance: {mockPipelines.filter(p => p.status === 'maintenance').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};