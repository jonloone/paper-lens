'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, ArrowLeft, Search, Database, Table as TableIcon, Eye } from 'lucide-react';
import { fetchSources } from '@/lib/api/build-api';

// Source metadata from DataHub
export interface Source {
  id: string;                // DataHub URN
  name: string;
  schema: string;
  database: string;
  qualityScore: number;
  rowCount: number;
  columns: ColumnMetadata[];
  lastUpdated: string;
  description?: string;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  description?: string;
}

export interface Step2Data {
  selectedSources: Source[];
}

interface Step2SelectSourcesProps {
  initialData?: Partial<Step2Data>;
  onComplete: (data: Step2Data) => void;
  onBack: () => void;
}

export function Step2SelectSources({ initialData, onComplete, onBack }: Step2SelectSourcesProps) {
  const [selectedSources, setSelectedSources] = useState<Source[]>(
    initialData?.selectedSources || []
  );
  const [availableSources, setAvailableSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewSource, setPreviewSource] = useState<Source | null>(null);

  // Fetch available sources from DataHub on mount and when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAvailableSources();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function fetchAvailableSources() {
    setIsLoading(true);
    try {
      // Call real backend API
      const data = await fetchSources({ search: searchQuery });
      setAvailableSources(data.sources);
    } catch (error) {
      console.error('Error fetching sources:', error);
      // Fallback to mock data on error
      const mockSources: Source[] = [
        {
          id: 'urn:li:dataset:(urn:li:dataPlatform:iceberg,analytics.customer_360,PROD)',
          name: 'customer_360',
          schema: 'analytics',
          database: 'iceberg_prod',
          qualityScore: 98,
          rowCount: 2500000,
          lastUpdated: '2 hours ago',
          description: 'Unified customer profile with demographics and behavior',
          columns: [
            { name: 'customer_id', type: 'string', description: 'Unique customer identifier' },
            { name: 'email', type: 'string', description: 'Customer email address' },
            { name: 'signup_date', type: 'date', description: 'Account creation date' },
            { name: 'total_revenue', type: 'decimal', description: 'Lifetime revenue' },
            { name: 'last_activity', type: 'timestamp', description: 'Last product interaction' }
          ]
        },
        {
          id: 'urn:li:dataset:(urn:li:dataPlatform:iceberg,support.tickets,PROD)',
          name: 'support_tickets',
          schema: 'support',
          database: 'iceberg_prod',
          qualityScore: 92,
          rowCount: 450000,
          lastUpdated: 'Hourly',
          description: 'Customer support tickets and resolutions',
          columns: [
            { name: 'ticket_id', type: 'string', description: 'Unique ticket ID' },
            { name: 'customer_id', type: 'string', description: 'Customer who created ticket' },
            { name: 'created_at', type: 'timestamp', description: 'Ticket creation time' },
            { name: 'resolved_at', type: 'timestamp', description: 'Ticket resolution time' },
            { name: 'resolution_time_hours', type: 'decimal', description: 'Time to resolve' }
          ]
        },
        {
          id: 'urn:li:dataset:(urn:li:dataPlatform:iceberg,sales.orders,PROD)',
          name: 'order_history',
          schema: 'sales',
          database: 'iceberg_prod',
          qualityScore: 95,
          rowCount: 12000000,
          lastUpdated: 'Real-time',
          description: 'All customer orders and transactions',
          columns: [
            { name: 'order_id', type: 'string', description: 'Unique order ID' },
            { name: 'customer_id', type: 'string', description: 'Customer who placed order' },
            { name: 'order_date', type: 'timestamp', description: 'Order placement time' },
            { name: 'total', type: 'decimal', description: 'Order total amount' },
            { name: 'status', type: 'string', description: 'Order status' }
          ]
        }
      ];
      setAvailableSources(mockSources);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSource(source: Source) {
    const isSelected = selectedSources.some(s => s.id === source.id);
    if (isSelected) {
      setSelectedSources(selectedSources.filter(s => s.id !== source.id));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  }

  function isSourceSelected(sourceId: string): boolean {
    return selectedSources.some(s => s.id === sourceId);
  }

  const filteredSources = availableSources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isValid = selectedSources.length > 0;

  function handleContinue() {
    if (isValid) {
      onComplete({ selectedSources });
    }
  }

  // Calculate estimated metrics
  const totalRows = selectedSources.reduce((sum, s) => sum + s.rowCount, 0);
  const estimatedOutputSize = Math.round(totalRows * 0.1 / 1024); // Assuming 10:1 aggregation, rough estimate

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Select Source Data</h2>
        <p className="text-muted-foreground text-lg">
          Choose the source data for your transformation.
        </p>
      </div>

      {/* Selection Status */}
      {selectedSources.length > 0 ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  {selectedSources.length} table{selectedSources.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  We'll automatically figure out what columns you need from these
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>📊 Estimated Input Size:</p>
                <p className="font-medium">~{(totalRows / 1000000).toFixed(1)}M rows across {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''}</p>
                <p className="text-xs mt-1">💾 Output: ~{estimatedOutputSize}MB compressed</p>
                <p className="text-xs">(assuming 10:1 aggregation)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/30 border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No tables selected yet. Browse and add tables below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Available Sources Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Available Sources Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Available Sources ({filteredSources.length})
            </CardTitle>
            <CardDescription>
              {searchQuery ? 'Search results' : 'All available tables from DataHub'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading sources...
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {filteredSources.map(source => (
                    <Card
                      key={source.id}
                      className={`cursor-pointer transition-colors ${
                        isSourceSelected(source.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <TableIcon className="w-4 h-4" />
                              <h3 className="font-semibold">{source.name}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {source.schema}.{source.name}
                            </p>
                            {source.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {source.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                              <span>Quality: {source.qualityScore}%</span>
                              <span>•</span>
                              <span>{(source.rowCount / 1000000).toFixed(1)}M rows</span>
                              <span>•</span>
                              <span>{source.lastUpdated}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewSource(source);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={isSourceSelected(source.id) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleSource(source)}
                            >
                              {isSourceSelected(source.id) ? 'Remove' : '+ Add'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredSources.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No sources found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Selected Sources Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Selected Sources ({selectedSources.length})
            </CardTitle>
            <CardDescription>
              Tables you've chosen for this data product
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sources selected yet
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {selectedSources.map((source, index) => (
                    <Card key={source.id} className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {index + 1}
                              </Badge>
                              <h3 className="font-semibold">{source.name}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {source.schema}.{source.name}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{(source.rowCount / 1000000).toFixed(1)}M rows</span>
                              <span>•</span>
                              <span>{source.lastUpdated}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewSource(source)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSource(source)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schema Preview Dialog */}
      <Dialog open={!!previewSource} onOpenChange={(open) => !open && setPreviewSource(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Schema Preview: {previewSource?.name}</DialogTitle>
          </DialogHeader>
          {previewSource && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Full Path</Label>
                  <p className="text-muted-foreground">
                    {previewSource.database}.{previewSource.schema}.{previewSource.name}
                  </p>
                </div>
                <div>
                  <Label>Quality Score</Label>
                  <p className="text-muted-foreground">{previewSource.qualityScore}%</p>
                </div>
                <div>
                  <Label>Row Count</Label>
                  <p className="text-muted-foreground">
                    {previewSource.rowCount.toLocaleString()} rows
                  </p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-muted-foreground">{previewSource.lastUpdated}</p>
                </div>
              </div>

              {previewSource.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {previewSource.description}
                  </p>
                </div>
              )}

              <div>
                <Label className="mb-3 block">Columns ({previewSource.columns.length})</Label>
                <ScrollArea className="h-[300px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th className="text-left p-2">Column</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewSource.columns.map(col => (
                        <tr key={col.name} className="border-b">
                          <td className="p-2 font-mono text-xs">{col.name}</td>
                          <td className="p-2 text-xs">
                            <Badge variant="secondary">{col.type}</Badge>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {col.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewSource(null)}>
                  Close
                </Button>
                {!isSourceSelected(previewSource.id) && (
                  <Button
                    onClick={() => {
                      toggleSource(previewSource);
                      setPreviewSource(null);
                    }}
                  >
                    Add to Selection
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Product Definition
        </Button>
        <Button onClick={handleContinue} disabled={!isValid} size="lg" className="min-w-[200px]">
          Continue to Transform
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
