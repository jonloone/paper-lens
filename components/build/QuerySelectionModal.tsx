'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Database,
  ExternalLink,
  Plus,
  Search,
  Star,
  Table,
  X
} from 'lucide-react';

interface SavedQuery {
  id: string;
  name: string;
  description: string;
  sql: string;
  catalog: string;
  schema: string;
  tags: string[];
  lastModified: Date;
  isFavorite: boolean;
  usageCount: number;
  estimatedRows?: number;
}

interface QuerySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: SavedQuery) => void;
  onCreateNew: () => void;
}

export function QuerySelectionModal({
  isOpen,
  onClose,
  onSelectQuery,
  onCreateNew
}: QuerySelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in production, fetch from Query Studio API
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setQueries([
          {
            id: 'q1',
            name: 'Customer Revenue Analysis',
            description: 'Monthly revenue analysis by customer segment',
            sql: 'SELECT customer_segment, SUM(revenue) FROM sales GROUP BY customer_segment',
            catalog: 'hive',
            schema: 'analytics',
            tags: ['revenue', 'customer'],
            lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24),
            isFavorite: true,
            usageCount: 15,
            estimatedRows: 1250
          },
          {
            id: 'q2',
            name: 'Product Performance',
            description: 'Top performing products by sales volume',
            sql: 'SELECT product_id, product_name, SUM(sales_volume) as total_sales FROM products JOIN sales USING(product_id) GROUP BY product_id, product_name ORDER BY total_sales DESC LIMIT 50',
            catalog: 'hive',
            schema: 'default',
            tags: ['product', 'sales'],
            lastModified: new Date(Date.now() - 1000 * 60 * 60 * 48),
            isFavorite: false,
            usageCount: 8,
            estimatedRows: 50
          },
          {
            id: 'q3',
            name: 'Data Quality Check',
            description: 'Check for null values and data completeness',
            sql: 'SELECT table_name, column_name, COUNT(*) as null_count FROM information_schema.columns WHERE is_nullable = YES',
            catalog: 'hive',
            schema: 'staging',
            tags: ['data-quality', 'validation'],
            lastModified: new Date(Date.now() - 1000 * 60 * 60 * 72),
            isFavorite: false,
            usageCount: 3,
            estimatedRows: 200
          }
        ]);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const filteredQueries = queries.filter(query =>
    query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    query.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectQuery = () => {
    if (selectedQuery) {
      onSelectQuery(selectedQuery);
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Select Saved Query
          </DialogTitle>
          <DialogDescription>
            Choose an existing query from Query Studio to use in your pipeline
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          <div className="space-y-4 h-full flex flex-col">
            {/* Search and Actions */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search queries by name, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={onCreateNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Query
              </Button>
            </div>

            {/* Query List */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground">Loading saved queries...</div>
                </div>
              ) : filteredQueries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Database className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="font-medium">No queries found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Try a different search term' : 'Create your first query in Query Studio'}
                    </p>
                  </div>
                  <Button onClick={onCreateNew} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Query
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-3">
                    {filteredQueries.map((query) => (
                      <Card
                        key={query.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedQuery?.id === query.id
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedQuery(query)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-sm flex items-center gap-2">
                                {query.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                                {query.name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {query.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(query.lastModified)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* SQL Preview */}
                            <div className="bg-muted/30 rounded p-2 font-mono text-xs text-muted-foreground">
                              {query.sql.length > 100 
                                ? `${query.sql.substring(0, 100)}...` 
                                : query.sql
                              }
                            </div>
                            
                            {/* Metadata */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {query.catalog}.{query.schema}
                                </Badge>
                                {query.estimatedRows && (
                                  <Badge variant="outline" className="text-xs">
                                    <Table className="h-3 w-3 mr-1" />
                                    {query.estimatedRows.toLocaleString()} rows
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  Used {query.usageCount}x
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                {query.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Selected Query Preview */}
            {selectedQuery && (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Selected:</strong> {selectedQuery.name} - {selectedQuery.description}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={() => window.open('/query', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Query Studio
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSelectQuery} 
                disabled={!selectedQuery}
              >
                Use Selected Query
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}