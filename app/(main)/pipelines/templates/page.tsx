'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  BookOpen,
  GitBranch,
  Database,
  Zap,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  Star,
  Copy
} from 'lucide-react';
import Link from 'next/link';
import TemplateLibrary from '@/components/pipeline-builder/TemplateLibrary';

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Templates', count: 52 },
    { id: 'etl', label: 'ETL', count: 18 },
    { id: 'streaming', label: 'Streaming', count: 12 },
    { id: 'batch', label: 'Batch', count: 8 },
    { id: 'quality', label: 'Quality', count: 6 },
    { id: 'ml', label: 'ML', count: 5 },
    { id: 'custom', label: 'Custom', count: 3 }
  ];

  const featuredTemplates = [
    {
      id: 'cdc-postgres-s3',
      name: 'CDC: PostgreSQL to S3',
      description: 'Real-time change data capture from PostgreSQL to data lake',
      category: 'etl',
      icon: Database,
      stats: {
        uses: 342,
        rating: 4.9,
        time: '5 min setup'
      },
      tags: ['CDC', 'PostgreSQL', 'S3', 'Real-time']
    },
    {
      id: 'daily-aggregation',
      name: 'Daily Aggregation Pipeline',
      description: 'Aggregate daily metrics with automatic partitioning',
      category: 'batch',
      icon: Clock,
      stats: {
        uses: 256,
        rating: 4.8,
        time: '10 min setup'
      },
      tags: ['Batch', 'Aggregation', 'Scheduled']
    },
    {
      id: 'kafka-streaming',
      name: 'Kafka Event Streaming',
      description: 'Process streaming events from Kafka with exactly-once semantics',
      category: 'streaming',
      icon: Zap,
      stats: {
        uses: 189,
        rating: 4.7,
        time: '15 min setup'
      },
      tags: ['Kafka', 'Streaming', 'Real-time']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pipeline Templates</h1>
        <p className="text-muted-foreground">
          Pre-built, tested solutions ready to deploy
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
              <Badge variant="secondary" className="ml-2">
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Featured Templates */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Featured Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  <CardTitle className="mt-4">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{template.stats.uses}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span>{template.stats.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{template.stats.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href="/learn/remix" className="flex-1">
                      <Button variant="default" className="w-full">
                        <GitBranch className="mr-2 h-4 w-4" />
                        Remix
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Template Library Component */}
      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>Browse our complete template library</CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateLibrary />
        </CardContent>
      </Card>
    </div>
  );
}