'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Upload,
  Globe,
  Zap,
  Cloud,
  Server,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react';

export interface SourceType {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'federated' | 'lakehouse';
  popular?: boolean;
}

interface SourceTypeSelectorProps {
  onSelect: (sourceType: SourceType) => void;
  selectedType?: string;
}

export function SourceTypeSelector({ onSelect, selectedType }: SourceTypeSelectorProps) {
  const sourceTypes: SourceType[] = [
    {
      id: 'database',
      label: 'Database',
      description: 'Connect to PostgreSQL, MySQL, Oracle, SQL Server',
      icon: Database,
      category: 'federated',
      popular: true
    },
    {
      id: 'file',
      label: 'File Upload',
      description: 'Upload CSV, JSON, Parquet, Excel files',
      icon: Upload,
      category: 'lakehouse',
      popular: true
    },
    {
      id: 'api',
      label: 'REST API',
      description: 'Pull data from HTTP endpoints',
      icon: Globe,
      category: 'federated'
    },
    {
      id: 'streaming',
      label: 'Streaming',
      description: 'Kafka, Kinesis, Pub/Sub, Event Hubs',
      icon: Zap,
      category: 'federated',
      popular: true
    },
    {
      id: 's3',
      label: 'Cloud Storage',
      description: 'S3, GCS, Azure Blob, Dropbox',
      icon: Cloud,
      category: 'lakehouse'
    },
    {
      id: 'sftp',
      label: 'SFTP/FTP',
      description: 'File transfer servers',
      icon: Server,
      category: 'lakehouse'
    }
  ];

  // Mock recent sources
  const recentSources = [
    {
      name: 'PostgreSQL - customer_db',
      type: 'database',
      lastUsed: '2 hours ago',
      icon: Database
    },
    {
      name: 'S3 - sales-data-bucket',
      type: 's3',
      lastUsed: 'yesterday',
      icon: Cloud
    },
    {
      name: 'Kafka - events-stream',
      type: 'streaming',
      lastUsed: '3 days ago',
      icon: Zap
    }
  ];

  const federatedSources = sourceTypes.filter(s => s.category === 'federated');
  const lakehouseSources = sourceTypes.filter(s => s.category === 'lakehouse');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl">What kind of data do you want to work with?</h2>
        <p className="text-muted-foreground">
          Choose your data source type to get started
        </p>
      </div>

      {/* Source Type Selection */}
      <div className="space-y-6">
        {/* Federated Sources */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium">Federated</h3>
            <Badge variant="outline" className="text-xs">
              Query data in place
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {federatedSources.map((source) => {
              const Icon = source.icon;
              return (
                <Card
                  key={source.id}
                  className={`
                    relative p-6 cursor-pointer transition-all hover:shadow-lg
                    ${selectedType === source.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                    }
                  `}
                  onClick={() => onSelect(source)}
                >
                  {source.popular && (
                    <Badge className="absolute top-3 right-3 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-medium">{source.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Lakehouse Sources */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium">Lakehouse</h3>
            <Badge variant="outline" className="text-xs">
              Import to Iceberg tables
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lakehouseSources.map((source) => {
              const Icon = source.icon;
              return (
                <Card
                  key={source.id}
                  className={`
                    relative p-6 cursor-pointer transition-all hover:shadow-lg
                    ${selectedType === source.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                    }
                  `}
                  onClick={() => onSelect(source)}
                >
                  {source.popular && (
                    <Badge className="absolute top-3 right-3 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-medium">{source.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recently Used */}
        {recentSources.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Used
            </h3>
            <div className="space-y-2">
              {recentSources.map((recent, index) => {
                const Icon = recent.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      const sourceType = sourceTypes.find(s => s.id === recent.type);
                      if (sourceType) onSelect(sourceType);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{recent.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{recent.lastUsed}</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}