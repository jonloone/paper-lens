'use client';

import React, { useState } from 'react';
import type { UserRole } from '@/app/workstation/page';

interface QueryOptimizerProps {
  role: UserRole;
}

export function QueryOptimizer({ role }: QueryOptimizerProps) {
  const [query, setQuery] = useState(`SELECT 
  c.customer_id,
  c.name,
  COUNT(o.order_id) as order_count,
  SUM(o.total_amount) as total_revenue
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= '2023-01-01'
GROUP BY c.customer_id, c.name
ORDER BY total_revenue DESC`);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const analyzeQuery = () => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setSuggestions([
        {
          type: 'index',
          impact: 'High',
          description: 'Add index on orders.customer_id for faster joins',
          code: 'CREATE INDEX idx_orders_customer_id ON orders(customer_id);'
        },
        {
          type: 'partition',
          impact: 'Medium',
          description: 'Consider partitioning orders table by order_date',
          code: 'ALTER TABLE orders PARTITION BY RANGE (order_date);'
        },
        {
          type: 'statistics',
          impact: 'Low',
          description: 'Update table statistics for better execution plan',
          code: 'ANALYZE TABLE customers, orders;'
        }
      ]);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif-display text-white mb-2">
              Query Optimizer
            </h1>
            <p className="text-gray-400 font-sans-ui">
              Analyze and optimize SQL queries for better performance
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Query Input */}
            <div className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl font-serif-display text-white mb-4">
                SQL Query
              </h2>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-64 p-4 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm resize-none focus:border-accent-blue-50 focus:outline-none"
                placeholder="Paste your SQL query here..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={analyzeQuery}
                  disabled={isAnalyzing}
                  className="px-6 py-3 bg-accent-blue-50 hover:bg-accent-blue-60 disabled:opacity-50 text-white rounded-lg font-sans-ui font-medium transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search mr-2" />
                      Analyze Query
                    </>
                  )}
                </button>
                <button className="px-6 py-3 border border-gray-700 hover:border-gray-600 text-white rounded-lg font-sans-ui font-medium transition-colors">
                  <i className="fas fa-play mr-2" />
                  Execute
                </button>
              </div>
            </div>

            {/* Optimization Suggestions */}
            <div className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl font-serif-display text-white mb-4">
                Optimization Suggestions
              </h2>
              {suggestions.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-lightbulb text-3xl mb-4" />
                    <p className="font-sans-ui">Click "Analyze Query" to get optimization suggestions</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-sans-ui font-medium text-white">
                          {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Optimization
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-sans-ui ${
                          suggestion.impact === 'High' ? 'bg-red-900/50 text-red-300' :
                          suggestion.impact === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-green-900/50 text-green-300'
                        }`}>
                          {suggestion.impact} Impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 font-sans-ui mb-3">
                        {suggestion.description}
                      </p>
                      <div className="bg-gray-900 p-3 rounded border border-gray-800">
                        <code className="text-sm text-green-400 font-mono">
                          {suggestion.code}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}