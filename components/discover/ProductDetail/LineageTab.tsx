'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  BarChart3,
  AlertCircle,
  List,
  Network
} from 'lucide-react';
import { MinimalLineage } from '@/components/lineage/MinimalLineage';
import { FullLineageModal } from '@/components/lineage/FullLineageModal';
import { createMockLineage, calculateLineageStats } from '@/components/lineage/utils/lineageParser';

interface LineageTabProps {
  productId: string;
  productName?: string;
}

export function LineageTab({ productId, productName }: LineageTabProps) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');
  const [modalOpen, setModalOpen] = useState(false);
  const [lineageDirection, setLineageDirection] = useState<'upstream' | 'downstream' | 'both'>('downstream');

  // Generate mock lineage data (will be replaced with API call)
  const lineageData = useMemo(() => createMockLineage(productId), [productId]);

  // Calculate statistics
  const stats = useMemo(
    () => calculateLineageStats(lineageData, productId),
    [lineageData, productId]
  );

  // Extract upstream and downstream for list view
  const { upstream, downstream } = useMemo(() => {
    const upstreamNodes = lineageData.nodes.filter((node) =>
      lineageData.edges.some((e) => e.target === productId && e.source === node.id)
    );

    const downstreamNodes = lineageData.nodes.filter((node) =>
      lineageData.edges.some((e) => e.source === productId && e.target === node.id)
    );

    return {
      upstream: upstreamNodes,
      downstream: downstreamNodes,
    };
  }, [lineageData, productId]);

  const handleNodeClick = (nodeId: string) => {
    console.log('Node clicked:', nodeId);
    // TODO: Navigate to node detail or open in new tab
  };

  const handleExpand = () => {
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Upstream Sources</div>
              <div className="text-2xl font-bold text-blue-600">{stats.upstreamCount}</div>
            </div>
            <ArrowUp className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Downstream Consumers</div>
              <div className="text-2xl font-bold text-green-600">{stats.downstreamCount}</div>
            </div>
            <ArrowDown className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Impact Radius</div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalReach}</div>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Data Lineage</h3>
          {viewMode === 'graph' && (
            <Tabs value={lineageDirection} onValueChange={(v) => setLineageDirection(v as 'upstream' | 'downstream' | 'both')}>
              <TabsList className="h-7">
                <TabsTrigger value="downstream" className="text-xs px-2">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  Impact
                </TabsTrigger>
                <TabsTrigger value="both" className="text-xs px-2">
                  <GitBranch className="h-3 w-3 mr-1" />
                  Full
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'graph')}>
          <TabsList className="h-8">
            <TabsTrigger value="graph" className="text-xs">
              <Network className="h-3 w-3 mr-1" />
              Graph
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs">
              <List className="h-3 w-3 mr-1" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Graph View */}
      {viewMode === 'graph' && (
        <MinimalLineage
          customLineage={lineageData}
          entityId={productId}
          depth={2}
          direction={lineageDirection}
          height="350px"
          onNodeClick={handleNodeClick}
          onExpand={handleExpand}
          showControls={false}
          showTitle={false}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Upstream Dependencies */}
          {upstream.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowUp className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold">Upstream Dependencies</h4>
                <Badge variant="secondary" className="text-xs">
                  {upstream.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {upstream.map((node) => (
                  <Card
                    key={node.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <GitBranch className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {node.displayName || node.label || node.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {node.platform && (
                              <Badge variant="outline" className="text-xs mr-1">
                                {node.platform}
                              </Badge>
                            )}
                            {node.badge || node.type}
                          </div>
                        </div>
                      </div>
                      {node.qualityScore && (
                        <Badge
                          variant={node.qualityScore > 90 ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {node.qualityScore}% quality
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Downstream Consumers */}
          {downstream.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowDown className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold">Downstream Consumers</h4>
                <Badge variant="secondary" className="text-xs">
                  {downstream.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {downstream.map((node) => (
                  <Card
                    key={node.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500"
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <GitBranch className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {node.displayName || node.label || node.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {node.platform && (
                              <Badge variant="outline" className="text-xs mr-1">
                                {node.platform}
                              </Badge>
                            )}
                            {node.badge || node.type}
                          </div>
                        </div>
                      </div>
                      {node.qualityScore && (
                        <Badge
                          variant={node.qualityScore > 90 ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {node.qualityScore}% quality
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Impact Analysis */}
      <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Impact Analysis
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
              {stats.downstreamCount > 0 ? (
                <>
                  Changes to <strong>{productName || 'this product'}</strong> will impact{' '}
                  <strong>{stats.downstreamCount}</strong> downstream{' '}
                  {stats.downstreamCount === 1 ? 'consumer' : 'consumers'}.{' '}
                  {stats.criticalDashboards > 0 && (
                    <>
                      This includes <strong>{stats.criticalDashboards}</strong> critical{' '}
                      {stats.criticalDashboards === 1 ? 'dashboard' : 'dashboards'}.
                    </>
                  )}{' '}
                  Review dependencies before making schema changes.
                </>
              ) : (
                <>
                  This product has no downstream consumers. Schema changes have minimal impact on other
                  systems.
                </>
              )}
            </p>
            {stats.upstreamCount > 0 && (
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
                This product depends on <strong>{stats.upstreamCount}</strong> upstream{' '}
                {stats.upstreamCount === 1 ? 'source' : 'sources'}. Monitor source quality to ensure
                data reliability.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Full-screen Lineage Modal */}
      <FullLineageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityId={productId}
        entityName={productName}
        mode="comprehensive"
      />
    </div>
  );
}
