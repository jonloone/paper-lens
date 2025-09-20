'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Layers3,
  Terminal
} from 'lucide-react';
import { useViewModeWithFallback, ViewMode } from '@/contexts/ViewModeContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const viewModeConfig = {
  business: {
    label: 'Business',
    icon: Building2,
    description: 'Show business names primarily',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    tooltip: 'Focus on business context and purpose'
  },
  hybrid: {
    label: 'Hybrid',
    icon: Layers3,
    description: 'Show both business and technical',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    tooltip: 'Balance business context with technical details'
  },
  technical: {
    label: 'Technical',
    icon: Terminal,
    description: 'Show technical names primarily', 
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    tooltip: 'Focus on technical identifiers and system details'
  }
} as const;

interface ViewModeToggleProps {
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
}

export function ViewModeToggle({ variant = 'default', className }: ViewModeToggleProps) {
  const { viewMode, setViewMode } = useViewModeWithFallback();

  if (variant === 'icon') {
    const Icon = viewModeConfig[viewMode].icon;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const modes: ViewMode[] = ['business', 'hybrid', 'technical'];
                const currentIndex = modes.indexOf(viewMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                setViewMode(modes[nextIndex]);
              }}
              className={cn("h-8 w-8 p-0", className)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">View Mode: {viewModeConfig[viewMode].label}</p>
            <p className="text-xs text-muted-foreground">Click to toggle</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1 p-0.5 bg-muted rounded", className)}>
        {Object.entries(viewModeConfig).map(([key, config]) => {
          const mode = key as ViewMode;
          const Icon = config.icon;
          const isActive = viewMode === mode;
          
          return (
            <TooltipProvider key={mode}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "h-7 w-7 p-0",
                      isActive && config.color
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{config.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      {Object.entries(viewModeConfig).map(([key, config]) => {
        const mode = key as ViewMode;
        const Icon = config.icon;
        const isActive = viewMode === mode;
        
        return (
          <Button
            key={mode}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex items-center gap-2 relative",
              isActive 
                ? `${config.color} ${config.bgColor} shadow-sm` 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={config.tooltip}
          >
            <Icon className="h-4 w-4" />
            <span className="font-normal text-xs">{config.label}</span>
            {isActive && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-current" />
            )}
          </Button>
        );
      })}
    </div>
  );
}