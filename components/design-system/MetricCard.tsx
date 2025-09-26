'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export function MetricCard({
  value,
  label,
  trend,
  trendDirection = 'neutral',
  icon,
  color = '#5B6EFF',
  className
}: MetricCardProps) {
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
        return 'text-[#00E5C8] bg-[#00E5C8]/10';
      case 'down':
        return 'text-[#FF6B7A] bg-[#FF6B7A]/10';
      default:
        return 'text-muted-foreground bg-muted/50';
    }
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-6 transition-all duration-200",
        "hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        className
      )}
    >
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
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
            getTrendColor()
          )}>
            {getTrendIcon()}
            {trend}
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