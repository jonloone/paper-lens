'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Send,
  Loader2,
  Sparkles,
  Zap,
  Copy,
  CheckCircle,
  AlertTriangle,
  Code,
  MessageSquare,
  RotateCcw,
  Settings
} from 'lucide-react';
import { VultrLLMService } from '@/lib/services/vultr-llm.service';

interface AIAssistantPanelProps {
  currentQuery: string;
  catalog: string;
  schema: string;
  onQueryInsert: (query: string) => void;
  onQueryReplace: (query: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    reasoning?: string;
    queryType?: 'generation' | 'optimization' | 'explanation';
  };
}

interface SQLSuggestion {
  sql: string;
  confidence: number;
  reasoning: string;
  type: 'generation' | 'optimization' | 'explanation';
}

export function AIAssistantPanel({
  currentQuery,
  catalog,
  schema,
  onQueryInsert,
  onQueryReplace
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'system',
      content: 'AI SQL Assistant ready! Ask me to generate queries, optimize existing ones, or explain SQL concepts.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [llmService] = useState(() => new VultrLLMService());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const generateSQL = async (prompt: string) => {
    setIsLoading(true);
    
    try {
      const systemPrompt = `You are an expert SQL assistant specialized in Trino/Presto. Generate SQL queries based on natural language requests.

Context:
- Catalog: ${catalog}
- Schema: ${schema}
- Current query in editor: ${currentQuery || 'None'}

Instructions:
1. Generate syntactically correct SQL for Trino/Presto
2. Use the provided catalog.schema format
3. Make queries efficient and readable
4. If modifying existing query, preserve its intent
5. Provide confidence score (0.0-1.0) and reasoning

Respond with JSON in this exact format:
{
  "sql": "SELECT ...",
  "confidence": 0.85,
  "reasoning": "Generated this query because...",
  "type": "generation"
}`;

      const response = await llmService.analyze({
        systemPrompt,
        userPrompt: prompt,
        temperature: 0.3,
        maxTokens: 1500,
        responseFormat: 'json'
      });

      const suggestion: SQLSuggestion = JSON.parse(response);
      
      addMessage({
        type: 'assistant',
        content: suggestion.sql,
        metadata: {
          confidence: suggestion.confidence,
          reasoning: suggestion.reasoning,
          queryType: suggestion.type
        }
      });

    } catch (error) {
      console.error('SQL generation failed:', error);
      addMessage({
        type: 'assistant',
        content: 'Sorry, I encountered an error generating SQL. Please try rephrasing your request or check your connection.',
        metadata: { confidence: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeQuery = async () => {
    if (!currentQuery.trim()) {
      addMessage({
        type: 'assistant',
        content: 'No query to optimize. Please write a SQL query in the editor first.',
        metadata: { confidence: 0 }
      });
      return;
    }

    setIsLoading(true);

    try {
      const systemPrompt = `You are an expert SQL performance optimizer. Analyze the given query and suggest optimizations.

Context:
- Catalog: ${catalog}
- Schema: ${schema}
- Target: Trino/Presto engine

Instructions:
1. Analyze query performance bottlenecks
2. Suggest specific optimizations (indexing, join order, filtering, etc.)
3. Provide optimized SQL if improvements are possible
4. Maintain query correctness and business logic
5. Explain the performance benefits

Respond with JSON in this exact format:
{
  "sql": "OPTIMIZED SELECT ...",
  "confidence": 0.80,
  "reasoning": "Applied these optimizations: ...",
  "type": "optimization"
}`;

      const response = await llmService.analyze({
        systemPrompt,
        userPrompt: `Optimize this SQL query:\n\n${currentQuery}`,
        temperature: 0.2,
        maxTokens: 2000,
        responseFormat: 'json'
      });

      const suggestion: SQLSuggestion = JSON.parse(response);
      
      addMessage({
        type: 'assistant',
        content: suggestion.sql,
        metadata: {
          confidence: suggestion.confidence,
          reasoning: suggestion.reasoning,
          queryType: suggestion.type
        }
      });

    } catch (error) {
      console.error('Query optimization failed:', error);
      addMessage({
        type: 'assistant',
        content: 'Sorry, I encountered an error optimizing your query. Please try again or check the query syntax.',
        metadata: { confidence: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const explainQuery = async () => {
    if (!currentQuery.trim()) {
      addMessage({
        type: 'assistant',
        content: 'No query to explain. Please write a SQL query in the editor first.',
        metadata: { confidence: 0 }
      });
      return;
    }

    setIsLoading(true);

    try {
      const systemPrompt = `You are an expert SQL teacher. Explain SQL queries in a clear, educational manner.

Instructions:
1. Break down the query step by step
2. Explain what each clause does
3. Identify any advanced concepts or patterns
4. Point out potential performance considerations
5. Use clear, non-technical language when possible

Respond with JSON in this exact format:
{
  "sql": "${currentQuery}",
  "confidence": 1.0,
  "reasoning": "Detailed explanation of the query...",
  "type": "explanation"
}`;

      const response = await llmService.analyze({
        systemPrompt,
        userPrompt: `Explain this SQL query:\n\n${currentQuery}`,
        temperature: 0.1,
        maxTokens: 1500,
        responseFormat: 'json'
      });

      const explanation: SQLSuggestion = JSON.parse(response);
      
      addMessage({
        type: 'assistant',
        content: explanation.reasoning,
        metadata: {
          confidence: explanation.confidence,
          reasoning: explanation.reasoning,
          queryType: explanation.type
        }
      });

    } catch (error) {
      console.error('Query explanation failed:', error);
      addMessage({
        type: 'assistant',
        content: 'Sorry, I encountered an error explaining your query. Please try again.',
        metadata: { confidence: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addMessage({
      type: 'user',
      content: userMessage
    });

    await generateSQL(userMessage);
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        type: 'system',
        content: 'AI SQL Assistant ready! Ask me to generate queries, optimize existing ones, or explain SQL concepts.',
        timestamp: new Date()
      }
    ]);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: string, queryType?: string) => {
    if (type === 'user') return <MessageSquare className="h-4 w-4" />;
    if (type === 'system') return <Settings className="h-4 w-4" />;
    
    switch (queryType) {
      case 'generation': return <Sparkles className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      case 'explanation': return <Brain className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (confidence === undefined) return null;
    
    const percentage = Math.round(confidence * 100);
    const variant = confidence >= 0.8 ? 'default' : confidence >= 0.6 ? 'secondary' : 'destructive';
    
    return (
      <Badge variant={variant} className="text-xs">
        {percentage}% confident
      </Badge>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle className="text-base">AI Assistant</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Generate, optimize, and explain SQL queries
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={optimizeQuery}
            disabled={isLoading || !currentQuery.trim()}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Optimize
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={explainQuery}
            disabled={isLoading || !currentQuery.trim()}
            className="text-xs"
          >
            <Brain className="h-3 w-3 mr-1" />
            Explain
          </Button>
        </div>

        <Separator />

        {/* Chat Messages */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type !== 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    {getMessageIcon(message.type, message.metadata?.queryType)}
                  </div>
                )}
                
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.type === 'system'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {message.type === 'assistant' && message.metadata?.queryType !== 'explanation' ? (
                      <div className="space-y-2">
                        <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {message.content}
                        </pre>
                        
                        {message.metadata?.reasoning && (
                          <div className="text-xs text-gray-600 italic">
                            {message.metadata.reasoning}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex gap-1">
                            {getConfidenceBadge(message.metadata?.confidence)}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="h-6 px-2"
                            >
                              {copiedId === message.id ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            
                            {message.metadata?.queryType !== 'explanation' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onQueryInsert(message.content)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Insert
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onQueryReplace(message.content)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Replace
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {message.content}
                        {message.metadata?.confidence !== undefined && (
                          <div className="flex justify-end mt-2">
                            {getConfidenceBadge(message.metadata.confidence)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1 px-1">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Thinking...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to generate SQL..."
            disabled={isLoading}
            className="flex-1 text-sm"
            maxLength={500}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Context Info */}
        <Alert className="p-2">
          <AlertDescription className="text-xs">
            Context: {catalog}.{schema}
            {currentQuery && (
              <span className="block mt-1 text-gray-500">
                Current query: {currentQuery.length} characters
              </span>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}