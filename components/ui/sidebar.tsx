"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Menu } from "lucide-react"

interface SidebarContextValue {
  isCollapsed: boolean
  toggleCollapse: () => void
  setIsCollapsed: (value: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  const toggleCollapse = React.useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapse,
        setIsCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsible?: "icon" | "none"
}

export function Sidebar({
  className,
  children,
  collapsible = "icon",
  ...props
}: SidebarProps) {
  const { isCollapsed, toggleCollapse } = useSidebar()

  return (
    <aside
      className={cn(
        "flex flex-col border-r transition-all duration-300 h-full",
        isCollapsed ? "w-20 bg-[#080C17]" : "w-20 bg-[#080C17]",
        className
      )}
      {...props}
    >
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      {collapsible === "icon" && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className={cn(
              "w-full",
              isCollapsed && "justify-center"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      )}
    </aside>
  )
}

export function SidebarTrigger() {
  const { toggleCollapse } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCollapse}
      className="md:hidden"
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}

export function SidebarContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 p-4", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarGroupLabel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isCollapsed } = useSidebar()
  
  if (isCollapsed) return null
  
  return (
    <div
      className={cn(
        "px-3 py-2 text-xs font-medium text-muted-foreground uppercase",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarMenuItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarMenuButton({
  className,
  children,
  isActive,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) {
  const { isCollapsed } = useSidebar()
  
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
        isCollapsed && "justify-center px-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function SidebarHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-b px-4 py-3", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-t px-4 py-3 mt-auto", className)} {...props}>
      {children}
    </div>
  )
}