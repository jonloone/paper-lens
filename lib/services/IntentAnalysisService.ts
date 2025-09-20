/**
 * IntentAnalysisService
 * 
 * Analyzes user intent and applies enhancements based on DataHub metadata.
 * Uses actual field names and policies from DataHub context.
 */

import type { DataHubContext, SchemaField } from './DataHubContextService';
import { dataHubPolicyService, type UserContext } from './DataHubPolicyService';

export interface QueryIntent {
  type: 'churn_analysis' | 'revenue_analysis' | 'customer_segmentation' | 'operational' | 'exploration' | 'generic';
  confidence: number;
  keywords: string[];
}

export interface AppliedEnhancement {
  id: string;
  type: 'privacy' | 'quality' | 'metric' | 'filter' | 'governance' | 'clarification';
  title: string;
  explanation: string;
  sqlComment?: string;
  sqlSnippet?: string;
  removable: boolean;
  source: 'DataHub Policy' | 'DataHub Glossary' | 'DataHub Profile' | 'Intent Analysis';
}

export interface QueryClarification {
  id: string;
  question: string;
  options: Array<{
    label: string;
    value: any;
    sqlTransformation?: string;
  }>;
  type: 'time_range' | 'aggregation' | 'filter' | 'grouping';
}

export class IntentAnalysisService {
  private currentUser: UserContext = {
    urn: 'urn:li:corpuser:demo.user',
    groups: ['urn:li:corpGroup:analysts'],
    isOwner: false
  };
  
  /**
   * Set the current user context for policy evaluation
   */
  setUserContext(user: UserContext) {
    this.currentUser = user;
  }
  
  /**
   * Analyze the user's natural language query to determine intent
   */
  analyzeIntent(query: string): QueryIntent {
    const lower = query.toLowerCase();
    
    if (lower.includes('churn') || (lower.includes('inactive') && lower.includes('customer'))) {
      return {
        type: 'churn_analysis',
        confidence: 0.9,
        keywords: ['churn', 'inactive', 'retention', 'lost']
      };
    }
    
    if (lower.includes('revenue') || lower.includes('sales') || lower.includes('top')) {
      return {
        type: 'revenue_analysis',
        confidence: 0.85,
        keywords: ['revenue', 'sales', 'profit', 'top']
      };
    }
    
    if (lower.includes('segment') || lower.includes('group') || lower.includes('cohort')) {
      return {
        type: 'customer_segmentation',
        confidence: 0.8,
        keywords: ['segment', 'group', 'cohort', 'cluster']
      };
    }
    
    return {
      type: 'generic',
      confidence: 0.5,
      keywords: []
    };
  }
  
  /**
   * Get enhancements based on intent and DataHub context
   */
  getEnhancementsForIntent(intent: QueryIntent, context: DataHubContext): AppliedEnhancement[] {
    const enhancements: AppliedEnhancement[] = [];
    
    // 1. Apply PII masking based on DataHub policies
    const needsMasking = !dataHubPolicyService.canViewSensitiveData(this.currentUser, context);
    
    if (needsMasking && context.piiClassifications.length > 0) {
      for (const piiClass of context.piiClassifications) {
        const field = context.schemaMetadata?.fields.find(
          f => f.fieldPath === piiClass.fieldPath
        );
        
        if (field) {
          enhancements.push({
            id: `privacy-${field.fieldPath}`,
            type: 'privacy',
            title: `Protected ${field.fieldPath}`,
            explanation: piiClass.justification,
            sqlComment: `-- DataHub Policy: ${piiClass.recommendedAction} ${field.fieldPath} (${piiClass.infoTypes[0].type})`,
            sqlSnippet: this.getDataHubMaskingSQL(piiClass, field),
            removable: false, // Policy-driven, cannot remove
            source: 'DataHub Policy'
          });
        }
      }
    }
    
    // 2. Apply quality filters based on DataHub data profiles
    if (context.datasetProfile) {
      for (const fieldProfile of context.datasetProfile.fieldProfiles) {
        if (fieldProfile.nullProportion && fieldProfile.nullProportion > 0.1) {
          const field = context.schemaMetadata?.fields.find(
            f => f.fieldPath === fieldProfile.fieldPath
          );
          
          if (field && !field.nullable) {
            enhancements.push({
              id: `quality-${field.fieldPath}`,
              type: 'quality',
              title: `Filter null ${field.fieldPath}`,
              explanation: `DataHub Profile shows ${Math.round(fieldProfile.nullProportion * 100)}% null values in non-nullable field`,
              sqlComment: `-- DataHub Quality: Filtering ${Math.round(fieldProfile.nullProportion * 100)}% null ${field.fieldPath}`,
              sqlSnippet: `${field.fieldPath} IS NOT NULL`,
              removable: true,
              source: 'DataHub Profile'
            });
          }
        }
      }
    }
    
    // 3. Add intent-specific enhancements using DataHub glossary and metadata
    switch (intent.type) {
      case 'churn_analysis':
        // Find recency field using DataHub glossary terms
        const recencyField = this.findFieldByGlossaryTerm(
          context,
          ['urn:li:glossaryTerm:last_activity', 'urn:li:glossaryTerm:recency']
        );
        
        if (recencyField) {
          enhancements.push({
            id: 'metric-churn',
            type: 'metric',
            title: 'Added churn indicator',
            explanation: `Using ${recencyField.fieldPath} from DataHub glossary (${recencyField.glossaryTerms?.join(', ')})`,
            sqlComment: `-- DataHub Glossary: Churn indicator using ${recencyField.fieldPath}`,
            sqlSnippet: `DATEDIFF('day', ${recencyField.fieldPath}, CURRENT_DATE) as days_inactive`,
            removable: true,
            source: 'DataHub Glossary'
          });
          
          // Add time window filter
          enhancements.push({
            id: 'filter-churn-window',
            type: 'filter',
            title: 'Applied churn analysis window',
            explanation: `Standard 180-day window for churn analysis on ${recencyField.fieldPath}`,
            sqlComment: `-- Intent-based: 180-day churn analysis window`,
            sqlSnippet: `${recencyField.fieldPath} >= DATEADD('day', -180, CURRENT_DATE)`,
            removable: true,
            source: 'Intent Analysis'
          });
        }
        break;
        
      case 'revenue_analysis':
        // Find revenue fields using DataHub glossary
        const revenueField = this.findFieldByGlossaryTerm(
          context,
          ['urn:li:glossaryTerm:revenue', 'urn:li:glossaryTerm:monetary']
        );
        
        const orderField = this.findFieldByGlossaryTerm(
          context,
          ['urn:li:glossaryTerm:order_identifier', 'urn:li:glossaryTerm:transaction_id']
        );
        
        if (revenueField) {
          enhancements.push({
            id: 'metric-revenue',
            type: 'metric',
            title: 'Added revenue metrics',
            explanation: `Aggregating ${revenueField.fieldPath} from DataHub glossary`,
            sqlComment: `-- DataHub Glossary: Revenue aggregation on ${revenueField.fieldPath}`,
            sqlSnippet: `SUM(${revenueField.fieldPath}) as total_revenue${orderField ? `, COUNT(DISTINCT ${orderField.fieldPath}) as order_count` : ''}`,
            removable: true,
            source: 'DataHub Glossary'
          });
        }
        break;
    }
    
    // 4. Add business glossary calculations if relevant
    if (context.glossaryTerms) {
      const relevantTerms = this.findRelevantGlossaryTerms(intent, context.glossaryTerms);
      
      for (const term of relevantTerms) {
        if (term.calculation) {
          enhancements.push({
            id: `glossary-${term.urn}`,
            type: 'metric',
            title: `Added ${term.name}`,
            explanation: term.definition,
            sqlComment: `-- DataHub Glossary Term: ${term.name} (${term.urn})`,
            sqlSnippet: `${term.calculation} as ${term.name.toLowerCase().replace(/\s+/g, '_')}`,
            removable: true,
            source: 'DataHub Glossary'
          });
        }
      }
    }
    
    // 5. Add test account filter if detected in metadata
    const accountTypeField = context.schemaMetadata?.fields.find(
      f => f.fieldPath === 'account_type' || f.description?.toLowerCase().includes('test')
    );
    
    if (accountTypeField) {
      enhancements.push({
        id: 'filter-test-accounts',
        type: 'filter',
        title: 'Exclude test accounts',
        explanation: `Filtering out test accounts based on ${accountTypeField.fieldPath}`,
        sqlComment: `-- DataHub: Exclude test accounts`,
        sqlSnippet: `${accountTypeField.fieldPath} != 'test'`,
        removable: true,
        source: 'DataHub Profile'
      });
    }
    
    return enhancements;
  }
  
  /**
   * Get clarification questions based on intent and available fields
   */
  getClarificationsForIntent(intent: QueryIntent, query: string, context?: DataHubContext): QueryClarification[] {
    const clarifications: QueryClarification[] = [];
    
    // Time range clarification using actual date fields from schema
    if (!query.toLowerCase().match(/\d+\s*(day|week|month|year)/)) {
      const dateField = context?.schemaMetadata?.fields.find(
        f => f.type === 'DATE' || f.nativeDataType?.includes('DATE')
      );
      
      if (dateField) {
        clarifications.push({
          id: 'time-range',
          question: 'What time period?',
          type: 'time_range',
          options: [
            { label: 'Last 30 days', value: 30, sqlTransformation: `WHERE ${dateField.fieldPath} >= DATEADD('day', -30, CURRENT_DATE)` },
            { label: 'Last 90 days', value: 90, sqlTransformation: `WHERE ${dateField.fieldPath} >= DATEADD('day', -90, CURRENT_DATE)` },
            { label: 'Last year', value: 365, sqlTransformation: `WHERE ${dateField.fieldPath} >= DATEADD('year', -1, CURRENT_DATE)` },
            { label: 'All time', value: null, sqlTransformation: '' }
          ]
        });
      }
    }
    
    // Aggregation clarification for revenue analysis
    if (intent.type === 'revenue_analysis' && context) {
      // Find categorical fields for grouping
      const categoricalFields = context.schemaMetadata?.fields.filter(
        f => f.type === 'STRING' && 
             !f.tags?.includes('urn:li:tag:pii') &&
             (f.glossaryTerms?.includes('urn:li:glossaryTerm:product') ||
              f.glossaryTerms?.includes('urn:li:glossaryTerm:category') ||
              f.fieldPath.includes('category') ||
              f.fieldPath.includes('product'))
      ) || [];
      
      if (categoricalFields.length > 0) {
        clarifications.push({
          id: 'aggregation',
          question: 'Group results by?',
          type: 'grouping',
          options: [
            ...categoricalFields.map(f => ({
              label: f.description || f.fieldPath,
              value: f.fieldPath,
              sqlTransformation: `GROUP BY ${f.fieldPath}`
            })),
            { label: 'No grouping', value: null, sqlTransformation: '' }
          ]
        });
      }
    }
    
    // Customer filter for churn analysis
    if (intent.type === 'churn_analysis' && context) {
      const statusField = context.schemaMetadata?.fields.find(
        f => f.fieldPath.includes('status') || f.fieldPath.includes('active')
      );
      
      if (statusField) {
        clarifications.push({
          id: 'customer-status',
          question: 'Include which customers?',
          type: 'filter',
          options: [
            { label: 'Active only', value: 'active', sqlTransformation: `AND ${statusField.fieldPath} = 'active'` },
            { label: 'All customers', value: 'all', sqlTransformation: '' }
          ]
        });
      }
    }
    
    return clarifications;
  }
  
  /**
   * Apply an enhancement to SQL with DataHub context
   */
  applyEnhancement(sql: string, enhancement: AppliedEnhancement): string {
    let enhancedSQL = sql;
    
    if (enhancement.sqlComment && enhancement.sqlSnippet) {
      switch (enhancement.type) {
        case 'privacy':
        case 'metric':
          // Add in SELECT clause
          enhancedSQL = this.addToSelectClause(enhancedSQL, enhancement);
          break;
          
        case 'filter':
        case 'quality':
          // Add in WHERE clause
          enhancedSQL = this.addToWhereClause(enhancedSQL, enhancement);
          break;
          
        case 'governance':
          // Add at the beginning
          enhancedSQL = `${enhancement.sqlComment}\n${enhancedSQL}`;
          break;
      }
    }
    
    return enhancedSQL;
  }
  
  /**
   * Remove an enhancement from SQL
   */
  removeEnhancement(sql: string, enhancement: AppliedEnhancement): string {
    if (enhancement.sqlComment) {
      sql = sql.replace(new RegExp(`\\s*${this.escapeRegex(enhancement.sqlComment)}`, 'g'), '');
    }
    if (enhancement.sqlSnippet) {
      sql = sql.replace(new RegExp(`[,\\s]*${this.escapeRegex(enhancement.sqlSnippet)}`, 'g'), '');
    }
    
    // Clean up
    sql = sql.replace(/,\s*,/g, ',').replace(/,\s*\n\s*FROM/g, '\nFROM');
    
    return sql;
  }
  
  /**
   * Apply a clarification answer to SQL
   */
  applyClarification(sql: string, clarification: QueryClarification, answer: any): string {
    if (answer.sqlTransformation) {
      const comment = `-- User selection: ${clarification.question} = ${answer.label}`;
      
      switch (clarification.type) {
        case 'time_range':
        case 'filter':
          if (sql.toLowerCase().includes('where')) {
            sql = sql.replace(/WHERE/i, `WHERE\n  ${comment}\n  ${answer.sqlTransformation.replace('WHERE ', '')} AND`);
          } else {
            const fromMatch = sql.match(/FROM\s+[\w.]+/i);
            if (fromMatch) {
              const insertPoint = fromMatch.index! + fromMatch[0].length;
              sql = sql.slice(0, insertPoint) + `\n${comment}\n${answer.sqlTransformation}` + sql.slice(insertPoint);
            }
          }
          break;
          
        case 'grouping':
        case 'aggregation':
          if (answer.sqlTransformation) {
            sql += `\n${comment}\n${answer.sqlTransformation}`;
          }
          break;
      }
    }
    
    return sql;
  }
  
  // Helper methods
  
  /**
   * Find field by glossary term URN
   */
  private findFieldByGlossaryTerm(
    context: DataHubContext,
    termUrns: string[]
  ): SchemaField | undefined {
    return context.schemaMetadata?.fields.find(field =>
      field.glossaryTerms?.some(term => termUrns.includes(term))
    );
  }
  
  /**
   * Find relevant glossary terms based on intent
   */
  private findRelevantGlossaryTerms(intent: QueryIntent, terms: any[]): any[] {
    return terms.filter(term => {
      const termNameLower = term.name.toLowerCase();
      
      // Match based on intent keywords
      if (intent.keywords.some(keyword => termNameLower.includes(keyword))) {
        return true;
      }
      
      // Match specific patterns for intent types
      switch (intent.type) {
        case 'churn_analysis':
          return termNameLower.includes('churn') || 
                 termNameLower.includes('retention') ||
                 termNameLower.includes('lifetime');
                 
        case 'revenue_analysis':
          return termNameLower.includes('revenue') ||
                 termNameLower.includes('sales') ||
                 termNameLower.includes('value');
                 
        case 'customer_segmentation':
          return termNameLower.includes('segment') ||
                 termNameLower.includes('tier') ||
                 termNameLower.includes('cohort');
                 
        default:
          return false;
      }
    }).slice(0, 2); // Limit to 2 most relevant terms
  }
  
  /**
   * Generate DataHub-compliant masking SQL
   */
  private getDataHubMaskingSQL(piiClass: any, field: SchemaField): string {
    const infoType = piiClass.infoTypes[0].type;
    const action = piiClass.recommendedAction;
    
    // Use DataHub's recommended action
    switch (action) {
      case 'MASK':
        return this.getMaskExpression(infoType, field.fieldPath);
      case 'REDACT':
        return `'***REDACTED***' AS ${field.fieldPath}`;
      case 'TOKENIZE':
        return `HASH(${field.fieldPath}) AS ${field.fieldPath}`;
      case 'ENCRYPT':
        return `ENCRYPT(${field.fieldPath}) AS ${field.fieldPath}`;
      default:
        return this.getMaskExpression(infoType, field.fieldPath);
    }
  }
  
  private getMaskExpression(infoType: string, fieldPath: string): string {
    switch (infoType) {
      case 'EMAIL':
        return `CASE 
    WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${fieldPath}
    ELSE CONCAT(LEFT(${fieldPath}, 2), '***@***.com')
  END`;
        
      case 'PHONE':
        return `CASE 
    WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${fieldPath}
    ELSE CONCAT('***-***-', RIGHT(${fieldPath}, 4))
  END`;
        
      case 'NAME':
        return `CASE 
    WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${fieldPath}
    ELSE CONCAT(LEFT(${fieldPath}, 1), '***')
  END`;
        
      default:
        return `MASKED(${fieldPath})`;
    }
  }
  
  private addToSelectClause(sql: string, enhancement: AppliedEnhancement): string {
    const selectMatch = sql.match(/(SELECT\s+)([\s\S]*?)(\s+FROM)/i);
    if (selectMatch) {
      const currentSelect = selectMatch[2];
      const newSelect = `${currentSelect},\n  ${enhancement.sqlComment}\n  ${enhancement.sqlSnippet}`;
      return sql.replace(selectMatch[0], `${selectMatch[1]}${newSelect}${selectMatch[3]}`);
    }
    return sql;
  }
  
  private addToWhereClause(sql: string, enhancement: AppliedEnhancement): string {
    if (sql.toLowerCase().includes('where')) {
      return sql.replace(/WHERE/i, `WHERE\n  ${enhancement.sqlComment}\n  ${enhancement.sqlSnippet} AND`);
    } else {
      const fromMatch = sql.match(/FROM\s+[\w.]+/i);
      if (fromMatch) {
        const insertPoint = fromMatch.index! + fromMatch[0].length;
        return sql.slice(0, insertPoint) + 
               `\nWHERE\n  ${enhancement.sqlComment}\n  ${enhancement.sqlSnippet}` + 
               sql.slice(insertPoint);
      }
    }
    return sql;
  }
  
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export singleton instance
export const intentAnalyzer = new IntentAnalysisService();