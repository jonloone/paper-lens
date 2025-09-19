"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Database,
  BarChart3,
  Hammer,
  Package,
  Settings,
  Users,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const coreNavigation = [
  {
    title: "Connect",
    href: "/connections",
    icon: Database,
  },
  {
    title: "Monitor", 
    href: "/monitor",
    icon: BarChart3,
  },
  {
    title: "Build",
    href: "/build",
    icon: Hammer,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="w-20 bg-gray-950 dark:bg-background flex flex-col h-full transition-colors duration-200">
      {/* Logo */}
      <div className="p-4 flex items-center justify-center border-b border-border">
        <Link href="/" className="flex items-center justify-center">
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 57 57" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M28.2843 -9.10759e-05L56.5685 28.2842L28.2843 56.5685L15.7138 43.998L31.4276 28.2842L15.7138 12.5704L28.2843 -9.10759e-05ZM40.8561 28.2842L25.1423 43.998L28.2843 47.1399L47.14 28.2842L28.2843 9.42846L25.1423 12.5704L40.8561 28.2842Z" fill="#3b82f6"/>
            <path d="M25.4559 28.2838L12.728 41.0117L8.48518 36.7689L16.9703 28.2838L8.48518 19.7987L12.728 15.5559L25.4559 28.2838Z" fill="#3b82f6"/>
            <path d="M5.65685 22.6273L11.3137 28.2842L5.65685 33.941L2.82843 31.1126L5.65685 28.2842L2.82843 25.4558L5.65685 22.6273Z" fill="#3b82f6"/>
          </svg>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col space-y-2 px-3 py-4">
        {coreNavigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "h-16 w-14 flex flex-col items-center justify-center rounded-lg",
                "text-muted-foreground ",
                "transition-colors duration-200",
                active && "text-primary bg-primary/10 border border-primary/20"
              )}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-[11px] font-medium leading-tight text-center font-reckless">
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Items */}
      <div className="border-t border-border px-3 py-3">
        <nav className="flex flex-col space-y-2">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "h-14 w-14 flex flex-col items-center justify-center rounded-lg",
                "text-muted-foreground ",
                "transition-colors duration-200"
              )}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 mb-1" />
              ) : (
                <Moon className="h-5 w-5 mb-1" />
              )}
              <span className="text-[11px] font-medium leading-tight text-center font-reckless">
                Theme
              </span>
            </button>
          )}
          
          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "h-14 w-14 flex flex-col items-center justify-center rounded-lg",
              "text-muted-foreground ",
              "transition-colors duration-200",
              isActive("/settings") && "text-primary bg-primary/10 border border-primary/20"
            )}
          >
            <Settings className="h-5 w-5 mb-1" />
            <span className="text-[11px] font-medium leading-tight text-center font-reckless">
              Settings
            </span>
          </Link>
        </nav>
      </div>
    </div>
  )
}