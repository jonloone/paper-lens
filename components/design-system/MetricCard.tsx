'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  MetricGauge,
  TrendIndicator,
  MiniProgressBar,
  QualityDots,
  MiniSparkline,
  ASCIIMetricDisplay
} from './ASCIIMiniChart';

interface MetricCardProps {
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
  className?: string;
  // ASCII chart enhancements
  showProgress?: boolean;
  progressValue?: number;
  maxValue?: number;
  showGauge?: boolean;
  showSparkline?: boolean;
  sparklineData?: number[];
  chartColor?: 'primary' | 'accent' | 'secondary' | 'tertiary';
}

export function MetricCard({
  value,
  label,
  trend,
  trendDirection = 'neutral',
  icon,
  color,
  className,
  showProgress = false,
  progressValue = 0,
  maxValue = 100,
  showGauge = false,
  showSparkline = false,
  sparklineData = [],
  chartColor = 'accent'
}: MetricCardProps) {
  const { theme } = useTheme();

  // Use CSS variables instead of hardcoded colors for theme support
  const cardColor = color || 'hsl(var(--primary))';

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-accent bg-accent/10';
      case 'down':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted/50';
    }
  };

  const getTrendSymbol = () => {
    switch (trendDirection) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-6 transition-all duration-200",
        "hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        "card-ascii-corners",
        className
      )}
    >
      {/* ASCII Corner Accents */}
      <div className="ascii-corners">
        <code className="corner corner-tl">┌</code>
        <code className="corner corner-tr">┐</code>
        <code className="corner corner-bl">└</code>
        <code className="corner corner-br">┘</code>
      </div>

      {/* Header with icon and trend */}
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{
              backgroundColor: `${color}20`,
              color: color
            }}
          >
            {icon}
          </div>
        )}

        {trend && (
          <div className="flex items-center gap-2">
            {/* Modern trend badge */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
              getTrendColor()
            )}>
              {getTrendIcon()}
              {trend}
            </div>

            {/* ASCII trend symbol */}
            <code
              className={cn(
                "font-mono text-xs ascii-glow",
                trendDirection === 'up' && "text-[#00E5C8]",
                trendDirection === 'down' && "text-[#FF6B7A]",
                trendDirection === 'neutral' && "text-muted-foreground"
              )}
            >
              {getTrendSymbol()}
            </code>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="font-display text-4xl font-medium text-foreground leading-none mb-2">
        {value}
      </div>

      {/* Label */}
      <div className="text-sm text-muted-foreground">
        {label}
      </div>

      {/* ASCII Chart Enhancements */}
      {(showProgress || showGauge || showSparkline) && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between gap-2">
            {/* Progress Bar */}
            {showProgress && (
              <MiniProgressBar
                value={progressValue}
                maxValue={maxValue}
                color={chartColor}
                className="flex-1"
              />
            )}

            {/* Gauge */}
            {showGauge && (
              <div className="flex items-center gap-2">
                <MetricGauge
                  value={typeof value === 'number' ? value : progressValue}
                  maxValue={maxValue}
                  color={chartColor}
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {Math.round((typeof value === 'number' ? value : progressValue) / maxValue * 100)}%
                </span>
              </div>
            )}

            {/* Sparkline */}
            {showSparkline && sparklineData.length > 0 && (
              <div className="flex items-center gap-2">
                <MiniSparkline
                  trendData={sparklineData}
                  color={chartColor}
                  size="xs"
                />
                <TrendIndicator
                  trendData={sparklineData}
                  color={chartColor}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MetricsGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
      className
    )}>
      {children}
    </div>
  );
}

// Specialized metric card variants with ASCII chart features
export function ProgressMetricCard({
  value,
  label,
  progressValue,
  maxValue = 100,
  color = '#5B6EFF',
  chartColor = 'accent',
  className
}: {
  value: string | number;
  label: string;
  progressValue: number;
  maxValue?: number;
  color?: string;
  chartColor?: 'primary' | 'accent' | 'secondary' | 'tertiary';
  className?: string;
}) {
  return (
    <MetricCard
      value={value}
      label={label}
      color={color}
      showProgress
      progressValue={progressValue}
      maxValue={maxValue}
      chartColor={chartColor}
      className={className}
    />
  );
}

export function GaugeMetricCard({
  value,
  label,
  maxValue = 100,
  color = '#5B6EFF',
  chartColor = 'accent',
  className
}: {
  value: number;
  label: string;
  maxValue?: number;
  color?: string;
  chartColor?: 'primary' | 'accent' | 'secondary' | 'tertiary';
  className?: string;
}) {
  return (
    <MetricCard
      value={value}
      label={label}
      color={color}
      showGauge
      maxValue={maxValue}
      chartColor={chartColor}
      className={className}
    />
  );
}

export function SparklineMetricCard({
  value,
  label,
  sparklineData,
  trendDirection,
  color = '#5B6EFF',
  chartColor = 'accent',
  className
}: {
  value: string | number;
  label: string;
  sparklineData: number[];
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: string;
  chartColor?: 'primary' | 'accent' | 'secondary' | 'tertiary';
  className?: string;
}) {
  return (
    <MetricCard
      value={value}
      label={label}
      color={color}
      showSparkline
      sparklineData={sparklineData}
      trendDirection={trendDirection}
      chartColor={chartColor}
      className={className}
    />
  );
}

export function FullFeaturedMetricCard({
  value,
  label,
  progressValue,
  sparklineData,
  maxValue = 100,
  trendDirection,
  color = '#5B6EFF',
  chartColor = 'accent',
  className
}: {
  value: string | number;
  label: string;
  progressValue: number;
  sparklineData: number[];
  maxValue?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: string;
  chartColor?: 'primary' | 'accent' | 'secondary' | 'tertiary';
  className?: string;
}) {
  const trend = sparklineData.length >= 2
    ? `${((sparklineData[sparklineData.length - 1] - sparklineData[sparklineData.length - 2]) / sparklineData[sparklineData.length - 2] * 100).toFixed(1)}%`
    : undefined;

  return (
    <MetricCard
      value={value}
      label={label}
      color={color}
      trend={trend}
      trendDirection={trendDirection}
      showProgress
      showGauge
      showSparkline
      progressValue={progressValue}
      sparklineData={sparklineData}
      maxValue={maxValue}
      chartColor={chartColor}
      className={className}
    />
  );
}