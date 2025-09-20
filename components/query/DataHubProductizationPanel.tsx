'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package,
  Shield,
  Users,
  Database,
  FileText,
  Settings,
  Sparkles,
  AlertCircle,
  Check,
  ChevronRight,
  Lock,
  Calendar,
  RefreshCw,
  Info,
  Tag
} from 'lucide-react';
import type { DataHubContext, BusinessRule } from '@/lib/services/DataHubContextService';
import { rulesEngine } from '@/lib/services/DataHubRulesEngine';

interface DataHubProductizationPanelProps {
  query: string;
  queryResult: any;
  dataHubContext: DataHubContext;
  appliedRules: BusinessRule[];
  onProductize: (config: ProductConfig) => void;
  onClose?: () => void;
}

interface ProductConfig {
  name: string;
  description: string;
  category: string;
  tags: string[];
  owners: string[];
  schedule?: string;
  governance: {
    piiHandling: 'mask' | 'filter' | 'none';
    qualityThreshold: number;
    retention: string;
    accessControl: 'public' | 'internal' | 'restricted';
  };
  dataHubIntegration: {
    pushToDataHub: boolean;
    syncFrequency: string;
    qualityMonitoring: boolean;
    lineageTracking: boolean;
  };
  businessContext: {
    glossaryTerms: string[];
    kpis: string[];
    dependencies: string[];
  };
}

interface GovernanceCheck {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  required: boolean;
}

export function DataHubProductizationPanel({
  query,
  queryResult,
  dataHubContext,
  appliedRules,
  onProductize,
  onClose
}: DataHubProductizationPanelProps) {
  const [productConfig, setProductConfig] = useState<ProductConfig>({
    name: '',
    description: '',
    category: 'analytics',
    tags: [],
    owners: [dataHubContext.owner || 'data-team'],
    schedule: 'daily',
    governance: {
      piiHandling: dataHubContext.piiFields.length > 0 ? 'mask' : 'none',
      qualityThreshold: 80,
      retention: '90 days',
      accessControl: dataHubContext.piiFields.length > 0 ? 'restricted' : 'internal'
    },
    dataHubIntegration: {
      pushToDataHub: true,
      syncFrequency: 'realtime',
      qualityMonitoring: true,
      lineageTracking: true
    },
    businessContext: {
      glossaryTerms: dataHubContext.glossaryTerms.map(t => t.name),
      kpis: [],
      dependencies: dataHubContext.upstreamDatasets || []
    }
  });

  const [activeTab, setActiveTab] = useState('metadata');
  const [newTag, setNewTag] = useState('');

  // Run governance checks
  const governanceChecks: GovernanceCheck[] = [
    {
      id: 'pii-check',
      name: 'PII Protection',
      status: dataHubContext.piiFields.length === 0 || productConfig.governance.piiHandling !== 'none' ? 'pass' : 'fail',
      message: dataHubContext.piiFields.length > 0 
        ? `${dataHubContext.piiFields.length} PII fields detected - ${productConfig.governance.piiHandling} applied`
        : 'No PII fields detected',
      required: true
    },
    {
      id: 'quality-check',
      name: 'Data Quality',
      status: dataHubContext.qualityScore >= productConfig.governance.qualityThreshold ? 'pass' : 'warning',
      message: `Quality score: ${dataHubContext.qualityScore}% (threshold: ${productConfig.governance.qualityThreshold}%)`,
      required: false
    },
    {
      id: 'ownership-check',
      name: 'Ownership Defined',
      status: productConfig.owners.length > 0 ? 'pass' : 'fail',
      message: productConfig.owners.length > 0 ? `Owned by: ${productConfig.owners.join(', ')}` : 'No owner assigned',
      required: true
    },
    {
      id: 'documentation-check',
      name: 'Documentation',
      status: productConfig.description.length > 20 ? 'pass' : 'warning',
      message: productConfig.description.length > 20 ? 'Documentation provided' : 'Add detailed description',
      required: false
    },
    {
      id: 'lineage-check',
      name: 'Lineage Tracking',
      status: productConfig.dataHubIntegration.lineageTracking ? 'pass' : 'warning',
      message: productConfig.dataHubIntegration.lineageTracking ? 'Lineage will be tracked in DataHub' : 'Consider enabling lineage',
      required: false
    }
  ];

  const allRequiredPass = governanceChecks.filter(c => c.required).every(c => c.status === 'pass');

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

  const handleProductize = () => {
    if (allRequiredPass && productConfig.name) {
      onProductize(productConfig);
    }
  };

  return (
    <Card className="w-full max-w-5xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Create Data Product with DataHub</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Transform your query into a governed, reusable data product
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dataHubContext.hasContext && (
            <Badge variant="outline" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              DataHub Connected
            </Badge>
          )}
          {appliedRules.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              {appliedRules.length} rules applied
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metadata">
              <Package className="h-4 w-4 mr-2" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="governance">
              <Shield className="h-4 w-4 mr-2" />
              Governance
            </TabsTrigger>
            <TabsTrigger value="datahub">
              <Database className="h-4 w-4 mr-2" />
              DataHub
            </TabsTrigger>
            <TabsTrigger value="review">
              <FileText className="h-4 w-4 mr-2" />
              Review
            </TabsTrigger>
          </TabsList>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={productConfig.name}
                  onChange={(e) => setProductConfig({ ...productConfig, name: e.target.value })}
                  placeholder="e.g., Customer Churn Analysis"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={productConfig.description}
                  onChange={(e) => setProductConfig({ ...productConfig, description: e.target.value })}
                  placeholder="Describe the purpose and value of this data product..."
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={productConfig.category}
                  onChange={(e) => setProductConfig({ ...productConfig, category: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="analytics">Analytics</option>
                  <option value="ml-feature">ML Feature</option>
                  <option value="reporting">Reporting</option>
                  <option value="operational">Operational</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {productConfig.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
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

              <div>
                <Label>Owners</Label>
                <Input
                  value={productConfig.owners.join(', ')}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    owners: e.target.value.split(',').map(o => o.trim())
                  })}
                  placeholder="team-name, user-email"
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="space-y-4 mt-4">
            <div className="space-y-3">
              {dataHubContext.piiFields.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">PII Detected</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Fields: {dataHubContext.piiFields.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>PII Handling</Label>
                <select
                  value={productConfig.governance.piiHandling}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    governance: {
                      ...productConfig.governance,
                      piiHandling: e.target.value as 'mask' | 'filter' | 'none'
                    }
                  })}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="mask">Mask PII Fields</option>
                  <option value="filter">Filter PII Fields</option>
                  <option value="none">No PII Handling</option>
                </select>
              </div>

              <div>
                <Label>Quality Threshold (%)</Label>
                <Input
                  type="number"
                  value={productConfig.governance.qualityThreshold}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    governance: {
                      ...productConfig.governance,
                      qualityThreshold: parseInt(e.target.value)
                    }
                  })}
                  min="0"
                  max="100"
                  className="mt-1"
                />
                {dataHubContext.qualityScore < productConfig.governance.qualityThreshold && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Current quality ({dataHubContext.qualityScore}%) is below threshold
                  </p>
                )}
              </div>

              <div>
                <Label>Data Retention</Label>
                <select
                  value={productConfig.governance.retention}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    governance: {
                      ...productConfig.governance,
                      retention: e.target.value
                    }
                  })}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="7 days">7 days</option>
                  <option value="30 days">30 days</option>
                  <option value="90 days">90 days</option>
                  <option value="1 year">1 year</option>
                  <option value="indefinite">Indefinite</option>
                </select>
              </div>

              <div>
                <Label>Access Control</Label>
                <select
                  value={productConfig.governance.accessControl}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    governance: {
                      ...productConfig.governance,
                      accessControl: e.target.value as 'public' | 'internal' | 'restricted'
                    }
                  })}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>

              <div>
                <Label>Refresh Schedule</Label>
                <select
                  value={productConfig.schedule}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    schedule: e.target.value
                  })}
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
          </TabsContent>

          {/* DataHub Integration Tab */}
          <TabsContent value="datahub" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Push to DataHub</p>
                  <p className="text-xs text-muted-foreground">Register this product in DataHub catalog</p>
                </div>
                <input
                  type="checkbox"
                  checked={productConfig.dataHubIntegration.pushToDataHub}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    dataHubIntegration: {
                      ...productConfig.dataHubIntegration,
                      pushToDataHub: e.target.checked
                    }
                  })}
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Quality Monitoring</p>
                  <p className="text-xs text-muted-foreground">Track quality metrics in DataHub</p>
                </div>
                <input
                  type="checkbox"
                  checked={productConfig.dataHubIntegration.qualityMonitoring}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    dataHubIntegration: {
                      ...productConfig.dataHubIntegration,
                      qualityMonitoring: e.target.checked
                    }
                  })}
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Lineage Tracking</p>
                  <p className="text-xs text-muted-foreground">Maintain upstream/downstream lineage</p>
                </div>
                <input
                  type="checkbox"
                  checked={productConfig.dataHubIntegration.lineageTracking}
                  onChange={(e) => setProductConfig({
                    ...productConfig,
                    dataHubIntegration: {
                      ...productConfig.dataHubIntegration,
                      lineageTracking: e.target.checked
                    }
                  })}
                  className="h-4 w-4"
                />
              </div>

              {dataHubContext.glossaryTerms.length > 0 && (
                <div>
                  <Label>Linked Glossary Terms</Label>
                  <div className="mt-2 space-y-2">
                    {dataHubContext.glossaryTerms.map(term => (
                      <div key={term.urn} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={productConfig.businessContext.glossaryTerms.includes(term.name)}
                          onChange={(e) => {
                            const terms = e.target.checked
                              ? [...productConfig.businessContext.glossaryTerms, term.name]
                              : productConfig.businessContext.glossaryTerms.filter(t => t !== term.name);
                            setProductConfig({
                              ...productConfig,
                              businessContext: {
                                ...productConfig.businessContext,
                                glossaryTerms: terms
                              }
                            });
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{term.name}</p>
                          {term.description && (
                            <p className="text-xs text-muted-foreground">{term.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dataHubContext.upstreamDatasets && dataHubContext.upstreamDatasets.length > 0 && (
                <div>
                  <Label>Upstream Dependencies</Label>
                  <div className="mt-2 p-3 rounded-lg bg-muted">
                    {dataHubContext.upstreamDatasets.map(dataset => (
                      <div key={dataset} className="text-xs font-mono">
                        {dataset}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-3">Governance Checks</h4>
                <div className="space-y-2">
                  {governanceChecks.map(check => (
                    <div key={check.id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {check.status === 'pass' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : check.status === 'warning' ? (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {check.name}
                            {check.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{check.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <h4 className="text-sm font-semibold mb-2">Product Summary</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{productConfig.name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{productConfig.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner:</span>
                    <span>{productConfig.owners.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span>{productConfig.schedule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PII Handling:</span>
                    <span>{productConfig.governance.piiHandling}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Access:</span>
                    <span>{productConfig.governance.accessControl}</span>
                  </div>
                  {appliedRules.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Applied Rules:</span>
                      <span>{appliedRules.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {!allRequiredPass && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Required Checks Failed</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Please address all required governance checks before proceeding
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProductize}
                  disabled={!allRequiredPass || !productConfig.name}
                  className="flex-1"
                >
                  Create Data Product
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}