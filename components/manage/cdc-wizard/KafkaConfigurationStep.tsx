'use client';

/**
 * CDC Wizard Step 2: Kafka Configuration
 * Simplified placeholder - to be enhanced with visual configuration builder
 */

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import type { SourceSummary, KafkaTopicConfig } from '@/lib/types/cdc-wizard';

interface KafkaConfigurationStepProps {
  source: SourceSummary;
  initialConfig?: KafkaTopicConfig;
  onConfigured: (config: KafkaTopicConfig) => void;
}

export default function KafkaConfigurationStep({
  source,
  initialConfig,
  onConfigured,
}: KafkaConfigurationStepProps) {
  const [config, setConfig] = useState<KafkaTopicConfig>(
    initialConfig || {
      name: `cdc.${source.domain}.${source.name}`.toLowerCase().replace(/[^a-z0-9._-]/g, '_'),
      partitions: 12,
      replication_factor: 3,
      retention_ms: 604800000, // 7 days
      compression_type: 'snappy',
      cleanup_policy: 'delete',
      min_insync_replicas: 2,
      segment_ms: 86400000, // 1 day
      max_message_bytes: 1048576, // 1MB
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
          Configure Kafka topics for CDC events from <strong>{source.name}</strong>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Topic Name</Label>
          <Input
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <div>
          <Label>Partitions</Label>
          <Input
            type="number"
            value={config.partitions}
            onChange={(e) => setConfig({ ...config, partitions: parseInt(e.target.value) })}
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <div>
          <Label>Replication Factor</Label>
          <Input
            type="number"
            value={config.replication_factor}
            onChange={(e) => setConfig({ ...config, replication_factor: parseInt(e.target.value) })}
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <div>
          <Label>Min In-Sync Replicas</Label>
          <Input
            type="number"
            value={config.min_insync_replicas}
            onChange={(e) => setConfig({ ...config, min_insync_replicas: parseInt(e.target.value) })}
            className="bg-gray-800 border-gray-700"
          />
        </div>
      </div>

      <div className="text-sm text-gray-400">
        Smart defaults applied based on source type and table count.
      </div>
    </div>
  );
}
