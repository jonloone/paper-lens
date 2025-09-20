'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AgentStatusBarProps {
  userRole: 'data_engineer' | 'analytics_engineer' | 'data_analyst' | 'domain_expert' | 'executive';
}

export function AgentStatusBar({ userRole }: AgentStatusBarProps) {
  const getAgentStatus = () => {
    switch (userRole) {
      case 'data_engineer':
        return { status: 'Active', message: 'Pipeline orchestration agents ready' };
      case 'analytics_engineer':
        return { status: 'Active', message: 'Transformation agents monitoring' };
      case 'data_analyst':
        return { status: 'Active', message: 'Analysis agents available' };
      case 'domain_expert':
        return { status: 'Active', message: 'Knowledge agents connected' };
      case 'executive':
        return { status: 'Active', message: 'Strategic agents reporting' };
      default:
        return { status: 'Idle', message: 'Select a role to activate agents' };
    }
  };

  const { status, message } = getAgentStatus();

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-gray-900 border-t border-gray-800">
      <div className="flex items-center gap-3">
        <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
          {status}
        </Badge>
        <span className="text-sm text-gray-300">{message}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>AI Agents</span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}