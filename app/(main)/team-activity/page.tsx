'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Trophy, Users, Lightbulb, TrendingUp, MessageSquare,
  BookOpen, Star, ThumbsUp, Share2, Bot,
  ArrowRight, Sparkles, Target, Database, GitBranch,
  Zap, Calendar, User, Hash, Rocket,
  BarChart3, Code, Award, Briefcase
} from 'lucide-react';

interface Achievement {
  id: string;
  user: string;
  role: string;
  achievement: string;
  description: string;
  timeAgo: string;
  pattern?: string;
  impact?: string;
  likes: number;
  useful: number;
}

interface KnowledgeItem {
  id: string;
  type: 'best-practice' | 'discovery' | 'success-story';
  title: string;
  author: string;
  description: string;
  impact: string;
  aiSuggestion?: string;
  appliedCount?: number;
  tags: string[];
}

interface CollaborationSuccess {
  id: string;
  teams: string[];
  project: string;
  impact: string;
  opportunity?: string;
}

export default function TeamActivityPage() {
  const recentAchievements: Achievement[] = [
    {
      id: '1',
      user: 'Sarah',
      role: 'Data Analyst',
      achievement: 'Improved customer data quality to 94%',
      description: 'Used entity resolution pattern with Splink configuration for deduplication',
      timeAgo: '2 hours ago',
      pattern: 'Entity Resolution Pattern',
      impact: 'Enabled accurate customer analytics for Q4 reporting',
      likes: 3,
      useful: 3
    },
    {
      id: '2',
      user: 'Mike',
      role: 'Data Engineer',
      achievement: 'Deployed real-time fraud detection pipeline',
      description: 'Streaming pipeline processing 50K events/sec with <100ms latency',
      timeAgo: 'Yesterday',
      pattern: 'Stream Processing Pattern',
      impact: 'Prevented $250K in fraudulent transactions in first 24 hours',
      likes: 12,
      useful: 5
    },
    {
      id: '3',
      user: 'Lisa',
      role: 'ML Engineer',
      achievement: 'Feature engineering improved churn prediction by 15%',
      description: 'Created behavioral aggregation features using time-window approach',
      timeAgo: '3 days ago',
      pattern: 'Feature Engineering Pattern',
      impact: 'Marketing team reduced churn by 8% using new model',
      likes: 8,
      useful: 4
    }
  ];

  const knowledgeSharing: KnowledgeItem[] = [
    {
      id: 'k1',
      type: 'best-practice',
      title: 'dbt model performance optimization',
      author: 'Alex',
      description: 'Discovered 3x speedup using incremental materialization with proper unique keys',
      impact: '40% reduction in daily compute costs',
      aiSuggestion: 'Apply this pattern to 8 other slow models in your project',
      appliedCount: 2,
      tags: ['dbt', 'performance', 'cost-optimization']
    },
    {
      id: 'k2',
      type: 'success-story',
      title: 'Customer churn prediction accuracy +15%',
      author: 'Lisa',
      description: 'Feature engineering approach using behavioral windows now documented as pattern',
      impact: 'Used by 2 other teams this week with similar improvements',
      appliedCount: 2,
      tags: ['ml', 'feature-engineering', 'churn']
    },
    {
      id: 'k3',
      type: 'discovery',
      title: 'Kafka partition rebalancing strategy',
      author: 'Mike',
      description: 'Auto-scaling consumer groups based on lag metrics prevents bottlenecks',
      impact: '99.9% uptime achieved for streaming pipelines',
      aiSuggestion: 'Your order processing pipeline could benefit from this approach',
      tags: ['kafka', 'streaming', 'reliability']
    }
  ];

  const collaborationSuccesses: CollaborationSuccess[] = [
    {
      id: 'c1',
      teams: ['Data', 'Marketing'],
      project: 'Real-time customer scoring for campaign optimization',
      impact: 'Conversion rate increased by 23% with dynamic targeting',
      opportunity: 'Sales team could benefit from similar scoring model'
    },
    {
      id: 'c2',
      teams: ['Data', 'Finance'],
      project: 'Automated anomaly detection for expense reporting',
      impact: 'Detected $500K in irregular expenses, 5x faster than manual review',
      opportunity: 'HR team interested in similar pattern for timesheet analysis'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'best-practice': return <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'discovery': return <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'success-story': return <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Team Activity</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organizational intelligence feed showing successful patterns and knowledge sharing
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Trophy className="h-3 w-3 mr-1" />
              3 new achievements
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Lightbulb className="h-3 w-3 mr-1" />
              5 patterns shared
            </Badge>
          </div>
        </div>

        {/* Recent Team Achievements */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Recent Team Achievements
            </CardTitle>
            <CardDescription>
              See what your teammates accomplished and learn from their approaches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-medium">{achievement.user}</span>
                      <Badge variant="outline" className="text-xs">
                        {achievement.role}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {achievement.achievement}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    {achievement.pattern && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Code className="h-3 w-3 mr-1" />
                          {achievement.pattern}
                        </Badge>
                        {achievement.impact && (
                          <span className="text-xs text-primary">
                            Impact: {achievement.impact}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{achievement.timeAgo}</span>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <ThumbsUp className="h-3 w-3" />
                      {achievement.likes}
                    </button>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {achievement.useful} found useful
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Pattern
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask {achievement.user}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      Save to Library
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Knowledge Sharing Highlights */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              Knowledge Sharing Highlights
            </CardTitle>
            <CardDescription>
              Best practices and discoveries from across the team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {knowledgeSharing.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="font-medium">New {item.type.replace('-', ' ')}:</span>
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.author} {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {item.impact}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {item.appliedCount && (
                    <Badge variant="secondary">
                      Used {item.appliedCount}x
                    </Badge>
                  )}
                </div>

                {item.aiSuggestion && (
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-md p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium">AI suggests:</span>
                      <span className="text-muted-foreground">{item.aiSuggestion}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Learn Technique
                  </Button>
                  <Button size="sm" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Apply to My Work
                  </Button>
                  <Button size="sm" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Discuss
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cross-Team Collaboration */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Cross-Team Collaboration
            </CardTitle>
            <CardDescription>
              Successful collaborations and new opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {collaborationSuccesses.map((collab) => (
              <div
                key={collab.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/30 dark:bg-card hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div className="flex gap-1">
                        {collab.teams.map((team, idx) => (
                          <React.Fragment key={team}>
                            <Badge variant="outline">{team}</Badge>
                            {idx < collab.teams.length - 1 && (
                              <span className="text-muted-foreground">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <span className="text-sm">successful collaboration</span>
                    </div>
                    <p className="text-sm font-medium">{collab.project}</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {collab.impact}
                      </span>
                    </div>
                  </div>
                </div>

                {collab.opportunity && (
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-md p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium">Similar opportunity:</span>
                      <span className="text-muted-foreground">{collab.opportunity}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Explore Opportunity
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Connect Teams
                  </Button>
                  <Button size="sm" variant="outline">
                    <Rocket className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}