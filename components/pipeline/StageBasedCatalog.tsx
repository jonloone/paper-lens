import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Database, Cloud, Zap, Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CatalogComponent {
  id: string;
  name: string;
  type: string;
  category: string;
  stage: 'ingest' | 'transform' | 'store' | 'consume';
  icon: string;
  description: string;
  integrationLevel: 'full' | 'partial' | 'manual';
  configSchema?: any;
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
}

const catalogComponents: CatalogComponent[] = [
  // Ingest Sources
  {
    id: 'postgres-source',
    name: 'PostgreSQL',
    type: 'database',
    category: 'Databases',
    stage: 'ingest',
    icon: '🐘',
    description: 'Read data from PostgreSQL databases',
    integrationLevel: 'full',
    outputs: [{ name: 'data', type: 'table' }]
  },
  {
    id: 'mysql-source',
    name: 'MySQL',
    type: 'database',
    category: 'Databases',
    stage: 'ingest',
    icon: '🐬',
    description: 'Read data from MySQL databases',
    integrationLevel: 'full',
    outputs: [{ name: 'data', type: 'table' }]
  },
  {
    id: 's3-source',
    name: 'Amazon S3',
    type: 'file',
    category: 'Files',
    stage: 'ingest',
    icon: '☁️',
    description: 'Read files from S3 buckets',
    integrationLevel: 'full',
    outputs: [{ name: 'files', type: 'file' }]
  },
  {
    id: 'kafka-source',
    name: 'Apache Kafka',
    type: 'streaming',
    category: 'Streaming',
    stage: 'ingest',
    icon: '📡',
    description: 'Consume messages from Kafka topics',
    integrationLevel: 'full',
    outputs: [{ name: 'stream', type: 'stream' }]
  },
  {
    id: 'rest-api-source',
    name: 'REST API',
    type: 'api',
    category: 'APIs',
    stage: 'ingest',
    icon: '🌐',
    description: 'Fetch data from REST endpoints',
    integrationLevel: 'manual',
    outputs: [{ name: 'response', type: 'json' }]
  },

  // Transform Processors
  {
    id: 'sql-transform',
    name: 'SQL Transform (dbt)',
    type: 'transform',
    category: 'Data Manipulation',
    stage: 'transform',
    icon: '🔄',
    description: 'Transform data using SQL queries',
    integrationLevel: 'full',
    inputs: [{ name: 'input', type: 'table' }],
    outputs: [{ name: 'output', type: 'table' }]
  },
  {
    id: 'python-script',
    name: 'Python Script',
    type: 'transform',
    category: 'Data Manipulation',
    stage: 'transform',
    icon: '🐍',
    description: 'Custom Python transformations',
    integrationLevel: 'partial',
    inputs: [{ name: 'input', type: 'any' }],
    outputs: [{ name: 'output', type: 'any' }]
  },
  {
    id: 'spark-job',
    name: 'Spark Job',
    type: 'transform',
    category: 'Data Manipulation',
    stage: 'transform',
    icon: '⚡',
    description: 'Large-scale data processing with Spark',
    integrationLevel: 'full',
    inputs: [{ name: 'input', type: 'dataset' }],
    outputs: [{ name: 'output', type: 'dataset' }]
  },
  {
    id: 'data-validation',
    name: 'Data Validation',
    type: 'quality',
    category: 'Data Quality',
    stage: 'transform',
    icon: '✅',
    description: 'Validate data quality rules',
    integrationLevel: 'full',
    inputs: [{ name: 'input', type: 'table' }],
    outputs: [{ name: 'validated', type: 'table' }, { name: 'errors', type: 'table' }]
  },
  {
    id: 'deduplication',
    name: 'Deduplication',
    type: 'quality',
    category: 'Data Quality',
    stage: 'transform',
    icon: '🔍',
    description: 'Remove duplicate records',
    integrationLevel: 'full',
    inputs: [{ name: 'input', type: 'table' }],
    outputs: [{ name: 'unique', type: 'table' }]
  },

  // Store Destinations
  {
    id: 'snowflake-sink',
    name: 'Snowflake',
    type: 'warehouse',
    category: 'Data Warehouses',
    stage: 'store',
    icon: '❄️',
    description: 'Load data into Snowflake',
    integrationLevel: 'full',
    inputs: [{ name: 'data', type: 'table' }]
  },
  {
    id: 'bigquery-sink',
    name: 'Google BigQuery',
    type: 'warehouse',
    category: 'Data Warehouses',
    stage: 'store',
    icon: '📊',
    description: 'Load data into BigQuery',
    integrationLevel: 'full',
    inputs: [{ name: 'data', type: 'table' }]
  },
  {
    id: 's3-sink',
    name: 'S3 Data Lake',
    type: 'lake',
    category: 'Data Lakes',
    stage: 'store',
    icon: '🗄️',
    description: 'Store data in S3 data lake',
    integrationLevel: 'full',
    inputs: [{ name: 'data', type: 'file' }]
  },
  {
    id: 'postgres-sink',
    name: 'PostgreSQL',
    type: 'database',
    category: 'Databases',
    stage: 'store',
    icon: '🐘',
    description: 'Write data to PostgreSQL',
    integrationLevel: 'full',
    inputs: [{ name: 'data', type: 'table' }]
  },
  {
    id: 'kafka-sink',
    name: 'Kafka Producer',
    type: 'streaming',
    category: 'Streaming',
    stage: 'store',
    icon: '📤',
    description: 'Publish messages to Kafka',
    integrationLevel: 'full',
    inputs: [{ name: 'messages', type: 'stream' }]
  },

  // Consume Endpoints
  {
    id: 'tableau-consumer',
    name: 'Tableau',
    type: 'visualization',
    category: 'Analytics',
    stage: 'consume',
    icon: '📈',
    description: 'Visualize data in Tableau',
    integrationLevel: 'partial',
    inputs: [{ name: 'data', type: 'table' }]
  },
  {
    id: 'api-endpoint',
    name: 'API Endpoint',
    type: 'api',
    category: 'APIs',
    stage: 'consume',
    icon: '🔌',
    description: 'Expose data via REST API',
    integrationLevel: 'manual',
    inputs: [{ name: 'data', type: 'any' }]
  },
  {
    id: 'ml-model',
    name: 'ML Model',
    type: 'ml',
    category: 'Machine Learning',
    stage: 'consume',
    icon: '🤖',
    description: 'Feed data to ML models',
    integrationLevel: 'partial',
    inputs: [{ name: 'features', type: 'table' }]
  }
];

interface StageBasedCatalogProps {
  className?: string;
  onSelectComponent?: (component: CatalogComponent) => void;
}

export const StageBasedCatalog: React.FC<StageBasedCatalogProps> = ({ 
  className,
  onSelectComponent 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['ingest', 'transform', 'store', 'consume']));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const stages = [
    { id: 'ingest', name: 'Ingest', icon: '📥', color: 'blue' },
    { id: 'transform', name: 'Transform', icon: '⚙️', color: 'purple' },
    { id: 'store', name: 'Store', icon: '💾', color: 'green' },
    { id: 'consume', name: 'Consume', icon: '📤', color: 'orange' }
  ];

  const filteredComponents = useMemo(() => {
    if (!searchQuery) return catalogComponents;
    
    return catalogComponents.filter(component =>
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const componentsByStage = useMemo(() => {
    const grouped: Record<string, Record<string, CatalogComponent[]>> = {};
    
    stages.forEach(stage => {
      grouped[stage.id] = {};
    });

    filteredComponents.forEach(component => {
      if (!grouped[component.stage]) {
        grouped[component.stage] = {};
      }
      if (!grouped[component.stage][component.category]) {
        grouped[component.stage][component.category] = [];
      }
      grouped[component.stage][component.category].push(component);
    });

    return grouped;
  }, [filteredComponents]);

  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const getIntegrationIcon = (level: CatalogComponent['integrationLevel']) => {
    switch (level) {
      case 'full':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'partial':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'manual':
        return <AlertCircle className="w-3 h-3 text-orange-500" />;
    }
  };

  const getIntegrationText = (level: CatalogComponent['integrationLevel']) => {
    switch (level) {
      case 'full':
        return 'Full API';
      case 'partial':
        return 'Partial';
      case 'manual':
        return 'Manual';
    }
  };

  const onDragStart = (event: React.DragEvent, component: CatalogComponent) => {
    event.dataTransfer.setData('componentType', component.type);
    event.dataTransfer.setData('componentData', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={cn("w-80 bg-card border-r flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-3">Component Catalog</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Integration Legend */}
        <div className="mt-3 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Full API
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-500" />
            Partial
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-orange-500" />
            Manual
          </span>
        </div>
      </div>

      {/* Component Tree */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {stages.map(stage => {
          const stageComponents = componentsByStage[stage.id];
          const componentCount = Object.values(stageComponents).flat().flat().length;

          return (
            <div key={stage.id} className="space-y-2">
              {/* Stage Header */}
              <button
                onClick={() => toggleStage(stage.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg transition-colors",
                  `hover:bg-${stage.color}-500/10`
                )}
              >
                <div className="flex items-center gap-2">
                  {expandedStages.has(stage.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-lg">{stage.icon}</span>
                  <span className={cn(
                    "font-medium",
                    `text-${stage.color}-600 dark:text-${stage.color}-400`
                  )}>
                    {stage.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({componentCount})
                  </span>
                </div>
              </button>

              {/* Categories */}
              {expandedStages.has(stage.id) && (
                <div className="ml-4 space-y-2">
                  {Object.entries(stageComponents).map(([category, components]) => {
                    const categoryKey = `${stage.id}-${category}`;
                    
                    if (components.length === 0) return null;

                    return (
                      <div key={categoryKey} className="space-y-1">
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(categoryKey)}
                          className="w-full flex items-center gap-2 p-1 text-sm hover:bg-muted/50 rounded transition-colors"
                        >
                          {expandedCategories.has(categoryKey) ? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className="font-medium text-muted-foreground">
                            {category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({components.length})
                          </span>
                        </button>

                        {/* Components */}
                        {expandedCategories.has(categoryKey) && (
                          <div className="ml-4 space-y-1">
                            {components.map(component => (
                              <div
                                key={component.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, component)}
                                onClick={() => onSelectComponent?.(component)}
                                className="group p-2 bg-background border rounded-md cursor-move hover:shadow-md hover:border-primary/50 transition-all"
                                title={component.description}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg flex-shrink-0">
                                    {component.icon}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium truncate">
                                        {component.name}
                                      </span>
                                      {getIntegrationIcon(component.integrationLevel)}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {component.description}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Integration Level Badge */}
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded",
                                    component.integrationLevel === 'full' && "bg-green-500/10 text-green-600",
                                    component.integrationLevel === 'partial' && "bg-yellow-500/10 text-yellow-600",
                                    component.integrationLevel === 'manual' && "bg-orange-500/10 text-orange-600"
                                  )}>
                                    {getIntegrationText(component.integrationLevel)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {Object.values(componentsByStage).every(stage => 
          Object.values(stage).every(category => category.length === 0)
        ) && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No components found</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Drag to add to pipeline</span>
          <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
            {filteredComponents.length} items
          </span>
        </div>
      </div>
    </div>
  );
};