'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileUp,
  Database,
  Cloud,
  MessageSquare,
  List,
  ArrowRight,
  Grid,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Connect Landing Page
 *
 * Quick access to all data connection workflows.
 * Groups connectors by category: Files, Databases, Cloud Storage, Messaging.
 */
export default function ConnectPage() {
  const router = useRouter();

  const databaseConnectors = [
    {
      title: 'PostgreSQL',
      href: '/manage/connections/new/connect?category=database&connector=postgresql',
    },
    {
      title: 'MySQL',
      href: '/manage/connections/new/connect?category=database&connector=mysql',
    },
    {
      title: 'Snowflake',
      href: '/manage/connections/new/connect?category=database&connector=snowflake',
    },
    {
      title: 'BigQuery',
      href: '/manage/connections/new/connect?category=database&connector=bigquery',
    },
    {
      title: 'Redshift',
      href: '/manage/connections/new/connect?category=database&connector=redshift',
    },
  ];

  const cloudStorageConnectors = [
    {
      title: 'Amazon S3',
      href: '/manage/connections/new/connect?category=file_storage&connector=s3',
    },
    {
      title: 'Google Cloud Storage',
      href: '/manage/connections/new/connect?category=file_storage&connector=gcs',
    },
    {
      title: 'Azure Blob Storage',
      href: '/manage/connections/new/connect?category=file_storage&connector=azure_blob',
    },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-6xl font-display font-normal tracking-tight">
            Connect Your Data
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Upload files, connect databases, or integrate cloud storage. Your data will be instantly
            queryable and ready for analysis.
          </p>
        </div>

        {/* Upload File - Featured */}
        <Card
          className="group cursor-pointer transition-all hover:shadow-xl hover:border-primary border-2 p-6 bg-primary/5"
          onClick={() => router.push('/manage/connections/new/files/upload')}
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <FileUp className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                Upload File
              </h3>
              <p className="text-muted-foreground">
                CSV, JSON, Parquet, Avro, ORC - Instant upload and query
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Card>

        {/* Databases */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Databases</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {databaseConnectors.map((connector) => (
              <Card
                key={connector.href}
                className="group cursor-pointer transition-all hover:shadow-xl hover:border-primary border-2 p-4"
                onClick={() => router.push(connector.href)}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Database className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {connector.title}
                    </h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cloud Storage */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Cloud Storage</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cloudStorageConnectors.map((connector) => (
              <Card
                key={connector.href}
                className="group cursor-pointer transition-all hover:shadow-xl hover:border-primary border-2 p-4"
                onClick={() => router.push(connector.href)}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Cloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {connector.title}
                    </h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Messaging & Streaming</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className="group cursor-pointer transition-all hover:shadow-xl hover:border-primary border-2 p-4"
              onClick={() =>
                router.push('/manage/connections/new/connect?category=messaging&connector=kafka')
              }
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <MessageSquare className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Apache Kafka
                  </h3>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Browse All & View Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-muted/30 border-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Grid className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Browse All Connectors</h3>
                  <p className="text-sm text-muted-foreground">
                    238+ connectors including Oracle, SQL Server, MongoDB, and more
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/manage/connections/new')}
              >
                Browse
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-muted/30 border-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <List className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">View All Data Sources</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage existing connections, monitor health, and view usage
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/manage/connections')}
              >
                View
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
