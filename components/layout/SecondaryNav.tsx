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
  '/connections': {
    title: 'Connections',
    description: 'Data sources & integrations',
    items: [
      { id: 'overview', label: 'Overview', href: '/connections', icon: LayoutDashboard },
      { id: 'sources', label: 'Data Sources', href: '/connections/sources', icon: Database },
      { id: 'health', label: 'Connection Health', href: '/connections/health', icon: Activity },
      { id: 'add', label: 'Add Connection', href: '/connections/add', icon: Cable },
      { id: 'troubleshoot', label: 'Troubleshooting', href: '/connections/troubleshoot', icon: AlertTriangle },
      { id: 'settings', label: 'Settings', href: '/connections/settings', icon: Settings },
    ]
  },
  '/monitor': {
    title: 'Monitor',
    description: 'System health & performance',
    items: [
      { id: 'overview', label: 'System Overview', href: '/monitor', icon: LayoutDashboard },
      { id: 'pipelines', label: 'Pipeline Monitor', href: '/monitor/pipelines', icon: GitBranch, badge: '2', badgeVariant: 'destructive' },
      { id: 'incidents', label: 'Active Incidents', href: '/monitor/incidents', icon: AlertTriangle, badge: '3', badgeVariant: 'secondary' },
      { id: 'performance', label: 'Performance', href: '/monitor/performance', icon: BarChart3 },
      { id: 'alerts', label: 'Alert Rules', href: '/monitor/alerts', icon: Bell },
      { id: 'logs', label: 'System Logs', href: '/monitor/logs', icon: FileText },
      { id: 'health', label: 'Health Checks', href: '/monitor/health', icon: CheckCircle },
    ]
  },
  '/build': {
    title: 'Build',
    description: 'Create & develop pipelines',
    items: [
      { id: 'studio', label: 'Pipeline Studio', href: '/build', icon: Wrench },
      { id: 'queries', label: 'Query Library', href: '/build/queries', icon: Database },
      { id: 'templates', label: 'Templates', href: '/build/templates', icon: Layers },
      { id: 'deploy', label: 'Deployment', href: '/build/deploy', icon: Play },
      { id: 'test', label: 'Testing', href: '/build/test', icon: CheckCircle },
      { id: 'version', label: 'Version Control', href: '/build/version', icon: GitBranch },
    ]
  },
  '/products': {
    title: 'Products',
    description: 'Data product management',
    items: [
      { id: 'catalog', label: 'Product Catalog', href: '/products', icon: Package },
      { id: 'create', label: 'Create Product', href: '/products/create', icon: Hammer },
      { id: 'quality', label: 'Quality Standards', href: '/products/quality', icon: Shield },
      { id: 'access', label: 'Access Control', href: '/products/access', icon: Key },
      { id: 'usage', label: 'Usage Analytics', href: '/products/usage', icon: BarChart3 },
      { id: 'marketplace', label: 'Marketplace', href: '/products/marketplace', icon: Globe },
    ]
  },
  '/govern': {
    title: 'Govern',
    description: 'Governance & compliance',
    items: [
      { id: 'overview', label: 'Overview', href: '/govern', icon: Shield },
      { id: 'policies', label: 'Policies', href: '/govern/policies', icon: FileText },
      { id: 'compliance', label: 'Compliance', href: '/govern/compliance', icon: CheckCircle },
      { id: 'access', label: 'Access Control', href: '/govern/access', icon: Key },
      { id: 'audit', label: 'Audit Logs', href: '/govern/audit', icon: FileText },
      { id: 'share', label: 'Sharing Rules', href: '/govern/share', icon: Share2 },
    ]
  }
}

export function SecondaryNav() {
  const pathname = usePathname()
  
  // Get the primary section from the pathname
  const primarySection = '/' + pathname.split('/')[1]
  const config = secondaryNavConfig[primarySection]
  
  if (!config) return null
  
  const isActive = (href: string) => {
    if (href === primarySection) {
      // For the overview page, exact match
      return pathname === href
    }
    // For sub-pages, check if pathname starts with href
    return pathname.startsWith(href)
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