'use client';

import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Users, CheckCircle } from 'lucide-react';

interface FitnessIndicatorsProps {
  quality: {
    dataQuality: number;
  };
  freshness: {
    updateFrequency: string;
  };
  usage: {
    uniqueConsumers: number;
  };
  sla: {
    uptime: number;
  };
}

export function FitnessIndicators({ quality, freshness, usage, sla }: FitnessIndicatorsProps) {
  const getQualityColor = (score: number) => {
    if (score >= 95) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (score >= 85) return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    if (score >= 70) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  };

  const getStatusColor = (uptime: number) => {
    if (uptime >= 99) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (uptime >= 95) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  };

  const getStatusLabel = (uptime: number) => {
    if (uptime >= 99) return 'Production';
    if (uptime >= 95) return 'Degraded';
    return 'Offline';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Quality Score */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Quality</div>
          <Badge variant="outline" className={`text-sm font-semibold ${getQualityColor(quality.dataQuality)}`}>
            {quality.dataQuality}%
          </Badge>
        </div>
      </div>

      {/* Freshness */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Freshness</div>
          <div className="text-sm font-semibold">
            {freshness.updateFrequency}
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Users</div>
          <div className="text-sm font-semibold">
            {usage.uniqueConsumers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Status</div>
          <Badge variant="outline" className={`text-sm font-semibold ${getStatusColor(sla.uptime)}`}>
            {getStatusLabel(sla.uptime)}
          </Badge>
        </div>
      </div>
    </div>
  );
}
