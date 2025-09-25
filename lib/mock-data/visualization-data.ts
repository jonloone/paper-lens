// Mock data generators for VisX visualizations

// Quality Trends Data
export interface QualityDataPoint {
  date: Date;
  customer: number;
  finance: number;
  product: number;
  marketing: number;
  operations: number;
}

export function generateQualityTrendsData(days: number = 30): QualityDataPoint[] {
  const data: QualityDataPoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Generate realistic quality scores with some variation and trends
    const baseCustomer = 94 + Math.sin(i * 0.1) * 3 + (Math.random() - 0.5) * 4;
    const baseFinance = 91 + Math.cos(i * 0.08) * 2 + (Math.random() - 0.5) * 3;
    const baseProduct = 96 + Math.sin(i * 0.12) * 2 + (Math.random() - 0.5) * 2;
    const baseMarketing = 89 + Math.cos(i * 0.15) * 4 + (Math.random() - 0.5) * 5;
    const baseOperations = 87 + Math.sin(i * 0.18) * 3 + (Math.random() - 0.5) * 6;

    data.push({
      date,
      customer: Math.max(75, Math.min(100, baseCustomer)),
      finance: Math.max(75, Math.min(100, baseFinance)),
      product: Math.max(75, Math.min(100, baseProduct)),
      marketing: Math.max(75, Math.min(100, baseMarketing)),
      operations: Math.max(75, Math.min(100, baseOperations)),
    });
  }

  return data;
}

// Schema Drift Timeline Data
export interface SchemaChangeEvent {
  id: string;
  date: Date;
  table: string;
  domain: string;
  changeType: 'added' | 'modified' | 'removed' | 'breaking';
  field: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedPipelines: number;
}

export function generateSchemaDriftData(days: number = 14): SchemaChangeEvent[] {
  const tables = [
    { name: 'customer_profiles', domain: 'Customer' },
    { name: 'order_transactions', domain: 'Finance' },
    { name: 'product_catalog', domain: 'Product' },
    { name: 'marketing_campaigns', domain: 'Marketing' },
    { name: 'system_logs', domain: 'Operations' },
    { name: 'user_sessions', domain: 'Product' },
    { name: 'payment_methods', domain: 'Finance' },
  ];

  const changeTypes: SchemaChangeEvent['changeType'][] = ['added', 'modified', 'removed', 'breaking'];
  const impacts: SchemaChangeEvent['impact'][] = ['low', 'medium', 'high', 'critical'];

  const fields = [
    'user_id', 'email', 'created_at', 'updated_at', 'status', 'amount', 'currency',
    'product_id', 'category', 'name', 'description', 'price', 'inventory_count',
    'campaign_id', 'click_rate', 'conversion_rate', 'log_level', 'message',
    'session_id', 'duration', 'page_views', 'payment_type', 'card_last_four'
  ];

  const descriptions = {
    added: 'New field added to support enhanced functionality',
    modified: 'Field type changed to accommodate new data requirements',
    removed: 'Deprecated field removed as part of cleanup',
    breaking: 'Breaking change requiring downstream pipeline updates'
  };

  const data: SchemaChangeEvent[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Generate 15-25 schema change events over the time period
  const eventCount = 15 + Math.floor(Math.random() * 10);

  for (let i = 0; i < eventCount; i++) {
    const table = tables[Math.floor(Math.random() * tables.length)];
    const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
    const impact = impacts[Math.floor(Math.random() * impacts.length)];
    const field = fields[Math.floor(Math.random() * fields.length)];

    // More recent events are more likely
    const dayOffset = Math.floor(Math.random() * Math.random() * days);
    const hourOffset = Math.floor(Math.random() * 24);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + (days - dayOffset));
    date.setHours(hourOffset);

    data.push({
      id: `schema-${i + 1}`,
      date,
      table: table.name,
      domain: table.domain,
      changeType,
      field,
      impact,
      description: descriptions[changeType],
      affectedPipelines: changeType === 'breaking' ? 2 + Math.floor(Math.random() * 5) :
                        impact === 'high' ? 1 + Math.floor(Math.random() * 3) :
                        Math.floor(Math.random() * 2),
    });
  }

  return data.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Data Completeness Heatmap Data
export interface CompletenessDataPoint {
  dataset: string;
  domain: string;
  field: string;
  completeness: number;
  recordCount: number;
  missingCount: number;
  lastUpdated: Date;
}

export function generateCompletenessData(): CompletenessDataPoint[] {
  const datasets = [
    { name: 'customer_profiles', domain: 'Customer' },
    { name: 'order_history', domain: 'Finance' },
    { name: 'product_catalog', domain: 'Product' },
    { name: 'campaign_metrics', domain: 'Marketing' },
    { name: 'system_events', domain: 'Operations' },
    { name: 'user_behavior', domain: 'Product' },
  ];

  const fields = [
    'email', 'phone', 'address', 'birth_date', 'preferences',
    'amount', 'tax', 'discount', 'payment_method', 'billing_address',
    'description', 'category', 'tags', 'images', 'specifications',
    'click_rate', 'open_rate', 'bounce_rate', 'conversion_rate',
    'error_message', 'stack_trace', 'user_agent', 'ip_address'
  ];

  const data: CompletenessDataPoint[] = [];

  datasets.forEach(dataset => {
    // Each dataset has 4-6 fields
    const datasetFields = fields.slice(0, 4 + Math.floor(Math.random() * 3));

    datasetFields.forEach(field => {
      // Generate realistic completeness based on field importance
      const isRequired = Math.random() > 0.3;
      const baseCompleteness = isRequired ? 85 + Math.random() * 14 : 60 + Math.random() * 35;
      const completeness = Math.min(100, Math.max(0, baseCompleteness + (Math.random() - 0.5) * 10));

      const recordCount = 50000 + Math.floor(Math.random() * 500000);
      const missingCount = Math.floor(recordCount * (100 - completeness) / 100);

      const lastUpdated = new Date();
      lastUpdated.setDate(lastUpdated.getDate() - Math.floor(Math.random() * 3));

      data.push({
        dataset: dataset.name,
        domain: dataset.domain,
        field,
        completeness: Math.round(completeness * 10) / 10,
        recordCount,
        missingCount,
        lastUpdated,
      });
    });
  });

  return data;
}

// Pipeline Health Chart Data
export interface PipelineMetric {
  date: Date;
  throughputMBps: number;
  successRate: number;
  averageLatencyMs: number;
  activeConnections: number;
  cdcEvents: number;
}

export function generatePipelineHealthData(hours: number = 24): PipelineMetric[] {
  const data: PipelineMetric[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1);

  for (let i = 0; i <= hours; i++) {
    const date = new Date(startDate);
    date.setHours(startDate.getHours() + i);

    // Generate realistic pipeline metrics with some patterns
    const timeOfDay = date.getHours();
    const isBusinessHours = timeOfDay >= 9 && timeOfDay <= 17;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    // Base values influenced by time patterns
    const businessHoursMultiplier = isBusinessHours ? 1.5 : 0.7;
    const weekendMultiplier = isWeekend ? 0.6 : 1.0;
    const multiplier = businessHoursMultiplier * weekendMultiplier;

    // Add some random variation
    const variation = 0.8 + (Math.random() * 0.4);

    const throughputMBps = Math.max(0.1, (15 + Math.random() * 10) * multiplier * variation);
    const successRate = Math.min(100, 95 + Math.random() * 4 + (isBusinessHours ? 1 : -1));
    const averageLatencyMs = Math.max(5, (50 + Math.random() * 30) / multiplier);
    const activeConnections = Math.max(1, Math.floor((20 + Math.random() * 15) * multiplier));
    const cdcEvents = Math.max(0, Math.floor((500 + Math.random() * 2000) * multiplier));

    data.push({
      date,
      throughputMBps: Math.round(throughputMBps * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
      averageLatencyMs: Math.round(averageLatencyMs),
      activeConnections,
      cdcEvents,
    });
  }

  return data;
}

// Export all generators
export const mockVisualizationData = {
  qualityTrends: generateQualityTrendsData(),
  schemaDrift: generateSchemaDriftData(),
  completeness: generateCompletenessData(),
  pipelineHealth: generatePipelineHealthData(),
};