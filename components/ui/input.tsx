import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles with enhanced depth
          "flex h-10 w-full rounded-md px-3 py-2 text-sm",
          "bg-input/10 border-2 border-input/40 ring-1 ring-input/20",

          // Transitions
          "transition-all duration-200",

          // Hover state - subtle feedback
          "hover:bg-input/20 hover:border-input/60",

          // Focus state - clear active indication
          "focus-visible:outline-none focus-visible:bg-card",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50",

          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",

          // Placeholder
          "placeholder:text-muted-foreground/60",

          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/20",

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
