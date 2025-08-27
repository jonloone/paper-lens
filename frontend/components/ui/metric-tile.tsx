import * as React from "react"
import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"
import { StatusBadge } from "./status-badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface MetricTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  status?: 'success' | 'warning' | 'error' | 'info'
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

const MetricTile = React.forwardRef<HTMLDivElement, MetricTileProps>(
  ({ 
    className, 
    label, 
    value, 
    change,
    changeLabel,
    status,
    icon,
    trend,
    ...props 
  }, ref) => {
    const getTrendIcon = () => {
      if (!trend && change !== undefined) {
        trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      }
      
      switch(trend) {
        case 'up':
          return <TrendingUp className="w-4 h-4" />
        case 'down':
          return <TrendingDown className="w-4 h-4" />
        case 'neutral':
          return <Minus className="w-4 h-4" />
        default:
          return null
      }
    }
    
    const getTrendColor = () => {
      switch(trend || (change !== undefined ? (change > 0 ? 'up' : 'down') : 'neutral')) {
        case 'up':
          return 'text-green-400'
        case 'down':
          return 'text-red-400'
        case 'neutral':
        default:
          return 'text-neutral-400'
      }
    }
    
    return (
      <GlassCard
        ref={ref}
        className={cn(
          "p-4 hover:scale-[1.01]",
          className
        )}
        variant="subtle"
        hover={false}
        {...props}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-neutral-400">
                {icon}
              </div>
            )}
            <span className="text-sm text-neutral-400">{label}</span>
          </div>
          {status && (
            <StatusBadge variant={status} size="sm">
              {status.toUpperCase()}
            </StatusBadge>
          )}
        </div>
        
        <div className="text-2xl font-semibold text-neutral-100 mb-2">
          {value}
        </div>
        
        {(change !== undefined || changeLabel) && (
          <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
            {getTrendIcon()}
            {change !== undefined && (
              <span>{change > 0 ? '+' : ''}{change}%</span>
            )}
            {changeLabel && (
              <span className="text-neutral-400 ml-1">{changeLabel}</span>
            )}
          </div>
        )}
      </GlassCard>
    )
  }
)
MetricTile.displayName = "MetricTile"

export { MetricTile }