'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Star, Quote, Target, Play, Database, Code } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OverviewTabProps {
  product: any; // Will be properly typed
}

export function OverviewTab({ product }: OverviewTabProps) {
  const upstreamCount = product.dependencies.upstream.length;
  const downstreamCount = product.dependencies.downstream.length;

  // Sample data for preview
  const sampleData = [
    { customer_id: 'C12345', name: 'John Doe', lifetime_value: 12450, last_purchase: '2024-01-15', status: 'Active' },
    { customer_id: 'C12346', name: 'Jane Smith', lifetime_value: 8920, last_purchase: '2024-01-12', status: 'Active' },
    { customer_id: 'C12347', name: 'Bob Johnson', lifetime_value: 15670, last_purchase: '2024-01-10', status: 'Premium' },
  ];

  return (
    <div className="space-y-6">
      {/* Purpose & Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Purpose & Use Cases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-base font-semibold mb-2">What is this product?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-2">Common Use Cases</h4>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span className="text-muted-foreground">Customer segmentation and targeted marketing campaigns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span className="text-muted-foreground">Churn prediction and retention analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span className="text-muted-foreground">Customer lifetime value modeling and forecasting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span className="text-muted-foreground">Executive dashboards and KPI reporting</span>
              </li>
            </ul>
          </div>

          {product.productType === 'Domain' && (
            <div>
              <h4 className="text-base font-semibold mb-2">Data Sources Combined</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li className="text-muted-foreground">• Demographic information (CRM)</li>
                <li className="text-muted-foreground">• Transaction history (billing systems)</li>
                <li className="text-muted-foreground">• Support interactions (Zendesk)</li>
                <li className="text-muted-foreground">• Product usage (application logs)</li>
                <li className="text-muted-foreground">• Marketing engagement (email, campaigns)</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Play className="h-5 w-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold mb-1">Request Access</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Request Access" in the header. Approvals typically take 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold mb-1">Review Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  Check the Schema tab for column definitions and the Quality tab for data freshness guarantees.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold mb-1">Connect Your Tool</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use the connection details provided after access is granted. Sample connection strings:
                </p>
                <div className="rounded-lg bg-muted p-3 font-mono text-xs">
                  <div className="mb-1">
                    <span className="text-muted-foreground">Trino:</span>{' '}
                    <span className="text-foreground">trino://catalog.schema.customer_360_view</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Python:</span>{' '}
                    <span className="text-foreground">df = spark.table("customer_360_view")</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                4
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold mb-1">Run Sample Queries</h4>
                <p className="text-sm text-muted-foreground">
                  Start with the sample queries in the Usage tab to familiarize yourself with the data structure.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <Button variant="outline" size="sm">
              <Code className="mr-2 h-4 w-4" />
              View Sample Queries
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sample Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sample Data Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Preview of the first 3 rows (anonymized sample data)
          </p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">customer_id</TableHead>
                  <TableHead className="font-mono text-xs">name</TableHead>
                  <TableHead className="font-mono text-xs">lifetime_value</TableHead>
                  <TableHead className="font-mono text-xs">last_purchase</TableHead>
                  <TableHead className="font-mono text-xs">status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.map((row) => (
                  <TableRow key={row.customer_id}>
                    <TableCell className="font-mono text-xs">{row.customer_id}</TableCell>
                    <TableCell className="text-sm">{row.name}</TableCell>
                    <TableCell className="text-sm">${row.lifetime_value.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{row.last_purchase}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'Premium' ? 'default' : 'secondary'} className="text-xs">
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between pt-3">
            <p className="text-xs text-muted-foreground">
              Total rows: 2,341,567 • Columns: 47
            </p>
            <Button variant="outline" size="sm">
              Download Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{product.usage.uniqueConsumers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{product.sla.freshness}</div>
              <div className="text-sm text-muted-foreground">Update Frequency</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">7 years</div>
              <div className="text-sm text-muted-foreground">Historical Data</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">847 GB</div>
              <div className="text-sm text-muted-foreground">Storage Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependencies */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upstream Dependencies */}
        {upstreamCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Upstream Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-3">
                  This product depends on {upstreamCount} source{upstreamCount !== 1 ? 's' : ''}:
                </div>
                {product.dependencies.upstream.map((dep: string) => (
                  <div key={dep} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="text-sm font-medium">{dep}</span>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Downstream Dependencies */}
        {downstreamCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Downstream Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-3">
                  {downstreamCount} product{downstreamCount !== 1 ? 's' : ''} depend{downstreamCount === 1 ? 's' : ''} on this data:
                </div>
                {product.dependencies.downstream.slice(0, 3).map((dep: string) => (
                  <div key={dep} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="text-sm font-medium">{dep}</span>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {downstreamCount > 3 && (
                  <div className="text-sm text-muted-foreground text-center pt-2">
                    +{downstreamCount - 3} more products
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Quote className="h-5 w-5" />
            User Testimonials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="border-l-4 border-primary pl-4 py-2">
              <p className="text-sm italic mb-2">
                "This is our single source of truth for customer data. Reliable, fast, and always up-to-date."
              </p>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground ml-2">
                  — Maria Rodriguez, Marketing Analytics Manager
                </span>
              </div>
            </div>

            <div className="border-l-4 border-primary pl-4 py-2">
              <p className="text-sm italic mb-2">
                "The quality is exceptional. We use this for our churn prediction model and have 98% confidence in the data."
              </p>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground ml-2">
                  — James Chen, Lead Data Scientist
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm">
              View All Reviews ({product.reviews})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Contact Owner
            </Button>
            <Button variant="outline" className="justify-start">
              Download Sample
            </Button>
            <Button variant="outline" className="justify-start">
              View Changelog
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
