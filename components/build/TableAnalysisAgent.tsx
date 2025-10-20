'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Package,
  Loader2,
  Send,
  BarChart3,
  Database,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types matching backend models
interface UsageInsight {
  insight_type: string;
  summary: string;
  details: string;
  confidence: number;
  source: string;
}

interface QualityInsight {
  severity: 'error' | 'warning' | 'info';
  column: string | null;
  issue: string;
  recommendation: string;
  affected_rows: number | null;
}

interface SemanticRelationship {
  table1: string;
  table2: string;
  relationship_type: string;
  confidence: number;
  join_keys: string[];
  explanation: string;
}

interface TransformationSuggestion {
  pattern_name: string;
  description: string;
  reasoning: string;
  dbt_template_id: string;
  complexity: string;
  priority: string;
}

interface TableAnalysisData {
  analysis_id: string;
  generated_at: string;
  summary: string;
  key_findings: string[];
  overall_recommendation: string;
  usage_insights: UsageInsight[];
  quality_insights: QualityInsight[];
  semantic_relationships: SemanticRelationship[];
  transformation_suggestions: TransformationSuggestion[];
  tables_analyzed: number;
  analysis_confidence: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TableAnalysisAgentProps {
  selectedTables: Array<{
    name: string;
    schema: string;
    catalog: string;
    columns: Array<{ name: string; type: string }>;
  }>;
  productDefinition?: {
    name?: string;
    description?: string;
    domain?: string;
  };
  userDepartment?: string;
  onAnalysisComplete?: (analysis: TableAnalysisData) => void;
}

export function TableAnalysisAgent({
  selectedTables,
  productDefinition,
  userDepartment,
  onAnalysisComplete,
}: TableAnalysisAgentProps) {
  const [analysis, setAnalysis] = useState<TableAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-trigger analysis when tables change
  useEffect(() => {
    if (selectedTables.length > 0) {
      handleAnalyze();
    }
  }, [selectedTables.length]);

  const handleAnalyze = async () => {
    if (selectedTables.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/table-analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tables: selectedTables.map(t => ({
            name: t.name,
            schema: t.schema,
            catalog: t.catalog,
            columns: t.columns,
          })),
          product_definition: productDefinition,
          user_department: userDepartment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze tables');
      }

      const data = await response.json();
      setAnalysis(data);

      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }

      // Add initial AI message
      setChatMessages([{
        role: 'assistant',
        content: `I've analyzed your ${selectedTables.length} selected table(s). ${data.summary} Feel free to ask me any questions about the analysis!`,
      }]);
    } catch (err) {
      console.error('Error analyzing tables:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze tables');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !analysis) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);

    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // TODO: Implement actual chat endpoint
      // For now, simulate AI response based on context
      const aiResponse = generateContextualResponse(userMessage, analysis);

      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: aiResponse },
      ]);
    } catch (err) {
      console.error('Error sending chat:', err);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error processing your question.' },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  if (selectedTables.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <Database className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-semibold">No Tables Selected</h3>
          <p className="text-xs text-muted-foreground">
            Select tables in Step 2 to see AI-powered analysis of usage patterns, data quality,
            relationships, and transformation suggestions.
          </p>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <h3 className="text-sm font-semibold">Analyzing Tables...</h3>
          <p className="text-xs text-muted-foreground">
            Examining usage patterns, quality metrics, and semantic relationships
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h3 className="text-sm font-semibold">Analysis Failed</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button size="sm" onClick={handleAnalyze}>
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Button onClick={handleAnalyze} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Analyze Tables with AI
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Analysis Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* AI Summary Card */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">AI Analysis Summary</CardTitle>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {Math.round(analysis.analysis_confidence * 100)}% confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>

              {analysis.key_findings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Key Findings:</p>
                  <ul className="space-y-1">
                    {analysis.key_findings.map((finding, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold mb-1">Recommendation:</p>
                <p className="text-xs text-muted-foreground">{analysis.overall_recommendation}</p>
              </div>
            </CardContent>
          </Card>

          {/* Usage Insights */}
          {analysis.usage_insights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <CardTitle className="text-sm">Usage Patterns</CardTitle>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {analysis.usage_insights.length} insight{analysis.usage_insights.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.usage_insights.map((insight, idx) => (
                  <div key={idx} className="space-y-1 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold">{insight.summary}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {Math.round(insight.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.details}</p>
                    <p className="text-[10px] text-muted-foreground italic">Source: {insight.source}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quality Insights */}
          {analysis.quality_insights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  <CardTitle className="text-sm">Data Quality</CardTitle>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {analysis.quality_insights.length} finding{analysis.quality_insights.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.quality_insights.map((insight, idx) => {
                  const Icon = insight.severity === 'error' ? AlertTriangle :
                               insight.severity === 'warning' ? AlertCircle : Info;
                  const colorClass = insight.severity === 'error' ? 'text-red-500' :
                                   insight.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500';

                  return (
                    <div key={idx} className="space-y-1 pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-start gap-2">
                        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', colorClass)} />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold">{insight.issue}</p>
                            {insight.column && (
                              <Badge variant="outline" className="text-[10px]">
                                {insight.column}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{insight.recommendation}</p>
                          {insight.affected_rows && (
                            <p className="text-[10px] text-muted-foreground">
                              Affects {insight.affected_rows.toLocaleString()} row(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Semantic Relationships */}
          {analysis.semantic_relationships.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-purple-500" />
                  <CardTitle className="text-sm">Table Relationships</CardTitle>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {analysis.semantic_relationships.length} relationship{analysis.semantic_relationships.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.semantic_relationships.map((rel, idx) => (
                  <div key={idx} className="space-y-1 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {rel.table1}
                      </Badge>
                      <span className="text-xs text-muted-foreground">↔</span>
                      <Badge variant="outline" className="text-[10px]">
                        {rel.table2}
                      </Badge>
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        {Math.round(rel.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold">{rel.relationship_type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">{rel.explanation}</p>
                    {rel.join_keys.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">Join keys:</span>
                        {rel.join_keys.map((key, kidx) => (
                          <Badge key={kidx} variant="outline" className="text-[10px]">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Transformation Suggestions */}
          {analysis.transformation_suggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <CardTitle className="text-sm">Suggested dbt Transformations</CardTitle>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {analysis.transformation_suggestions.length} suggestion{analysis.transformation_suggestions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.transformation_suggestions.map((suggestion, idx) => (
                  <div key={idx} className="space-y-1 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold">{suggestion.pattern_name}</p>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={suggestion.priority === 'high' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {suggestion.priority}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {suggestion.complexity}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                    <p className="text-[10px] text-muted-foreground italic">{suggestion.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Chat Interface */}
      <div className="border-t border-border bg-muted/30">
        {/* Chat Messages */}
        {chatMessages.length > 1 && (
          <ScrollArea className="h-48 p-4">
            <div className="space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex gap-2',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2 text-xs',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Chat Input */}
        <div className="p-4 flex items-center gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendChat();
              }
            }}
            placeholder="Ask questions about the analysis..."
            className="flex-1 text-xs"
            disabled={isSendingChat}
          />
          <Button
            size="sm"
            onClick={handleSendChat}
            disabled={!chatInput.trim() || isSendingChat}
            className="gap-2"
          >
            {isSendingChat ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate contextual responses
function generateContextualResponse(question: string, analysis: TableAnalysisData): string {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('quality') || lowerQuestion.includes('data quality')) {
    const qualityCount = analysis.quality_insights.length;
    const errors = analysis.quality_insights.filter(q => q.severity === 'error').length;
    return `I found ${qualityCount} quality-related findings. ${errors > 0 ? `There are ${errors} critical issues that should be addressed before production.` : 'Overall quality looks good!'} Would you like me to elaborate on any specific issue?`;
  }

  if (lowerQuestion.includes('usage') || lowerQuestion.includes('used')) {
    const usageCount = analysis.usage_insights.length;
    return `Based on historical usage patterns, I found ${usageCount} insights. ${usageCount > 0 ? analysis.usage_insights[0].summary : 'These tables have limited usage history.'} Let me know if you'd like more details.`;
  }

  if (lowerQuestion.includes('relationship') || lowerQuestion.includes('join')) {
    const relCount = analysis.semantic_relationships.length;
    if (relCount > 0) {
      const firstRel = analysis.semantic_relationships[0];
      return `I detected ${relCount} relationships between your tables. For example, ${firstRel.table1} and ${firstRel.table2} can be joined on ${firstRel.join_keys.join(', ')}. This suggests ${firstRel.explanation}`;
    }
    return 'I didn\'t detect any obvious relationships between the selected tables based on column names and patterns.';
  }

  if (lowerQuestion.includes('transformation') || lowerQuestion.includes('dbt')) {
    const suggCount = analysis.transformation_suggestions.length;
    const highPriority = analysis.transformation_suggestions.filter(s => s.priority === 'high');
    return `I suggest ${suggCount} dbt transformation patterns. ${highPriority.length > 0 ? `Start with high-priority patterns like "${highPriority[0].pattern_name}".` : ''} Would you like me to explain any specific pattern?`;
  }

  return `Great question! Based on my analysis of ${analysis.tables_analyzed} table(s), ${analysis.summary} Is there a specific aspect you'd like me to elaborate on?`;
}
