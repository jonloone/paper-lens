'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedTabs, EnhancedTabsContent, EnhancedTabsList, EnhancedTabsTrigger } from '@/components/ui/enhanced-tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
  Activity,
  Database,
  Shield,
  Bot,
  Terminal,
  ChevronRight,
  Zap,
  Globe,
  Lock,
  Layers,
  TrendingUp,
  Users,
  BarChart,
  Settings,
  Search,
  User,
  Menu,
  X,
  ChevronDown,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { NavigationExample } from '@/components/design-system/NavigationExample';
import { DataTableExample } from '@/components/design-system/DataTableExample';
import { VisualizationExamples } from '@/components/design-system/VisualizationExamples';
import { PipelineTable } from '@/components/design-system/PipelineTable';
import {
  MetricCard,
  MetricsGrid,
  ProgressMetricCard,
  GaugeMetricCard,
  SparklineMetricCard,
  FullFeaturedMetricCard
} from '@/components/design-system/MetricCard';
import {
  ASCIILineChart,
  QualityTrendASCII
} from '@/components/design-system/ASCIILineChart';
import {
  ASCIIBarChart,
  PipelineRunsASCII
} from '@/components/design-system/ASCIIBarChart';
import {
  MetricGauge,
  TrendIndicator,
  MiniProgressBar,
  QualityDots,
  MiniSparkline
} from '@/components/design-system/ASCIIMiniChart';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { ActivityFeedExample } from '@/components/design-system/ActivityFeed';
import { SectionDivider, CompactDivider, AsciiBorder } from '@/components/design-system/SectionDivider';
import {
  HeroTerminalChart,
  PipelineSuccessChart,
  ResourceUsageChart,
  DataQualityChart,
  ThroughputChart
} from '@/components/design-system/HeroTerminalChart';
import { NexusDataCommand } from '@/components/ui/nexus-data-command';
import { PixelIconsShowcase } from '@/components/design-system/PixelIconsShowcase';
import { AdvancedChartsShowcase } from '@/components/design-system/AdvancedChartsShowcase';
import { CustomIconsShowcase } from '@/components/design-system/CustomIconsShowcase';
import { OmniLauncherShowcase } from '@/components/design-system/OmniLauncherShowcase';
import { OmniLauncher } from '@/components/ui/omni-launcher';
import { OmniLauncherEnhanced } from '@/components/ui/omni-launcher-enhanced';
import { useTheme } from 'next-themes';

// Theme configuration
const themes = [
  { name: 'Dark', value: 'dark', color: 'bg-gray-800' },
  { name: 'Light', value: 'light', color: 'bg-gray-100' },
  { name: 'Dracula', value: 'dracula', color: 'bg-gradient-to-r from-purple-600 to-pink-600' },
  { name: 'Solarized Light', value: 'solarized-light', color: 'bg-gradient-to-r from-yellow-200 to-orange-200' },
  { name: 'Solarized Dark', value: 'solarized-dark', color: 'bg-gradient-to-r from-teal-700 to-cyan-800' },
  { name: 'One Dark Pro', value: 'one-dark-pro', color: 'bg-gradient-to-r from-gray-700 to-gray-900' },
  { name: 'Gruvbox Light', value: 'gruvbox-light', color: 'bg-gradient-to-r from-orange-200 to-yellow-300' },
  { name: 'Gruvbox Dark', value: 'gruvbox-dark', color: 'bg-gradient-to-r from-orange-800 to-red-900' },
  { name: 'Nature Light', value: 'nature-light', color: 'bg-gradient-to-r from-green-200 to-blue-200' },
  { name: 'Nature Dark', value: 'nature-dark', color: 'bg-gradient-to-r from-green-700 to-blue-800' },
  { name: 'Amethyst Light', value: 'amethyst-haze-light', color: 'bg-gradient-to-r from-purple-200 to-indigo-200' },
  { name: 'Amethyst Dark', value: 'amethyst-haze-dark', color: 'bg-gradient-to-r from-purple-700 to-indigo-800' },
  { name: 'Windows 98', value: 'win98', color: 'bg-gradient-to-r from-teal-500 to-gray-500' },
  { name: 'Modus Light', value: 'modus-light', color: 'bg-gradient-to-r from-blue-100 to-gray-100' },
  { name: 'Modus Dark', value: 'modus', color: 'bg-gradient-to-r from-blue-900 to-gray-900' },
];

// Top Navigation Component
const TopNavigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-8">
      <nav
        className={cn(
          "mx-auto max-w-6xl rounded-2xl",
          "transition-all duration-500 ease-out",
          scrolled
            ? "bg-background/40 backdrop-blur-2xl border border-border/50 shadow-2xl shadow-black/20"
            : "bg-background/20 backdrop-blur-xl border border-border/30"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="group flex items-center">
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
                  className="fill-primary group-hover:fill-accent transition-colors duration-300"
                />
                <path
                  d="M13.7741 15.3045L6.88708 22.1916L4.5913 19.8958L9.18254 15.3045L4.5913 10.7133L6.88708 8.41751L13.7741 15.3045Z"
                  className="fill-primary group-hover:fill-accent transition-colors duration-300"
                />
                <path
                  d="M3.06114 12.2434L6.12227 15.3045L3.06114 18.3656L1.53022 16.8347L3.06045 15.3045L1.53022 13.7743L3.06114 12.2434Z"
                  className="fill-primary group-hover:fill-accent transition-colors duration-300"
                />
                <path
                  d="M58.7244 5.07193C57.2959 5.16933 56.257 5.59139 56.257 7.5718V26.3045H54.8609L41.972 8.5133V23.3177C41.972 25.363 43.2707 25.7851 45.2511 25.8825V26.3045H38.4333V25.85C39.8618 25.7526 40.9007 25.363 40.9007 23.3177V7.5718C40.9007 5.59139 39.9592 5.13687 37.9463 5.03947V4.61741H42.1668L55.1856 22.5385V7.5718C55.1856 5.59139 53.887 5.13687 51.9066 5.03947V4.61741H58.7244V5.07193ZM67.2294 9.61714C71.1577 9.61714 73.1706 13.2533 73.1706 17.1817H61.8076C61.905 21.8243 64.2101 24.8111 67.7164 24.8111C70.1188 24.8111 71.5798 23.4151 72.6836 22.0191L73.0407 22.1814C72.1966 24.7462 69.8591 26.7591 66.7749 26.7591C62.6192 26.7591 59.7623 23.0904 59.7623 18.6426C59.7623 12.9286 62.9439 9.61714 67.2294 9.61714ZM61.8401 16.2726H70.8331C70.6058 13.1234 69.5994 10.656 66.7099 10.656C63.5932 10.656 62.1323 13.026 61.8401 16.2726ZM83.4247 25.8825C85.6648 25.7526 85.7622 25.3306 84.8857 24.0319L81.5417 19.1296L77.7432 24.1943C77.0614 25.0708 77.4835 25.7851 79.4314 25.8825V26.3045H74.0746V25.8825C75.0161 25.6877 75.9251 25.2007 76.7692 24.0644L81.0222 18.3504L76.6069 11.8248C76.1848 11.1755 75.7628 10.6885 74.4966 10.4937V10.0717H81.0222V10.4937C78.8146 10.6236 78.6847 11.0456 79.5613 12.3443L82.5157 16.6947L85.8921 12.1819C86.5414 11.3054 86.1518 10.5911 84.2039 10.4937V10.0717H89.5607V10.4937C88.6192 10.6885 87.7102 11.1755 86.8661 12.3118L83.0351 17.4414L87.8725 24.5514C88.2946 25.1682 88.6517 25.7202 89.9503 25.8825V26.3045H83.4247V25.8825ZM94.6089 21.2723C94.6089 23.9995 96.0699 25.1033 98.0503 25.1033C99.771 25.1033 101.264 24.1943 102.855 22.2139V13.4481C102.855 12.117 102.401 11.3378 100.745 11.3703H100.453V10.9158L104.446 9.61714H104.901V22.9606C104.901 24.2592 105.355 25.0384 107.043 25.0384H107.271V25.4604L103.31 26.7591H102.855V23.0255C100.972 25.6228 99.219 26.7591 97.3036 26.7591C94.9011 26.7591 92.5636 25.0708 92.5636 21.4022V13.4481C92.5636 12.117 92.109 11.3378 90.4533 11.3703H90.1611V10.9158L94.1544 9.61714H94.6089V21.2723ZM114.907 26.7591C112.407 26.7591 110.037 25.5903 108.771 23.48L111.044 22.1489C111.693 24.3891 113.219 25.8175 115.134 25.8175C117.407 25.8175 118.835 24.2917 118.803 22.6684C118.771 21.1425 117.764 20.1036 116.303 19.4867L113.186 18.1881C111.206 17.344 109.42 16.3051 109.388 14.1299C109.355 11.4028 111.466 9.61714 114.712 9.61714C118.413 9.61714 119.972 11.3054 120.589 12.3118L118.413 13.6429C117.732 11.7923 116.433 10.5586 114.615 10.5586C112.505 10.5586 111.206 11.6949 111.206 13.3507C111.206 14.9091 112.407 15.6558 113.966 16.3051L117.212 17.6362C119.128 18.4154 120.556 19.5192 120.621 21.7918C120.686 24.5189 118.446 26.7591 114.907 26.7591ZM133.414 4.16289C140.037 4.16289 143.933 9.13015 143.933 15.0065C143.933 22.2139 138.965 26.7591 133.252 26.7591C126.596 26.7591 122.7 21.7918 122.7 15.9155C122.7 8.7081 127.667 4.16289 133.414 4.16289ZM125.265 15.5259C125.362 20.2659 127.732 25.7526 133.836 25.6552C139.095 25.5578 141.53 20.8178 141.368 15.3636C141.271 10.4612 138.738 5.16933 132.797 5.26673C127.538 5.36413 125.135 9.9418 125.265 15.5259ZM150.349 23.9345C150.349 25.3955 151.518 25.6877 152.752 25.8825V26.3045H145.901V25.8825C147.135 25.6877 148.304 25.3955 148.304 23.9345V13.4481C148.304 12.117 147.849 11.3378 146.193 11.3703H145.901V10.9158L149.895 9.61714H150.349V13.3507C152.232 10.7534 153.985 9.61714 155.901 9.61714C158.303 9.61714 160.641 11.3054 160.641 14.974V23.9345C160.641 25.3955 161.809 25.6877 163.043 25.8825V26.3045H156.193V25.8825C157.427 25.6877 158.595 25.3955 158.595 23.9345V15.1039C158.595 12.3767 157.134 11.2729 155.154 11.2729C153.433 11.2729 151.94 12.1819 150.349 14.1623V23.9345ZM171.855 9.61714C175.784 9.61714 177.797 13.2533 177.797 17.1817H166.434C166.531 21.8243 168.836 24.8111 172.342 24.8111C174.745 24.8111 176.206 23.4151 177.31 22.0191L177.667 22.1814C176.823 24.7462 174.485 26.7591 171.401 26.7591C167.245 26.7591 164.388 23.0904 164.388 18.6426C164.388 12.9286 167.57 9.61714 171.855 9.61714ZM166.466 16.2726H175.459C175.232 13.1234 174.225 10.656 171.336 10.656C168.219 10.656 166.758 13.026 166.466 16.2726Z"
                  fill="currentColor" className="text-foreground"
                />
              </svg>
            </a>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink label="Overview" href="/" />
            <NavLink
              label="Build"
              hasDropdown
              dropdownItems={[
                { label: 'Data Products', href: '/build/products', badge: 'New' },
                { label: 'Pipelines', href: '/build/pipelines' },
                { label: 'Workflows', href: '/build/workflows' },
                { label: 'Transformations', href: '/build/transformations' },
              ]}
              isOpen={dropdownOpen === 'build'}
              onOpenChange={(open) => setDropdownOpen(open ? 'build' : null)}
            />
            <NavLink
              label="Catalog"
              hasDropdown
              dropdownItems={[
                { label: 'Data Assets', href: '/catalog/assets' },
                { label: 'Schemas', href: '/catalog/schemas' },
                { label: 'Lineage', href: '/catalog/lineage', badge: 'Beta' },
                { label: 'Quality Rules', href: '/catalog/quality' },
              ]}
              isOpen={dropdownOpen === 'catalog'}
              onOpenChange={(open) => setDropdownOpen(open ? 'catalog' : null)}
            />
            <NavLink
              label="Monitor"
              hasDropdown
              dropdownItems={[
                { label: 'Pipeline Health', href: '/monitor/pipelines' },
                { label: 'Data Quality', href: '/monitor/quality' },
                { label: 'System Metrics', href: '/monitor/metrics' },
                { label: 'Incidents', href: '/monitor/incidents' },
              ]}
              isOpen={dropdownOpen === 'monitor'}
              onOpenChange={(open) => setDropdownOpen(open ? 'monitor' : null)}
            />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="
                  p-2 rounded-lg
                  text-foreground/60 hover:text-foreground
                  hover:bg-foreground/10
                  transition-all duration-300
                  group
                ">
                  <Palette className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="
                  w-56 mt-2 max-h-[400px] overflow-y-auto
                  bg-background/90 backdrop-blur-2xl
                  border border-border/50
                  text-foreground
                "
              >
                <DropdownMenuLabel className="text-foreground/60">Select Theme</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/30" />
                {mounted && themes.map((themeOption) => {
                  const isActive = theme === themeOption.value;
                  return (
                    <DropdownMenuItem
                      key={themeOption.value}
                      className={cn(
                        "text-foreground/80 hover:text-foreground focus:bg-foreground/10 focus:text-foreground cursor-pointer",
                        isActive && "bg-foreground/10 text-foreground"
                      )}
                      onClick={() => setTheme(themeOption.value)}
                    >
                      <div className={cn("w-4 h-4 rounded mr-2", themeOption.color)} />
                      <span className="flex-1">{themeOption.name}</span>
                      {isActive && (
                        <Check className="w-3 h-3 ml-2 text-accent" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Light/Dark Mode Toggle */}
            <button
              onClick={() => {
                const isDark = theme === 'dark' || theme?.includes('dark');
                setTheme(isDark ? 'light' : 'dark');
              }}
              className="
                p-2 rounded-lg
                text-foreground/60 hover:text-foreground
                hover:bg-foreground/10
                transition-all duration-300
              "
              title={theme?.includes('dark') ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {mounted ? (
                theme === 'dark' || theme?.includes('dark') ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="
                  flex items-center gap-2
                  p-1 pr-3 rounded-lg
                  hover:bg-foreground/10
                  transition-all duration-300
                  group
                ">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-3.5 h-3.5 text-foreground/60 group-hover:text-foreground transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="
                  w-56 mt-2
                  bg-background/90 backdrop-blur-2xl
                  border border-border/50
                  text-foreground
                "
              >
                <DropdownMenuLabel className="text-foreground/60">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem className="text-foreground/80 hover:text-foreground focus:bg-foreground/10 focus:text-foreground">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground/80 hover:text-foreground focus:bg-foreground/10 focus:text-foreground">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground/80 hover:text-foreground focus:bg-foreground/10 focus:text-foreground">
                  <Activity className="mr-2 h-4 w-4" />
                  Activity Log
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="text-foreground/80 hover:text-foreground focus:bg-foreground/10 focus:text-foreground">
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground/80 hover:text-foreground focus:bg-foreground/10 focus:text-foreground">
                  <Database className="mr-2 h-4 w-4" />
                  API Keys
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="text-destructive hover:text-destructive/90 focus:bg-destructive/10 focus:text-destructive">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground/80 hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="
          absolute top-full left-0 right-0 mt-2
          md:hidden
          bg-background/90 backdrop-blur-2xl
          border border-border/50
          rounded-2xl
          mx-8
          animate-in slide-in-from-top
          duration-300
          shadow-2xl shadow-black/20
        ">
          <div className="p-6 space-y-4">
            <a href="/" className="block py-3 text-foreground/70 hover:text-foreground transition-colors">Overview</a>
            <a href="/build" className="block py-3 text-foreground/70 hover:text-foreground transition-colors">Build</a>
            <a href="/catalog" className="block py-3 text-foreground/70 hover:text-foreground transition-colors">Catalog</a>
            <a href="/monitor" className="block py-3 text-foreground/70 hover:text-foreground transition-colors">Monitor</a>

            <div className="pt-4 border-t border-border/30">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-foreground/5">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">John Doe</p>
                  <p className="text-xs text-foreground/60">john.doe@nexusone.io</p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <a href="/profile" className="block px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors">
                  Profile Settings
                </a>
                <a href="/preferences" className="block px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors">
                  Preferences
                </a>
                <a href="/signout" className="block px-3 py-2 text-sm text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded-lg transition-colors">
                  Sign Out
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Navigation Link Component
const NavLink = ({
  label,
  href = '#',
  hasDropdown = false,
  dropdownItems = [],
  isOpen = false,
  onOpenChange = () => {}
}: {
  label: string;
  href?: string;
  hasDropdown?: boolean;
  dropdownItems?: Array<{ label: string; href: string; badge?: string }>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  if (hasDropdown) {
    return (
      <div className="relative">
        <button
          onMouseEnter={() => onOpenChange(true)}
          onMouseLeave={() => onOpenChange(false)}
          className="
            flex items-center gap-1.5
            px-3 py-2 rounded-lg
            text-foreground/60 hover:text-foreground
            font-sans text-base font-medium
            hover:bg-foreground/10
            transition-all duration-300
            group
          "
        >
          {label}
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            onMouseEnter={() => onOpenChange(true)}
            onMouseLeave={() => onOpenChange(false)}
            className="
              absolute top-full left-0 mt-2
              w-56
              bg-background/90
              backdrop-blur-2xl
              border border-border/50
              rounded-xl
              shadow-2xl shadow-black/30
              p-2
              animate-in fade-in slide-in-from-top-2
              duration-300
            "
          >
            {dropdownItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="
                  flex items-center justify-between
                  px-4 py-3
                  rounded-lg
                  text-foreground/70 hover:text-foreground
                  hover:bg-foreground/10
                  transition-colors duration-150
                  group
                "
              >
                <span className="font-sans text-sm">
                  {item.label}
                </span>
                {item.badge && (
                  <Badge className="ml-2 bg-accent/20 text-accent border-accent/30 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={href}
      className="
        px-3 py-2 rounded-lg
        text-foreground/60 hover:text-foreground
        font-sans text-base font-medium
        hover:bg-foreground/10
        transition-all duration-300
      "
    >
      {label}
    </a>
  );
};

export default function DesignSystemPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [progress, setProgress] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('build');

  useEffect(() => {
    // Animate progress bar on mount
    const timer = setTimeout(() => setProgress(75), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="nexus-enhanced min-h-screen dot-grid-background design-system-background">
      {/* Top Navigation Bar */}
      <TopNavigation />

      {/* Omni-Launcher Enhanced */}
      <OmniLauncherEnhanced position="left" currentPage={currentPage} />

      {/* Hero Section with Gradient */}
      <section className="hero-nexus hero-nexus--gradient pt-20">
        <div className="container-nexus">
          <div className="text-center mb-8">
            <code className="ascii-accent text-lg">┌─── NexusOne Design System ───┐</code>
          </div>
          <h1 className="hero-nexus__title animate-fade-in" data-display-font>
            Quality dropped across the{' '}
            <span className="highlight-nexus highlight-nexus--tertiary">
              Customer Domain
            </span>{' '}
            with potential schema changes.
          </h1>

          <p className="hero-nexus__subtitle animate-fade-in animate-delay-100">
            Intelligent orchestration of enterprise data engineering tools through AI-powered workflows.
            Transform how your data teams work.
          </p>

          <div className="hero-nexus__actions animate-fade-in animate-delay-200">
            <Button className="btn-nexus btn-nexus--primary btn-nexus--lg">
              <Sparkles className="mr-2 h-5 w-5" />
              Start Free Trial
            </Button>
            <Button className="btn-nexus btn-nexus--secondary btn-nexus--lg">
              Watch Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-nexus py-24 space-y-24">

        {/* Top Navigation Showcase */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Top Navigation Bar</h2>
            <p className="text-xl text-muted-foreground">
              Clean, minimal navigation with glass morphism effects, dropdowns, and mobile responsiveness.
              Scroll to see the backdrop blur effect activate.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-display" data-display-font>Navigation Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Visual Design</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      Glass morphism on scroll
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      Gradient logo with hover effects
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      Subtle hover states
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      80px height for presence
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Functionality</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      Dropdown menus with animations
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      Mobile responsive drawer
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      Badge support for features
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-400" />
                      Smooth 300ms transitions
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="p-6 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">Implementation Notes</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The navigation bar is fixed at the top of the page and uses a combination of backdrop-filter blur
                and transparency for the glass effect. The dropdown menus use onMouseEnter/onMouseLeave for desktop
                and a slide-in drawer for mobile. All animations use 200-300ms durations for smooth transitions.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge className="bg-primary/20 text-primary border-primary/30">Fixed Position</Badge>
                <Badge className="bg-accent/20 text-accent border-accent/30">Glass Effect</Badge>
                <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">Responsive</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Omni-Launcher Showcase */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Omni-Launcher</h2>
            <p className="text-xl text-muted-foreground">
              Contextual tool navigation and intelligence hub with AI chat, unified search, and smart tool suggestions.
              The launcher floats on the right edge providing instant access without disrupting workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Features Card */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-display" data-display-font>Core Features</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">AI Assistant</h4>
                    <p className="text-sm text-muted-foreground">
                      Expandable chat with workflow context, quick actions, and intelligent suggestions
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">Unified Search</h4>
                    <p className="text-sm text-muted-foreground">
                      Search across data products, NiFi flows, Airflow DAGs, and documentation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-chart-4/20 to-destructive/20 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-chart-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">Contextual Tools Panel</h4>
                    <p className="text-sm text-muted-foreground">
                      Single tools button expands to show relevant tools with descriptions, status, and quick actions
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Interaction States Card */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xl font-display" data-display-font>Interaction States</h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <h4 className="text-sm font-medium text-white/80 mb-2">Collapsed (Default)</h4>
                  <p className="text-xs text-muted-foreground">
                    48px wide vertical bar with 3 main buttons: AI Chat, Search, and Tools. Always visible for quick access.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/5">
                  <h4 className="text-sm font-medium text-white/80 mb-2">Chat Expanded</h4>
                  <p className="text-xs text-muted-foreground">
                    400px × 600px panel with AI conversation, quick actions, and workflow context.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/5">
                  <h4 className="text-sm font-medium text-white/80 mb-2">Search Expanded</h4>
                  <p className="text-xs text-muted-foreground">
                    450px × 500px panel with categorized results and recent searches.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/5">
                  <h4 className="text-sm font-medium text-white/80 mb-2">Tools Expanded</h4>
                  <p className="text-xs text-muted-foreground">
                    380px × 480px panel showing contextual tools with names, descriptions, status indicators, and quick action buttons.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Page Context Switcher */}
          <Card className="p-6">
            <h3 className="text-xl font-display mb-4" data-display-font>Try Different Contexts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The Omni-Launcher adapts its tool suggestions based on the current page context.
              Try switching between different pages to see how the tools change. Click the Tools button (Layers icon) in the launcher to see the contextual tools panel.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={currentPage === 'overview' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('overview')}
                className="btn-nexus btn-nexus--secondary"
              >
                Overview
              </Button>
              <Button
                variant={currentPage === 'build' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('build')}
                className="btn-nexus btn-nexus--secondary"
              >
                Build
              </Button>
              <Button
                variant={currentPage === 'catalog' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('catalog')}
                className="btn-nexus btn-nexus--secondary"
              >
                Catalog
              </Button>
              <Button
                variant={currentPage === 'monitor' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('monitor')}
                className="btn-nexus btn-nexus--secondary"
              >
                Monitor
              </Button>
            </div>
          </Card>

          {/* Implementation Notes */}
          <div className="p-6 rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#5B6EFF]" />
              <span className="font-medium">Implementation Notes</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>The launcher persists across all pages, maintaining context and state</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Tools panel shows contextual tools with descriptions and status for better clarity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>AI chat maintains conversation history throughout the session</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Search indexes across NiFi, DataHub, Airflow, and documentation</span>
              </li>
            </ul>
          </div>
        </section>

        <CompactDivider label="TYPOGRAPHY" />

        {/* Typography Showcase */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Typography System</h2>
            <p className="text-xl text-muted-foreground">
              Combining Reckless serif for display and Roobert sans for body text
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-body font-semibold">Display Typography</h3>
              <div className="space-y-4">
                <h1 className="text-6xl font-display" data-display-font>Heading 1 <span className="text-sm text-muted-foreground">(Reckless)</span></h1>
                <h2 className="text-5xl font-display" data-display-font>Heading 2 <span className="text-sm text-muted-foreground">(Reckless)</span></h2>
                <h3 className="text-4xl font-body font-semibold">Heading 3 <span className="text-sm text-muted-foreground">(Roobert)</span></h3>
                <h4 className="text-3xl font-body font-semibold">Heading 4 <span className="text-sm text-muted-foreground">(Roobert)</span></h4>
                <h5 className="text-2xl font-body font-semibold">Heading 5 <span className="text-sm text-muted-foreground">(Roobert)</span></h5>
                <h6 className="text-xl font-body font-semibold">Heading 6 <span className="text-sm text-muted-foreground">(Roobert)</span></h6>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-body font-semibold">Body & Accent Typography</h3>
              <div className="space-y-4">
                <p className="roobert-lead">
                  This is lead text in Roobert - perfect for introductions and opening paragraphs that need to stand out without using display fonts.
                </p>

                <div className="space-y-3">
                  <h4 className="roobert-headline roobert-headline--xl">Roobert XL Headline</h4>
                  <h5 className="roobert-headline roobert-headline--lg">Roobert Large Headline</h5>
                  <h6 className="roobert-headline roobert-headline--md">Roobert Medium Headline</h6>
                  <p className="roobert-headline roobert-headline--sm">Roobert Small Caps Headline</p>
                </div>

                <div className="flex gap-4 flex-wrap">
                  <span className="roobert-accent">Default Accent</span>
                  <span className="roobert-accent roobert-accent--primary">Primary Accent</span>
                  <span className="roobert-accent roobert-accent--accent">Success Accent</span>
                </div>

                <p className="text-lg leading-relaxed">
                  Standard body text in Roobert. It&apos;s optimized for readability with generous line-height and comfortable spacing.
                </p>
                <p className="text-base text-muted-foreground">
                  Secondary text appears slightly muted but maintains excellent readability.
                </p>
                <code className="block p-4 bg-muted rounded-lg font-mono text-sm">
                  const designSystem = &apos;NexusOne Enhanced&apos;;
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Pixel Icons Showcase */}
        <PixelIconsShowcase />

        {/* Advanced Charts Showcase */}
        <AdvancedChartsShowcase />

        {/* OmniLauncher Enhanced Showcase */}
        <OmniLauncherShowcase />

        {/* Custom Icons Showcase */}
        <CustomIconsShowcase />

        <SectionDivider label="VISUAL ELEMENTS" />

        {/* Color System */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Color Palette</h2>
            <p className="text-xl text-muted-foreground">
              Vibrant colors optimized for dark mode interfaces
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="h-32 rounded-lg bg-primary flex items-end p-4">
                <span className="text-primary-foreground text-sm font-medium">Primary</span>
              </div>
              <p className="text-sm text-muted-foreground">#6366F1</p>
            </div>
            <div className="space-y-3">
              <div className="h-32 rounded-lg bg-accent flex items-end p-4">
                <span className="text-accent-foreground text-sm font-medium">Accent</span>
              </div>
              <p className="text-sm text-muted-foreground">#10B981</p>
            </div>
            <div className="space-y-3">
              <div className="h-32 rounded-lg bg-secondary flex items-end p-4">
                <span className="text-secondary-foreground text-sm font-medium">Secondary</span>
              </div>
              <p className="text-sm text-muted-foreground">#F43F5E</p>
            </div>
            <div className="space-y-3">
              <div className="h-32 rounded-lg bg-chart-4 flex items-end p-4">
                <span className="text-white text-sm font-medium">Tertiary</span>
              </div>
              <p className="text-sm text-muted-foreground">#F59E0B</p>
            </div>
          </div>
        </section>

        {/* Button Variants */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Button System</h2>
            <p className="text-xl text-muted-foreground">
              Multiple variants and sizes with smooth hover states
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Button className="btn-nexus btn-nexus--primary">
                Primary Button
              </Button>
              <Button className="btn-nexus btn-nexus--secondary">
                Secondary Button
              </Button>
              <Button className="btn-nexus btn-nexus--ghost">
                Ghost Button
              </Button>
              <Button variant="destructive">
                Destructive
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <Button className="btn-nexus btn-nexus--primary btn-nexus--sm">
                Small
              </Button>
              <Button className="btn-nexus btn-nexus--primary">
                Default
              </Button>
              <Button className="btn-nexus btn-nexus--primary btn-nexus--lg">
                Large
              </Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button className="btn-nexus btn-nexus--primary">
                <Zap className="mr-2 h-4 w-4" />
                With Icon
              </Button>
              <Button className="btn-nexus btn-nexus--secondary">
                <Globe className="mr-2 h-4 w-4" />
                Global Action
              </Button>
              <Button disabled>
                Disabled State
              </Button>
            </div>
          </div>
        </section>

        {/* Card Components */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Card System</h2>
            <p className="text-xl text-muted-foreground">
              Cards with gradient borders and hover effects
            </p>
          </div>

          <div className="grid-nexus grid-nexus--3">
            {/* Standard Card */}
            <div className="card-nexus">
              <div className="card-nexus__header">
                <h3 className="card-nexus__title" data-display-font>Real-time Validation</h3>
                <p className="card-nexus__subtitle">Active monitoring</p>
              </div>
              <div className="card-nexus__body">
                Validate data quality in real-time as it flows through your systems with intelligent monitoring.
              </div>
              <div className="card-nexus__footer">
                <Button size="sm" className="w-full">View Details</Button>
              </div>
            </div>

            {/* Gradient Border Card */}
            <div className="card-nexus card-nexus--gradient">
              <div className="card-nexus__header">
                <h3 className="card-nexus__title gradient-text" data-display-font>AI-Powered</h3>
                <p className="card-nexus__subtitle">Machine Learning</p>
              </div>
              <div className="card-nexus__body">
                Leverage advanced AI to automatically detect patterns and optimize your data workflows.
              </div>
              <div className="card-nexus__footer">
                <div className="flex gap-2">
                  <Badge className="bg-primary/20 text-primary">AI</Badge>
                  <Badge className="bg-accent/20 text-accent">ML</Badge>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <Card className="p-6 border-accent/50 bg-accent/5">
              <AsciiBorder>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Shield className="h-8 w-8 text-accent" />
                    <div className="status-nexus">
                      <span className="status-nexus__dot status-nexus__dot--processing"></span>
                      <span>Processing</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-display" data-display-font>Security First</h3>
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade security with end-to-end encryption.
                  </p>
                </div>
              </AsciiBorder>
            </Card>
          </div>
        </section>

        {/* Status Indicators */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Status & Badges</h2>
            <p className="text-xl text-muted-foreground">
              Visual indicators for system states
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="status-nexus">
              <span className="status-nexus__dot bg-green-500"></span>
              <span>Operational</span>
            </div>
            <div className="status-nexus">
              <span className="status-nexus__dot status-nexus__dot--processing"></span>
              <span>Processing</span>
            </div>
            <div className="status-nexus">
              <span className="status-nexus__dot bg-red-500"></span>
              <span>Critical</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-primary/20 text-primary border-primary/50">Custom</Badge>
            <Badge className="bg-accent/20 text-accent border-accent/50">Success</Badge>
            <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/50">Warning</Badge>
          </div>
        </section>

        <CompactDivider label="INTERACTIVE ELEMENTS" />

        {/* Interactive Components */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Interactive Elements</h2>
            <p className="text-xl text-muted-foreground">
              Forms, tabs, and progress indicators
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="p-6">
              <EnhancedTabs value={activeTab} onValueChange={setActiveTab}>
                <EnhancedTabsList className="grid w-full grid-cols-3">
                  <EnhancedTabsTrigger value="overview">Overview</EnhancedTabsTrigger>
                  <EnhancedTabsTrigger value="analytics">Analytics</EnhancedTabsTrigger>
                  <EnhancedTabsTrigger value="reports">Reports</EnhancedTabsTrigger>
                </EnhancedTabsList>
                <EnhancedTabsContent value="overview" className="space-y-4">
                  <h3 className="text-xl font-display" data-display-font>System Overview</h3>
                  <p className="text-muted-foreground">
                    Monitor your entire data ecosystem from a single dashboard.
                  </p>
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">75% Complete</p>
                </EnhancedTabsContent>
                <EnhancedTabsContent value="analytics" className="space-y-4">
                  <h3 className="text-xl font-display" data-display-font>Analytics Dashboard</h3>
                  <p className="text-muted-foreground">
                    Deep insights into your data pipeline performance.
                  </p>
                </EnhancedTabsContent>
                <EnhancedTabsContent value="reports" className="space-y-4">
                  <h3 className="text-xl font-display" data-display-font>Reports</h3>
                  <p className="text-muted-foreground">
                    Generate comprehensive reports for stakeholders.
                  </p>
                </EnhancedTabsContent>
              </EnhancedTabs>
            </Card>

            <Card className="p-6">
              <div className="space-y-6">
                <h3 className="text-xl font-display" data-display-font>Quick Actions</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search" className="label-nexus">Search pipelines</Label>
                    <div className="relative">
                      <Input
                        id="search"
                        placeholder="Enter pipeline name..."
                        className="input-nexus pr-10"
                      />
                      <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="domain" className="label-nexus">Select domain</Label>
                    <Input
                      id="domain"
                      placeholder="Customer, Product, Financial..."
                      className="input-nexus"
                    />
                  </div>

                  <Button className="w-full btn-nexus btn-nexus--primary">
                    Execute Query
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Feature Showcase</h2>
            <p className="text-xl text-muted-foreground">
              Complete data orchestration capabilities
            </p>
          </div>

          <div className="grid-nexus grid-nexus--4">
            {[
              { icon: Database, title: 'Data Integration', color: 'text-primary' },
              { icon: Shield, title: 'Security', color: 'text-accent' },
              { icon: Activity, title: 'Monitoring', color: 'text-secondary' },
              { icon: Bot, title: 'AI Assistant', color: 'text-chart-4' },
              { icon: Layers, title: 'Multi-Layer', color: 'text-primary' },
              { icon: TrendingUp, title: 'Analytics', color: 'text-accent' },
              { icon: Users, title: 'Collaboration', color: 'text-secondary' },
              { icon: Terminal, title: 'CLI Tools', color: 'text-chart-4' },
            ].map(({ icon: Icon, title, color }, idx) => (
              <Card
                key={idx}
                className="p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <Icon className={cn('h-10 w-10 mb-4', color)} />
                <h3 className="font-display text-lg mb-2" data-display-font>{title}</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced {title.toLowerCase()} capabilities for enterprise teams.
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Highlight Examples */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Realistic Text Highlights</h2>
            <p className="text-xl text-muted-foreground">
              Natural highlighter effects with subtle angles and transparency
            </p>
          </div>

          <div className="space-y-6">
            <p className="text-lg leading-relaxed">
              The system detected a <span className="highlight-nexus">critical issue</span> in
              the data pipeline that requires immediate attention. Our{' '}
              <span className="highlight-nexus highlight-nexus--accent">AI agents</span> have
              already analyzed the problem and suggested{' '}
              <span className="highlight-nexus highlight-nexus--tertiary">three solutions</span>.
            </p>

            <p className="text-lg leading-relaxed">
              Different highlight styles: <span className="highlight-nexus">Primary blue</span>,{' '}
              <span className="highlight-nexus highlight-nexus--accent">Mint green</span>,{' '}
              <span className="highlight-nexus highlight-nexus--secondary">Coral pink</span>,{' '}
              <span className="highlight-nexus highlight-nexus--tertiary">Amber yellow</span>, and even{' '}
              <span className="highlight-nexus highlight-nexus--double">double highlights</span> for extra emphasis.
            </p>

            <div className="space-y-3">
              <h3 className="roobert-headline roobert-headline--lg">
                Works great with <span className="highlight-nexus highlight-nexus--accent">Roobert headlines</span> too
              </h3>
              <p className="roobert-lead">
                And even in lead text with <span className="highlight-nexus highlight-nexus--tertiary">important callouts</span> that need to stand out.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-secondary" />
                <span className="font-medium">Alert Summary</span>
              </div>
              <p>
                Schema changes detected in <code className="px-2 py-1 bg-primary/10 text-primary rounded">customer_events</code> table
                affecting <span className="font-semibold text-accent">3 downstream pipelines</span>.
              </p>
            </div>
          </div>
        </section>

        <SectionDivider label="COMPONENT SHOWCASE" />

        {/* Metric Cards Dashboard */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Dashboard Metrics</h2>
            <p className="text-xl text-muted-foreground">
              Key performance indicators with trend visualization and hover effects
            </p>
          </div>
          <MetricsGrid>
            <MetricCard
              value="98.7%"
              label="Success Rate"
              trend="+2.3%"
              trendDirection="up"
              icon="✓"
              color="#00E5C8"
            />
            <MetricCard
              value="1,247"
              label="Active Pipelines"
              trend="+15"
              trendDirection="up"
              icon="⚡"
              color="#5B6EFF"
            />
            <MetricCard
              value="3"
              label="Failed Jobs"
              trend="-2"
              trendDirection="down"
              icon="✕"
              color="#FF6B7A"
            />
            <MetricCard
              value="12ms"
              label="Avg Latency"
              trend="-3ms"
              trendDirection="down"
              icon="⏱"
              color="#FFB366"
            />
          </MetricsGrid>
        </section>

        {/* Status Badges */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Status Indicators</h2>
            <p className="text-xl text-muted-foreground">
              Pipeline and job status badges with animations for active states
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <StatusBadge status="running" />
            <StatusBadge status="success" />
            <StatusBadge status="failed" />
            <StatusBadge status="pending" />
            <StatusBadge status="paused" />
            <StatusBadge status="warning" />
          </div>
          <div className="flex flex-wrap gap-4">
            <StatusBadge status="running" size="sm" />
            <StatusBadge status="success" size="lg" />
            <StatusBadge status="failed" showIcon={false} />
          </div>
        </section>

        {/* Activity Feed */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Activity Monitoring</h2>
            <p className="text-xl text-muted-foreground">
              Real-time activity streams for pipeline events and system monitoring
            </p>
          </div>
          <div className="max-w-md">
            <ActivityFeedExample />
          </div>
        </section>

        {/* Navigation Component */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Navigation System</h2>
            <p className="text-xl text-muted-foreground">
              Main navigation bar with dropdown menus and responsive design
            </p>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <NavigationExample />
          </div>
        </section>

        {/* Clean Pipeline Table - New Apple-like Design */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Clean Pipeline Table</h2>
            <p className="text-xl text-muted-foreground">
              Modern, spacious table with Apple-like clarity and minimal terminal DNA.
              95% modern design with only 5% terminal accents in data presentation.
            </p>
          </div>
          <div className="-mx-24">
            <PipelineTable />
          </div>
        </section>

        {/* Data Table Component */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Legacy Data Tables</h2>
            <p className="text-xl text-muted-foreground">
              TanStack table with sorting, filtering, and pagination for pipeline management
            </p>
          </div>
          <DataTableExample />
        </section>

        {/* Visualizations */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Data Visualizations</h2>
            <p className="text-xl text-muted-foreground">
              VisX charts for monitoring quality trends, pipeline metrics, and resource usage. Click ASCII toggles to see alternative terminal-style charts.
            </p>
          </div>
          <VisualizationExamples />
        </section>

        {/* ASCII Chart Showcase */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>
              Terminal Charts
            </h2>
            <p className="text-xl text-muted-foreground">
              Pure text-based charts for terminal interfaces and data engineering workflows.
              Nostalgic yet functional visualizations with authentic monospace aesthetics.
            </p>
          </div>

          {/* Hero Terminal Charts - Live Real-time Data */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display" data-display-font>Hero Terminal Dashboard</h3>
            <p className="text-muted-foreground">
              Live terminal charts with real-time WebSocket data streaming.
              Authentic terminal experience for data engineers with enterprise-grade monitoring.
            </p>

            {/* Full Dashboard */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-foreground">Complete Operations Dashboard</h4>
              <HeroTerminalChart
                title="NexusOne Operations Center"
                height={400}
                className="w-full"
              />
            </div>

            {/* Individual Charts Grid */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-foreground">Individual Hero Charts</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PipelineSuccessChart
                  title="Pipeline Success Rate"
                  height={200}
                />
                <ResourceUsageChart
                  title="Resource Usage"
                  height={200}
                />
                <DataQualityChart
                  title="Data Quality Score"
                  height={200}
                />
                <ThroughputChart
                  title="Processing Throughput"
                  height={200}
                />
              </div>
            </div>
          </div>

          {/* NexusOne Data Command Interface */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display" data-display-font>Enhanced Data Command Interface</h3>
            <p className="text-muted-foreground">
              Intelligent multi-mode command palette with glassmorphism effects, split-view preview,
              and AI-powered data exploration. Goes beyond basic command palettes with contextual intelligence.
            </p>

            {/* Demo Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setCommandOpen(true)}
                className="btn-nexus btn-nexus--primary"
              >
                <Search className="w-4 h-4 mr-2" />
                Open Data Command
                <kbd className="ml-2 text-xs bg-white/10 px-2 py-1 rounded">⌘K</kbd>
              </Button>
              <Button
                variant="outline"
                className="btn-nexus btn-nexus--secondary"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Mode Demo
                <kbd className="ml-2 text-xs bg-white/10 px-2 py-1 rounded">⌘I</kbd>
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 space-y-2 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Multi-Mode Search</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Search, Query, Pipeline, and AI modes with contextual switching
                </p>
              </Card>

              <Card className="p-4 space-y-2 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Live Preview</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Split-view with real-time data previews and metadata
                </p>
              </Card>

              <Card className="p-4 space-y-2 bg-gradient-to-br from-chart-4/10 to-destructive/10 border-chart-4/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-chart-4" />
                  <span className="text-sm font-medium">Smart Grouping</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Intelligent categorization by usage, quality, and status
                </p>
              </Card>

              <Card className="p-4 space-y-2 bg-gradient-to-br from-destructive/10 to-primary/10 border-destructive/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium">AI Assistance</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Natural language to SQL and contextual suggestions
                </p>
              </Card>
            </div>

            {/* Style Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <h4 className="font-medium text-foreground">Visual Enhancements</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Glassmorphism backdrop with blur effects
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Gradient accents for active states
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Smooth hover animations and micro-interactions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Quality indicators with pulsing animations
                  </li>
                </ul>
              </Card>

              <Card className="p-6 space-y-4">
                <h4 className="font-medium text-foreground">Data-Specific Features</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Type-specific icons and color coding
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Status indicators for pipeline health
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Row counts and data freshness metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    Contextual actions per asset type
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Enhanced Metric Cards with ASCII features */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display" data-display-font>Enhanced Metric Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <ProgressMetricCard
                value="87%"
                label="Pipeline Health"
                progressValue={87}
                color="#00E5C8"
                chartColor="accent"
              />
              <GaugeMetricCard
                value={94}
                label="Data Quality"
                maxValue={100}
                color="#5B6EFF"
                chartColor="primary"
              />
              <SparklineMetricCard
                value="2.3M"
                label="Records Processed"
                sparklineData={[18, 22, 19, 25, 28, 24, 32, 29, 35, 31]}
                trendDirection="up"
                color="#FFB366"
                chartColor="tertiary"
              />
              <FullFeaturedMetricCard
                value="143ms"
                label="Avg Response Time"
                progressValue={72}
                sparklineData={[180, 165, 152, 143, 135, 148, 142, 139, 143, 141]}
                trendDirection="down"
                color="#FF6B7A"
                chartColor="secondary"
              />
            </div>
          </div>

          {/* Mini ASCII Charts */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display" data-display-font>Mini ASCII Chart Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 space-y-4">
                <h4 className="font-mono text-sm text-muted-foreground">Progress Bars</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU</span>
                    <MiniProgressBar value={73} color="primary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory</span>
                    <MiniProgressBar value={89} color="accent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Disk</span>
                    <MiniProgressBar value={45} color="secondary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h4 className="font-mono text-sm text-muted-foreground">Gauges</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quality</span>
                    <MetricGauge value={94} color="accent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Coverage</span>
                    <MetricGauge value={78} color="primary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Health</span>
                    <MetricGauge value={82} color="tertiary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h4 className="font-mono text-sm text-muted-foreground">Sparklines</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Requests</span>
                    <MiniSparkline trendData={[12, 15, 18, 22, 19, 25]} color="accent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Errors</span>
                    <MiniSparkline trendData={[8, 5, 3, 6, 2, 1]} color="secondary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Latency</span>
                    <MiniSparkline trendData={[145, 142, 138, 135, 132, 130]} color="primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h4 className="font-mono text-sm text-muted-foreground">Quality Dots</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Excellent</span>
                    <QualityDots value={95} color="accent" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Good</span>
                    <QualityDots value={75} color="primary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fair</span>
                    <QualityDots value={45} color="tertiary" />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* ASCII Line Charts */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display" data-display-font>ASCII Line Charts</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <QualityTrendASCII
                  qualityData={[92, 94, 91, 95, 97, 96, 98, 95, 96, 97]}
                  validityData={[88, 90, 87, 92, 94, 95, 96, 93, 94, 95]}
                />
              </Card>
              <Card className="p-6">
                <ASCIILineChart
                  data={[45, 52, 48, 61, 58, 67, 72, 69, 74, 78]}
                  title="System Performance"
                  height={8}
                  colors={["accent"]}
                  showTerminalEffect
                />
              </Card>
            </div>
          </div>

          {/* ASCII Bar Charts */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display" data-display-font>ASCII Bar Charts</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <PipelineRunsASCII
                  pipelineData={[
                    { pipeline: 'ETL-1', success: 45, failed: 5 },
                    { pipeline: 'ETL-2', success: 38, failed: 3 },
                    { pipeline: 'Analytics', success: 52, failed: 8 },
                    { pipeline: 'Reporting', success: 41, failed: 2 }
                  ]}
                />
              </Card>
              <Card className="p-6">
                <ASCIIBarChart
                  data={[
                    { label: 'CPU', value: 73, color: 'positive' },
                    { label: 'Memory', value: 89, color: 'neutral' },
                    { label: 'Disk', value: 45, color: 'positive' },
                    { label: 'Network', value: 67, color: 'positive' }
                  ]}
                  title="Resource Utilization"
                  orientation="horizontal"
                  showTerminalEffect
                />
              </Card>
            </div>
          </div>

          {/* Clean Status Examples */}
          <div className="space-y-6">
            <h3 className="text-2xl font-display" data-display-font>Status Indicators</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-black text-white font-mono">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-accent mb-4">Pipeline Status</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span>ETL-1</span>
                      <div className="flex items-center gap-2">
                        <span className="text-accent">►</span>
                        <span className="text-accent">RUNNING</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ETL-2</span>
                      <div className="flex items-center gap-2">
                        <span className="text-accent">✓</span>
                        <span className="text-accent">SUCCESS</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ETL-3</span>
                      <div className="flex items-center gap-2">
                        <span className="text-chart-4">○</span>
                        <span className="text-chart-4">PENDING</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ETL-4</span>
                      <div className="flex items-center gap-2">
                        <span className="text-destructive">✕</span>
                        <span className="text-destructive">FAILED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-accent mb-4">Quality Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completeness</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: '94%' }} />
                        </div>
                        <span className="text-sm font-mono">94%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Validity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: '82%' }} />
                        </div>
                        <span className="text-sm font-mono">82%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Consistency</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-chart-4 rounded-full" style={{ width: '76%' }} />
                        </div>
                        <span className="text-sm font-mono">76%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-primary mb-4">Real-time Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">RPS</span>
                      <div className="flex items-center gap-2">
                        <MiniSparkline trendData={[12, 15, 18, 14, 19, 22]} color="primary" />
                        <span className="text-sm font-mono">22</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CPU</span>
                      <div className="flex items-center gap-2">
                        <MetricGauge value={67} color="primary" />
                        <span className="text-sm font-mono">67%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Queue</span>
                      <div className="flex items-center gap-2">
                        <TrendIndicator trendData={[45, 38, 42]} color="primary" />
                        <span className="text-sm font-mono">42</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Spacing Demonstration */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Generous Spacing</h2>
            <p className="text-xl text-muted-foreground">
              Premium feel with breathing room between elements
            </p>
          </div>

          <Card className="p-12 space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-display" data-display-font>Section Title</h3>
              <p className="text-muted-foreground">
                Notice the generous 48px (3rem) spacing between sections
              </p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-2">
              <h3 className="text-2xl font-display" data-display-font>Another Section</h3>
              <p className="text-muted-foreground">
                Components have 32px (2rem) internal padding for comfort
              </p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-2">
              <h3 className="text-2xl font-display" data-display-font>Final Section</h3>
              <p className="text-muted-foreground">
                Minimum 24px (1.5rem) gaps between related elements
              </p>
            </div>
          </Card>
        </section>

        {/* Animation Examples */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Smooth Animations</h2>
            <p className="text-xl text-muted-foreground">
              250-350ms transitions for elegant interactions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 animate-fade-in">
              <h3 className="text-lg font-display mb-2" data-display-font>Fade In</h3>
              <p className="text-sm text-muted-foreground">Smooth entrance animation</p>
            </Card>

            <Card className="p-6 animate-slide-in animate-delay-100">
              <h3 className="text-lg font-display mb-2" data-display-font>Slide In</h3>
              <p className="text-sm text-muted-foreground">Lateral movement with fade</p>
            </Card>

            <Card className="p-6 animate-fade-in animate-delay-200 hover:scale-105 transition-transform">
              <h3 className="text-lg font-display mb-2" data-display-font>Scale on Hover</h3>
              <p className="text-sm text-muted-foreground">Interactive feedback</p>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-24 space-y-8">
          <h2 className="text-5xl font-display" data-display-font>
            Ready to transform your{' '}
            <span className="gradient-text">data operations</span>?
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of data teams using NexusOne to orchestrate their entire tool ecosystem.
          </p>

          <div className="flex gap-4 justify-center">
            <Button className="btn-nexus btn-nexus--primary btn-nexus--lg">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button className="btn-nexus btn-nexus--secondary btn-nexus--lg">
              Book a Demo
            </Button>
          </div>

          <div className="mt-16">
            <code className="ascii-accent text-lg">└─── ASCII Enhanced Design System ───┘</code>
          </div>
        </section>
      </div>

      {/* Enhanced Data Command Interface */}
      <NexusDataCommand
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onExecuteQuery={(sql) => {
          console.log('Execute query:', sql);
          setCommandOpen(false);
        }}
        onPreviewAsset={(asset) => {
          console.log('Preview asset:', asset);
        }}
      />
    </div>
  );
}