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
  Settings
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
      href: '/', 
      label: 'Home', 
      icon: Home,
    },
    { 
      href: '/operations', 
      label: 'Operations', 
      icon: Activity,
      isEmphasized: true, // Most important - what's broken?
    },
    { 
      href: '/develop', 
      label: 'Develop', 
      icon: GitBranch,
      hasDropdown: true,
      dropdownItems: [
        { href: '/develop/pipelines', label: 'Create Pipeline', icon: GitBranch, description: 'Build new data pipelines' },
        { href: '/develop/queries', label: 'Query Development', icon: Terminal, description: 'SQL editor with MCP intelligence' },
        { href: '/develop/data-products', label: 'Data Products', icon: Package, description: 'Guided product creation wizard' },
        { href: '/develop/integrations', label: 'Integrations', icon: Zap, description: 'Connection management and MCP setup' },
      ]
    },
    { 
      href: '/catalog', 
      label: 'Catalog', 
      icon: Database,
      hasDropdown: true,
      dropdownItems: [
        { href: '/catalog', label: 'Browse Catalog', icon: Database, description: 'Find datasets and schemas' },
        { href: '/catalog?view=lineage', label: 'Lineage', icon: GitBranch, description: 'Data dependencies' },
        { href: '/catalog?view=quality', label: 'Quality', icon: Shield, description: 'Data quality metrics' },
      ]
    },
    { 
      href: '/configure', 
      label: 'Configure', 
      icon: Settings,
    },
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-8 flex items-center gap-2">
          <NexusOneLogo className="h-6 text-foreground" />
        </div>
        
        <nav className="flex items-center gap-1">
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
        
        <div className="ml-auto flex items-center gap-4">
          <ToolStatusBar />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}