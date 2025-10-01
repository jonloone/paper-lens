'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowProgressBar } from '@/components/build/WorkflowProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Link2,
  Server,
  Cloud,
  HardDrive
} from 'lucide-react';

const foundationSteps = [
  { id: 'connect', name: 'Connect', description: 'Connect to source' },
  { id: 'discover', name: 'Discover', description: 'Auto-discover schema' },
  { id: 'configure', name: 'Configure', description: 'Set quality rules' },
  { id: 'deploy', name: 'Deploy', description: 'Deploy to catalog' }
];

interface ConnectionType {
  id: string;
  icon: any;
  name: string;
  description: string;
  examples: string[];
}

export default function FoundationConnectPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [connectionString, setConnectionString] = useState('');

  const connectionTypes: ConnectionType[] = [
    {
      id: 'database',
      icon: Database,
      name: 'Database',
      description: 'PostgreSQL, MySQL, Oracle, SQL Server',
      examples: ['postgresql://host:5432/db', 'mysql://host:3306/db']
    },
    {
      id: 'api',
      icon: Link2,
      name: 'REST API',
      description: 'HTTP/REST endpoints with JSON responses',
      examples: ['https://api.example.com/v1/data', 'https://internal-api/users']
    },
    {
      id: 'warehouse',
      icon: Server,
      name: 'Data Warehouse',
      description: 'Snowflake, BigQuery, Redshift, Databricks',
      examples: ['snowflake://account.region/db', 'bigquery://project-id/dataset']
    },
    {
      id: 'object-storage',
      icon: Cloud,
      name: 'Object Storage',
      description: 'S3, GCS, Azure Blob, MinIO',
      examples: ['s3://bucket-name/path/', 'gs://bucket-name/prefix/']
    },
    {
      id: 'file',
      icon: HardDrive,
      name: 'File System',
      description: 'CSV, Parquet, JSON, Avro files',
      examples: ['/mnt/data/files/', 'file:///data/exports/']
    }
  ];

  const handleContinue = () => {
    const params = new URLSearchParams({
      type: selectedType || '',
      connection: connectionString
    });
    router.push(`/build/foundation/discover?${params.toString()}`);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <div className="font-semibold">Foundation Product</div>
                <div className="text-sm text-muted-foreground">Step 1 of 4</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/build')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Type
            </Button>
          </div>
          <WorkflowProgressBar
            steps={foundationSteps}
            currentStep={0}
          />
        </Card>

        {/* Main Content */}
        <div className="space-y-8">

          <div className="space-y-3">
            <h2 className="text-3xl font-bold">Connect Data Source</h2>
            <p className="text-muted-foreground text-lg">
              Select your source type and provide connection details
            </p>
          </div>

          {/* Connection Types */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Source Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className={`p-6 cursor-pointer transition-all ${
                      selectedType === type.id
                        ? 'border-2 border-amber-500 bg-amber-50/50'
                        : 'border-2 hover:border-border/60'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{type.name}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Connection String */}
          {selectedType && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Label className="text-lg font-semibold">Connection Details</Label>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder={connectionTypes.find(t => t.id === selectedType)?.examples[0]}
                  className="text-base font-mono"
                />
                <div className="text-sm text-muted-foreground">
                  <strong>Examples:</strong>{' '}
                  {connectionTypes.find(t => t.id === selectedType)?.examples.join(' or ')}
                </div>
              </div>

              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-600 text-white">Tip</Badge>
                  <div className="text-sm">
                    <p className="font-medium">Auto-discovery will:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Scan schema and table structure</li>
                      <li>Profile data types and distributions</li>
                      <li>Detect primary keys and relationships</li>
                      <li>Estimate data quality metrics</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push('/build')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedType || !connectionString}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Continue to Discovery
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
