'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Database, Cloud, GitBranch, Server, Code, Package, BarChart, Shield } from 'lucide-react';

// Mapping of technology names to their logo files and fallback icons
const techIconMap: Record<string, { logo?: string; fallbackIcon?: any; color?: string }> = {
  // Orchestration & Workflow
  'airflow': { logo: 'airflow.png', color: '#017CEE' },
  'apache-airflow': { logo: 'airflow.png', color: '#017CEE' },
  'prefect': { fallbackIcon: GitBranch, color: '#1D4ED8' },
  'dagster': { fallbackIcon: GitBranch, color: '#5B52D5' },
  
  // Data Processing
  'spark': { logo: 'spark.svg', color: '#E25A1C' },
  'apache-spark': { logo: 'spark.svg', color: '#E25A1C' },
  'databricks': { fallbackIcon: Cloud, color: '#FF3621' },
  'ray': { fallbackIcon: Server, color: '#028CF0' },

  // Streaming
  'kafka': { logo: 'kafka.svg', color: '#231F20' },
  'apache-kafka': { logo: 'kafka.svg', color: '#231F20' },
  'kinesis': { logo: 'kinesis.svg', color: '#FF9900' },
  'pulsar': { fallbackIcon: Server, color: '#188FFF' },

  // Databases
  'postgresql': { logo: 'postgresql.svg', color: '#336791' },
  'postgres': { logo: 'postgresql.svg', color: '#336791' },
  'mysql': { logo: 'mysql.svg', color: '#4479A1' },
  'oracle': { logo: 'oracle.svg', color: '#F80000' },
  'sqlserver': { logo: 'sqlserver.svg', color: '#CC2927' },
  'mongodb': { logo: 'mongodb.svg', color: '#47A248' },
  'redis': { logo: 'redis.svg', color: '#DC382D' },
  'elasticsearch': { logo: 'elasticsearch.svg', color: '#005571' },
  'cassandra': { logo: 'cassandra.svg', color: '#1287B1' },
  'clickhouse': { fallbackIcon: Database, color: '#FFCC01' },

  // Query Engines
  'trino': { logo: 'trino.svg', color: '#DD00A1' },
  'presto': { fallbackIcon: Database, color: '#5890FF' },
  'athena': { fallbackIcon: Database, color: '#FF9900' },
  'bigquery': { logo: 'bigquery.svg', color: '#4285F4' },

  // Cloud Data Warehouses
  'snowflake': { logo: 'snowflake.svg', color: '#29B5E8' },
  'redshift': { logo: 'redshift.svg', color: '#8C4FFF' },
  'synapse': { logo: 'synapse.svg', color: '#0078D4' },

  // Data Lakehouses
  'iceberg': { logo: 'iceberg.svg', color: '#1E90FF' },
  'delta-lake': { logo: 'delta-lake.svg', color: '#00ADD4' },
  'delta_lake': { logo: 'delta-lake.svg', color: '#00ADD4' },
  'hudi': { logo: 'hudi.svg', color: '#FF6A00' },

  // Analytics
  'druid': { logo: 'druid.svg', color: '#29F1FB' },
  
  // Cloud Providers
  'aws': { logo: 'aws.svg', color: '#FF9900' },
  'gcp': { logo: 'gcp.svg', color: '#4285F4' },
  'azure': { logo: 'azure.svg', color: '#0078D4' },
  'googlecloud': { logo: 'gcp.svg', color: '#4285F4' },
  
  // Storage
  's3': { logo: 's3.svg', color: '#569A31' },
  'gcs': { logo: 'gcp.svg', color: '#4285F4' },
  'hdfs': { logo: 'apache.svg', color: '#FDC726' },
  'blob': { logo: 'blob.svg', color: '#0078D4' },
  
  // Languages
  'python': { logo: 'python.svg', color: '#3776AB' },
  'java': { logo: 'java.svg', color: '#007396' },
  'scala': { logo: 'scala.svg', color: '#DC322F' },
  'sql': { fallbackIcon: Code, color: '#336791' },
  
  // Infrastructure
  'docker': { logo: 'docker.svg', color: '#2496ED' },
  'kubernetes': { logo: 'kubernetes.svg', color: '#326CE5' },
  'terraform': { logo: 'terraform.svg', color: '#7B42BC' },
  
  // Monitoring
  'grafana': { logo: 'grafana.svg', color: '#F46800' },
  'prometheus': { logo: 'prometheus.svg', color: '#E6522C' },
  'datadog': { fallbackIcon: BarChart, color: '#632CA6' },
  
  // Data Tools
  'dbt': { fallbackIcon: Package, color: '#FF6B6B' },
  'nifi': { logo: 'nifi.svg', color: '#728E9B' },
  'apache-nifi': { logo: 'nifi.svg', color: '#728E9B' },
  'debezium': { logo: 'debezium.svg', color: '#DC382D' },
  'datahub': { fallbackIcon: Database, color: '#1890FF' },
  'great-expectations': { fallbackIcon: Shield, color: '#FE5E00' },
  'mlflow': { fallbackIcon: BarChart, color: '#0194E2' },
  
  // Version Control
  'github': { logo: 'github.svg', color: '#181717' },
  'gitlab': { logo: 'gitlab.svg', color: '#FC6D26' },
  'bitbucket': { fallbackIcon: GitBranch, color: '#0052CC' },
  
  // Notebooks
  'jupyter': { logo: 'jupyter.svg', color: '#F37626' },
  'databricks-notebook': { fallbackIcon: Code, color: '#FF3621' },
  
  // SaaS Platforms
  'salesforce': { logo: 'salesforce.svg', color: '#00A1E0' },
  'slack': { logo: 'slack.svg', color: '#4A154B' },
  'stripe': { logo: 'stripe.svg', color: '#008CDD' },
  'shopify': { logo: 'shopify.svg', color: '#95BF47' },
  'zendesk': { logo: 'zendesk.svg', color: '#03363D' },
  'sap': { logo: 'sap.svg', color: '#0066B3' },

  // File Formats
  'json': { logo: 'json.svg', color: '#000000' },
  'csv': { logo: 'excel.svg', color: '#107C41' },
  'xml': { logo: 'xml.svg', color: '#005FAD' },
  'parquet': { logo: 'parquet.svg', color: '#50ABF1' },
  'avro': { logo: 'avro.svg', color: '#D22128' },

  // Others
  'pandas': { logo: 'pandas.svg', color: '#130754' },
  'apache': { logo: 'apache.svg', color: '#D22128' },
  'ranger': { fallbackIcon: Shield, color: '#017B5F' },
  'apisix': { fallbackIcon: Server, color: '#F6421B' },
};

interface TechIconProps {
  technology: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'branded';
}

export function TechIcon({ 
  technology, 
  size = 'md', 
  className,
  showLabel = false,
  variant = 'default'
}: TechIconProps) {
  const normalizedTech = technology.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const techConfig = techIconMap[normalizedTech] || techIconMap[technology.toLowerCase()] || {};
  
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  };
  
  const sizePx = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40
  };
  
  const FallbackIcon = techConfig.fallbackIcon || Database;
  const iconColor = variant === 'branded' ? techConfig.color : undefined;
  
  if (techConfig.logo) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(sizeClasses[size], 'relative flex-shrink-0 flex items-center justify-center')}>
          <Image
            src={`/tech-icons/${techConfig.logo}`}
            alt={technology}
            width={sizePx[size]}
            height={sizePx[size]}
            className="object-contain max-w-full max-h-full"
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium capitalize">
            {technology.replace(/-/g, ' ')}
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <FallbackIcon 
        className={cn(sizeClasses[size], 'flex-shrink-0')}
        style={{ color: iconColor }}
      />
      {showLabel && (
        <span className="text-sm font-medium capitalize">
          {technology.replace(/-/g, ' ')}
        </span>
      )}
    </div>
  );
}

// Export a function to check if a technology has a custom icon
export function hasTechIcon(technology: string): boolean {
  const normalizedTech = technology.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return !!(techIconMap[normalizedTech]?.logo || techIconMap[technology.toLowerCase()]?.logo);
}

// Export the color for a technology
export function getTechColor(technology: string): string | undefined {
  const normalizedTech = technology.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return techIconMap[normalizedTech]?.color || techIconMap[technology.toLowerCase()]?.color;
}