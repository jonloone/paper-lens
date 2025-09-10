'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIEndpointCatalog } from '@/components/api-management/APIEndpointCatalog';
import { APIKeyManager } from '@/components/api-management/APIKeyManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Link,
  Cloud,
  Database,
  Key,
  Code,
  Shield,
  Settings,
  ExternalLink,
  Globe,
  GitBranch,
  Search,
  Zap,
  Brain,
  BarChart,
  Loader2
} from 'lucide-react';
import { APIGateway } from '@/lib/services/APIGateway';

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState('apis');
  const [hostedApps, setHostedApps] = useState<any[]>([]);
  const [dataAPIs, setDataAPIs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateway] = useState(() => new APIGateway());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load hosted apps from API Gateway
      const apps = await gateway.getHostedApps();
      setHostedApps(apps);

      // Load data APIs
      const apis = await gateway.listDataAPIs();
      setDataAPIs(apis);
    } catch (error) {
      console.error('Failed to load connect data:', error);
      // Fallback to default apps
      setHostedApps(getDefaultApps());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultApps = () => [
    {
      id: 'datahub',
      name: 'Global Data Catalog',
      description: 'Browse and manage data assets',
      url: process.env.NEXT_PUBLIC_DATAHUB_URL || 'http://localhost:9002',
      icon: Database,
      category: 'catalog',
      available: true
    },
    {
      id: 'airflow',
      name: 'Data Orchestration',
      description: 'Manage and monitor data pipelines',
      url: process.env.NEXT_PUBLIC_AIRFLOW_URL || 'http://localhost:8080',
      icon: GitBranch,
      category: 'orchestration',
      available: true
    },
    {
      id: 'trino',
      name: 'Federated Query Engine',
      description: 'Query data across multiple sources',
      url: process.env.NEXT_PUBLIC_TRINO_URL || 'http://localhost:8080',
      icon: Search,
      category: 'query',
      available: true
    },
    {
      id: 'nifi',
      name: 'NiFi Flow and Streams',
      description: 'Design and manage data flows',
      url: process.env.NEXT_PUBLIC_NIFI_URL || 'http://localhost:8443/nifi',
      icon: Zap,
      category: 'ingestion',
      available: true
    },
    {
      id: 'ranger',
      name: 'Data Policy Engine',
      description: 'Manage data access and security policies',
      url: process.env.NEXT_PUBLIC_RANGER_URL || 'http://localhost:6080',
      icon: Shield,
      category: 'security',
      available: true
    },
    {
      id: 'mlflow',
      name: 'Data Science Workbench',
      description: 'ML experiments and model management',
      url: process.env.NEXT_PUBLIC_MLFLOW_URL || 'http://localhost:5000',
      icon: Brain,
      category: 'ml',
      available: true
    },
    {
      id: 'superset',
      name: 'BI Workbench',
      description: 'Create dashboards and visualizations',
      url: process.env.NEXT_PUBLIC_SUPERSET_URL || 'http://localhost:8088',
      icon: BarChart,
      category: 'analytics',
      available: true
    },
    {
      id: 'nexusone-api',
      name: 'NexusOne API',
      description: 'Access NexusOne programmatically',
      url: '/api/docs',
      icon: Code,
      category: 'api',
      available: true
    }
  ];

  const getIconForApp = (app: any) => {
    const iconMap: Record<string, any> = {
      Database, GitBranch, Search, Zap, Shield, Brain, BarChart, Code, Cloud, Globe
    };
    return iconMap[app.icon] || app.icon || Database;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Connect</h1>
          <p className="text-muted-foreground">
            Manage API access, integrations, and hosted applications
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-[500px]">
          <TabsTrigger value="apis" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Data APIs
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="apps" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Hosted Apps
          </TabsTrigger>
        </TabsList>

        {/* Data APIs Tab */}
        <TabsContent value="apis" className="space-y-6">
          <APIEndpointCatalog />
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <APIKeyManager />
        </TabsContent>

        {/* Hosted Apps Tab */}
        <TabsContent value="apps" className="space-y-6">
          <div>
            <h2 className="text-2xl">Hosted Applications</h2>
            <p className="text-muted-foreground">
              Access your integrated data tools and platforms
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {hostedApps.map((app) => {
                const Icon = getIconForApp(app);
                return (
                  <Card 
                    key={app.id} 
                    className={`hover:shadow-lg transition-all cursor-pointer ${
                      !app.available ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-lg ${
                          app.available ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Icon className={`h-8 w-8 ${
                            app.available ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{app.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {app.description}
                          </p>
                        </div>
                        <Button 
                          className="w-full" 
                          variant={app.available ? "default" : "outline"}
                          disabled={!app.available}
                          onClick={() => window.open(app.url, '_blank')}
                        >
                          {app.available ? (
                            <>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </>
                          ) : (
                            'Unavailable'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Additional Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Single Sign-On (SSO)</p>
                  <p className="text-sm text-muted-foreground">
                    Configure SAML or OAuth authentication
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">IP Allowlist</p>
                  <p className="text-sm text-muted-foreground">
                    Restrict API access to specific IP addresses
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Audit Logs</p>
                  <p className="text-sm text-muted-foreground">
                    View API access and usage history
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}