'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Code, Copy, ExternalLink, Radio, Download, Key, Check, RefreshCw } from 'lucide-react';

interface AccessTabProps {
  product: any;
}

export function AccessTab({ product }: AccessTabProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('sk_live_xxxxxxxxxxxxxxxxxx');
  const [exportFormat, setExportFormat] = useState<string>('parquet');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const connectionString = `trino://nexusone.company.com:443/iceberg_prod/analytics/${product.id}`;
  const sampleQuery = `SELECT
  customer_id,
  email,
  total_revenue,
  churn_risk_score
FROM iceberg_prod.analytics.customer_360
WHERE signup_date >= DATE '2024-01-01'
LIMIT 100;`;

  const apiEndpoint = `https://api.nexusone.company.com/v1/products/${product.id}/query`;
  const curlExample = `curl -X POST '${apiEndpoint}' \\
  -H 'Authorization: Bearer ${apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "query": "SELECT * FROM ${product.id} LIMIT 100",
    "format": "json"
  }'`;

  const pythonExample = `import requests

headers = {
    'Authorization': f'Bearer ${apiKey}',
    'Content-Type': 'application/json'
}

response = requests.post(
    '${apiEndpoint}',
    headers=headers,
    json={
        'query': 'SELECT * FROM ${product.id} LIMIT 100',
        'format': 'json'
    }
)

data = response.json()`;

  const kafkaTopic = `data-products.${product.domain}.${product.id}`;
  const kafkaConfig = `bootstrap.servers=kafka.nexusone.company.com:9092
security.protocol=SASL_SSL
sasl.mechanism=PLAIN
sasl.username=your_username
sasl.password=your_password
group.id=your_consumer_group`;

  const handleCopy = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    // Simulate API call
    setTimeout(() => {
      const newKey = `sk_live_${Math.random().toString(36).substring(2, 24)}`;
      setApiKey(newKey);
      setIsGeneratingKey(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* SQL Access */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              SQL Query Access
            </CardTitle>
            <Badge>Recommended for Analytics</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Query directly in your BI tool or SQL client. Best for analysis, dashboards, and ad-hoc queries.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Connection String</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                    {connectionString}
                  </code>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Sample Query</label>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded text-sm font-mono overflow-x-auto">
                    {sampleQuery}
                  </pre>
                  <Button size="sm" variant="outline" className="absolute top-2 right-2">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Setup Guides</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect from Tableau
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect from Power BI
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect from Python/Pandas
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect from Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REST API Access */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              REST API Access
            </CardTitle>
            <Badge>Recommended for Applications</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Programmatic access via REST API. Best for applications, microservices, and integrations.
          </p>

          {/* API Key Management */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Key
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Keep this key secure and never commit to version control
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateKey}
                disabled={isGeneratingKey}
              >
                {isGeneratingKey ? (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={apiKey}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(apiKey, 'apiKey')}
              >
                {copiedItem === 'apiKey' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* API Endpoint */}
          <div>
            <label className="text-sm font-medium mb-1 block">API Endpoint</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                {apiEndpoint}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(apiEndpoint, 'endpoint')}
              >
                {copiedItem === 'endpoint' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Code Examples */}
          <div>
            <label className="text-sm font-medium mb-2 block">cURL Example</label>
            <div className="relative">
              <pre className="p-4 bg-muted rounded text-xs font-mono overflow-x-auto">
                {curlExample}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(curlExample, 'curl')}
              >
                {copiedItem === 'curl' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Python Example</label>
            <div className="relative">
              <pre className="p-4 bg-muted rounded text-xs font-mono overflow-x-auto">
                {pythonExample}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(pythonExample, 'python')}
              >
                {copiedItem === 'python' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full API Documentation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kafka Stream */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Kafka Stream Access
            </CardTitle>
            <Badge variant="secondary">Real-time</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Real-time streaming access. Best for stream processing and event-driven applications.
          </p>

          <div>
            <label className="text-sm font-medium mb-1 block">Topic Name</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                {kafkaTopic}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(kafkaTopic, 'topic')}
              >
                {copiedItem === 'topic' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Connection Configuration</label>
            <div className="relative">
              <pre className="p-4 bg-muted rounded text-xs font-mono overflow-x-auto">
                {kafkaConfig}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(kafkaConfig, 'kafka')}
              >
                {copiedItem === 'kafka' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Stream Characteristics</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>• Update frequency: {product.sla.freshness}</div>
              <div>• Message format: Avro (schema registry enabled)</div>
              <div>• Retention: 7 days</div>
              <div>• Partitions: 12</div>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Kafka Consumer Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Export */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              File Export
            </CardTitle>
            <Badge variant="outline">Batch Download</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download complete dataset snapshot. Best for offline analysis and backup.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parquet">Parquet (Recommended for large datasets)</SelectItem>
                  <SelectItem value="csv">CSV (Universal compatibility)</SelectItem>
                  <SelectItem value="json">JSON (Web-friendly)</SelectItem>
                  <SelectItem value="avro">Avro (Schema evolution)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated file size:</span>
                <span className="font-medium">~2.4 GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Row count:</span>
                <span className="font-medium">{product.usage.uniqueConsumers.toLocaleString()} rows</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated:</span>
                <span className="font-medium">{product.lastUpdated}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Export Full Dataset
              </Button>
              <Button variant="outline">
                Export Sample (1000 rows)
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <strong>Note:</strong> Exports are generated asynchronously. You'll receive an email with download link when ready (typically 5-10 minutes).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
