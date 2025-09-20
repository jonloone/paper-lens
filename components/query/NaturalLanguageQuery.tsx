'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Play, 
  X, 
  ChevronRight, 
  Check, 
  Calendar,
  Users,
  Filter,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { dataHubService } from '@/lib/services/DataHubContextService';
import { intentAnalyzer } from '@/lib/services/IntentAnalysisService';
import type { AppliedEnhancement, QueryClarification } from '@/lib/services/IntentAnalysisService';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface NaturalLanguageQueryProps {
  onQueryChange: (query: string) => void;
  onSQLGenerated: (sql: string) => void;
  onExecute: (sql: string) => void;
  initialQuery?: string;
}

export const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({
  onQueryChange,
  onSQLGenerated,
  onExecute,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedEnhancements, setAppliedEnhancements] = useState<AppliedEnhancement[]>([]);
  const [clarifications, setClarifications] = useState<QueryClarification[]>([]);
  const [showAssistant, setShowAssistant] = useState(true);
  const [intentDetected, setIntentDetected] = useState<string>('');

  // Generate SQL from natural language with intent analysis
  const generateSQL = async () => {
    if (!query.trim()) return;
    
    setIsGenerating(true);
    
    // Analyze intent and generate SQL
    setTimeout(async () => {
      const intent = intentAnalyzer.analyzeIntent(query);
      setIntentDetected(intent.type);
      
      const baseSQL = convertNaturalLanguageToSQL(query);
      
      // Apply automatic enhancements based on intent
      const { sql: enhancedSQL, enhancements, clarifications } = await applyIntentBasedEnhancements(baseSQL, intent, query);
      
      setGeneratedSQL(enhancedSQL);
      setAppliedEnhancements(enhancements);
      setClarifications(clarifications);
      onSQLGenerated(enhancedSQL);
      setIsGenerating(false);
    }, 500);
  };

  // Simple mock converter for demo - returns base SQL without enhancements
  const convertNaturalLanguageToSQL = (naturalLanguage: string): string => {
    const lower = naturalLanguage.toLowerCase();
    
    if (lower.includes('churn') || (lower.includes('customer') && lower.includes('risk'))) {
      return `SELECT 
  customer_id,
  customer_name,
  email,
  last_purchase_date,
  order_count,
  total_revenue
FROM customers.master_table`;
    }
    
    if (lower.includes('customers') && lower.includes('90 days')) {
      return `SELECT 
  customer_id,
  customer_name,
  email,
  last_purchase_date
FROM customers.master_table`;
    }
    
    if (lower.includes('top') && lower.includes('revenue')) {
      return `SELECT 
  product_name,
  revenue,
  order_id
FROM sales.transactions`;
    }
    
    // Default
    return `SELECT * FROM ${lower.includes('customer') ? 'customers' : 'sales'}.master_table`;
  };

  // Apply enhancements based on intent
  const applyIntentBasedEnhancements = async (baseSQL: string, intent: any, query: string) => {
    const enhancements: AppliedEnhancement[] = [];
    const clarifications: QueryClarification[] = [];
    let sql = baseSQL;
    
    // Extract table for context
    const tableMatch = sql.match(/from\s+(\w+\.\w+|\w+)/i);
    if (!tableMatch) return { sql, enhancements, clarifications };
    
    const [schema, table] = tableMatch[1].includes('.') 
      ? tableMatch[1].split('.')
      : ['public', tableMatch[1]];
    
    const context = await dataHubService.getTableContext(schema, table);
    
    // Apply intent-based enhancements
    const intentEnhancements = intentAnalyzer.getEnhancementsForIntent(intent, context);
    
    // Apply each enhancement and track it
    intentEnhancements.forEach(enh => {
      sql = intentAnalyzer.applyEnhancement(sql, enh);
      enhancements.push(enh);
    });
    
    // Get clarification questions
    const intentClarifications = intentAnalyzer.getClarificationsForIntent(intent, query);
    clarifications.push(...intentClarifications);
    
    return { sql, enhancements, clarifications };
  };

  // Remove an enhancement
  const removeEnhancement = (enhancement: AppliedEnhancement) => {
    if (!enhancement.removable) return;
    
    // Remove from SQL
    const updatedSQL = intentAnalyzer.removeEnhancement(generatedSQL, enhancement);
    setGeneratedSQL(updatedSQL);
    onSQLGenerated(updatedSQL);
    
    // Remove from applied list
    setAppliedEnhancements(appliedEnhancements.filter(e => e.id !== enhancement.id));
  };
  
  // Apply clarification
  const applyClarification = (clarification: QueryClarification, answer: any) => {
    const updatedSQL = intentAnalyzer.applyClarification(generatedSQL, clarification, answer);
    setGeneratedSQL(updatedSQL);
    onSQLGenerated(updatedSQL);
    
    // Add as applied enhancement
    const enhancement: AppliedEnhancement = {
      id: `clarification-${Date.now()}`,
      type: 'clarification',
      title: clarification.question,
      explanation: `Applied: ${answer.label || answer}`,
      sqlComment: `-- ${clarification.question}: ${answer.label || answer}`,
      removable: true
    };
    setAppliedEnhancements([...appliedEnhancements, enhancement]);
    
    // Remove from clarifications
    setClarifications(clarifications.filter(c => c.id !== clarification.id));
  };

  // Handle query submission
  const handleSubmit = () => {
    if (query && !generatedSQL) {
      generateSQL();
    } else if (generatedSQL) {
      onExecute(generatedSQL);
    }
  };

  const getEnhancementIcon = (type: string) => {
    switch (type) {
      case 'privacy': return <AlertCircle className="h-3 w-3" />;
      case 'quality': return <Filter className="h-3 w-3" />;
      case 'metric': return <TrendingUp className="h-3 w-3" />;
      case 'governance': return <AlertCircle className="h-3 w-3" />;
      case 'filter': return <Filter className="h-3 w-3" />;
      case 'clarification': return <Check className="h-3 w-3" />;
      default: return <Check className="h-3 w-3" />;
    }
  };

  return (
    <div className="natural-language-query space-y-4">
      {/* Natural Language Input */}
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-border">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-2" />
            <div className="flex-1">
              <textarea
                className="w-full min-h-[80px] bg-transparent border-0 resize-none focus:outline-none text-sm"
                placeholder="What would you like to analyze? Be specific about your needs..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onQueryChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) {
                    handleSubmit();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!query.trim() || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : generatedSQL ? (
                <>
                  <Play className="h-4 w-4" />
                  Run Query
                </>
              ) : (
                <>Generate SQL</>
              )}
            </Button>
          </div>
          
          {/* Example queries for inspiration */}
          {!query && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {[
                "Customer churn risk analysis",
                "Top revenue generating products this month",
                "Show inactive customers from last 90 days"
              ].map((example, idx) => (
                <button
                  key={idx}
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setQuery(example);
                    onQueryChange(example);
                  }}
                >
                  "{example}"
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Generated SQL with transparent enhancements */}
      {generatedSQL && (
        <div className="grid grid-cols-3 gap-4">
          {/* SQL Editor - Shows exactly what's happening */}
          <div className="col-span-2">
            <Card className="p-0 overflow-hidden bg-background/50 backdrop-blur-sm border-border">
              <div className="border-b border-border px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Generated SQL</span>
                  {intentDetected && (
                    <Badge variant="outline" className="text-xs">
                      Intent: {intentDetected}
                    </Badge>
                  )}
                </div>
              </div>
              
              <MonacoEditor
                height="400px"
                language="sql"
                theme="vs-dark"
                value={generatedSQL}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  readOnly: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 }
                }}
                onChange={(value) => {
                  setGeneratedSQL(value || '');
                  onSQLGenerated(value || '');
                }}
              />
            </Card>
          </div>
          
          {/* Assistant Panel - Explains what was done and why */}
          <div className="col-span-1">
            <Card className="p-4 bg-background/50 backdrop-blur-sm border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Query Assistant</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAssistant(!showAssistant)}
                  className="h-6 w-6 p-0"
                >
                  {showAssistant ? <X className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              </div>
              
              {showAssistant && (
                <div className="space-y-4">
                  {/* Applied Enhancements */}
                  {appliedEnhancements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                        What I've done:
                      </h4>
                      <div className="space-y-2">
                        {appliedEnhancements.map((enhancement) => (
                          <div key={enhancement.id} className="p-2 bg-muted/30 rounded-md">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                {getEnhancementIcon(enhancement.type)}
                                <div className="flex-1">
                                  <div className="text-xs font-medium">
                                    {enhancement.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {enhancement.explanation}
                                  </div>
                                </div>
                              </div>
                              {enhancement.removable && (
                                <button
                                  onClick={() => removeEnhancement(enhancement)}
                                  className="p-0.5 hover:bg-destructive/20 rounded"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Clarification Questions */}
                  {clarifications.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                        Want to refine?
                      </h4>
                      <div className="space-y-2">
                        {clarifications.map((clarification) => (
                          <div key={clarification.id} className="p-2 bg-muted/30 rounded-md">
                            <p className="text-xs font-medium mb-2">{clarification.question}</p>
                            <div className="flex flex-wrap gap-1">
                              {clarification.options.map((option, idx) => (
                                <button
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-background hover:bg-primary/10 rounded border border-border"
                                  onClick={() => applyClarification(clarification, option)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Summary */}
                  {appliedEnhancements.length === 0 && clarifications.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center p-4">
                      Your query is ready to run. The SQL above shows exactly what will be executed.
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};