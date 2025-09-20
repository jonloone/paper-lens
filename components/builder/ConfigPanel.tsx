import React, { useState } from 'react';
import { Node } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, AlertCircle, Info } from 'lucide-react';

interface ConfigPanelProps {
  node: Node;
  onUpdate: (updates: any) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ node, onUpdate }) => {
  const [config, setConfig] = useState(node.data.config || {});

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate({ config: newConfig });
  };

  const renderSourceConfig = () => (
    <>
      <div className="space-y-4">
        <div>
          <Label>Source Type</Label>
          <Select 
            value={config.system || 'kafka'}
            onValueChange={(value) => handleConfigChange('system', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kafka">Apache Kafka</SelectItem>
              <SelectItem value="kinesis">AWS Kinesis</SelectItem>
              <SelectItem value="pubsub">Google Pub/Sub</SelectItem>
              <SelectItem value="s3">Amazon S3</SelectItem>
              <SelectItem value="gcs">Google Cloud Storage</SelectItem>
              <SelectItem value="postgres">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="api">REST API</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(config.system === 'kafka' || config.system === 'kinesis' || config.system === 'pubsub') && (
          <div>
            <Label>Topic/Stream</Label>
            <Input
              value={config.topic || ''}
              onChange={(e) => handleConfigChange('topic', e.target.value)}
              placeholder="e.g., customer-events"
            />
          </div>
        )}

        {(config.system === 's3' || config.system === 'gcs') && (
          <div>
            <Label>Path Pattern</Label>
            <Input
              value={config.path || ''}
              onChange={(e) => handleConfigChange('path', e.target.value)}
              placeholder="e.g., s3://bucket/path/*.parquet"
            />
          </div>
        )}

        <div>
          <Label>Data Format</Label>
          <Select 
            value={config.format || 'json'}
            onValueChange={(value) => handleConfigChange('format', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="avro">Avro</SelectItem>
              <SelectItem value="parquet">Parquet</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="orc">ORC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Enable Schema Registry</Label>
          <Switch
            checked={config.schemaRegistry || false}
            onCheckedChange={(checked) => handleConfigChange('schemaRegistry', checked)}
          />
        </div>
      </div>
    </>
  );

  const renderTransformConfig = () => (
    <>
      <div className="space-y-4">
        <div>
          <Label>Processing Engine</Label>
          <Select 
            value={config.engine || 'auto'}
            onValueChange={(value) => handleConfigChange('engine', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-select (Recommended)</SelectItem>
              <SelectItem value="spark">Apache Spark</SelectItem>
              <SelectItem value="flink">Apache Flink</SelectItem>
              <SelectItem value="beam">Apache Beam</SelectItem>
              <SelectItem value="trino">Trino SQL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Window Size (for aggregations)</Label>
          <Select 
            value={config.window || '1hour'}
            onValueChange={(value) => handleConfigChange('window', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1min">1 Minute</SelectItem>
              <SelectItem value="5min">5 Minutes</SelectItem>
              <SelectItem value="15min">15 Minutes</SelectItem>
              <SelectItem value="1hour">1 Hour</SelectItem>
              <SelectItem value="1day">1 Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Enable Caching</Label>
          <Switch
            checked={config.caching || false}
            onCheckedChange={(checked) => handleConfigChange('caching', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Incremental Processing</Label>
          <Switch
            checked={config.incremental !== false}
            onCheckedChange={(checked) => handleConfigChange('incremental', checked)}
          />
        </div>
      </div>
    </>
  );

  const renderQualityConfig = () => (
    <>
      <div className="space-y-4">
        <div>
          <Label>Completeness Threshold</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              value={(config.thresholds?.completeness || 0.95) * 100}
              onChange={(e) => handleConfigChange('thresholds', {
                ...config.thresholds,
                completeness: parseFloat(e.target.value) / 100
              })}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>Check for Nulls</Label>
          <Switch
            checked={config.nullCheck !== false}
            onCheckedChange={(checked) => handleConfigChange('nullCheck', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Schema Validation</Label>
          <Switch
            checked={config.schemaValidation !== false}
            onCheckedChange={(checked) => handleConfigChange('schemaValidation', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Anomaly Detection</Label>
          <Switch
            checked={config.anomalyDetection || false}
            onCheckedChange={(checked) => handleConfigChange('anomalyDetection', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>PII Detection</Label>
          <Switch
            checked={config.piiDetection || false}
            onCheckedChange={(checked) => handleConfigChange('piiDetection', checked)}
          />
        </div>
      </div>
    </>
  );

  const renderSinkConfig = () => (
    <>
      <div className="space-y-4">
        <div>
          <Label>Storage Format</Label>
          <Select 
            value={config.format || 'iceberg'}
            onValueChange={(value) => handleConfigChange('format', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iceberg">Apache Iceberg</SelectItem>
              <SelectItem value="delta">Delta Lake</SelectItem>
              <SelectItem value="hudi">Apache Hudi</SelectItem>
              <SelectItem value="parquet">Parquet</SelectItem>
              <SelectItem value="postgres">PostgreSQL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Storage Path</Label>
          <Input
            value={config.path || ''}
            onChange={(e) => handleConfigChange('path', e.target.value)}
            placeholder="e.g., s3://data-lake/analytics/"
          />
        </div>

        <div>
          <Label>Partitioning Strategy</Label>
          <Select 
            value={config.partitioning || 'daily'}
            onValueChange={(value) => handleConfigChange('partitioning', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Partitioning</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="year_month_day">Year/Month/Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Enable Compaction</Label>
          <Switch
            checked={config.compaction !== false}
            onCheckedChange={(checked) => handleConfigChange('compaction', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Enable Compression</Label>
          <Switch
            checked={config.compression !== false}
            onCheckedChange={(checked) => handleConfigChange('compression', checked)}
          />
        </div>
      </div>
    </>
  );

  const getConfigByType = () => {
    switch (node.type) {
      case 'dataSource':
        return renderSourceConfig();
      case 'transform':
        return renderTransformConfig();
      case 'quality':
        return renderQualityConfig();
      case 'sink':
        return renderSinkConfig();
      default:
        return <div>No configuration available</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Configure: {node.data.label}</h3>
        <Badge variant="outline" className="mt-1">
          {node.type}
        </Badge>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-4">
            {getConfigByType()}
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Advanced configurations will be auto-generated based on best practices 
                for your selected tools and data patterns.
              </AlertDescription>
            </Alert>

            <div className="mt-4 space-y-4">
              <div>
                <Label>Resource Allocation</Label>
                <Select 
                  value={config.resources || 'auto'}
                  onValueChange={(value) => handleConfigChange('resources', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-scale</SelectItem>
                    <SelectItem value="small">Small (2 CPU, 4GB RAM)</SelectItem>
                    <SelectItem value="medium">Medium (4 CPU, 16GB RAM)</SelectItem>
                    <SelectItem value="large">Large (8 CPU, 32GB RAM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Enable Monitoring</Label>
                <Switch
                  checked={config.monitoring !== false}
                  onCheckedChange={(checked) => handleConfigChange('monitoring', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Enable Auto-retry</Label>
                <Switch
                  checked={config.autoRetry !== false}
                  onCheckedChange={(checked) => handleConfigChange('autoRetry', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 border-t bg-muted/50">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            NexusOne will automatically translate these high-level configurations 
            into tool-specific settings for NiFi, Airflow, Spark, and other tools.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ConfigPanel;