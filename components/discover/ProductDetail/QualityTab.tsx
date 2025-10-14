'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, AlertCircle, TrendingUp, TrendingDown, Minus, Activity, ChevronDown } from 'lucide-react';

interface QualityTabProps {
  product: any;
}

export function QualityTab({ product }: QualityTabProps) {
  const qualityScore = product.quality.dataQuality;
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const [isDimensionsOpen, setIsDimensionsOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(true); // Open by default if there are alerts

  const getQualityGrade = (score: number) => {
    if (score >= 90) return { label: 'Certified', color: 'text-green-600' };
    if (score >= 70) return { label: 'Standard', color: 'text-blue-600' };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Needs Attention', color: 'text-red-600' };
  };

  const grade = getQualityGrade(qualityScore);

  const dimensions = [
    { name: 'Completeness', score: 99.2, description: 'Percentage of non-null values in required fields' },
    { name: 'Accuracy', score: 98.5, description: 'Data conforms to validation rules' },
    { name: 'Timeliness', score: 99.8, description: 'Data freshness meets SLA' },
    { name: 'Consistency', score: 97.2, description: 'Data matches across related products' },
    { name: 'Uniqueness', score: 100, description: 'Primary keys are unique' },
  ];

  // Mock historical data for trends (30/60/90 day)
  const qualityHistory30 = [95, 94, 96, 97, 95, 96, 98, 97, 98, 97, 98, 99, 98, 99, 98, 99, 97, 98, 99, 98, 99, 98, 97, 98, 99, 98, 97, 98, 99, 98];
  const qualityHistory60 = [92, 91, 93, 94, 93, 94, 95, 94, 95, 96, 95, 96, 97, 96, 97, 96, 97, 98, ...qualityHistory30];
  const qualityHistory90 = [88, 89, 90, 91, 90, 91, 92, 91, 92, 93, ...qualityHistory60];

  const dimensionTrends = [
    { name: 'Completeness', current: 99.2, prev: 99.0, trend: 'up' },
    { name: 'Accuracy', current: 98.5, prev: 98.7, trend: 'down' },
    { name: 'Timeliness', current: 99.8, prev: 99.8, trend: 'stable' },
    { name: 'Consistency', current: 97.2, prev: 96.5, trend: 'up' },
    { name: 'Uniqueness', current: 100, prev: 100, trend: 'stable' },
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  const renderSparkline = (data: number[], color: string = 'bg-primary') => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end gap-0.5 h-12">
        {data.slice(-30).map((value, i) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={i}
              className={`flex-1 ${color} rounded-t-sm opacity-70 hover:opacity-100 transition-opacity`}
              style={{ height: `${Math.max(height, 10)}%` }}
              title={`${value}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Quality Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold">{qualityScore}/100</div>
              <div className={`text-sm font-medium ${grade.color}`}>{grade.label}</div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Last evaluated: 2 hours ago</div>
              <div className="flex items-center gap-1 justify-end mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Improving (was 95 last month)</span>
              </div>
            </div>
          </div>

          <Progress value={qualityScore} className="h-2" />

          <div className="text-sm text-muted-foreground">
            This product maintains {grade.label.toLowerCase()} quality standards and is suitable for production use.
          </div>
        </CardContent>
      </Card>

      {/* Quality Trends */}
      <Collapsible open={isTrendsOpen} onOpenChange={setIsTrendsOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quality Trends
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${isTrendsOpen ? 'transform rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
          <Tabs defaultValue="30">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="30">30 Days</TabsTrigger>
              <TabsTrigger value="60">60 Days</TabsTrigger>
              <TabsTrigger value="90">90 Days</TabsTrigger>
            </TabsList>

            <TabsContent value="30" className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Overall Quality Score</div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+3.2% vs 30 days ago</span>
                  </div>
                </div>
                {renderSparkline(qualityHistory30)}
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="60" className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Overall Quality Score</div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+6.8% vs 60 days ago</span>
                  </div>
                </div>
                {renderSparkline(qualityHistory60)}
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>60 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="90" className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Overall Quality Score</div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+10.2% vs 90 days ago</span>
                  </div>
                </div>
                {renderSparkline(qualityHistory90)}
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Quality Dimensions with Trends */}
      <Collapsible open={isDimensionsOpen} onOpenChange={setIsDimensionsOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Quality Dimensions</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${isDimensionsOpen ? 'transform rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
          {dimensionTrends.map((dimension) => (
            <div key={dimension.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{dimension.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {dimensions.find(d => d.name === dimension.name)?.description}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(dimension.trend)}
                    <span className={`text-xs ${getTrendColor(dimension.trend)}`}>
                      {dimension.trend === 'up' && `+${(dimension.current - dimension.prev).toFixed(1)}%`}
                      {dimension.trend === 'down' && `${(dimension.current - dimension.prev).toFixed(1)}%`}
                      {dimension.trend === 'stable' && 'No change'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{dimension.current}%</span>
                  {dimension.current >= 95 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
              </div>
              <Progress value={dimension.current} className="h-1" />
            </div>
          ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Quality Tests - Enhanced */}
      <Collapsible open={isTestsOpen} onOpenChange={setIsTestsOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Quality Tests</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${isTestsOpen ? 'transform rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
          {/* Test Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">47</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-xs text-muted-foreground">Warning</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">48</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Test Breakdown by Category */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completeness Tests</span>
                <Badge variant="secondary" className="text-xs">15/15 passed</Badge>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uniqueness Tests</span>
                <Badge variant="secondary" className="text-xs">8/8 passed</Badge>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Validity Tests</span>
                <Badge variant="secondary" className="text-xs">12/12 passed</Badge>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Consistency Tests</span>
                <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-600">11/12 passed</Badge>
              </div>
              <Progress value={91.7} className="h-1.5" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Timeliness Tests</span>
                <Badge variant="secondary" className="text-xs">2/2 passed</Badge>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>
          </div>

          {/* Recent Test Results */}
          <div className="mt-6 space-y-2">
            <div className="text-sm font-medium mb-3">Recent Test Results</div>
            <div className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <div>expect_column_values_to_not_be_null</div>
                <div className="text-xs text-muted-foreground">customer_id: 100% (250K rows checked)</div>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
            <div className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <div>expect_column_values_to_be_unique</div>
                <div className="text-xs text-muted-foreground">customer_id: 100% (250K unique values)</div>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
            <div className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <div>expect_column_values_to_match_regex</div>
                <div className="text-xs text-muted-foreground">email: 99.8% (249.5K valid emails)</div>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
            <div className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors bg-yellow-50 dark:bg-yellow-900/10">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <div>expect_column_values_to_be_in_set</div>
                <div className="text-xs text-muted-foreground">country: 99.6% (1K unexpected values found)</div>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
          </div>

          {/* Test History */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last run: 2 hours ago</span>
              <span>Next scheduled: 6 hours from now</span>
            </div>
          </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Quality Alerts - Enhanced */}
      <Collapsible open={isAlertsOpen} onOpenChange={setIsAlertsOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <span>Quality Alerts & Thresholds</span>
                  <Badge variant="secondary" className="text-xs">1 warning</Badge>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${isAlertsOpen ? 'transform rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
          {/* Active Warning */}
          <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div>
                  <div className="font-medium text-sm">Consistency Check Warning</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Country field contains 1,042 unexpected values (0.4% of records)
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Threshold: </span>
                    <span className="font-medium">99.5%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current: </span>
                    <span className="font-medium text-yellow-600">99.6%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Detected: </span>
                    <span className="font-medium">2h ago</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs px-2 py-1 rounded bg-background hover:bg-muted border">
                    View Details
                  </button>
                  <button className="text-xs px-2 py-1 rounded bg-background hover:bg-muted border">
                    Investigate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Thresholds */}
          <div className="space-y-3 pt-2">
            <div className="text-sm font-medium">Configured Thresholds</div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Data Completeness</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Threshold:</span>
                  <span className="font-mono font-medium">≥ 95%</span>
                  <span className="text-green-600 font-medium">✓ 99.2%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Data Accuracy</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Threshold:</span>
                  <span className="font-mono font-medium">≥ 95%</span>
                  <span className="text-green-600 font-medium">✓ 98.5%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 bg-yellow-50 dark:bg-yellow-900/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Data Consistency</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Threshold:</span>
                  <span className="font-mono font-medium">≥ 99.5%</span>
                  <span className="text-yellow-600 font-medium">⚠ 99.6%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Freshness SLA</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Threshold:</span>
                  <span className="font-mono font-medium">≤ 1 hour</span>
                  <span className="text-green-600 font-medium">✓ 15 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alert History */}
          <div className="pt-4 border-t space-y-2">
            <div className="text-sm font-medium">Recent Alert History</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Last 7 days: 1 warning, 0 critical</span>
                <span>99.8% uptime</span>
              </div>
              <div className="flex justify-between">
                <span>Last 30 days: 3 warnings, 0 critical</span>
                <span>99.9% uptime</span>
              </div>
            </div>
          </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
