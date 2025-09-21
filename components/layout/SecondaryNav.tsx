"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  GitBranch,
  AlertTriangle,
  BarChart3,
  Bell,
  FileText,
  Database,
  Settings,
  Shield,
  Activity,
  Hammer,
  Package,
  Users,
  Key,
  Play,
  Layers,
  Wrench,
  Globe,
  Cable,
  Server,
  Gauge,
  Share2,
  CheckCircle,
  XCircle,
  Search,
  TrendingUp,
  Zap,
  Target,
  Brain,
  Sparkles,
  Filter,
  Clock,
  PlusCircle,
  Cog,
} from "lucide-react"

interface NavItem {
  id: string
  label: string
  href: string
  icon: any
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

interface SecondaryNavConfig {
  [key: string]: {
    title: string
    description: string
    items: NavItem[]
  }
}

const secondaryNavConfig: SecondaryNavConfig = {
  '/': {
    title: 'Overview',
    description: 'Mission control center',
    items: [
      { id: 'system-health', label: 'System Health', href: '/', icon: LayoutDashboard },
      { id: 'work-queue', label: 'My Work Queue', href: '/work-queue', icon: Clock },
      { id: 'team-activity', label: 'Team Activity', href: '/team-activity', icon: Users },
      { id: 'quick-launch', label: 'Quick Launch', href: '/quick-launch', icon: Zap },
    ]
  },
  '/build': {
    title: 'Build',
    description: 'Pipeline creation & patterns',
    items: [
      { id: 'create', label: 'Pipeline Creation', href: '/build', icon: PlusCircle },
      { id: 'patterns', label: 'Pattern Library', href: '/build/patterns', icon: Brain },
      { id: 'data-products', label: 'Data Product Definition', href: '/build/data-products', icon: Package },
      { id: 'templates', label: 'Template Management', href: '/build/templates', icon: Layers },
    ]
  },
  '/products': {
    title: 'Products',
    description: 'Data marketplace & insights',
    items: [
      { id: 'marketplace', label: 'Data Marketplace', href: '/products', icon: Globe },
      { id: 'quality', label: 'Quality Analytics', href: '/products/quality', icon: BarChart3 },
      { id: 'usage', label: 'Usage Insights', href: '/products/usage', icon: TrendingUp },
    ]
  },
  '/investigate': {
    title: 'Investigate',
    description: 'Issues & performance analysis',
    items: [
      { id: 'overview', label: 'Active Issues', href: '/investigate', icon: AlertTriangle },
      { id: 'performance', label: 'Performance Analysis', href: '/investigate/performance', icon: BarChart3 },
      { id: 'correlation', label: 'System Correlation', href: '/investigate/correlation', icon: Target },
    ]
  },
  '/platform': {
    title: 'Platform',
    description: 'Configuration & management',
    items: [
      { id: 'connections', label: 'Data Source Connections', href: '/platform/connections', icon: Database },
      { id: 'users', label: 'User Management', href: '/platform/users', icon: Users },
      { id: 'settings', label: 'System Settings', href: '/platform/settings', icon: Settings },
    ]
  }
}

export function SecondaryNav() {
  const pathname = usePathname()

  // Get the primary section from the pathname
  let primarySection = '/'
  const pathSegments = pathname.split('/')

  if (pathSegments[1]) {
    primarySection = '/' + pathSegments[1]
  }

  // Handle root path
  if (pathname === '/') {
    primarySection = '/'
  }

  const config = secondaryNavConfig[primarySection]

  if (!config) return null
  
  const isActive = (href: string) => {
    // Exact match for root
    if (href === '/') {
      return pathname === '/'
    }
    // For section landing pages, exact match
    if (href === '/build' || href === '/products' || href === '/investigate' || href === '/platform') {
      return pathname === href
    }
    // For sub-pages, check if pathname starts with href
    return pathname === href || pathname.startsWith(href + '/')
  }
  
  return (
    <div className="w-64 bg-gray-50 dark:bg-card border-r border-border flex flex-col h-full transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground font-reckless">{config.title}</h2>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>
      
      {/* Navigation Items */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {config.items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors mb-1",
                  "text-muted-foreground",
                  "",
                  active && "bg-primary/10 text-primary font-medium border border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant={item.badgeVariant || "default"} className="h-5 px-1.5">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}