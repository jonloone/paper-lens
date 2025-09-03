'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Package,
  Database,
  GitBranch,
  Filter,
  Sparkles,
} from 'lucide-react';
import { DataProductMarketplace } from '@/components/marketplace/DataProductMarketplace';
import { CatalogView } from './CatalogView';
import { LineageExplorer } from './LineageExplorer';

interface UnifiedDiscoveryProps {
  onSelectAsset?: (asset: any) => void;
  onCreateProduct?: (table: any) => void;
}

export function UnifiedDiscovery({ onSelectAsset, onCreateProduct }: UnifiedDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('marketplace');
  const [searchResults, setSearchResults] = useState<{
    products: any[];
    tables: any[];
  }>({ products: [], tables: [] });

  const handleUnifiedSearch = async () => {
    // This would call the unified search API
    // For now, we'll just demonstrate the concept
    console.log('Searching for:', searchQuery);
    
    // Mock search results
    setSearchResults({
      products: [
        { id: '1', name: 'Customer 360', type: 'product' },
        { id: '2', name: 'Revenue Dashboard', type: 'product' },
      ],
      tables: [
        { id: 't1', name: 'customer.master_table', type: 'table' },
        { id: 't2', name: 'sales.transactions', type: 'table' },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Unified Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Discover Data Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search across all data products and raw tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnifiedSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleUnifiedSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search All
            </Button>
          </div>
          
          {/* Quick Search Results Preview */}
          {(searchResults.products.length > 0 || searchResults.tables.length > 0) && (
            <div className="mt-4 space-y-3">
              {searchResults.products.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Data Products</h4>
                  <div className="space-y-2">
                    {searchResults.products.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-2 rounded border hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-500" />
                          <span>{product.name}</span>
                          <Badge variant="outline" className="text-xs">PRODUCT</Badge>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setActiveSubTab('marketplace')}>
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.tables.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Raw Tables</h4>
                  <div className="space-y-2">
                    {searchResults.tables.map(table => (
                      <div key={table.id} className="flex items-center justify-between p-2 rounded border hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-green-500" />
                          <span>{table.name}</span>
                          <Badge variant="outline" className="text-xs">TABLE</Badge>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setActiveSubTab('catalog')}>
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sub-tabs for different discovery modes */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="lineage" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Lineage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <DataProductMarketplace />
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <CatalogView 
            onSelectTable={onSelectAsset}
            onCreateProduct={onCreateProduct}
          />
        </TabsContent>

        <TabsContent value="lineage" className="space-y-4">
          <LineageExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
}