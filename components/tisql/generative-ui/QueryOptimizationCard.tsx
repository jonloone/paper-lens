'use client';

import React from 'react';
import { Zap, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Optimization {
  type: 'index' | 'join' | 'filter' | 'projection' | 'partition' | 'general';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedImprovement?: string;
}

export interface QueryOptimizationCardProps {
  originalSQL: string;
  optimizedSQL: string;
  optimizations: Optimization[];
  currentExecutionTime?: number;
  estimatedExecutionTime?: number;
  onApplyOptimization?: () => void;
  onCompare?: () => void;
}

/**
 * QueryOptimizationCard - Generative UI component for query optimization suggestions
 *
 * Rendered by the AI agent when providing optimization recommendations
 * with before/after comparison and interactive actions.
 */
export function QueryOptimizationCard({
  originalSQL,
  optimizedSQL,
  optimizations,
  currentExecutionTime,
  estimatedExecutionTime,
  onApplyOptimization,
  onCompare,
}: QueryOptimizationCardProps) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getOptimizationIcon = (type: string) => {
    switch (type) {
      case 'index':
        return '📑';
      case 'join':
        return '🔗';
      case 'filter':
        return '🔍';
      case 'projection':
        return '📊';
      case 'partition':
        return '🗂️';
      default:
        return '⚡';
    }
  };

  const improvementPercent =
    currentExecutionTime && estimatedExecutionTime
      ? Math.round(((currentExecutionTime - estimatedExecutionTime) / currentExecutionTime) * 100)
      : null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-yellow-500/10 to-green-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Query Optimization Suggestions</h4>
            <p className="text-xs text-muted-foreground">
              {optimizations.length} optimization{optimizations.length !== 1 ? 's' : ''} identified
            </p>
          </div>
        </div>

        {improvementPercent !== null && (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Zap className="w-3 h-3 mr-1" />
            {improvementPercent}% faster
          </Badge>
        )}
      </div>

      {/* Performance Comparison */}
      {currentExecutionTime && estimatedExecutionTime && (
        <div className="px-4 py-3 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Current:</span>
              <Badge variant="outline" className="text-xs">
                {currentExecutionTime}ms
              </Badge>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Estimated:</span>
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                {estimatedExecutionTime}ms
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Optimizations List */}
      <div className="divide-y">
        {optimizations.map((opt, idx) => (
          <div key={idx} className="px-4 py-3 hover:bg-muted/20 transition-colors">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{getOptimizationIcon(opt.type)}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-semibold text-sm">{opt.title}</h5>
                  <Badge variant="outline" className={`text-xs ${getImpactColor(opt.impact)}`}>
                    {opt.impact.toUpperCase()} IMPACT
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{opt.description}</p>
                {opt.estimatedImprovement && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    {opt.estimatedImprovement}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SQL Comparison */}
      <div className="divide-y border-t">
        {/* Original SQL */}
        <div className="px-4 py-3 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-500">BEFORE (Original)</span>
          </div>
          <pre className="text-xs font-mono overflow-x-auto bg-background/50 p-2 rounded border">
            <code>{originalSQL}</code>
          </pre>
        </div>

        {/* Optimized SQL */}
        <div className="px-4 py-3 bg-green-500/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-500">AFTER (Optimized)</span>
          </div>
          <pre className="text-xs font-mono overflow-x-auto bg-background/50 p-2 rounded border">
            <code>{optimizedSQL}</code>
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t bg-muted/10 flex gap-2">
        {onCompare && (
          <Button onClick={onCompare} variant="outline" size="sm" className="flex-1">
            Compare Performance
          </Button>
        )}
        {onApplyOptimization && (
          <Button onClick={onApplyOptimization} size="sm" className="flex-1">
            Apply Optimization
          </Button>
        )}
      </div>
    </div>
  );
}
