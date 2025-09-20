import * as React from "react"
import { cn } from "@/lib/utils"
import { effects } from "@/lib/design-system"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'subtle' | 'card'
  hover?: boolean
  interactive?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'card', hover = true, interactive = false, children, ...props }, ref) => {
    const glassStyle = effects.glass[variant]
    
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg p-6 transition-all duration-200",
          hover && "hover:scale-[1.02] hover:shadow-xl",
          interactive && "cursor-pointer active:scale-[0.98]",
          className
        )}
        style={{
          ...glassStyle,
          ...props.style
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }