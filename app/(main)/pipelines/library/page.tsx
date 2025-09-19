'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Sparkles,
  GitBranch,
  Eye,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Lightbulb,
  Activity,
  BarChart3,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function PatternsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const patternTypes = [
    { id: 'all', label: 'All Patterns', count: 28 },
    { id: 'data-movement', label: 'Data Movement', count: 8 },
    { id: 'transformation', label: 'Transformation', count: 7 },
    { id: 'quality', label: 'Quality', count: 5 },
    { id: 'optimization', label: 'Optimization', count: 4 },
    { id: 'error-handling', label: 'Error Handling', count: 4 }
  ];

  const discoveredPatterns = [
    {
      id: 'incremental-load-pattern',
      name: 'Incremental Load with Watermarks',
      description: 'Pattern for efficiently loading only changed data using timestamp watermarks',
      frequency: 156,
      teams: ['Data Platform', 'Analytics', 'ML Ops'],
      confidence: 94,
      savings: '3 hours/day',
      visual: '🔄',
      tags: ['ETL', 'Optimization', 'CDC']
    },
    {
      id: 'retry-backoff-pattern',
      name: 'Exponential Backoff Retry',
      description: 'Retry failed operations with exponentially increasing delays',
      frequency: 89,
      teams: ['Platform', 'Infrastructure'],
      confidence: 91,
      savings: '45 min/day',
      visual: '↻',
      tags: ['Error Handling', 'Resilience']
    },
    {
      id: 'partitioned-processing',
      name: 'Date-Partitioned Processing',
      description: 'Process data in date-based partitions for better performance',
      frequency: 234,
      teams: ['Analytics', 'BI', 'Data Science'],
      confidence: 96,
      savings: '2 hours/day',
      visual: '📊',
      tags: ['Performance', 'Batch', 'Optimization']
    },
    {
      id: 'schema-evolution',
      name: 'Graceful Schema Evolution',
      description: 'Handle schema changes without breaking downstream pipelines',
      frequency: 67,
      teams: ['Data Platform'],
      confidence: 88,
      savings: '1 hour/day',
      visual: '🔀',
      tags: ['Schema', 'Compatibility', 'Evolution']
    }
  ];

  const aiRecommendations = [
    {
      pattern: 'Circuit Breaker Pattern',
      reason: 'Your team has 12 pipelines with cascading failures',
      impact: 'Prevent 80% of downstream failures',
      icon: Activity
    },
    {
      pattern: 'Data Quality Gates',
      reason: 'Found 8 pipelines without validation steps',
      impact: 'Catch issues 10x earlier',
      icon: BarChart3
    },
    {
      pattern: 'Parallel Processing',
      reason: '5 pipelines process sequentially but could parallelize',
      impact: 'Reduce runtime by 60%',
      icon: Layers
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pattern Library</h1>
        <p className="text-muted-foreground">
          Successful patterns discovered from your team&apos;s pipelines
        </p>
      </div>

      {/* AI Recommendations */}
      <Card className="mb-8 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
          <CardDescription>
            Patterns that could benefit your team based on current usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiRecommendations.map((rec) => {
              const Icon = rec.icon;
              return (
                <div key={rec.pattern} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium">{rec.pattern}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {rec.impact}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patterns..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {patternTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type.id)}
            >
              {type.label}
              <Badge variant="secondary" className="ml-2">
                {type.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Discovered Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {discoveredPatterns.map((pattern) => (
          <Card key={pattern.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-3xl">{pattern.visual}</div>
                <Badge variant="outline" className="text-xs">
                  {pattern.confidence}% confidence
                </Badge>
              </div>
              <CardTitle className="mt-4">{pattern.name}</CardTitle>
              <CardDescription>{pattern.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {pattern.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Used</p>
                  <p className="font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {pattern.frequency} times
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Saves</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pattern.savings}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">Used by teams:</p>
                <div className="flex flex-wrap gap-1">
                  {pattern.teams.map((team) => (
                    <Badge key={team} variant="outline" className="text-xs">
                      {team}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link href="/learn/remix" className="flex-1">
                  <Button variant="default" className="w-full">
                    <GitBranch className="mr-2 h-4 w-4" />
                    Remix Pattern
                  </Button>
                </Link>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Pattern Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">28</p>
              <p className="text-sm text-muted-foreground">Patterns Discovered</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">892</p>
              <p className="text-sm text-muted-foreground">Total Uses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">14</p>
              <p className="text-sm text-muted-foreground">Teams Using</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">6.5h</p>
              <p className="text-sm text-muted-foreground">Saved Daily</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}