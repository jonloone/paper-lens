/**
 * EnhancementDetectionService
 * 
 * Detects enhancement opportunities without making assumptions.
 * Presents options, not requirements.
 */

import type { DataHubContext } from './DataHubContextService';

export interface Enhancement {
  id: string;
  type: 'privacy' | 'quality' | 'performance' | 'enrichment' | 'governance';
  label: string;
  description?: string;
  impact?: string;
  confidence?: number;
  optional: boolean;
  sqlTransformation?: string;
  params?: Record<string, any>;
}

export interface SQLDiff {
  original: string;
  enhanced: string;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'remove' | 'modify';
  line?: number;
  content: string;
}

export class EnhancementDetectionService {
  /**
   * Detect enhancement opportunities based on SQL and metadata
   * Never assume something is a problem - phrase as opportunities
   */
  detectEnhancements(sql: string, context: DataHubContext): Enhancement[] {
    const enhancements: Enhancement[] = [];
    const sqlLower = sql.toLowerCase();
    
    // Privacy enhancements - optional, not forced
    if (context.piiFields && context.piiFields.length > 0) {
      const mentionedFields = context.piiFields.filter(field => 
        sqlLower.includes(field.toLowerCase())
      );
      
      if (mentionedFields.length > 0) {
        enhancements.push({
          id: 'privacy-masking',
          type: 'privacy',
          label: 'Add privacy protection?',
          description: `${mentionedFields.length} sensitive field${mentionedFields.length > 1 ? 's' : ''} detected`,
          impact: `Would mask ${mentionedFields.join(', ')} for non-authorized users`,
          confidence: 0.85,
          optional: true,
          sqlTransformation: this.generatePrivacySQL(mentionedFields)
        });
      }
    }
    
    // Quality enhancements - suggestions, not requirements
    if (context.nullCount && context.nullCount > 0.1) {
      enhancements.push({
        id: 'quality-nulls',
        type: 'quality',
        label: `Handle ${Math.round(context.nullCount * 100)}% nulls?`,
        description: 'Optional null handling',
        impact: 'Would filter out records with null values in key fields',
        confidence: 0.7,
        optional: true,
        sqlTransformation: 'WHERE key_field IS NOT NULL'
      });
    }
    
    // Performance enhancements
    if (sqlLower.includes('select *')) {
      enhancements.push({
        id: 'performance-columns',
        type: 'performance',
        label: 'Optimize column selection?',
        description: 'Select specific columns instead of *',
        impact: 'Reduces data transfer and improves query performance',
        confidence: 0.9,
        optional: true
      });
    }
    
    if (!sqlLower.includes('limit') && !sqlLower.includes('top')) {
      enhancements.push({
        id: 'performance-limit',
        type: 'performance',
        label: 'Add result limit?',
        description: 'Prevent unbounded queries',
        impact: 'Limits results to 1000 rows for safety',
        confidence: 0.6,
        optional: true,
        sqlTransformation: 'LIMIT 1000'
      });
    }
    
    // Business enrichments from glossary
    if (context.glossaryTerms && context.glossaryTerms.length > 0) {
      const relevantTerms = context.glossaryTerms.filter(term => {
        // Check if the query context matches the glossary term
        const termKeywords = term.name.toLowerCase().split(/\s+/);
        return termKeywords.some(keyword => sqlLower.includes(keyword));
      });
      
      relevantTerms.slice(0, 3).forEach(term => {
        if (term.calculation) {
          enhancements.push({
            id: `enrichment-${term.name.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'enrichment',
            label: `Add ${term.name}?`,
            description: term.description,
            impact: `Adds business calculation: ${term.name}`,
            confidence: 0.75,
            optional: true,
            sqlTransformation: `${term.calculation} AS ${term.name.toLowerCase().replace(/\s+/g, '_')}`
          });
        }
      });
    }
    
    // Governance suggestions
    if (!sqlLower.includes('-- purpose:') && !sqlLower.includes('-- owner:')) {
      enhancements.push({
        id: 'governance-metadata',
        type: 'governance',
        label: 'Add governance metadata?',
        description: 'Document query purpose and ownership',
        impact: 'Improves query tracking and compliance',
        confidence: 0.5,
        optional: true,
        sqlTransformation: `-- Purpose: [Describe query purpose]\n-- Owner: ${context.owner || '[Your team]'}\n-- Created: ${new Date().toISOString().split('T')[0]}\n`
      });
    }
    
    return enhancements;
  }
  
  /**
   * Apply an enhancement to SQL
   */
  applyEnhancement(sql: string, enhancement: Enhancement): string {
    switch (enhancement.type) {
      case 'privacy':
        return this.applyPrivacyEnhancement(sql, enhancement);
      
      case 'quality':
        return this.applyQualityEnhancement(sql, enhancement);
      
      case 'performance':
        return this.applyPerformanceEnhancement(sql, enhancement);
      
      case 'enrichment':
        return this.applyEnrichmentEnhancement(sql, enhancement);
      
      case 'governance':
        return this.applyGovernanceEnhancement(sql, enhancement);
      
      default:
        return sql;
    }
  }
  
  /**
   * Apply privacy enhancements
   */
  private applyPrivacyEnhancement(sql: string, enhancement: Enhancement): string {
    if (!enhancement.params?.fields) return sql;
    
    const fields = enhancement.params.fields as string[];
    let enhancedSQL = sql;
    
    // Replace field references with masked versions
    fields.forEach(field => {
      const pattern = new RegExp(`\\b${field}\\b`, 'gi');
      const maskedField = this.getMaskedFieldExpression(field);
      
      // Only replace in SELECT clause
      const selectMatch = enhancedSQL.match(/(SELECT\s+)(.*?)(\s+FROM)/is);
      if (selectMatch) {
        const selectClause = selectMatch[2];
        const maskedSelect = selectClause.replace(pattern, maskedField);
        enhancedSQL = enhancedSQL.replace(selectMatch[0], `${selectMatch[1]}${maskedSelect}${selectMatch[3]}`);
      }
    });
    
    return enhancedSQL;
  }
  
  /**
   * Apply quality enhancements
   */
  private applyQualityEnhancement(sql: string, enhancement: Enhancement): string {
    if (enhancement.id === 'quality-nulls' && enhancement.sqlTransformation) {
      // Add WHERE clause or extend existing one
      if (sql.toLowerCase().includes('where')) {
        return sql.replace(/where/i, `WHERE ${enhancement.sqlTransformation} AND`);
      } else {
        // Find the right place to insert WHERE clause
        const fromMatch = sql.match(/from\s+\S+/i);
        if (fromMatch) {
          const insertPoint = fromMatch.index! + fromMatch[0].length;
          return sql.slice(0, insertPoint) + `\n${enhancement.sqlTransformation}` + sql.slice(insertPoint);
        }
      }
    }
    return sql;
  }
  
  /**
   * Apply performance enhancements
   */
  private applyPerformanceEnhancement(sql: string, enhancement: Enhancement): string {
    if (enhancement.id === 'performance-limit' && !sql.toLowerCase().includes('limit')) {
      return sql + '\nLIMIT 1000';
    }
    
    if (enhancement.id === 'performance-columns') {
      // This would need more complex logic to determine which columns to select
      // For now, just add a comment
      return `-- Consider selecting specific columns instead of *\n${sql}`;
    }
    
    return sql;
  }
  
  /**
   * Apply enrichment enhancements
   */
  private applyEnrichmentEnhancement(sql: string, enhancement: Enhancement): string {
    if (!enhancement.sqlTransformation) return sql;
    
    // Add calculation to SELECT clause
    const selectMatch = sql.match(/(SELECT\s+)(.*?)(\s+FROM)/is);
    if (selectMatch) {
      const selectClause = selectMatch[2];
      const enrichedSelect = `${selectClause},\n  ${enhancement.sqlTransformation}`;
      return sql.replace(selectMatch[0], `${selectMatch[1]}${enrichedSelect}${selectMatch[3]}`);
    }
    
    return sql;
  }
  
  /**
   * Apply governance enhancements
   */
  private applyGovernanceEnhancement(sql: string, enhancement: Enhancement): string {
    if (enhancement.sqlTransformation) {
      return enhancement.sqlTransformation + sql;
    }
    return sql;
  }
  
  /**
   * Generate privacy SQL for fields
   */
  private generatePrivacySQL(fields: string[]): string {
    return fields.map(field => 
      this.getMaskedFieldExpression(field)
    ).join(',\n  ');
  }
  
  /**
   * Get masked field expression based on field type
   */
  private getMaskedFieldExpression(field: string): string {
    const fieldLower = field.toLowerCase();
    
    if (fieldLower.includes('email')) {
      return `CASE WHEN current_user() IN ('admin', 'data_team') THEN ${field} ELSE CONCAT(LEFT(${field}, 2), '***@***.com') END AS ${field}`;
    }
    
    if (fieldLower.includes('phone')) {
      return `CASE WHEN current_user() IN ('admin', 'data_team') THEN ${field} ELSE CONCAT('***-***-', RIGHT(${field}, 4)) END AS ${field}`;
    }
    
    if (fieldLower.includes('ssn') || fieldLower.includes('social')) {
      return `CASE WHEN current_user() IN ('admin', 'data_team') THEN ${field} ELSE '***-**-****' END AS ${field}`;
    }
    
    // Default masking
    return `CASE WHEN current_user() IN ('admin', 'data_team') THEN ${field} ELSE '***' END AS ${field}`;
  }
  
  /**
   * Generate diff between original and enhanced SQL
   */
  generateDiff(original: string, enhanced: string): SQLDiff {
    const changes: DiffChange[] = [];
    
    // Simple diff - in production would use proper diff algorithm
    const originalLines = original.split('\n');
    const enhancedLines = enhanced.split('\n');
    
    // Find additions
    enhancedLines.forEach((line, idx) => {
      if (!originalLines.includes(line)) {
        changes.push({
          type: 'add',
          line: idx + 1,
          content: line
        });
      }
    });
    
    // Find removals
    originalLines.forEach((line, idx) => {
      if (!enhancedLines.includes(line)) {
        changes.push({
          type: 'remove',
          line: idx + 1,
          content: line
        });
      }
    });
    
    return {
      original,
      enhanced,
      changes
    };
  }
  
  /**
   * Validate enhancement compatibility
   */
  canApplyEnhancement(sql: string, enhancement: Enhancement): boolean {
    // Check if enhancement is compatible with current SQL
    switch (enhancement.type) {
      case 'privacy':
        // Can apply if fields exist in SELECT
        return true;
      
      case 'quality':
        // Can apply if no conflicting WHERE clause
        return !sql.toLowerCase().includes(enhancement.sqlTransformation?.toLowerCase() || '');
      
      case 'performance':
        // Can apply if not already optimized
        return enhancement.id === 'performance-limit' ? !sql.toLowerCase().includes('limit') : true;
      
      case 'enrichment':
        // Can apply if not already present
        return !sql.includes(enhancement.sqlTransformation || '');
      
      case 'governance':
        // Always can apply
        return true;
      
      default:
        return true;
    }
  }
}

// Export singleton instance
export const enhancementDetector = new EnhancementDetectionService();