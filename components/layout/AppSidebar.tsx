"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { IDELogo } from "@/components/ui/logo-ide"
import { UnifiedIcon, usePixelIcons } from "@/components/ui/unified-icon"
import { SettingsSheet } from "@/components/ui/settings-sheet"

const coreNavigation = [
  {
    title: "Monitor",
    href: "/",
    icon: "Activity",
  },
  {
    title: "Build",
    href: "/build",
    icon: "Hammer",
  },
  {
    title: "Catalog",
    href: "/catalog",
    icon: "Database",
  },
  {
    title: "Manage",
    href: "/manage",
    icon: "Shield",
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
      // For Overview, check if it's the root or one of the Overview sub-pages
      const overviewPages = [
        "/",
        "/system-health",
        "/data-product-health",
        "/sources",
        "/active-operations",
        "/incidents"
      ]
      return overviewPages.includes(pathname)
    }
    return pathname.startsWith(href)
  }

  // Add Windows 98 specific class if theme is win98
  const isWin98 = theme === 'win98';

  return (
    <div className={cn(
      "w-20 bg-sidebar-background dark:bg-background flex flex-col h-full transition-colors duration-200",
      isWin98 && "win98-sidebar"
    )}>
      {/* Logo */}
      <div className="p-4 flex items-center justify-center border-b border-border">
        <Link href="/" className="flex items-center justify-center">
          {mounted && (theme === 'one-dark-pro' || theme === 'gruvbox' || theme === 'dracula' || theme === 'solarized-light') ? (
            <IDELogo className={cn(
              "h-10 w-10",
              theme === 'one-dark-pro' ? "text-onedark-purple" :
              theme === 'gruvbox' ? "text-gruvbox-orange" :
              theme === 'dracula' ? "text-dracula-purple" :
              "text-blue-500"
            )} />
          ) : (
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
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col space-y-2 px-3 py-4">
        {coreNavigation.map((item) => {
          const active = isActive(item.href)
          const shouldUsePixelIcons = usePixelIcons(theme)

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
              <UnifiedIcon
                name={item.icon}
                className="mb-1"
                size="lg"
                theme={theme}
              />
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
          {/* Settings Sheet */}
          <SettingsSheet />
        </nav>
      </div>
    </div>
  )
}