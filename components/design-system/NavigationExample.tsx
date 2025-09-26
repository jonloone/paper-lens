'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Cable,
  Gauge,
  Hammer,
  Share2,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  hasDropdown?: boolean;
  dropdownItems?: Array<{
    href: string;
    label: string;
  }>;
}

export function NavigationExample() {
  const navItems: NavItem[] = [
    {
      href: '/connections',
      label: 'Connections',
      icon: Cable,
      hasDropdown: true,
      dropdownItems: [
        { href: '/connections', label: 'Connection Health' },
        { href: '/connections/add', label: 'Add New' },
        { href: '/connections/troubleshoot', label: 'Troubleshooting' }
      ]
    },
    { href: '/monitor', label: 'Monitor', icon: Gauge },
    {
      href: '/build',
      label: 'Build',
      icon: Hammer,
      hasDropdown: true,
      dropdownItems: [
        { href: '/build', label: 'Pipeline Studio' },
        { href: '/query', label: 'Query Library' },
        { href: '/build/templates', label: 'Templates' },
      ]
    },
    { href: '/govern', label: 'Govern', icon: Share2 }
  ];

  return (
    <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 pr-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-lg font-bold">N</span>
            </div>
            <span className="font-display text-xl">NexusOne</span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.hasDropdown) {
              return (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <button className="nav-item group">
                      <Icon className="w-4 h-4" />
                      {item.label}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {item.dropdownItems?.map((dropdownItem) => (
                      <DropdownMenuItem key={dropdownItem.href}>
                        {dropdownItem.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="nav-item">
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            Theme
          </button>
        </div>
      </div>
    </header>
  );
}