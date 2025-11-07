"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ASCIIMiniChart } from '@/components/design-system/ASCIIMiniChart';

export interface MetricData {
  value: number;
  label: string;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  unit?: string;
  prefix?: string;
  suffix?: string;
  sparklineData?: number[];
  target?: number;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  description?: string;
  metadata?: Record<string, any>;
}

interface MetricCardProps {
  data: MetricData;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
  showTarget?: boolean;
  className?: string;
  animate?: boolean;
}

export function MetricCard({
  data,
  size = 'md',
  showSparkline = true,
  showTarget = true,
  className = '',
  animate = true,
}: MetricCardProps) {
  const {
    value,
    label,
    previousValue,
    change,
    changePercentage,
    trend,
    unit = '',
    prefix = '',
    suffix = '',
    sparklineData,
    target,
    status,
    description,
  } = data;

  // Calculate trend if not provided
  const calculatedTrend =
    trend ||
    (change !== undefined
      ? change > 0
        ? 'up'
        : change < 0
        ? 'down'
        : 'neutral'
      : 'neutral');

  // Calculate percentage if not provided
  const calculatedPercentage =
    changePercentage !== undefined
      ? changePercentage
      : previousValue && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : undefined;

  // Format value
  const formatValue = (val: number): string => {
    if (Math.abs(val) >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toFixed(val % 1 === 0 ? 0 : 2);
  };

  // Size classes
  const sizeClasses = {
    sm: {
      card: 'p-3',
      value: 'text-2xl',
      label: 'text-xs',
      trend: 'text-xs',
    },
    md: {
      card: 'p-4',
      value: 'text-3xl',
      label: 'text-sm',
      trend: 'text-sm',
    },
    lg: {
      card: 'p-6',
      value: 'text-4xl',
      label: 'text-base',
      trend: 'text-base',
    },
  };

  // Status colors
  const statusColors = {
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950',
    down: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
    neutral: 'text-muted-foreground bg-muted',
  };

  const TrendIcon =
    calculatedTrend === 'up'
      ? TrendingUp
      : calculatedTrend === 'down'
      ? TrendingDown
      : Minus;

  return (
    <Card
      className={`${sizeClasses[size].card} ${className} ${
        animate ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            className={`font-medium text-muted-foreground ${sizeClasses[size].label}`}
          >
            {label}
          </h3>

          {/* Main Value */}
          <div
            className={`mt-2 font-bold ${sizeClasses[size].value} ${
              status ? statusColors[status] : ''
            }`}
          >
            {prefix}
            {formatValue(value)}
            {unit}
            {suffix}
          </div>

          {/* Description */}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Status Icon */}
        {calculatedTrend !== 'neutral' && (
          <div
            className={`rounded-full p-2 ${trendColors[calculatedTrend]}`}
          >
            <TrendIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Change & Trend */}
      {(change !== undefined || calculatedPercentage !== undefined) && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${sizeClasses[size].trend} font-medium ${trendColors[calculatedTrend]}`}
          >
            {calculatedTrend === 'up' ? (
              <ArrowUp className="h-3 w-3" />
            ) : calculatedTrend === 'down' ? (
              <ArrowDown className="h-3 w-3" />
            ) : null}
            {calculatedPercentage !== undefined
              ? `${Math.abs(calculatedPercentage).toFixed(1)}%`
              : change !== undefined
              ? `${Math.abs(change).toFixed(0)}`
              : ''}
          </span>

          {previousValue !== undefined && (
            <span className="text-xs text-muted-foreground">
              vs {formatValue(previousValue)}
            </span>
          )}
        </div>
      )}

      {/* Sparkline */}
      {showSparkline && sparklineData && sparklineData.length > 0 && (
        <div className="mt-4">
          <ASCIIMiniChart
            data={sparklineData}
            height={size === 'sm' ? 3 : size === 'md' ? 4 : 5}
            trend={calculatedTrend}
          />
        </div>
      )}

      {/* Target Progress */}
      {showTarget && target !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Target: {formatValue(target)}</span>
            <span>{((value / target) * 100).toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${
                value >= target
                  ? 'bg-green-500'
                  : value >= target * 0.8
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min((value / target) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

// Multi-metric grid component
interface MetricGridProps {
  metrics: MetricData[];
  columns?: 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
  className?: string;
}

export function MetricGrid({
  metrics,
  columns = 3,
  size = 'md',
  showSparkline = true,
  className = '',
}: MetricGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
      {metrics.map((metric, idx) => (
        <MetricCard
          key={idx}
          data={metric}
          size={size}
          showSparkline={showSparkline}
          animate
        />
      ))}
    </div>
  );
}
