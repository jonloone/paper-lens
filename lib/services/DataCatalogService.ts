/**
 * DataCatalogService - Unified access to data infrastructure knowledge
 * Bridges mock services to provide agents with comprehensive data context
 */

import { mockDataStore, Pipeline, SchemaColumn, DataLineage } from './mock/MockDataStore';
import { mockDataHubService, DataAsset } from './mock/MockDataHubService';

export interface Table {
  name: string;
  schema: string;
  fullName: string;
  columns: SchemaColumn[];
  description?: string;
  tags: string[];
  rowCount?: number;
  owner: string;
  lastUpdated: Date;
}

export interface SystemInfo {
  name: string;
  type: 'database' | 'pipeline' | 'stream' | 'api';
  status: 'available' | 'degraded' | 'offline';
  description: string;
  endpoint?: string;
}

export interface BusinessContext {
  domain: string;
  commonAnalyses: string[];
  keyMetrics: string[];
  churnDefinition?: string;
  businessRules: string[];
}

export interface QuerySuggestion {
  type: 'analysis' | 'quality' | 'exploration';
  title: string;
  description: string;
  sql: string;
  tables: string[];
}

class DataCatalogService {
  private initialized = false;
  private tables: Map<string, Table> = new Map();
  private systems: SystemInfo[] = [];
  private businessContext: BusinessContext;

  constructor() {
    this.businessContext = {
      domain: 'Customer Analytics & E-commerce',
      commonAnalyses: [
        'Customer Churn Analysis',
        'Customer Lifetime Value',
        'Purchase Behavior Analysis',
        'Segmentation Analysis',
        'Revenue Forecasting'
      ],
      keyMetrics: [
        'Monthly Active Users',
        'Churn Rate',
        'Average Order Value',
        'Customer Acquisition Cost',
        'Customer Satisfaction Score'
      ],
      churnDefinition: 'Customers with no purchases in 90+ days and no login in 60+ days',
      businessRules: [
        'Customer emails must be unique and valid',
        'Orders require valid customer_id reference',
        'Churn analysis excludes customers created within last 90 days',
        'Revenue calculations include taxes and shipping'
      ]
    };
    
    this.initializeDataCatalog();
  }

  private initializeDataCatalog() {
    if (this.initialized) return;

    // Initialize tables from mock data store
    const pipelines = mockDataStore.getAllPipelines();
    
    // Customer domain tables
    this.addTable({
      name: 'master_table',
      schema: 'customer',
      fullName: 'customer.master_table',
      columns: [
        { name: 'customer_id', type: 'STRING', nullable: false, description: 'Unique customer identifier' },
        { name: 'customer_email', type: 'VARCHAR(100)', nullable: false, description: 'Customer email address' },
        { name: 'first_name', type: 'STRING', nullable: false, description: 'Customer first name' },
        { name: 'last_name', type: 'STRING', nullable: false, description: 'Customer last name' },
        { name: 'address_line1', type: 'STRING', nullable: true, description: 'Primary address line' },
        { name: 'city', type: 'STRING', nullable: true, description: 'City' },
        { name: 'state', type: 'STRING', nullable: true, description: 'State or province' },
        { name: 'postal_code', type: 'STRING', nullable: true, description: 'ZIP or postal code' },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, description: 'Account creation date' },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: false, description: 'Last profile update' },
        { name: 'last_login_date', type: 'TIMESTAMP', nullable: true, description: 'Most recent login timestamp' },
        { name: 'total_orders', type: 'INTEGER', nullable: false, description: 'Total number of orders placed' },
        { name: 'total_spent', type: 'DECIMAL(10,2)', nullable: false, description: 'Total amount spent' },
        { name: 'churn_risk_score', type: 'DECIMAL(3,2)', nullable: true, description: 'ML-generated churn probability (0-1)' }
      ],
      description: 'Master customer table with profile data and churn indicators',
      tags: ['customer', 'master', 'churn-analysis', 'marketing'],
      rowCount: 45000,
      owner: 'data-team',
      lastUpdated: new Date('2024-01-26T14:23:00Z')
    });

    this.addTable({
      name: 'order_history',
      schema: 'sales',
      fullName: 'sales.order_history',
      columns: [
        { name: 'order_id', type: 'STRING', nullable: false, description: 'Unique order identifier' },
        { name: 'customer_id', type: 'STRING', nullable: false, description: 'Customer who placed order' },
        { name: 'order_date', type: 'TIMESTAMP', nullable: false, description: 'Order placement date' },
        { name: 'order_total', type: 'DECIMAL(10,2)', nullable: false, description: 'Total order value' },
        { name: 'order_status', type: 'STRING', nullable: false, description: 'Current order status' },
        { name: 'items_count', type: 'INTEGER', nullable: false, description: 'Number of items in order' },
        { name: 'payment_method', type: 'STRING', nullable: true, description: 'Payment method used' }
      ],
      description: 'Historical order data for purchase behavior analysis',
      tags: ['orders', 'sales', 'revenue', 'behavior'],
      rowCount: 180000,
      owner: 'sales-team',
      lastUpdated: new Date('2024-01-26T12:00:00Z')
    });

    this.addTable({
      name: 'customer_engagement',
      schema: 'analytics',
      fullName: 'analytics.customer_engagement',
      columns: [
        { name: 'customer_id', type: 'STRING', nullable: false },
        { name: 'date', type: 'DATE', nullable: false },
        { name: 'page_views', type: 'INTEGER', nullable: false },
        { name: 'session_duration', type: 'INTEGER', nullable: false, description: 'Session length in minutes' },
        { name: 'email_opens', type: 'INTEGER', nullable: false },
        { name: 'email_clicks', type: 'INTEGER', nullable: false },
        { name: 'support_tickets', type: 'INTEGER', nullable: false }
      ],
      description: 'Daily customer engagement metrics for churn prediction',
      tags: ['engagement', 'churn', 'behavior', 'daily'],
      rowCount: 2500000,
      owner: 'analytics-team',
      lastUpdated: new Date('2024-01-26T08:00:00Z')
    });

    // Initialize systems
    this.systems = [
      {
        name: 'Trino',
        type: 'database',
        status: 'available',
        description: 'Distributed SQL query engine for data lake analytics',
        endpoint: 'https://trino.company.com:8080'
      },
      {
        name: 'DataHub',
        type: 'api',
        status: 'available',
        description: 'Metadata management and data discovery platform'
      },
      {
        name: 'Apache Airflow',
        type: 'pipeline',
        status: 'available',
        description: 'Workflow orchestration platform for ETL pipelines',
        endpoint: 'https://airflow.company.com'
      },
      {
        name: 'Apache Kafka',
        type: 'stream',
        status: 'available',
        description: 'Real-time data streaming platform'
      },
      {
        name: 'Apache NiFi',
        type: 'pipeline',
        status: 'available',
        description: 'Data integration and ETL tool for data flow management'
      }
    ];

    this.initialized = true;
  }

  private addTable(table: Table) {
    this.tables.set(table.fullName, table);
  }

  /**
   * Get all available tables
   */
  getAllTables(): Table[] {
    this.initializeDataCatalog();
    return Array.from(this.tables.values());
  }

  /**
   * Search tables by name or description
   */
  searchTables(query: string): Table[] {
    this.initializeDataCatalog();
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.tables.values()).filter(table =>
      table.name.toLowerCase().includes(lowerQuery) ||
      table.fullName.toLowerCase().includes(lowerQuery) ||
      table.description?.toLowerCase().includes(lowerQuery) ||
      table.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get tables relevant for specific analysis
   */
  getTablesForAnalysis(analysisType: string): Table[] {
    this.initializeDataCatalog();
    
    const analysisLower = analysisType.toLowerCase();
    
    if (analysisLower.includes('churn')) {
      return [
        this.tables.get('customer.master_table')!,
        this.tables.get('sales.order_history')!,
        this.tables.get('analytics.customer_engagement')!
      ].filter(Boolean);
    }
    
    if (analysisLower.includes('customer')) {
      return Array.from(this.tables.values()).filter(table =>
        table.tags.includes('customer') || table.schema === 'customer'
      );
    }
    
    if (analysisLower.includes('sales') || analysisLower.includes('revenue')) {
      return Array.from(this.tables.values()).filter(table =>
        table.tags.includes('sales') || table.tags.includes('revenue')
      );
    }
    
    return [];
  }

  /**
   * Get business context for domain
   */
  getBusinessContext(): BusinessContext {
    return this.businessContext;
  }

  /**
   * Get available systems and their status
   */
  getSystems(): SystemInfo[] {
    return this.systems;
  }

  /**
   * Generate query suggestions for analysis type
   */
  getQuerySuggestions(analysisType: string): QuerySuggestion[] {
    this.initializeDataCatalog();
    
    const analysisLower = analysisType.toLowerCase();
    
    if (analysisLower.includes('churn')) {
      return [
        {
          type: 'analysis',
          title: 'Customer Churn Analysis',
          description: 'Identify customers at risk of churning based on engagement and purchase patterns',
          sql: `SELECT 
  c.customer_id,
  c.customer_email,
  c.first_name,
  c.last_name,
  c.last_login_date,
  COALESCE(oh.last_order_date, c.created_at) as last_order_date,
  COALESCE(oh.total_orders, 0) as total_orders,
  COALESCE(oh.total_spent, 0) as total_spent,
  c.churn_risk_score,
  CASE 
    WHEN c.last_login_date < CURRENT_DATE - INTERVAL '60' DAY 
         AND COALESCE(oh.last_order_date, c.created_at) < CURRENT_DATE - INTERVAL '90' DAY 
    THEN 'High Risk'
    WHEN c.last_login_date < CURRENT_DATE - INTERVAL '30' DAY 
         OR COALESCE(oh.last_order_date, c.created_at) < CURRENT_DATE - INTERVAL '60' DAY 
    THEN 'Medium Risk'
    ELSE 'Low Risk'
  END as churn_risk_category
FROM customer.master_table c
LEFT JOIN (
  SELECT 
    customer_id,
    MAX(order_date) as last_order_date,
    COUNT(*) as total_orders,
    SUM(order_total) as total_spent
  FROM sales.order_history
  WHERE order_status = 'completed'
  GROUP BY customer_id
) oh ON c.customer_id = oh.customer_id
WHERE c.created_at < CURRENT_DATE - INTERVAL '90' DAY
ORDER BY c.churn_risk_score DESC NULLS LAST;`,
          tables: ['customer.master_table', 'sales.order_history']
        },
        {
          type: 'quality',
          title: 'Data Quality Check for Churn Analysis',
          description: 'Validate data completeness for churn analysis inputs',
          sql: `SELECT 
  'customer.master_table' as table_name,
  COUNT(*) as total_records,
  COUNT(customer_email) as email_count,
  COUNT(last_login_date) as login_date_count,
  COUNT(churn_risk_score) as risk_score_count,
  ROUND(100.0 * COUNT(customer_email) / COUNT(*), 2) as email_completeness_pct,
  ROUND(100.0 * COUNT(last_login_date) / COUNT(*), 2) as login_completeness_pct,
  ROUND(100.0 * COUNT(churn_risk_score) / COUNT(*), 2) as risk_score_completeness_pct
FROM customer.master_table
UNION ALL
SELECT 
  'sales.order_history' as table_name,
  COUNT(*) as total_records,
  COUNT(customer_id) as customer_id_count,
  COUNT(order_date) as order_date_count,
  COUNT(order_total) as order_total_count,
  ROUND(100.0 * COUNT(customer_id) / COUNT(*), 2) as customer_id_completeness_pct,
  ROUND(100.0 * COUNT(order_date) / COUNT(*), 2) as order_date_completeness_pct,
  ROUND(100.0 * COUNT(order_total) / COUNT(*), 2) as order_total_completeness_pct
FROM sales.order_history;`,
          tables: ['customer.master_table', 'sales.order_history']
        }
      ];
    }
    
    return [];
  }

  /**
   * Get table schema information
   */
  getTableSchema(tableName: string): Table | null {
    this.initializeDataCatalog();
    return this.tables.get(tableName) || null;
  }

  /**
   * Get context summary for agents
   */
  getAgentContextSummary(): string {
    this.initializeDataCatalog();
    
    const tableList = Array.from(this.tables.keys()).join(', ');
    const systemList = this.systems.map(s => s.name).join(', ');
    
    return `NexusOne Data Platform Context:

Available Tables: ${tableList}

Key Customer Tables:
- customer.master_table: Master customer profiles with churn indicators (45K records)
- sales.order_history: Historical purchase data (180K records)  
- analytics.customer_engagement: Daily engagement metrics (2.5M records)

Connected Systems: ${systemList}

Business Domain: ${this.businessContext.domain}
Churn Definition: ${this.businessContext.churnDefinition}

Common Analysis Types: ${this.businessContext.commonAnalyses.join(', ')}

When users ask for analysis, reference these specific tables and provide queries using actual schema columns.`;
  }
}

export const dataCatalogService = new DataCatalogService();