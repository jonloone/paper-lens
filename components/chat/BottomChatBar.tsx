'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal,
  Send, 
  Sparkles, 
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  X,
  MessageSquare,
  Bot,
  User,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: Date;
  agentRole?: string;
  quickActions?: Array<{
    label: string;
    action: string;
  }>;
}

interface BottomChatBarProps {
  className?: string;
  hasPendingInsight?: boolean;
  contextData?: {
    selectedTables?: string[];
    currentStep?: string;
    productIntent?: string;
  };
  onInsightDismiss?: () => void;
}

export function BottomChatBar({
  className,
  hasPendingInsight = false,
  contextData,
  onInsightDismiss
}: BottomChatBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    // Call the agent orchestration API
    try {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: input,
          context: {
            workspaceId: 'workspace-1',
            userId: 'user-1',
            sessionId: `session-${Date.now()}`,
            // Include Step2Discover context
            selectedTables: contextData?.selectedTables || [],
            currentStep: contextData?.currentStep || 'unknown',
            productIntent: contextData?.productIntent || ''
          }
        })
      });
      
      const data = await response.json();
      
      // Process the agent orchestration response
      let responseContent = '';
      
      // First priority: Check for conversational response from ConversationalAgent
      if (data.conversationalResponse) {
        responseContent = data.conversationalResponse;
      }
      
      // Fallback if no planning data found
      if (!responseContent) {
        if (data.error) {
          responseContent = `❌ **Error:** ${data.error}`;
        } else if (data.success && data.results) {
          // Direct results without planning agent
          if (typeof data.results === 'string') {
            responseContent = data.results;
          } else if (data.results.sql) {
            responseContent = `Generated SQL query:\n\`\`\`sql\n${data.results.sql}\n\`\`\``;
          } else if (data.results.pipeline) {
            responseContent = `Created pipeline: ${data.results.pipeline.name}\n${data.results.pipeline.description}`;
          } else {
            responseContent = '✅ Task completed successfully. Check your workspace for results.';
          }
        } else {
          responseContent = `👋 I'm ready to help! I can assist with:

🔍 **SQL Generation** - "Generate a query to find top customers"
📊 **Data Quality** - "Create quality rules for my orders table"
🔄 **Pipeline Design** - "Design a pipeline for real-time data"

What would you like to work on?`;
        }
      }

      // Generate contextual quick actions
      const quickActions: Array<{ label: string; action: string }> = [];
      if (contextData?.selectedTables && contextData.selectedTables.length > 0) {
        quickActions.push({
          label: '🔗 Analyze join patterns',
          action: `Analyze common join patterns for ${contextData.selectedTables.join(', ')}`
        });
        quickActions.push({
          label: '📊 Check data quality',
          action: `Review data quality for selected tables`
        });
      }
      if (contextData?.currentStep === 'discover') {
        quickActions.push({
          label: '💡 Recommend tables',
          action: 'Suggest additional tables based on my current selection'
        });
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        quickActions: quickActions.length > 0 ? quickActions : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsExpanded(false);
    } else {
      setIsMinimized(true);
      setIsExpanded(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Spacer to push content up when chat is open */}
      <div 
        className={cn(
          "transition-all duration-300",
          isMinimized ? "h-0" : isExpanded ? "h-[600px]" : "h-[400px]"
        )} 
      />
      
      {/* Chat Bar */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 transition-all duration-300",
          "bg-background/95 backdrop-blur-lg",
          "border-t-2 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
          isMinimized ? "h-14 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]" : isExpanded ? "h-[600px]" : "h-[400px]",
          className
        )}
      >
        {/* Header Bar - Make entire header clickable when minimized */}
        <div 
          className={cn(
            "h-14 px-4 flex items-center justify-between border-b border-border bg-card/50",
            isMinimized && "cursor-pointer hover:bg-muted/30 transition-colors"
          )}
          onClick={isMinimized ? toggleChat : undefined}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-md transition-all relative",
              isMinimized ? "bg-primary/20" : "hover:bg-muted/50"
            )}>
              {isMinimized ? (
                <>
                  <MessageSquare className={cn(
                    "h-5 w-5 text-blue-400",
                    hasPendingInsight && "animate-pulse"
                  )} />
                  {hasPendingInsight && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                    </span>
                  )}
                  <span className="sr-only">
                    {hasPendingInsight ? 'AI has insights - Click to open' : 'Click to open AI Console'}
                  </span>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChat();
                  }}
                  className="p-0"
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 select-none">
              <Terminal className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">AI Console</span>
              {hasPendingInsight ? (
                <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-xs">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1 animate-pulse"></span>
                  Insights Available
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Ready
                </Badge>
              )}
              {isMinimized && (
                <span className="text-xs text-muted-foreground ml-2">
                  {hasPendingInsight ? 'AI has insights' : 'Click to open'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleExpand}
                  className="p-2 hover:bg-muted/50"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-muted/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Chat Content */}
        {!isMinimized && (
          <div className="flex flex-col h-[calc(100%-3.5rem)]">
            {/* Messages Area */}
            <ScrollArea 
              ref={scrollRef}
              className="flex-1 p-4"
            >
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Ask me anything about data engineering, SQL, pipelines, or quality rules.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setInput("Generate a SQL query to analyze customer behavior")}
                      >
                        SQL Generation
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setInput("Create data quality rules for the orders table")}
                      >
                        Quality Rules
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setInput("Design a pipeline for real-time data ingestion")}
                      >
                        Pipeline Design
                      </Button>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role !== 'user' && (
                        <div className="flex-shrink-0">
                          {message.role === 'agent' ? (
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-purple-400" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-blue-400" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="max-w-[70%] space-y-2">
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2",
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {message.agentRole && (
                            <div className="text-xs text-muted-foreground mb-1">{message.agentRole}</div>
                          )}
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className="text-xs text-muted-foreground/60 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        {message.quickActions && message.quickActions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {message.quickActions.map((action, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setInput(action.action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {isProcessing && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-400 animate-pulse" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Input Area */}
            <div className="border-t border-gray-800 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about SQL, data quality, pipelines..."
                    className="flex-1 bg-input border-border focus:border-ring"
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}