'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Layers, Search, Filter, Star, Download, 
  ArrowRight, Clock, Users, GitBranch,
  Database, Brain, TrendingUp, CheckCircle,
  Hash, Calendar, Target, Zap, FileText,
  Share2, Heart, Eye, Code
} from 'lucide-react';

interface PipelinePattern {
  id: string;
  name: string;
  description: string;
  category: 'ingestion' | 'transformation' | 'quality' | 'ml' | 'analytics';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  usageCount: number;
  rating: number;
  lastUpdated: string;
  author: string;
  tags: string[];
  sourceType: string;
  targetType: string;
  featured: boolean;
  starred: boolean;
  downloads: number;
  views: number;
}

const allPatterns: PipelinePattern[] = [
  {
    id: 'pattern-1',
    name: 'CDC to Warehouse',
    description: 'Change Data Capture from transactional databases to data warehouse with real-time processing and conflict resolution',
    category: 'ingestion',
    difficulty: 'intermediate',
    estimatedTime: '45 minutes',
    usageCount: 47,
    rating: 4.8,
    lastUpdated: '2 days ago',
    author: 'Data Platform Team',
    tags: ['real-time', 'cdc', 'warehouse', 'kafka', 'postgres', 'snowflake'],
    sourceType: 'PostgreSQL',
    targetType: 'Snowflake',
    featured: true,
    starred: true,
    downloads: 312,
    views: 1250
  },
  {
    id: 'pattern-2',
    name: 'ML Feature Pipeline',
    description: 'End-to-end feature engineering pipeline with automated quality checks, versioning, and drift detection',
    category: 'ml',
    difficulty: 'advanced',
    estimatedTime: '2 hours',
    usageCount: 23,
    rating: 4.6,
    lastUpdated: '1 week ago',
    author: 'ML Engineering Team',
    tags: ['ml', 'features', 'quality', 'versioning', 'drift-detection'],
    sourceType: 'Data Lake',
    targetType: 'Feature Store',
    featured: true,
    starred: false,
    downloads: 156,
    views: 890
  },
  {
    id: 'pattern-3',
    name: 'API Data Ingestion',
    description: 'Robust API data ingestion with retry logic, rate limiting, authentication, and incremental loading',
    category: 'ingestion',
    difficulty: 'beginner',
    estimatedTime: '30 minutes',
    usageCount: 156,
    rating: 4.9,
    lastUpdated: 'Yesterday',
    author: 'Integration Team',
    tags: ['api', 'incremental', 'retry', 'rate-limit', 'auth', 'rest'],
    sourceType: 'REST API',
    targetType: 'Data Lake',
    featured: false,
    starred: true,
    downloads: 523,
    views: 2100
  },
  {
    id: 'pattern-4',
    name: 'Customer 360 Analytics',
    description: 'Customer data unification and analytics pipeline with PII handling, GDPR compliance, and real-time updates',
    category: 'analytics',
    difficulty: 'intermediate',
    estimatedTime: '1.5 hours',
    usageCount: 31,
    rating: 4.7,
    lastUpdated: '3 days ago',
    author: 'Analytics Team',
    tags: ['customer-360', 'pii', 'gdpr', 'analytics', 'real-time'],
    sourceType: 'Multiple Sources',
    targetType: 'Analytics DB',
    featured: false,
    starred: false,
    downloads: 234,
    views: 1560
  },
  {
    id: 'pattern-5',
    name: 'Event Stream Processing',
    description: 'High-throughput event stream processing with windowing, aggregations, and real-time alerting',
    category: 'transformation',
    difficulty: 'advanced',
    estimatedTime: '3 hours',
    usageCount: 18,
    rating: 4.5,
    lastUpdated: '5 days ago',
    author: 'Stream Processing Team',
    tags: ['streaming', 'kafka', 'flink', 'windowing', 'alerts'],
    sourceType: 'Kafka',
    targetType: 'Multiple Sinks',
    featured: false,
    starred: true,
    downloads: 89,
    views: 670
  },
  {
    id: 'pattern-6',
    name: 'Data Quality Framework',
    description: 'Comprehensive data quality monitoring with automated tests, reporting, and remediation workflows',
    category: 'quality',
    difficulty: 'intermediate',
    estimatedTime: '1 hour',
    usageCount: 42,
    rating: 4.8,
    lastUpdated: '1 week ago',
    author: 'Data Quality Team',
    tags: ['quality', 'testing', 'monitoring', 'great-expectations', 'reports'],
    sourceType: 'Any Data Source',
    targetType: 'Quality Dashboard',
    featured: true,
    starred: false,
    downloads: 278,
    views: 1890
  }
];

export default function PatternsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [activeTab, setActiveTab] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', count: allPatterns.length },
    { id: 'ingestion', label: 'Ingestion', count: allPatterns.filter(p => p.category === 'ingestion').length },
    { id: 'transformation', label: 'Transformation', count: allPatterns.filter(p => p.category === 'transformation').length },
    { id: 'analytics', label: 'Analytics', count: allPatterns.filter(p => p.category === 'analytics').length },
    { id: 'ml', label: 'ML/AI', count: allPatterns.filter(p => p.category === 'ml').length },
    { id: 'quality', label: 'Quality', count: allPatterns.filter(p => p.category === 'quality').length }
  ];

  const filteredPatterns = allPatterns.filter(pattern => {
    const matchesSearch = pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pattern.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pattern.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || pattern.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || pattern.difficulty === selectedDifficulty;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'featured' && pattern.featured) ||
                      (activeTab === 'starred' && pattern.starred);
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesTab;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular': return b.usageCount - a.usageCount;
      case 'rating': return b.rating - a.rating;
      case 'recent': return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
      case 'intermediate': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20';
      case 'advanced': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ingestion': return <Database className="h-4 w-4" />;
      case 'transformation': return <GitBranch className="h-4 w-4" />;
      case 'analytics': return <TrendingUp className="h-4 w-4" />;
      case 'ml': return <Brain className="h-4 w-4" />;
      case 'quality': return <CheckCircle className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3 w-3",
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        )}
      />
    ));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              Pattern Library
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover and reuse proven data pipeline patterns
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Pattern
            </Button>
            <Button>
              <Code className="h-4 w-4 mr-2" />
              Create Pattern
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search patterns, tags, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-80"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.count})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="recent">Recently Updated</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </CardHeader>
        </Card>

        {/* Pattern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Patterns ({allPatterns.length})</TabsTrigger>
            <TabsTrigger value="featured">Featured ({allPatterns.filter(p => p.featured).length})</TabsTrigger>
            <TabsTrigger value="starred">Starred ({allPatterns.filter(p => p.starred).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatterns.map(pattern => (
                <Card key={pattern.id} className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(pattern.category)}
                        <CardTitle className="text-base">{pattern.name}</CardTitle>
                        {pattern.featured && (
                          <Badge variant="default" className="text-xs">Featured</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Heart className={cn("h-3 w-3", pattern.starred && "fill-red-500 text-red-500")} />
                        </Button>
                      </div>
                    </div>
                    
                    <CardDescription className="text-sm line-clamp-2">
                      {pattern.description}
                    </CardDescription>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center">
                        {renderStars(pattern.rating)}
                        <span className="text-xs text-muted-foreground ml-1">
                          {pattern.rating}
                        </span>
                      </div>
                      <Badge className={cn("text-xs px-2", getDifficultyColor(pattern.difficulty))}>
                        {pattern.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Source -> Target */}
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">{pattern.sourceType}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">{pattern.targetType}</span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pattern.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {pattern.usageCount} uses
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {pattern.downloads}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {pattern.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                            #{tag}
                          </Badge>
                        ))}
                        {pattern.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            +{pattern.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Author and Date */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>by {pattern.author}</span>
                        <span>{pattern.lastUpdated}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          <Zap className="h-3 w-3 mr-1" />
                          Use Pattern
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPatterns.length === 0 && (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No patterns found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or browse different categories
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setActiveTab('all');
                }}>
                  Clear filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}