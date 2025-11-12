'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Plug,
  Hammer,
  Search,
  Activity,
  Code,
  Database,
  Workflow,
  Wind,
  BarChart3,
  Layers,
  Radar,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  category: 'workflow' | 'entitlement';
  iconColor: string;
  iconBg: string;
  logoPath?: string;
}

const tools: ToolCard[] = [
  // Workflow Cards
  {
    id: 'connect',
    title: 'Connect',
    description: 'Link your data sources and configure connections to your ecosystem',
    icon: Plug,
    href: '/manage',
    category: 'workflow',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10'
  },
  {
    id: 'build',
    title: 'Build',
    description: 'Create and design data products with guided workflows and quality gates',
    icon: Hammer,
    href: '/build',
    category: 'workflow',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10'
  },
  {
    id: 'discover',
    title: 'Discover',
    description: 'Search and explore your data catalog to find trusted data products',
    icon: Search,
    href: '/discover',
    category: 'workflow',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-500/10'
  },
  {
    id: 'develop',
    title: 'Develop',
    description: 'Write and execute SQL queries with AI-powered assistance and optimization',
    icon: Code,
    href: '/develop',
    category: 'workflow',
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-500/10'
  },
  {
    id: 'monitor',
    title: 'Monitor',
    description: 'Track pipeline health, data quality, and operational metrics in real-time',
    icon: Activity,
    href: '/operations',
    category: 'workflow',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10'
  },

  // Entitlement Cards
  {
    id: 'trino',
    title: 'Trino',
    description: 'Distributed SQL query engine for analytics at scale',
    icon: Database,
    href: '/tools/trino',
    category: 'entitlement',
    iconColor: 'text-pink-500',
    iconBg: 'bg-pink-500/10',
    logoPath: '/tech-icons/trino.svg'
  },
  {
    id: 'airflow',
    title: 'Apache Airflow',
    description: 'Programmatically author, schedule and monitor workflows',
    icon: Workflow,
    href: '/tools/airflow',
    category: 'entitlement',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
    logoPath: '/tech-icons/apache-airflow.svg'
  },
  {
    id: 'nifi',
    title: 'Apache NiFi',
    description: 'Automated data flow management and processing',
    icon: Wind,
    href: '/tools/nifi',
    category: 'entitlement',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/10',
    logoPath: '/tech-icons/apache-nifi.svg'
  },
  {
    id: 'superset',
    title: 'Apache Superset',
    description: 'Modern data exploration and visualization platform',
    icon: BarChart3,
    href: '/tools/superset',
    category: 'entitlement',
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/10',
    logoPath: '/tech-icons/apache-superset.svg'
  },
  {
    id: 'datahub',
    title: 'DataHub',
    description: 'Metadata platform for the modern data stack',
    icon: Layers,
    href: '/tools/datahub',
    category: 'entitlement',
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-500/10',
    logoPath: '/tech-icons/datahub.svg'
  },
  {
    id: 'datadog',
    title: 'DataDog',
    description: 'Monitoring and security for cloud applications',
    icon: Radar,
    href: '/tools/datadog',
    category: 'entitlement',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-400/10',
    logoPath: '/tech-icons/datadog.svg'
  },
  {
    id: 'ranger',
    title: 'Apache Ranger',
    description: 'Framework for data governance and security',
    icon: Shield,
    href: '/tools/ranger',
    category: 'entitlement',
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-500/10',
    logoPath: '/tech-icons/ranger.svg'
  }
];

const workflowTools = tools.filter(t => t.category === 'workflow');
const entitlementTools = tools.filter(t => t.category === 'entitlement');

export default function OverviewPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Work With Your Data</h1>
          <p className="text-muted-foreground text-lg">
            Access your data workflows and ecosystem tools
          </p>
        </div>

        {/* Workflows Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={tool.href}>
                  <Card className="h-full hover:bg-accent/5 hover:border-accent transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                          tool.iconBg
                        )}>
                          {tool.logoPath ? (
                            <Image
                              src={tool.logoPath}
                              alt={`${tool.title} logo`}
                              width={28}
                              height={28}
                              className="w-7 h-7 object-contain"
                            />
                          ) : (
                            <Icon className={cn("w-6 h-6", tool.iconColor)} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-2">{tool.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Ecosystem Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Your Ecosystem</h2>
            <p className="text-muted-foreground">
              Installed tools and platforms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {entitlementTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={tool.href}>
                  <Card className="h-full hover:bg-accent/5 hover:border-accent transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className={cn(
                          "w-14 h-14 rounded-lg flex items-center justify-center",
                          tool.iconBg
                        )}>
                          {tool.logoPath ? (
                            <Image
                              src={tool.logoPath}
                              alt={`${tool.title} logo`}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Icon className={cn("w-7 h-7", tool.iconColor)} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{tool.title}</h3>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
