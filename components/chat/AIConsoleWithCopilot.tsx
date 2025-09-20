'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCopilotChat, useCopilotAction } from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { agentActions, formatAgentResponse, analyzeQueryIntent } from '@/lib/copilot/copilot-config';
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

export function AIConsoleWithCopilot() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [showAgentActivity, setShowAgentActivity] = useState(true);
  
  // CopilotKit hooks
  const { messages, sendMessage, isLoading } = useCopilotChat();
  
  // Register agent actions with CopilotKit
  useCopilotAction({
    name: "executeSQL",
    description: "Generate and execute optimized SQL queries",
    parameters: [
      {
        name: "description",
        type: "string",
        description: "Natural language description of the query",
        required: true
      }
    ],
    handler: async ({ description }) => {
      const task = createAgentTask('sql_generator', `SQL: ${description}`);
      setActiveTasks(prev => [...prev, task]);
      
      try {
        const response = await fetch('/api/agents/sql-generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            description,
            context: {
              workspaceId: 'workspace-1',
              userId: 'user-1',
              sessionId: `session-${Date.now()}`
            }
          })
        });
        
        const data = await response.json();
        updateTaskStatus(task.id, 'completed', 100);
        
        return formatAgentResponse(data);
      } catch (error) {
        updateTaskStatus(task.id, 'failed', 0);
        throw error;
      }
    }
  });
  
  useCopilotAction({
    name: "orchestrateAgents",
    description: "Orchestrate multiple agents for complex tasks",
    parameters: [
      {
        name: "task",
        type: "string",
        description: "Complex task description",
        required: true
      }
    ],
    handler: async ({ task }) => {
      const mainTask = createAgentTask('orchestrator', task);
      setActiveTasks(prev => [...prev, mainTask]);
      
      // Determine which agents to use
      const requiredAgents = analyzeQueryIntent(task);
      
      try {
        const response = await fetch('/api/agents/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            description: task,
            context: {
              workspaceId: 'workspace-1',
              userId: 'user-1',
              sessionId: `session-${Date.now()}`
            }
          })
        });
        
        const data = await response.json();
        
        // Update task with subtasks from response
        if (data.collaboration) {
          mainTask.subtasks = data.collaboration.tasks.map((t: any) => ({
            id: t.id,
            agent: t.assignedTo,
            title: t.title,
            status: t.status,
            progress: t.status === 'completed' ? 100 : 50,
            startTime: new Date(t.startedAt || Date.now())
          }));
        }
        
        updateTaskStatus(mainTask.id, 'completed', 100);
        
        // Format response for display
        if (data.results) {
          return formatAgentResponse(data.results);
        }
        
        return "Task completed successfully. Check the agent activity panel for details.";
      } catch (error) {
        updateTaskStatus(mainTask.id, 'failed', 0);
        throw error;
      }
    }
  });
  
  const createAgentTask = (agent: string, title: string): AgentTask => {
    return {
      id: `task-${Date.now()}-${Math.random()}`,
      agent,
      title,
      status: 'in_progress',
      progress: 0,
      startTime: new Date(),
      subtasks: [],
      logs: [`[${new Date().toISOString()}] Task initiated`]
    };
  };
  
  const updateTaskStatus = (taskId: string, status: AgentTask['status'], progress: number) => {
    setActiveTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status, progress, endTime: status === 'completed' || status === 'failed' ? new Date() : undefined }
        : t
    ));
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
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-gray-950 border border-gray-800 rounded-lg overflow-hidden`}>
      {/* Console Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-green-400" />
          <span className="text-sm font-mono text-gray-300">NexusOne AI Console</span>
          <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
            CopilotKit Connected
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
        {/* CopilotKit Chat Area */}
        <div className={`flex-1 ${showAgentActivity ? 'border-r border-gray-800' : ''}`}>
          <CopilotChat
            instructions="You are an AI orchestrator for the NexusOne Data Engineering Platform. You coordinate multiple specialized agents (SQL Generation, Data Quality, Pipeline Orchestration) to solve complex data engineering problems. Always explain which agents you're using and what they're doing."
            labels={{
              title: "AI Console",
              initial: "Welcome to NexusOne AI Console. How can I help you with your data engineering needs today?",
            }}
            className="h-full bg-transparent"
            style={{
              '--copilot-kit-background-color': 'transparent',
              '--copilot-kit-primary-color': '#10b981',
              '--copilot-kit-secondary-color': '#1f2937',
              '--copilot-kit-text-color': '#e5e7eb',
              '--copilot-kit-border-color': '#374151',
              '--font-family': 'ui-monospace, monospace',
            } as React.CSSProperties}
          />
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
                            {task.title.substring(0, 30)}...
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
                      
                      {task.progress > 0 && task.progress < 100 && (
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
                              <span className={getAgentColor(subtask.agent)}>
                                [{subtask.agent}]
                              </span>
                              <span>{subtask.title.substring(0, 25)}...</span>
                              {subtask.status === 'completed' && (
                                <CheckCircle2 className="h-3 w-3 text-green-400 ml-auto" />
                              )}
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
                    No active tasks. Start a conversation to see agent activity.
                  </div>
                )}
                
                {activeTasks.length > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-gray-400"
                    onClick={() => setActiveTasks(prev => prev.slice(-5))}
                  >
                    Clear Old Tasks
                  </Button>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}