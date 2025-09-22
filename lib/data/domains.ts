import { Domain, DomainConfiguration, OrganizationalActivity } from '@/lib/types/domain';

// Mock domain data based on PRD specifications
export const mockDomains: Domain[] = [
  {
    id: 'customer',
    name: 'Customer',
    description: 'Customer management, behavior analytics, and support operations',
    icon: 'Users',
    color: 'from-blue-500 to-cyan-500',
    businessContext: {
      primaryStakeholders: [
        { name: 'Jennifer', role: 'VP Marketing', email: 'jennifer@company.com', team: 'Marketing' },
        { name: 'Tom', role: 'Director Customer Success', email: 'tom@company.com', team: 'Customer Success' }
      ],
      keyMetrics: [
        { name: 'Customer LTV', value: '$2,340', trend: 'up' },
        { name: 'Churn Rate', value: '3.2%', trend: 'down' },
        { name: 'Acquisition Cost', value: '$124', trend: 'neutral' }
      ],
      currentInitiatives: [
        { name: 'Q4 Retention Campaign', status: 'in_progress', deadline: new Date('2025-12-15'), description: 'Reduce churn through personalized retention' },
        { name: 'Customer 360 Enhancement', status: 'planning', description: 'Add behavioral insights to customer profiles' }
      ],
      complianceRequirements: ['GDPR', 'CCPA']
    },
    health: {
      productsCount: 12,
      qualityScore: 94,
      activeDevProjects: 2,
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'healthy',
      issues: { critical: 0, warning: 1, total: 1 },
      performance: { avgResponseTime: 145, uptime: 99.8, errorRate: 0.02 }
    },
    dataProducts: [
      { id: 'customer-360', name: 'Customer 360 Profile', description: 'Unified customer profile with behavioral analytics', status: 'active', qualityScore: 99, usage: 'high', freshness: 'real-time', owner: 'Sarah Chen', lastUpdated: new Date(), consumers: 23, issues: 0 },
      { id: 'customer-segmentation', name: 'Customer Segmentation', description: 'ML-powered customer segments for targeting', status: 'active', qualityScore: 97, usage: 'medium', freshness: 'daily', owner: 'Alex Kim', lastUpdated: new Date(), consumers: 12, issues: 0 },
      { id: 'support-metrics', name: 'Customer Support Metrics', description: 'Support ticket analysis and satisfaction tracking', status: 'active', qualityScore: 89, usage: 'low', freshness: 'hourly', owner: 'Lisa Wang', lastUpdated: new Date(), consumers: 5, issues: 1 }
    ],
    recentActivity: [
      { id: '1', type: 'product_updated', title: 'Churn Prediction Model', description: 'Model training in progress - 60% complete', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), actor: 'Sarah Chen', progress: 60, status: 'in_progress' },
      { id: '2', type: 'schema_change', title: 'Customer Events Schema Update', description: 'Added session_duration field for better analytics', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), actor: 'System', status: 'completed' },
      { id: '3', type: 'quality_issue', title: 'Support Metrics Quality Alert', description: 'Quality score dropped to 89% due to missing ticket data', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), actor: 'Quality Monitor', severity: 'medium', status: 'attention_required' }
    ],
    ownership: {
      primaryOwner: 'Sarah Chen',
      team: 'Customer Analytics Team',
      engineers: ['Sarah Chen', 'Alex Kim', 'Lisa Wang']
    },
    aiInsights: {
      recommendations: [
        'Integrate new session_duration field from recent schema change',
        'Consider unifying support metrics with churn prediction model'
      ],
      patternOpportunities: [
        'Support metrics pattern could apply to churn analysis',
        'Customer segmentation approach reusable for other domains'
      ],
      crossDomainSuggestions: [
        { fromDomain: 'customer', toDomain: 'financial', dataProduct: 'Customer LTV Attribution', relationship: 'provides', businessJustification: 'Financial domain requesting customer attribution data for revenue analysis' }
      ]
    }
  },
  {
    id: 'financial',
    name: 'Financial',
    description: 'Revenue operations, billing, and financial reporting',
    icon: 'DollarSign',
    color: 'from-green-500 to-emerald-500',
    businessContext: {
      primaryStakeholders: [
        { name: 'Mike Rodriguez', role: 'CFO', email: 'mike@company.com', team: 'Finance' },
        { name: 'Emily Johnson', role: 'Revenue Operations Director', email: 'emily@company.com', team: 'RevOps' }
      ],
      keyMetrics: [
        { name: 'Monthly Recurring Revenue', value: '$2.4M', trend: 'up' },
        { name: 'Revenue Growth Rate', value: '12.5%', trend: 'up' },
        { name: 'Gross Margin', value: '73%', trend: 'neutral' }
      ],
      currentInitiatives: [
        { name: 'Revenue Attribution Model', status: 'in_progress', deadline: new Date('2025-11-30'), description: 'Connect customer actions to revenue impact' },
        { name: 'P&L Automation', status: 'planning', description: 'Automate monthly P&L report generation' }
      ],
      complianceRequirements: ['SOX', 'Financial Reporting Standards']
    },
    health: {
      productsCount: 8,
      qualityScore: 97,
      activeDevProjects: 1,
      lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'healthy',
      issues: { critical: 0, warning: 0, total: 0 },
      performance: { avgResponseTime: 89, uptime: 99.95, errorRate: 0.005 }
    },
    dataProducts: [
      { id: 'revenue-model', name: 'Revenue Attribution Model', description: 'Customer-to-revenue attribution and forecasting', status: 'development', qualityScore: 85, usage: 'high', freshness: 'daily', owner: 'Mike Team', lastUpdated: new Date(), consumers: 8, issues: 0 },
      { id: 'billing-analytics', name: 'Billing & Subscription Analytics', description: 'Subscription lifecycle and billing health', status: 'active', qualityScore: 98, usage: 'high', freshness: 'real-time', owner: 'Emily Martinez', lastUpdated: new Date(), consumers: 15, issues: 0 }
    ],
    recentActivity: [
      { id: '4', type: 'product_updated', title: 'Revenue Attribution Model', description: 'Customer integration phase - 80% complete', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), actor: 'Mike Team', progress: 80, status: 'in_progress' },
      { id: '5', type: 'pattern_applied', title: 'Customer Attribution Pattern', description: 'Applied customer segmentation pattern to revenue analysis', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), actor: 'Emily Martinez', status: 'completed' }
    ],
    ownership: {
      primaryOwner: 'Mike Rodriguez',
      team: 'Financial Engineering Team',
      engineers: ['Emily Martinez', 'David Liu', 'Rachel Park']
    },
    aiInsights: {
      recommendations: [
        'Leverage Customer domain churn prediction for revenue forecasting',
        'Consider real-time billing alerts for subscription health'
      ],
      patternOpportunities: [
        'Customer attribution pattern successful - consider for Product domain',
        'Revenue forecasting approach could apply to cost management'
      ],
      crossDomainSuggestions: [
        { fromDomain: 'financial', toDomain: 'customer', dataProduct: 'Billing Health Score', relationship: 'enhances', businessJustification: 'Customer success team needs billing health for retention strategy' }
      ]
    }
  },
  {
    id: 'product',
    name: 'Product',
    description: 'Product analytics, feature usage, and engineering metrics',
    icon: 'Package',
    color: 'from-purple-500 to-pink-500',
    businessContext: {
      primaryStakeholders: [
        { name: 'Lisa Chen', role: 'VP Product', email: 'lisa@company.com', team: 'Product' },
        { name: 'Mark Thompson', role: 'Head of Engineering', email: 'mark@company.com', team: 'Engineering' }
      ],
      keyMetrics: [
        { name: 'Daily Active Users', value: '142K', trend: 'up' },
        { name: 'Feature Adoption Rate', value: '67%', trend: 'neutral' },
        { name: 'Product Velocity', value: '23 features/month', trend: 'up' }
      ],
      currentInitiatives: [
        { name: 'Feature Usage Optimization', status: 'in_progress', deadline: new Date('2025-10-31'), description: 'Identify and improve low-adoption features' },
        { name: 'Engineering Metrics Dashboard', status: 'in_progress', description: 'Comprehensive engineering productivity tracking' }
      ],
      complianceRequirements: ['User Privacy', 'Feature Flag Governance']
    },
    health: {
      productsCount: 15,
      qualityScore: 89,
      activeDevProjects: 4,
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'warning',
      issues: { critical: 0, warning: 2, total: 2 },
      performance: { avgResponseTime: 234, uptime: 98.5, errorRate: 0.08 }
    },
    dataProducts: [
      { id: 'user-behavior', name: 'User Behavior Analytics', description: 'Feature usage patterns and user journey analysis', status: 'active', qualityScore: 92, usage: 'high', freshness: 'real-time', owner: 'Lisa Team', lastUpdated: new Date(), consumers: 18, issues: 1 },
      { id: 'feature-usage', name: 'Feature Usage Metrics', description: 'Individual feature adoption and performance tracking', status: 'active', qualityScore: 85, usage: 'medium', freshness: 'hourly', owner: 'Mark Thompson', lastUpdated: new Date(), consumers: 12, issues: 1 }
    ],
    recentActivity: [
      { id: '6', type: 'quality_issue', title: 'User Behavior Quality Alert', description: 'Data gaps detected in user session tracking', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), actor: 'Quality Monitor', severity: 'medium', status: 'attention_required' },
      { id: '7', type: 'product_created', title: 'Feature Performance Dashboard', description: 'New analytics for feature A/B testing results', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), actor: 'Lisa Team', status: 'completed' },
      { id: '8', type: 'quality_issue', title: 'Feature Usage Gaps', description: 'Missing usage data for newly launched features', timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000), actor: 'Quality Monitor', severity: 'medium', status: 'attention_required' }
    ],
    ownership: {
      primaryOwner: 'Lisa Chen',
      team: 'Product Analytics Team',
      engineers: ['Jordan Wu', 'Priya Patel', 'Chris Adams', 'Nina Foster']
    },
    aiInsights: {
      recommendations: [
        'Address data gaps in user session tracking for better quality scores',
        'Consider integrating Customer domain churn signals with feature usage'
      ],
      patternOpportunities: [
        'User behavior pattern applicable to customer journey mapping',
        'Feature performance tracking could enhance financial attribution'
      ],
      crossDomainSuggestions: [
        { fromDomain: 'product', toDomain: 'customer', dataProduct: 'Feature Usage Events', relationship: 'provides', businessJustification: 'Customer churn prediction needs feature usage signals' }
      ]
    }
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'System monitoring, cost management, and infrastructure metrics',
    icon: 'Activity',
    color: 'from-orange-500 to-yellow-500',
    businessContext: {
      primaryStakeholders: [
        { name: 'DevOps Team', role: 'Infrastructure', email: 'devops@company.com', team: 'DevOps' },
        { name: 'Security Team', role: 'Security & Compliance', email: 'security@company.com', team: 'Security' }
      ],
      keyMetrics: [
        { name: 'System Uptime', value: '99.8%', trend: 'up' },
        { name: 'Infrastructure Cost', value: '$45K/month', trend: 'down' },
        { name: 'Security Score', value: '94/100', trend: 'neutral' }
      ],
      currentInitiatives: [
        { name: 'Cost Optimization Initiative', status: 'completed', description: 'Reduced infrastructure costs by 15%' },
        { name: 'Security Monitoring Enhancement', status: 'planning', description: 'Advanced threat detection and response' }
      ],
      complianceRequirements: ['SOC 2', 'Infrastructure Security', 'Data Protection']
    },
    health: {
      productsCount: 6,
      qualityScore: 95,
      activeDevProjects: 0,
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      status: 'healthy',
      issues: { critical: 0, warning: 0, total: 0 },
      performance: { avgResponseTime: 67, uptime: 99.95, errorRate: 0.001 }
    },
    dataProducts: [
      { id: 'system-metrics', name: 'System Performance Metrics', description: 'Infrastructure monitoring and alerting', status: 'active', qualityScore: 96, usage: 'high', freshness: 'real-time', owner: 'DevOps Team', lastUpdated: new Date(), consumers: 25, issues: 0 },
      { id: 'cost-attribution', name: 'Cost Attribution Analytics', description: 'Infrastructure cost tracking and optimization', status: 'active', qualityScore: 94, usage: 'medium', freshness: 'daily', owner: 'DevOps Team', lastUpdated: new Date(), consumers: 8, issues: 0 }
    ],
    recentActivity: [
      { id: '9', type: 'product_updated', title: 'Cost Optimization Complete', description: 'Successfully reduced infrastructure costs by 15%', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), actor: 'DevOps Team', status: 'completed' },
      { id: '10', type: 'source_connected', title: 'Security Event Stream', description: 'Connected new security monitoring data source', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), actor: 'Security Team', status: 'completed' }
    ],
    ownership: {
      primaryOwner: 'DevOps Team',
      team: 'Infrastructure & Security',
      engineers: ['Kevin Park', 'Sophia Rodriguez']
    },
    aiInsights: {
      recommendations: [
        'Cost attribution data could enhance Financial domain revenue models',
        'System performance patterns may predict customer experience issues'
      ],
      patternOpportunities: [
        'Cost optimization methodology applicable to other resource management',
        'Security monitoring patterns could enhance data quality frameworks'
      ],
      crossDomainSuggestions: [
        { fromDomain: 'operations', toDomain: 'financial', dataProduct: 'Infrastructure Cost Attribution', relationship: 'provides', businessJustification: 'Financial team needs accurate cost allocation for P&L reporting' }
      ]
    }
  }
];

export const mockOrganizationalActivity: OrganizationalActivity[] = [
  {
    id: '1',
    type: 'pattern_reuse',
    title: 'Customer Segmentation Pattern Reused',
    description: 'Pattern "Customer Segmentation v3" successfully applied in Financial domain for revenue attribution',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    affectedDomains: ['customer', 'financial'],
    impact: 'medium'
  },
  {
    id: '2',
    type: 'schema_change',
    title: 'Customer Events Schema Impact',
    description: 'Schema change in customer_events table impacted 3 domains with dependency updates',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    affectedDomains: ['customer', 'product', 'financial'],
    impact: 'medium'
  },
  {
    id: '3',
    type: 'source_added',
    title: 'New Payment Processor Available',
    description: 'New source "payment_processor_v2" connected and available for Financial domain integration',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    affectedDomains: ['financial'],
    impact: 'low'
  },
  {
    id: '4',
    type: 'cross_domain_collaboration',
    title: 'Revenue Attribution Integration',
    description: 'Financial and Customer domains collaborating on revenue attribution using customer behavior data',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    affectedDomains: ['customer', 'financial'],
    impact: 'high'
  }
];

export const mockDomainConfiguration: DomainConfiguration = {
  domains: mockDomains,
  crossDomainDependencies: [
    { fromDomain: 'customer', toDomain: 'financial', dataProduct: 'Customer Attribution', relationship: 'provides', businessJustification: 'Revenue analysis requires customer behavior insights' },
    { fromDomain: 'product', toDomain: 'customer', dataProduct: 'Feature Usage Events', relationship: 'provides', businessJustification: 'Customer churn prediction benefits from feature engagement data' },
    { fromDomain: 'operations', toDomain: 'financial', dataProduct: 'Infrastructure Costs', relationship: 'provides', businessJustification: 'Accurate cost allocation needed for P&L reporting' }
  ],
  organizationalActivity: mockOrganizationalActivity,
  teamStructure: 'medium'
};