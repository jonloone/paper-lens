'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Play, Save, Eye, EyeOff, Database, X, ChevronRight, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddStageDropdown } from './AddStageDropdown';
import { StageConfigPanel } from './StageConfigPanel';
import { SQLPreview } from './SQLPreview';
import { dataHubService, type DataHubContext } from '@/lib/services/DataHubContextService';

export interface QueryPipeline {
  baseQuery: string;
  stages: PipelineStage[];
  finalSQL: string;
  metadata: {
    estimatedRows?: number;
    estimatedCost?: number;
    dataSources?: string[];
  };
}

export interface PipelineStage {
  id: string;
  type: 'filter' | 'transform' | 'enrich' | 'aggregate' | 'privacy';
  name: string;
  rules: Rule[];
  sqlTransformation: string;
  isActive: boolean;
  preview?: {
    before: number;
    after: number;
    impact: string;
  };
}

export interface Rule {
  id: string;
  name: string;
  sql: string;
  type?: string;
  field?: string;
  alias?: string;
  allowed_roles?: string[];
  mask_value?: string;
}

export interface StageOption {
  name: string;
  template: string;
  source?: string;
  field?: string;
  description?: string;
}

interface QueryPipelineBuilderProps {
  onExecute: (pipeline: QueryPipeline) => void;
  onSaveAsProduct: (pipeline: QueryPipeline) => void;
  initialQuery?: string;
}

export const QueryPipelineBuilder: React.FC<QueryPipelineBuilderProps> = ({
  onExecute,
  onSaveAsProduct,
  initialQuery = ''
}) => {
  const [baseQuery, setBaseQuery] = useState(initialQuery);
  const [pipeline, setPipeline] = useState<QueryPipeline>({
    baseQuery: '',
    stages: [],
    finalSQL: '',
    metadata: {}
  });
  const [showSQL, setShowSQL] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [dataHubContext, setDataHubContext] = useState<DataHubContext>({
    hasContext: false,
    piiFields: [],
    qualityScore: 0,
    nullCount: 0,
    duplicateCount: 0,
    glossaryTerms: [],
    upstreamDatasets: []
  });

  // Extract table names from query and fetch DataHub context
  useEffect(() => {
    if (baseQuery) {
      const tableMatch = baseQuery.match(/from\s+(\w+\.\w+|\w+)/i);
      if (tableMatch) {
        const [schema, table] = tableMatch[1].includes('.') 
          ? tableMatch[1].split('.')
          : ['public', tableMatch[1]];
        
        dataHubService.getTableContext(schema, table).then(context => {
          setDataHubContext(context);
        });
      }
    }
  }, [baseQuery]);

  // Available stages based on DataHub metadata - no assumptions
  const getAvailableStages = () => {
    return {
      filters: {
        name: 'Add Filters',
        description: 'WHERE clauses to filter data',
        icon: '🔽',
        options: [
          { name: 'Date Range', template: 'date_column BETWEEN ? AND ?' },
          { name: 'Status Filter', template: 'status IN (?)' },
          { name: 'Null Filter', template: 'column IS NOT NULL' },
          { name: 'Custom Filter', template: '' }
        ]
      },
      
      transforms: {
        name: 'Add Transformations',
        description: 'Modify or calculate fields',
        icon: '🔄',
        options: [
          { name: 'CASE Statement', template: 'CASE WHEN condition THEN value END' },
          { name: 'Date Formatting', template: "DATE_TRUNC('day', date_column)" },
          { name: 'String Manipulation', template: 'UPPER(column)' },
          { name: 'Type Casting', template: 'CAST(column AS type)' }
        ]
      },
      
      enrichments: {
        name: 'Add Business Logic',
        description: 'Business calculations and metrics',
        icon: '📊',
        options: dataHubContext.glossaryTerms?.length > 0
          ? dataHubContext.glossaryTerms.map(term => ({
              name: term.name,
              template: term.calculation || '',
              source: 'DataHub Glossary',
              description: term.description
            }))
          : [
              { name: 'Running Total', template: 'SUM(value) OVER (ORDER BY date)' },
              { name: 'Rank', template: 'RANK() OVER (PARTITION BY ? ORDER BY ?)' },
              { name: 'Percentage', template: 'value / SUM(value) OVER () * 100' }
            ]
      },
      
      aggregations: {
        name: 'Add Aggregations',
        description: 'Group and summarize data',
        icon: '📈',
        options: [
          { name: 'Group By', template: 'GROUP BY columns' },
          { name: 'Sum', template: 'SUM(column)' },
          { name: 'Average', template: 'AVG(column)' },
          { name: 'Count', template: 'COUNT(DISTINCT column)' }
        ]
      },
      
      privacy: {
        name: 'Add Privacy Rules',
        description: 'Mask or redact sensitive fields',
        icon: '🔒',
        options: dataHubContext.piiFields?.length > 0
          ? dataHubContext.piiFields.map(field => ({
              name: `Mask ${field}`,
              template: `CASE WHEN current_user() IN (?) THEN ${field} ELSE '***' END AS ${field}`,
              field: field
            }))
          : [
              { name: 'Mask Email', template: "CONCAT(LEFT(email, 2), '***@***.com') AS email" },
              { name: 'Mask Phone', template: "CONCAT('***-***-', RIGHT(phone, 4)) AS phone" },
              { name: 'Mask SSN', template: "CONCAT('***-**-', RIGHT(ssn, 4)) AS ssn" }
            ]
      }
    };
  };

  const handleQuerySubmit = () => {
    setPipeline({
      ...pipeline,
      baseQuery,
      finalSQL: baseQuery,
      metadata: {
        dataSources: extractDataSources(baseQuery)
      }
    });
  };

  const extractDataSources = (query: string): string[] => {
    const matches = query.match(/from\s+(\w+\.\w+|\w+)/gi) || [];
    return matches.map(m => m.replace(/from\s+/i, ''));
  };

  const addStage = (type: string, option: StageOption) => {
    const newStage: PipelineStage = {
      id: `stage_${Date.now()}`,
      type: type as any,
      name: option.name,
      rules: [{
        id: `rule_${Date.now()}`,
        name: option.name,
        sql: option.template,
        field: option.field
      }],
      sqlTransformation: option.template,
      isActive: true
    };

    setPipeline({
      ...pipeline,
      stages: [...pipeline.stages, newStage]
    });
  };

  const removeStage = (stageId: string) => {
    setPipeline({
      ...pipeline,
      stages: pipeline.stages.filter(s => s.id !== stageId)
    });
  };

  const updateStage = (updatedStage: PipelineStage) => {
    setPipeline({
      ...pipeline,
      stages: pipeline.stages.map(s => 
        s.id === updatedStage.id ? updatedStage : s
      )
    });
  };

  const getStageIcon = (type: string) => {
    const iconMap = {
      filter: '🔽',
      transform: '🔄',
      enrich: '📊',
      aggregate: '📈',
      privacy: '🔒'
    };
    return iconMap[type] || '📦';
  };

  return (
    <div className="query-pipeline-builder space-y-6">
      {/* Omnibar for initial query */}
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-border">
        <div className="flex items-start gap-4">
          <Database className="h-5 w-5 text-muted-foreground mt-2" />
          <div className="flex-1">
            <textarea
              className="w-full min-h-[80px] bg-transparent border-0 resize-none focus:outline-none text-sm font-mono"
              placeholder="Enter your query: natural language, SQL, or paste existing query..."
              value={baseQuery}
              onChange={(e) => setBaseQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleQuerySubmit();
                }
              }}
            />
          </div>
          <Button 
            onClick={handleQuerySubmit}
            disabled={!baseQuery}
            className="gap-2"
          >
            Build Pipeline
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Pipeline Builder - Only shows after query is entered */}
      {pipeline.baseQuery && (
        <>
          {/* Pipeline Visualization */}
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-border overflow-x-auto">
            <h3 className="text-sm font-semibold mb-4">Pipeline Stages</h3>
            <div className="flex items-center gap-3 min-w-max">
              {/* Base Query Block */}
              <div className="pipeline-stage">
                <Card className="p-4 bg-muted/50 border-muted min-w-[150px]">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Base Query</div>
                  <div className="text-sm font-semibold">
                    {pipeline.metadata?.dataSources?.join(', ') || 'Source'}
                  </div>
                </Card>
              </div>

              {/* Applied Stages */}
              {pipeline.stages.map((stage) => (
                <React.Fragment key={stage.id}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Card 
                    className={cn(
                      "p-4 min-w-[150px] cursor-pointer transition-all",
                      "hover:border-primary/50",
                      activeStage === stage.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setActiveStage(stage.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getStageIcon(stage.type)}</span>
                        <span className="text-sm font-medium">{stage.name}</span>
                      </div>
                      <button
                        className="h-5 w-5 rounded-full hover:bg-destructive/20 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStage(stage.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stage.rules.length} rule{stage.rules.length !== 1 ? 's' : ''}
                    </div>
                    {stage.preview && (
                      <div className="text-xs text-green-600 mt-1">
                        {stage.preview.impact}
                      </div>
                    )}
                  </Card>
                </React.Fragment>
              ))}

              {/* Add Stage Button */}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <AddStageDropdown
                availableStages={getAvailableStages()}
                onAddStage={addStage}
              />
            </div>
          </Card>

          {/* Stage Configuration Panel */}
          {activeStage && (
            <StageConfigPanel
              stage={pipeline.stages.find(s => s.id === activeStage)!}
              availableOptions={
                getAvailableStages()[
                  pipeline.stages.find(s => s.id === activeStage)!.type + 's'
                ]?.options || []
              }
              onUpdateStage={updateStage}
              onClose={() => setActiveStage(null)}
            />
          )}

          {/* SQL Preview Toggle */}
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Generated SQL</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSQL(!showSQL)}
                className="gap-2"
              >
                {showSQL ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSQL ? 'Hide' : 'Show'} SQL
              </Button>
            </div>
            
            {showSQL && (
              <SQLPreview
                baseQuery={baseQuery}
                stages={pipeline.stages}
                finalSQL={pipeline.finalSQL}
              />
            )}
          </Card>

          {/* Action Bar */}
          <Card className="p-4 bg-background/50 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-sm text-muted-foreground">
                  Stages: {pipeline.stages.length}
                </span>
                {pipeline.metadata?.estimatedRows && (
                  <span className="text-sm text-muted-foreground">
                    Est. Rows: {pipeline.metadata.estimatedRows.toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => onSaveAsProduct(pipeline)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save as Data Product
                </Button>
                
                <Button 
                  onClick={() => onExecute(pipeline)}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Execute Pipeline
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};