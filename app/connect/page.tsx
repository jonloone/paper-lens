'use client';

import React, { useState } from 'react';
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
  Globe
} from 'lucide-react';

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState('apis');

  // Mock data for hosted apps
  const hostedApps = [
    {
      id: '1',
      name: 'Jupyter Hub',
      description: 'Interactive notebooks for data analysis',
      status: 'running',
      url: 'https://jupyter.nexus.com',
      icon: Code
    },
    {
      id: '2',
      name: 'Apache Airflow',
      description: 'Workflow orchestration platform',
      status: 'running',
      url: 'https://airflow.nexus.com',
      icon: Cloud
    },
    {
      id: '3',
      name: 'Apache Superset',
      description: 'Data exploration and visualization',
      status: 'running',
      url: 'https://superset.nexus.com',
      icon: Database
    },
    {
      id: '4',
      name: 'DataHub',
      description: 'Metadata platform for data discovery',
      status: 'running',
      url: 'https://datahub.nexus.com',
      icon: Globe
    }
  ];

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostedApps.map((app) => {
              const Icon = app.icon;
              return (
                <Card key={app.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-lg">{app.name}</span>
                      </div>
                      <Badge variant="default" className="text-xs">
                        {app.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {app.description}
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => window.open(app.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Application
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

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