'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  Menu,
  X,
  User,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { IDELogo } from '@/components/ui/logo-ide';
import { NexusOneLogo } from '@/components/ui/logo';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { UnifiedIcon } from '@/components/ui/unified-icon';

interface NavItem {
  href: string;
  label: string;
  icon?: string;
  hasDropdown?: boolean;
  badge?: string;
  dropdownItems?: Array<{
    href: string;
    label: string;
    icon?: string;
    badge?: string;
  }>;
}

interface NavLinkProps {
  label: string;
  href?: string;
  badge?: string;
  hasDropdown?: boolean;
  dropdownItems?: Array<{
    href: string;
    label: string;
    icon?: string;
    badge?: string;
  }>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const NavLink = ({
  label,
  href,
  badge,
  hasDropdown,
  dropdownItems,
  isOpen,
  onOpenChange
}: NavLinkProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();

  const isActive = href && (pathname === href || (href !== '/' && pathname.startsWith(href)));

  if (hasDropdown && dropdownItems) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-200",
              "hover:bg-accent/50 hover:text-accent-foreground",
              isActive
                ? "text-primary bg-primary/10 shadow-sm border border-primary/20"
                : "text-foreground hover:text-accent-foreground"
            )}
          >
            {label}
            {badge && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {badge}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-popover/95 backdrop-blur-sm border-border/40">
          {dropdownItems.map((item, index) => {
            const isDropdownActive = pathname === item.href;
            return (
              <div key={item.href}>
                {index > 0 && index === dropdownItems.length - 1 && (
                  <DropdownMenuSeparator className="bg-border/40" />
                )}
                <DropdownMenuItem
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "cursor-pointer transition-colors duration-150",
                    isDropdownActive ? "bg-accent/20 text-primary" : ""
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    {item.icon && (
                      <UnifiedIcon
                        name={item.icon}
                        className={cn(
                          "transition-colors duration-150",
                          isDropdownActive ? "text-primary" : "text-muted-foreground"
                        )}
                        size="sm"
                        theme={theme}
                      />
                    )}
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium text-sm transition-colors duration-150",
                        isDropdownActive ? "text-primary" : ""
                      )}>
                        {item.label}
                        {item.badge && (
                          <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
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
      href={href || '/'}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-200",
        "hover:bg-accent/50 hover:text-accent-foreground",
        isActive
          ? "text-primary bg-primary/10 shadow-sm border border-primary/20"
          : "text-foreground hover:text-accent-foreground"
      )}
    >
      {label}
      {badge && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          {badge}
        </Badge>
      )}
    </Link>
  );
};

export const TopNavigation = () => {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Overview',
      icon: 'LayoutDashboard'
    },
    {
      href: '/build',
      label: 'Build',
      icon: 'Hammer'
    },
    {
      href: '/discover',
      label: 'Discover',
      icon: 'Search'
    },
    {
      href: '/monitor',
      label: 'Monitor',
      icon: 'Activity',
      hasDropdown: true,
      dropdownItems: [
        { href: '/monitor', label: 'System Status', icon: 'Gauge' },
        { href: '/manage/connections', label: 'Connections', icon: 'Database' },
        { href: '/monitor/pipelines', label: 'Pipelines', icon: 'GitBranch' },
        { href: '/manage', label: 'Data Products', icon: 'Package' }
      ]
    },
    {
      href: '/govern',
      label: 'Govern',
      icon: 'Shield',
      hasDropdown: true,
      dropdownItems: [
        { href: '/manage/access', label: 'Access Control', icon: 'Key' },
        { href: '/manage/quality', label: 'Quality Rules', icon: 'CheckCircle' },
        { href: '/manage/compliance', label: 'Compliance', icon: 'FileCheck' }
      ]
    }
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-8">
      <nav
        className={cn(
          "mx-auto max-w-7xl rounded-2xl",
          "transition-all duration-500 ease-out",
          scrolled
            ? "bg-card/70 backdrop-blur-2xl border border-border/60 shadow-2xl shadow-black/20"
            : "bg-card/60 backdrop-blur-xl border border-border/50",
          "relative overflow-hidden",
          // Glassmorphism effect with subtle gradient overlay
          "before:absolute before:inset-0 before:rounded-2xl",
          "before:bg-gradient-to-br before:from-primary/5 before:via-transparent before:to-accent/5",
          "before:pointer-events-none"
        )}
      >
        <div className="relative z-10 flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center">
              {mounted && (theme === 'one-dark-pro' || theme === 'gruvbox' || theme === 'dracula' || theme === 'solarized-light') ? (
                <IDELogo className={cn(
                  "h-8 w-8",
                  theme === 'one-dark-pro' ? "text-onedark-purple" :
                  theme === 'gruvbox' ? "text-gruvbox-orange" :
                  theme === 'dracula' ? "text-dracula-purple" :
                  "text-blue-500"
                )} />
              ) : (
                <svg
                  width="180"
                  height="31"
                  viewBox="0 0 180 31"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-auto transition-all duration-300 group-hover:scale-105"
                >
                  <path
                    d="M15.3045 7.50396e-06L30.609 15.3045L15.3045 30.609L8.50266 23.8072L17.0053 15.3045L8.50266 6.80184L15.3045 7.50396e-06ZM22.1071 15.3045L13.6044 23.8072L15.3045 25.5073L25.5072 15.3045L15.3045 5.10176L13.6044 6.80184L22.1071 15.3045Z"
                    className="fill-primary group-hover:opacity-80 transition-all duration-300"
                  />
                  <path
                    d="M13.7741 15.3045L6.88708 22.1916L4.5913 19.8958L9.18254 15.3045L4.5913 10.7133L6.88708 8.41751L13.7741 15.3045Z"
                    className="fill-primary group-hover:opacity-80 transition-all duration-300"
                  />
                  <path
                    d="M3.06114 12.2434L6.12227 15.3045L3.06114 18.3656L1.53022 16.8347L3.06045 15.3045L1.53022 13.7743L3.06114 12.2434Z"
                    className="fill-primary group-hover:opacity-80 transition-all duration-300"
                  />
                  <path
                    d="M58.7244 5.07193C57.2959 5.16933 56.257 5.59139 56.257 7.5718V26.3045H54.8609L41.972 8.5133V23.3177C41.972 25.363 43.2707 25.7851 45.2511 25.8825V26.3045H38.4333V25.85C39.8618 25.7526 40.9007 25.363 40.9007 23.3177V7.5718C40.9007 5.59139 39.9592 5.13687 37.9463 5.03947V4.61741H42.1668L55.1856 22.5385V7.5718C55.1856 5.59139 53.887 5.13687 51.9066 5.03947V4.61741H58.7244V5.07193ZM67.2294 9.61714C71.1577 9.61714 73.1706 13.2533 73.1706 17.1817H61.8076C61.905 21.8243 64.2101 24.8111 67.7164 24.8111C70.1188 24.8111 71.5798 23.4151 72.6836 22.0191L73.0407 22.1814C72.1966 24.7462 69.8591 26.7591 66.7749 26.7591C62.6192 26.7591 59.7623 23.0904 59.7623 18.6426C59.7623 12.9286 62.9439 9.61714 67.2294 9.61714ZM61.8401 16.2726H70.8331C70.6058 13.1234 69.5994 10.656 66.7099 10.656C63.5932 10.656 62.1323 13.026 61.8401 16.2726ZM83.4247 25.8825C85.6648 25.7526 85.7622 25.3306 84.8857 24.0319L81.5417 19.1296L77.7432 24.1943C77.0614 25.0708 77.4835 25.7851 79.4314 25.8825V26.3045H74.0746V25.8825C75.0161 25.6877 75.9251 25.2007 76.7692 24.0644L81.0222 18.3504L76.6069 11.8248C76.1848 11.1755 75.7628 10.6885 74.4966 10.4937V10.0717H81.0222V10.4937C78.8146 10.6236 78.6847 11.0456 79.5613 12.3443L82.5157 16.6947L85.8921 12.1819C86.5414 11.3054 86.1518 10.5911 84.2039 10.4937V10.0717H89.5607V10.4937C88.6192 10.6885 87.7102 11.1755 86.8661 12.3118L83.0351 17.4414L87.8725 24.5514C88.2946 25.1682 88.6517 25.7202 89.9503 25.8825V26.3045H83.4247V25.8825ZM94.6089 21.2723C94.6089 23.9995 96.0699 25.1033 98.0503 25.1033C99.771 25.1033 101.264 24.1943 102.855 22.2139V13.4481C102.855 12.117 102.401 11.3378 100.745 11.3703H100.453V10.9158L104.446 9.61714H104.901V22.9606C104.901 24.2592 105.355 25.0384 107.043 25.0384H107.271V25.4604L103.31 26.7591H102.855V23.0255C100.972 25.6228 99.219 26.7591 97.3036 26.7591C94.9011 26.7591 92.5636 25.0708 92.5636 21.4022V13.4481C92.5636 12.117 92.109 11.3378 90.4533 11.3703H90.1611V10.9158L94.1544 9.61714H94.6089V21.2723ZM114.907 26.7591C112.407 26.7591 110.037 25.5903 108.771 23.48L111.044 22.1489C111.693 24.3891 113.219 25.8175 115.134 25.8175C117.407 25.8175 118.835 24.2917 118.803 22.6684C118.771 21.1425 117.764 20.1036 116.303 19.4867L113.186 18.1881C111.206 17.344 109.42 16.3051 109.388 14.1299C109.355 11.4028 111.466 9.61714 114.712 9.61714C118.413 9.61714 119.972 11.3054 120.589 12.3118L118.413 13.6429C117.732 11.7923 116.433 10.5586 114.615 10.5586C112.505 10.5586 111.206 11.6949 111.206 13.3507C111.206 14.9091 112.407 15.6558 113.966 16.3051L117.212 17.6362C119.128 18.4154 120.556 19.5192 120.621 21.7918C120.686 24.5189 118.446 26.7591 114.907 26.7591ZM133.414 4.16289C140.037 4.16289 143.933 9.13015 143.933 15.0065C143.933 22.2139 138.965 26.7591 133.252 26.7591C126.596 26.7591 122.7 21.7918 122.7 15.9155C122.7 8.7081 127.667 4.16289 133.414 4.16289ZM125.265 15.5259C125.362 20.2659 127.732 25.7526 133.836 25.6552C139.095 25.5578 141.53 20.8178 141.368 15.3636C141.271 10.4612 138.738 5.16933 132.797 5.26673C127.538 5.36413 125.135 9.9418 125.265 15.5259ZM150.349 23.9345C150.349 25.3955 151.518 25.6877 152.752 25.8825V26.3045H145.901V25.8825C147.135 25.6877 148.304 25.3955 148.304 23.9345V13.4481C148.304 12.117 147.849 11.3378 146.193 11.3703H145.901V10.9158L149.895 9.61714H150.349V13.3507C152.232 10.7534 153.985 9.61714 155.901 9.61714C158.303 9.61714 160.641 11.3054 160.641 14.974V23.9345C160.641 25.3955 161.809 25.6877 163.043 25.8825V26.3045H156.193V25.8825C157.427 25.6877 158.595 25.3955 158.595 23.9345V15.1039C158.595 12.3767 157.134 11.2729 155.154 11.2729C153.433 11.2729 151.94 12.1819 150.349 14.1623V23.9345ZM171.855 9.61714C175.784 9.61714 177.797 13.2533 177.797 17.1817H166.434C166.531 21.8243 168.836 24.8111 172.342 24.8111C174.745 24.8111 176.206 23.4151 177.31 22.0191L177.667 22.1814C176.823 24.7462 174.485 26.7591 171.401 26.7591C167.245 26.7591 164.388 23.0904 164.388 18.6426C164.388 12.9286 167.57 9.61714 171.855 9.61714ZM166.466 16.2726H175.459C175.232 13.1234 174.225 10.656 171.336 10.656C168.219 10.656 166.758 13.026 166.466 16.2726Z"
                    fill="currentColor" className="text-foreground"
                  />
                </svg>
              )}
            </Link>
          </div>

          {/* Center Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                href={item.href}
                badge={item.badge}
                hasDropdown={item.hasDropdown}
                dropdownItems={item.dropdownItems}
                isOpen={dropdownOpen === item.label}
                onOpenChange={(open) => setDropdownOpen(open ? item.label : null)}
              />
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatar.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                {mounted && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        const currentTheme = theme || '';
                        // Toggle between light and dark variants of the current theme
                        if (resolvedTheme === 'dark' || currentTheme.includes('dark')) {
                          // Switch to light version
                          const lightTheme = currentTheme.replace('-dark', '');
                          setTheme(lightTheme === 'dark' ? 'light' : lightTheme || 'light');
                        } else {
                          // Switch to dark version
                          if (currentTheme && currentTheme !== 'light') {
                            setTheme(`${currentTheme}-dark`);
                          } else {
                            setTheme('dark');
                          }
                        }
                      }}
                    >
                      {resolvedTheme === 'dark' ? (
                        <>
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Switch to Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Switch to Dark Mode</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    <div className="px-2 py-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Theme</div>
                      <ThemeSwitcher />
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 p-4 space-y-2">
            {navItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
                {item.dropdownItems && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.dropdownItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className="block px-4 py-2 text-sm text-muted-foreground/80 hover:text-foreground hover:bg-accent/30 rounded-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};