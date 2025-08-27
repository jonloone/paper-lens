'use client';

import React from 'react';

interface TaskPlaceholderProps {
  taskName?: string;
  message?: string;
}

export function TaskPlaceholder({ 
  taskName = 'Task',
  message = 'Select a task from the sidebar to get started' 
}: TaskPlaceholderProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 12h.01M8 16h8"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-300 mb-3">
          {taskName} Workspace
        </h2>
        
        <p className="text-gray-500">
          {message}
        </p>
        
        <div className="mt-8 flex justify-center space-x-4">
          <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Workspace Ready</div>
            <div className="text-sm text-green-400">Active</div>
          </div>
          
          <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">API Connected</div>
            <div className="text-sm text-green-400">Online</div>
          </div>
        </div>
      </div>
    </div>
  );
}