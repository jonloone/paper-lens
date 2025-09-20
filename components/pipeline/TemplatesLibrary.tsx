import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Copy, 
  Eye, 
  Star, 
  Clock,
  Database,
  Activity,
  TrendingUp,
  GitBranch,
  Package,
  ChevronRight,
  Users,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ETL' | 'ELT' | 'Streaming' | 'ML' | 'Real-time' | 'Custom';
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  popularity: number;
  components: {
    ingest: string[];
    transform: string[];
    store: string[];
    consume: string[];
  };
  tags: string[];
  author: string;
  lastUpdated: string;
  usageCount: number;
}

const pipelineTemplates: PipelineTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Basic ETL Pipeline',
    description: 'Standard extract, transform, and load pipeline for batch processing',
    category: 'ETL',
    icon: '📊',
    difficulty: 'beginner',
    estimatedTime: '10 mins',
    popularity: 95,
    components: {
      ingest: ['PostgreSQL Source', 'CSV File Reader'],
      transform: ['SQL Transform', 'Data Validation'],
      store: ['Snowflake Sink'],
      consume: ['Tableau Dashboard']
    },
    tags: ['batch', 'sql', 'analytics'],
    author: 'Data Team',
    lastUpdated: '2024-01-10',
    usageCount: 234
  },
  {
    id: 'tpl-002',
    name: 'Real-time Stream Processing',
    description: 'Process streaming data from Kafka with real-time transformations',
    category: 'Streaming',
    icon: '⚡',
    difficulty: 'intermediate',
    estimatedTime: '15 mins',
    popularity: 88,
    components: {
      ingest: ['Kafka Consumer'],
      transform: ['Stream Processor', 'Window Aggregation'],
      store: ['Time-series Database', 'S3 Archive'],
      consume: ['Real-time Dashboard', 'Alert System']
    },
    tags: ['streaming', 'kafka', 'real-time'],
    author: 'Streaming Team',
    lastUpdated: '2024-01-12',
    usageCount: 156
  },
  {
    id: 'tpl-003',
    name: 'ML Feature Engineering',
    description: 'Build feature pipelines for machine learning models',
    category: 'ML',
    icon: '🤖',
    difficulty: 'advanced',
    estimatedTime: '20 mins',
    popularity: 76,
    components: {
      ingest: ['Multiple Data Sources', 'Feature Store'],
      transform: ['Feature Engineering', 'Data Normalization', 'Feature Selection'],
      store: ['Feature Store', 'Model Registry'],
      consume: ['ML Model Training', 'Model Serving']
    },
    tags: ['ml', 'features', 'ai'],
    author: 'ML Team',
    lastUpdated: '2024-01-08',
    usageCount: 89
  },
  {
    id: 'tpl-004',
    name: 'CDC Data Replication',
    description: 'Change data capture pipeline for real-time database replication',
    category: 'Real-time',
    icon: '🔄',
    difficulty: 'intermediate',
    estimatedTime: '12 mins',
    popularity: 82,
    components: {
      ingest: ['CDC Source (Debezium)'],
      transform: ['Schema Evolution', 'Data Masking'],
      store: ['Target Database', 'Audit Log'],
      consume: ['Data Sync Monitor']
    },
    tags: ['cdc', 'replication', 'real-time'],
    author: 'Platform Team',
    lastUpdated: '2024-01-14',
    usageCount: 123
  },
  {
    id: 'tpl-005',
    name: 'Data Lake Ingestion',
    description: 'Ingest and organize raw data into a data lake',
    category: 'ELT',
    icon: '🏞️',
    difficulty: 'beginner',
    estimatedTime: '8 mins',
    popularity: 91,
    components: {
      ingest: ['S3 Source', 'API Connector', 'FTP'],
      transform: ['Format Conversion', 'Partitioning'],
      store: ['S3 Data Lake', 'Metadata Catalog'],
      consume: ['Athena Queries', 'Spark Processing']
    },
    tags: ['data-lake', 's3', 'elt'],
    author: 'Data Platform',
    lastUpdated: '2024-01-11',
    usageCount: 198
  },
  {
    id: 'tpl-006',
    name: 'Log Analytics Pipeline',
    description: 'Collect, process, and analyze application logs',
    category: 'Real-time',
    icon: '📝',
    difficulty: 'intermediate',
    estimatedTime: '15 mins',
    popularity: 79,
    components: {
      ingest: ['Log Collectors', 'Filebeat'],
      transform: ['Log Parser', 'Enrichment', 'Anomaly Detection'],
      store: ['Elasticsearch', 'Cold Storage'],
      consume: ['Kibana Dashboard', 'Alert Manager']
    },
    tags: ['logs', 'monitoring', 'observability'],
    author: 'DevOps Team',
    lastUpdated: '2024-01-13',
    usageCount: 145
  }
];

interface TemplatesLibraryProps {
  onSelectTemplate?: (template: PipelineTemplate) => void;
  className?: string;
}

export const TemplatesLibrary: React.FC<TemplatesLibraryProps> = ({
  onSelectTemplate,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const filteredTemplates = useMemo(() => {
    return pipelineTemplates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const getDifficultyColor = (difficulty: PipelineTemplate['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-500/10 border-green-500/20';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'advanced':
        return 'text-red-600 bg-red-500/10 border-red-500/20';
    }
  };

  const getCategoryIcon = (category: PipelineTemplate['category']) => {
    switch (category) {
      case 'ETL':
        return <Database className="w-4 h-4" />;
      case 'ELT':
        return <GitBranch className="w-4 h-4" />;
      case 'Streaming':
        return <Activity className="w-4 h-4" />;
      case 'ML':
        return <TrendingUp className="w-4 h-4" />;
      case 'Real-time':
        return <Zap className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pipeline Templates</h1>
          <p className="text-muted-foreground mt-1">
            Start with proven patterns and customize to your needs
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="ETL">ETL</option>
            <option value="ELT">ELT</option>
            <option value="Streaming">Streaming</option>
            <option value="ML">Machine Learning</option>
            <option value="Real-time">Real-time</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Template Header */}
              <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getCategoryIcon(template.category)}
                        <span className="text-sm text-muted-foreground">{template.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {template.description}
                </p>
              </div>

              {/* Template Stats */}
              <div className="p-4 space-y-3">
                {/* Difficulty and Time */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full border",
                    getDifficultyColor(template.difficulty)
                  )}>
                    {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {template.estimatedTime}
                  </div>
                </div>

                {/* Component Summary */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Pipeline Stages:</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Ingest: {template.components.ingest.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      Transform: {template.components.transform.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Store: {template.components.store.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      Consume: {template.components.consume.length}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-muted rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Usage Stats */}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {template.usageCount} uses
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {template.popularity}%
                    </span>
                  </div>
                  <span>{template.author}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t bg-muted/30 flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background rounded-md hover:bg-card transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => onSelectTemplate?.(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};