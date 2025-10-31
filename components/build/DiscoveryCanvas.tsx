'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Database,
  TrendingUp,
  Check,
  Info,
  Loader2,
  ChevronRight,
  Calendar,
  Filter,
  BarChart3,
  Target,
  AlertCircle
} from 'lucide-react';

// Types
export interface ExtractedIntent {
  primary_entities: string[];
  metrics: string[];
  time_dimension: string | null;
  filters: string[];
  aggregation_level: string;
  use_case: string;
  department: string;
  urgency: string;
  confidence: number;
  raw_query: string;
}

export interface SourceRecommendation {
  table_id: string;
  catalog: string;
  schema: string;
  table: string;
  full_name: string;
  quality_score: number;
  usage_frequency: number;
  co_occurrence_score: number;
  recency_score: number;
  composite_score: number;
  confidence: number;
  reasoning: string;
  match_type: 'semantic' | 'usage' | 'combined';
  matched_terms?: string[];
  sample_columns?: string[];
}

export interface DiscoveryResult {
  intent: ExtractedIntent;
  sources: SourceRecommendation[];
  message: string;
}

export interface DiscoveryCanvasProps {
  onSourcesConfirmed?: (intent: ExtractedIntent, sources: SourceRecommendation[]) => void;
  initialQuery?: string;
}

export function DiscoveryCanvas({ onSourcesConfirmed, initialQuery = '' }: DiscoveryCanvasProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    if (!query.trim()) return;

    setIsDiscovering(true);
    setError(null);

    try {
      const response = await fetch('/api/progressive/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit: 5,
          min_quality: 0.70
        })
      });

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      const result: DiscoveryResult = await response.json();
      setDiscoveryResult(result);

      // Auto-select top 3 sources
      if (result.sources.length > 0) {
        const topSources = result.sources.slice(0, 3).map(s => s.table_id);
        setSelectedSources(new Set(topSources));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
      console.error('Discovery error:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const toggleSource = (tableId: string) => {
    const newSelection = new Set(selectedSources);
    if (newSelection.has(tableId)) {
      newSelection.delete(tableId);
    } else {
      newSelection.add(tableId);
    }
    setSelectedSources(newSelection);
  };

  const handleConfirm = () => {
    if (!discoveryResult || selectedSources.size === 0) return;

    const selectedSourceObjs = discoveryResult.sources.filter(s =>
      selectedSources.has(s.table_id)
    );

    onSourcesConfirmed?.(discoveryResult.intent, selectedSourceObjs);
  };

  const getUseCaseIcon = (useCase: string) => {
    switch (useCase) {
      case 'analysis': return BarChart3;
      case 'reporting': return TrendingUp;
      case 'monitoring': return Target;
      default: return Database;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="border-b border-[#2d2d30] bg-[#252526] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#cccccc]">Intelligent Source Discovery</h1>
            <p className="text-sm text-[#858585]">
              Describe what you need and we'll recommend the best sources
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Query Input Section */}
        <Card className="bg-[#252526] border-[#2d2d30] p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#cccccc] mb-2 block">
                What data do you need?
              </label>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Example: I need daily customer revenue by region"
                className="bg-[#1e1e1e] border-[#3e3e42] text-[#cccccc] placeholder:text-[#6a6a6a] min-h-[100px] resize-none"
                disabled={isDiscovering}
              />
            </div>

            <Button
              onClick={handleDiscover}
              disabled={!query.trim() || isDiscovering}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Discovering Sources...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Discover Sources
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-1">Discovery Failed</h3>
                <p className="text-sm text-[#cccccc]">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {discoveryResult && (
          <div className="space-y-6">
            {/* Intent Analysis */}
            <Card className="bg-[#252526] border-[#2d2d30] p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Info className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-[#cccccc] mb-2">
                    Understanding Your Request
                  </h2>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400">
                      {Math.round(discoveryResult.intent.confidence * 100)}% Confidence
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400">
                      {discoveryResult.intent.use_case}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#858585] mb-1">Entities</div>
                      <div className="flex flex-wrap gap-1">
                        {discoveryResult.intent.primary_entities.map(entity => (
                          <Badge key={entity} variant="outline" className="text-xs bg-[#1e1e1e] border-[#3e3e42] text-[#cccccc]">
                            {entity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {discoveryResult.intent.metrics.length > 0 && (
                      <div>
                        <div className="text-xs text-[#858585] mb-1">Metrics</div>
                        <div className="flex flex-wrap gap-1">
                          {discoveryResult.intent.metrics.map(metric => (
                            <Badge key={metric} variant="outline" className="text-xs bg-[#1e1e1e] border-[#3e3e42] text-[#cccccc]">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {discoveryResult.intent.time_dimension && (
                      <div>
                        <div className="text-xs text-[#858585] mb-1">Time Dimension</div>
                        <Badge variant="outline" className="text-xs bg-[#1e1e1e] border-[#3e3e42] text-[#cccccc]">
                          <Calendar className="h-3 w-3 mr-1" />
                          {discoveryResult.intent.time_dimension}
                        </Badge>
                      </div>
                    )}

                    {discoveryResult.intent.filters.length > 0 && (
                      <div>
                        <div className="text-xs text-[#858585] mb-1">Filters</div>
                        <div className="flex flex-wrap gap-1">
                          {discoveryResult.intent.filters.map(filter => (
                            <Badge key={filter} variant="outline" className="text-xs bg-[#1e1e1e] border-[#3e3e42] text-[#cccccc]">
                              <Filter className="h-3 w-3 mr-1" />
                              {filter}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Source Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#cccccc]">
                  Recommended Sources ({discoveryResult.sources.length})
                </h2>
                {selectedSources.size > 0 && (
                  <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-400">
                    <Check className="h-3 w-3 mr-1" />
                    {selectedSources.size} Selected
                  </Badge>
                )}
              </div>

              {discoveryResult.sources.length === 0 ? (
                <Card className="bg-[#252526] border-[#2d2d30] p-8 text-center">
                  <Database className="h-12 w-12 text-[#6a6a6a] mx-auto mb-3" />
                  <p className="text-[#858585]">
                    No sources found matching your criteria.
                    <br />
                    Try broadening your query or adjusting quality thresholds.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {discoveryResult.sources.map((source, index) => (
                    <Card
                      key={source.table_id}
                      className={`bg-[#252526] border-[#2d2d30] p-4 cursor-pointer transition-all hover:border-blue-500/30 ${
                        selectedSources.has(source.table_id) ? 'border-blue-500/50 bg-blue-500/5' : ''
                      }`}
                      onClick={() => toggleSource(source.table_id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Selection Indicator */}
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedSources.has(source.table_id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-[#3e3e42] bg-[#1e1e1e]'
                        }`}>
                          {selectedSources.has(source.table_id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-[#6a6a6a]">#{index + 1}</span>
                                <h3 className="text-sm font-medium text-[#cccccc]">{source.full_name}</h3>
                              </div>
                              <p className="text-xs text-[#858585] line-clamp-1">{source.reasoning}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className={`text-xs ${
                                source.quality_score >= 0.9
                                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                  : source.quality_score >= 0.7
                                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                              }`}>
                                {Math.round(source.quality_score * 100)}% Quality
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-400">
                                {Math.round(source.confidence * 100)}% Match
                              </Badge>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex items-center gap-4 text-xs text-[#858585]">
                            <span>{source.catalog}.{source.schema}</span>
                            <span>•</span>
                            <span className="capitalize">{source.match_type} match</span>
                            {source.usage_frequency > 0 && (
                              <>
                                <span>•</span>
                                <span>{source.usage_frequency} uses</span>
                              </>
                            )}
                          </div>

                          {source.matched_terms && source.matched_terms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {source.matched_terms.map(term => (
                                <Badge key={term} variant="outline" className="text-xs bg-purple-500/10 border-purple-500/20 text-purple-400">
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {discoveryResult && selectedSources.size > 0 && (
        <div className="border-t border-[#2d2d30] bg-[#252526] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#858585]">
              {selectedSources.size} source{selectedSources.size !== 1 ? 's' : ''} selected
            </div>
            <Button
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue with Selected Sources
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
