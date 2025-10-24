'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronUp,
  Settings,
  Maximize2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QualitySummary, QualityCheck } from './QualitySummaryPanel';

interface QualityGatesCardProps {
  summary: QualitySummary;
  onConfigure?: () => void;
  onExpand?: () => void;
  className?: string;
}

export function QualityGatesCard({
  summary,
  onConfigure,
  onExpand,
  className
}: QualityGatesCardProps) {
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [showAllChecks, setShowAllChecks] = useState(false);

  const passedChecks = summary.checks.filter(c => c.status === 'pass').length;
  const failedChecks = summary.checks.filter(c => c.status === 'fail').length;
  const warningChecks = summary.checks.filter(c => c.status === 'warning').length;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getCheckIcon = (status: QualityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const priorityChecks = [
    ...summary.checks.filter(c => c.status === 'fail'),
    ...summary.checks.filter(c => c.status === 'warning'),
    ...summary.checks.filter(c => c.status === 'pass')
  ];

  const displayChecks = showAllChecks ? priorityChecks : priorityChecks.slice(0, 3);

  return (
    <div
      className={cn(
        "rounded-2xl bg-white dark:bg-gray-950 border border-border overflow-hidden",
        "shadow-lg hover:shadow-xl transition-shadow duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-elevation-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Quality Gates</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {summary.totalRows.toLocaleString()} rows analyzed
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onConfigure && (
              <Button size="sm" variant="ghost" onClick={onConfigure} className="h-7 w-7 p-0">
                <Settings className="w-3 h-3" />
              </Button>
            )}
            {onExpand && (
              <Button size="sm" variant="ghost" onClick={onExpand} className="h-7 w-7 p-0">
                <Maximize2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="p-4 bg-elevation-0">
        <div className="flex items-center justify-between">
          {/* Large Score Badge */}
          <div className={cn(
            "px-4 py-3 rounded-xl border-2",
            getScoreBgColor(summary.overallScore)
          )}>
            <div className={cn(
              "text-3xl font-bold tracking-tight",
              getScoreColor(summary.overallScore)
            )}>
              {summary.overallScore}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">Overall Score</div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {passedChecks}
              </div>
              <div className="text-xs text-muted-foreground">Pass</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {warningChecks}
              </div>
              <div className="text-xs text-muted-foreground">Warn</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {failedChecks}
              </div>
              <div className="text-xs text-muted-foreground">Fail</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-4 py-3 border-t border-border bg-elevation-0">
        <h4 className="text-xs font-semibold text-foreground mb-2">Key Metrics</h4>
        <div className="space-y-2">
          {/* Completeness */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {summary.completeness >= 95 ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : summary.completeness >= 80 ? (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500" />
              )}
              <span className="text-muted-foreground">Completeness</span>
            </div>
            <span className="font-medium">{summary.completeness}%</span>
          </div>

          {/* Uniqueness */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {summary.uniqueness >= 50 ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              )}
              <span className="text-muted-foreground">Uniqueness</span>
            </div>
            <span className="font-medium">{summary.uniqueness}%</span>
          </div>

          {/* Null Values */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {summary.nullCount === 0 ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (summary.nullCount / summary.totalRows) < 0.05 ? (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500" />
              )}
              <span className="text-muted-foreground">Null Values</span>
            </div>
            <span className="font-medium">
              {summary.nullCount.toLocaleString()} ({((summary.nullCount / (summary.totalRows * summary.checks.length)) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Quality Checks List with Drill-Down */}
      <div className="px-4 py-3 border-t border-border bg-white dark:bg-gray-950">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-foreground">Validation Checks</h4>
          {priorityChecks.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllChecks(!showAllChecks)}
              className="h-auto p-0 text-xs"
            >
              {showAllChecks ? 'Show less' : `+${priorityChecks.length - 3} more`}
            </Button>
          )}
        </div>

        <div className="space-y-1">
          {displayChecks.map((check) => (
            <div key={check.id}>
              {/* Check Summary Row */}
              <button
                onClick={() => setExpandedCheckId(
                  expandedCheckId === check.id ? null : check.id
                )}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg text-xs",
                  "hover:bg-elevation-1 transition-colors",
                  expandedCheckId === check.id && "bg-elevation-1"
                )}
              >
                <div className="flex items-center gap-2">
                  {getCheckIcon(check.status)}
                  <span className="font-medium text-foreground">{check.name}</span>
                  {check.status !== 'pass' && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        check.status === 'warning'
                          ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                          : "bg-red-500/10 text-red-700 dark:text-red-400"
                      )}
                    >
                      Action needed
                    </Badge>
                  )}
                </div>
                {check.status !== 'pass' && (
                  expandedCheckId === check.id ? (
                    <ChevronUp className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  )
                )}
              </button>

              {/* Expanded Details */}
              {expandedCheckId === check.id && check.status !== 'pass' && (
                <div className="ml-6 mt-1 p-3 rounded-lg bg-elevation-1 border border-border animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    {/* Message */}
                    <div className="flex items-start gap-2">
                      <Info className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-muted-foreground">
                        {check.message}
                      </div>
                    </div>

                    {/* Metric vs Threshold */}
                    {check.metric !== undefined && check.threshold !== undefined && (
                      <div className="flex items-center justify-between p-2 rounded bg-elevation-0 text-xs">
                        <span className="text-muted-foreground">Current: <span className="font-medium text-foreground">{check.metric.toFixed(1)}%</span></span>
                        <span className="text-muted-foreground">Threshold: <span className="font-medium text-foreground">{check.threshold}%</span></span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement fix suggestion
                        }}
                      >
                        Suggest Fix
                      </Button>
                      {onConfigure && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfigure();
                          }}
                        >
                          Adjust Threshold
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-elevation-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {failedChecks + warningChecks} issues detected
          </span>
          <Button variant="link" size="sm" className="text-xs h-auto p-0">
            View full report →
          </Button>
        </div>
      </div>
    </div>
  );
}
