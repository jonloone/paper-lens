'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  User,
  Send,
  Loader2,
  Copy,
  Check,
  Code2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sql?: string;
  agents?: string[];
  confidence?: number;
}

interface TiSQLAIChatTabProps {
  onInsertSQL: (sql: string) => void;
  currentSQL?: string;
  selectedText?: string;
  catalog: string;
  schema: string;
  environment: string;
}

export function TiSQLAIChatTab({
  onInsertSQL,
  currentSQL = '',
  selectedText = '',
  catalog,
  schema,
  environment
}: TiSQLAIChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context
      const context = selectedText || currentSQL;
      const dbContext = `${catalog}.${schema}`;

      const response = await fetch('/api/tisql-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input,
          refContent: context ? `-- Context:\n${context}` : `-- Current database: ${dbContext}`,
          databases: [schema],
          catalog: catalog,
          environment: environment
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || 'No response generated',
        timestamp: new Date(),
        sql: data.message.includes('SELECT') || data.message.includes('FROM') ? data.message : undefined,
        agents: data.extra?.agents || ['SQL Generation Agent'],
        confidence: data.extra?.confidence || 0.9
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate SQL'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const extractSQL = (content: string): string | null => {
    // Extract SQL from code blocks or detect SQL statements
    const codeBlockMatch = content.match(/```sql\n([\s\S]*?)\n```/);
    if (codeBlockMatch) return codeBlockMatch[1];

    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    if (sqlKeywords.some(keyword => content.toUpperCase().includes(keyword))) {
      return content;
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">SQL Agent</h3>
            <p className="text-xs text-muted-foreground">
              {catalog}.{schema} • {environment}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Ask me to generate SQL queries</p>
              <p className="text-xs mt-1">I'll help you write, optimize, and explain SQL</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "rounded-lg p-3 max-w-[85%]",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.role === 'assistant' && message.agents && (
                  <div className="flex gap-1 mb-2">
                    {message.agents.map((agent, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                )}

                {message.sql ? (
                  <div className="space-y-2">
                    <div className="text-sm mb-2">{message.content.split('```')[0]}</div>
                    <div className="relative rounded overflow-hidden">
                      <SyntaxHighlighter
                        language="sql"
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '12px',
                          fontSize: '12px',
                          maxHeight: '300px'
                        }}
                      >
                        {extractSQL(message.content) || message.sql}
                      </SyntaxHighlighter>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopy(extractSQL(message.content) || message.sql || '', message.id)}
                          className="h-7 text-xs"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onInsertSQL(extractSQL(message.content) || message.sql || '')}
                          className="h-7 text-xs"
                        >
                          <Code2 className="w-3 h-3 mr-1" />
                          Insert
                        </Button>
                      </div>
                    </div>
                    {message.confidence && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Confidence: {(message.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}

                <p className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        {selectedText && (
          <div className="mb-2 p-2 bg-muted/50 rounded text-xs">
            <span className="text-muted-foreground">Context: </span>
            <span className="font-mono">{selectedText.substring(0, 50)}...</span>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask to generate, optimize, or explain SQL..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
