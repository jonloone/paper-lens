'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TechIcon } from '@/components/ui/tech-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Database,
  Cloud,
  FileText,
  Workflow,
  MessageSquare,
  Table2,
  Server,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { MethodSelectionStep } from '@/components/manage/MethodSelectionStep';
import type { IngestionMethod } from '@/lib/types/source-connections';

type SourceCategory = 'database' | 'file_storage' | 'api_saas' | 'messaging' | 'lakehouse' | 'files';

interface SourceCategoryOption {
  id: SourceCategory;
  title: string;
  description: string;
  icon: typeof Database;
  examples: string[];
  connectorCount: number;
}

const sourceCategories: SourceCategoryOption[] = [
  {
    id: 'database',
    title: 'Databases & Data Warehouses',
    description: 'Relational, NoSQL, and analytical databases',
    icon: Database,
    examples: ['postgresql', 'mysql', 'oracle', 'sqlserver', 'mongodb', 'elasticsearch', 'cassandra', 'snowflake', 'bigquery', 'redshift', 'synapse'],
    connectorCount: 50,
  },
  {
    id: 'file_storage',
    title: 'Cloud Storage & Data Lakes',
    description: 'Object storage and distributed file systems',
    icon: Cloud,
    examples: ['aws', 'azure', 'gcp', 's3', 'blob'],
    connectorCount: 15,
  },
  {
    id: 'api_saas',
    title: 'APIs & SaaS Applications',
    description: 'REST APIs, GraphQL, and enterprise SaaS platforms',
    icon: Globe,
    examples: ['salesforce', 'slack', 'stripe', 'shopify', 'zendesk', 'github'],
    connectorCount: 100,
  },
  {
    id: 'messaging',
    title: 'Message Queues & Event Streams',
    description: 'Real-time messaging and event platforms',
    icon: MessageSquare,
    examples: ['kafka', 'kinesis'],
    connectorCount: 20,
  },
  {
    id: 'lakehouse',
    title: 'Data Lakehouses',
    description: 'Open table formats for analytics',
    icon: Table2,
    examples: ['iceberg', 'delta-lake', 'hudi'],
    connectorCount: 3,
  },
  {
    id: 'files',
    title: 'Files & FTP',
    description: 'Local files, FTP, SFTP, and network shares',
    icon: FileText,
    examples: ['json', 'csv', 'xml', 'parquet', 'avro'],
    connectorCount: 50,
  },
];

// Connector mapping: category -> available connectors
const connectorsByCategory: Record<SourceCategory, Array<{id: string; name: string; tech: string}>> = {
  database: [
    { id: 'postgresql', name: 'PostgreSQL', tech: 'postgresql' },
    { id: 'mysql', name: 'MySQL', tech: 'mysql' },
    { id: 'oracle', name: 'Oracle Database', tech: 'oracle' },
    { id: 'sqlserver', name: 'SQL Server', tech: 'sqlserver' },
    { id: 'mongodb', name: 'MongoDB', tech: 'mongodb' },
    { id: 'elasticsearch', name: 'Elasticsearch', tech: 'elasticsearch' },
    { id: 'cassandra', name: 'Apache Cassandra', tech: 'cassandra' },
    { id: 'snowflake', name: 'Snowflake', tech: 'snowflake' },
    { id: 'bigquery', name: 'BigQuery', tech: 'bigquery' },
    { id: 'redshift', name: 'Amazon Redshift', tech: 'redshift' },
    { id: 'synapse', name: 'Azure Synapse', tech: 'synapse' },
  ],
  file_storage: [
    { id: 's3', name: 'Amazon S3', tech: 's3' },
    { id: 'gcs', name: 'Google Cloud Storage', tech: 'gcp' },
    { id: 'azure_blob', name: 'Azure Blob Storage', tech: 'blob' },
    { id: 'hdfs', name: 'HDFS', tech: 'hdfs' },
  ],
  api_saas: [
    { id: 'salesforce', name: 'Salesforce', tech: 'salesforce' },
    { id: 'slack', name: 'Slack', tech: 'slack' },
    { id: 'stripe', name: 'Stripe', tech: 'stripe' },
    { id: 'shopify', name: 'Shopify', tech: 'shopify' },
    { id: 'zendesk', name: 'Zendesk', tech: 'zendesk' },
    { id: 'github', name: 'GitHub', tech: 'github' },
  ],
  messaging: [
    { id: 'kafka', name: 'Apache Kafka', tech: 'kafka' },
    { id: 'kinesis', name: 'AWS Kinesis', tech: 'kinesis' },
  ],
  lakehouse: [
    { id: 'iceberg', name: 'Apache Iceberg', tech: 'iceberg' },
    { id: 'delta_lake', name: 'Delta Lake', tech: 'delta-lake' },
    { id: 'hudi', name: 'Apache Hudi', tech: 'hudi' },
  ],
  files: [
    { id: 'json', name: 'JSON Files', tech: 'json' },
    { id: 'csv', name: 'CSV Files', tech: 'csv' },
    { id: 'xml', name: 'XML Files', tech: 'xml' },
    { id: 'parquet', name: 'Parquet Files', tech: 'parquet' },
    { id: 'avro', name: 'Avro Files', tech: 'avro' },
  ],
};

export default function NewSourcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<SourceCategory | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<IngestionMethod | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState<'category' | 'connector' | 'method'>('category');

  // Pre-select category from URL parameter
  useEffect(() => {
    const categoryParam = searchParams?.get('category') as SourceCategory | null;
    if (categoryParam && sourceCategories.some(cat => cat.id === categoryParam)) {
      setSelectedCategory(categoryParam);
      setCurrentStep('connector');
    }
  }, [searchParams]);

  const handleCategorySelect = (category: SourceCategory) => {
    setSelectedCategory(category);
    setSelectedConnector(null); // Reset connector when category changes
    setSelectedMethod(null); // Reset method too
    setCurrentStep('connector');
  };

  const handleConnectorSelect = (connectorId: string) => {
    setSelectedConnector(connectorId);
  };

  const handleContinueToMethod = () => {
    if (!selectedCategory || !selectedConnector) return;

    // Special handling for file uploads - skip method selection, go straight to quick upload
    if (selectedCategory === 'files') {
      router.push('/manage/connections/new/files/quick');
      return;
    }

    setCurrentStep('method');
  };

  const handleMethodSelected = (method: IngestionMethod) => {
    setSelectedMethod(method);

    // Route to appropriate wizard based on method
    const category = selectedCategory!;
    const connector = selectedConnector!;

    switch (method) {
      case 'federated':
        router.push(`/manage/connections/new/federated?category=${category}&connector=${connector}`);
        break;
      case 'incremental_query':
        router.push(`/manage/connections/new/incremental?category=${category}&connector=${connector}`);
        break;
      case 'batch_cdc':
        router.push(`/manage/connections/new/cdc-wizard?category=${category}&connector=${connector}&mode=batch`);
        break;
      case 'streaming_cdc':
        router.push(`/manage/connections/new/cdc-wizard?category=${category}&connector=${connector}&mode=streaming`);
        break;
      default:
        // Fallback to main wizard
        router.push(`/manage/connections/new/connect?category=${category}&connector=${connector}&method=${method}`);
    }
  };

  const handleBack = () => {
    if (currentStep === 'method') {
      setCurrentStep('connector');
      setSelectedMethod(null);
    } else if (currentStep === 'connector') {
      setCurrentStep('category');
      setSelectedCategory(null);
      setSelectedConnector(null);
      setSelectedMethod(null);
    } else {
      router.push('/manage/connections');
    }
  };

  const filteredCategories = searchQuery
    ? sourceCategories.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.examples.some(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : sourceCategories;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        {currentStep !== 'method' && (
          <div className="space-y-3">
            <h1 className="text-6xl font-display font-normal tracking-tight">
              {currentStep === 'category' ? 'What are you connecting to?' : 'Select your connector'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {currentStep === 'category'
                ? 'Select the type of data source you want to connect. We support 238+ connectors across all major platforms.'
                : `Choose the specific ${sourceCategories.find(c => c.id === selectedCategory)?.title.toLowerCase()} connector you want to use.`}
            </p>
          </div>
        )}

        {/* Step 1: Category Selection */}
        {currentStep === 'category' && (
          <>
            {/* Search */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by source type (e.g., Postgres, S3, Kafka)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input/10 border-2 border-input/40 ring-1 ring-input/20 hover:bg-input/20 hover:border-input/60 focus-visible:bg-card focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors duration-200"
              />
            </div>

            {/* Source Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((category) => {
                const Icon = category.icon;

                return (
                  <Card
                    key={category.id}
                    className="shadow-lg border-2 cursor-pointer transition-all hover:shadow-xl hover:border-primary group"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{category.title}</h3>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>

                      {category.examples.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          {category.examples.map((logoTech, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-center w-14 h-14 rounded bg-muted/50 hover:bg-muted transition-colors"
                              title={logoTech}
                            >
                              <TechIcon
                                technology={logoTech}
                                size="lg"
                                variant="branded"
                                className="h-10 w-10"
                              />
                            </div>
                          ))}
                          {category.connectorCount > category.examples.length && (
                            <div className="flex items-center justify-center w-14 h-14 rounded bg-muted/50 text-xs text-muted-foreground font-medium">
                              +{category.connectorCount - category.examples.length}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Step 2: Connector Selection */}
        {currentStep === 'connector' && selectedCategory && (
          <>
            {/* Category Selector */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="space-y-1 flex-shrink-0">
                    <p className="text-sm text-muted-foreground">Source Type</p>
                  </div>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value as SourceCategory);
                      setSelectedConnector(null);
                    }}
                  >
                    <SelectTrigger className="w-[280px] bg-input/10 border-2 border-input/40 ring-1 ring-input/20 hover:bg-input/20 hover:border-input/60 focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{category.title}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Connector Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {connectorsByCategory[selectedCategory].map((connector) => {
                const isSelected = selectedConnector === connector.id;

                return (
                  <Card
                    key={connector.id}
                    className={`shadow-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xl'
                        : 'hover:border-primary hover:shadow-xl'
                    }`}
                    onClick={() => handleConnectorSelect(connector.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-lg bg-muted">
                          <TechIcon
                            technology={connector.tech}
                            size="xl"
                            variant="branded"
                            className="h-12 w-12"
                          />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">{connector.name}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Step 3: Method Selection */}
        {currentStep === 'method' && selectedCategory && selectedConnector && (
          <MethodSelectionStep
            onMethodSelected={handleMethodSelected}
            sourceCategory={selectedCategory}
            onBack={handleBack}
          />
        )}

        {/* Navigation - Only show for category and connector steps */}
        {currentStep !== 'method' && (
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 'category' ? 'Back to Sources' : 'Back to Categories'}
            </Button>

            {selectedConnector && currentStep === 'connector' && (
              <Button
                onClick={handleContinueToMethod}
                className="gap-2"
                size="lg"
              >
                Continue to Select Method
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
