'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  TrendingUp,
  FileText,
  CheckCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  recommendTemplates,
  type SQLTemplate,
  type TemplateRecommendation,
} from '@/lib/services/sql-template-service';

export interface TemplateGalleryProps {
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
  onSelectTemplate: (sql: string) => void;
}

const categoryIcons = {
  aggregation: TrendingUp,
  join: FileText,
  window: Code,
  cte: Code,
  transformation: Sparkles,
  quality: CheckCircle,
};

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-600 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function TemplateGallery({ context, onSelectTemplate }: TemplateGalleryProps) {
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [context.productDefinition, context.selectedTables]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const recs = await recommendTemplates(context);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load template recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertTemplate = (template: SQLTemplate) => {
    onSelectTemplate(template.sql);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading template recommendations...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-semibold">No Recommendations Yet</h3>
          <p className="text-xs text-muted-foreground">
            Select some tables and add a product description to get personalized SQL template recommendations.
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
          <h2 className="text-lg font-semibold">Recommended Templates</h2>
          <p className="text-sm text-muted-foreground">
            Intelligent SQL templates based on your product definition and selected data sources
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
                      <div className="flex items-center gap-2">
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
                    <Badge variant="outline" className={`text-xs ${difficultyColors[template.difficulty]}`}>
                      {template.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
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

                    {/* SQL Preview */}
                    <div className="space-y-1">
                      <strong className="text-xs text-foreground">SQL Preview:</strong>
                      <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto font-mono text-muted-foreground max-h-[200px] overflow-y-auto">
                        {template.sql}
                      </pre>
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
                      Insert into Editor
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
