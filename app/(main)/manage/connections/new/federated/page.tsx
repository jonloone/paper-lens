'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  AlertCircle,
  Zap,
  FileText,
  Settings,
  CheckSquare,
  Server,
  Cloud,
  Container,
} from 'lucide-react';
import type {
  DatabaseType,
  TrinoConfig,
  ConnectionDetails,
  SecretStorageType,
  SecretReference
} from '@/lib/types/source-connections';
import {
  generateTrinoCatalog,
  catalogPropertiesToFile,
  generateConfigMapForCatalog
} from '@/lib/services/trino-catalog-generator';

interface FederatedSourceData {
  // Step 1: Basic Connection
  name: string;
  description: string;
  type: DatabaseType;
  team: string;
  owner: string;
  tags: string[];
  connection: ConnectionDetails;

  // Step 2: Trino Configuration
  trino: Partial<TrinoConfig>;

  // Step 3: Schema Mapping
  schemaMapping: Record<string, string>;

  // Step 4: Advanced Settings
  advancedSettings: {
    connectionPoolSize: number;
    connectionPoolMinSize: number;
    connectionPoolMaxSize: number;
    queryTimeoutSeconds: number;
    connectionTimeoutMs: number;
    idleTimeoutMs: number;
    maxLifetimeMs: number;
    leakDetectionThresholdMs: number;
    validationTimeoutMs: number;
    validationQuery: string;
    caseInsensitiveNameMatching: boolean;
    allowDropTable: boolean;
    allowRenameTable: boolean;
  };
}

type DeploymentTarget = 'self-hosted' | 'kubernetes' | 'cloud-managed';

export default function FederatedSourceWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectorType = searchParams?.get('connector') as DatabaseType | null;

  const [currentStep, setCurrentStep] = useState(0); // Start with prerequisites
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [secretStorageType, setSecretStorageType] = useState<SecretStorageType>('environment');
  const [secretReference, setSecretReference] = useState('');
  const [deploymentTarget, setDeploymentTarget] = useState<DeploymentTarget>('kubernetes');

  const getDefaultPort = (type: DatabaseType): number => {
    const ports: Record<DatabaseType, number> = {
      postgresql: 5432,
      mysql: 3306,
      mariadb: 3306,
      oracle: 1521,
      sqlserver: 1433,
      mongodb: 27017,
      snowflake: 443,
      bigquery: 443,
      redshift: 5439,
      synapse: 1433,
      iceberg: 9083,
      delta_lake: 9083,
      hudi: 9083,
      kafka: 9092,
      kinesis: 443,
      elasticsearch: 9200,
      cassandra: 9042,
      druid: 8082,
    };
    return ports[type] || 5432;
  };

  const [formData, setFormData] = useState<FederatedSourceData>({
    name: '',
    description: '',
    type: connectorType || 'postgresql',
    team: '',
    owner: '',
    tags: [],
    connection: {
      host: '',
      port: getDefaultPort(connectorType || 'postgresql'),
      database: '',
      username: '',
      password: '', // Will be deprecated in favor of password_secret
      ssl: true,
    },
    trino: {
      catalog_name: '',
      connector_type: connectorType || 'postgresql',
      schema_mapping: {},
      connection_pool_size: 10,
      query_timeout_seconds: 60,
    },
    schemaMapping: {},
    advancedSettings: {
      connectionPoolSize: 10,
      connectionPoolMinSize: 2,
      connectionPoolMaxSize: 20,
      queryTimeoutSeconds: 60,
      connectionTimeoutMs: 30000,
      idleTimeoutMs: 600000,
      maxLifetimeMs: 1800000,
      leakDetectionThresholdMs: 60000,
      validationTimeoutMs: 5000,
      validationQuery: 'SELECT 1',
      caseInsensitiveNameMatching: false,
      allowDropTable: false,
      allowRenameTable: false,
    },
  });

  // Update form data when connector type changes from query param
  useEffect(() => {
    if (connectorType) {
      setFormData(prev => ({
        ...prev,
        type: connectorType,
        connection: {
          ...prev.connection,
          port: getDefaultPort(connectorType),
        },
        trino: {
          ...prev.trino,
          connector_type: connectorType,
        },
      }));
    }
  }, [connectorType]);

  const totalSteps = 5; // Added prerequisites step

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock result (replace with actual API call)
    setConnectionTestResult({
      success: true,
      message: 'Connection successful! Server version: PostgreSQL 14.5'
    });

    setIsTestingConnection(false);
  };

  const handleDeploy = async () => {
    // Submit to API
    const payload = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      mode: 'federated',
      team: formData.team,
      owner: formData.owner,
      tags: formData.tags,
      connection: formData.connection,
      trino: {
        catalog_name: formData.trino.catalog_name,
        connector_type: formData.trino.connector_type,
        schema_mapping: formData.schemaMapping,
        connection_pool_size: formData.advancedSettings.connectionPoolSize,
        connection_pool_min_size: formData.advancedSettings.connectionPoolMinSize,
        connection_pool_max_size: formData.advancedSettings.connectionPoolMaxSize,
        query_timeout_seconds: formData.advancedSettings.queryTimeoutSeconds,
        case_insensitive_name_matching: formData.advancedSettings.caseInsensitiveNameMatching,
        allow_drop_table: formData.advancedSettings.allowDropTable,
        allow_rename_table: formData.advancedSettings.allowRenameTable,
      },
    };

    try {
      const response = await fetch('/api/manage/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/manage/connections');
      } else {
        alert('Failed to create source');
      }
    } catch (error) {
      console.error('Error creating source:', error);
      alert('Error creating source');
    }
  };

  const stepConfig = [
    { icon: CheckSquare, label: 'Prerequisites' },
    { icon: Database, label: 'Connection' },
    { icon: Settings, label: 'Configuration' },
    { icon: Zap, label: 'Advanced' },
    { icon: CheckCircle2, label: 'Deploy' },
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {stepConfig.map((config, idx) => {
        const step = idx + 1;
        const StepIcon = config.icon;
        const isCurrentStep = currentStep === step;

        return (
          <div key={step} className="flex items-center">
            <div className="relative">
              {/* Pulsing outline for current step */}
              {isCurrentStep && (
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse" />
              )}

              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-muted'
                }`}
              >
                {currentStep > step ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
            </div>
            {step < totalSteps && (
              <div
                className={`w-12 h-0.5 mx-1 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-900">Infrastructure Prerequisites</p>
            <p className="text-sm text-blue-800">
              Before configuring your federated source, ensure the following prerequisites are met.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-base font-medium">Network Connectivity</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Verify that the Trino coordinator can reach the source database on the network.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Firewall rules allow traffic from Trino to database port</li>
              <li>• VPN or Private Link configured for cloud sources</li>
              <li>• Security groups/NSG rules properly configured</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-base font-medium">Database Credentials</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Read-only credentials with appropriate permissions configured in secret management.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Secret stored in environment variables, Vault, or K8s secrets</li>
              <li>• User has SELECT permissions on required schemas/tables</li>
              <li>• Connection credentials tested and validated</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-base font-medium">SSL/TLS Certificates</h3>
            <p className="text-sm text-muted-foreground mt-1">
              SSL certificates configured if database requires encrypted connections.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• CA certificates available in Trino trust store</li>
              <li>• Client certificates configured if mutual TLS required</li>
              <li>• Certificate validation settings determined</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
          <AlertCircle className="h-6 w-6 text-amber-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-base font-medium">Hive Metastore (Optional)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Required only for file-based connectors (S3, Iceberg, Delta Lake).
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Hive Metastore URI accessible from Trino</li>
              <li>• Metastore has metadata for tables you want to query</li>
              <li>• S3/ADLS/GCS credentials configured for data access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Basic Information
        </Label>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Source Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Product Catalog"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalogName">Trino Catalog Name *</Label>
            <Input
              id="catalogName"
              placeholder="e.g., product_catalog"
              value={formData.trino.catalog_name}
              onChange={(e) => setFormData({
                ...formData,
                trino: { ...formData.trino, catalog_name: e.target.value }
              })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the purpose of this source"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Metadata - Secondary card */}
      <Card className="border border-border/50 bg-muted/20">
        <CardContent className="p-6 space-y-4">
          <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Metadata & Ownership
          </Label>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Database Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: DatabaseType) => setFormData({
                  ...formData,
                  type: value,
                  connection: { ...formData.connection, port: getDefaultPort(value) },
                  trino: { ...formData.trino, connector_type: value as any }
                })}
                disabled={!!connectorType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <optgroup label="JDBC Databases">
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="mariadb">MariaDB</SelectItem>
                    <SelectItem value="oracle">Oracle</SelectItem>
                    <SelectItem value="sqlserver">SQL Server</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                  </optgroup>
                  <optgroup label="Cloud Warehouses">
                    <SelectItem value="snowflake">Snowflake</SelectItem>
                    <SelectItem value="bigquery">Google BigQuery</SelectItem>
                    <SelectItem value="redshift">AWS Redshift</SelectItem>
                    <SelectItem value="synapse">Azure Synapse</SelectItem>
                  </optgroup>
                  <optgroup label="Lakehouses">
                    <SelectItem value="iceberg">Apache Iceberg</SelectItem>
                    <SelectItem value="delta_lake">Delta Lake</SelectItem>
                    <SelectItem value="hudi">Apache Hudi</SelectItem>
                  </optgroup>
                  <optgroup label="Streaming">
                    <SelectItem value="kafka">Apache Kafka</SelectItem>
                    <SelectItem value="kinesis">AWS Kinesis</SelectItem>
                  </optgroup>
                  <optgroup label="Analytics/Search">
                    <SelectItem value="elasticsearch">Elasticsearch</SelectItem>
                    <SelectItem value="cassandra">Apache Cassandra</SelectItem>
                    <SelectItem value="druid">Apache Druid</SelectItem>
                  </optgroup>
                </SelectContent>
              </Select>
              {connectorType && (
                <p className="text-xs text-muted-foreground">
                  Connector type selected from previous step
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Input
                id="team"
                placeholder="e.g., Data Platform"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Owner Email *</Label>
              <Input
                id="owner"
                type="email"
                placeholder="owner@company.com"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Details */}
      <div className="space-y-4">
        <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Connection Details
        </Label>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="host">Host *</Label>
            <Input
              id="host"
              placeholder="database.company.com"
              value={formData.connection.host}
              onChange={(e) => setFormData({
                ...formData,
                connection: { ...formData.connection, host: e.target.value }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port *</Label>
            <Input
              id="port"
              type="number"
              placeholder="5432"
              value={formData.connection.port}
              onChange={(e) => setFormData({
                ...formData,
                connection: { ...formData.connection, port: parseInt(e.target.value) || 5432 }
              })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="database">Database Name *</Label>
            <Input
              id="database"
              placeholder="production_db"
              value={formData.connection.database}
              onChange={(e) => setFormData({
                ...formData,
                connection: { ...formData.connection, database: e.target.value }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="trino_readonly"
              value={formData.connection.username}
              onChange={(e) => setFormData({
                ...formData,
                connection: { ...formData.connection, username: e.target.value }
              })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="ssl"
            checked={formData.connection.ssl}
            onCheckedChange={(checked) => setFormData({
              ...formData,
              connection: { ...formData.connection, ssl: checked as boolean }
            })}
          />
          <Label htmlFor="ssl" className="cursor-pointer">Enable SSL/TLS</Label>
        </div>
      </div>

      {/* Secret Management - Secondary card */}
      <Card className="border border-border/50 bg-muted/20">
        <CardContent className="p-6 space-y-4">
          <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Secret Management
          </Label>
          <div className="space-y-2">
            <Label htmlFor="secretType">Password Storage *</Label>
          <Select
            value={secretStorageType}
            onValueChange={(value: SecretStorageType) => setSecretStorageType(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="environment">Environment Variable (Recommended)</SelectItem>
              <SelectItem value="file">File Reference</SelectItem>
              <SelectItem value="k8s_secret">Kubernetes Secret</SelectItem>
              <SelectItem value="vault">HashiCorp Vault</SelectItem>
              <SelectItem value="aws_secrets">AWS Secrets Manager</SelectItem>
              <SelectItem value="plaintext">Plain Text (Not Recommended)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {secretStorageType === 'environment' && (
          <div className="space-y-2">
            <Label htmlFor="secretRef">Environment Variable Name *</Label>
            <Input
              id="secretRef"
              placeholder="POSTGRES_PASSWORD"
              value={secretReference}
              onChange={(e) => setSecretReference(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Will be referenced as: <code className="bg-muted px-1 py-0.5 rounded">$&#123;ENV:{secretReference || 'POSTGRES_PASSWORD'}&#125;</code>
            </p>
          </div>
        )}

        {secretStorageType === 'file' && (
          <div className="space-y-2">
            <Label htmlFor="secretRef">File Path *</Label>
            <Input
              id="secretRef"
              placeholder="/secrets/db-password"
              value={secretReference}
              onChange={(e) => setSecretReference(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Will be referenced as: <code className="bg-muted px-1 py-0.5 rounded">$&#123;file:{secretReference || '/secrets/db-password'}&#125;</code>
            </p>
          </div>
        )}

        {secretStorageType === 'k8s_secret' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="k8sSecret">Secret Name *</Label>
              <Input
                id="k8sSecret"
                placeholder="trino-db-credentials"
                value={secretReference.split(':')[0] || ''}
                onChange={(e) => {
                  const key = secretReference.split(':')[1] || 'password';
                  setSecretReference(`${e.target.value}:${key}`);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="k8sKey">Key *</Label>
              <Input
                id="k8sKey"
                placeholder="password"
                value={secretReference.split(':')[1] || ''}
                onChange={(e) => {
                  const secret = secretReference.split(':')[0] || 'trino-db-credentials';
                  setSecretReference(`${secret}:${e.target.value}`);
                }}
              />
            </div>
          </div>
        )}

        {secretStorageType === 'plaintext' && (
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium">Security Warning</p>
                  <p>Plain text passwords are not recommended for production. Use environment variables or secret management systems instead.</p>
                </div>
              </div>
            </div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.connection.password}
              onChange={(e) => setFormData({
                ...formData,
                connection: { ...formData.connection, password: e.target.value }
              })}
            />
          </div>
        )}
        </CardContent>
      </Card>

      {/* Connection Test */}
      <div className="space-y-4">
        <Button
          onClick={handleTestConnection}
          variant="outline"
          disabled={isTestingConnection}
          className="gap-2"
        >
          {isTestingConnection ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>

        {connectionTestResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            connectionTestResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {connectionTestResult.success ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{connectionTestResult.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Schema Mapping */}
      <div className="space-y-4">
        <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Schema Mapping
        </Label>
        <p className="text-sm text-muted-foreground">
          Map source database schemas to Trino schemas. Example: 'public' → 'product_data'
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source Schema</Label>
              <Input placeholder="public" id="source-schema-0" />
            </div>
            <div>
              <Label>Trino Schema</Label>
              <Input placeholder="product_data" id="trino-schema-0" />
            </div>
          </div>

          <Button variant="outline" size="sm">
            + Add Schema Mapping
          </Button>
        </div>
      </div>

      {/* Connection Pool - Secondary card */}
      <Card className="border border-border/50 bg-muted/20">
        <CardContent className="p-6 space-y-4">
          <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Connection Pool Settings
          </Label>
          <p className="text-sm text-muted-foreground">
            Configure connection pool sizing and lifecycle management
          </p>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="poolSize">Pool Size</Label>
            <Input
              id="poolSize"
              type="number"
              value={formData.advancedSettings.connectionPoolSize}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  connectionPoolSize: parseInt(e.target.value) || 10
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Target number of connections</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minPoolSize">Min Size</Label>
            <Input
              id="minPoolSize"
              type="number"
              value={formData.advancedSettings.connectionPoolMinSize}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  connectionPoolMinSize: parseInt(e.target.value) || 2
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Minimum idle connections</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPoolSize">Max Size</Label>
            <Input
              id="maxPoolSize"
              type="number"
              value={formData.advancedSettings.connectionPoolMaxSize}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  connectionPoolMaxSize: parseInt(e.target.value) || 20
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Maximum connections allowed</p>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Timeout Configuration - Secondary card */}
      <Card className="border border-border/50 bg-muted/20">
        <CardContent className="p-6 space-y-4">
          <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Timeout Configuration
          </Label>
          <p className="text-sm text-muted-foreground">
            Configure timeout and lifecycle settings for connections
          </p>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
            <Input
              id="connectionTimeout"
              type="number"
              value={formData.advancedSettings.connectionTimeoutMs}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  connectionTimeoutMs: parseInt(e.target.value) || 30000
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Max time to wait for connection from pool</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="queryTimeout">Query Timeout (seconds)</Label>
            <Input
              id="queryTimeout"
              type="number"
              value={formData.advancedSettings.queryTimeoutSeconds}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  queryTimeoutSeconds: parseInt(e.target.value) || 60
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Max time for query execution</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idleTimeout">Idle Timeout (ms)</Label>
            <Input
              id="idleTimeout"
              type="number"
              value={formData.advancedSettings.idleTimeoutMs}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  idleTimeoutMs: parseInt(e.target.value) || 600000
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Close idle connections after this time (10min default)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxLifetime">Max Connection Lifetime (ms)</Label>
            <Input
              id="maxLifetime"
              type="number"
              value={formData.advancedSettings.maxLifetimeMs}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  maxLifetimeMs: parseInt(e.target.value) || 1800000
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Close connections after this time regardless of use (30min default)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leakDetection">Leak Detection Threshold (ms)</Label>
            <Input
              id="leakDetection"
              type="number"
              value={formData.advancedSettings.leakDetectionThresholdMs}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  leakDetectionThresholdMs: parseInt(e.target.value) || 60000
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Log warning if connection held longer than this (0 to disable)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validationTimeout">Validation Timeout (ms)</Label>
            <Input
              id="validationTimeout"
              type="number"
              value={formData.advancedSettings.validationTimeoutMs}
              onChange={(e) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  validationTimeoutMs: parseInt(e.target.value) || 5000
                }
              })}
            />
            <p className="text-xs text-muted-foreground">Max time for validation query</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="validationQuery">Validation Query</Label>
          <Input
            id="validationQuery"
            placeholder="SELECT 1"
            value={formData.advancedSettings.validationQuery}
            onChange={(e) => setFormData({
              ...formData,
              advancedSettings: {
                ...formData.advancedSettings,
                validationQuery: e.target.value
              }
            })}
          />
          <p className="text-xs text-muted-foreground">Query to validate connections before use</p>
        </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Advanced Trino Settings
        </Label>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="caseInsensitive"
              checked={formData.advancedSettings.caseInsensitiveNameMatching}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  caseInsensitiveNameMatching: checked as boolean
                }
              })}
            />
            <div className="space-y-1">
              <Label htmlFor="caseInsensitive" className="cursor-pointer">
                Case-Insensitive Name Matching
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow matching table and column names regardless of case
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="allowDrop"
              checked={formData.advancedSettings.allowDropTable}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  allowDropTable: checked as boolean
                }
              })}
            />
            <div className="space-y-1">
              <Label htmlFor="allowDrop" className="cursor-pointer">
                Allow DROP TABLE Operations
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable dropping tables through Trino (use with caution)
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="allowRename"
              checked={formData.advancedSettings.allowRenameTable}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                advancedSettings: {
                  ...formData.advancedSettings,
                  allowRenameTable: checked as boolean
                }
              })}
            />
            <div className="space-y-1">
              <Label htmlFor="allowRename" className="cursor-pointer">
                Allow RENAME TABLE Operations
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable renaming tables through Trino
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
        <h3 className="text-2xl font-bold">Ready to Deploy</h3>
        <p className="text-muted-foreground">
          Review your configuration and deploy the federated source connection
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Source Name</p>
              <p className="font-medium">{formData.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Catalog Name</p>
              <p className="font-medium">{formData.trino.catalog_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Database Type</p>
              <p className="font-medium">{formData.type.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Connection</p>
              <p className="font-medium">{formData.connection.host}:{formData.connection.port}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Database</p>
              <p className="font-medium">{formData.connection.database || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Team</p>
              <p className="font-medium">{formData.team || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Deployment Target Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Deployment Target
          </CardTitle>
          <CardDescription>
            Choose where the catalog configuration will be deployed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={deploymentTarget} onValueChange={(value: DeploymentTarget) => setDeploymentTarget(value)}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="kubernetes" id="k8s" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Container className="h-4 w-4 text-primary" />
                    <Label htmlFor="k8s" className="cursor-pointer font-medium">
                      Kubernetes Cluster
                    </Label>
                    <Badge variant="default" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Deploy catalog configuration as K8s ConfigMap in Trino namespace
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>• Automatic restart of Trino coordinator</p>
                    <p>• GitOps-ready YAML output</p>
                    <p>• Secret management via K8s Secrets</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="self-hosted" id="self-hosted" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="h-4 w-4 text-primary" />
                    <Label htmlFor="self-hosted" className="cursor-pointer font-medium">
                      Self-Hosted Trino
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate properties file for manual deployment to /etc/trino/catalog/
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>• Download .properties file</p>
                    <p>• Manual coordinator restart required</p>
                    <p>• Full control over deployment</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="cloud-managed" id="cloud" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="h-4 w-4 text-primary" />
                    <Label htmlFor="cloud" className="cursor-pointer font-medium">
                      Cloud-Managed Trino
                    </Label>
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Deploy via cloud provider APIs (AWS EMR, Starburst, Ahana)
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>• API-driven deployment</p>
                    <p>• Automatic integration</p>
                    <p>• Provider-managed lifecycle</p>
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Configuration Preview */}
      {deploymentTarget && (() => {
        try {
          // Build secret reference
          const passwordSecret: SecretReference = secretStorageType === 'plaintext'
            ? { type: 'plaintext', reference: '', plaintext_value: formData.connection.password }
            : { type: secretStorageType, reference: secretReference };

          // Build connection details with secret
          const connectionWithSecret: ConnectionDetails = {
            ...formData.connection,
            password_secret: passwordSecret,
          };

          // Build TrinoConfig with all settings
          const trinoConfig: TrinoConfig = {
            catalog_name: formData.trino.catalog_name || '',
            connector_type: formData.type,
            schema_mapping: formData.schemaMapping,
            connection_pool_size: formData.advancedSettings.connectionPoolSize,
            connection_pool_min_size: formData.advancedSettings.connectionPoolMinSize,
            connection_pool_max_size: formData.advancedSettings.connectionPoolMaxSize,
            query_timeout_seconds: formData.advancedSettings.queryTimeoutSeconds,
            case_insensitive_name_matching: formData.advancedSettings.caseInsensitiveNameMatching,
            allow_drop_table: formData.advancedSettings.allowDropTable,
            allow_rename_table: formData.advancedSettings.allowRenameTable,
          };

          // Generate catalog configuration
          const catalog = generateTrinoCatalog(
            formData.type,
            formData.trino.catalog_name || 'catalog',
            connectionWithSecret,
            trinoConfig
          );

          const propertiesFile = catalogPropertiesToFile(catalog);
          const configMapDeployment = generateConfigMapForCatalog(catalog, 'trino');

          return (
            <Card className="border-primary/50 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Configuration Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/90 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  {deploymentTarget === 'kubernetes' && (
                    <pre>{`apiVersion: v1
kind: ConfigMap
metadata:
  name: ${configMapDeployment.configMapName}
  namespace: trino
data:
  ${catalog.catalogName}.properties: |
${propertiesFile.split('\n').map(line => `    ${line}`).join('\n')}`}</pre>
                  )}
                  {deploymentTarget === 'self-hosted' && (
                    <pre>{`# ${catalog.catalogName}.properties
# Place this file in /etc/trino/catalog/ directory

${propertiesFile}

# Restart Trino coordinator after deployment:
# systemctl restart trino-coordinator`}</pre>
                  )}
                  {deploymentTarget === 'cloud-managed' && (
                    <pre>{`# Cloud-managed deployment
# This feature is coming soon.
# Configuration will be deployed via cloud provider APIs.`}</pre>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        } catch (error) {
          return (
            <Card className="border-red-500/50 bg-red-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  Configuration Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">
                  {error instanceof Error ? error.message : 'Failed to generate catalog configuration'}
                </p>
              </CardContent>
            </Card>
          );
        }
      })()}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header - Outside card for clear hierarchy */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          <span>Federated Query Source</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Configure Trino Catalog</h1>
        <p className="text-muted-foreground text-base">
          Set up a direct query connection to your source database
        </p>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-display tracking-tight">
          {currentStep === 0 && 'Infrastructure Prerequisites'}
          {currentStep === 1 && 'Connection Details'}
          {currentStep === 2 && 'Trino Configuration'}
          {currentStep === 3 && 'Advanced Settings'}
          {currentStep === 4 && 'Review & Deploy'}
        </h2>
        <p className="text-muted-foreground text-base">
          {currentStep === 0 && 'Ensure prerequisites are met before continuing'}
          {currentStep === 1 && 'Enter your database connection information'}
          {currentStep === 2 && 'Configure schema mapping and connection pool'}
          {currentStep === 3 && 'Optional advanced Trino settings'}
          {currentStep === 4 && 'Review and deploy your source connection'}
        </p>
      </div>

      {/* Step Content - Primary card */}
      <Card className="border-2 shadow-lg">
        <CardContent className="p-8">
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </CardContent>
      </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => router.push('/manage/connections/new/federated/select-connector') : handlePrevious}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 0 ? 'Back to Connector Selection' : 'Previous'}
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleDeploy} className="gap-2">
              <Zap className="h-4 w-4" />
              Deploy Source
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
