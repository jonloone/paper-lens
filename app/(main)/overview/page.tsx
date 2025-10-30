'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Rocket,
  Search,
  Activity,
  Code,
  Database,
  BarChart2,
  Shield,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Target,
  Brain,
  Zap,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useRecentPages } from '@/hooks/use-recent-pages';

// User detection - in production, get from auth context
const getCurrentUser = () => {
  // TODO: Replace with actual auth context
  return {
    id: 'finance_analyst_1',
    name: 'Sarah Chen',
    department: 'finance',
    role: 'Senior Data Analyst'
  };
};

interface AIRecommendation {
  product_id: string;
  product_name: string;
  product_type: string;
  domain: string;
  description: string;
  score: number;
  source: string;
  reasoning: string[];
  similar_users_count?: number;
  usage_count?: number;
  quality_score?: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  gradient: string;
}

export default function AIFirstHomepage() {
  const currentUser = getCurrentUser();
  const recentPages = useRecentPages();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch AI recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoadingRecommendations(true);
        const response = await fetch('/api/recommendations/discover/hybrid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            user_department: currentUser.department,
            business_keywords: [],
            limit: 6
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [currentUser.id, currentUser.department]);

  // Quick actions with gradients
  const quickActions: QuickAction[] = [
    {
      id: 'build',
      title: 'Build',
      description: 'Create data product',
      icon: Rocket,
      href: '/build',
      gradient: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      id: 'discover',
      title: 'Discover',
      description: 'Explore data catalog',
      icon: Search,
      href: '/discover',
      gradient: 'from-purple-500/10 to-pink-500/10'
    },
    {
      id: 'query',
      title: 'Write SQL',
      description: 'AI-powered workstation',
      icon: Code,
      href: '/develop',
      gradient: 'from-green-500/10 to-emerald-500/10'
    },
    {
      id: 'connect',
      title: 'Connect',
      description: 'Add data sources',
      icon: Database,
      href: '/connect',
      gradient: 'from-orange-500/10 to-amber-500/10'
    }
  ];

  // Get source badge color
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'hybrid':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'collaborative':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pattern':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Get product type badge
  const getProductTypeBadge = (type: string) => {
    switch (type) {
      case 'Foundation':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
      case 'Domain':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'Solution':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">

        {/* Hero Section - User Context */}
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-bold">
              Good {getTimeOfDay()}, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentUser.role} • {currentUser.department.charAt(0).toUpperCase() + currentUser.department.slice(1)} Team
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.id} href={action.href}>
                  <Card className={cn(
                    "p-4 transition-all duration-200 cursor-pointer group",
                    "hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/30",
                    "bg-gradient-to-br", action.gradient
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-0.5">{action.title}</h3>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations - Main Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Recommended for You</h2>
          </div>

          {loadingRecommendations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-6 border-2 border-dashed">
              <div className="text-center">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Recommendations Unavailable</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            </Card>
          ) : recommendations.length === 0 ? (
            <Card className="p-6 border-2 border-dashed">
              <div className="text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Building Your Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start exploring data products to get personalized recommendations
                </p>
                <Link href="/discover">
                  <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
                    Discover Data Products
                  </button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <Link
                  key={rec.product_id}
                  href={`/discover/${rec.product_id}`}
                  className="group"
                >
                  <Card className="p-4 h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/30 cursor-pointer">
                    <div className="space-y-3">
                      {/* Header with badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {rec.product_name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              getProductTypeBadge(rec.product_type)
                            )}>
                              {rec.product_type}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              getSourceBadge(rec.source)
                            )}>
                              {rec.source === 'hybrid' ? 'Best Match' :
                               rec.source === 'collaborative' ? 'Popular' : 'Trending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Domain */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Database className="w-3.5 h-3.5" />
                        <span>{rec.domain}</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {rec.description}
                      </p>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-xs">
                        {rec.quality_score && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span className="font-medium">{Math.round(rec.quality_score)}%</span>
                            <span className="text-muted-foreground">Quality</span>
                          </div>
                        )}
                        {rec.usage_count && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium">{rec.usage_count}</span>
                            <span className="text-muted-foreground">Uses</span>
                          </div>
                        )}
                        {rec.similar_users_count && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span className="font-medium">{rec.similar_users_count}</span>
                            <span className="text-muted-foreground">Users</span>
                          </div>
                        )}
                      </div>

                      {/* Reasoning (first item) */}
                      {rec.reasoning && rec.reasoning.length > 0 && (
                        <div className="pt-2 border-t border-border/40">
                          <div className="flex items-start gap-2">
                            <Brain className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {rec.reasoning[0]}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Match Score */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                              style={{ width: `${Math.min(rec.score, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-primary">
                            {Math.round(rec.score)}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* View All Link */}
          {recommendations.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                View all data products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Recently Viewed - Only show if there are recent pages */}
        {recentPages.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentPages.slice(0, 4).map((page) => {
                const IconMap: Record<string, any> = {
                  Rocket, Search, Activity, Code, Database, BarChart2, Shield, FileText
                };
                const Icon = IconMap[page.icon] || FileText;
                const timeAgo = getTimeAgo(page.timestamp);

                return (
                  <Link key={page.path} href={page.path}>
                    <Card className="p-3 hover:shadow-md transition-all cursor-pointer border hover:border-primary/30 group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{page.title}</h3>
                          <p className="text-xs text-muted-foreground">{timeAgo}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Connect Your Data Sources CTA */}
        <Card className="p-6 bg-muted/30 border-dashed">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold mb-2 text-foreground/80">Connect to NexusOne Ecosystem</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your existing infrastructure and tools to unlock intelligent orchestration, cross-system insights, and automated workflows across your entire data platform.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground/70 mb-4">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Orchestration
                </span>
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Catalogs
                </span>
                <span className="flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  Query Engines
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Governance
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/connect">
                  <button className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-foreground/80">
                    Connect Data Sources
                  </button>
                </Link>
                <Link href="/manage/connections">
                  <button className="px-4 py-2 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors text-sm font-medium text-muted-foreground">
                    View Connections
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}

// Helper function to get time of day greeting
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

// Helper function to get time ago string
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
