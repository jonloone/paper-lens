'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Database, BarChart3, Info, Shield, TrendingUp } from 'lucide-react';
import { TechLogo } from '@/components/ui/tech-logo';

interface SchemaTabProps {
  product: any;
}

// Full schema with all 47 columns (expandable from 8)
const generateFullSchema = () => {
  const coreColumns = [
    { name: 'customer_id', type: 'VARCHAR(50)', nullable: false, primaryKey: true, description: 'Unique customer identifier', source: 'salesforce', nullRate: 0, cardinality: 2547893, example: 'cust_a1b2c3d4e5', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'email', type: 'VARCHAR(255)', nullable: false, primaryKey: false, description: 'Customer email address', source: 'salesforce', nullRate: 0.2, cardinality: 2540123, example: 'john.doe@example.com', distribution: { min: '-', max: '-', median: '-' }, isPII: true },
    { name: 'first_name', type: 'VARCHAR(100)', nullable: false, primaryKey: false, description: 'Customer first name', source: 'salesforce', nullRate: 0.5, cardinality: 45678, example: 'John', distribution: { min: '-', max: '-', median: '-' }, isPII: true },
    { name: 'last_name', type: 'VARCHAR(100)', nullable: false, primaryKey: false, description: 'Customer last name', source: 'salesforce', nullRate: 0.5, cardinality: 78945, example: 'Doe', distribution: { min: '-', max: '-', median: '-' }, isPII: true },
    { name: 'phone_number', type: 'VARCHAR(20)', nullable: true, primaryKey: false, description: 'Primary contact phone number', source: 'salesforce', nullRate: 15.2, cardinality: 2100345, example: '+1-555-0123', distribution: { min: '-', max: '-', median: '-' }, isPII: true },
    { name: 'signup_date', type: 'DATE', nullable: false, primaryKey: false, description: 'Account creation date', source: 'salesforce', nullRate: 0, cardinality: 1095, example: '2023-05-15', distribution: { min: '2022-01-01', max: '2025-10-10', median: '2023-08-15' } },
    { name: 'account_status', type: 'VARCHAR(20)', nullable: false, primaryKey: false, description: 'Current account status', source: 'salesforce', nullRate: 0, cardinality: 5, example: 'active', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'segment', type: 'VARCHAR(50)', nullable: true, primaryKey: false, description: 'Customer segment classification', source: 'salesforce', nullRate: 2.1, cardinality: 8, example: 'smb', distribution: { min: '-', max: '-', median: '-' } },

    // Revenue & Transaction columns
    { name: 'lifetime_value', type: 'DECIMAL(18,2)', nullable: false, primaryKey: false, description: 'Total lifetime revenue from customer', source: 'stripe', nullRate: 0, cardinality: 2450789, example: '1247.83', distribution: { min: '0.00', max: '125,847.92', median: '487.50' } },
    { name: 'total_orders', type: 'INTEGER', nullable: false, primaryKey: false, description: 'Total number of orders placed', source: 'stripe', nullRate: 0, cardinality: 156, example: '42', distribution: { min: '0', max: '1,247', median: '8' } },
    { name: 'avg_order_value', type: 'DECIMAL(10,2)', nullable: true, primaryKey: false, description: 'Average order value', source: 'stripe', nullRate: 1.2, cardinality: 125678, example: '89.99', distribution: { min: '5.00', max: '5,000.00', median: '75.00' } },
    { name: 'last_purchase_date', type: 'DATE', nullable: true, primaryKey: false, description: 'Date of most recent purchase', source: 'stripe', nullRate: 8.5, cardinality: 1095, example: '2025-09-15', distribution: { min: '2022-01-01', max: '2025-10-10', median: '2025-06-20' } },
    { name: 'last_purchase_amount', type: 'DECIMAL(10,2)', nullable: true, primaryKey: false, description: 'Amount of most recent purchase', source: 'stripe', nullRate: 8.5, cardinality: 234567, example: '129.99', distribution: { min: '5.00', max: '5,000.00', median: '79.99' } },

    // Support & Engagement columns
    { name: 'support_tickets_total', type: 'INTEGER', nullable: false, primaryKey: false, description: 'Total support tickets created', source: 'zendesk', nullRate: 0, cardinality: 87, example: '12', distribution: { min: '0', max: '342', median: '2' } },
    { name: 'support_tickets_open', type: 'INTEGER', nullable: false, primaryKey: false, description: 'Currently open support tickets', source: 'zendesk', nullRate: 0, cardinality: 15, example: '1', distribution: { min: '0', max: '23', median: '0' } },
    { name: 'last_support_date', type: 'DATE', nullable: true, primaryKey: false, description: 'Date of most recent support interaction', source: 'zendesk', nullRate: 45.3, cardinality: 1095, example: '2025-09-20', distribution: { min: '2022-01-01', max: '2025-10-10', median: '2025-04-15' } },
    { name: 'satisfaction_score', type: 'DECIMAL(3,2)', nullable: true, primaryKey: false, description: 'Customer satisfaction score (0-5)', source: 'zendesk', nullRate: 52.1, cardinality: 51, example: '4.25', distribution: { min: '0.00', max: '5.00', median: '4.00' } },

    // Analytics & ML columns
    { name: 'churn_risk_score', type: 'DECIMAL(5,4)', nullable: false, primaryKey: false, description: 'ML-predicted churn probability (0-1)', source: 'ml-model', nullRate: 0, cardinality: 10001, example: '0.3456', distribution: { min: '0.0001', max: '0.9999', median: '0.2347' } },
    { name: 'churn_risk_tier', type: 'VARCHAR(20)', nullable: false, primaryKey: false, description: 'Churn risk classification', source: 'ml-model', nullRate: 0, cardinality: 4, example: 'medium', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'clv_prediction', type: 'DECIMAL(10,2)', nullable: true, primaryKey: false, description: 'Predicted customer lifetime value (12mo)', source: 'ml-model', nullRate: 3.2, cardinality: 456789, example: '2847.92', distribution: { min: '0.00', max: '50,000.00', median: '1,247.50' } },
    { name: 'propensity_to_buy', type: 'DECIMAL(5,4)', nullable: true, primaryKey: false, description: 'ML-predicted purchase probability (next 30d)', source: 'ml-model', nullRate: 3.2, cardinality: 10001, example: '0.6789', distribution: { min: '0.0001', max: '0.9999', median: '0.4512' } },

    // Web Analytics columns
    { name: 'total_sessions', type: 'INTEGER', nullable: false, primaryKey: false, description: 'Total website sessions', source: 'google-analytics', nullRate: 0, cardinality: 5678, example: '247', distribution: { min: '0', max: '12,456', median: '42' } },
    { name: 'avg_session_duration', type: 'INTEGER', nullable: true, primaryKey: false, description: 'Average session duration (seconds)', source: 'google-analytics', nullRate: 5.6, cardinality: 3456, example: '342', distribution: { min: '0', max: '7,200', median: '180' } },
    { name: 'bounce_rate', type: 'DECIMAL(5,4)', nullable: true, primaryKey: false, description: 'Website bounce rate', source: 'google-analytics', nullRate: 5.6, cardinality: 1001, example: '0.4523', distribution: { min: '0.0000', max: '1.0000', median: '0.3456' } },
    { name: 'pages_per_session', type: 'DECIMAL(5,2)', nullable: true, primaryKey: false, description: 'Average pages viewed per session', source: 'google-analytics', nullRate: 5.6, cardinality: 456, example: '4.56', distribution: { min: '0.00', max: '50.00', median: '3.25' } },
    { name: 'last_visit_date', type: 'DATE', nullable: true, primaryKey: false, description: 'Date of most recent website visit', source: 'google-analytics', nullRate: 12.3, cardinality: 1095, example: '2025-10-09', distribution: { min: '2022-01-01', max: '2025-10-10', median: '2025-08-15' } },

    // Additional demographic & enrichment
    { name: 'company_name', type: 'VARCHAR(200)', nullable: true, primaryKey: false, description: 'Company/organization name', source: 'salesforce', nullRate: 35.7, cardinality: 123456, example: 'Acme Corp', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'company_size', type: 'VARCHAR(50)', nullable: true, primaryKey: false, description: 'Company size category', source: 'salesforce', nullRate: 42.3, cardinality: 7, example: '50-200', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'industry', type: 'VARCHAR(100)', nullable: true, primaryKey: false, description: 'Industry classification', source: 'salesforce', nullRate: 38.9, cardinality: 45, example: 'Technology', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'country', type: 'VARCHAR(100)', nullable: false, primaryKey: false, description: 'Country code (ISO 3166-1 alpha-2)', source: 'salesforce', nullRate: 0.4, cardinality: 47, example: 'US', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'state_province', type: 'VARCHAR(100)', nullable: true, primaryKey: false, description: 'State or province', source: 'salesforce', nullRate: 15.6, cardinality: 234, example: 'CA', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'city', type: 'VARCHAR(100)', nullable: true, primaryKey: false, description: 'City name', source: 'salesforce', nullRate: 15.6, cardinality: 12345, example: 'San Francisco', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'postal_code', type: 'VARCHAR(20)', nullable: true, primaryKey: false, description: 'Postal/ZIP code', source: 'salesforce', nullRate: 18.2, cardinality: 45678, example: '94102', distribution: { min: '-', max: '-', median: '-' }, isPII: true },
    { name: 'timezone', type: 'VARCHAR(50)', nullable: true, primaryKey: false, description: 'IANA timezone identifier', source: 'salesforce', nullRate: 12.4, cardinality: 87, example: 'America/Los_Angeles', distribution: { min: '-', max: '-', median: '-' } },

    // Marketing & Attribution
    { name: 'acquisition_source', type: 'VARCHAR(100)', nullable: true, primaryKey: false, description: 'Original acquisition source', source: 'google-analytics', nullRate: 8.9, cardinality: 23, example: 'organic_search', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'acquisition_medium', type: 'VARCHAR(100)', nullable: true, primaryKey: false, description: 'Original acquisition medium', source: 'google-analytics', nullRate: 8.9, cardinality: 15, example: 'google', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'acquisition_campaign', type: 'VARCHAR(200)', nullable: true, primaryKey: false, description: 'Original acquisition campaign', source: 'google-analytics', nullRate: 45.6, cardinality: 456, example: 'summer_2025_promo', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'email_subscribed', type: 'BOOLEAN', nullable: false, primaryKey: false, description: 'Marketing email subscription status', source: 'salesforce', nullRate: 0, cardinality: 2, example: 'true', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'email_engagement_score', type: 'DECIMAL(3,2)', nullable: true, primaryKey: false, description: 'Email engagement score (0-5)', source: 'salesforce', nullRate: 18.7, cardinality: 51, example: '3.45', distribution: { min: '0.00', max: '5.00', median: '2.75' } },

    // Product usage (if SaaS)
    { name: 'product_tier', type: 'VARCHAR(50)', nullable: false, primaryKey: false, description: 'Current product subscription tier', source: 'stripe', nullRate: 0, cardinality: 6, example: 'professional', distribution: { min: '-', max: '-', median: '-' } },
    { name: 'subscription_start_date', type: 'DATE', nullable: true, primaryKey: false, description: 'Current subscription start date', source: 'stripe', nullRate: 12.3, cardinality: 1095, example: '2024-01-15', distribution: { min: '2022-01-01', max: '2025-10-10', median: '2023-11-20' } },
    { name: 'subscription_renewal_date', type: 'DATE', nullable: true, primaryKey: false, description: 'Next subscription renewal date', source: 'stripe', nullRate: 12.3, cardinality: 365, example: '2026-01-15', distribution: { min: '2025-10-11', max: '2026-12-31', median: '2026-03-15' } },
    { name: 'mrr', type: 'DECIMAL(10,2)', nullable: true, primaryKey: false, description: 'Monthly recurring revenue', source: 'stripe', nullRate: 12.3, cardinality: 234, example: '99.00', distribution: { min: '0.00', max: '5,000.00', median: '49.00' } },
    { name: 'feature_usage_count', type: 'INTEGER', nullable: true, primaryKey: false, description: 'Total feature usage count (last 30d)', source: 'app-events', nullRate: 15.6, cardinality: 1234, example: '456', distribution: { min: '0', max: '50,000', median: '127' } },

    // System metadata
    { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false, description: 'Record creation timestamp', source: 'system', nullRate: 0, cardinality: 2547893, example: '2023-05-15 10:32:47', distribution: { min: '2022-01-01 00:00:00', max: '2025-10-10 23:59:59', median: '2023-08-15 12:00:00' } },
    { name: 'updated_at', type: 'TIMESTAMP', nullable: false, primaryKey: false, description: 'Record last update timestamp', source: 'system', nullRate: 0, cardinality: 2547893, example: '2025-10-10 14:15:23', distribution: { min: '2022-01-01 00:00:00', max: '2025-10-10 23:59:59', median: '2025-08-15 12:00:00' } },
    { name: '_etl_loaded_at', type: 'TIMESTAMP', nullable: false, primaryKey: false, description: 'ETL pipeline load timestamp', source: 'system', nullRate: 0, cardinality: 8760, example: '2025-10-10 14:00:00', distribution: { min: '2025-01-01 00:00:00', max: '2025-10-10 14:00:00', median: '2025-05-15 12:00:00' } },
  ];

  return coreColumns;
};

export function SchemaTab({ product }: SchemaTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'essential' | 'full'>('essential');
  const fullSchema = generateFullSchema();

  // Top 10 most-used columns (based on typical analyst queries)
  const essentialColumns = [
    'customer_id',
    'email',
    'segment',
    'lifetime_value',
    'last_purchase_date',
    'account_status',
    'churn_risk_score',
    'total_orders',
    'signup_date',
    'product_tier'
  ];

  const displaySchema = viewMode === 'essential'
    ? fullSchema.filter(col => essentialColumns.includes(col.name))
    : fullSchema;

  const filteredColumns = displaySchema.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sourceSystemCounts = fullSchema.reduce((acc, col) => {
    acc[col.source] = (acc[col.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Schema Header with Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">
                Table: iceberg_prod.analytics.{product.id}
              </h3>
              <p className="text-sm text-muted-foreground">
                Schema Version: {product.version} • {fullSchema.length} columns • {fullSchema.filter(c => c.isPII).length} PII fields
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'essential' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('essential')}
                  className="h-8 text-xs"
                >
                  Essential
                </Button>
                <Button
                  variant={viewMode === 'full' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('full')}
                  className="h-8 text-xs"
                >
                  Full Dictionary
                </Button>
              </div>
              {/* Search Box */}
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search columns by name, type, or description..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Source System Breakdown */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">Source Systems:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sourceSystemCounts).map(([source, count]) => (
                <Badge key={source} variant="outline" className="gap-1.5">
                  <TechLogo tech={source} className="h-3 w-3" />
                  {source}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Schema Table with Distribution Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {viewMode === 'essential' ? 'Essential Columns' : 'Complete Data Dictionary'} ({filteredColumns.length} of {displaySchema.length} columns{viewMode === 'essential' ? ' shown' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'essential' && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-blue-900 dark:text-blue-100">
                    Showing the 10 most commonly used columns for quick reference.
                  </span>
                  <span className="text-blue-700 dark:text-blue-300 ml-1">
                    Switch to "Full Dictionary" above to see all {fullSchema.length} columns with detailed statistics.
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {filteredColumns.map((column) => (
              <div key={column.name} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono font-semibold text-base">{column.name}</code>
                    {column.primaryKey && (
                      <Badge variant="default" className="h-5">Primary Key</Badge>
                    )}
                    {column.nullable === false && !column.primaryKey && (
                      <Badge variant="secondary" className="h-5">Required</Badge>
                    )}
                    {column.isPII && (
                      <Badge variant="outline" className="h-5 border-amber-600 text-amber-600">
                        <Shield className="h-3 w-3 mr-1" />
                        PII
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">{column.type}</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{column.description}</p>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="h-8">
                    <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                    <TabsTrigger value="stats" className="text-xs">Statistics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Source System</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <TechLogo tech={column.source} className="h-3 w-3" />
                          <span className="font-medium text-xs">{column.source}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Null Rate</div>
                        <div className={`font-medium mt-1 ${column.nullRate === 0 ? 'text-emerald-600' : column.nullRate < 5 ? 'text-green-600' : column.nullRate < 20 ? 'text-amber-600' : 'text-red-600'}`}>
                          {column.nullRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Unique Values</div>
                        <div className="font-medium mt-1">{column.cardinality.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Example</div>
                        <code className="font-mono text-xs mt-1 block truncate">{column.example}</code>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="mt-3">
                    {column.distribution.min !== '-' ? (
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="p-2 bg-muted/30 rounded">
                          <div className="text-xs text-muted-foreground">Min</div>
                          <div className="font-mono font-medium mt-1">{column.distribution.min}</div>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <div className="text-xs text-muted-foreground">Median</div>
                          <div className="font-mono font-medium mt-1">{column.distribution.median}</div>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <div className="text-xs text-muted-foreground">Max</div>
                          <div className="font-mono font-medium mt-1">{column.distribution.max}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2 bg-muted/20 rounded">
                        <Info className="h-4 w-4 inline mr-2" />
                        Distribution statistics not applicable for {column.type} type
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ))}
          </div>

          {filteredColumns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No columns match your search criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Table Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="p-4 border rounded-lg">
              <div className="text-muted-foreground mb-1">Total Rows</div>
              <div className="text-2xl font-bold">2,547,893</div>
              <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +2.3% this month
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-muted-foreground mb-1">Total Columns</div>
              <div className="text-2xl font-bold">{fullSchema.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {fullSchema.filter(c => c.isPII).length} PII fields
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-muted-foreground mb-1">Compressed Size</div>
              <div className="text-2xl font-bold">847 GB</div>
              <div className="text-xs text-muted-foreground mt-1">
                Parquet/Snappy
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-muted-foreground mb-1">Partitions</div>
              <div className="text-2xl font-bold">2,489</div>
              <div className="text-xs text-muted-foreground mt-1">
                By signup_date (daily)
              </div>
            </div>
          </div>

          {/* Partitioning Strategy */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm mb-1">Query Optimization Tips</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• <strong>Primary key:</strong> Always use <code className="font-mono bg-muted px-1 py-0.5 rounded">customer_id</code> for point lookups</div>
                  <div>• <strong>Partitioning:</strong> Filter by <code className="font-mono bg-muted px-1 py-0.5 rounded">signup_date</code> to reduce scan size (daily partitions)</div>
                  <div>• <strong>Indexing:</strong> <code className="font-mono bg-muted px-1 py-0.5 rounded">customer_id</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">email</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">segment</code> are indexed</div>
                  <div>• <strong>Avoid:</strong> Full table scans on <code className="font-mono bg-muted px-1 py-0.5 rounded">lifetime_value</code> or <code className="font-mono bg-muted px-1 py-0.5 rounded">churn_risk_score</code> without date filters</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
