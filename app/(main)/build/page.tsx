'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Layers, Brain, Sparkles, Clock, Search, Filter, 
  ArrowRight, ChevronRight, Database, FileText, 
  GitBranch, Zap, Target, Users, TrendingUp,
  Plus, Play, Settings, Bot, CheckCircle,
  AlertCircle, Calendar, Hash
} from 'lucide-react';

// Types for pattern-driven creation
interface PipelinePattern {
  id: string;
  name: string;
  description: string;
  category: 'ingestion' | 'transformation' | 'quality' | 'ml' | 'analytics';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  usageCount: number;
  lastUsed?: string;
  tags: string[];
  confidence: number;
  sourceType?: string;
  targetType?: string;
}

interface RecommendedPattern {
  pattern: PipelinePattern;
  reasoning: string;
  relevanceScore: number;
  organizationalFit: string;
}

// Mock data for MVP demonstration
const availablePatterns: PipelinePattern[] = [
  {
    id: 'pattern-1',
    name: 'CDC to Warehouse',
    description: 'Change Data Capture from transactional databases to data warehouse with real-time processing',
    category: 'ingestion',
    difficulty: 'intermediate',
    estimatedTime: '45 minutes',
    usageCount: 47,
    lastUsed: '2 days ago',
    tags: ['real-time', 'cdc', 'warehouse', 'kafka'],
    confidence: 94,
    sourceType: 'PostgreSQL',
    targetType: 'Snowflake'
  },
  {
    id: 'pattern-2',
    name: 'ML Feature Pipeline',
    description: 'End-to-end feature engineering pipeline with automated quality checks and versioning',
    category: 'ml',
    difficulty: 'advanced',
    estimatedTime: '2 hours',
    usageCount: 23,
    lastUsed: '1 week ago',
    tags: ['ml', 'features', 'quality', 'versioning'],
    confidence: 87,
    sourceType: 'Data Lake',
    targetType: 'Feature Store'
  },
  {
    id: 'pattern-3',
    name: 'API Data Ingestion',
    description: 'Robust API data ingestion with retry logic, rate limiting, and incremental loading',
    category: 'ingestion',
    difficulty: 'beginner',
    estimatedTime: '30 minutes',
    usageCount: 156,
    lastUsed: 'Yesterday',
    tags: ['api', 'incremental', 'retry', 'rate-limit'],
    confidence: 98,
    sourceType: 'REST API',
    targetType: 'Data Lake'
  },
  {
    id: 'pattern-4',
    name: 'Customer 360 Analytics',
    description: 'Customer data unification and analytics pipeline with PII handling and GDPR compliance',
    category: 'analytics',
    difficulty: 'intermediate',
    estimatedTime: '1.5 hours',
    usageCount: 31,
    lastUsed: '3 days ago',
    tags: ['customer-360', 'pii', 'gdpr', 'analytics'],
    confidence: 91,
    sourceType: 'Multiple Sources',
    targetType: 'Analytics DB'
  }
];

const recentProjects = [
  { name: 'Customer Analytics Pipeline', status: 'active', lastModified: '2 hours ago' },
  { name: 'Real-time Order Processing', status: 'testing', lastModified: '1 day ago' },
  { name: 'Marketing Attribution Model', status: 'completed', lastModified: '3 days ago' }
];

export default function BuildPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [projectDescription, setProjectDescription] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<RecommendedPattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const categories = [
    { id: 'all', label: 'All Patterns', count: availablePatterns.length },
    { id: 'ingestion', label: 'Data Ingestion', count: availablePatterns.filter(p => p.category === 'ingestion').length },
    { id: 'transformation', label: 'Transformation', count: availablePatterns.filter(p => p.category === 'transformation').length },
    { id: 'analytics', label: 'Analytics', count: availablePatterns.filter(p => p.category === 'analytics').length },
    { id: 'ml', label: 'ML/AI', count: availablePatterns.filter(p => p.category === 'ml').length },
    { id: 'quality', label: 'Quality', count: availablePatterns.filter(p => p.category === 'quality').length }
  ];

  const filteredPatterns = availablePatterns.filter(pattern => {
    const matchesSearch = pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pattern.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pattern.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || pattern.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAIAnalysis = async () => {
    if (!projectDescription.trim()) return;
    
    setIsAnalyzing(true);
    setShowAIAssistant(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const recommendations: RecommendedPattern[] = [
        {
          pattern: availablePatterns[0],
          reasoning: 'Based on your description of real-time customer data processing, this CDC pattern provides the low-latency foundation you need.',
          relevanceScore: 96,
          organizationalFit: 'Matches 3 similar projects completed by your team'
        },
        {
          pattern: availablePatterns[3],
          reasoning: 'Customer 360 analytics pattern includes the PII handling and compliance features mentioned in your requirements.',
          relevanceScore: 88,
          organizationalFit: 'Leverages existing customer data infrastructure'
        }
      ];
      
      setAiRecommendations(recommendations);
      setIsAnalyzing(false);
    }, 2000);
  };

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

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              Pipeline Creation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build data pipelines 10x faster with AI-powered patterns
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/build/patterns')}
            >
              <Layers className="h-4 w-4 mr-2" />
              Browse Patterns
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Start Fresh
            </Button>
          </div>
        </div>

        {/* AI-Powered Creation */}
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI-Powered Pipeline Creation
            </CardTitle>
            <CardDescription>
              Describe your data pipeline requirements and get intelligent pattern recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                placeholder="Example: I need to build a real-time pipeline that processes customer events from our web app, enriches them with profile data, and feeds them to our analytics dashboard for immediate insights..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="mt-2 min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={handleAIAnalysis}
              disabled={!projectDescription.trim() || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Requirements...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Get AI Recommendations
                </>
              )}
            </Button>

            {/* AI Recommendations */}
            {showAIAssistant && (
              <div className="border rounded-lg p-4 bg-muted/50 dark:bg-card">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Recommended Patterns
                </h4>
                
                {isAnalyzing ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Analyzing your requirements against organizational patterns...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiRecommendations.map((rec, index) => (
                      <div key={rec.pattern.id} className="border rounded-lg p-3 bg-background/50 dark:bg-muted/30 hover:bg-accent/10 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {rec.relevanceScore}% match
                            </Badge>
                            <span className="text-sm font-medium">{rec.pattern.name}</span>
                          </div>
                          <Button size="sm" variant="outline">
                            Use Pattern
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {rec.reasoning}
                        </p>
                        <p className="text-xs text-primary">
                          {rec.organizationalFit}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions and Recent Projects */}
        <div className="grid grid-cols-3 gap-6">
          {/* Pattern Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Browse by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="flex items-center gap-2">
                    {getCategoryIcon(category.id)}
                    {category.label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentProjects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.lastModified}</p>
                  </div>
                  <Badge 
                    variant={project.status === 'active' ? 'default' : 
                             project.status === 'testing' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {project.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2">
                View All Projects
              </Button>
            </CardContent>
          </Card>

          {/* Quick Start Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Database to Warehouse
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                File Processing
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                ML Training Pipeline
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pattern Library */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Available Patterns
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search patterns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {filteredPatterns.map(pattern => (
                <Card key={pattern.id} className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(pattern.category)}
                        <CardTitle className="text-sm">{pattern.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={cn("text-xs px-2", getDifficultyColor(pattern.difficulty))}>
                          {pattern.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {pattern.confidence}% fit
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {pattern.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pattern.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Used {pattern.usageCount} times
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
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

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {pattern.sourceType} → {pattern.targetType}
                      </div>
                      <Button size="sm" variant="outline">
                        Use Pattern
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}