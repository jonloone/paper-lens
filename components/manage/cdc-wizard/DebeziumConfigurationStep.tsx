'use client';

/**
 * CDC Wizard Step 3: Debezium Configuration
 * Simplified placeholder - to be enhanced with connector wizard
 */

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoIcon } from 'lucide-react';
import type { SourceSummary, KafkaTopicConfig, DebeziumConnectorConfig } from '@/lib/types/cdc-wizard';

interface DebeziumConfigurationStepProps {
  source: SourceSummary;
  kafkaConfig: KafkaTopicConfig;
  initialConfig?: DebeziumConnectorConfig;
  onConfigured: (config: DebeziumConnectorConfig) => void;
}

export default function DebeziumConfigurationStep({
  source,
  kafkaConfig,
  initialConfig,
  onConfigured,
}: DebeziumConfigurationStepProps) {
  const [config, setConfig] = useState<DebeziumConnectorConfig>(
    initialConfig || {
      name: `debezium-${source.name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      connector_class: 'io.debezium.connector.postgresql.PostgresConnector',
      database_hostname: 'localhost',
      database_port: 5432,
      database_user: 'postgres',
      database_password: '',
      database_dbname: source.name,
      database_server_name: source.name.toLowerCase(),
      snapshot_mode: 'initial',
      kafka_topic_prefix: kafkaConfig.name.split('.')[0],
      max_batch_size: 2048,
      max_queue_size: 8192,
      poll_interval_ms: 1000,
      heartbeat_interval_ms: 10000,
      tombstones_on_delete: true,
      decimal_handling_mode: 'precise',
      binary_handling_mode: 'bytes',
      plugin_name: 'pgoutput',
      tasks_max: 1,
    }
  );

  useEffect(() => {
    onConfigured(config);
  }, [config]);

  return (
    <div className="space-y-6">
      <Alert className="border-blue-400 bg-blue-400/10">
        <InfoIcon className="w-4 h-4" />
        <AlertDescription>
          Configure Debezium CDC connector for <strong>{source.name}</strong>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Connector Name</Label>
          <Input
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <div>
          <Label>Snapshot Mode</Label>
          <Select
            value={config.snapshot_mode}
            onValueChange={(value: any) => setConfig({ ...config, snapshot_mode: value })}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Initial (recommended)</SelectItem>
              <SelectItem value="initial_only">Initial Only</SelectItem>
              <SelectItem value="when_needed">When Needed</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Database Host</Label>
          <Input
            value={config.database_hostname}
            onChange={(e) => setConfig({ ...config, database_hostname: e.target.value })}
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <div>
          <Label>Database Port</Label>
          <Input
            type="number"
            value={config.database_port}
            onChange={(e) => setConfig({ ...config, database_port: parseInt(e.target.value) })}
            className="bg-gray-800 border-gray-700"
          />
        </div>
      </div>

      <div className="text-sm text-gray-400">
        Smart defaults applied for PostgreSQL CDC connector.
      </div>
    </div>
  );
}
