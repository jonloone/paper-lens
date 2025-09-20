'use client';

import React, { useState } from 'react';
import type { UserRole } from '@/app/workstation/page';

interface DataQualityTesterProps {
  role: UserRole;
}

interface QualityCheck {
  id: string;
  name: string;
  description: string;
  type: 'completeness' | 'validity' | 'consistency' | 'accuracy';
  status: 'pending' | 'running' | 'passed' | 'failed';
  score?: number;
}

export function DataQualityTester({ role }: DataQualityTesterProps) {
  const [selectedTable, setSelectedTable] = useState('customers');
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([
    {
      id: '1',
      name: 'Null Value Check',
      description: 'Check for missing values in required fields',
      type: 'completeness',
      status: 'passed',
      score: 98
    },
    {
      id: '2',
      name: 'Email Format Validation',
      description: 'Validate email addresses follow correct format',
      type: 'validity',
      status: 'failed',
      score: 85
    },
    {
      id: '3',
      name: 'Date Range Consistency',
      description: 'Ensure dates are within expected ranges',
      type: 'consistency',
      status: 'passed',
      score: 95
    },
    {
      id: '4',
      name: 'Reference Integrity',
      description: 'Check foreign key relationships',
      type: 'accuracy',
      status: 'running'
    }
  ]);

  const tables = ['customers', 'orders', 'products', 'transactions'];

  const runAllTests = () => {
    setQualityChecks(checks => 
      checks.map(check => ({ ...check, status: 'running' }))
    );
    
    // Simulate test execution
    setTimeout(() => {
      setQualityChecks(checks => 
        checks.map(check => ({
          ...check,
          status: Math.random() > 0.3 ? 'passed' : 'failed',
          score: Math.floor(Math.random() * 30) + 70
        }))
      );
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return 'fas fa-check-circle text-green-400';
      case 'failed': return 'fas fa-times-circle text-red-400';
      case 'running': return 'fas fa-spinner fa-spin text-yellow-400';
      default: return 'fas fa-clock text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'completeness': return 'bg-blue-900/50 text-blue-300';
      case 'validity': return 'bg-green-900/50 text-green-300';
      case 'consistency': return 'bg-yellow-900/50 text-yellow-300';
      case 'accuracy': return 'bg-purple-900/50 text-purple-300';
      default: return 'bg-gray-900/50 text-gray-300';
    }
  };

  const overallScore = Math.round(
    qualityChecks
      .filter(check => check.score)
      .reduce((sum, check) => sum + check.score!, 0) /
    qualityChecks.filter(check => check.score).length
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif-display text-white mb-2">
              Data Quality Tester
            </h1>
            <p className="text-gray-400 font-sans-ui">
              Run comprehensive data quality checks and validate data integrity
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Panel - Configuration */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-xl font-serif-display text-white mb-4">
                  Select Table
                </h2>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-accent-blue-50 focus:outline-none"
                >
                  {tables.map(table => (
                    <option key={table} value={table}>
                      {table.charAt(0).toUpperCase() + table.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-xl font-serif-display text-white mb-4">
                  Quality Score
                </h2>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {isNaN(overallScore) ? '--' : `${overallScore}%`}
                  </div>
                  <div className="text-sm text-gray-400 font-sans-ui">
                    Overall Data Quality
                  </div>
                </div>
                
                <button
                  onClick={runAllTests}
                  className="w-full mt-6 px-6 py-3 bg-accent-blue-50 hover:bg-accent-blue-60 text-white rounded-lg font-sans-ui font-medium transition-colors"
                >
                  <i className="fas fa-play mr-2" />
                  Run All Tests
                </button>
              </div>
            </div>

            {/* Right Panel - Test Results */}
            <div className="xl:col-span-2">
              <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-xl font-serif-display text-white mb-6">
                  Quality Checks
                </h2>
                
                <div className="space-y-4">
                  {qualityChecks.map(check => (
                    <div key={check.id} className="p-4 border border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <i className={getStatusIcon(check.status)} />
                          <h3 className="font-sans-ui font-medium text-white">
                            {check.name}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-sans-ui ${getTypeColor(check.type)}`}>
                            {check.type.charAt(0).toUpperCase() + check.type.slice(1)}
                          </span>
                        </div>
                        {check.score && (
                          <span className="text-sm font-sans-ui text-gray-300">
                            {check.score}%
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-400 font-sans-ui mb-3">
                        {check.description}
                      </p>
                      
                      {check.status === 'failed' && (
                        <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded">
                          <div className="text-sm text-red-300 font-sans-ui">
                            <i className="fas fa-exclamation-triangle mr-2" />
                            Found {Math.floor(Math.random() * 50) + 10} issues that need attention
                          </div>
                        </div>
                      )}
                      
                      {check.status === 'passed' && (
                        <div className="mt-3 p-3 bg-green-900/20 border border-green-800 rounded">
                          <div className="text-sm text-green-300 font-sans-ui">
                            <i className="fas fa-check mr-2" />
                            All checks passed successfully
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}