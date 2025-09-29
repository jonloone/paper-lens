"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { IDELogo } from "@/components/ui/logo-ide"
import { UnifiedIcon, usePixelIcons } from "@/components/ui/unified-icon"
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { SettingsSheet } from "@/components/ui/settings-sheet"
import { Sparkles, Terminal, Wrench, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { AIAssistant } from "@/components/ai/AIAssistant"
import { SQLEditor } from "@/components/tools/SQLEditor"

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

interface ExternalTool {
  id: string
  name: string
  description: string
  url: string
  icon: string
  category: string
  lastUsed?: string
  usageCount?: number
}

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [aiAssistantOpen, setAiAssistantOpen] = React.useState(false)
  const [sqlEditorOpen, setSqlEditorOpen] = React.useState(false)
  const [toolsOpen, setToolsOpen] = React.useState(false)
  const [externalTools, setExternalTools] = React.useState<ExternalTool[]>([])
  const [toolsLoading, setToolsLoading] = React.useState(true)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch external tools entitlements
  React.useEffect(() => {
    const fetchEntitlements = async () => {
      try {
        const response = await fetch('/api/user/entitlements')
        const data = await response.json()
        setExternalTools(data.tools || [])
      } catch (error) {
        console.error('Failed to fetch entitlements:', error)
      } finally {
        setToolsLoading(false)
      }
    }

    fetchEntitlements()
  }, [])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // CMD+K for AI Assistant
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setAiAssistantOpen(prev => !prev)
      }
      // CMD+; for SQL Editor
      if ((e.metaKey || e.ctrlKey) && e.key === ';') {
        e.preventDefault()
        setSqlEditorOpen(prev => !prev)
      }
      // CMD+T for Tools menu
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault()
        setToolsOpen(prev => !prev)
      }
      // ESC to close all
      if (e.key === 'Escape') {
        setAiAssistantOpen(false)
        setSqlEditorOpen(false)
        setToolsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const isActive = (href: string) => {
    if (href === "/") {
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

  const isWin98 = theme === 'win98';

  return (
    <>
      <div className={cn(
        "w-20 bg-sidebar backdrop-blur-sm border-r border-sidebar-border flex flex-col min-h-full transition-colors duration-200",
        isWin98 && "win98-sidebar"
      )}>
        {/* Logo */}
        <div className={cn(
          "p-4 flex items-center justify-center border-b border-border",
          isWin98 && "win98-logo-section"
        )}>
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
          {coreNavigation.map((item, index) => {
            const active = isActive(item.href)
            const shouldUsePixelIcons = usePixelIcons(theme)
            const opacity = 0.4 + (index * 0.15)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "h-16 w-14 flex flex-col items-center justify-center rounded-lg",
                  "text-muted-foreground",
                  "transition-all duration-200",
                  "hover:opacity-100",
                  active && "text-primary bg-primary/10 border border-primary/20 !opacity-100",
                  isWin98 && "!text-black hover:!bg-white/50",
                  isWin98 && active && "!bg-white !text-black"
                )}
                style={!active && !isWin98 ? { opacity } : {}}
              >
                <UnifiedIcon
                  name={item.icon}
                  className={cn("mb-1", isWin98 && "!text-black")}
                  size="lg"
                  theme={theme}
                />
                <span className={cn(
                  "text-[13px] font-medium leading-tight text-center font-reckless",
                  isWin98 && "!text-black"
                )}>
                  {item.title}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Tools Section - 3 Essential Tools */}
        <div className="border-t border-border px-3 py-3">
          <TooltipProvider>
            <nav className="flex flex-col space-y-2">

              {/* AI Assistant */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-14 w-14 flex flex-col items-center justify-center",
                      aiAssistantOpen && "bg-primary/10 text-primary"
                    )}
                    onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                  >
                    <Sparkles className="h-5 w-5 mb-1" />
                    <span className="text-[11px] font-medium">AI</span>
                    <kbd className="text-[9px] text-muted-foreground">⌘K</kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>AI Assistant (⌘K)</p>
                </TooltipContent>
              </Tooltip>

              {/* SQL Editor */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-14 w-14 flex flex-col items-center justify-center",
                      sqlEditorOpen && "bg-primary/10 text-primary"
                    )}
                    onClick={() => setSqlEditorOpen(!sqlEditorOpen)}
                  >
                    <Terminal className="h-5 w-5 mb-1" />
                    <span className="text-[11px] font-medium">SQL</span>
                    <kbd className="text-[9px] text-muted-foreground">⌘;</kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>SQL Editor (⌘;)</p>
                </TooltipContent>
              </Tooltip>

              {/* External Tools */}
              <Popover open={toolsOpen} onOpenChange={setToolsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-14 w-14 flex flex-col items-center justify-center relative",
                      toolsOpen && "bg-primary/10 text-primary"
                    )}
                  >
                    <Wrench className="h-5 w-5 mb-1" />
                    <span className="text-[11px] font-medium">Tools</span>
                    <Badge
                      variant="default"
                      className="absolute -top-1 -right-1 h-4 px-1 text-[10px]"
                    >
                      {externalTools.length}
                    </Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  className="w-80 p-0"
                  sideOffset={16}
                >
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-medium">External Tools</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your entitled enterprise tools
                    </p>
                  </div>
                  <div className="p-2 max-h-[400px] overflow-auto">
                    {toolsLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading tools...
                      </div>
                    ) : externalTools.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No tools available
                      </div>
                    ) : (
                      externalTools.map((tool) => (
                      <a
                        key={tool.id}
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg",
                          "hover:bg-accent transition-colors",
                          "cursor-pointer group"
                        )}
                      >
                        <span className="text-xl">{tool.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{tool.name}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                      </a>
                    )))}
                  </div>
                </PopoverContent>
              </Popover>

            </nav>
          </TooltipProvider>
        </div>

        {/* Footer Items */}
        <div className="border-t border-border px-3 py-3">
          <nav className="flex flex-col space-y-2">
            {/* Dark Mode Toggle */}
            <div className="flex flex-col items-center space-y-1">
              <DarkModeToggle />
              <span className={cn(
                "text-[11px] font-medium leading-tight text-center font-reckless text-muted-foreground",
                isWin98 && "!text-black"
              )}>
                Day/Night
              </span>
            </div>

            {/* Theme Switcher */}
            <div className="flex flex-col items-center space-y-1">
              <ThemeSwitcher />
              <span className={cn(
                "text-[11px] font-medium leading-tight text-center font-reckless text-muted-foreground",
                isWin98 && "!text-black"
              )}>
                Theme
              </span>
            </div>

            {/* Settings Sheet */}
            <SettingsSheet />
          </nav>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {aiAssistantOpen && (
        <AIAssistant
          isOpen={aiAssistantOpen}
          onClose={() => setAiAssistantOpen(false)}
        />
      )}

      {/* SQL Editor Panel */}
      {sqlEditorOpen && (
        <SQLEditor
          isOpen={sqlEditorOpen}
          onClose={() => setSqlEditorOpen(false)}
        />
      )}
    </>
  )
}