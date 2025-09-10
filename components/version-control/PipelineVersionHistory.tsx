import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  User, 
  GitBranch, 
  Tag, 
  RotateCcw, 
  Compare, 
  Download,
  Search,
  Calendar,
  MessageSquare,
  GitCommit,
  AlertTriangle,
  CheckCircle,
  Info,
  Plus,
  Edit3,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineVersion } from '@/lib/services/PipelineVersionControl';

interface PipelineVersionHistoryProps {
  versions: PipelineVersion[];
  currentVersion?: string;
  onCompare?: (fromVersion: string, toVersion: string) => void;
  onRevert?: (version: string) => void;
  onCreateBranch?: (fromVersion: string, branchName: string) => void;
  onExport?: (versions: string[]) => void;
  readOnly?: boolean;
}

export const PipelineVersionHistory: React.FC<PipelineVersionHistoryProps> = ({
  versions,
  currentVersion,
  onCompare,
  onRevert,
  onCreateBranch,
  onExport,
  readOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [showCreateBranch, setShowCreateBranch] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');

  // Extract unique branches and authors
  const { branches, authors } = useMemo(() => {
    const branchSet = new Set(versions.map(v => v.branch || 'main'));
    const authorSet = new Set(versions.map(v => v.author));
    
    return {
      branches: Array.from(branchSet).sort(),
      authors: Array.from(authorSet).sort()
    };
  }, [versions]);

  // Filter versions based on search criteria
  const filteredVersions = useMemo(() => {
    return versions.filter(version => {
      // Search term filter
      if (searchTerm && !version.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !version.version.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Branch filter
      if (selectedBranch !== 'all' && version.branch !== selectedBranch) {
        return false;
      }

      // Author filter
      if (selectedAuthor !== 'all' && version.author !== selectedAuthor) {
        return false;
      }

      return true;
    });
  }, [versions, searchTerm, selectedBranch, selectedAuthor]);

  const toggleVersionSelection = (versionId: string) => {
    const newSelected = new Set(selectedVersions);
    if (newSelected.has(versionId)) {
      newSelected.delete(versionId);
    } else {
      newSelected.add(versionId);
    }
    setSelectedVersions(newSelected);
  };

  const handleCompareSelected = () => {
    const selected = Array.from(selectedVersions);
    if (selected.length === 2) {
      const [from, to] = selected.sort((a, b) => {
        const versionA = versions.find(v => v.id === a);
        const versionB = versions.find(v => v.id === b);
        return new Date(versionA!.timestamp).getTime() - new Date(versionB!.timestamp).getTime();
      });
      const fromVersion = versions.find(v => v.id === from)?.version;
      const toVersion = versions.find(v => v.id === to)?.version;
      if (fromVersion && toVersion) {
        onCompare?.(fromVersion, toVersion);
      }
    }
  };

  const handleCreateBranch = (fromVersion: string) => {
    if (newBranchName.trim()) {
      onCreateBranch?.(fromVersion, newBranchName.trim());
      setShowCreateBranch(null);
      setNewBranchName('');
    }
  };

  const getVersionBadge = (version: PipelineVersion) => {
    if (version.tags?.includes('revert')) {
      return <Badge className="bg-yellow-100 text-yellow-800"><RotateCcw className="w-3 h-3 mr-1" />Revert</Badge>;
    }
    if (version.tags?.includes('auto-sync')) {
      return <Badge className="bg-blue-100 text-blue-800"><GitCommit className="w-3 h-3 mr-1" />Auto</Badge>;
    }
    if (version.tags?.includes('branch-creation')) {
      return <Badge className="bg-purple-100 text-purple-800"><GitBranch className="w-3 h-3 mr-1" />Branch</Badge>;
    }
    if (version.tags?.length) {
      return <Badge className="bg-green-100 text-green-800"><Tag className="w-3 h-3 mr-1" />{version.tags[0]}</Badge>;
    }
    return null;
  };

  const getChangesSummary = (version: PipelineVersion) => {
    if (!version.changes) return null;

    const changes = version.changes;
    const total = 
      changes.nodesAdded.length +
      changes.nodesModified.length +
      changes.nodesRemoved.length +
      changes.edgesAdded.length +
      changes.edgesModified.length +
      changes.edgesRemoved.length +
      changes.configChanges.length +
      changes.metadataChanges.length;

    if (total === 0) return null;

    const addCount = changes.nodesAdded.length + changes.edgesAdded.length;
    const modifyCount = changes.nodesModified.length + changes.edgesModified.length + changes.configChanges.length;
    const removeCount = changes.nodesRemoved.length + changes.edgesRemoved.length;

    return (
      <div className="flex items-center gap-2 text-xs">
        {addCount > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <Plus className="w-3 h-3" />
            {addCount}
          </span>
        )}
        {modifyCount > 0 && (
          <span className="flex items-center gap-1 text-blue-600">
            <Edit3 className="w-3 h-3" />
            {modifyCount}
          </span>
        )}
        {removeCount > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <Minus className="w-3 h-3" />
            {removeCount}
          </span>
        )}
      </div>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Version History</h2>
          <p className="text-gray-600">
            {filteredVersions.length} versions
          </p>
        </div>
        <div className="flex gap-2">
          {selectedVersions.size === 2 && (
            <Button onClick={handleCompareSelected}>
              <Compare className="w-4 h-4 mr-2" />
              Compare Selected
            </Button>
          )}
          {selectedVersions.size > 0 && (
            <Button 
              variant="outline" 
              onClick={() => onExport?.(Array.from(selectedVersions))}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search versions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {authors.map(author => (
                  <SelectItem key={author} value={author}>{author}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Version List */}
      <div className="space-y-3">
        {filteredVersions.map((version, index) => {
          const isSelected = selectedVersions.has(version.id);
          const isCurrent = version.version === currentVersion;
          const nextVersion = filteredVersions[index + 1];

          return (
            <Card 
              key={version.id}
              className={cn(
                'transition-all duration-200',
                isSelected && 'ring-2 ring-blue-400',
                isCurrent && 'border-green-500 bg-green-50'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleVersionSelection(version.id)}
                        className="mt-1"
                      />
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-sm">
                          {version.version}
                        </Badge>
                        {isCurrent && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                        {getVersionBadge(version)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h3 className="font-medium mb-1">{version.message}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {version.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(version.timestamp)}
                        </div>
                        {version.branch && version.branch !== 'main' && (
                          <div className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {version.branch}
                          </div>
                        )}
                      </div>
                    </div>

                    {getChangesSummary(version)}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!readOnly && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateBranch(version.version)}
                        >
                          <GitBranch className="w-3 h-3 mr-1" />
                          Branch
                        </Button>
                        {!isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRevert?.(version.version)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Revert
                          </Button>
                        )}
                      </>
                    )}
                    {nextVersion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCompare?.(nextVersion.version, version.version)}
                      >
                        <Compare className="w-3 h-3 mr-1" />
                        Diff
                      </Button>
                    )}
                  </div>
                </div>

                {/* Branch Creation Form */}
                {showCreateBranch === version.version && (
                  <div className="mt-3 p-3 border-t bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Branch name"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch(version.version)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleCreateBranch(version.version)}
                        disabled={!newBranchName.trim()}
                      >
                        Create
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateBranch(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredVersions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No versions found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selection Summary */}
      {selectedVersions.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{selectedVersions.size} versions selected</span>
                {selectedVersions.size === 2 && (
                  <span className="text-sm text-gray-600 ml-2">• Ready to compare</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVersions(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};