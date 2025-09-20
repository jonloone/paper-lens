import React, { useState, useEffect } from 'react';
import { Check, X, Settings, Database, Cloud, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeTypeRegistry } from '@/lib/services/NodeTypeRegistry';

interface TemplateCustomizerProps {
  template: {
    id: string;
    name: string;
    description: string;
    stages: {
      ingest: string[];
      transform: string[];
      store: string[];
      consume: string[];
    };
  };
  availableTools?: string[];
  onCustomize: (customizedTemplate: any) => void;
  onCancel: () => void;
}

interface ToolOption {
  id: string;
  name: string;
  type: string;
  icon: string;
  available: boolean;
  required: boolean;
  alternatives?: string[];
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  template,
  availableTools = [],
  onCustomize,
  onCancel
}) => {
  const [selectedTools, setSelectedTools] = useState<Record<string, string>>({});
  const [toolOptions, setToolOptions] = useState<Record<string, ToolOption[]>>({});
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToolOptions();
  }, [template, availableTools]);

  useEffect(() => {
    validateSelection();
  }, [selectedTools]);

  const loadToolOptions = async () => {
    setLoading(true);
    const registry = new NodeTypeRegistry();
    
    // Get available tools based on user entitlements
    const userTools = availableTools.length > 0 ? availableTools : ['airbyte', 'nifi', 'spark', 'dbt'];
    await registry.refreshNodeTypes(userTools);
    
    const options: Record<string, ToolOption[]> = {
      ingest: [],
      transform: [],
      store: [],
      consume: []
    };

    // Map template requirements to available tools
    for (const [stage, requirements] of Object.entries(template.stages)) {
      for (const requirement of requirements) {
        const toolOption: ToolOption = {
          id: requirement,
          name: getToolName(requirement),
          type: requirement,
          icon: getToolIcon(requirement),
          available: userTools.includes(requirement.split('-')[0]),
          required: isRequiredTool(requirement),
          alternatives: getAlternatives(requirement, userTools)
        };
        options[stage].push(toolOption);
      }
    }

    setToolOptions(options);
    
    // Auto-select available tools
    const autoSelected: Record<string, string> = {};
    for (const [stage, opts] of Object.entries(options)) {
      for (const opt of opts) {
        if (opt.available) {
          autoSelected[`${stage}-${opt.id}`] = opt.id;
        } else if (opt.alternatives && opt.alternatives.length > 0) {
          autoSelected[`${stage}-${opt.id}`] = opt.alternatives[0];
        }
      }
    }
    setSelectedTools(autoSelected);
    setLoading(false);
  };

  const getToolName = (toolId: string): string => {
    const names: Record<string, string> = {
      'airbyte-postgres-source': 'PostgreSQL (Airbyte)',
      'airbyte-mysql-source': 'MySQL (Airbyte)',
      'airbyte-salesforce-source': 'Salesforce (Airbyte)',
      'airbyte-s3-source': 'Amazon S3 (Airbyte)',
      'nifi-getfile': 'File System (NiFi)',
      'nifi-gethttp': 'HTTP API (NiFi)',
      'spark-batch': 'Spark Batch Processing',
      'spark-streaming': 'Spark Streaming',
      'dbt-model': 'dbt Transformation',
      'kafka-producer': 'Kafka Producer',
      'kafka-consumer': 'Kafka Consumer',
      'snowflake-destination': 'Snowflake',
      'bigquery-destination': 'BigQuery',
      's3-destination': 'S3 Storage'
    };
    return names[toolId] || toolId;
  };

  const getToolIcon = (toolId: string): string => {
    if (toolId.includes('airbyte')) return '🔌';
    if (toolId.includes('nifi')) return '🔧';
    if (toolId.includes('spark')) return '⚡';
    if (toolId.includes('dbt')) return '📊';
    if (toolId.includes('kafka')) return '📨';
    if (toolId.includes('snowflake')) return '❄️';
    if (toolId.includes('bigquery')) return '🗄️';
    if (toolId.includes('s3')) return '🪣';
    return '📦';
  };

  const isRequiredTool = (toolId: string): boolean => {
    // Define which tools are required vs optional
    const required = ['spark-batch', 'dbt-model'];
    return required.some(r => toolId.includes(r));
  };

  const getAlternatives = (toolId: string, userTools: string[]): string[] => {
    const alternatives: Record<string, string[]> = {
      'airbyte-postgres-source': ['nifi-executesql', 'spark-batch'],
      'airbyte-mysql-source': ['nifi-executesql', 'spark-batch'],
      'airbyte-salesforce-source': ['nifi-gethttp'],
      'spark-batch': ['flink-transform'],
      'dbt-model': ['spark-batch'],
      'snowflake-destination': ['bigquery-destination', 's3-destination', 'postgres-destination']
    };
    
    const alt = alternatives[toolId] || [];
    return alt.filter(a => userTools.some(t => a.startsWith(t)));
  };

  const validateSelection = () => {
    // Check if all required tools have a selection
    let valid = true;
    for (const [stage, options] of Object.entries(toolOptions)) {
      for (const option of options) {
        if (option.required) {
          const key = `${stage}-${option.id}`;
          if (!selectedTools[key]) {
            valid = false;
            break;
          }
        }
      }
      if (!valid) break;
    }
    setIsValid(valid);
  };

  const handleToolSelection = (stage: string, toolId: string, value: string) => {
    setSelectedTools(prev => ({
      ...prev,
      [`${stage}-${toolId}`]: value
    }));
  };

  const handleCustomize = () => {
    const customized = {
      ...template,
      customizedStages: {},
      selectedTools
    };
    
    // Build customized stages based on selections
    for (const [key, value] of Object.entries(selectedTools)) {
      const [stage] = key.split('-');
      if (!customized.customizedStages[stage]) {
        customized.customizedStages[stage] = [];
      }
      if (value) {
        customized.customizedStages[stage].push(value);
      }
    }
    
    onCustomize(customized);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading available tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Customize Template: {template.name}</h2>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

      <div className="space-y-6">
        {Object.entries(toolOptions).map(([stage, options]) => (
          <div key={stage} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
              {stage === 'ingest' && <Database className="w-5 h-5" />}
              {stage === 'transform' && <Zap className="w-5 h-5" />}
              {stage === 'store' && <Cloud className="w-5 h-5" />}
              {stage === 'consume' && <Settings className="w-5 h-5" />}
              {stage} Stage
            </h3>
            
            <div className="space-y-3">
              {options.map(option => {
                const key = `${stage}-${option.id}`;
                const selected = selectedTools[key];
                
                return (
                  <div key={option.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.name}</span>
                          {option.required && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Required</span>
                          )}
                        </div>
                        {!option.available && option.alternatives && option.alternatives.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Not available. Alternatives found.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {option.available ? (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-500">Available</span>
                        </div>
                      ) : option.alternatives && option.alternatives.length > 0 ? (
                        <select
                          value={selected || ''}
                          onChange={(e) => handleToolSelection(stage, option.id, e.target.value)}
                          className="px-3 py-1 text-sm border rounded-md bg-background"
                        >
                          <option value="">Select alternative...</option>
                          {option.alternatives.map(alt => (
                            <option key={alt} value={alt}>
                              {getToolName(alt)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-500">Not available</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!isValid && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-yellow-600 dark:text-yellow-400">
            Please select alternatives for all required tools that are not available.
          </span>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCustomize}
          disabled={!isValid}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            isValid
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Create Pipeline
        </button>
      </div>
    </div>
  );
};