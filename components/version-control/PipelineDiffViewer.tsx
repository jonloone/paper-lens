import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Minus, 
  Edit3, 
  GitBranch, 
  Clock, 
  User, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Settings,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChangeSet, NodeDiff, ConfigDiff, MetadataDiff, PipelineVersionControl } from '@/lib/services/PipelineVersionControl';
import { RealNode, RealEdge } from '@/lib/types/RealNode';

interface PipelineDiffViewerProps {
  changeSet: ChangeSet;
  fromVersion: string;
  toVersion: string;
  onApplyChanges?: (changes: Partial<ChangeSet>) => void;
  onRevertChanges?: (changes: Partial<ChangeSet>) => void;
  readOnly?: boolean;
}

export const PipelineDiffViewer: React.FC<PipelineDiffViewerProps> = ({
  changeSet,
  fromVersion,
  toVersion,
  onApplyChanges,
  onRevertChanges,
  readOnly = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleChange = (changeId: string) => {
    const newSelected = new Set(selectedChanges);
    if (newSelected.has(changeId)) {
      newSelected.delete(changeId);
    } else {
      newSelected.add(changeId);
    }
    setSelectedChanges(newSelected);
  };

  const changeSummary = useMemo(() => {
    const total = 
      changeSet.nodesAdded.length +
      changeSet.nodesModified.length +
      changeSet.nodesRemoved.length +
      changeSet.edgesAdded.length +
      changeSet.edgesModified.length +
      changeSet.edgesRemoved.length +
      changeSet.configChanges.length +
      changeSet.metadataChanges.length;

    const impact = {
      breaking: changeSet.configChanges.filter(c => c.impact === 'breaking').length +
               changeSet.nodesRemoved.length,
      significant: changeSet.nodesAdded.length +
                  changeSet.nodesModified.filter(n => n.significance === 'major').length,
      minor: changeSet.nodesModified.filter(n => n.significance === 'minor').length +
             changeSet.configChanges.filter(c => c.impact === 'compatible').length,
      patch: changeSet.nodesModified.filter(n => n.significance === 'patch').length +
             changeSet.configChanges.filter(c => c.impact === 'enhancement').length
    };

    return { total, impact };
  }, [changeSet]);

  const getImpactBadge = (level: 'breaking' | 'significant' | 'minor' | 'patch', count: number) => {
    if (count === 0) return null;

    const colors = {
      breaking: 'bg-red-100 text-red-800 border-red-300',
      significant: 'bg-orange-100 text-orange-800 border-orange-300',
      minor: 'bg-blue-100 text-blue-800 border-blue-300',
      patch: 'bg-green-100 text-green-800 border-green-300'
    };

    const icons = {
      breaking: AlertTriangle,
      significant: Info,
      minor: Edit3,
      patch: CheckCircle
    };

    const Icon = icons[level];

    return (
      <Badge key={level} className={colors[level]}>
        <Icon className="w-3 h-3 mr-1" />
        {count} {level}
      </Badge>
    );
  };

  const renderNodeChange = (node: RealNode, type: 'added' | 'removed') => (
    <div
      key={node.id}
      className={cn(
        'flex items-center justify-between p-3 rounded border',
        type === 'added' && 'bg-green-50 border-green-200',
        type === 'removed' && 'bg-red-50 border-red-200'
      )}
    >
      <div className="flex items-center gap-3">
        {type === 'added' ? (
          <Plus className="w-4 h-4 text-green-600" />
        ) : (
          <Minus className="w-4 h-4 text-red-600" />
        )}
        <div>
          <div className="font-medium">{node.label}</div>
          <div className="text-sm text-gray-500">
            {node.type} • {node.reality.source}
          </div>
        </div>
      </div>
      <Badge variant="outline">
        {node.reality.integration.level}
      </Badge>
    </div>
  );

  const renderNodeModification = (nodeDiff: NodeDiff) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div key={nodeDiff.id} className="border rounded">
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-medium">{nodeDiff.id}</div>
              <div className="text-sm text-gray-500">
                {nodeDiff.changes.length} changes • {nodeDiff.significance} impact
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              className={cn(
                nodeDiff.significance === 'major' && 'bg-red-100 text-red-800',
                nodeDiff.significance === 'minor' && 'bg-blue-100 text-blue-800',
                nodeDiff.significance === 'patch' && 'bg-green-100 text-green-800'
              )}
            >
              {nodeDiff.significance}
            </Badge>
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        </div>

        {expanded && (
          <div className="border-t bg-gray-50 p-3 space-y-2">
            {nodeDiff.changes.map((change, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-2 bg-white rounded border"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{change.field}</div>
                  <div className="mt-1 space-y-1">
                    {change.type === 'modified' && (
                      <>
                        <div className="text-xs">
                          <span className="text-red-600">- </span>
                          <code className="bg-red-50 px-1 rounded">
                            {JSON.stringify(change.oldValue)}
                          </code>
                        </div>
                        <div className="text-xs">
                          <span className="text-green-600">+ </span>
                          <code className="bg-green-50 px-1 rounded">
                            {JSON.stringify(change.newValue)}
                          </code>
                        </div>
                      </>
                    )}
                    {change.type === 'added' && (
                      <div className="text-xs">
                        <span className="text-green-600">+ </span>
                        <code className="bg-green-50 px-1 rounded">
                          {JSON.stringify(change.newValue)}
                        </code>
                      </div>
                    )}
                    {change.type === 'removed' && (
                      <div className="text-xs">
                        <span className="text-red-600">- </span>
                        <code className="bg-red-50 px-1 rounded">
                          {JSON.stringify(change.oldValue)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderConfigChange = (configDiff: ConfigDiff) => (
    <div
      key={`${configDiff.nodeId}-${configDiff.configPath}`}
      className={cn(
        'p-3 rounded border',
        configDiff.impact === 'breaking' && 'bg-red-50 border-red-200',
        configDiff.impact === 'compatible' && 'bg-blue-50 border-blue-200',
        configDiff.impact === 'enhancement' && 'bg-green-50 border-green-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="font-medium">{configDiff.nodeId}</span>
            <code className="text-xs bg-gray-100 px-1 rounded">
              {configDiff.configPath}
            </code>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xs">
              <span className="text-red-600">- </span>
              <code className="bg-red-50 px-1 rounded">
                {JSON.stringify(configDiff.oldValue, null, 2)}
              </code>
            </div>
            <div className="text-xs">
              <span className="text-green-600">+ </span>
              <code className="bg-green-50 px-1 rounded">
                {JSON.stringify(configDiff.newValue, null, 2)}
              </code>
            </div>
          </div>
        </div>
        <Badge
          className={cn(
            configDiff.impact === 'breaking' && 'bg-red-100 text-red-800',
            configDiff.impact === 'compatible' && 'bg-blue-100 text-blue-800',
            configDiff.impact === 'enhancement' && 'bg-green-100 text-green-800'
          )}
        >
          {configDiff.impact}
        </Badge>
      </div>
    </div>
  );

  const renderEdgeChange = (edge: RealEdge, type: 'added' | 'removed') => (
    <div
      key={edge.id}
      className={cn(
        'flex items-center justify-between p-3 rounded border',
        type === 'added' && 'bg-green-50 border-green-200',
        type === 'removed' && 'bg-red-50 border-red-200'
      )}
    >
      <div className="flex items-center gap-3">
        {type === 'added' ? (
          <Plus className="w-4 h-4 text-green-600" />
        ) : (
          <Minus className="w-4 h-4 text-red-600" />
        )}
        <Link2 className="w-4 h-4 text-gray-400" />
        <div>
          <div className="font-medium">{edge.source} → {edge.target}</div>
          <div className="text-sm text-gray-500">
            {edge.reality.type} connection
          </div>
        </div>
      </div>
    </div>
  );

  const renderMetadataChange = (metadataDiff: MetadataDiff) => (
    <div
      key={metadataDiff.field}
      className="p-3 rounded border bg-blue-50 border-blue-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="font-medium">{metadataDiff.field}</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xs">
              <span className="text-red-600">- </span>
              <code className="bg-red-50 px-1 rounded">
                {JSON.stringify(metadataDiff.oldValue)}
              </code>
            </div>
            <div className="text-xs">
              <span className="text-green-600">+ </span>
              <code className="bg-green-50 px-1 rounded">
                {JSON.stringify(metadataDiff.newValue)}
              </code>
            </div>
          </div>
        </div>
        <Badge variant="outline">{metadataDiff.category}</Badge>
      </div>
    </div>
  );

  const renderSection = (
    title: string,
    count: number,
    sectionKey: string,
    children: React.ReactNode
  ) => {
    if (count === 0) return null;

    const isExpanded = expandedSections.has(sectionKey);

    return (
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection(sectionKey)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>{title}</span>
              <Badge variant="outline">{count}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        {isExpanded && <CardContent className="space-y-3">{children}</CardContent>}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipeline Diff</h2>
          <p className="text-gray-600">
            Comparing {fromVersion} → {toVersion}
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onRevertChanges?.(changeSet)}
              disabled={selectedChanges.size === 0}
            >
              Revert Selected
            </Button>
            <Button 
              onClick={() => onApplyChanges?.(changeSet)}
              disabled={selectedChanges.size === 0}
            >
              Apply Selected
            </Button>
          </div>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Change Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{changeSet.nodesAdded.length + changeSet.edgesAdded.length}
              </div>
              <div className="text-sm text-gray-500">Added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {changeSet.nodesModified.length + changeSet.edgesModified.length}
              </div>
              <div className="text-sm text-gray-500">Modified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                -{changeSet.nodesRemoved.length + changeSet.edgesRemoved.length}
              </div>
              <div className="text-sm text-gray-500">Removed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {changeSummary.total}
              </div>
              <div className="text-sm text-gray-500">Total Changes</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {getImpactBadge('breaking', changeSummary.impact.breaking)}
            {getImpactBadge('significant', changeSummary.impact.significant)}
            {getImpactBadge('minor', changeSummary.impact.minor)}
            {getImpactBadge('patch', changeSummary.impact.patch)}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Changes */}
      <Tabs defaultValue="nodes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nodes">
            Nodes ({changeSet.nodesAdded.length + changeSet.nodesModified.length + changeSet.nodesRemoved.length})
          </TabsTrigger>
          <TabsTrigger value="edges">
            Edges ({changeSet.edgesAdded.length + changeSet.edgesModified.length + changeSet.edgesRemoved.length})
          </TabsTrigger>
          <TabsTrigger value="config">
            Config ({changeSet.configChanges.length})
          </TabsTrigger>
          <TabsTrigger value="metadata">
            Metadata ({changeSet.metadataChanges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="space-y-4">
          {renderSection(
            'Added Nodes',
            changeSet.nodesAdded.length,
            'nodes-added',
            changeSet.nodesAdded.map(node => renderNodeChange(node, 'added'))
          )}

          {renderSection(
            'Modified Nodes',
            changeSet.nodesModified.length,
            'nodes-modified',
            changeSet.nodesModified.map(renderNodeModification)
          )}

          {renderSection(
            'Removed Nodes',
            changeSet.nodesRemoved.length,
            'nodes-removed',
            changeSet.nodesRemoved.map(nodeId => (
              <div key={nodeId} className="flex items-center gap-3 p-3 rounded border bg-red-50 border-red-200">
                <Minus className="w-4 h-4 text-red-600" />
                <div className="font-medium">{nodeId}</div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="edges" className="space-y-4">
          {renderSection(
            'Added Edges',
            changeSet.edgesAdded.length,
            'edges-added',
            changeSet.edgesAdded.map(edge => renderEdgeChange(edge, 'added'))
          )}

          {renderSection(
            'Removed Edges',
            changeSet.edgesRemoved.length,
            'edges-removed',
            changeSet.edgesRemoved.map(edgeId => (
              <div key={edgeId} className="flex items-center gap-3 p-3 rounded border bg-red-50 border-red-200">
                <Minus className="w-4 h-4 text-red-600" />
                <Link2 className="w-4 h-4 text-gray-400" />
                <div className="font-medium">{edgeId}</div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          {renderSection(
            'Configuration Changes',
            changeSet.configChanges.length,
            'config-changes',
            changeSet.configChanges.map(renderConfigChange)
          )}
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          {renderSection(
            'Metadata Changes',
            changeSet.metadataChanges.length,
            'metadata-changes',
            changeSet.metadataChanges.map(renderMetadataChange)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};