'use client';

/**
 * CDC Wizard Step 1: Source Selection
 *
 * Allows user to select an existing source from /manage/sources
 * for CDC pipeline deployment.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign
} from 'lucide-react';

import type { SourceSummary } from '@/lib/types/cdc-wizard';

interface SourceSelectionStepProps {
  selectedSource?: SourceSummary;
  onSourceSelected: (source: SourceSummary) => void;
}

export default function SourceSelectionStep({
  selectedSource,
  onSourceSelected,
}: SourceSelectionStepProps) {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    if (selectedSource) {
      estimateCost(selectedSource);
    }
  }, [selectedSource]);

  const fetchSources = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/sources');
      const data = await response.json();
      // Filter to only show sources not already in CDC mode
      const nonCdcSources = data.filter((s: SourceSummary) => s.connection_mode !== 'cdc');
      setSources(nonCdcSources);
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateCost = async (source: SourceSummary) => {
    // Simulated cost estimation based on source type and table count
    // In production, this would call the cost estimation API
    const baseCost = 1000; // Base CDC pipeline cost per month
    const perTableCost = 50; // Cost per table
    const totalCost = baseCost + (source.table_count * perTableCost);
    setEstimatedCost(totalCost);
  };

  const filteredSources = sources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-400/10 text-green-400 border-green-400',
      paused: 'bg-yellow-400/10 text-yellow-400 border-yellow-400',
      failed: 'bg-red-400/10 text-red-400 border-red-400',
      configuring: 'bg-blue-400/10 text-blue-400 border-blue-400',
      deploying: 'bg-purple-400/10 text-purple-400 border-purple-400',
    };

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || ''}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
        <span className="ml-3 text-gray-400">Loading sources...</span>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <Alert className="border-yellow-400 bg-yellow-400/10">
        <AlertCircle className="w-4 h-4 text-yellow-400" />
        <AlertDescription className="text-gray-300">
          No sources available for CDC deployment. Please create a source first in{' '}
          <a href="/manage/sources" className="underline text-green-400">
            /manage/sources
          </a>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert className="border-blue-400 bg-blue-400/10">
        <AlertDescription className="text-gray-300">
          Select a source system to set up Change Data Capture (CDC) pipeline. CDC enables
          real-time data replication from your source database to Iceberg tables via Kafka.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search sources by name or domain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
        />
      </div>

      {/* Source List */}
      <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
        {filteredSources.map((source) => (
          <Card
            key={source.id}
            onClick={() => onSourceSelected(source)}
            className={`
              cursor-pointer transition-all
              ${
                selectedSource?.id === source.id
                  ? 'bg-green-400/10 border-green-400 ring-2 ring-green-400'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                    <Database className="w-5 h-5 text-green-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-100">{source.name}</h3>
                      {getStatusBadge(source.status)}
                      {selectedSource?.id === source.id && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mt-2">
                      <div>
                        <span className="text-gray-500">Type:</span>{' '}
                        <span className="text-gray-300">{source.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Domain:</span>{' '}
                        <span className="text-gray-300">{source.domain}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tables:</span>{' '}
                        <span className="text-gray-300">{source.table_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Health:</span>{' '}
                        <span className={getHealthColor(source.health_score)}>
                          {source.health_score}%
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      Owner: {source.owner_email}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSources.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sources match your search criteria
        </div>
      )}

      {/* Selected Source Details */}
      {selectedSource && estimatedCost !== null && (
        <Alert className="border-green-400 bg-green-400/10">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 font-medium mb-1">
                  Selected: {selectedSource.name}
                </p>
                <p className="text-sm text-gray-400">
                  CDC pipeline will replicate {selectedSource.table_count} table(s) in real-time
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-lg font-bold">{estimatedCost}</span>
                  <span className="text-sm">/month</span>
                </div>
                <p className="text-xs text-gray-500">Estimated cost</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
