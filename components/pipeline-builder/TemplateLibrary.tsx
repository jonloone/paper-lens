'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Clock, 
  Users, 
  Star, 
  ArrowRight,
  Zap,
  Database,
  BarChart,
  Shield,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Filter
} from 'lucide-react';
import { PipelineTemplate } from '@/lib/templates/pipeline-templates/types';

interface TemplateLibraryProps {
  templates: PipelineTemplate[];
  onSelectTemplate: (template: PipelineTemplate) => void;
  showQuickActions?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  etl: Database,
  streaming: Zap,
  batch: Clock,
  quality: Shield,
  reconciliation: RefreshCw,
  ml: Sparkles,
  custom: Filter
};

export default function TemplateLibrary({ 
  templates, 
  onSelectTemplate,
  showQuickActions = true 
}: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'recent' | 'name'>('popularity');
  
  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'recent':
          return (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [templates, searchQuery, selectedCategory, sortBy]);
  
  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [templates]);
  
  // Get popular templates
  const popularTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  }, [templates]);
  
  const formatTimeAgo = (date?: Date): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };
  
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">5 min</div>
                  <div className="text-sm text-muted-foreground">From Template</div>
                </div>
                <Database className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">10 min</div>
                  <div className="text-sm text-muted-foreground">From Description</div>
                </div>
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">Custom</div>
                  <div className="text-sm text-muted-foreground">Full Control</div>
                </div>
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="popularity">Most Popular</option>
          <option value="recent">Recently Used</option>
          <option value="name">Name</option>
        </select>
      </div>
      
      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-8 w-full">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat === 'all' ? 'All' : cat}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={selectedCategory} className="mt-4">
          {/* Popular Templates Banner */}
          {selectedCategory === 'all' && popularTemplates.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {popularTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => onSelectTemplate(template)}
                      className="text-left p-3 bg-background rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{template.icon}</span>
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Used {template.usageCount} times
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Template Grid */}
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map(template => {
              const Icon = categoryIcons[template.category] || Database;
              
              return (
                <Card 
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                  onClick={() => onSelectTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {template.estimatedBuildTime}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{template.usageCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{template.popularity}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(template.lastUsed)}</span>
                      </div>
                    </div>
                    
                    {/* Generates */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Generates:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.generates.airflowDag && (
                          <Badge variant="outline" className="text-xs">Airflow</Badge>
                        )}
                        {template.generates.sqlQueries && (
                          <Badge variant="outline" className="text-xs">SQL</Badge>
                        )}
                        {template.generates.sparkJob && (
                          <Badge variant="outline" className="text-xs">Spark</Badge>
                        )}
                        {template.generates.nifiFlow && (
                          <Badge variant="outline" className="text-xs">NiFi</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Action */}
                    <Button className="w-full mt-3" size="sm">
                      Use Template
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <Card className="p-8">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">No templates found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}