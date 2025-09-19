'use client';

import React, { useState, useEffect } from 'react';
import { Search, Database, Clock, Shield, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DataProduct {
  name: string;
  table: string;
  description: string;
  schema: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
  freshness: string;
  lastUpdated: string;
  rowCount: string;
  accessMethods: {
    sql: string;
    api: string;
    python: string;
  };
  governance: {
    piiMasked: boolean;
    publicAccess: boolean;
  };
  usage: {
    queries: number;
    consumers: number;
  };
}

export default function DiscoveryInterface() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Mock data products (in production, these would be fetched from backend)
  const [dataProducts] = useState<DataProduct[]>([
    {
      name: 'customer_analytics',
      table: 'analytics.customer_analytics',
      description: 'Customer revenue and order metrics aggregated daily',
      schema: [
        { name: 'customer_id', type: 'string', nullable: false },
        { name: 'total_revenue', type: 'decimal', nullable: false },
        { name: 'order_count', type: 'integer', nullable: false },
        { name: 'last_order_date', type: 'date', nullable: true }
      ],
      freshness: 'Daily',
      lastUpdated: '2 hours ago',
      rowCount: '1.2M',
      accessMethods: {
        sql: 'SELECT * FROM analytics.customer_analytics',
        api: 'GET https://api.nexus.com/data/customer_analytics',
        python: "df = nexus.load('customer_analytics')"
      },
      governance: {
        piiMasked: true,
        publicAccess: false
      },
      usage: {
        queries: 847,
        consumers: 23
      }
    },
    {
      name: 'product_metrics',
      table: 'analytics.product_metrics',
      description: 'Product performance metrics including sales and inventory',
      schema: [
        { name: 'product_id', type: 'string', nullable: false },
        { name: 'sales_volume', type: 'integer', nullable: false },
        { name: 'inventory_level', type: 'integer', nullable: false },
        { name: 'category', type: 'string', nullable: false }
      ],
      freshness: 'Hourly',
      lastUpdated: '45 minutes ago',
      rowCount: '45K',
      accessMethods: {
        sql: 'SELECT * FROM analytics.product_metrics',
        api: 'GET https://api.nexus.com/data/product_metrics',
        python: "df = nexus.load('product_metrics')"
      },
      governance: {
        piiMasked: false,
        publicAccess: true
      },
      usage: {
        queries: 2341,
        consumers: 67
      }
    },
    {
      name: 'revenue_forecast',
      table: 'analytics.revenue_forecast',
      description: 'ML-generated revenue forecasts updated daily',
      schema: [
        { name: 'date', type: 'date', nullable: false },
        { name: 'predicted_revenue', type: 'decimal', nullable: false },
        { name: 'confidence_interval', type: 'decimal', nullable: false },
        { name: 'segment', type: 'string', nullable: false }
      ],
      freshness: 'Daily',
      lastUpdated: 'Yesterday',
      rowCount: '365',
      accessMethods: {
        sql: 'SELECT * FROM analytics.revenue_forecast',
        api: 'GET https://api.nexus.com/data/revenue_forecast',
        python: "df = nexus.load('revenue_forecast')"
      },
      governance: {
        piiMasked: false,
        publicAccess: false
      },
      usage: {
        queries: 523,
        consumers: 12
      }
    }
  ]);
  
  const filteredProducts = dataProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">NexusOne</div>
            <Badge variant="outline">Discovery</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {dataProducts.length} data products available
          </div>
        </div>
      </header>
      
      {/* Search Bar */}
      <div className="border-b border-border">
        <div className="container max-w-6xl mx-auto p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search data products..."
              className="w-full pl-10 pr-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>
      </div>
      
      {/* Results Grid */}
      <div className="container max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.name}
              className={cn(
                "border border-border rounded-lg p-4 cursor-pointer transition-all",
                "hover:border-blue-500/50 hover:shadow-lg",
                selectedProduct?.name === product.name && "border-blue-500 shadow-lg"
              )}
              onClick={() => setSelectedProduct(product)}
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {product.description}
                  </p>
                </div>
                {product.governance.piiMasked && (
                  <Shield className="h-4 w-4 text-green-500" />
                )}
              </div>
              
              {/* Schema Preview */}
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">Schema</div>
                <div className="text-xs space-y-0.5">
                  {product.schema.slice(0, 3).map((field, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span>{field.name}</span>
                      <span className="text-muted-foreground">{field.type}</span>
                    </div>
                  ))}
                  {product.schema.length > 3 && (
                    <div className="text-muted-foreground">
                      +{product.schema.length - 3} more fields
                    </div>
                  )}
                </div>
              </div>
              
              {/* Metadata */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{product.freshness}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    <span>{product.rowCount}</span>
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {product.usage.consumers} users
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Selected Product Details */}
        {selectedProduct && (
          <div className="mt-8 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Access {selectedProduct.name}
            </h2>
            
            {/* Access Methods */}
            <div className="space-y-4">
              {/* SQL Access */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">SQL</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedProduct.accessMethods.sql, 'sql')}
                  >
                    {copiedCode === 'sql' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                  {selectedProduct.accessMethods.sql}
                </pre>
              </div>
              
              {/* API Access */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">API</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedProduct.accessMethods.api, 'api')}
                  >
                    {copiedCode === 'api' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                  {selectedProduct.accessMethods.api}
                </pre>
              </div>
              
              {/* Python Access */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Python</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedProduct.accessMethods.python, 'python')}
                  >
                    {copiedCode === 'python' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                  {selectedProduct.accessMethods.python}
                </pre>
              </div>
            </div>
            
            {/* Full Schema */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Full Schema</h3>
                <Button 
                  size="sm" 
                  onClick={() => {
                    // Navigate to Query Workbench with table pre-populated
                    window.location.href = `/query?table=${selectedProduct.table}&catalog=iceberg`;
                  }}
                >
                  Query This Table
                </Button>
              </div>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-2 px-3">Column</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.schema.map((field, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="py-2 px-3">{field.name}</td>
                        <td className="py-2 px-3">{field.type}</td>
                        <td className="py-2 px-3">{field.nullable ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};