'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Package,
  Calendar,
  Database,
  Code,
  Save,
  X,
  ChevronRight,
  RefreshCw,
  Users
} from 'lucide-react';
import type { QueryPipeline } from '@/components/query/QueryPipelineBuilder';

export interface DataProduct {
  name: string;
  description: string;
  owner: string;
  schedule: string;
  modelType: 'TABLE' | 'INCREMENTAL' | 'VIEW';
  pipeline: QueryPipeline;
  metadata: {
    createdAt: string;
    tags: string[];
    dataHub: {
      pushToDataHub: boolean;
      lineageTracking: boolean;
    };
  };
}

interface PipelineProductizationProps {
  pipeline: QueryPipeline;
  onSave: (product: DataProduct) => void;
  onClose: () => void;
}

export const PipelineProductization: React.FC<PipelineProductizationProps> = ({
  pipeline,
  onSave,
  onClose
}) => {
  const [productConfig, setProductConfig] = useState({
    name: '',
    description: '',
    owner: 'data-team',
    schedule: '@daily',
    modelType: 'TABLE' as const,
    tags: [] as string[],
    pushToDataHub: true,
    lineageTracking: true
  });
  
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddTag = () => {
    if (newTag && !productConfig.tags.includes(newTag)) {
      setProductConfig({
        ...productConfig,
        tags: [...productConfig.tags, newTag]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setProductConfig({
      ...productConfig,
      tags: productConfig.tags.filter(t => t !== tag)
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!productConfig.name) {
      newErrors.name = 'Product name is required';
    }
    
    if (!productConfig.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!productConfig.owner) {
      newErrors.owner = 'Owner is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    const dataProduct: DataProduct = {
      name: productConfig.name,
      description: productConfig.description,
      owner: productConfig.owner,
      schedule: productConfig.schedule,
      modelType: productConfig.modelType,
      pipeline: pipeline,
      metadata: {
        createdAt: new Date().toISOString(),
        tags: productConfig.tags,
        dataHub: {
          pushToDataHub: productConfig.pushToDataHub,
          lineageTracking: productConfig.lineageTracking
        }
      }
    };
    
    onSave(dataProduct);
  };

  const generateSQLMeshModel = (): string => {
    const modelName = productConfig.name.toLowerCase().replace(/\s+/g, '_');
    const modelType = productConfig.modelType.toLowerCase();
    
    return `MODEL (
  name ${modelName},
  kind ${modelType},
  owner '${productConfig.owner}',
  cron '${productConfig.schedule}',
  description '${productConfig.description}'
);

-- Pipeline-generated SQL with ${pipeline.stages.length} transformation stages
${pipeline.finalSQL || pipeline.baseQuery}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Save Pipeline as Data Product</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Transform your pipeline into a reusable, scheduled data product
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={productConfig.name}
                  onChange={(e) => setProductConfig({ ...productConfig, name: e.target.value })}
                  placeholder="e.g., Customer Churn Analysis"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={productConfig.description}
                  onChange={(e) => setProductConfig({ ...productConfig, description: e.target.value })}
                  placeholder="Describe the purpose and value of this data product..."
                  className={errors.description ? 'border-destructive' : ''}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-xs text-destructive mt-1">{errors.description}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="owner">Owner *</Label>
                <Input
                  id="owner"
                  value={productConfig.owner}
                  onChange={(e) => setProductConfig({ ...productConfig, owner: e.target.value })}
                  placeholder="team-name or email"
                  className={errors.owner ? 'border-destructive' : ''}
                />
                {errors.owner && (
                  <p className="text-xs text-destructive mt-1">{errors.owner}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedule">Schedule</Label>
                  <select
                    id="schedule"
                    value={productConfig.schedule}
                    onChange={(e) => setProductConfig({ ...productConfig, schedule: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="@hourly">Hourly</option>
                    <option value="@daily">Daily</option>
                    <option value="@weekly">Weekly</option>
                    <option value="0 */6 * * *">Every 6 hours</option>
                    <option value="0 0 * * 1">Weekly (Monday)</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="modelType">Model Type</Label>
                  <select
                    id="modelType"
                    value={productConfig.modelType}
                    onChange={(e) => setProductConfig({ 
                      ...productConfig, 
                      modelType: e.target.value as 'TABLE' | 'INCREMENTAL' | 'VIEW'
                    })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="TABLE">Table (Full refresh)</option>
                    <option value="INCREMENTAL">Incremental</option>
                    <option value="VIEW">View</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button size="sm" onClick={handleAddTag}>Add</Button>
                </div>
                {productConfig.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {productConfig.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">Push to DataHub</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={productConfig.pushToDataHub}
                    onChange={(e) => setProductConfig({
                      ...productConfig,
                      pushToDataHub: e.target.checked
                    })}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm">Enable Lineage Tracking</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={productConfig.lineageTracking}
                    onChange={(e) => setProductConfig({
                      ...productConfig,
                      lineageTracking: e.target.checked
                    })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>
            
            {/* Right Column - Pipeline Summary */}
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3">Pipeline Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Base Query:</span>
                    <Badge variant="outline">{pipeline.metadata?.dataSources?.[0] || 'Source'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pipeline Stages:</span>
                    <span>{pipeline.stages.length}</span>
                  </div>
                  
                  {/* Stage breakdown */}
                  {pipeline.stages.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {pipeline.stages.map((stage, idx) => (
                        <div key={stage.id} className="flex items-center gap-2 text-xs">
                          <Badge variant="secondary" className="w-6 h-6 p-0 justify-center">
                            {idx + 1}
                          </Badge>
                          <span className="flex-1">{stage.name}</span>
                          <span className="text-muted-foreground">
                            {stage.rules.length} rule{stage.rules.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  SQLMesh Model Preview
                </h3>
                <div className="bg-muted/30 rounded-md p-3 max-h-[300px] overflow-auto">
                  <code className="text-xs font-mono text-green-600 whitespace-pre">
                    {generateSQLMeshModel()}
                  </code>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              Create Data Product
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};