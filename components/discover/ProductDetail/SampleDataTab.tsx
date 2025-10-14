'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Copy, Eye, Info } from 'lucide-react';

interface SampleDataTabProps {
  product: any;
}

export function SampleDataTab({ product }: SampleDataTabProps) {
  // Sample data preview
  const sampleData = [
    {
      customer_id: 'C12345',
      name: 'John Doe',
      segment: 'VIP',
      lifetime_value: 12450,
      churn_risk: 0.12,
      last_purchase: '2025-01-15',
      account_status: 'active'
    },
    {
      customer_id: 'C12346',
      name: 'Jane Smith',
      segment: 'High Value',
      lifetime_value: 8920,
      churn_risk: 0.34,
      last_purchase: '2025-01-12',
      account_status: 'active'
    },
    {
      customer_id: 'C12347',
      name: 'Bob Johnson',
      segment: 'Premium',
      lifetime_value: 15670,
      churn_risk: 0.08,
      last_purchase: '2025-01-10',
      account_status: 'active'
    },
    {
      customer_id: 'C12348',
      name: 'Alice Williams',
      segment: 'Standard',
      lifetime_value: 4230,
      churn_risk: 0.67,
      last_purchase: '2024-11-23',
      account_status: 'active'
    },
    {
      customer_id: 'C12349',
      name: 'Charlie Brown',
      segment: 'VIP',
      lifetime_value: 22100,
      churn_risk: 0.05,
      last_purchase: '2025-01-14',
      account_status: 'active'
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getChurnColor = (risk: number) => {
    if (risk < 0.3) return 'text-emerald-600 dark:text-emerald-400';
    if (risk < 0.6) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Sample Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Data Preview (5 of 2,341,567 rows)</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-3 w-3" />
                Download Sample (1000 rows)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono text-xs">customer_id</TableHead>
                    <TableHead className="font-mono text-xs">name</TableHead>
                    <TableHead className="font-mono text-xs">segment</TableHead>
                    <TableHead className="font-mono text-xs text-right">lifetime_value</TableHead>
                    <TableHead className="font-mono text-xs text-right">churn_risk</TableHead>
                    <TableHead className="font-mono text-xs">last_purchase</TableHead>
                    <TableHead className="font-mono text-xs">status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleData.map((row) => (
                    <TableRow key={row.customer_id}>
                      <TableCell className="font-mono text-xs">{row.customer_id}</TableCell>
                      <TableCell className="text-sm">{row.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={row.segment === 'VIP' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {row.segment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-right font-mono">
                        ${row.lifetime_value.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-sm text-right font-mono font-semibold ${getChurnColor(row.churn_risk)}`}>
                        {(row.churn_risk * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-sm font-mono">{row.last_purchase}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {row.account_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div>
              Showing 7 of 47 columns • {sampleData.length} of 2,341,567 rows
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <span>Sanitized for privacy</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Column Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="border-l-4 border-primary pl-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <code className="font-mono font-semibold">customer_id</code>
                <Badge variant="outline" className="text-xs">VARCHAR(50)</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Unique identifier for each customer. Use this for joins with other datasets.
              </p>
            </div>

            <div className="border-l-4 border-muted pl-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <code className="font-mono font-semibold">segment</code>
                <Badge variant="outline" className="text-xs">VARCHAR(50)</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Customer classification (VIP, High Value, Premium, Standard, etc.)
              </p>
            </div>

            <div className="border-l-4 border-muted pl-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <code className="font-mono font-semibold">lifetime_value</code>
                <Badge variant="outline" className="text-xs">DECIMAL(18,2)</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Total revenue generated by this customer. Updated daily.
              </p>
            </div>

            <div className="border-l-4 border-muted pl-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <code className="font-mono font-semibold">churn_risk</code>
                <Badge variant="outline" className="text-xs">DECIMAL(5,4)</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                ML-predicted probability of churn in next 30 days (0.0 to 1.0)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Query Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Try These Sample Queries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">1. Find high-value at-risk customers</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`SELECT customer_id, name, lifetime_value, churn_risk\nFROM customer.customer_360\nWHERE lifetime_value > 10000\n  AND churn_risk > 0.5\nORDER BY lifetime_value DESC\nLIMIT 50;`)}
                className="gap-2"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <pre className="font-mono text-xs text-foreground overflow-x-auto">
{`SELECT customer_id, name, lifetime_value, churn_risk
FROM customer.customer_360
WHERE lifetime_value > 10000
  AND churn_risk > 0.5
ORDER BY lifetime_value DESC
LIMIT 50;`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Identifies valuable customers who need retention attention
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">2. Customer segment distribution</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`SELECT segment, COUNT(*) as customer_count, AVG(lifetime_value) as avg_ltv\nFROM customer.customer_360\nWHERE account_status = 'active'\nGROUP BY segment\nORDER BY avg_ltv DESC;`)}
                className="gap-2"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <pre className="font-mono text-xs text-foreground overflow-x-auto">
{`SELECT segment,
       COUNT(*) as customer_count,
       AVG(lifetime_value) as avg_ltv
FROM customer.customer_360
WHERE account_status = 'active'
GROUP BY segment
ORDER BY avg_ltv DESC;`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Analyzes customer distribution and value across segments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Eye className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Like what you see?</h3>
              <p className="text-muted-foreground mb-4">
                This sample gives you a preview. Request access to query all 2.3M records with all 47 columns.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg">
                  Request Full Access
                </Button>
                <Button variant="outline" size="lg">
                  View Full Schema →
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
