'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, Search, Database, Table as TableIcon, Key, ChevronDown, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { fetchSources } from '@/lib/api/build-api';
import { cn } from '@/lib/utils';
import { QualityBreakdown, SampleDataPreview as SampleDataType } from '@/lib/types/source-quality';
import { QualityBreakdownCard } from '@/components/build/QualityBreakdownCard';
import { SampleDataPreview } from '@/components/build/SampleDataPreview';

// Source metadata from DataHub (Phase 1: Enhanced with quality and samples)
export interface Source {
  id: string;                // DataHub URN
  name: string;
  schema: string;
  database: string;
  qualityScore: number;      // Legacy - kept for backwards compat
  quality?: QualityBreakdown; // Phase 1: Detailed quality metrics
  sampleData?: SampleDataType; // Phase 1: Sample data preview
  rowCount: number;
  columns: ColumnMetadata[];
  lastUpdated: string;
  description?: string;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  description?: string;
  isPrimaryKey?: boolean;
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
  const [focusedSource, setFocusedSource] = useState<Source | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Fetch available sources from DataHub on mount and when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAvailableSources();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-focus first selected source when selections change
  useEffect(() => {
    if (selectedSources.length > 0 && !focusedSource) {
      setFocusedSource(selectedSources[0]);
    } else if (selectedSources.length === 0) {
      setFocusedSource(null);
    }
  }, [selectedSources.length]);

  async function fetchAvailableSources() {
    setIsLoading(true);
    try {
      // Call real backend API
      const data = await fetchSources({ search: searchQuery });
      setAvailableSources(data.sources);
    } catch (error) {
      console.error('Error fetching sources:', error);
      // Fallback to Phase 1 enhanced mock data on error
      const { mockSourcesPhase1 } = await import('@/lib/data/mock-sources-phase1');
      setAvailableSources(mockSourcesPhase1);
      setIsLoading(false);
      return;
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
            { name: 'customer_id', type: 'string', description: 'Unique customer identifier', isPrimaryKey: true },
            { name: 'email', type: 'string', description: 'Customer email address' },
            { name: 'signup_date', type: 'date', description: 'Account creation date' },
            { name: 'total_revenue', type: 'decimal', description: 'Lifetime revenue' },
            { name: 'last_activity', type: 'timestamp', description: 'Last product interaction' },
            { name: 'country', type: 'string', description: 'Customer country' },
            { name: 'state', type: 'string', description: 'Customer state/region' },
            { name: 'city', type: 'string', description: 'Customer city' },
            { name: 'zipcode', type: 'string', description: 'Postal code' },
            { name: 'account_status', type: 'string', description: 'Active, suspended, or closed' }
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
            { name: 'ticket_id', type: 'string', description: 'Unique ticket ID', isPrimaryKey: true },
            { name: 'customer_id', type: 'string', description: 'Customer who created ticket' },
            { name: 'created_at', type: 'timestamp', description: 'Ticket creation time' },
            { name: 'resolved_at', type: 'timestamp', description: 'Ticket resolution time' },
            { name: 'resolution_time_hours', type: 'decimal', description: 'Time to resolve' },
            { name: 'category', type: 'string', description: 'Issue category' },
            { name: 'priority', type: 'string', description: 'Ticket priority level' },
            { name: 'status', type: 'string', description: 'Current ticket status' }
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
            { name: 'order_id', type: 'string', description: 'Unique order ID', isPrimaryKey: true },
            { name: 'customer_id', type: 'string', description: 'Customer who placed order' },
            { name: 'order_date', type: 'timestamp', description: 'Order placement time' },
            { name: 'total', type: 'decimal', description: 'Order total amount' },
            { name: 'status', type: 'string', description: 'Order status' },
            { name: 'items_count', type: 'integer', description: 'Number of items' },
            { name: 'shipping_method', type: 'string', description: 'Delivery method' },
            { name: 'payment_method', type: 'string', description: 'Payment type' }
          ]
        },
      ];
      setAvailableSources(mockSources);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSource(source: Source) {
    const isSelected = selectedSources.some(s => s.id === source.id);
    if (isSelected) {
      setSelectedSources(selectedSources.filter(s => s.id !== source.id));
      // If we're removing the focused source, focus on another
      if (focusedSource?.id === source.id) {
        const remaining = selectedSources.filter(s => s.id !== source.id);
        setFocusedSource(remaining.length > 0 ? remaining[0] : null);
      }
    } else {
      setSelectedSources([...selectedSources, source]);
      // Auto-focus newly added source
      setFocusedSource(source);
    }
  }

  function isSourceSelected(sourceId: string): boolean {
    return selectedSources.some(s => s.id === sourceId);
  }

  function toggleCardExpansion(sourceId: string) {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedCards(newExpanded);
  }

  const filteredSources = availableSources.filter(source => {
    const query = searchQuery.toLowerCase();
    return (
      source.name.toLowerCase().includes(query) ||
      source.description?.toLowerCase().includes(query) ||
      source.columns.some(col =>
        col.name.toLowerCase().includes(query) ||
        col.description?.toLowerCase().includes(query)
      )
    );
  });

  const isValid = selectedSources.length > 0;

  function handleContinue() {
    if (isValid) {
      onComplete({ selectedSources });
    }
  }

  // Calculate estimated metrics
  const totalRows = selectedSources.reduce((sum, s) => sum + s.rowCount, 0);

  // Detect potential join keys
  function findPotentialJoins(source1: Source, source2: Source): string[] {
    const commonColumns: string[] = [];
    source1.columns.forEach(col1 => {
      source2.columns.forEach(col2 => {
        if (col1.name === col2.name && col1.type === col2.type) {
          commonColumns.push(col1.name);
        }
      });
    });
    return commonColumns;
  }

  // The source to display in detail panel (only on click)
  const detailSource = focusedSource;

  return (
    <div className="max-w-7xl mx-auto py-8 flex flex-col h-full">
      {/* Header */}
      <div className="space-y-4 pb-6 flex-shrink-0">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Select Source Data</h2>
            <p className="text-muted-foreground text-lg">
              Browse and select tables for your data product
            </p>
          </div>
          {selectedSources.length > 0 && (
            <Card className="border-primary/20 bg-primary/5 flex-shrink-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm">{selectedSources.length} table{selectedSources.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(totalRows / 1000000).toFixed(1)}M rows total
                  </div>
                  <div className="max-w-[300px] text-xs text-muted-foreground truncate">
                    {selectedSources.map(s => s.name).join(', ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables, columns, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Main Split Panel */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 mb-6">
        {/* Left Panel: Browse & Select */}
        <div className="col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Available Sources ({filteredSources.length})
              </CardTitle>
              <CardDescription>
                {searchQuery ? 'Search results' : 'Browse all tables'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading sources...
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-2">
                    {filteredSources.map(source => {
                      const isSelected = isSourceSelected(source.id);
                      const isExpanded = expandedCards.has(source.id);
                      const isFocused = focusedSource?.id === source.id;

                      return (
                        <Card
                          key={source.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            isSelected && "border-primary bg-primary/5",
                            isFocused && "ring-2 ring-primary",
                            !isSelected && "hover:bg-muted/50"
                          )}
                          onClick={() => setFocusedSource(source)}
                        >
                          <CardContent className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <TableIcon className="w-4 h-4" />
                                  <h3 className="font-semibold">{source.name}</h3>
                                  <Badge
                                    variant={source.qualityScore >= 90 ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {source.qualityScore}%
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {source.schema}.{source.name}
                                </p>
                              </div>
                              <Button
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSource(source);
                                }}
                              >
                                {isSelected ? <X className="w-4 h-4 mr-1" /> : null}
                                {isSelected ? 'Remove' : '+ Add'}
                              </Button>
                            </div>

                            {/* Description */}
                            {source.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {source.description}
                              </p>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span>{(source.rowCount / 1000000).toFixed(1)}M rows</span>
                              <span>•</span>
                              <span>{source.columns.length} columns</span>
                              <span>•</span>
                              <span>{source.lastUpdated}</span>
                            </div>

                            {/* Expandable Column Preview */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start px-0 h-auto text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCardExpansion(source.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 mr-1" />
                              ) : (
                                <ChevronRight className="w-3 h-3 mr-1" />
                              )}
                              {isExpanded ? 'Hide columns' : `Show ${source.columns.length} columns`}
                            </Button>

                            {/* Expanded Column List */}
                            {isExpanded && (
                              <div className="mt-2 space-y-1 pl-4 border-l-2 border-primary/20">
                                {source.columns.slice(0, 8).map(col => (
                                  <div key={col.name} className="flex items-center gap-2 text-xs">
                                    {col.isPrimaryKey && (
                                      <Key className="w-3 h-3 text-primary" />
                                    )}
                                    <span className="font-mono text-foreground">{col.name}</span>
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                      {col.type}
                                    </Badge>
                                  </div>
                                ))}
                                {source.columns.length > 8 && (
                                  <p className="text-xs text-muted-foreground pl-5">
                                    +{source.columns.length - 8} more columns
                                  </p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

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
        </div>

        {/* Right Panel: Detail & Context */}
        <div className="col-span-7">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {detailSource ? (
                  <>
                    <TableIcon className="w-5 h-5" />
                    {detailSource.name}
                    {isSourceSelected(detailSource.id) && (
                      <Badge variant="default" className="text-xs">Selected</Badge>
                    )}
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    Schema Details
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {detailSource ? (
                  <>
                    {detailSource.database}.{detailSource.schema}.{detailSource.name}
                  </>
                ) : (
                  'Select or hover a table to view details'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {detailSource ? (
                <Tabs defaultValue="overview" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="sample">Sample Data</TabsTrigger>
                    <TabsTrigger value="schema">Full Schema</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="flex-1 min-h-0">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-6 p-4">
                        {/* Description First */}
                        {detailSource.description && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p className="text-sm mt-2">{detailSource.description}</p>
                          </div>
                        )}

                        {/* Table Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Row Count</Label>
                            <p className="font-medium mt-1">
                              {detailSource.rowCount.toLocaleString()} rows
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Columns</Label>
                            <p className="font-medium mt-1">{detailSource.columns.length} columns</p>
                          </div>
                        </div>

                        {/* Quality Breakdown */}
                        {detailSource.quality && (
                          <div>
                            <QualityBreakdownCard quality={detailSource.quality} />
                          </div>
                        )}

                    {/* Relationship Detection */}
                    {selectedSources.length > 1 && isSourceSelected(detailSource.id) && (
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Detected Relationships
                        </Label>
                        {selectedSources
                          .filter(s => s.id !== detailSource.id)
                          .map(otherSource => {
                            const joins = findPotentialJoins(detailSource, otherSource);
                            if (joins.length === 0) return null;

                            return (
                              <Card key={otherSource.id} className="p-3 mb-2 bg-muted/30">
                                <div className="flex items-center gap-2 mb-2">
                                  <TableIcon className="w-4 h-4" />
                                  <span className="font-medium text-sm">{otherSource.name}</span>
                                </div>
                                <div className="space-y-1">
                                  {joins.map(joinCol => (
                                    <div key={joinCol} className="flex items-center gap-2 text-xs">
                                      <Key className="w-3 h-3 text-green-600" />
                                      <span className="font-mono">{joinCol}</span>
                                      <Badge variant="outline" className="text-[10px]">
                                        Join Key
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                    )}

                        {/* Quick Action */}
                        {!isSourceSelected(detailSource.id) && (
                          <Button
                            onClick={() => toggleSource(detailSource)}
                            className="w-full"
                            size="lg"
                          >
                            Add to Selection
                          </Button>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Sample Data Tab */}
                  <TabsContent value="sample" className="flex-1 min-h-0 mt-0">
                    {detailSource.sampleData ? (
                      <SampleDataPreview sample={detailSource.sampleData} />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <p>Sample data not available</p>
                          <p className="text-xs mt-1">Profiling may be in progress</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Full Schema Tab */}
                  <TabsContent value="schema" className="flex-1 min-h-0 mt-0">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-2 p-4">
                        <Label className="text-xs text-muted-foreground mb-3 block">
                          {detailSource.columns.length} columns
                        </Label>
                        {detailSource.columns.map(col => (
                          <Card key={col.name} className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {col.isPrimaryKey && (
                                    <Key className="w-4 h-4 text-primary" />
                                  )}
                                  <span className="font-mono font-medium text-sm">
                                    {col.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {col.type}
                                  </Badge>
                                </div>
                                {col.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {col.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground space-y-2">
                    <Database className="w-12 h-12 mx-auto opacity-20" />
                    <p>Select a table to view its schema</p>
                    <p className="text-xs">Click any table card on the left</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Bar: Summary & Navigation */}
      <div className="flex items-center justify-between pt-6 border-t flex-shrink-0">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>

        <div className="flex items-center gap-4">
          {selectedSources.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedSources.length} table{selectedSources.length !== 1 ? 's' : ''} · {' '}
              {(totalRows / 1000000).toFixed(1)}M rows
            </div>
          )}
          <Button onClick={handleContinue} disabled={!isValid} size="lg" className="min-w-[200px]">
            Continue to Transform
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
