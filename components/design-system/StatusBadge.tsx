'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';

export type StatusType = 'running' | 'success' | 'failed' | 'pending' | 'paused' | 'warning';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<StatusType, {
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  pulseColor?: string;
}> = {
  running: {
    label: 'Running',
    icon: Play,
    color: '#5B6EFF',
    bgColor: 'rgba(91, 110, 255, 0.1)',
    pulseColor: 'rgba(91, 110, 255, 0.4)'
  },
  success: {
    label: 'Success',
    icon: CheckCircle2,
    color: '#00E5C8',
    bgColor: 'rgba(0, 229, 200, 0.1)'
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: '#FF6B7A',
    bgColor: 'rgba(255, 107, 122, 0.1)'
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: '#FFB366',
    bgColor: 'rgba(255, 179, 102, 0.1)'
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: '#8B8B8B',
    bgColor: 'rgba(139, 139, 139, 0.1)'
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    color: '#FFB366',
    bgColor: 'rgba(255, 179, 102, 0.1)'
  }
};

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = 'md',
  className
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-medium transition-all",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color
      }}
    >
      {showIcon && (
        <div className="relative">
          <Icon className={iconSizes[size]} />
          {status === 'running' && (
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: config.pulseColor }}
            />
          )}
        </div>
      )}
      {displayLabel}
    </div>
  );
}

// Status dot component for minimal displays
export function StatusDot({ status, className }: { status: StatusType; className?: string }) {
  const config = statusConfig[status];

  return (
    <div
      className={cn("w-2 h-2 rounded-full", className)}
      style={{ backgroundColor: config.color }}
    />
  );
}

// Status icon only
export function StatusIcon({ status, size = 'md', className }: {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="relative">
      <Icon
        className={cn(iconSizes[size], className)}
        style={{ color: config.color }}
      />
      {status === 'running' && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: `${config.color}40` }}
        />
      )}
    </div>
  );
}