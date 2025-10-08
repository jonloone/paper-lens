'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  CloudSnow,
  Workflow,
  Table2,
  Cloud,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { ConnectorType } from '@/lib/types/source-connections';

interface ConnectorOption {
  type: ConnectorType;
  title: string;
  description: string;
  icon: typeof Database;
  supported: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  prerequisites: string[];
  useCases: string[];
  comingSoon?: boolean;
}

export default function ConnectorSelectionPage() {
  const router = useRouter();
  const [selectedConnector, setSelectedConnector] = useState<ConnectorType | null>(null);

  const connectorOptions: ConnectorOption[] = [
    {
      type: 'jdbc',
      title: 'JDBC Database',
      description: 'PostgreSQL, MySQL, Oracle, SQL Server, MongoDB',
      icon: Database,
      supported: true,
      complexity: 'simple',
      prerequisites: [
        'Network access to database',
        'Read-only user credentials',
        'Firewall rules configured',
      ],
      useCases: [
        'Traditional relational databases',
        'OLTP systems',
        'Application databases',
      ],
    },
    {
      type: 'kafka',
      title: 'Kafka Topics',
      description: 'Query Kafka topics as tables with schema registry',
      icon: Workflow,
      supported: false,
      complexity: 'moderate',
      prerequisites: [
        'Schema Registry (Confluent or Apicurio)',
        'Network access to Kafka brokers',
        'Consumer group permissions',
      ],
      useCases: [
        'Event streams',
        'Real-time data pipelines',
        'CDC event topics',
      ],
      comingSoon: true,
    },
    {
      type: 'snowflake',
      title: 'Snowflake',
      description: 'Cloud data warehouse federation',
      icon: CloudSnow,
      supported: false,
      complexity: 'simple',
      prerequisites: [
        'Snowflake account credentials',
        'Warehouse name',
        'Role with SELECT permissions',
      ],
      useCases: [
        'Cloud data warehouse',
        'Cross-cloud analytics',
        'Data sharing',
      ],
      comingSoon: true,
    },
    {
      type: 's3_iceberg',
      title: 'S3 + Iceberg',
      description: 'Query Iceberg tables stored in S3',
      icon: Table2,
      supported: false,
      complexity: 'complex',
      prerequisites: [
        'Hive Metastore URI',
        'AWS credentials (S3 access)',
        'Iceberg catalog configuration',
      ],
      useCases: [
        'Data lakehouse',
        'Iceberg table federation',
        'S3-based analytics',
      ],
      comingSoon: true,
    },
    {
      type: 'bigquery',
      title: 'Google BigQuery',
      description: 'Query BigQuery datasets',
      icon: Cloud,
      supported: false,
      complexity: 'moderate',
      prerequisites: [
        'GCP service account credentials',
        'BigQuery project ID',
        'Dataset permissions',
      ],
      useCases: [
        'Google Cloud Platform analytics',
        'Cross-cloud federation',
        'BigQuery ML integration',
      ],
      comingSoon: true,
    },
    {
      type: 'redshift',
      title: 'AWS Redshift',
      description: 'Query Redshift data warehouse',
      icon: Database,
      supported: false,
      complexity: 'simple',
      prerequisites: [
        'Redshift cluster endpoint',
        'Database credentials',
        'Network access (VPC/Security groups)',
      ],
      useCases: [
        'AWS data warehouse',
        'Cross-region analytics',
        'Redshift Spectrum tables',
      ],
      comingSoon: true,
    },
    {
      type: 'delta_lake',
      title: 'Delta Lake',
      description: 'Query Delta Lake tables',
      icon: Table2,
      supported: false,
      complexity: 'complex',
      prerequisites: [
        'Hive Metastore URI',
        'S3/ADLS/GCS credentials',
        'Delta Lake catalog',
      ],
      useCases: [
        'Databricks lakehouse',
        'Delta table federation',
        'ACID table queries',
      ],
      comingSoon: true,
    },
    {
      type: 'elasticsearch',
      title: 'Elasticsearch',
      description: 'Query Elasticsearch indices as tables',
      icon: Search,
      supported: false,
      complexity: 'moderate',
      prerequisites: [
        'Elasticsearch cluster URL',
        'API credentials',
        'Index patterns defined',
      ],
      useCases: [
        'Log analytics',
        'Search index queries',
        'Time-series data',
      ],
      comingSoon: true,
    },
  ];

  const handleNext = () => {
    if (!selectedConnector) return;

    if (selectedConnector === 'jdbc') {
      router.push('/manage/sources/new/federated');
    } else {
      // For unsupported connectors, show coming soon message
      alert(`${selectedConnector.toUpperCase()} connector configuration is coming soon!`);
    }
  };

  const selectedOption = connectorOptions.find(opt => opt.type === selectedConnector);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Federated Query Source</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Select Connector Type</h1>
          <p className="text-muted-foreground">
            Choose the type of data source you want to connect via Trino federation
          </p>
        </div>

        {/* Connector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectorOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedConnector === option.type;

            return (
              <Card
                key={option.type}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary shadow-md ring-2 ring-primary ring-offset-2'
                    : option.supported
                    ? 'hover:border-primary hover:shadow-sm'
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => option.supported && setSelectedConnector(option.type)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                        {option.comingSoon && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {option.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Complexity</p>
                    <Badge variant={
                      option.complexity === 'simple' ? 'default' :
                      option.complexity === 'moderate' ? 'secondary' : 'destructive'
                    }>
                      {option.complexity}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Use Cases</p>
                    <ul className="space-y-1">
                      {option.useCases.slice(0, 2).map((useCase, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Prerequisites Section (shown when connector selected) */}
        {selectedOption && (
          <Card className="border-primary/50 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Prerequisites for {selectedOption.title}
              </CardTitle>
              <CardDescription>
                Ensure you have these ready before continuing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedOption.prerequisites.map((prereq, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => router.push('/manage/sources/new')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mode Selection
          </Button>

          <Button
            onClick={handleNext}
            disabled={!selectedConnector}
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
