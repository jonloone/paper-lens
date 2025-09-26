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
  Bell,
  User,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavigationExample } from '@/components/design-system/NavigationExample';
import { DataTableExample } from '@/components/design-system/DataTableExample';
import { VisualizationExamples } from '@/components/design-system/VisualizationExamples';
import { MetricCard, MetricsGrid } from '@/components/design-system/MetricCard';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { ActivityFeedExample } from '@/components/design-system/ActivityFeed';

export default function DesignSystemPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar on mount
    const timer = setTimeout(() => setProgress(75), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="nexus-enhanced min-h-screen bg-background">

      {/* Hero Section with Gradient */}
      <section className="hero-nexus hero-nexus--gradient">
        <div className="container-nexus">
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
              <h3 className="text-2xl font-display" data-display-font>Display Typography</h3>
              <div className="space-y-4">
                <h1 className="text-6xl font-display" data-display-font>Heading 1</h1>
                <h2 className="text-5xl font-display" data-display-font>Heading 2</h2>
                <h3 className="text-4xl font-display" data-display-font>Heading 3</h3>
                <h4 className="text-3xl font-display" data-display-font>Heading 4</h4>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-display" data-display-font>Body & Accent Typography</h3>
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
              <div className="h-32 rounded-lg bg-[#F59E0B] flex items-end p-4">
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
            <Badge className="bg-tertiary/20 text-[#F59E0B] border-tertiary/50">Warning</Badge>
          </div>
        </section>

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
              { icon: Bot, title: 'AI Assistant', color: 'text-[#F59E0B]' },
              { icon: Layers, title: 'Multi-Layer', color: 'text-primary' },
              { icon: TrendingUp, title: 'Analytics', color: 'text-accent' },
              { icon: Users, title: 'Collaboration', color: 'text-secondary' },
              { icon: Terminal, title: 'CLI Tools', color: 'text-[#F59E0B]' },
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

        {/* Data Table Component */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-display" data-display-font>Data Tables</h2>
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
              VisX charts for monitoring quality trends, pipeline metrics, and resource usage
            </p>
          </div>
          <VisualizationExamples />
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
        </section>
      </div>
    </div>
  );
}