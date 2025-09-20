/**
 * DataHubContextService
 * 
 * Service to pull and utilize DataHub metadata for rules engine.
 * Properly reflects DataHub's actual metadata model including aspects,
 * policies, and field-level metadata.
 */

// DataHub Entity and Aspect Types (matching real DataHub structure)
export interface DataHubDataset {
  urn: string; // e.g., "urn:li:dataset:(urn:li:dataPlatform:snowflake,db.schema.table,PROD)"
  platform: string;
  name: string;
  origin: 'PROD' | 'DEV' | 'TEST';
  properties?: {
    qualifiedName?: string;
    description?: string;
    customProperties?: Record<string, string>;
  };
}

export interface SchemaField {
  fieldPath: string; // e.g., "customer_id" or "[version=2.0].[type=struct].[type=string].email"
  type: string; // DataHub type like STRING, NUMBER, BOOLEAN
  nativeDataType: string; // Platform-specific type like VARCHAR(255)
  nullable: boolean;
  description?: string;
  glossaryTerms?: string[]; // URNs like "urn:li:glossaryTerm:pii"
  tags?: string[]; // URNs like "urn:li:tag:sensitive"
  isPartOfKey?: boolean;
}

export interface SchemaMetadata {
  schemaName?: string;
  platform: string;
  version: number;
  fields: SchemaField[];
  primaryKeys?: string[];
  foreignKeys?: Array<{
    sourceFields: string[];
    foreignDataset: string;
    foreignFields: string[];
  }>;
}

export interface FieldProfile {
  fieldPath: string;
  nullCount?: number;
  nullProportion?: number;
  uniqueCount?: number;
  uniqueProportion?: number;
  min?: string;
  max?: string;
  mean?: string;
  median?: string;
  stdev?: string;
  sampleValues?: string[];
}

export interface DatasetProfile {
  timestampMillis: number;
  rowCount?: number;
  columnCount?: number;
  sizeInBytes?: number;
  fieldProfiles: FieldProfile[];
}

export interface GlossaryTerm {
  urn: string; // e.g., "urn:li:glossaryTerm:customer_lifetime_value"
  name: string;
  definition: string;
  parentTerm?: string; // For hierarchy
  relatedTerms?: string[];
  sourceRef?: string; // Link to documentation
  owners: string[];
  // Business logic
  calculation?: string; // SQL expression
  properties?: Record<string, any>;
}

export interface DataHubPolicy {
  urn: string;
  type: 'METADATA' | 'PLATFORM';
  name: string;
  description?: string;
  state: 'ACTIVE' | 'INACTIVE';
  privileges: string[]; // e.g., ['VIEW_DATASET_USAGE', 'EDIT_DATASET_PROPERTIES']
  resources?: {
    type: string; // 'dataset', 'dashboard', etc.
    resources?: string[]; // Specific URNs
    allResources?: boolean;
    filter?: {
      criteria: Array<{
        field: string;
        values: string[];
        condition: 'EQUALS' | 'IN';
      }>;
    };
  };
  actors: {
    users?: string[];
    groups?: string[];
    allUsers?: boolean;
    resourceOwners?: boolean;
  };
}

export interface PIIClassification {
  fieldPath: string;
  infoTypes: Array<{
    type: 'EMAIL' | 'PHONE' | 'SSN' | 'CREDIT_CARD' | 'NAME' | 'ADDRESS' | 'IP_ADDRESS';
    confidenceScore: number; // 0-1
    predictionFactors: {
      columnNameMatch: number;
      dataPatternMatch: number;
      glossaryTermMatch: number;
      valuePatternMatch: number;
    };
  }>;
  recommendedAction: 'MASK' | 'ENCRYPT' | 'REDACT' | 'TOKENIZE';
  justification: string;
}

// Main context interface used by rules engine
export interface DataHubContext {
  // Dataset Identity
  dataset: DataHubDataset;
  
  // Schema Information (schemaMetadata aspect)
  schemaMetadata?: SchemaMetadata;
  
  // Data Profiling (datasetProfile aspect)
  datasetProfile?: DatasetProfile;
  
  // Business Glossary (glossaryTerms aspect)
  glossaryTerms: GlossaryTerm[];
  
  // Tags (globalTags aspect)
  tags: string[];
  
  // Ownership (ownership aspect)
  owners?: Array<{
    owner: string; // User or group URN
    type: 'DATAOWNER' | 'DELEGATE' | 'PRODUCER' | 'CONSUMER' | 'STAKEHOLDER';
  }>;
  
  // Lineage (upstream/downstream)
  upstreamDatasets?: string[];
  downstreamDatasets?: string[];
  
  // Governance
  dataGovernance?: {
    classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    retentionPolicy?: string;
    purgePolicy?: string;
  };
  
  // PII Detection Results
  piiClassifications: PIIClassification[];
  
  // Applicable Policies
  applicablePolicies: DataHubPolicy[];
  
  // Computed Quality Score
  qualityScore?: number;
}

export class DataHubContextService {
  private mockMode: boolean;
  private apiBase: string;
  
  constructor(config: { mockMode?: boolean; apiBase?: string } = {}) {
    this.mockMode = config.mockMode ?? true; // Default to mock for demo
    this.apiBase = config.apiBase || process.env.NEXT_PUBLIC_DATAHUB_GMS_URL || 'http://localhost:8080';
  }
  
  /**
   * Get context for a specific table (simplified interface)
   */
  async getTableContext(schema: string, table: string): Promise<DataHubContext> {
    const datasetUrn = this.constructDatasetUrn('snowflake', schema, table);
    return this.getDatasetContext(datasetUrn);
  }
  
  /**
   * Get comprehensive context from DataHub for rules application
   */
  async getDatasetContext(datasetUrn: string): Promise<DataHubContext> {
    if (this.mockMode) {
      return this.getMockContext(datasetUrn);
    }
    
    // In production, would make actual DataHub GraphQL/REST API calls
    throw new Error('Real DataHub integration not implemented - using mock mode');
  }
  
  /**
   * Construct proper DataHub dataset URN
   */
  private constructDatasetUrn(platform: string, schema: string, table: string): string {
    return `urn:li:dataset:(urn:li:dataPlatform:${platform},${schema}.${table},PROD)`;
  }
  
  /**
   * Get mock context that properly reflects DataHub structure
   */
  private getMockContext(datasetUrn: string): DataHubContext {
    // Determine which mock dataset to return based on URN
    if (datasetUrn.includes('customers')) {
      return this.getMockCustomersContext();
    } else if (datasetUrn.includes('sales') || datasetUrn.includes('transactions')) {
      return this.getMockSalesContext();
    }
    
    // Default mock context
    return this.getMockCustomersContext();
  }
  
  /**
   * Mock context for customers table with proper DataHub structure
   */
  private getMockCustomersContext(): DataHubContext {
    return {
      dataset: {
        urn: 'urn:li:dataset:(urn:li:dataPlatform:snowflake,sales.customers,PROD)',
        platform: 'snowflake',
        name: 'customers',
        origin: 'PROD',
        properties: {
          qualifiedName: 'SALES.PUBLIC.CUSTOMERS',
          description: 'Master customer data including PII and transaction history'
        }
      },
      
      schemaMetadata: {
        schemaName: 'customers',
        platform: 'snowflake',
        version: 0,
        fields: [
          {
            fieldPath: 'customer_id',
            type: 'NUMBER',
            nativeDataType: 'NUMBER(38,0)',
            nullable: false,
            description: 'Unique customer identifier',
            glossaryTerms: ['urn:li:glossaryTerm:customer_identifier'],
            tags: ['urn:li:tag:primary_key'],
            isPartOfKey: true
          },
          {
            fieldPath: 'customer_name',
            type: 'STRING',
            nativeDataType: 'VARCHAR(255)',
            nullable: false,
            description: 'Full customer name',
            glossaryTerms: ['urn:li:glossaryTerm:customer_name', 'urn:li:glossaryTerm:pii'],
            tags: ['urn:li:tag:pii']
          },
          {
            fieldPath: 'email',
            type: 'STRING',
            nativeDataType: 'VARCHAR(255)',
            nullable: true,
            description: 'Customer email address',
            glossaryTerms: ['urn:li:glossaryTerm:email_address', 'urn:li:glossaryTerm:pii'],
            tags: ['urn:li:tag:pii', 'urn:li:tag:sensitive']
          },
          {
            fieldPath: 'phone',
            type: 'STRING',
            nativeDataType: 'VARCHAR(20)',
            nullable: true,
            description: 'Customer phone number',
            glossaryTerms: ['urn:li:glossaryTerm:phone_number', 'urn:li:glossaryTerm:pii'],
            tags: ['urn:li:tag:pii', 'urn:li:tag:sensitive']
          },
          {
            fieldPath: 'last_purchase_date',
            type: 'DATE',
            nativeDataType: 'DATE',
            nullable: true,
            description: 'Date of most recent purchase',
            glossaryTerms: ['urn:li:glossaryTerm:last_activity', 'urn:li:glossaryTerm:recency'],
            tags: []
          },
          {
            fieldPath: 'order_count',
            type: 'NUMBER',
            nativeDataType: 'NUMBER(10,0)',
            nullable: false,
            description: 'Total number of orders',
            glossaryTerms: ['urn:li:glossaryTerm:frequency'],
            tags: []
          },
          {
            fieldPath: 'total_revenue',
            type: 'NUMBER',
            nativeDataType: 'NUMBER(15,2)',
            nullable: false,
            description: 'Total revenue from customer',
            glossaryTerms: ['urn:li:glossaryTerm:monetary', 'urn:li:glossaryTerm:revenue'],
            tags: []
          },
          {
            fieldPath: 'customer_segment',
            type: 'STRING',
            nativeDataType: 'VARCHAR(50)',
            nullable: true,
            description: 'Calculated customer segment',
            glossaryTerms: ['urn:li:glossaryTerm:customer_segment'],
            tags: []
          },
          {
            fieldPath: 'account_type',
            type: 'STRING',
            nativeDataType: 'VARCHAR(20)',
            nullable: false,
            description: 'Type of account (standard, premium, test)',
            glossaryTerms: [],
            tags: []
          }
        ],
        primaryKeys: ['customer_id']
      },
      
      datasetProfile: {
        timestampMillis: Date.now(),
        rowCount: 100000,
        columnCount: 9,
        sizeInBytes: 52428800,
        fieldProfiles: [
          {
            fieldPath: 'customer_id',
            nullCount: 0,
            nullProportion: 0.0,
            uniqueCount: 100000,
            uniqueProportion: 1.0
          },
          {
            fieldPath: 'email',
            nullCount: 8500,
            nullProportion: 0.085,
            uniqueCount: 91500,
            uniqueProportion: 0.915
          },
          {
            fieldPath: 'last_purchase_date',
            nullCount: 15000,
            nullProportion: 0.15,
            min: '2020-01-01',
            max: '2024-12-01'
          }
        ]
      },
      
      glossaryTerms: [
        {
          urn: 'urn:li:glossaryTerm:customer_lifetime_value',
          name: 'Customer Lifetime Value',
          definition: 'Total revenue expected from a customer over their entire relationship',
          calculation: 'SUM(order_value) OVER (PARTITION BY customer_id ORDER BY order_date)',
          owners: ['urn:li:corpuser:data-team'],
          properties: {
            unit: 'USD',
            updateFrequency: 'daily'
          }
        },
        {
          urn: 'urn:li:glossaryTerm:churn_risk',
          name: 'Churn Risk Score',
          definition: 'Likelihood of customer discontinuing service',
          calculation: 'CASE WHEN DATEDIFF(day, last_purchase_date, CURRENT_DATE) > 90 THEN 1 ELSE 0 END',
          parentTerm: 'urn:li:glossaryTerm:customer_metrics',
          owners: ['urn:li:corpuser:analytics-team']
        }
      ],
      
      tags: [
        'urn:li:tag:customer-data',
        'urn:li:tag:pii-contained',
        'urn:li:tag:tier-1'
      ],
      
      owners: [
        {
          owner: 'urn:li:corpuser:john.smith',
          type: 'DATAOWNER'
        },
        {
          owner: 'urn:li:corpGroup:data-governance',
          type: 'DELEGATE'
        }
      ],
      
      upstreamDatasets: [
        'urn:li:dataset:(urn:li:dataPlatform:snowflake,raw.customer_events,PROD)',
        'urn:li:dataset:(urn:li:dataPlatform:snowflake,raw.transactions,PROD)'
      ],
      
      downstreamDatasets: [
        'urn:li:dataset:(urn:li:dataPlatform:snowflake,analytics.customer_360,PROD)',
        'urn:li:dataset:(urn:li:dataPlatform:snowflake,ml.churn_features,PROD)'
      ],
      
      dataGovernance: {
        classification: 'CONFIDENTIAL',
        retentionPolicy: '7 years',
        purgePolicy: 'GDPR compliant - 30 days after deletion request'
      },
      
      piiClassifications: [
        {
          fieldPath: 'email',
          infoTypes: [{
            type: 'EMAIL',
            confidenceScore: 0.99,
            predictionFactors: {
              columnNameMatch: 1.0,
              dataPatternMatch: 0.98,
              glossaryTermMatch: 1.0,
              valuePatternMatch: 0.97
            }
          }],
          recommendedAction: 'MASK',
          justification: 'Field name and pattern strongly indicate email address'
        },
        {
          fieldPath: 'phone',
          infoTypes: [{
            type: 'PHONE',
            confidenceScore: 0.95,
            predictionFactors: {
              columnNameMatch: 1.0,
              dataPatternMatch: 0.90,
              glossaryTermMatch: 1.0,
              valuePatternMatch: 0.85
            }
          }],
          recommendedAction: 'MASK',
          justification: 'Field contains phone number patterns'
        },
        {
          fieldPath: 'customer_name',
          infoTypes: [{
            type: 'NAME',
            confidenceScore: 0.92,
            predictionFactors: {
              columnNameMatch: 0.95,
              dataPatternMatch: 0.85,
              glossaryTermMatch: 0.90,
              valuePatternMatch: 0.88
            }
          }],
          recommendedAction: 'REDACT',
          justification: 'Field contains personal names'
        }
      ],
      
      applicablePolicies: [
        {
          urn: 'urn:li:dataHubPolicy:pii-masking-policy',
          type: 'METADATA',
          name: 'PII Masking Policy',
          description: 'Automatically mask PII fields for non-privileged users',
          state: 'ACTIVE',
          privileges: ['VIEW_DATASET_SENSITIVE_DATA'],
          resources: {
            type: 'dataset',
            filter: {
              criteria: [{
                field: 'tags',
                values: ['urn:li:tag:pii'],
                condition: 'IN'
              }]
            }
          },
          actors: {
            groups: ['urn:li:corpGroup:data-stewards', 'urn:li:corpGroup:admins'],
            resourceOwners: true
          }
        },
        {
          urn: 'urn:li:dataHubPolicy:quality-enforcement',
          type: 'METADATA', 
          name: 'Data Quality Enforcement',
          description: 'Enforce quality thresholds on tier-1 datasets',
          state: 'ACTIVE',
          privileges: ['EDIT_DATASET_COL_TAGS'],
          resources: {
            type: 'dataset',
            filter: {
              criteria: [{
                field: 'tags',
                values: ['urn:li:tag:tier-1'],
                condition: 'IN'
              }]
            }
          },
          actors: {
            groups: ['urn:li:corpGroup:data-quality-team']
          }
        }
      ],
      
      qualityScore: 85 // Computed from profile metrics
    };
  }
  
  /**
   * Mock context for sales/transactions table
   */
  private getMockSalesContext(): DataHubContext {
    return {
      dataset: {
        urn: 'urn:li:dataset:(urn:li:dataPlatform:snowflake,sales.transactions,PROD)',
        platform: 'snowflake',
        name: 'transactions',
        origin: 'PROD',
        properties: {
          qualifiedName: 'SALES.PUBLIC.TRANSACTIONS',
          description: 'Sales transaction records'
        }
      },
      
      schemaMetadata: {
        schemaName: 'transactions',
        platform: 'snowflake',
        version: 0,
        fields: [
          {
            fieldPath: 'order_id',
            type: 'STRING',
            nativeDataType: 'VARCHAR(50)',
            nullable: false,
            glossaryTerms: ['urn:li:glossaryTerm:order_identifier'],
            tags: ['urn:li:tag:primary_key'],
            isPartOfKey: true
          },
          {
            fieldPath: 'customer_id',
            type: 'NUMBER',
            nativeDataType: 'NUMBER(38,0)',
            nullable: false,
            glossaryTerms: ['urn:li:glossaryTerm:customer_identifier'],
            tags: ['urn:li:tag:foreign_key']
          },
          {
            fieldPath: 'product_name',
            type: 'STRING',
            nativeDataType: 'VARCHAR(255)',
            nullable: false,
            glossaryTerms: ['urn:li:glossaryTerm:product'],
            tags: []
          },
          {
            fieldPath: 'category',
            type: 'STRING',
            nativeDataType: 'VARCHAR(100)',
            nullable: true,
            glossaryTerms: ['urn:li:glossaryTerm:product_category'],
            tags: []
          },
          {
            fieldPath: 'revenue',
            type: 'NUMBER',
            nativeDataType: 'NUMBER(15,2)',
            nullable: false,
            glossaryTerms: ['urn:li:glossaryTerm:revenue', 'urn:li:glossaryTerm:monetary'],
            tags: []
          },
          {
            fieldPath: 'order_date',
            type: 'DATE',
            nativeDataType: 'DATE',
            nullable: false,
            glossaryTerms: ['urn:li:glossaryTerm:transaction_date'],
            tags: []
          }
        ],
        primaryKeys: ['order_id'],
        foreignKeys: [{
          sourceFields: ['customer_id'],
          foreignDataset: 'urn:li:dataset:(urn:li:dataPlatform:snowflake,sales.customers,PROD)',
          foreignFields: ['customer_id']
        }]
      },
      
      datasetProfile: {
        timestampMillis: Date.now(),
        rowCount: 1000000,
        columnCount: 6,
        fieldProfiles: [
          {
            fieldPath: 'revenue',
            nullCount: 0,
            nullProportion: 0.0,
            min: '0.99',
            max: '99999.99',
            mean: '156.78',
            median: '89.99'
          }
        ]
      },
      
      glossaryTerms: [],
      tags: ['urn:li:tag:transactional', 'urn:li:tag:financial'],
      
      dataGovernance: {
        classification: 'INTERNAL',
        retentionPolicy: '7 years'
      },
      
      piiClassifications: [], // No PII in this table
      applicablePolicies: [],
      qualityScore: 92
    };
  }
  
  /**
   * Check if current user has specific privilege on dataset
   */
  async checkPolicy(params: {
    actor: string;
    dataset: string;
    privilege: string;
  }): Promise<boolean> {
    // In real implementation, would check against DataHub policies
    // For demo, implement simple logic
    const privilegedGroups = ['urn:li:corpGroup:data-stewards', 'urn:li:corpGroup:admins'];
    const privilegedUsers = ['urn:li:corpuser:admin'];
    
    return privilegedUsers.includes(params.actor) || 
           privilegedGroups.some(g => params.actor.includes(g));
  }
}

// Export singleton instance
export const dataHubService = new DataHubContextService({ mockMode: true });