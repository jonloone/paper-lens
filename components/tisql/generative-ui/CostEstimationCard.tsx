'use client';

import React from 'react';
import { DollarSign, Database, Clock, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CostBreakdown {
  category: string;
  amount: number;
  description: string;
}

export interface CostEstimationCardProps {
  sql: string;
  dataScannedGB: number;
  estimatedCostUSD: number;
  executionTimeEstimate: string;
  costBreakdown?: CostBreakdown[];
  warningThreshold?: number;
  onOptimizeCost?: () => void;
  onProceedAnyway?: () => void;
}

/**
 * CostEstimationCard - Generative UI component for query cost estimation
 *
 * Rendered by the AI agent when showing cost analysis for queries
 * with warnings for expensive operations.
 */
export function CostEstimationCard({
  sql,
  dataScannedGB,
  estimatedCostUSD,
  executionTimeEstimate,
  costBreakdown = [],
  warningThreshold = 5.0,
  onOptimizeCost,
  onProceedAnyway,
}: CostEstimationCardProps) {
  const isExpensive = estimatedCostUSD > warningThreshold;
  const costColor = isExpensive ? 'text-red-500' : 'text-green-500';
  const borderColor = isExpensive ? 'border-red-500/20' : 'border-green-500/20';

  return (
    <div className={`border ${borderColor} rounded-lg overflow-hidden bg-card`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isExpensive ? 'bg-red-500/10' : 'bg-green-500/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${
              isExpensive ? 'bg-red-500/20' : 'bg-green-500/20'
            } flex items-center justify-center`}
          >
            <DollarSign className={`w-4 h-4 ${costColor}`} />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Cost Estimation</h4>
            <p className="text-xs text-muted-foreground">
              {isExpensive ? 'High cost query detected' : 'Estimated query cost'}
            </p>
          </div>
        </div>

        {isExpensive && (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            HIGH COST
          </Badge>
        )}
      </div>

      {/* Cost Summary */}
      <div className="px-4 py-4 border-b bg-muted/10">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${costColor}`}>
              ${estimatedCostUSD.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Estimated Cost</div>
          </div>

          <div className="text-center border-l border-r">
            <div className="text-2xl font-bold">{dataScannedGB.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-1">GB Scanned</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold">{executionTimeEstimate}</div>
            <div className="text-xs text-muted-foreground mt-1">Est. Time</div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      {costBreakdown.length > 0 && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Cost Breakdown</span>
          </div>
          <div className="space-y-2">
            {costBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex-1">
                  <div className="font-medium">{item.category}</div>
                  <div className="text-muted-foreground text-[10px]">{item.description}</div>
                </div>
                <div className="font-mono font-semibold">${item.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query */}
      <div className="px-4 py-3 border-b bg-muted/5">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold">Query</span>
        </div>
        <pre className="text-xs font-mono overflow-x-auto bg-background/50 p-2 rounded border">
          <code>{sql}</code>
        </pre>
      </div>

      {/* Warning Message */}
      {isExpensive && (
        <div className="px-4 py-3 border-b bg-red-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-500">
              <strong>Warning:</strong> This query may be expensive to run. Consider optimizing
              to reduce data scanned and cost. Review partition filters, column projections, and
              join conditions.
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-muted/10 flex gap-2">
        {onOptimizeCost && (
          <Button
            onClick={onOptimizeCost}
            variant={isExpensive ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            {isExpensive ? 'Optimize to Reduce Cost' : 'Optimize Further'}
          </Button>
        )}
        {onProceedAnyway && (
          <Button
            onClick={onProceedAnyway}
            variant={isExpensive ? 'outline' : 'default'}
            size="sm"
            className="flex-1"
          >
            {isExpensive ? 'Proceed Anyway' : 'Run Query'}
          </Button>
        )}
      </div>

      {/* Footer Note */}
      <div className="px-4 py-2 bg-muted/5 text-[10px] text-muted-foreground text-center border-t">
        Costs are estimates based on data scanned. Actual costs may vary.
      </div>
    </div>
  );
}
