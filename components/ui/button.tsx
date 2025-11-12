import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg text-sm font-medium",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Motion tokens - choreographed multi-property transition
    "[transition:var(--transition-button)]",
    // Active state - tactile press feel
    "active:scale-[0.98]",
    "active:translate-y-0"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary text-primary-foreground",
          "[box-shadow:var(--elevation-1)]",
          // Subtle gradient for depth
          "[background-image:linear-gradient(to_bottom,rgba(255,255,255,0.1),transparent)]",
          // Hover choreography
          "hover:bg-primary/90",
          "hover:[box-shadow:var(--elevation-2)]",
          "hover:-translate-y-0.5"
        ),
        destructive: cn(
          "bg-destructive text-destructive-foreground",
          "[box-shadow:var(--elevation-1)]",
          "[background-image:linear-gradient(to_bottom,rgba(255,255,255,0.1),transparent)]",
          "hover:bg-destructive/90",
          "hover:[box-shadow:var(--elevation-2)]",
          "hover:-translate-y-0.5"
        ),
        outline: cn(
          "border-2 border-input bg-background/50",
          "[box-shadow:var(--elevation-0)]",
          "hover:bg-accent hover:text-accent-foreground",
          "hover:border-accent",
          "hover:[box-shadow:var(--elevation-1)]",
          "hover:scale-[1.02]"
        ),
        secondary: cn(
          "bg-secondary text-secondary-foreground",
          "[box-shadow:var(--elevation-1)]",
          "hover:bg-secondary/80",
          "hover:[box-shadow:var(--elevation-2)]",
          "hover:-translate-y-0.5"
        ),
        ghost: cn(
          "hover:bg-accent/10 hover:text-accent-foreground",
          "hover:scale-105"
        ),
        link: cn(
          "text-primary underline-offset-4",
          "hover:underline hover:text-primary/80"
        ),
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
