import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showLabel?: boolean
}

const variantStyles = {
  default: 'bg-gradient-to-r from-[#14B8A6] to-[#0D9488]',
  success: 'bg-gradient-to-r from-green-500 to-green-600',
  warning: 'bg-gradient-to-r from-amber-500 to-amber-600',
  error: 'bg-gradient-to-r from-red-500 to-red-600',
  info: 'bg-gradient-to-r from-blue-500 to-blue-600',
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    variant = 'default',
    size = 'md',
    animated = true,
    showLabel = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    
    return (
      <div className="w-full">
        {showLabel && (
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "w-full bg-neutral-700 rounded-full overflow-hidden",
            sizeStyles[size],
            className
          )}
          {...props}
        >
          <div 
            className={cn(
              "h-full rounded-full",
              animated && "transition-all duration-300 ease-out",
              variantStyles[variant]
            )}
            style={{
              width: `${percentage}%`,
              boxShadow: variant === 'default' 
                ? '0 1px 3px rgba(20, 184, 166, 0.3)' 
                : undefined
            }}
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

export { ProgressBar }