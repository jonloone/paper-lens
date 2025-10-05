'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronRight,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Layers,
  TrendingUp
} from 'lucide-react';
import { fetchIcebergSources, previewSourceData } from '@/lib/services/data-sources';
import { cn } from '@/lib/utils';

interface DataSource {
  id: string;
  name: string;
  type: string;
  schema: string;
  table: string;
  recordCount: number;
  sizeBytes: number;
  lastUpdated: string;
  partitions?: string[];
  quality: {
    score: number;
    completeness: number;
    freshness: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'stale';
  };
  health: 'healthy' | 'degraded' | 'unhealthy';
  columns?: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
}

interface DataDiscoveryStepProps {
  workflowData: any;
  onComplete: (data: any) => void;
  uiConfig?: any;
}

export function DataDiscoveryStep({ workflowData, onComplete, uiConfig }: DataDiscoveryStepProps) {
  const [availableSources, setAvailableSources] = useState<DataSource[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(
    workflowData.selectedSources?.map((s: any) => s.id) || []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);

  // Fetch real Iceberg data sources
  useEffect(() => {
    const loadSources = async () => {
      setIsLoading(true);
      try {
        const sources = await fetchIcebergSources();
        setAvailableSources(sources);
      } catch (error) {
        console.error('Failed to fetch Iceberg sources:', error);
        // Fallback to demo data for development
        setAvailableSources([
          {
            id: 'catalog.sales.transactions',
            name: 'Customer Transactions',
            type: 'iceberg',
            schema: 'sales',
            table: 'transactions',
            recordCount: 2347392,
            sizeBytes: 5368709120,
            lastUpdated: new Date(Date.now() - 3600000).toISOString(),
            partitions: ['date', 'region'],
            quality: { score: 97, completeness: 98, freshness: 'daily' },
            health: 'healthy',
            columns: [
              { name: 'transaction_id', type: 'string', nullable: false },
              { name: 'customer_id', type: 'string', nullable: false },
              { name: 'amount', type: 'decimal', nullable: false },
              { name: 'date', type: 'date', nullable: false },
              { name: 'region', type: 'string', nullable: true }
            ]
          },
          {
            id: 'catalog.marketing.attribution',
            name: 'Marketing Attribution',
            type: 'iceberg',
            schema: 'marketing',
            table: 'attribution',
            recordCount: 847293,
            sizeBytes: 1073741824,
            lastUpdated: new Date(Date.now() - 86400000).toISOString(),
            partitions: ['campaign_date'],
            quality: { score: 89, completeness: 92, freshness: 'weekly' },
            health: 'healthy',
            columns: [
              { name: 'attribution_id', type: 'string', nullable: false },
              { name: 'campaign_id', type: 'string', nullable: false },
              { name: 'channel', type: 'string', nullable: false },
              { name: 'conversions', type: 'bigint', nullable: false },
              { name: 'campaign_date', type: 'date', nullable: false }
            ]
          },
          {
            id: 'catalog.product.usage_metrics',
            name: 'Product Usage Metrics',
            type: 'iceberg',
            schema: 'product',
            table: 'usage_metrics',
            recordCount: 50000000,
            sizeBytes: 10737418240,
            lastUpdated: new Date().toISOString(),
            partitions: ['event_date', 'product_id'],
            quality: { score: 94, completeness: 96, freshness: 'real-time' },
            health: 'healthy',
            columns: [
              { name: 'event_id', type: 'string', nullable: false },
              { name: 'user_id', type: 'string', nullable: false },
              { name: 'product_id', type: 'string', nullable: false },
              { name: 'event_type', type: 'string', nullable: false },
              { name: 'event_date', type: 'timestamp', nullable: false }
            ]
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSources();
  }, []);

  const handleSourceToggle = (sourceId: string) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handlePreview = async (sourceId: string) => {
    setLoadingPreview(sourceId);
    try {
      const data = await previewSourceData(sourceId);
      setPreviewData(prev => ({ ...prev, [sourceId]: data }));
    } catch (error) {
      console.error('Failed to preview data:', error);
      // Mock preview data
      setPreviewData(prev => ({
        ...prev,
        [sourceId]: {
          sample: [
            { id: 1, value: 'Sample row 1' },
            { id: 2, value: 'Sample row 2' },
            { id: 3, value: 'Sample row 3' }
          ],
          schema: availableSources.find(s => s.id === sourceId)?.columns
        }
      }));
    } finally {
      setLoadingPreview(null);
    }
  };

  const handleContinue = () => {
    const selected = availableSources.filter(s => selectedSources.includes(s.id));
    onComplete({ selectedSources: selected });
  };

  const filteredSources = availableSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.schema.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || source.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'real-time':
        return 'text-green-600 bg-green-100';
      case 'daily':
        return 'text-blue-600 bg-blue-100';
      case 'weekly':
        return 'text-yellow-600 bg-yellow-100';
      case 'monthly':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Step 1: Data Discovery</h2>
        <p className="text-muted-foreground">
          Select Iceberg tables to include in your data product. Choose sources based on quality, freshness, and business requirements.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or schema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Source Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredSources.map((source) => (
            <Card
              key={source.id}
              className={cn(
                "transition-all duration-200",
                selectedSources.includes(source.id) && "ring-2 ring-primary"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={() => handleSourceToggle(source.id)}
                    />
                    <div>
                      <CardTitle className="text-base">{source.name}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {source.schema}.{source.table}
                      </div>
                    </div>
                  </div>
                  {getHealthIcon(source.health)}
                </div>
              </CardHeader>
              <CardContent>
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Records</div>
                    <div className="font-medium">{source.recordCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Size</div>
                    <div className="font-medium">{formatBytes(source.sizeBytes)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Quality Score</div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{source.quality.score}%</span>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Last Updated</div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(source.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    <Database className="w-3 h-3 mr-1" />
                    Iceberg
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", getFreshnessColor(source.quality.freshness))}
                  >
                    {source.quality.freshness}
                  </Badge>
                  {source.partitions && (
                    <Badge variant="secondary" className="text-xs">
                      <Layers className="w-3 h-3 mr-1" />
                      Partitioned
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(source.id)}
                    disabled={loadingPreview === source.id}
                  >
                    {loadingPreview === source.id ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Eye className="w-3 h-3 mr-1" />
                    )}
                    Preview
                  </Button>
                </div>

                {/* Preview Data */}
                {previewData[source.id] && (
                  <Alert className="mt-3">
                    <AlertDescription>
                      <div className="text-xs font-mono">
                        {JSON.stringify(previewData[source.id].sample?.[0] || {}, null, 2).slice(0, 150)}...
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selection Summary */}
      {selectedSources.length > 0 && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>{selectedSources.length} source{selectedSources.length > 1 ? 's' : ''} selected</strong>
            {' - '}
            Total records: {filteredSources
              .filter(s => selectedSources.includes(s.id))
              .reduce((sum, s) => sum + s.recordCount, 0)
              .toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={selectedSources.length === 0}
          size="lg"
        >
          Continue to Quality Analysis
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}