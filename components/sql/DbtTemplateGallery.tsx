'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sparkles,
  Code,
  Package,
  FileText,
  CheckCircle,
  ArrowRight,
  Loader2,
  Layers,
  Zap,
  Shield,
} from 'lucide-react';
import {
  recommendDbtTemplates,
  type DbtTemplate,
  type DbtTemplateRecommendation,
} from '@/lib/services/dbt-template-service';

export interface DbtTemplateGalleryProps {
  context: {
    productDefinition?: {
      name?: string;
      description?: string;
      domain?: string;
    };
    selectedTables: Array<{
      name: string;
      columns: Array<{ name: string; type: string }>;
    }>;
  };
  onSelectTemplate: (template: DbtTemplate) => void;
}

const categoryIcons = {
  staging: Layers,
  intermediate: Code,
  mart: Package,
  snapshot: FileText,
  metric: Zap,
  quality: Shield,
};

const categoryColors = {
  staging: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  intermediate: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  mart: 'bg-green-500/10 text-green-600 border-green-500/20',
  snapshot: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  metric: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  quality: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function DbtTemplateGallery({ context, onSelectTemplate }: DbtTemplateGalleryProps) {
  const [recommendations, setRecommendations] = useState<DbtTemplateRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [context.productDefinition, context.selectedTables]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const recs = await recommendDbtTemplates(context);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load dbt template recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertTemplate = (template: DbtTemplate) => {
    onSelectTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dbt template recommendations...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <Package className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-semibold">No Recommendations Yet</h3>
          <p className="text-xs text-muted-foreground">
            Select some tables and add a product description to get personalized dbt template recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Recommended dbt Templates
          </h2>
          <p className="text-sm text-muted-foreground">
            Production-ready dbt models based on your product definition and data sources
          </p>
        </div>

        {/* Template Cards */}
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const template = rec.template;
            const CategoryIcon = categoryIcons[template.category];
            const isExpanded = expandedTemplate === template.id;

            return (
              <Card
                key={template.id}
                className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                        {rec.relevanceScore > 0.7 && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Sparkles className="w-3 h-3" />
                            Highly Relevant
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </div>
                  </div>

                  {/* Metadata Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${categoryColors[template.category]}`}>
                      {template.category}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${difficultyColors[template.difficulty]}`}>
                      {template.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.config.materialized}
                    </Badge>
                    {rec.relevanceScore > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(rec.relevanceScore * 100)}% match
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-3 border-t">
                    {/* Reasoning */}
                    {rec.reasoning && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <strong>Why this template?</strong> {rec.reasoning}
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="text-xs space-y-1">
                      <strong className="text-foreground">How it works:</strong>
                      <p className="text-muted-foreground">{template.explanation}</p>
                    </div>

                    {/* Use Cases */}
                    {template.useCases.length > 0 && (
                      <div className="text-xs space-y-1">
                        <strong className="text-foreground">Common use cases:</strong>
                        <ul className="text-muted-foreground list-disc list-inside">
                          {template.useCases.map((useCase, idx) => (
                            <li key={idx}>{useCase}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Best Practices */}
                    {template.bestPractices && template.bestPractices.length > 0 && (
                      <div className="text-xs space-y-1">
                        <strong className="text-foreground flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Best practices:
                        </strong>
                        <ul className="text-muted-foreground list-disc list-inside space-y-0.5">
                          {template.bestPractices.map((practice, idx) => (
                            <li key={idx}>{practice}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* dbt Files Preview */}
                    <div className="space-y-2">
                      <strong className="text-xs text-foreground">dbt Files Preview:</strong>
                      <Tabs defaultValue="model" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="model" className="text-xs">
                            <Code className="w-3 h-3 mr-1" />
                            Model SQL
                          </TabsTrigger>
                          <TabsTrigger value="schema" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Schema
                          </TabsTrigger>
                          {template.sourcesYml && (
                            <TabsTrigger value="sources" className="text-xs">
                              <Layers className="w-3 h-3 mr-1" />
                              Sources
                            </TabsTrigger>
                          )}
                        </TabsList>
                        <TabsContent value="model" className="mt-2">
                          <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto font-mono text-muted-foreground max-h-[300px] overflow-y-auto">
                            {template.modelSql}
                          </pre>
                        </TabsContent>
                        <TabsContent value="schema" className="mt-2">
                          <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto font-mono text-muted-foreground max-h-[300px] overflow-y-auto">
                            {template.schemaYml}
                          </pre>
                        </TabsContent>
                        {template.sourcesYml && (
                          <TabsContent value="sources" className="mt-2">
                            <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto font-mono text-muted-foreground max-h-[300px] overflow-y-auto">
                              {template.sourcesYml}
                            </pre>
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>

                    {/* Config Summary */}
                    <div className="text-xs space-y-1 bg-muted/30 p-3 rounded-lg">
                      <strong className="text-foreground">Configuration:</strong>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div>
                          <span className="font-semibold">Materialization:</span> {template.config.materialized}
                        </div>
                        {template.config.schema && (
                          <div>
                            <span className="font-semibold">Schema:</span> {template.config.schema}
                          </div>
                        )}
                        {template.config.tags && template.config.tags.length > 0 && (
                          <div className="col-span-2">
                            <span className="font-semibold">Tags:</span> {template.config.tags.join(', ')}
                          </div>
                        )}
                        {template.config.unique_key && (
                          <div>
                            <span className="font-semibold">Unique Key:</span> {template.config.unique_key}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Insert Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertTemplate(template);
                      }}
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Package className="w-4 h-4" />
                      Insert dbt Model
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
