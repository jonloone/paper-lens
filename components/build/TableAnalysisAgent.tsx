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
import { SuggestionChips } from '@/components/ui/suggestion-chips';

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
  conversational_message: string;
  follow_up_suggestions: string[];
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
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

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
      // Use relative URL to go through nginx proxy (no port needed)
      const backendUrl = typeof window !== 'undefined'
        ? `/api/table-analysis/analyze`
        : 'http://localhost:8000/api/table-analysis/analyze';

      const response = await fetch(backendUrl, {
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

      // Auto-send the conversational AI message
      setChatMessages([{
        role: 'assistant',
        content: data.conversational_message || `I've analyzed your ${selectedTables.length} selected table(s). ${data.summary} Feel free to ask me any questions about the analysis!`,
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

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
    // Optionally auto-send
    // handleSendChat();
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
    <div className="h-full flex gap-4">
      {/* Left Column: Chat Interface (60%) */}
      <div className={cn(
        "flex flex-col transition-all",
        isRightPanelCollapsed ? "flex-1" : "w-[60%]"
      )}>
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted prose prose-sm dark:prose-invert max-w-none'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Suggestion Chips after first AI message */}
            {chatMessages.length === 1 && analysis?.follow_up_suggestions && (
              <div className="flex justify-start pl-11">
                <div className="max-w-[85%]">
                  <SuggestionChips
                    suggestions={analysis.follow_up_suggestions}
                    onSuggestionClick={handleSuggestionClick}
                    disabled={isSendingChat}
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="border-t border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
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
              className="flex-1 text-sm"
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

      {/* Right Column: Structured Analysis Cards (40%) */}
      {!isRightPanelCollapsed && (
        <div className="w-[40%] border-l border-border">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Analysis Confidence Badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground">ANALYSIS DETAILS</h3>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(analysis.analysis_confidence * 100)}% confidence
                </Badge>
              </div>

              {/* Usage Insights */}
              {analysis.usage_insights.length > 0 && (
                <Card className="border-blue-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <CardTitle className="text-xs">Usage Patterns</CardTitle>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {analysis.usage_insights.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysis.usage_insights.slice(0, 3).map((insight, idx) => (
                      <div key={idx} className="space-y-1 pb-2 border-b border-border last:border-0 last:pb-0">
                        <p className="text-xs font-medium">{insight.summary}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{insight.details}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Quality Insights */}
              {analysis.quality_insights.length > 0 && (
                <Card className="border-green-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-500" />
                      <CardTitle className="text-xs">Data Quality</CardTitle>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {analysis.quality_insights.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.quality_insights.slice(0, 3).map((insight, idx) => {
                      const Icon = insight.severity === 'error' ? AlertTriangle :
                                   insight.severity === 'warning' ? AlertCircle : Info;
                      const colorClass = insight.severity === 'error' ? 'text-red-500' :
                                       insight.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500';

                      return (
                        <div key={idx} className="flex items-start gap-2 pb-2 border-b border-border last:border-0 last:pb-0">
                          <Icon className={cn('w-3 h-3 mt-0.5 flex-shrink-0', colorClass)} />
                          <div className="flex-1 space-y-0.5">
                            <p className="text-xs font-medium">{insight.issue}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{insight.recommendation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Semantic Relationships */}
              {analysis.semantic_relationships.length > 0 && (
                <Card className="border-purple-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-purple-500" />
                      <CardTitle className="text-xs">Relationships</CardTitle>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {analysis.semantic_relationships.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.semantic_relationships.slice(0, 3).map((rel, idx) => (
                      <div key={idx} className="space-y-1 pb-2 border-b border-border last:border-0 last:pb-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono">{rel.table1}</span>
                          <span className="text-[10px] text-muted-foreground">↔</span>
                          <span className="text-[10px] font-mono">{rel.table2}</span>
                        </div>
                        <p className="text-xs font-medium">{rel.relationship_type.replace('_', ' ')}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{rel.explanation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Transformation Suggestions */}
              {analysis.transformation_suggestions.length > 0 && (
                <Card className="border-orange-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-500" />
                      <CardTitle className="text-xs">dbt Patterns</CardTitle>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {analysis.transformation_suggestions.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.transformation_suggestions.slice(0, 3).map((suggestion, idx) => (
                      <div key={idx} className="space-y-1 pb-2 border-b border-border last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium">{suggestion.pattern_name}</p>
                          <Badge
                            variant={suggestion.priority === 'high' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{suggestion.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
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
