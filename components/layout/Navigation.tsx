'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import { IDELogo } from '@/components/ui/logo-ide';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { ToolStatusBar } from '@/components/layout/ToolStatusBar';
import { UnifiedIcon } from '@/components/ui/unified-icon';
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
  }>;
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const navItems: NavItem[] = [
    { 
      href: '/connections', 
      label: 'Connections & Sources', 
      icon: Cable,
      hasDropdown: true,
      isEmphasized: false,
      dropdownItems: [
        { href: '/connections', label: 'Connection Health', icon: Activity },
        { href: '/connections?tab=add', label: 'Add New Connection', icon: Settings },
        { href: '/connections?tab=troubleshoot', label: 'Troubleshooting', icon: AlertTriangle }
      ]
    },
    {
      href: '/monitor',
      label: 'Monitor',
      icon: Gauge,
      hasDropdown: true,
      isEmphasized: false,
      dropdownItems: [
        { href: '/monitor', label: 'System Status', icon: Gauge },
        { href: '/monitor/pipelines', label: 'Pipelines', icon: GitBranch }
      ]
    },
    {
      href: '/build',
      label: 'Build',
      icon: Hammer,
      hasDropdown: false,
      isEmphasized: false
    },
    {
      href: '/govern',
      label: 'Govern & Share',
      icon: Share2,
      hasDropdown: true,
      isEmphasized: false,
      dropdownItems: [
        { href: '/govern', label: 'Data Products', icon: Package },
        { href: '/govern?tab=access', label: 'Access Control', icon: Shield },
        { href: '/govern?tab=compliance', label: 'Compliance', icon: Key },
        { href: '/govern?tab=share', label: 'Marketplace', icon: Users }
      ]
    }
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="header-nav h-14">
        <Link href="/" className="nav-logo">
          {mounted && (theme === 'one-dark-pro' || theme === 'gruvbox' || theme === 'dracula' || theme === 'solarized-light') ? (
            <IDELogo className={cn(
              "h-10 w-10",
              theme === 'one-dark-pro' ? "text-onedark-purple" :
              theme === 'gruvbox' ? "text-gruvbox-orange" :
              theme === 'dracula' ? "text-dracula-purple" :
              "text-blue-500"
            )} />
          ) : (
            <NexusOneLogo className="h-6 text-foreground hover:opacity-80 transition-opacity" />
          )}
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
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
                        "hover:bg-accent/50 hover:text-accent-foreground",
                        isActive
                          ? cn(
                              "text-primary bg-primary/10 shadow-sm",
                              "border border-primary/20",
                              theme === 'one-dark-pro' ? "text-onedark-blue bg-onedark-blue/10 border-onedark-blue/20" :
                              theme === 'gruvbox' ? "text-gruvbox-blue bg-gruvbox-blue/10 border-gruvbox-blue/20" :
                              theme === 'dracula' ? "text-dracula-cyan bg-dracula-cyan/10 border-dracula-cyan/20" :
                              theme === 'solarized-light' ? "text-solarized-blue bg-solarized-blue/10 border-solarized-blue/20" :
                              ""
                            )
                          : "text-muted-foreground/80 hover:text-foreground",
                        item.isEmphasized && "relative"
                      )}
                    >
                      <UnifiedIcon
                        name={item.icon.displayName || item.icon.name || 'Cable'}
                        className={cn(
                          "transition-colors duration-200",
                          isActive ? "text-primary" : ""
                        )}
                        size="sm"
                        theme={theme}
                      />
                      {item.label}
                      {item.isEmphasized && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                      )}
                      <UnifiedIcon
                        name="ChevronDown"
                        className={cn(
                          "transition-colors duration-200",
                          isActive ? "text-primary" : ""
                        )}
                        size="sm"
                        theme={theme}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-popover/95 backdrop-blur-sm border-border/40">
                    {item.dropdownItems?.map((dropdownItem, index) => {
                      const isDropdownActive = pathname === dropdownItem.href;
                      return (
                        <div key={dropdownItem.href}>
                          {index > 0 && index === item.dropdownItems!.length - 1 && <DropdownMenuSeparator className="bg-border/40" />}
                          <DropdownMenuItem
                            onClick={() => router.push(dropdownItem.href)}
                            className={cn(
                              "cursor-pointer transition-colors duration-150",
                              isDropdownActive ? "bg-accent/20 text-primary" : ""
                            )}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <UnifiedIcon
                                name={dropdownItem.icon.displayName || dropdownItem.icon.name || 'Settings'}
                                className={cn(
                                  "mt-0.5 transition-colors duration-150",
                                  isDropdownActive ? "text-primary" : "text-muted-foreground"
                                )}
                                size="sm"
                                theme={theme}
                              />
                              <div className="flex-1">
                                <div className={cn(
                                  "font-medium text-sm transition-colors duration-150",
                                  isDropdownActive ? "text-primary" : ""
                                )}>{dropdownItem.label}</div>
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
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
                  "hover:bg-accent/50 hover:text-accent-foreground",
                  isActive
                    ? cn(
                        "text-primary bg-primary/10 shadow-sm",
                        "border border-primary/20",
                        theme === 'one-dark-pro' ? "text-onedark-blue bg-onedark-blue/10 border-onedark-blue/20" :
                        theme === 'gruvbox' ? "text-gruvbox-blue bg-gruvbox-blue/10 border-gruvbox-blue/20" :
                        theme === 'dracula' ? "text-dracula-cyan bg-dracula-cyan/10 border-dracula-cyan/20" :
                        theme === 'solarized-light' ? "text-solarized-blue bg-solarized-blue/10 border-solarized-blue/20" :
                        ""
                      )
                    : "text-muted-foreground/80 hover:text-foreground"
                )}
              >
                <UnifiedIcon
                  name={item.icon.displayName || item.icon.name || 'Gauge'}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-primary" : ""
                  )}
                  size="sm"
                  theme={theme}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav-status">
          <ToolStatusBar />
        </div>

        <div className="nav-user">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}