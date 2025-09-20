'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Terminal,
  Send, 
  Sparkles, 
  User,
  Database,
  Shield,
  GitBranch,
  Loader2,
  ChevronRight,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
  Command,
  Zap
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent' | 'error';
  content: string;
  timestamp: Date;
  agentRole?: string;
  taskId?: string;
  codeBlock?: string;
  suggestions?: string[];
}

interface AgentTask {
  id: string;
  agent: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  subtasks?: AgentTask[];
  logs?: string[];
  confidence?: number;
}

export function AIConsole() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: '> NexusOne AI Console v2.0 Initialized',
      timestamp: new Date()
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Welcome to the NexusOne AI Console. I\'m orchestrating multiple specialized agents to help with your data engineering needs. Type your request or use /help for commands.',
      timestamp: new Date(),
      suggestions: [
        'Generate SQL for customer segmentation',
        'Create data quality rules for orders table',
        'Design ETL pipeline for real-time analytics',
        'Analyze pipeline performance bottlenecks'
      ]
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [showAgentActivity, setShowAgentActivity] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

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
    
    // Call real agent orchestration API
    await executeAgentOrchestration(input);
  };

  const executeAgentOrchestration = async (query: string) => {
    try {
      // Create main orchestration task
      const mainTask: AgentTask = {
        id: `task-${Date.now()}`,
        agent: 'orchestrator',
        title: 'Processing: ' + query.substring(0, 50) + '...',
        status: 'in_progress',
        progress: 0,
        startTime: new Date(),
        subtasks: [],
        confidence: 0
      };
      
      setActiveTasks(prev => [...prev, mainTask]);
      
      // System message about processing
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        role: 'system',
        content: '> Analyzing request with natural language understanding...',
        timestamp: new Date()
      }]);
      
      // Call the real agent orchestration API
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: query,
          context: {
            workspaceId: 'workspace-1',
            userId: 'user-1',
            sessionId: `session-${Date.now()}`
          }
        })
      });
      
      const data = await response.json();
      
      // Process routing decision
      if (data.routingDecision) {
        mainTask.confidence = Math.round(data.routingDecision.confidence * 100);
        
        // Add routing decision as agent message
        setMessages(prev => [...prev, {
          id: `agent-routing-${Date.now()}`,
          role: 'agent',
          agentRole: 'Planning Agent',
          content: `Intent: ${data.routingDecision.intent}\nAgents: ${data.routingDecision.requiredAgents.join(', ')}\nConfidence: ${Math.round(data.routingDecision.confidence * 100)}%`,
          timestamp: new Date()
        }]);
        
        // Create subtasks from routing
        if (data.routingDecision.tasks) {
          data.routingDecision.tasks.forEach((task: any, idx: number) => {
            setTimeout(() => {
              const subtask: AgentTask = {
                id: `subtask-${Date.now()}-${idx}`,
                agent: task.agent,
                title: task.description,
                status: 'in_progress',
                progress: 0,
                startTime: new Date()
              };
              
              mainTask.subtasks?.push(subtask);
              setActiveTasks(prev => [...prev]);
              
              // Simulate progress
              let progress = 0;
              const interval = setInterval(() => {
                progress += 25;
                if (progress >= 100) {
                  clearInterval(interval);
                  subtask.status = 'completed';
                  subtask.progress = 100;
                  subtask.endTime = new Date();
                } else {
                  subtask.progress = progress;
                }
                setActiveTasks(prev => [...prev]);
              }, 500);
            }, idx * 1000);
          });
        }
      }
      
      // Update main task progress
      setTimeout(() => {
        mainTask.progress = 50;
        setActiveTasks(prev => [...prev]);
      }, 1000);
      
      // Process results
      if (data.success && data.results) {
        const formattedResponse = formatAgentResults(data.results);
        
        // Complete main task
        setTimeout(() => {
          mainTask.status = 'completed';
          mainTask.progress = 100;
          mainTask.endTime = new Date();
          setActiveTasks(prev => prev.filter(t => t.id !== mainTask.id));
          
          // Add assistant response
          setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: formattedResponse.message,
            timestamp: new Date(),
            codeBlock: formattedResponse.codeBlock
          }]);
          
          // Add insights if available
          if (data.insights && data.insights.length > 0) {
            setMessages(prev => [...prev, {
              id: `insights-${Date.now()}`,
              role: 'agent',
              agentRole: 'Insights',
              content: `**Key Insights:**\n${data.insights.map((i: any) => `• ${i.description || i.title}`).join('\n')}`,
              timestamp: new Date()
            }]);
          }
          
          setIsProcessing(false);
        }, 3000);
      } else {
        // Handle error
        mainTask.status = 'failed';
        setActiveTasks(prev => prev.filter(t => t.id !== mainTask.id));
        
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: data.error || 'Unable to process your request. Please try again.',
          timestamp: new Date()
        }]);
        
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error('Agent orchestration error:', error);
      setActiveTasks([]);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }]);
      setIsProcessing(false);
    }
  };
  
  const formatAgentResults = (results: any): { message: string; codeBlock?: string } => {
    // Handle SQL generation results
    if (results.sql) {
      return {
        message: results.explanation || 'I\'ve generated an optimized SQL query for your request.',
        codeBlock: results.sql
      };
    }
    
    // Handle quality rules results
    if (results.rules && Array.isArray(results.rules)) {
      const rulesText = results.rules.map((rule: any) => 
        `-- ${rule.name} (${rule.severity})\n-- ${rule.description}\n${rule.sql || rule.expression || ''}`
      ).join('\n\n');
      
      return {
        message: `Generated ${results.rules.length} data quality rules.`,
        codeBlock: rulesText
      };
    }
    
    // Handle pipeline results
    if (results.pipeline) {
      return {
        message: `Designed pipeline: ${results.pipeline.name}`,
        codeBlock: JSON.stringify(results.pipeline, null, 2)
      };
    }
    
    // Handle routing decision
    if (results.intent && results.requiredAgents) {
      return {
        message: `Understood: ${results.intent}\nAgents involved: ${results.requiredAgents.join(', ')}`
      };
    }
    
    // Generic response
    return {
      message: 'Request processed successfully.',
      codeBlock: typeof results === 'object' ? JSON.stringify(results, null, 2) : undefined
    };
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'sql_generator':
        return <Database className="h-4 w-4" />;
      case 'data_quality':
        return <Shield className="h-4 w-4" />;
      case 'pipeline_orchestrator':
        return <GitBranch className="h-4 w-4" />;
      case 'orchestrator':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'sql_generator':
        return 'text-blue-400';
      case 'data_quality':
        return 'text-green-400';
      case 'pipeline_orchestrator':
        return 'text-purple-400';
      case 'orchestrator':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-gray-950 border border-gray-800 rounded-lg overflow-hidden`}>
      {/* Console Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-green-400" />
          <span className="text-sm font-mono text-gray-300">NexusOne AI Console</span>
          <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
            Connected
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAgentActivity(!showAgentActivity)}
            className="text-gray-400 hover:text-white"
          >
            <Activity className="h-4 w-4 mr-1" />
            {showAgentActivity ? 'Hide' : 'Show'} Activity
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex h-[600px]">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${showAgentActivity ? 'border-r border-gray-800' : ''}`}>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="font-mono text-sm">
                  {message.role === 'system' ? (
                    <div className="text-gray-500">{message.content}</div>
                  ) : message.role === 'user' ? (
                    <div className="flex items-start gap-2">
                      <span className="text-green-400">$</span>
                      <div className="text-white">{message.content}</div>
                    </div>
                  ) : message.role === 'agent' ? (
                    <div className="flex items-start gap-2 pl-4">
                      <span className={getAgentColor(message.agentRole || '')}>
                        [{message.agentRole}]
                      </span>
                      <div className="text-gray-400">{message.content}</div>
                    </div>
                  ) : message.role === 'assistant' ? (
                    <div className="space-y-2">
                      <div className="text-gray-300 pl-4">{message.content}</div>
                      {message.codeBlock && (
                        <pre className="bg-gray-900 border border-gray-800 rounded p-3 text-xs overflow-x-auto">
                          <code className="text-gray-300">{message.codeBlock}</code>
                        </pre>
                      )}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-4">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInput(suggestion)}
                              className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-mono">$</span>
                <Input
                  ref={inputRef}
                  placeholder="Enter command or query..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="pl-8 bg-gray-900 border-gray-700 text-white font-mono text-sm placeholder:text-gray-600"
                  disabled={isProcessing}
                />
              </div>
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" />K to focus
              </span>
              <span>ESC to minimize</span>
              <span>/help for commands</span>
            </div>
          </div>
        </div>
        
        {/* Agent Activity Panel */}
        {showAgentActivity && (
          <div className="w-96 bg-gray-900/50">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-400" />
                Agent Activity Stream
              </h3>
            </div>
            
            <ScrollArea className="h-full p-4">
              <div className="space-y-3">
                {activeTasks.map((task) => (
                  <Card key={task.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={getAgentColor(task.agent)}>
                            {getAgentIcon(task.agent)}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {task.title}
                          </span>
                        </div>
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : task.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                        )}
                      </div>
                      
                      {task.progress > 0 && (
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-green-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                      
                      {task.confidence && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Confidence</span>
                          <span className="text-gray-400">{task.confidence}%</span>
                        </div>
                      )}
                      
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2 text-xs text-gray-400 pl-4">
                              <ChevronRight className="h-3 w-3" />
                              <span>{subtask.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>
                          {task.startTime.toLocaleTimeString()}
                          {task.endTime && ` - ${task.endTime.toLocaleTimeString()}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {activeTasks.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No active tasks
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}