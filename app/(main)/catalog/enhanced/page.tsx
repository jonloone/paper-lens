'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Table,
  Search,
  Filter,
  ChevronRight,
  Users,
  Shield,
  Clock,
  TrendingUp,
  FileText,
  Plus,
  Star,
  GitBranch,
  Eye,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Activity,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Info,
  FileCheck,
  Sparkles,
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { enhancedDataHubClient, EnhancedDatasetMetadata } from '@/lib/services/EnhancedDataHubClient';
import { cn } from '@/lib/utils';
import { PortalNameDisplay } from '@/components/portal/PortalNameDisplay';
import { useViewMode } from '@/contexts/ViewModeContext';

export default function EnhancedCatalogPage() {
  const { viewMode } = useViewMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<EnhancedDatasetMetadata | null>(null);
  const [datasets, setDatasets] = useState<EnhancedDatasetMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadEnhancedCatalog();
  }, []);

  const loadEnhancedCatalog = async () => {
    setLoading(true);
    try {
      // For demo, load a few datasets with enhanced metadata
      const datasetIds = [
        'analytics.customer_360',
        'mart.revenue_summary',
        'staging.product_catalog'
      ];
      
      const enhancedDatasets = await Promise.all(
        datasetIds.map(id => enhancedDataHubClient.getEnhancedMetadata(id))
      );
      
      setDatasets(enhancedDatasets);
      if (enhancedDatasets.length > 0) {
        setSelectedDataset(enhancedDatasets[0]);
      }
    } catch (error) {
      console.error('Failed to load enhanced catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'degrading') => {
    switch (trend) {
      case 'improving':
        return <ArrowUp className="h-3 w-3 text-green-600" />;
      case 'degrading':
        return <ArrowDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Dataset List */}
      <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Data Catalog++</h2>
          <p className="text-sm text-muted-foreground">
            Enhanced with business context, rules, and quality
          </p>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          {datasets.map((dataset) => (
            <Card
              key={dataset.technical.dataset}
              className={cn(
                "cursor-pointer transition-colors",
                selectedDataset?.technical.dataset === dataset.technical.dataset
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setSelectedDataset(dataset)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <PortalNameDisplay
                      entity={{
                        businessName: dataset.business.businessName,
                        technicalId: dataset.technical.dataset,
                        type: 'dataset'
                      }}
                      viewMode={viewMode}
                      variant="compact"
                      showCopy={false}
                    />
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {dataset.technical.platform}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {dataset.business.purpose}
                </p>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Activity className={cn("h-3 w-3", getQualityColor(dataset.quality.completeness))} />
                    <span>{(dataset.quality.completeness * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{dataset.usage.uniqueUsers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className={cn("h-3 w-3", 
                      dataset.compliance.classification === 'restricted' ? 'text-red-600' :
                      dataset.compliance.classification === 'confidential' ? 'text-orange-600' :
                      'text-green-600'
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Panel - Dataset Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedDataset ? (
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <PortalNameDisplay
                    entity={{
                      businessName: selectedDataset.business.businessName,
                      technicalId: selectedDataset.technical.dataset,
                      type: 'dataset'
                    }}
                    viewMode={viewMode}
                    variant="header"
                  />
                  <p className="text-muted-foreground mt-2">
                    {selectedDataset.business.purpose}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in DataHub
                  </Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </div>

              {/* Key Metrics Bar */}
              <div className="grid grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Quality Score</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-semibold", getQualityColor(selectedDataset.quality.completeness))}>
                      {(selectedDataset.quality.completeness * 100).toFixed(0)}%
                    </span>
                    {getTrendIcon(selectedDataset.quality.trend)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usage</p>
                  <p className="text-2xl font-semibold">{selectedDataset.usage.queryCount}</p>
                  <p className="text-xs">queries/month</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Freshness</p>
                  <p className="text-sm font-semibold">{selectedDataset.business.sla?.freshness || 'N/A'}</p>
                  <p className="text-xs text-green-600">✓ Meeting SLA</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Classification</p>
                  <Badge className={cn("mt-1", 
                    selectedDataset.compliance.classification === 'restricted' ? 'bg-red-100 text-red-800' :
                    selectedDataset.compliance.classification === 'confidential' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  )}>
                    {selectedDataset.compliance.classification}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rules</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600">
                      {selectedDataset.rules.filter(r => r.evaluationResults?.[0]?.status === 'passed').length}
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-sm font-semibold">
                      {selectedDataset.rules.length}
                    </span>
                    <span className="text-xs text-muted-foreground">passing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schema">Schema & Fields</TabsTrigger>
                <TabsTrigger value="rules">
                  Rules & Contracts
                  {selectedDataset.rules.some(r => r.evaluationResults?.[0]?.status === 'failed') && (
                    <Badge variant="destructive" className="ml-2 h-4 px-1">
                      {selectedDataset.rules.filter(r => r.evaluationResults?.[0]?.status === 'failed').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="lineage">Lineage</TabsTrigger>
                <TabsTrigger value="usage">Usage & Access</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Business Context */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Business Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{selectedDataset.business.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data Product</p>
                        <p className="font-medium">{selectedDataset.business.dataProduct || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Business Value</p>
                        <p className="font-medium">
                          ${(selectedDataset.business.monetaryValue || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Criticality</p>
                        <Badge variant={selectedDataset.business.usageFrequency === 'critical' ? 'destructive' : 'default'}>
                          {selectedDataset.business.usageFrequency}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Stakeholders</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDataset.business.stakeholders.map(stakeholder => (
                          <Badge key={stakeholder} variant="outline">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {selectedDataset.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-600" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedDataset.recommendations.map((rec, idx) => (
                        <Alert key={idx} className="relative">
                          <div className="flex items-start gap-3">
                            <div className={cn("p-1 rounded",
                              rec.type === 'optimization' ? 'bg-blue-100' :
                              rec.type === 'quality' ? 'bg-yellow-100' :
                              rec.type === 'governance' ? 'bg-purple-100' :
                              'bg-gray-100'
                            )}>
                              {rec.type === 'optimization' ? <Zap className="h-4 w-4 text-blue-600" /> :
                               rec.type === 'quality' ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
                               rec.type === 'governance' ? <Shield className="h-4 w-4 text-purple-600" /> :
                               <Info className="h-4 w-4 text-gray-600" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{rec.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                              {rec.actions && rec.actions.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {rec.actions.map((action, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                      <ChevronRight className="h-3 w-3" />
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className={cn(
                                rec.impact === 'high' ? 'border-red-300 text-red-700' :
                                rec.impact === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                'border-blue-300 text-blue-700'
                              )}>
                                {rec.impact} impact
                              </Badge>
                              {rec.automatable && (
                                <Button size="sm" variant="outline">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Automate
                                </Button>
                              )}
                            </div>
                          </div>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Technical Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Technical Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Platform</p>
                        <p className="font-medium">{selectedDataset.technical.platform}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Format</p>
                        <p className="font-medium">{selectedDataset.technical.format || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Size</p>
                        <p className="font-medium">{selectedDataset.technical.size}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rows</p>
                        <p className="font-medium">{selectedDataset.technical.rowCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Partitioning</p>
                        <p className="font-medium">{selectedDataset.technical.partitioning || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Modified</p>
                        <p className="font-medium">
                          {new Date(selectedDataset.technical.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schema" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Schema Fields</CardTitle>
                    <CardDescription>
                      {selectedDataset.technical.schema.length} fields with business context
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedDataset.technical.schema.map((field) => (
                        <div key={field.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{field.name}</span>
                              {field.businessName && viewMode !== 'technical' && (
                                <span className="text-sm text-muted-foreground">
                                  ({field.businessName})
                                </span>
                              )}
                              {field.isKey && (
                                <Badge variant="outline" className="text-xs">
                                  KEY
                                </Badge>
                              )}
                              {field.isPII && (
                                <Badge variant="destructive" className="text-xs">
                                  PII
                                </Badge>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {field.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="outline">{field.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {field.nullable ? 'nullable' : 'required'}
                            </span>
                            {field.statistics && (
                              <div className="text-xs text-muted-foreground">
                                {field.statistics.nullCount !== undefined && (
                                  <span>{((field.statistics.nullCount / selectedDataset.technical.rowCount) * 100).toFixed(1)}% null</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Contracts & Assertions</CardTitle>
                    <CardDescription>
                      Rules from DataHub, Great Expectations, and Ranger
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedDataset.rules.map((rule) => {
                        const latestResult = rule.evaluationResults?.[0];
                        return (
                          <div key={rule.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{rule.name}</h4>
                                  <Badge className={getSeverityColor(rule.severity)}>
                                    {rule.severity}
                                  </Badge>
                                  <Badge variant="outline">
                                    {rule.source}
                                  </Badge>
                                  <Badge variant="outline">
                                    {rule.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rule.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {latestResult && (
                                  <div className="flex items-center gap-2">
                                    {latestResult.status === 'passed' ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : latestResult.status === 'failed' ? (
                                      <AlertCircle className="h-5 w-5 text-red-600" />
                                    ) : (
                                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    )}
                                    <span className={cn("text-sm font-medium",
                                      latestResult.status === 'passed' ? 'text-green-600' :
                                      latestResult.status === 'failed' ? 'text-red-600' :
                                      'text-yellow-600'
                                    )}>
                                      {latestResult.status}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {latestResult && latestResult.status === 'failed' && latestResult.suggestion && (
                              <Alert className="mt-2">
                                <AlertDescription className="text-sm">
                                  <strong>Suggestion:</strong> {latestResult.suggestion}
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {rule.recommendations && rule.recommendations.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-1">Recommendations:</p>
                                <ul className="space-y-1">
                                  {rule.recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-xs flex items-center gap-1">
                                      <ChevronRight className="h-3 w-3" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quality Metrics</CardTitle>
                    <CardDescription>
                      Last checked: {new Date(selectedDataset.quality.lastChecked).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries({
                        Completeness: selectedDataset.quality.completeness,
                        Accuracy: selectedDataset.quality.accuracy,
                        Consistency: selectedDataset.quality.consistency,
                        Timeliness: selectedDataset.quality.timeliness,
                        Uniqueness: selectedDataset.quality.uniqueness,
                        Validity: selectedDataset.quality.validity
                      }).map(([metric, value]) => (
                        <div key={metric}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{metric}</span>
                            <span className={cn("text-sm font-medium", getQualityColor(value))}>
                              {(value * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={value * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                    
                    {selectedDataset.quality.issues.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Active Issues</h4>
                        <div className="space-y-2">
                          {selectedDataset.quality.issues.map((issue, idx) => (
                            <Alert key={idx} className={cn(
                              issue.severity === 'critical' ? 'border-red-300' :
                              issue.severity === 'major' ? 'border-yellow-300' :
                              'border-blue-300'
                            )}>
                              <AlertDescription>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{issue.field}: {issue.type}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {issue.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Affects {issue.affectedRows.toLocaleString()} rows
                                    </p>
                                  </div>
                                  <Badge variant={issue.status === 'open' ? 'destructive' : 'default'}>
                                    {issue.status}
                                  </Badge>
                                </div>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lineage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Lineage</CardTitle>
                    <CardDescription>
                      Upstream sources and downstream consumers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Upstream ({selectedDataset.lineage.upstream.length})</h4>
                      <div className="space-y-2">
                        {selectedDataset.lineage.upstream.map((ref) => (
                          <div key={ref.dataset} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">{ref.dataset}</span>
                              {ref.businessName && (
                                <span className="text-sm text-muted-foreground">
                                  ({ref.businessName})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{ref.platform}</Badge>
                              {ref.criticality && (
                                <Badge variant={ref.criticality === 'critical' ? 'destructive' : 'default'}>
                                  {ref.criticality}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Downstream ({selectedDataset.lineage.downstream.length})</h4>
                      <div className="space-y-2">
                        {selectedDataset.lineage.downstream.map((ref) => (
                          <div key={ref.dataset} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">{ref.dataset}</span>
                              {ref.businessName && (
                                <span className="text-sm text-muted-foreground">
                                  ({ref.businessName})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{ref.platform}</Badge>
                              {ref.criticality && (
                                <Badge variant={ref.criticality === 'critical' ? 'destructive' : 'default'}>
                                  {ref.criticality}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Data Flow</h4>
                      <p className="text-sm font-mono bg-muted p-2 rounded">
                        {selectedDataset.lineage.dataFlow}
                      </p>
                      {selectedDataset.lineage.refreshSchedule && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Refresh: {selectedDataset.lineage.refreshSchedule} | 
                          Last: {selectedDataset.lineage.lastRefresh ? new Date(selectedDataset.lineage.lastRefresh).toLocaleString() : 'N/A'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="usage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Usage & Access Patterns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-semibold">{selectedDataset.usage.queryCount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Queries</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-semibold">{selectedDataset.usage.uniqueUsers}</p>
                        <p className="text-sm text-muted-foreground">Unique Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-semibold">{(selectedDataset.usage.avgQueryTime / 1000).toFixed(1)}s</p>
                        <p className="text-sm text-muted-foreground">Avg Query Time</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Top Users</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDataset.usage.topUsers.map(user => (
                          <Badge key={user} variant="outline">
                            {user}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Common Access Patterns</h4>
                      <div className="space-y-2">
                        {selectedDataset.usage.accessPatterns.map((pattern, idx) => (
                          <div key={idx} className="border rounded p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-mono text-sm">{pattern.pattern}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{pattern.frequency} times</span>
                                  <span>{(pattern.avgResponseTime / 1000).toFixed(1)}s avg</span>
                                </div>
                              </div>
                              {pattern.optimizationPotential && (
                                <Badge variant="outline" className="ml-2">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Optimize
                                </Badge>
                              )}
                            </div>
                            {pattern.optimizationPotential && (
                              <p className="text-xs text-muted-foreground mt-2">
                                💡 {pattern.optimizationPotential}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Compliance & Security</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Classification</span>
                          <Badge className={cn(
                            selectedDataset.compliance.classification === 'restricted' ? 'bg-red-100 text-red-800' :
                            selectedDataset.compliance.classification === 'confidential' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          )}>
                            {selectedDataset.compliance.classification}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">Encryption Required</span>
                          <Badge variant={selectedDataset.compliance.encryptionRequired ? 'default' : 'outline'}>
                            {selectedDataset.compliance.encryptionRequired ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {selectedDataset.compliance.piiFields.length > 0 && (
                          <div className="p-2 border rounded">
                            <p className="text-sm mb-1">PII Fields</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedDataset.compliance.piiFields.map(field => (
                                <Badge key={field} variant="destructive" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedDataset.compliance.regulations.length > 0 && (
                          <div className="p-2 border rounded">
                            <p className="text-sm mb-1">Regulations</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedDataset.compliance.regulations.map(reg => (
                                <Badge key={reg} variant="outline">
                                  {reg}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              {loading ? 'Loading enhanced catalog...' : 'Select a dataset to view details'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}