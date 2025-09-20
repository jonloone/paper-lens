import * as React from "react"
import { cn } from "@/lib/utils"

export interface TabNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: {
    id: string
    label: string
    badge?: number | string
    active?: boolean
    onClick?: () => void
  }[]
}

const TabNavigation = React.forwardRef<HTMLDivElement, TabNavigationProps>(
  ({ className, tabs, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-1 p-1 bg-neutral-800 rounded-lg",
          className
        )}
        {...props}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={tab.onClick}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              "text-neutral-400 hover:text-neutral-300",
              tab.active && "bg-neutral-700 text-neutral-100 border border-neutral-600"
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-2 bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full text-xs">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }
)
TabNavigation.displayName = "TabNavigation"

export { TabNavigation }