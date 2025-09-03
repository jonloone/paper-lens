'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Database,
  ChevronRight,
  ChevronDown,
  Table,
  Search,
  Plus,
  Eye,
  GitBranch,
  Shield,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  TrendingUp,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogAsset {
  urn: string;
  platform: 'snowflake' | 'postgres' | 'bigquery' | 's3' | 'kafka';
  database: string;
  schema: string;
  table: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    description?: string;
    tags?: string[];
    pii?: boolean;
    statistics?: {
      nullCount: number;
      distinctCount: number;
      min?: any;
      max?: any;
    };
  }>;
  rowCount: number;
  sizeBytes: number;
  lastModified: Date;
  owner: string;
  documentation?: string;
  glossaryTerms?: string[];
  lineage: {
    upstream: string[];
    downstream: string[];
  };
  governance: {
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    retentionDays: number;
    gdprRelevant: boolean;
  };
}

interface CatalogViewProps {
  onSelectTable?: (table: CatalogAsset) => void;
  onCreateProduct?: (table: CatalogAsset) => void;
}

// Mock data representing DataHub catalog
const mockCatalogData: Record<string, any> = {
  snowflake: {
    production: {
      customer: [
        {
          urn: 'urn:li:dataset:(snowflake,production.customer.master_table,PROD)',
          platform: 'snowflake',
          database: 'production',
          schema: 'customer',
          table: 'master_table',
          columns: [
            { name: 'customer_id', type: 'VARCHAR', nullable: false, pii: false },
            { name: 'email', type: 'VARCHAR', nullable: false, pii: true },
            { name: 'first_name', type: 'VARCHAR', nullable: true, pii: true },
            { name: 'last_name', type: 'VARCHAR', nullable: true, pii: true },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false },
            { name: 'churn_risk_score', type: 'FLOAT', nullable: true },
          ],
          rowCount: 1234567,
          sizeBytes: 536870912,
          lastModified: new Date('2024-11-01'),
          owner: 'data-platform-team',
          documentation: 'Master customer table with all customer attributes and ML-derived scores',
          governance: {
            classification: 'confidential',
            retentionDays: 365,
            gdprRelevant: true,
          },
        },
        {
          urn: 'urn:li:dataset:(snowflake,production.customer.interactions,PROD)',
          platform: 'snowflake',
          database: 'production',
          schema: 'customer',
          table: 'interactions',
          columns: [
            { name: 'interaction_id', type: 'VARCHAR', nullable: false },
            { name: 'customer_id', type: 'VARCHAR', nullable: false },
            { name: 'channel', type: 'VARCHAR', nullable: false },
            { name: 'timestamp', type: 'TIMESTAMP', nullable: false },
            { name: 'sentiment_score', type: 'FLOAT', nullable: true },
          ],
          rowCount: 45678901,
          sizeBytes: 2147483648,
          lastModified: new Date('2024-11-02'),
          owner: 'customer-analytics-team',
          governance: {
            classification: 'internal',
            retentionDays: 90,
            gdprRelevant: false,
          },
        },
      ],
      sales: [
        {
          urn: 'urn:li:dataset:(snowflake,production.sales.transactions,PROD)',
          platform: 'snowflake',
          database: 'production',
          schema: 'sales',
          table: 'transactions',
          columns: [
            { name: 'transaction_id', type: 'VARCHAR', nullable: false },
            { name: 'customer_id', type: 'VARCHAR', nullable: false },
            { name: 'product_id', type: 'VARCHAR', nullable: false },
            { name: 'amount', type: 'DECIMAL', nullable: false },
            { name: 'currency', type: 'VARCHAR', nullable: false },
            { name: 'transaction_date', type: 'DATE', nullable: false },
          ],
          rowCount: 98765432,
          sizeBytes: 4294967296,
          lastModified: new Date('2024-11-03'),
          owner: 'sales-analytics-team',
          governance: {
            classification: 'confidential',
            retentionDays: 730,
            gdprRelevant: false,
          },
        },
      ],
    },
  },
  postgres: {
    analytics: {
      metrics: [
        {
          urn: 'urn:li:dataset:(postgres,analytics.metrics.daily_kpis,PROD)',
          platform: 'postgres',
          database: 'analytics',
          schema: 'metrics',
          table: 'daily_kpis',
          columns: [
            { name: 'date', type: 'DATE', nullable: false },
            { name: 'metric_name', type: 'VARCHAR', nullable: false },
            { name: 'metric_value', type: 'FLOAT', nullable: false },
            { name: 'dimension', type: 'VARCHAR', nullable: true },
          ],
          rowCount: 365000,
          sizeBytes: 134217728,
          lastModified: new Date('2024-11-03'),
          owner: 'bi-team',
          governance: {
            classification: 'internal',
            retentionDays: 180,
            gdprRelevant: false,
          },
        },
      ],
    },
  },
};

export function CatalogView({ onSelectTable, onCreateProduct }: CatalogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<CatalogAsset | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['snowflake']));

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'text-green-600 bg-green-100';
      case 'internal': return 'text-blue-600 bg-blue-100';
      case 'confidential': return 'text-orange-600 bg-orange-100';
      case 'restricted': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[600px]">
      {/* Left Panel - Tree Browser */}
      <Card className="col-span-3 h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">DataHub Catalog</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px] px-4">
            <div className="space-y-1">
              {Object.entries(mockCatalogData).map(([platform, databases]) => (
                <div key={platform}>
                  <button
                    onClick={() => toggleNode(platform)}
                    className="flex items-center gap-2 w-full p-1.5 hover:bg-muted rounded text-sm"
                  >
                    {expandedNodes.has(platform) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <Database className="h-4 w-4" />
                    <span className="font-medium">{platform}</span>
                  </button>
                  
                  {expandedNodes.has(platform) && (
                    <div className="ml-4">
                      {Object.entries(databases).map(([database, schemas]) => (
                        <div key={database}>
                          <button
                            onClick={() => toggleNode(`${platform}.${database}`)}
                            className="flex items-center gap-2 w-full p-1 hover:bg-muted rounded text-sm"
                          >
                            {expandedNodes.has(`${platform}.${database}`) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            <span>{database}</span>
                          </button>
                          
                          {expandedNodes.has(`${platform}.${database}`) && (
                            <div className="ml-4">
                              {Object.entries(schemas).map(([schema, tables]) => (
                                <div key={schema}>
                                  <button
                                    onClick={() => toggleNode(`${platform}.${database}.${schema}`)}
                                    className="flex items-center gap-2 w-full p-1 hover:bg-muted rounded text-sm"
                                  >
                                    {expandedNodes.has(`${platform}.${database}.${schema}`) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                    <span>{schema}</span>
                                  </button>
                                  
                                  {expandedNodes.has(`${platform}.${database}.${schema}`) && (
                                    <div className="ml-4">
                                      {(tables as CatalogAsset[]).map((table) => (
                                        <button
                                          key={table.table}
                                          onClick={() => setSelectedAsset(table)}
                                          className={cn(
                                            "flex items-center gap-2 w-full p-1 hover:bg-muted rounded text-sm",
                                            selectedAsset?.urn === table.urn && "bg-muted"
                                          )}
                                        >
                                          <Table className="h-3 w-3" />
                                          <span>{table.table}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right Panel - Asset Details */}
      <Card className="col-span-9 h-full">
        {selectedAsset ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5" />
                    {selectedAsset.database}.{selectedAsset.schema}.{selectedAsset.table}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedAsset.documentation || 'No documentation available'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onSelectTable?.(selectedAsset)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Use in Query
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onCreateProduct?.(selectedAsset)}>
                    <Package className="h-4 w-4 mr-2" />
                    Create Product
                  </Button>
                  <Button size="sm" variant="outline">
                    <GitBranch className="h-4 w-4 mr-2" />
                    View Lineage
                  </Button>
                </div>
              </div>
              
              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge className={getClassificationColor(selectedAsset.governance.classification)}>
                  {selectedAsset.governance.classification.toUpperCase()}
                </Badge>
                {selectedAsset.governance.gdprRelevant && (
                  <Badge variant="outline" className="text-purple-600">
                    <Shield className="h-3 w-3 mr-1" />
                    GDPR Relevant
                  </Badge>
                )}
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  {selectedAsset.owner}
                </Badge>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  Updated: {new Date(selectedAsset.lastModified).toLocaleDateString()}
                </Badge>
                <Badge variant="outline">
                  <Database className="h-3 w-3 mr-1" />
                  {selectedAsset.rowCount.toLocaleString()} rows
                </Badge>
                <Badge variant="outline">
                  Size: {formatBytes(selectedAsset.sizeBytes)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Schema Table */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Schema</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Column</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Nullable</th>
                          <th className="text-left p-2">Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAsset.columns.map((column, idx) => (
                          <tr key={column.name} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                            <td className="p-2 font-mono">{column.name}</td>
                            <td className="p-2">{column.type}</td>
                            <td className="p-2">
                              {column.nullable ? (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                                  Yes
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1 text-yellow-500" />
                                  No
                                </Badge>
                              )}
                            </td>
                            <td className="p-2">
                              {column.pii && (
                                <Badge variant="outline" className="text-xs text-red-600">
                                  <Lock className="h-3 w-3 mr-1" />
                                  PII
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Governance Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Data Retention</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedAsset.governance.retentionDays} days</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Freshness</span>
                    </div>
                    <p className="text-sm">Updated {new Date(selectedAsset.lastModified).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Platform</span>
                    </div>
                    <p className="text-sm font-mono">{selectedAsset.platform.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a table from the catalog to view details</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}