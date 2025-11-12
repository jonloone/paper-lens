import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    elevation?: 'flat' | 'subtle' | 'base' | 'raised' | 'floating'
    surface?: 'default' | 'glass' | 'gradient' | 'bordered'
    interactive?: boolean
  }
>(({ className, elevation = 'base', surface = 'default', interactive = false, ...props }, ref) => {
  // Elevation system using CSS custom properties
  const elevationStyles = {
    'flat': '[box-shadow:var(--elevation-0)]',
    'subtle': '[box-shadow:var(--elevation-1)]',
    'base': '[box-shadow:var(--elevation-2)]',
    'raised': '[box-shadow:var(--elevation-3)]',
    'floating': '[box-shadow:var(--elevation-4)]'
  };

  // Surface treatment options
  const surfaceStyles = {
    'default': 'bg-card border border-border/40',
    'glass': 'bg-card/80 backdrop-blur-md border border-border/20',
    'gradient': 'bg-gradient-to-br from-card to-card/95 border border-border/30',
    'bordered': 'bg-card border-2 border-border/50'
  };

  // Rich interaction states (Atomize-inspired)
  const interactiveStyles = interactive
    ? cn(
        'cursor-pointer group',
        '[transition:var(--transition-card)]',
        'hover:[box-shadow:var(--elevation-3)]',
        'hover:border-border/60',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
        'active:[box-shadow:var(--elevation-1)]'
      )
    : '[transition:var(--transition-shadow)]';

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl text-card-foreground",
        "relative overflow-hidden",
        elevationStyles[elevation],
        surfaceStyles[surface],
        interactiveStyles,
        className
      )}
      {...props}
    />
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
