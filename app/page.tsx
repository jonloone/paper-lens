'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  GitBranch, 
  Settings, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database,
  Zap,
  Shield,
  BarChart3,
  Users,
  Clock
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl">
            <Badge className="mb-4" variant="secondary">
              Intelligent Data Operations Platform
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Your Data Engineering Command Center
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              NexusOne orchestrates your entire data ecosystem through AI-powered workflows, 
              eliminating tool fragmentation and accelerating the journey from raw data to trusted insights.
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href="/monitor">
                  <Activity className="mr-2 h-5 w-5" />
                  View Operations
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/configure">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">23</div>
              <div className="text-sm text-muted-foreground">Active Pipelines</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">97.8%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">2.3M</div>
              <div className="text-sm text-muted-foreground">Records/Hour</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">4.2min</div>
              <div className="text-sm text-muted-foreground">Avg Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Navigation Cards */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Start with Your Current Need</h2>
            <p className="text-lg text-muted-foreground">
              Navigate directly to what matters most right now
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Monitor Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Monitor</CardTitle>
                <CardDescription className="text-base">
                  What's happening now?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Real-time system health monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Pipeline performance tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Cross-system incident correlation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Intelligent troubleshooting</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/monitor">
                    Open Monitor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Build Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <GitBranch className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Build</CardTitle>
                <CardDescription className="text-base">
                  How do I create something?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Pipeline templates and wizards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Data product patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">AI-assisted development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Deployment workflows</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/build">
                    Start Building
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Configure Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Configure</CardTitle>
                <CardDescription className="text-base">
                  How is my infrastructure set up?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Connected systems management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Infrastructure configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Security and access control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm">Platform settings</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/configure">
                    Configure Systems
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Current Status Summary */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">System Status Overview</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">2</div>
                <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Running Pipelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">18</div>
                <p className="text-xs text-muted-foreground mt-1">Currently processing</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">94%</div>
                <p className="text-xs text-muted-foreground mt-1">Passing quality checks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">12</div>
                <p className="text-xs text-muted-foreground mt-1">Team members online</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">customer_360 pipeline completed</p>
                <p className="text-sm text-muted-foreground">Successfully processed 2.3M records</p>
              </div>
              <span className="text-sm text-muted-foreground">5 min ago</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium">Performance degradation detected</p>
                <p className="text-sm text-muted-foreground">payment_processing pipeline running 30% slower</p>
              </div>
              <span className="text-sm text-muted-foreground">12 min ago</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Zap className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">New data source activated</p>
                <p className="text-sm text-muted-foreground">Salesforce CRM connector is now live</p>
              </div>
              <span className="text-sm text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}