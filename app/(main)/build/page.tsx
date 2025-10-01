'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Box,
  Sparkles,
  ArrowRight,
  Clock,
  Database,
  Brain,
  Workflow
} from 'lucide-react';

interface ProductType {
  id: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  description: string;
  time: string;
  features: string[];
  route: string;
  badge?: string;
}

export default function BuildHubPage() {
  const router = useRouter();

  const productTypes: ProductType[] = [
    {
      id: 'foundation',
      icon: Zap,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200 hover:border-amber-400',
      title: 'Connect Data Source',
      description: 'Connect a new data source and make it discoverable',
      time: '30 min',
      features: [
        'Auto-discover schema',
        'Profile data quality',
        'Publish to catalog',
        'Set refresh schedule'
      ],
      route: '/build/foundation/connect',
      badge: 'Foundation Product'
    },
    {
      id: 'domain',
      icon: Box,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200 hover:border-blue-400',
      title: 'Model Business Entity',
      description: 'Create a domain entity with business context',
      time: '1 hour',
      features: [
        'Define business terms',
        'Map source tables',
        'Apply governance',
        'Generate products'
      ],
      route: '/build/domain/context',
      badge: 'Domain Product'
    },
    {
      id: 'composable',
      icon: Sparkles,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200 hover:border-green-400',
      title: 'Solve Business Problem',
      description: 'Describe a problem and compose from existing products',
      time: '45 min',
      features: [
        'Natural language input',
        'Find similar solutions',
        'Compose products',
        'Deploy combined output'
      ],
      route: '/build/composable/problem',
      badge: 'Composable Product'
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Workflow className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Build</h1>
              <p className="text-muted-foreground text-lg mt-1">
                Choose what you'd like to create
              </p>
            </div>
          </div>
        </div>

        {/* Product Type Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {productTypes.map((product) => {
            const Icon = product.icon;
            return (
              <Card
                key={product.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-2 ${product.borderColor}`}
                onClick={() => router.push(product.route)}
              >
                <CardContent className="p-8 space-y-6">

                  {/* Icon and Badge */}
                  <div className="flex items-start justify-between">
                    <div className={`w-16 h-16 rounded-2xl ${product.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${product.iconColor}`} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {product.badge}
                    </Badge>
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {product.description}
                    </p>
                  </div>

                  {/* Time Estimate */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Typical time: {product.time}</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${product.bgColor} ${product.iconColor}`} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    variant="outline"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>

                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="p-6 bg-muted/30 border-muted">
          <div className="flex items-start gap-4">
            <Database className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold">Not sure which to choose?</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Foundation</strong>: Start here when connecting a new database, API, or file source</p>
                <p><strong>Domain</strong>: Create canonical business entities like Customer, Order, or Product</p>
                <p><strong>Composable</strong>: Solve specific business problems by combining existing products</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Footer */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">127</div>
            <div className="text-sm text-muted-foreground mt-1">Active Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">1,249</div>
            <div className="text-sm text-muted-foreground mt-1">Queries This Week</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">98.7%</div>
            <div className="text-sm text-muted-foreground mt-1">Pipeline Success</div>
          </div>
        </div>

      </div>
    </div>
  );
}
