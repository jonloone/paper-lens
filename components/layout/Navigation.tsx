'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Search,
  GitBranch,
  Database,
  Activity,
  Home,
  ChevronDown,
  Shield,
  Terminal,
  Package,
  Zap,
  Settings,
  LineChart,
  AlertTriangle,
  Server,
  Link as LinkIcon,
  Wrench,
  BarChart3,
  ShoppingCart,
  Globe,
  Layers,
  Play,
  Users,
  Key,
  Cable,
  Gauge,
  Hammer,
  Share2
} from 'lucide-react';
import { NexusOneLogo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ToolStatusBar } from '@/components/layout/ToolStatusBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  hasDropdown?: boolean;
  isEmphasized?: boolean;
  dropdownItems?: Array<{
    href: string;
    label: string;
    icon: any;
    description: string;
  }>;
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  const navItems: NavItem[] = [
    { 
      href: '/connections', 
      label: 'Connections & Sources', 
      icon: Cable,
      hasDropdown: true,
      isEmphasized: false,
      dropdownItems: [
        { href: '/connections', label: 'Connection Health', icon: Activity, description: 'Monitor data source reliability' },
        { href: '/connections?tab=add', label: 'Add New Connection', icon: Settings, description: 'Connect new data sources' },
        { href: '/connections?tab=troubleshoot', label: 'Troubleshooting', icon: AlertTriangle, description: 'Resolve connection issues' }
      ]
    },
    { 
      href: '/monitor', 
      label: 'Monitor', 
      icon: Gauge
    },
    {
      href: '/build',
      label: 'Build & Deploy',
      icon: Hammer,
      hasDropdown: true,
      isEmphasized: false,
      dropdownItems: [
        { href: '/build', label: 'Pipeline Studio', icon: Wrench, description: 'Create data pipelines' },
        { href: '/query', label: 'Query Library', icon: Database, description: 'Manage and organize SQL queries' },
        { href: '/build?tab=templates', label: 'Templates', icon: Layers, description: 'Reusable patterns' },
        { href: '/build?tab=deploy', label: 'Deployment', icon: Play, description: 'Deploy to production' }
      ]
    },
    {
      href: '/govern',
      label: 'Govern & Share',
      icon: Share2,
      hasDropdown: true,
      isEmphasized: false,
      dropdownItems: [
        { href: '/govern', label: 'Data Products', icon: Package, description: 'Product catalog' },
        { href: '/govern?tab=access', label: 'Access Control', icon: Shield, description: 'Manage permissions' },
        { href: '/govern?tab=compliance', label: 'Compliance', icon: Key, description: 'Governance policies' },
        { href: '/govern?tab=share', label: 'Marketplace', icon: Users, description: 'Share data products' }
      ]
    }
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="header-nav h-14">
        <Link href="/" className="nav-logo">
          <NexusOneLogo className="h-6 text-foreground hover:opacity-80 transition-opacity" />
        </Link>
        
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
                           (item.href !== '/' && pathname.startsWith(item.href));
            
            if (item.hasDropdown) {
              return (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md",
                        isActive 
                          ? "text-primary bg-muted" 
                          : "text-muted-foreground",
                        item.isEmphasized && "relative"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {item.isEmphasized && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                      )}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {item.dropdownItems?.map((dropdownItem, index) => {
                      const DropdownIcon = dropdownItem.icon;
                      return (
                        <div key={dropdownItem.href}>
                          {index > 0 && index === item.dropdownItems!.length - 1 && <DropdownMenuSeparator />}
                          <DropdownMenuItem
                            onClick={() => router.push(dropdownItem.href)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-start gap-3 w-full">
                              <DropdownIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{dropdownItem.label}</div>
                                <div className="text-xs text-muted-foreground">{dropdownItem.description}</div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        </div>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md",
                  isActive 
                    ? "text-primary bg-muted" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="nav-status">
          <ToolStatusBar />
        </div>
        
        <div className="nav-user">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}