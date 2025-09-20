'use client';

import React from 'react';
import type { TaskType } from '@/app/workstation/page';

interface RecentWorkSectionProps {
  onSelectTask: (task: TaskType) => void;
}

export function RecentWorkSection({ onSelectTask }: RecentWorkSectionProps) {
  // Mock recent work data
  const recentWork = [
    {
      id: 'build_pipeline',
      title: 'Customer Data Pipeline',
      description: 'Salesforce to Snowflake integration',
      lastAccessed: '2 hours ago',
      progress: 75,
      type: 'build_pipeline' as TaskType
    },
    {
      id: 'optimize_query',
      title: 'Revenue Query Optimization',
      description: 'Improving performance of monthly reports',
      lastAccessed: '1 day ago',
      progress: 40,
      type: 'optimize_query' as TaskType
    },
    {
      id: 'test_data',
      title: 'User Event Validation',
      description: 'Data quality checks for analytics',
      lastAccessed: '3 days ago',
      progress: 90,
      type: 'test_data' as TaskType
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-serif-display text-gray-300">Recent Work</h3>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {recentWork.map(work => (
          <div
            key={work.id}
            onClick={() => onSelectTask(work.type)}
            className="p-4 glass-panel rounded-lg border border-gray-800 hover:border-gray-700 cursor-pointer transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-sans-ui font-medium text-white group-hover:text-accent-blue-50 transition-colors">
                {work.title}
              </h4>
              <span className="text-xs text-gray-500 font-sans-ui">
                {work.lastAccessed}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-sans-ui mb-3">
              {work.description}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-sans-ui">Progress</span>
                <span className="text-xs text-gray-400 font-sans-ui">{work.progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1">
                <div 
                  className="bg-accent-blue-50 h-1 rounded-full transition-all"
                  style={{ width: `${work.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}