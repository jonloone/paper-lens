'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, FileCode, Sparkles, Database, Code2, BarChart3, CheckCircle } from 'lucide-react';

interface QuickStartTabProps {
  product: any;
}

export function QuickStartTab({ product }: QuickStartTabProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  return (
    <div className="space-y-8">
      {/* Get Started Steps */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Get Started in 2 Steps</h2>

        <div className="space-y-4">
          {/* Step 1: Request Access */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Request Access</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Request Access" to submit your access request. Approvals typically take 1-2 business days.
                  </p>
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Request Access Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Connect Your Tool */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3">Connect Your Tool</h3>

                  <Tabs defaultValue="sql" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="sql" className="gap-2">
                    <Database className="h-4 w-4" />
                    SQL
                  </TabsTrigger>
                  <TabsTrigger value="python" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="bi" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    BI Tools
                  </TabsTrigger>
                </TabsList>

                {/* SQL Tab */}
                <TabsContent value="sql" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Connection String</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('trino://catalog.customer.customer_360_view')}
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                      trino://catalog.customer.customer_360_view
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sample Query</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            `SELECT customer_id, name, segment, lifetime_value\nFROM customer.customer_360_view\nWHERE segment = 'VIP'\nLIMIT 10;`
                          )
                        }
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <pre className="font-mono text-sm text-foreground">
                        <code>{`SELECT customer_id, name, segment, lifetime_value
FROM customer.customer_360_view
WHERE segment = 'VIP'
LIMIT 10;`}</code>
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                {/* Python Tab */}
                <TabsContent value="python" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">PySpark</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`df = spark.table("customer.customer_360_view")`)}
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <pre className="font-mono text-sm text-foreground">
                        <code>{`# Load data using PySpark
df = spark.table("customer.customer_360_view")

# Preview first 10 rows
df.limit(10).show()`}</code>
                      </pre>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Trino (pandas)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            `from trino import dbapi\nconn = dbapi.connect(host='trino.company.com')\ndf = pd.read_sql("SELECT * FROM customer.customer_360_view LIMIT 100", conn)`
                          )
                        }
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <pre className="font-mono text-sm text-foreground">
                        <code>{`from trino import dbapi
import pandas as pd

conn = dbapi.connect(host='trino.company.com')
df = pd.read_sql(
    "SELECT * FROM customer.customer_360_view LIMIT 100",
    conn
)`}</code>
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                {/* BI Tools Tab */}
                <TabsContent value="bi" className="space-y-3">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileCode className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Tableau</div>
                          <div className="text-sm text-muted-foreground">Download connection file</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-2" />
                        Download .tds
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileCode className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Power BI</div>
                          <div className="text-sm text-muted-foreground">Connection guide</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Guide
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileCode className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Looker</div>
                          <div className="text-sm text-muted-foreground">LookML template</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Common Use Cases */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Common Use Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium mb-1">Customer Segmentation</div>
              <div className="text-sm text-muted-foreground">
                Query by <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">segment</code> field (VIP, High
                Value, etc.)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium mb-1">Churn Analysis</div>
              <div className="text-sm text-muted-foreground">
                Join with <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">churn_prediction</code> product
                for risk scoring
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium mb-1">Revenue Forecasting</div>
              <div className="text-sm text-muted-foreground">
                Use <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">lifetime_value</code> +{' '}
                <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">last_purchase_date</code> for
                predictions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-muted/50 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Need help getting started?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Our team can help you integrate this data product into your workflows
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Contact Owner
                </Button>
                <Button variant="outline" size="sm">
                  View Full Documentation
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
