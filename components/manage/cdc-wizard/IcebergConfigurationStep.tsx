'use client';

/**
 * CDC Wizard Step 4: Iceberg Configuration
 * Simplified placeholder - to be enhanced with schema detection and visual partitioning
 */

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoIcon } from 'lucide-react';
import type { SourceSummary, DebeziumConnectorConfig, IcebergTableConfig } from '@/lib/types/cdc-wizard';

interface IcebergConfigurationStepProps {
  source: SourceSummary;
  debeziumConfig: DebeziumConnectorConfig;
  initialConfigs?: IcebergTableConfig[];
  onConfigured: (configs: IcebergTableConfig[]) => void;
}

export default function IcebergConfigurationStep({
  source,
  debeziumConfig,
  initialConfigs,
  onConfigured,
}: IcebergConfigurationStepProps) {
  const [configs, setConfigs] = useState<IcebergTableConfig[]>(
    initialConfigs || [
      {
        catalog_name: 'iceberg',
        database_name: source.domain,
        table_name: source.name,
        columns: [
          { name: 'id', type: 'long', required: true },
          { name: 'data', type: 'string', required: false },
          { name: 'created_at', type: 'timestamp', required: true },
        ],
        partition_spec: [
          { source_column: 'created_at', transform: 'day' },
        ],
        sort_order: [
          { source_column: 'created_at', transform: 'identity', direction: 'desc', null_order: 'nulls-last' },
        ],
        file_format: 'parquet',
        compression_codec: 'snappy',
        write_target_file_size_bytes: 536870912, // 512MB
        write_distribution_mode: 'hash',
      },
    ]
  );

  useEffect(() => {
    onConfigured(configs);
  }, [configs]);

  const updateConfig = (index: number, updates: Partial<IcebergTableConfig>) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], ...updates };
    setConfigs(newConfigs);
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-400 bg-blue-400/10">
        <InfoIcon className="w-4 h-4" />
        <AlertDescription>
          Configure Iceberg tables for CDC data from <strong>{source.name}</strong>
        </AlertDescription>
      </Alert>

      {configs.map((config, index) => (
        <div key={index} className="border border-gray-700 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-green-400">Table {index + 1}</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Catalog</Label>
              <Input
                value={config.catalog_name}
                onChange={(e) => updateConfig(index, { catalog_name: e.target.value })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>Database</Label>
              <Input
                value={config.database_name}
                onChange={(e) => updateConfig(index, { database_name: e.target.value })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>Table Name</Label>
              <Input
                value={config.table_name}
                onChange={(e) => updateConfig(index, { table_name: e.target.value })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label>File Format</Label>
              <Select
                value={config.file_format}
                onValueChange={(value: any) => updateConfig(index, { file_format: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parquet">Parquet (recommended)</SelectItem>
                  <SelectItem value="orc">ORC</SelectItem>
                  <SelectItem value="avro">Avro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Compression</Label>
              <Select
                value={config.compression_codec}
                onValueChange={(value: any) => updateConfig(index, { compression_codec: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="snappy">Snappy (recommended)</SelectItem>
                  <SelectItem value="gzip">Gzip</SelectItem>
                  <SelectItem value="zstd">Zstd</SelectItem>
                  <SelectItem value="lz4">LZ4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            {config.columns.length} columns • Partitioned by day • Sorted by created_at desc
          </div>
        </div>
      ))}

      <div className="text-sm text-gray-400">
        Schema will be auto-detected from source tables. Partitioning optimized for time-series data.
      </div>
    </div>
  );
}
