export interface Stakeholder {
  name: string;
  role: string;
  email: string;
  team: string;
}

export interface BusinessMetric {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  target?: string;
}

export interface BusinessInitiative {
  name: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  deadline?: Date;
  description: string;
}

export interface DomainActivity {
  id: string;
  type: 'product_created' | 'product_updated' | 'source_connected' | 'pattern_applied' | 'schema_change' | 'quality_issue';
  title: string;
  description: string;
  timestamp: Date;
  actor: string;
  productId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'completed' | 'in_progress' | 'blocked' | 'attention_required';
  progress?: number;
}

export interface DataProduct {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'development' | 'deprecated' | 'planning';
  qualityScore: number;
  usage: 'high' | 'medium' | 'low';
  freshness: 'real-time' | 'hourly' | 'daily' | 'weekly';
  owner: string;
  lastUpdated: Date;
  consumers: number;
  issues?: number;
}

export interface CrossDomainDependency {
  fromDomain: string;
  toDomain: string;
  dataProduct: string;
  relationship: 'uses' | 'provides' | 'enhances';
  businessJustification: string;
}

export interface DomainHealth {
  productsCount: number;
  qualityScore: number;
  activeDevProjects: number;
  lastActivity: Date;
  status: 'healthy' | 'warning' | 'critical';
  issues: {
    critical: number;
    warning: number;
    total: number;
  };
  performance: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export interface Domain {
  id: string;
  name: 'Customer' | 'Financial' | 'Product' | 'Operations';
  description: string;
  icon: string;
  color: string;

  // Business Context
  businessContext: {
    primaryStakeholders: Stakeholder[];
    keyMetrics: BusinessMetric[];
    currentInitiatives: BusinessInitiative[];
    complianceRequirements: string[];
  };

  // Technical Health
  health: DomainHealth;

  // Data Products in Domain
  dataProducts: DataProduct[];

  // Recent Activity
  recentActivity: DomainActivity[];

  // Team & Ownership
  ownership: {
    primaryOwner: string;
    team: string;
    engineers: string[];
  };

  // AI Intelligence
  aiInsights: {
    recommendations: string[];
    patternOpportunities: string[];
    crossDomainSuggestions: CrossDomainDependency[];
  };
}

export interface OrganizationalActivity {
  id: string;
  type: 'pattern_reuse' | 'schema_change' | 'source_added' | 'cross_domain_collaboration';
  title: string;
  description: string;
  timestamp: Date;
  affectedDomains: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface DomainConfiguration {
  domains: Domain[];
  crossDomainDependencies: CrossDomainDependency[];
  organizationalActivity: OrganizationalActivity[];
  teamStructure: 'small' | 'medium' | 'large' | 'enterprise';
}