'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database
} from 'lucide-react';
import {
  Target,
  MagnifyingGlass,
  Buildings,
  ChartBar,
  Gear,
  FolderOpen,
  Lightbulb,
  CheckCircle as PhosphorCheck,
  Warning,
  XCircle as PhosphorX
} from 'phosphor-react';
import { fetchIcebergSources, previewSourceData } from '@/lib/services/data-sources-new';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

// Data source interface
interface DataSource {
  id: string;
  name: string;
  domain: 'Customer' | 'Marketing' | 'Product' | 'Operations' | 'Finance';
  recordCount: string; // "2.3M", "847K" - human readable
  qualityScore: number;
  qualityStatus: 'healthy' | 'warning' | 'critical';
  lastUpdated: string; // "1d ago", "2h ago" - relative time
  updateFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  description?: string;
}

// Domain summary for minimal cards
interface DomainSummary {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  statusText: string;
  sourceCount: number;
  lastActivity: string;
  icon: string;
}

interface DataDiscoveryStepProps {
  workflowData: any;
  onComplete: (data: any) => void;
  onStateChange?: (state: { displayMode: 'intent' | 'browse' | 'search'; selectedSourcesCount: number }) => void;
  uiConfig?: any;
}

// Quality status indicator component
function QualityStatusIndicator({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const icons = {
    healthy: <CheckCircle className="w-4 h-4 text-green-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    critical: <XCircle className="w-4 h-4 text-red-500" />
  };

  return icons[status];
}

// Domain badge component
function DomainBadge({ domain }: { domain: string }) {
  const colors = {
    Customer: 'bg-blue-100 text-blue-800',
    Marketing: 'bg-purple-100 text-purple-800',
    Product: 'bg-green-100 text-green-800',
    Operations: 'bg-orange-100 text-orange-800',
    Finance: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", colors[domain] || 'bg-gray-100 text-gray-800')}>
      {domain}
    </span>
  );
}

// Quality score component
function QualityScore({ score, status }: { score: number; status: string }) {
  return (
    <div className="flex items-center space-x-1">
      <span className={cn(
        "text-sm font-medium",
        status === 'critical' ? 'text-red-600' :
        status === 'warning' ? 'text-orange-600' :
        'text-green-600'
      )}>
        {score}%
      </span>
      {status !== 'healthy' && (
        <QualityStatusIndicator status={status as any} />
      )}
    </div>
  );
}

export function DataDiscoveryStep({ workflowData, onComplete, onStateChange, uiConfig }: DataDiscoveryStepProps) {
  const [availableSources, setAvailableSources] = useState<DataSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [intentQuery, setIntentQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [displayMode, setDisplayMode] = useState<'intent' | 'browse' | 'search'>('intent');
  const [previewingSource, setPreviewingSource] = useState<string | null>(null);

  // Mock domain summaries for minimal cards
  const domainSummaries: DomainSummary[] = [
    {
      name: 'Customer',
      status: 'healthy',
      statusText: 'Reliable, current',
      sourceCount: 12,
      lastActivity: '2 min ago',
      icon: '👥'
    },
    {
      name: 'Product',
      status: 'healthy',
      statusText: 'Fresh data, active',
      sourceCount: 8,
      lastActivity: '5 min ago',
      icon: '📦'
    },
    {
      name: 'Marketing',
      status: 'warning',
      statusText: 'Usable, minor delays',
      sourceCount: 6,
      lastActivity: '45 min ago',
      icon: 'chart'
    },
    {
      name: 'Finance',
      status: 'healthy',
      statusText: 'Complete, validated',
      sourceCount: 15,
      lastActivity: '12 min ago',
      icon: '💰'
    },
    {
      name: 'Operations',
      status: 'critical',
      statusText: 'Proceed with caution',
      sourceCount: 4,
      lastActivity: '3 hrs ago',
      icon: 'gear'
    }
  ];

  // Fetch real Iceberg data sources
  useEffect(() => {
    const loadSources = async () => {
      setIsLoading(true);
      try {
        const sources = await fetchIcebergSources();
        setAvailableSources(sources);
      } catch (error) {
        console.error('Failed to load data sources:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSources();
  }, []);

  // Filter and sort sources
  const filteredSources = useMemo(() => {
    return availableSources
      .filter(source => {
        // Search filter
        if (searchQuery && !source.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }

        // Domain filter
        if (domainFilter !== 'all' && source.domain !== domainFilter) {
          return false;
        }

        // Quality filter - show only sources with issues
        if (qualityFilter && source.qualityStatus === 'healthy') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'quality':
            return b.qualityScore - a.qualityScore;
          case 'updated':
            // Parse relative time to sort properly
            return 0; // TODO: Implement proper time sorting
          case 'size':
            // Parse record count to sort properly
            const parseCount = (count: string) => {
              const num = parseFloat(count);
              const multiplier = count.includes('M') ? 1000000 : count.includes('K') ? 1000 : 1;
              return num * multiplier;
            };
            return parseCount(b.recordCount) - parseCount(a.recordCount);
          default: // relevance
            return 0; // TODO: Implement AI-based relevance scoring
        }
      });
  }, [availableSources, searchQuery, domainFilter, qualityFilter, sortBy]);

  const handleSelectAll = () => {
    const newSelection = selectedSourceIds.length === filteredSources.length
      ? []
      : filteredSources.map(s => s.id);
    setSelectedSourceIds(newSelection);
    onStateChange?.({ displayMode, selectedSourcesCount: newSelection.length });
  };

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds(prev => {
      const newSelection = prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId];
      onStateChange?.({ displayMode, selectedSourcesCount: newSelection.length });
      return newSelection;
    });
  };

  const handlePreview = async (source: DataSource) => {
    setPreviewingSource(source.id);
    try {
      const previewData = await previewSourceData(source.id);
      // TODO: Show preview in modal
      console.log('Preview data:', previewData);
    } catch (error) {
      console.error('Failed to preview source:', error);
    } finally {
      setPreviewingSource(null);
    }
  };

  const handleIntentSearch = async (intent: string) => {
    setDisplayMode('search');
    // Simulate AI processing to find relevant sources based on intent
    setIsLoading(true);
    try {
      // In real implementation, this would call an AI service to parse intent
      // and return relevant sources with confidence scores
      const allSources = await fetchIcebergSources();

      // Simple keyword matching for demo (replace with AI service)
      const keywords = intent.toLowerCase().split(' ');
      const relevantSources = allSources.filter(source =>
        keywords.some(keyword =>
          source.name.toLowerCase().includes(keyword) ||
          source.domain.toLowerCase().includes(keyword)
        )
      ).slice(0, 5); // Show top 5 most relevant

      setAvailableSources(relevantSources);
    } catch (error) {
      console.error('Failed to search sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    const sources = await fetchIcebergSources();
    setAvailableSources(sources);
  };

  const selectedSources = availableSources.filter(s => selectedSourceIds.includes(s.id));
  const estimatedProcessingTime = selectedSources.length * 5 + ' minutes';
  const averageQuality = selectedSources.length > 0
    ? Math.round(selectedSources.reduce((sum, s) => sum + s.qualityScore, 0) / selectedSources.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Simple breadcrumb header */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Build Data Product</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Data Discovery</span>
      </div>

      {/* Intent-First Entry Point */}
      {displayMode === 'intent' && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">What are you building?</h2>

          {/* Quick Start Patterns */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5" weight="duotone" />
              <span className="text-sm font-medium">Quick Start Patterns:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Customer Analytics', intent: 'analyze customer behavior and churn patterns' },
                { name: 'Revenue Analysis', intent: 'analyze revenue attribution and financial performance' },
                { name: 'Product Insights', intent: 'analyze product usage and feature adoption' },
                { name: 'Custom Analysis', intent: '' }
              ].map((pattern) => (
                <Button
                  key={pattern.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (pattern.intent) {
                      setIntentQuery(pattern.intent);
                      handleIntentSearch(pattern.intent);
                    } else {
                      setDisplayMode('browse');
                      onStateChange?.({ displayMode: 'browse', selectedSourcesCount: selectedSourceIds.length });
                    }
                  }}
                  className="text-sm"
                >
                  {pattern.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Intent Search */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <MagnifyingGlass className="w-5 h-5" weight="duotone" />
              <span className="text-sm font-medium">Search for specific data:</span>
            </div>
            <div className="flex space-x-3">
              <Input
                placeholder="e.g., 'customer behavior data', 'revenue attribution', 'product usage metrics'"
                value={intentQuery}
                onChange={(e) => setIntentQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => handleIntentSearch(intentQuery)}
                disabled={!intentQuery.trim()}
              >
                Find Data
              </Button>
            </div>
          </div>

          {/* Browse by Domain - Modern Cards */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Buildings className="w-5 h-5" weight="duotone" />
              <span className="text-sm font-medium">Browse by Domain:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {domainSummaries.map((domain) => {
                const StatusIcon = domain.status === 'healthy' ? PhosphorCheck :
                                      domain.status === 'warning' ? Warning : PhosphorX;

                return (
                  <Card
                    key={domain.name}
                    className="p-4 hover:bg-muted/50 transition-all cursor-pointer border-2 hover:border-primary/20"
                    onClick={() => {
                      setDomainFilter(domain.name);
                      setDisplayMode('browse');
                      onStateChange?.({ displayMode: 'browse', selectedSourcesCount: selectedSourceIds.length });
                    }}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {domain.icon === 'chart' ? <ChartBar className="w-5 h-5" weight="duotone" /> : <Gear className="w-5 h-5" weight="duotone" />}
                          <span className="font-medium">{domain.name}</span>
                        </div>
                        <StatusIcon className="w-5 h-5" weight="duotone" />
                      </div>

                      {/* Status */}
                      <div className="text-sm text-muted-foreground">
                        {domain.statusText}
                      </div>

                      {/* Minimal metadata */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{domain.sourceCount} sources</span>
                        <span>{domain.lastActivity}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* All Sources Card */}
              <Card
                className="p-4 hover:bg-muted/50 transition-all cursor-pointer border-2 hover:border-primary/20 border-dashed"
                onClick={() => {
                  setDomainFilter('all');
                  setDisplayMode('browse');
                  onStateChange?.({ displayMode: 'browse', selectedSourcesCount: selectedSourceIds.length });
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-5 h-5" weight="duotone" />
                      <span className="font-medium">All Sources</span>
                    </div>
                    <span className="text-lg">📋</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Browse everything
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>All domains</span>
                    <span>Complete view</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Results Section - Only show when browsing or searching */}
      {displayMode !== 'intent' && (
        <div className="space-y-4">
          {/* Context Header */}
          <div className="flex items-center justify-between">
            <div>
              {displayMode === 'search' && intentQuery && (
                <h3 className="text-lg font-semibold">
                  Results for "{intentQuery}" ({filteredSources.length} found)
                </h3>
              )}
              {displayMode === 'browse' && domainFilter !== 'all' && (
                <h3 className="text-lg font-semibold">
                  {domainFilter} Domain Sources ({filteredSources.length} found)
                </h3>
              )}
              {displayMode === 'browse' && domainFilter === 'all' && (
                <h3 className="text-lg font-semibold">
                  All Data Sources ({filteredSources.length} found)
                </h3>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDisplayMode('intent');
                  onStateChange?.({ displayMode: 'intent', selectedSourcesCount: selectedSourceIds.length });
                }}
              >
                ← Back to Search
              </Button>
              {displayMode === 'search' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Simple View' : 'Advanced Filters'}
                </Button>
              )}
            </div>
          </div>

          {/* Smart Recommendations for Search Results */}
          {displayMode === 'search' && filteredSources.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="w-5 h-5" weight="duotone" />
                <span className="text-sm font-medium">Commonly combined with:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  product_usage (87% of projects)
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  customer_support (45% of projects)
                </Button>
              </div>
            </div>
          )}

      {/* Filters - Show based on mode */}
      {(showAdvanced || displayMode === 'browse') && (
      <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="Customer">Customer</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="quality-filter"
            checked={qualityFilter}
            onCheckedChange={(checked) => setQualityFilter(!!checked)}
          />
          <label htmlFor="quality-filter" className="text-sm">
            Issues Only
          </label>
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="size">Size</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      )}

      {/* Smart Defaults or Full Table */}
      {displayMode === 'search' && !showAdvanced ? (
        // Simplified view for search results
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Finding relevant data sources...</p>
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No sources found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try a different search term or browse by domain</p>
              <Button onClick={() => {
                setDisplayMode('intent');
                onStateChange?.({ displayMode: 'intent', selectedSourcesCount: selectedSourceIds.length });
              }} variant="outline" size="sm">
                Start Over
              </Button>
            </div>
          ) : (
            filteredSources.map(source => (
              <div
                key={source.id}
                className={cn(
                  "p-4 border rounded-lg hover:bg-muted/50 transition-colors",
                  selectedSourceIds.includes(source.id) && "bg-primary/5 border-primary/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedSourceIds.includes(source.id)}
                      onCheckedChange={() => toggleSourceSelection(source.id)}
                    />
                    <QualityStatusIndicator status={source.qualityStatus} />
                    <div>
                      <div className="font-semibold">{source.name}</div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span><DomainBadge domain={source.domain} /></span>
                        <span>{source.recordCount} records</span>
                        <span><QualityScore score={source.qualityScore} status={source.qualityStatus} /></span>
                        <span>{source.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(source)}
                    disabled={previewingSource === source.id}
                  >
                    {previewingSource === source.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      'Preview'
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Show More Button */}
          {filteredSources.length > 0 && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(true)}
              >
                Show Advanced View
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Full table view for browse mode or advanced search
      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="w-12 p-3">
                <Checkbox
                  checked={selectedSourceIds.length === filteredSources.length && filteredSources.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="text-left p-3 font-medium">Source Name</th>
              <th className="text-left p-3 font-medium">Domain</th>
              <th className="text-left p-3 font-medium">Records</th>
              <th className="text-left p-3 font-medium">Quality</th>
              <th className="text-left p-3 font-medium">Updated</th>
              <th className="w-24 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading data sources...</span>
                  </div>
                </td>
              </tr>
            ) : filteredSources.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No sources match your current filters
                </td>
              </tr>
            ) : (
              filteredSources.map(source => (
                <tr
                  key={source.id}
                  className={cn(
                    "border-b hover:bg-muted/50 transition-colors",
                    selectedSourceIds.includes(source.id) && "bg-primary/5"
                  )}
                >
                  <td className="p-3">
                    <Checkbox
                      checked={selectedSourceIds.includes(source.id)}
                      onCheckedChange={() => toggleSourceSelection(source.id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <QualityStatusIndicator status={source.qualityStatus} />
                      <span className="font-medium">{source.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <DomainBadge domain={source.domain} />
                  </td>
                  <td className="p-3 font-mono text-sm">
                    {source.recordCount}
                  </td>
                  <td className="p-3">
                    <QualityScore
                      score={source.qualityScore}
                      status={source.qualityStatus}
                    />
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {source.lastUpdated}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(source)}
                      disabled={previewingSource === source.id}
                    >
                      {previewingSource === source.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        'Preview'
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
      </div>
      )}

      {/* Selection summary - Always show when sources are selected */}
      {selectedSourceIds.length > 0 && displayMode !== 'intent' && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Selection Summary</div>
              <div className="text-sm text-muted-foreground">
                {selectedSourceIds.length} sources selected •
                Est. processing: {estimatedProcessingTime} •
                Avg. quality: {averageQuality}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons - Only show when sources are selected */}
      {selectedSourceIds.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => onComplete({ selectedSources })}
            size="lg"
          >
            Continue with {selectedSourceIds.length} Selected Sources
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}