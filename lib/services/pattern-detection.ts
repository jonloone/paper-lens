import { DiscoveredPattern, PipelineTemplate } from '@/lib/templates/pipeline-templates/types';

export interface PipelineMetadata {
  id: string;
  name: string;
  type: string;
  source: string;
  target: string;
  schedule?: string;
  transformations: string[];
  createdAt: Date;
  lastRun?: Date;
  runCount: number;
  avgRunTime: number;
  failureRate: number;
}

export class PatternDetectionService {
  private patterns: Map<string, DiscoveredPattern> = new Map();
  private pipelines: Map<string, PipelineMetadata> = new Map();
  
  constructor() {
    this.initializeMockData();
    this.detectPatterns();
  }
  
  private initializeMockData() {
    // Mock existing pipelines for pattern detection
    const mockPipelines: PipelineMetadata[] = [
      {
        id: 'p1',
        name: 'customer_daily_sync',
        type: 'cdc',
        source: 'postgres.customers',
        target: 's3://data-lake/customers',
        schedule: '0 2 * * *',
        transformations: ['filter', 'enrich'],
        createdAt: new Date('2024-01-15'),
        runCount: 320,
        avgRunTime: 1200,
        failureRate: 0.02
      },
      {
        id: 'p2',
        name: 'order_daily_sync',
        type: 'cdc',
        source: 'postgres.orders',
        target: 's3://data-lake/orders',
        schedule: '0 2 * * *',
        transformations: ['filter', 'enrich'],
        createdAt: new Date('2024-02-01'),
        runCount: 280,
        avgRunTime: 1500,
        failureRate: 0.03
      },
      {
        id: 'p3',
        name: 'product_daily_sync',
        type: 'cdc',
        source: 'postgres.products',
        target: 's3://data-lake/products',
        schedule: '0 2 * * *',
        transformations: ['filter', 'enrich'],
        createdAt: new Date('2024-02-15'),
        runCount: 265,
        avgRunTime: 800,
        failureRate: 0.01
      },
      {
        id: 'p4',
        name: 'user_activity_stream',
        type: 'streaming',
        source: 'kafka.user_events',
        target: 's3://data-lake/events',
        transformations: ['filter', 'aggregate', 'enrich'],
        createdAt: new Date('2024-03-01'),
        runCount: 8640,
        avgRunTime: 50,
        failureRate: 0.001
      },
      {
        id: 'p5',
        name: 'sales_daily_rollup',
        type: 'aggregation',
        source: 'warehouse.transactions',
        target: 'warehouse.sales_summary',
        schedule: '0 3 * * *',
        transformations: ['aggregate', 'calculate'],
        createdAt: new Date('2024-01-20'),
        runCount: 300,
        avgRunTime: 2400,
        failureRate: 0.05
      },
      {
        id: 'p6',
        name: 'inventory_daily_rollup',
        type: 'aggregation',
        source: 'warehouse.inventory',
        target: 'warehouse.inventory_summary',
        schedule: '0 3 * * *',
        transformations: ['aggregate', 'calculate'],
        createdAt: new Date('2024-01-25'),
        runCount: 295,
        avgRunTime: 1800,
        failureRate: 0.04
      }
    ];
    
    mockPipelines.forEach(p => this.pipelines.set(p.id, p));
  }
  
  private detectPatterns() {
    // Pattern 1: Similar CDC pipelines
    const cdcPipelines = Array.from(this.pipelines.values())
      .filter(p => p.type === 'cdc' && p.schedule === '0 2 * * *');
    
    if (cdcPipelines.length >= 3) {
      this.patterns.set('cdc-pattern', {
        id: 'cdc-pattern',
        pattern: 'Daily CDC from Postgres to S3',
        description: 'Multiple pipelines syncing PostgreSQL tables to S3 daily at 2 AM',
        occurrences: cdcPipelines.length,
        pipelines: cdcPipelines.map(p => p.id),
        suggestedTemplate: {
          name: 'Postgres to S3 Daily CDC',
          category: 'etl',
          estimatedBuildTime: '5 minutes'
        },
        potentialSavings: {
          time: '2 hours per new pipeline',
          cost: '$50 per pipeline'
        },
        confidence: 95
      });
    }
    
    // Pattern 2: Daily aggregations
    const aggPipelines = Array.from(this.pipelines.values())
      .filter(p => p.type === 'aggregation' && p.schedule?.includes('0 3'));
    
    if (aggPipelines.length >= 2) {
      this.patterns.set('agg-pattern', {
        id: 'agg-pattern',
        pattern: 'Daily Aggregation Rollups',
        description: 'Multiple pipelines performing daily aggregations at 3 AM',
        occurrences: aggPipelines.length,
        pipelines: aggPipelines.map(p => p.id),
        suggestedTemplate: {
          name: 'Daily Rollup Template',
          category: 'batch',
          estimatedBuildTime: '10 minutes'
        },
        potentialSavings: {
          time: '3 hours per new pipeline'
        },
        confidence: 88
      });
    }
    
    // Pattern 3: Common transformation sequences
    const transformPatterns = new Map<string, number>();
    this.pipelines.forEach(p => {
      const transformKey = p.transformations.sort().join('-');
      transformPatterns.set(transformKey, (transformPatterns.get(transformKey) || 0) + 1);
    });
    
    transformPatterns.forEach((count, pattern) => {
      if (count >= 2) {
        this.patterns.set(`transform-${pattern}`, {
          id: `transform-${pattern}`,
          pattern: `Common transformation: ${pattern.replace('-', ' → ')}`,
          description: `This transformation sequence is used in ${count} pipelines`,
          occurrences: count,
          pipelines: Array.from(this.pipelines.values())
            .filter(p => p.transformations.sort().join('-') === pattern)
            .map(p => p.id),
          potentialSavings: {
            time: '30 minutes per pipeline'
          },
          confidence: 75
        });
      }
    });
    
    // Pattern 4: Performance optimization opportunities
    const slowPipelines = Array.from(this.pipelines.values())
      .filter(p => p.avgRunTime > 1500);
    
    if (slowPipelines.length > 0) {
      this.patterns.set('perf-pattern', {
        id: 'perf-pattern',
        pattern: 'Performance Optimization Opportunity',
        description: `${slowPipelines.length} pipelines take over 25 minutes to run`,
        occurrences: slowPipelines.length,
        pipelines: slowPipelines.map(p => p.id),
        potentialSavings: {
          time: '50% reduction possible',
          cost: '$200/month in compute'
        },
        confidence: 70
      });
    }
    
    // Pattern 5: High failure rate pipelines
    const unreliablePipelines = Array.from(this.pipelines.values())
      .filter(p => p.failureRate > 0.03);
    
    if (unreliablePipelines.length > 0) {
      this.patterns.set('reliability-pattern', {
        id: 'reliability-pattern',
        pattern: 'Reliability Improvement Needed',
        description: `${unreliablePipelines.length} pipelines have >3% failure rate`,
        occurrences: unreliablePipelines.length,
        pipelines: unreliablePipelines.map(p => p.id),
        potentialSavings: {
          time: '2 hours/week in debugging'
        },
        confidence: 85
      });
    }
  }
  
  getDiscoveredPatterns(): DiscoveredPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  getPatternById(id: string): DiscoveredPattern | undefined {
    return this.patterns.get(id);
  }
  
  getPatternsByPipeline(pipelineId: string): DiscoveredPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.pipelines.includes(pipelineId));
  }
  
  convertPatternToTemplate(patternId: string): Partial<PipelineTemplate> | null {
    const pattern = this.patterns.get(patternId);
    if (!pattern || !pattern.suggestedTemplate) return null;
    
    // Get common properties from pipelines in this pattern
    const patternPipelines = pattern.pipelines
      .map(id => this.pipelines.get(id))
      .filter(p => p !== undefined) as PipelineMetadata[];
    
    if (patternPipelines.length === 0) return null;
    
    const firstPipeline = patternPipelines[0];
    
    return {
      name: pattern.suggestedTemplate.name || pattern.pattern,
      description: pattern.description,
      category: pattern.suggestedTemplate.category || 'custom',
      tags: [firstPipeline.type, ...firstPipeline.transformations],
      estimatedBuildTime: pattern.suggestedTemplate.estimatedBuildTime || '30 minutes',
      parameters: [
        {
          id: 'source',
          name: 'Source',
          description: 'Data source',
          type: 'string',
          required: true,
          defaultValue: firstPipeline.source
        },
        {
          id: 'target',
          name: 'Target',
          description: 'Data target',
          type: 'string',
          required: true,
          defaultValue: firstPipeline.target
        },
        {
          id: 'schedule',
          name: 'Schedule',
          description: 'Run schedule',
          type: 'cron',
          required: false,
          defaultValue: firstPipeline.schedule
        }
      ]
    };
  }
  
  analyzeNewPipeline(description: string): {
    similarPatterns: DiscoveredPattern[];
    suggestedTemplates: string[];
    estimatedTime: string;
  } {
    const keywords = description.toLowerCase().split(' ');
    const similarPatterns: DiscoveredPattern[] = [];
    
    // Find patterns matching keywords
    this.patterns.forEach(pattern => {
      const patternText = `${pattern.pattern} ${pattern.description}`.toLowerCase();
      const matchCount = keywords.filter(k => patternText.includes(k)).length;
      if (matchCount > 2) {
        similarPatterns.push(pattern);
      }
    });
    
    // Suggest templates based on keywords
    const suggestedTemplates: string[] = [];
    if (keywords.some(k => ['cdc', 'sync', 'replicate'].includes(k))) {
      suggestedTemplates.push('cdc-database-to-lake');
    }
    if (keywords.some(k => ['aggregate', 'rollup', 'summary'].includes(k))) {
      suggestedTemplates.push('daily-aggregation-rollup');
    }
    if (keywords.some(k => ['stream', 'real-time', 'kafka'].includes(k))) {
      suggestedTemplates.push('realtime-streaming-etl');
    }
    
    // Estimate time based on similar patterns
    let estimatedTime = '2 hours'; // default
    if (similarPatterns.length > 0) {
      const savings = similarPatterns[0].potentialSavings.time;
      if (savings?.includes('minutes')) {
        estimatedTime = '15 minutes';
      } else if (savings?.includes('hour')) {
        estimatedTime = '30 minutes';
      }
    }
    
    return {
      similarPatterns,
      suggestedTemplates,
      estimatedTime
    };
  }
  
  // Simulate learning from user actions
  recordTemplateUsage(templateId: string, success: boolean) {
    // In production, this would update ML models and pattern confidence
    const pattern = Array.from(this.patterns.values())
      .find(p => p.suggestedTemplate?.name === templateId);
    
    if (pattern && success) {
      pattern.confidence = Math.min(100, pattern.confidence + 2);
    }
  }
  
  getSimilarPipelines(pipelineId: string): PipelineMetadata[] {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return [];
    
    return Array.from(this.pipelines.values())
      .filter(p => 
        p.id !== pipelineId &&
        (p.type === pipeline.type || 
         p.source.split('.')[0] === pipeline.source.split('.')[0] ||
         p.transformations.some(t => pipeline.transformations.includes(t)))
      )
      .slice(0, 5);
  }
}

// Export singleton instance
export const patternDetectionService = new PatternDetectionService();