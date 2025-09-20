'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Code2, 
  Layers3,
  Briefcase,
  Terminal,
  GitBranch
} from 'lucide-react';

export type ViewMode = 'business' | 'hybrid' | 'technical';

interface ViewModeSelectorProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

const viewModeConfig = {
  business: {
    label: 'Business',
    icon: Building2,
    description: 'Show business context primarily',
    details: 'Customer Intelligence → Sales Analytics',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    tooltip: 'Focus on business purpose, stakeholders, and value'
  },
  hybrid: {
    label: 'Hybrid',
    icon: Layers3,
    description: 'Show both business and technical',
    details: 'Customer Intelligence (customer_etl_v2)',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    tooltip: 'Balance business context with technical details'
  },
  technical: {
    label: 'Technical',
    icon: Terminal,
    description: 'Show technical details primarily', 
    details: 'customer_etl_v2 → analytics.customer_golden',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    tooltip: 'Focus on tables, IDs, and system details'
  }
} as const;

export function ViewModeSelector({ mode, onChange, className }: ViewModeSelectorProps) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-muted rounded-lg ${className || ''}`}>
      {Object.entries(viewModeConfig).map(([key, config]) => {
        const viewMode = key as ViewMode;
        const isActive = mode === viewMode;
        const Icon = config.icon;
        
        return (
          <Button
            key={viewMode}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onChange(viewMode)}
            className={`flex items-center gap-2 relative ${
              isActive 
                ? `${config.color} ${config.bgColor} shadow-sm` 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={config.tooltip}
          >
            <Icon className="h-4 w-4" />
            <span className="font-normal">{config.label}</span>
            {isActive && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-current" />
            )}
          </Button>
        );
      })}
    </div>
  );
}

export function ViewModeExample({ mode }: { mode: ViewMode }) {
  const config = viewModeConfig[mode];
  
  return (
    <div className="text-xs text-muted-foreground mt-2">
      <span className="font-medium">Example:</span> {config.details}
    </div>
  );
}