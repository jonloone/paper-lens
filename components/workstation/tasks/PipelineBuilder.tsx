'use client';

import React, { useState } from 'react';
import type { UserRole } from '@/app/workstation/page';

interface PipelineBuilderProps {
  role: UserRole;
}

export function PipelineBuilder({ role }: PipelineBuilderProps) {
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif-display text-white mb-2">
              Build Data Pipeline
            </h1>
            <p className="text-gray-400 font-sans-ui">
              Configure and deploy a new data pipeline with intelligent optimization
            </p>
          </div>

          <div className="space-y-8">
            {/* Source Configuration */}
            <div className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl font-serif-display text-white mb-4">
                Source Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'salesforce', name: 'Salesforce', icon: 'fas fa-cloud' },
                  { id: 's3', name: 'Amazon S3', icon: 'fas fa-box' },
                  { id: 'postgres', name: 'PostgreSQL', icon: 'fas fa-database' }
                ].map(source => (
                  <div
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedSource === source.id 
                        ? 'border-accent-blue-50 bg-accent-blue-50/10' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`${source.icon} text-lg ${
                        selectedSource === source.id ? 'text-accent-blue-50' : 'text-gray-400'
                      }`} />
                      <span className="font-sans-ui font-medium text-white">
                        {source.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Configuration */}
            <div className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl font-serif-display text-white mb-4">
                Destination Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'snowflake', name: 'Snowflake', icon: 'fas fa-snowflake' },
                  { id: 'bigquery', name: 'BigQuery', icon: 'fas fa-search' },
                  { id: 'redshift', name: 'Redshift', icon: 'fas fa-server' }
                ].map(destination => (
                  <div
                    key={destination.id}
                    onClick={() => setSelectedDestination(destination.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedDestination === destination.id 
                        ? 'border-accent-blue-50 bg-accent-blue-50/10' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`${destination.icon} text-lg ${
                        selectedDestination === destination.id ? 'text-accent-blue-50' : 'text-gray-400'
                      }`} />
                      <span className="font-sans-ui font-medium text-white">
                        {destination.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Preview */}
            {selectedSource && selectedDestination && (
              <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-xl font-serif-display text-white mb-4">
                  Pipeline Preview
                </h2>
                <div className="flex items-center gap-6">
                  <div className="p-3 border border-gray-700 rounded-lg">
                    <span className="font-sans-ui text-white">
                      {selectedSource.charAt(0).toUpperCase() + selectedSource.slice(1)}
                    </span>
                  </div>
                  <i className="fas fa-arrow-right text-accent-blue-50" />
                  <div className="p-3 border border-gray-700 rounded-lg">
                    <span className="font-sans-ui text-white">Transform</span>
                  </div>
                  <i className="fas fa-arrow-right text-accent-blue-50" />
                  <div className="p-3 border border-gray-700 rounded-lg">
                    <span className="font-sans-ui text-white">
                      {selectedDestination.charAt(0).toUpperCase() + selectedDestination.slice(1)}
                    </span>
                  </div>
                </div>
                
                <button className="mt-6 px-6 py-3 bg-accent-blue-50 hover:bg-accent-blue-60 text-white rounded-lg font-sans-ui font-medium transition-colors">
                  Deploy Pipeline
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}