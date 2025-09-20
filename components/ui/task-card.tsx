import * as React from "react"
import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"
import { StatusBadge } from "./status-badge"
import { colors, spacing } from "@/lib/design-system"

export interface TaskCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  priority?: 'high' | 'medium' | 'low'
  tags?: string[]
  usageCount?: number
  estimatedTime?: string
  progress?: number
}

const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(
  ({ 
    className, 
    title, 
    description, 
    priority = 'medium',
    tags = [],
    usageCount,
    estimatedTime,
    progress,
    children,
    ...props 
  }, ref) => {
    return (
      <GlassCard
        ref={ref}
        className={cn(
          "group cursor-pointer",
          "bg-neutral-800 border border-neutral-700/60",
          "hover:border-neutral-600/80",
          className
        )}
        interactive
        {...props}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-100">
            {title}
          </h3>
          {priority && (
            <StatusBadge variant={priority} size="sm">
              {priority.toUpperCase()}
            </StatusBadge>
          )}
        </div>
        
        <p className="text-sm text-neutral-300 mb-4">
          {description}
        </p>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {(usageCount !== undefined || estimatedTime) && (
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-3">
            {usageCount !== undefined && <span>Used {usageCount} times</span>}
            {estimatedTime && <span>~{estimatedTime}</span>}
          </div>
        )}
        
        {progress !== undefined && (
          <div className="mt-3">
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  background: 'linear-gradient(90deg, #14B8A6 0%, #0D9488 100%)',
                  boxShadow: '0 1px 3px rgba(20, 184, 166, 0.3)'
                }}
              />
            </div>
          </div>
        )}
        
        {children}
      </GlassCard>
    )
  }
)
TaskCard.displayName = "TaskCard"

export { TaskCard }