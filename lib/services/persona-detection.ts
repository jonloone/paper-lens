// Persona Detection and User Context Service

import type { UserRole, UserContext, User, PersonaConfig, QuickAction } from '@/lib/types/persona';

// Mock user detection - in production, this would come from auth system
export function getCurrentUser(): User {
  // For demo, allow role switching via localStorage
  if (typeof window !== 'undefined') {
    const savedRole = localStorage.getItem('nexusone_user_role') as UserRole;
    if (savedRole) {
      return getMockUser(savedRole);
    }
  }

  // Default to data engineer for demo
  return getMockUser('data_engineer');
}

export function getMockUser(role: UserRole): User {
  const users: Record<UserRole, User> = {
    senior_data_engineer: {
      id: 'user-1',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      role: 'senior_data_engineer',
      team: 'Data Platform',
      avatar: '/avatars/jane.jpg'
    },
    data_engineer: {
      id: 'user-2',
      name: 'Alex Chen',
      email: 'alex.chen@company.com',
      role: 'data_engineer',
      team: 'Customer Analytics',
      avatar: '/avatars/alex.jpg'
    },
    analytics_engineer: {
      id: 'user-3',
      name: 'Emma Wilson',
      email: 'emma.wilson@company.com',
      role: 'analytics_engineer',
      team: 'Business Intelligence',
      avatar: '/avatars/emma.jpg'
    },
    data_scientist: {
      id: 'user-4',
      name: 'Michael Rodriguez',
      email: 'michael.r@company.com',
      role: 'data_scientist',
      team: 'ML Engineering',
      avatar: '/avatars/michael.jpg'
    },
    data_analyst: {
      id: 'user-5',
      name: 'Sarah Park',
      email: 'sarah.park@company.com',
      role: 'data_analyst',
      team: 'Marketing Analytics',
      avatar: '/avatars/sarah.jpg'
    },
    product_manager: {
      id: 'user-6',
      name: 'Tom Johnson',
      email: 'tom.johnson@company.com',
      role: 'product_manager',
      team: 'Data Products',
      avatar: '/avatars/tom.jpg'
    }
  };

  return users[role];
}

export async function getUserContext(): Promise<UserContext> {
  const user = getCurrentUser();

  // In production, these would be API calls
  const [recentActivity, drafts, deployedProducts] = await Promise.all([
    fetchRecentActivity(user.id),
    fetchDrafts(user.id),
    fetchDeployedProducts(user.id)
  ]);

  return {
    user,
    recentActivity,
    drafts,
    deployedProducts,
    preferences: {
      notifications: {
        email: true,
        slack: true,
        inApp: true
      },
      favoriteProducts: []
    }
  };
}

// Mock data fetchers
async function fetchRecentActivity(userId: string) {
  return [
    {
      id: '1',
      type: 'deploy' as const,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      description: 'Deployed customer_ltv_model to production',
      relatedId: 'product-123'
    },
    {
      id: '2',
      type: 'review' as const,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      description: 'Reviewed and approved churn_features_v2',
      relatedId: 'request-456'
    },
    {
      id: '3',
      type: 'create' as const,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      description: 'Created draft for revenue_forecast_v3',
      relatedId: 'draft-789'
    }
  ];
}

async function fetchDrafts(userId: string) {
  return [
    {
      id: 'draft-1',
      productName: 'customer_segmentation_v2',
      lastSaved: new Date(Date.now() - 5 * 60 * 1000),
      step: 4,
      completeness: 67
    },
    {
      id: 'draft-2',
      productName: 'churn_prediction_features',
      lastSaved: new Date(Date.now() - 2 * 60 * 60 * 1000),
      step: 2,
      completeness: 33
    }
  ];
}

async function fetchDeployedProducts(userId: string) {
  return [
    {
      id: 'product-1',
      name: 'daily_customer_aggregate',
      domain: 'Customer',
      status: 'healthy' as const,
      quality: 96,
      latency: '12m',
      deployedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'product-2',
      name: 'weekly_cohort_analysis',
      domain: 'Customer',
      status: 'degraded' as const,
      quality: 89,
      latency: '+45m',
      deployedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    }
  ];
}

// Persona configuration
export function getPersonaConfig(role: UserRole): PersonaConfig {
  const configs: Record<UserRole, PersonaConfig> = {
    senior_data_engineer: {
      role: 'senior_data_engineer',
      displayName: 'Senior Data Engineer',
      quickActions: [
        { label: 'Run Debug Agent', icon: '🔧', href: '/operations' },
        { label: 'View Cost Report', icon: '💰', href: '/costs' },
        { label: 'Team Status', icon: '👥', href: '/team' },
        { label: 'System Health', icon: '⚙️', href: '/monitor' }
      ],
      primaryZoneType: 'operations'
    },
    data_engineer: {
      role: 'data_engineer',
      displayName: 'Data Engineer',
      quickActions: [
        { label: 'New Data Product', icon: '➕', href: '/build' },
        { label: 'Resume Draft', icon: '📝', href: '/build?resume=true' },
        { label: 'Browse Patterns', icon: '🔍', href: '/patterns' },
        { label: 'My Pipelines', icon: '📊', href: '/pipelines' }
      ],
      primaryZoneType: 'my_work'
    },
    analytics_engineer: {
      role: 'analytics_engineer',
      displayName: 'Analytics Engineer',
      quickActions: [
        { label: 'New dbt Model', icon: '📊', href: '/build?type=dbt' },
        { label: 'Run dbt', icon: '🔄', href: '/dbt/run' },
        { label: 'Model Performance', icon: '📈', href: '/dbt/performance' },
        { label: 'Update Docs', icon: '📚', href: '/dbt/docs' }
      ],
      primaryZoneType: 'dbt_models'
    },
    data_scientist: {
      role: 'data_scientist',
      displayName: 'Data Scientist',
      quickActions: [
        { label: 'Browse Features', icon: '🔍', href: '/features' },
        { label: 'New Pipeline', icon: '➕', href: '/build?type=ml' },
        { label: 'Experiments', icon: '🧪', href: '/mlflow' },
        { label: 'Model Registry', icon: '📦', href: '/models' }
      ],
      primaryZoneType: 'search'
    },
    data_analyst: {
      role: 'data_analyst',
      displayName: 'Data Analyst',
      quickActions: [
        { label: 'Search Data', icon: '🔍', href: '/discover' },
        { label: 'Ask in Natural Language', icon: '💬', href: '/query' },
        { label: 'My Dashboards', icon: '📊', href: '/dashboards' },
        { label: 'Saved Queries', icon: '⭐', href: '/queries' }
      ],
      primaryZoneType: 'search'
    },
    product_manager: {
      role: 'product_manager',
      displayName: 'Product Manager',
      quickActions: [
        { label: 'View SLAs', icon: '📊', href: '/sla' },
        { label: 'Governance', icon: '⚖️', href: '/govern' },
        { label: 'Team Velocity', icon: '📈', href: '/metrics' },
        { label: 'Roadmap', icon: '🗺️', href: '/roadmap' }
      ],
      primaryZoneType: 'oversight'
    }
  };

  return configs[role];
}

// Role switcher for demo
export function switchRole(role: UserRole): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nexusone_user_role', role);
    window.location.reload();
  }
}

export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    senior_data_engineer: 'Senior Data Engineer',
    data_engineer: 'Data Engineer',
    analytics_engineer: 'Analytics Engineer',
    data_scientist: 'Data Scientist',
    data_analyst: 'Data Analyst',
    product_manager: 'Product Manager'
  };
  return names[role];
}

// Product Detail Page Persona Mapping
export type ProductDetailPersona = 'data_analyst' | 'data_engineer' | 'business_stakeholder';

export function getProductDetailPersona(role: UserRole): ProductDetailPersona {
  const mapping: Record<UserRole, ProductDetailPersona> = {
    senior_data_engineer: 'data_engineer',
    data_engineer: 'data_engineer',
    analytics_engineer: 'data_analyst',
    data_scientist: 'data_analyst',
    data_analyst: 'data_analyst',
    product_manager: 'business_stakeholder'
  };
  return mapping[role];
}

export function getDefaultTabForPersona(persona: ProductDetailPersona): string {
  const defaultTabs: Record<ProductDetailPersona, string> = {
    data_analyst: 'quickstart',      // Focus on getting data quickly
    data_engineer: 'quality',         // Focus on technical quality
    business_stakeholder: 'overview'  // Focus on business context
  };
  return defaultTabs[persona];
}

export function getPersonaDisplayName(persona: ProductDetailPersona): string {
  const names: Record<ProductDetailPersona, string> = {
    data_analyst: 'Data Analyst',
    data_engineer: 'Data Engineer',
    business_stakeholder: 'Business Stakeholder'
  };
  return names[persona];
}

export function getPersonaDescription(persona: ProductDetailPersona): string {
  const descriptions: Record<ProductDetailPersona, string> = {
    data_analyst: 'Quickly assess and access data for analysis',
    data_engineer: 'Evaluate technical quality and integration',
    business_stakeholder: 'Understand business value and context'
  };
  return descriptions[persona];
}
