'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { StatusIcon, StatusType } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MoreHorizontal } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  status: StatusType;
  timestamp: string;
  user?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export function ActivityFeed({
  items,
  title = "Recent Activity",
  showViewAll = true,
  onViewAll,
  className
}: ActivityFeedProps) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-6",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-medium text-foreground">
          {title}
        </h3>
        {showViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-muted-foreground hover:text-foreground"
          >
            View All
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📋</div>
            <p>No recent activity</p>
          </div>
        ) : (
          items.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

function ActivityItem({ item }: { item: ActivityItem }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group">
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <StatusIcon status={item.status} size="sm" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground leading-5">
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-4">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <time>{item.timestamp}</time>
              {item.user && (
                <>
                  <span>•</span>
                  <span>{item.user}</span>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          {item.action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={item.action.onClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              {item.action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for sidebars
export function ActivityFeedCompact({
  items,
  title = "Activity",
  className
}: {
  items: ActivityItem[];
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="font-display text-sm font-medium text-foreground">
        {title}
      </h4>
      <div className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <StatusIcon status={item.status} size="sm" />
            <span className="flex-1 truncate text-foreground">{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Example usage component
export function ActivityFeedExample() {
  const sampleItems: ActivityItem[] = [
    {
      id: '1',
      title: 'customer_etl_pipeline completed successfully',
      description: 'Processed 125,847 records in 12m 34s',
      status: 'success',
      timestamp: '2 minutes ago',
      user: 'Sarah Chen',
      action: {
        label: 'View Details',
        onClick: () => console.log('View pipeline details')
      }
    },
    {
      id: '2',
      title: 'product_sync_pipeline failed',
      description: 'Connection timeout to external API',
      status: 'failed',
      timestamp: '5 minutes ago',
      user: 'System',
      action: {
        label: 'Retry',
        onClick: () => console.log('Retry pipeline')
      }
    },
    {
      id: '3',
      title: 'data_quality_check completed with warnings',
      description: '3 validation rules failed for orders table',
      status: 'warning',
      timestamp: '8 minutes ago',
      user: 'Mike Johnson',
      action: {
        label: 'Review',
        onClick: () => console.log('Review quality check')
      }
    },
    {
      id: '4',
      title: 'analytics_pipeline is now running',
      description: 'Processing daily analytics aggregation',
      status: 'running',
      timestamp: '12 minutes ago',
      user: 'Lisa Wang'
    },
    {
      id: '5',
      title: 'ml_training_pipeline queued',
      description: 'Waiting for compute resources',
      status: 'pending',
      timestamp: '15 minutes ago',
      user: 'David Kim'
    }
  ];

  return (
    <ActivityFeed
      items={sampleItems}
      onViewAll={() => console.log('View all activities')}
    />
  );
}