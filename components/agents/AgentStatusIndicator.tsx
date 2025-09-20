'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, 
  Shield, 
  GitBranch, 
  Zap,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { AgentRole } from '@/lib/agents/types';

interface AgentStatus {
  role: AgentRole;
  name: string;
  isBusy: boolean;
  completedTasks: number;
  insights: number;
}

export function AgentStatusIndicator() {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [activeCollaborations, setActiveCollaborations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch agent status
    fetchAgentStatus();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchAgentStatus, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agents/orchestrate?action=status');
      const data = await response.json();
      
      if (data.agents) {
        setAgentStatuses(data.agents.map((a: any) => a.status));
        setActiveCollaborations(data.collaborations?.length || 0);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
      // Set mock data if API fails
      setAgentStatuses([
        {
          role: 'sql_generator' as AgentRole,
          name: 'SQL Generation Agent',
          isBusy: false,
          completedTasks: 12,
          insights: 5
        },
        {
          role: 'data_quality' as AgentRole,
          name: 'Data Quality Agent',
          isBusy: true,
          completedTasks: 8,
          insights: 3
        },
        {
          role: 'pipeline_orchestrator' as AgentRole,
          name: 'Pipeline Orchestration Agent',
          isBusy: false,
          completedTasks: 5,
          insights: 2
        }
      ]);
      setLoading(false);
    }
  };

  const getAgentIcon = (role: AgentRole) => {
    switch (role) {
      case 'sql_generator':
        return <Sparkles className="h-4 w-4" />;
      case 'data_quality':
        return <Shield className="h-4 w-4" />;
      case 'pipeline_orchestrator':
        return <GitBranch className="h-4 w-4" />;
      case 'optimizer':
        return <Zap className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getAgentColor = (role: AgentRole) => {
    switch (role) {
      case 'sql_generator':
        return 'text-blue-400';
      case 'data_quality':
        return 'text-green-400';
      case 'pipeline_orchestrator':
        return 'text-purple-400';
      case 'optimizer':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Loading agents...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Active Collaborations Badge */}
      {activeCollaborations > 0 && (
        <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-400/30">
          {activeCollaborations} Active Collaboration{activeCollaborations > 1 ? 's' : ''}
        </Badge>
      )}
      
      {/* Agent Status Cards */}
      <div className="flex items-center gap-2">
        {agentStatuses.map((agent) => (
          <div
            key={agent.role}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-800/50 border ${
              agent.isBusy ? 'border-blue-500/30 animate-pulse' : 'border-gray-700'
            }`}
          >
            <div className={`${getAgentColor(agent.role)} ${agent.isBusy ? 'animate-spin' : ''}`}>
              {getAgentIcon(agent.role)}
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">
                {agent.name.split(' ')[0]}
              </span>
              <div className="flex items-center gap-2 text-xs">
                {agent.isBusy ? (
                  <span className="text-blue-400">Working...</span>
                ) : (
                  <>
                    <span className="text-gray-500">
                      {agent.completedTasks} tasks
                    </span>
                    {agent.insights > 0 && (
                      <span className="text-yellow-400">
                        {agent.insights} insights
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {agent.isBusy ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            ) : agent.completedTasks > 0 ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : (
              <div className="h-3 w-3" />
            )}
          </div>
        ))}
      </div>
      
      {/* Overall Status */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>AI Agents Online</span>
      </div>
    </div>
  );
}

// Compact version for header
export function AgentStatusBadge() {
  const [status, setStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const [activeTasks, setActiveTasks] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/agents/orchestrate?action=status');
        const data = await response.json();
        
        if (data.agents) {
          const busyAgents = data.agents.filter((a: any) => a.status.isBusy).length;
          setActiveTasks(busyAgents);
          setStatus(busyAgents > 0 ? 'busy' : 'online');
        }
      } catch (error) {
        setStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Badge 
      variant="outline" 
      className={`
        ${status === 'online' ? 'text-green-400 border-green-400/30' : 
          status === 'busy' ? 'text-blue-400 border-blue-400/30' : 
          'text-red-400 border-red-400/30'}
      `}
    >
      <span className={`w-2 h-2 rounded-full mr-2 ${
        status === 'online' ? 'bg-green-400' : 
        status === 'busy' ? 'bg-blue-400 animate-pulse' : 
        'bg-red-400'
      }`} />
      {status === 'busy' ? `${activeTasks} Agents Working` : 
       status === 'online' ? 'Agents Ready' : 
       'Agents Offline'}
    </Badge>
  );
}