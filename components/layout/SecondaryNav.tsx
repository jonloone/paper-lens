"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
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
  HeartHandshake,
  Plug,
  ListChecks,
  ShoppingBag,
  BookOpen,
  UserCheck,
  Lock,
  LineChart,
  UserCog,
  BarChart,
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
    title: 'Monitor',
    description: 'Engineering-first operational intelligence',
    items: [
      { id: 'tool-health', label: 'Tool Health', href: '/', icon: Activity },
      { id: 'data-quality', label: 'Data Quality Dashboard', href: '/quality-dashboard', icon: HeartHandshake },
      { id: 'active-incidents', label: 'Active Incidents', href: '/incidents', icon: AlertTriangle },
      { id: 'domain-health', label: 'Domain Health', href: '/domain-health', icon: Target },
    ]
  },
  '/build': {
    title: 'Build',
    description: 'Domain-driven development workflows',
    items: [
      { id: 'domains', label: 'Domains', href: '/build', icon: Layers },
      { id: 'projects', label: 'Projects', href: '/build/projects', icon: GitBranch },
      { id: 'requests', label: 'Requests', href: '/build/requests', icon: Share2 },
      { id: 'schema', label: 'Schema', href: '/build/schema', icon: Database },
    ]
  },
  '/catalog': {
    title: 'Catalog',
    description: 'Data discovery & consumption',
    items: [
      { id: 'data-product-marketplace', label: 'Product Marketplace', href: '/catalog', icon: ShoppingBag },
      { id: 'query-workspace', label: 'Query Workspace', href: '/catalog/query', icon: Database },
      { id: 'schema-explorer', label: 'Schema Explorer', href: '/catalog/schemas', icon: Search },
      { id: 'api-documentation', label: 'API Documentation', href: '/catalog/api-docs', icon: FileText },
    ]
  },
  '/manage': {
    title: 'Manage',
    description: 'Platform administration',
    items: [
      { id: 'governance-overview', label: 'Governance Overview', href: '/manage', icon: Shield },
      { id: 'source-connections', label: 'Source Connections', href: '/sources', icon: Cable },
      { id: 'connection-setup', label: 'Connection Setup', href: '/connections', icon: Plug },
      { id: 'security-access', label: 'Security & Access', href: '/manage/security', icon: Lock },
      { id: 'user-administration', label: 'User Administration', href: '/manage/users', icon: UserCog },
    ]
  }
}

export function SecondaryNav() {
  const pathname = usePathname()
  const { theme } = useTheme()

  // Get the primary section from the pathname
  let primarySection = '/'
  const pathSegments = pathname.split('/')

  // Check if this is a Monitor section page
  const monitorPages = [
    '/',
    '/quality-dashboard',
    '/incidents',
    '/domain-health'
  ]

  // Check if this is a Catalog section page (includes catalog and playground pages)
  const catalogPages = [
    '/catalog',
    '/playground'
  ]

  // Check if this is a Manage section page (includes sources and connections)
  const managePages = [
    '/manage',
    '/sources',
    '/connections'
  ]

  if (monitorPages.includes(pathname) || monitorPages.some(page => page !== '/' && pathname.startsWith(page))) {
    primarySection = '/'
  } else if (catalogPages.some(page => pathname.startsWith(page))) {
    primarySection = '/catalog'
  } else if (managePages.some(page => pathname.startsWith(page))) {
    primarySection = '/manage'
  } else if (pathSegments[1]) {
    primarySection = '/' + pathSegments[1]
  }

  const config = secondaryNavConfig[primarySection]

  if (!config) return null
  
  const isActive = (href: string) => {
    // Exact match for root
    if (href === '/') {
      return pathname === '/'
    }
    // For section landing pages, exact match
    if (href === '/build' || href === '/catalog' || href === '/manage') {
      return pathname === href
    }
    // For sub-pages, exact match or starts with
    return pathname === href || pathname.startsWith(href + '/')
  }
  
  const isWin98 = theme === 'win98';

  return (
    <div className={cn(
      "w-64 bg-secondary/30 border-r border-border flex flex-col min-h-full transition-colors duration-200",
      isWin98 && "win98-secondary-nav win98-window"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 border-b border-border bg-secondary/50 backdrop-blur-sm z-10",
        isWin98 && "win98-titlebar p-2 border-b-2"
      )}>
        <h2 className={cn(
          "text-xl font-semibold text-foreground font-reckless",
          isWin98 && "text-white text-sm font-bold"
        )}>{config.title}</h2>
      </div>

      {/* Navigation Items - No ScrollArea needed */}
      <div className="flex-1 p-2">
        {config.items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-[15px] transition-all",
                "text-muted-foreground hover:text-foreground hover:bg-accent",
                active ? "bg-primary/10 text-primary font-medium border border-primary/20" : ""
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="leading-5">{item.label}</span>
              </div>
              {item.badge && (
                <Badge variant={item.badgeVariant || "default"} className="h-5 px-2 text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}