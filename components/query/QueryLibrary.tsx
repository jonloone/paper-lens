'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Search,
  Star,
  Clock,
  Tag,
  Copy,
  Edit,
  Trash2,
  Play,
  Save,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Database,
  CheckCircle,
  MoreVertical
} from 'lucide-react';

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  sql: string;
  catalog: string;
  schema: string;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  starred: boolean;
  executionCount: number;
  avgExecutionTime?: number;
  lastExecuted?: Date;
}

interface QueryLibraryProps {
  queries: SavedQuery[];
  onQuerySelect: (query: SavedQuery) => void;
  onQueryExecute: (query: SavedQuery) => void;
  onQuerySave: (query: Partial<SavedQuery>) => void;
  onQueryDelete: (queryId: string) => void;
  onQueryStar: (queryId: string, starred: boolean) => void;
  currentQuery?: string;
  currentCatalog?: string;
  currentSchema?: string;
}

type SortOption = 'recent' | 'name' | 'popularity' | 'created';
type FilterOption = 'all' | 'starred' | 'mine' | 'recent';

export function QueryLibrary({
  queries,
  onQuerySelect,
  onQueryExecute,
  onQuerySave,
  onQueryDelete,
  onQueryStar,
  currentQuery,
  currentCatalog = 'hive',
  currentSchema = 'default'
}: QueryLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [isCreatingQuery, setIsCreatingQuery] = useState(false);
  const [newQueryName, setNewQueryName] = useState('');
  const [newQueryDescription, setNewQueryDescription] = useState('');

  // Mock current user - in production, get from auth context
  const currentUser = 'john.doe';

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    queries.forEach(query => {
      query.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [queries]);

  // Filter and sort queries
  const filteredQueries = useMemo(() => {
    let filtered = queries.filter(query => {
      // Text search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesText = 
          query.name.toLowerCase().includes(searchLower) ||
          query.description.toLowerCase().includes(searchLower) ||
          query.sql.toLowerCase().includes(searchLower) ||
          query.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesText) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.every(tag => 
          query.tags.includes(tag)
        );
        if (!hasSelectedTag) return false;
      }

      // Filter by type
      switch (filterBy) {
        case 'starred':
          return query.starred;
        case 'mine':
          return query.author === currentUser;
        case 'recent':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return query.updatedAt > weekAgo;
        default:
          return true;
      }
    });

    // Sort queries
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'popularity':
          comparison = a.executionCount - b.executionCount;
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'recent':
        default:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [queries, searchTerm, selectedTags, sortBy, sortDirection, filterBy, currentUser]);

  const handleSaveCurrentQuery = () => {
    if (!currentQuery?.trim() || !newQueryName.trim()) return;

    const newQuery: Partial<SavedQuery> = {
      name: newQueryName,
      description: newQueryDescription,
      sql: currentQuery,
      catalog: currentCatalog,
      schema: currentSchema,
      tags: [],
      author: currentUser,
      starred: false,
      executionCount: 0
    };

    onQuerySave(newQuery);
    setIsCreatingQuery(false);
    setNewQueryName('');
    setNewQueryDescription('');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'Unknown';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle className="text-base">Query Library</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredQueries.length} queries
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Save, organize, and reuse SQL queries
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Search and Save */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>

          {currentQuery && (
            <div className="flex gap-2">
              {!isCreatingQuery ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingQuery(true)}
                  className="flex-1 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save Current Query
                </Button>
              ) : (
                <div className="space-y-2 w-full">
                  <Input
                    placeholder="Query name..."
                    value={newQueryName}
                    onChange={(e) => setNewQueryName(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Description (optional)..."
                    value={newQueryDescription}
                    onChange={(e) => setNewQueryDescription(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveCurrentQuery}
                      disabled={!newQueryName.trim()}
                      className="text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreatingQuery(false);
                        setNewQueryName('');
                        setNewQueryDescription('');
                      }}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Filters and Sorting */}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'starred', 'mine', 'recent'] as FilterOption[]).map(filter => (
              <Button
                key={filter}
                variant={filterBy === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy(filter)}
                className="text-xs capitalize"
              >
                {filter === 'all' && <Filter className="h-3 w-3 mr-1" />}
                {filter === 'starred' && <Star className="h-3 w-3 mr-1" />}
                {filter === 'mine' && <User className="h-3 w-3 mr-1" />}
                {filter === 'recent' && <Clock className="h-3 w-3 mr-1" />}
                {filter}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="recent">Last Updated</option>
              <option value="name">Name</option>
              <option value="popularity">Popularity</option>
              <option value="created">Date Created</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'desc' ? (
                <SortDesc className="h-3 w-3" />
              ) : (
                <SortAsc className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-2">Filter by tags:</div>
            <div className="flex gap-1 flex-wrap">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Query List */}
        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {filteredQueries.length === 0 ? (
              <Alert>
                <AlertDescription className="text-sm">
                  {searchTerm || selectedTags.length > 0 
                    ? 'No queries match your search criteria.'
                    : 'No saved queries yet. Save your first query to get started.'
                  }
                </AlertDescription>
              </Alert>
            ) : (
              filteredQueries.map(query => (
                <Card key={query.id} className="p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{query.name}</h4>
                          {query.starred && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {query.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {query.description}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQueryStar(query.id, !query.starred)}
                        className="h-6 w-6 p-0"
                      >
                        <Star className={`h-3 w-3 ${query.starred ? 'text-yellow-500 fill-current' : ''}`} />
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {query.catalog}.{query.schema}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {query.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(query.updatedAt)}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Play className="h-2 w-2 mr-1" />
                        {query.executionCount} runs
                      </Badge>
                      
                      {query.avgExecutionTime && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-2 w-2 mr-1" />
                          {formatExecutionTime(query.avgExecutionTime)}
                        </Badge>
                      )}
                    </div>

                    {/* Tags */}
                    {query.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {query.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* SQL Preview */}
                    <div className="bg-muted/30 rounded p-2">
                      <pre className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {query.sql.trim()}
                      </pre>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQuerySelect(query)}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Load
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQueryExecute(query)}
                        className="text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(query.sql)}
                        className="text-xs"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQueryDelete(query.id)}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}