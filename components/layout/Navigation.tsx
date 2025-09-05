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
  Link as LinkIcon,
  ChevronDown,
  Upload,
  Clock,
  Plus,
  Shield
} from 'lucide-react';
import { NexusOneLogo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { 
      href: '/ingest', 
      label: 'Ingest', 
      icon: Database,
      hasDropdown: true,
      dropdownItems: [
        { href: '/ingest?view=new', label: 'New Ingestion', icon: Plus, description: 'Create a new data ingestion' },
        { href: '/ingest?view=jobs', label: 'Active Jobs', icon: Database, description: 'Monitor running ingestion jobs' },
        { href: '/ingest?view=history', label: 'History', icon: Clock, description: 'View completed ingestions' },
      ]
    },
    { href: '/query', label: 'Query', icon: Search },
    { href: '/pipelines', label: 'Pipelines', icon: GitBranch },
    { href: '/monitor', label: 'Monitor', icon: Activity },
    { href: '/quality', label: 'Quality', icon: Shield },
    { href: '/connect', label: 'Connect', icon: LinkIcon },
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
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
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
          <div className="text-xs text-muted-foreground">
            Orchestration Active
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}