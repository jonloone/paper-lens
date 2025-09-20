/**
 * Automatic Governance Service
 * 
 * Applies governance rules automatically without user input.
 * All rules are non-removable and applied transparently.
 */

interface GovernanceRule {
  type: 'pii_masking' | 'row_level_security' | 'retention' | 'quality';
  applied: boolean;
  transformation: string;
}

interface PIIField {
  column: string;
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'name' | 'address';
  maskingStrategy: 'hash' | 'partial' | 'redact';
}

export class AutomaticGovernanceService {
  /**
   * Apply all governance rules to a SQL query automatically
   */
  applyGovernance(sql: string, userContext: { role: string; department?: string }): {
    transformedSQL: string;
    rulesApplied: GovernanceRule[];
    warnings: string[];
  } {
    const rulesApplied: GovernanceRule[] = [];
    const warnings: string[] = [];
    let transformedSQL = sql;
    
    // 1. PII Masking (Always Applied)
    const piiResult = this.applyPIIMasking(transformedSQL, userContext);
    transformedSQL = piiResult.sql;
    if (piiResult.applied) {
      rulesApplied.push({
        type: 'pii_masking',
        applied: true,
        transformation: piiResult.transformation
      });
    }
    
    // 2. Row-Level Security (Always Applied)
    const rlsResult = this.applyRowLevelSecurity(transformedSQL, userContext);
    transformedSQL = rlsResult.sql;
    if (rlsResult.applied) {
      rulesApplied.push({
        type: 'row_level_security',
        applied: true,
        transformation: rlsResult.transformation
      });
    }
    
    // 3. Data Retention Policies (Always Applied)
    const retentionResult = this.applyRetentionPolicies(transformedSQL);
    transformedSQL = retentionResult.sql;
    if (retentionResult.applied) {
      rulesApplied.push({
        type: 'retention',
        applied: true,
        transformation: retentionResult.transformation
      });
      warnings.push('Data older than 7 years automatically excluded');
    }
    
    // 4. Quality Filters (Always Applied)
    const qualityResult = this.applyQualityFilters(transformedSQL);
    transformedSQL = qualityResult.sql;
    if (qualityResult.applied) {
      rulesApplied.push({
        type: 'quality',
        applied: true,
        transformation: qualityResult.transformation
      });
    }
    
    return {
      transformedSQL,
      rulesApplied,
      warnings
    };
  }
  
  /**
   * Detect and mask PII fields automatically
   */
  private applyPIIMasking(sql: string, userContext: { role: string }): {
    sql: string;
    applied: boolean;
    transformation: string;
  } {
    // Admin users see unmasked data
    if (userContext.role === 'admin') {
      return { sql, applied: false, transformation: '' };
    }
    
    const piiFields = this.detectPIIFields(sql);
    if (piiFields.length === 0) {
      return { sql, applied: false, transformation: '' };
    }
    
    let maskedSQL = sql;
    const transformations: string[] = [];
    
    piiFields.forEach(field => {
      const maskingExpression = this.getMaskingExpression(field);
      // Replace field with masked version in SELECT clause
      const regex = new RegExp(`\\b${field.column}\\b`, 'gi');
      maskedSQL = maskedSQL.replace(regex, maskingExpression);
      transformations.push(`${field.column} → ${maskingExpression}`);
    });
    
    return {
      sql: maskedSQL,
      applied: true,
      transformation: transformations.join(', ')
    };
  }
  
  /**
   * Apply row-level security based on user context
   */
  private applyRowLevelSecurity(sql: string, userContext: { department?: string }): {
    sql: string;
    applied: boolean;
    transformation: string;
  } {
    if (!userContext.department) {
      return { sql, applied: false, transformation: '' };
    }
    
    // Add department filter to WHERE clause
    const upperSQL = sql.toUpperCase();
    const whereIndex = upperSQL.lastIndexOf('WHERE');
    const groupByIndex = upperSQL.indexOf('GROUP BY');
    const orderByIndex = upperSQL.indexOf('ORDER BY');
    
    let insertPosition = sql.length;
    if (orderByIndex > -1) insertPosition = orderByIndex;
    else if (groupByIndex > -1) insertPosition = groupByIndex;
    
    const departmentFilter = `department = '${userContext.department}'`;
    
    let transformedSQL: string;
    if (whereIndex > -1) {
      // Add to existing WHERE clause
      const beforeWhere = sql.substring(0, whereIndex + 5);
      const afterWhere = sql.substring(whereIndex + 5, insertPosition);
      const afterClause = sql.substring(insertPosition);
      transformedSQL = `${beforeWhere} ${departmentFilter} AND ${afterWhere}${afterClause}`;
    } else {
      // Add new WHERE clause
      const beforeInsert = sql.substring(0, insertPosition);
      const afterInsert = sql.substring(insertPosition);
      transformedSQL = `${beforeInsert} WHERE ${departmentFilter} ${afterInsert}`;
    }
    
    return {
      sql: transformedSQL,
      applied: true,
      transformation: `Added filter: ${departmentFilter}`
    };
  }
  
  /**
   * Apply data retention policies
   */
  private applyRetentionPolicies(sql: string): {
    sql: string;
    applied: boolean;
    transformation: string;
  } {
    // Check if query has date fields
    const dateFields = ['created_at', 'updated_at', 'order_date', 'transaction_date'];
    const hasDateField = dateFields.some(field => 
      sql.toLowerCase().includes(field)
    );
    
    if (!hasDateField) {
      return { sql, applied: false, transformation: '' };
    }
    
    // Add 7-year retention filter
    const retentionFilter = `created_at >= CURRENT_DATE - INTERVAL '7' YEAR`;
    
    const upperSQL = sql.toUpperCase();
    const whereIndex = upperSQL.lastIndexOf('WHERE');
    
    let transformedSQL: string;
    if (whereIndex > -1) {
      // Add to existing WHERE clause
      const beforeWhere = sql.substring(0, whereIndex + 5);
      const afterWhere = sql.substring(whereIndex + 5);
      transformedSQL = `${beforeWhere} ${retentionFilter} AND ${afterWhere}`;
    } else {
      // Add new WHERE clause before GROUP BY/ORDER BY
      const groupByIndex = upperSQL.indexOf('GROUP BY');
      const orderByIndex = upperSQL.indexOf('ORDER BY');
      
      let insertPosition = sql.length;
      if (orderByIndex > -1) insertPosition = orderByIndex;
      else if (groupByIndex > -1) insertPosition = groupByIndex;
      
      const beforeInsert = sql.substring(0, insertPosition);
      const afterInsert = sql.substring(insertPosition);
      transformedSQL = `${beforeInsert} WHERE ${retentionFilter} ${afterInsert}`;
    }
    
    return {
      sql: transformedSQL,
      applied: true,
      transformation: '7-year retention policy'
    };
  }
  
  /**
   * Apply automatic quality filters
   */
  private applyQualityFilters(sql: string): {
    sql: string;
    applied: boolean;
    transformation: string;
  } {
    // Exclude test data automatically
    const testExclusion = `(customer_id NOT LIKE 'test%' AND customer_id NOT LIKE 'demo%')`;
    
    const upperSQL = sql.toUpperCase();
    const whereIndex = upperSQL.lastIndexOf('WHERE');
    
    let transformedSQL: string;
    if (whereIndex > -1) {
      // Add to existing WHERE clause
      const beforeWhere = sql.substring(0, whereIndex + 5);
      const afterWhere = sql.substring(whereIndex + 5);
      transformedSQL = `${beforeWhere} ${testExclusion} AND ${afterWhere}`;
    } else {
      // Check if we should add filter (only for tables that might have test data)
      if (!sql.toLowerCase().includes('customer') && !sql.toLowerCase().includes('user')) {
        return { sql, applied: false, transformation: '' };
      }
      
      const groupByIndex = upperSQL.indexOf('GROUP BY');
      const orderByIndex = upperSQL.indexOf('ORDER BY');
      
      let insertPosition = sql.length;
      if (orderByIndex > -1) insertPosition = orderByIndex;
      else if (groupByIndex > -1) insertPosition = groupByIndex;
      
      const beforeInsert = sql.substring(0, insertPosition);
      const afterInsert = sql.substring(insertPosition);
      transformedSQL = `${beforeInsert} WHERE ${testExclusion} ${afterInsert}`;
    }
    
    return {
      sql: transformedSQL,
      applied: true,
      transformation: 'Test data excluded'
    };
  }
  
  /**
   * Detect PII fields in SQL query
   */
  private detectPIIFields(sql: string): PIIField[] {
    const piiPatterns: Array<{ pattern: RegExp; type: PIIField['type'] }> = [
      { pattern: /\bemail\b/gi, type: 'email' },
      { pattern: /\bphone(_number)?\b/gi, type: 'phone' },
      { pattern: /\bssn\b/gi, type: 'ssn' },
      { pattern: /\bcredit_card(_number)?\b/gi, type: 'credit_card' },
      { pattern: /\b(first_name|last_name|full_name)\b/gi, type: 'name' },
      { pattern: /\b(address|street|city|zip(_code)?)\b/gi, type: 'address' }
    ];
    
    const detectedFields: PIIField[] = [];
    
    piiPatterns.forEach(({ pattern, type }) => {
      const matches = sql.match(pattern);
      if (matches) {
        matches.forEach(match => {
          detectedFields.push({
            column: match,
            type,
            maskingStrategy: this.getMaskingStrategy(type)
          });
        });
      }
    });
    
    return detectedFields;
  }
  
  /**
   * Get masking strategy for PII type
   */
  private getMaskingStrategy(type: PIIField['type']): PIIField['maskingStrategy'] {
    switch (type) {
      case 'email':
      case 'ssn':
      case 'credit_card':
        return 'hash';
      case 'phone':
      case 'name':
        return 'partial';
      case 'address':
        return 'redact';
      default:
        return 'redact';
    }
  }
  
  /**
   * Get SQL expression for masking
   */
  private getMaskingExpression(field: PIIField): string {
    switch (field.maskingStrategy) {
      case 'hash':
        return `MD5(${field.column}) as ${field.column}`;
      case 'partial':
        return `CONCAT(SUBSTR(${field.column}, 1, 3), '***') as ${field.column}`;
      case 'redact':
        return `'[REDACTED]' as ${field.column}`;
      default:
        return `'[MASKED]' as ${field.column}`;
    }
  }
  
  /**
   * Validate governance compliance
   */
  validateCompliance(sql: string): {
    compliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    
    // Check for SELECT *
    if (sql.includes('SELECT *')) {
      violations.push('SELECT * not allowed - specify columns explicitly');
    }
    
    // Check for missing WHERE clause in DELETE/UPDATE
    const upperSQL = sql.toUpperCase();
    if ((upperSQL.includes('DELETE') || upperSQL.includes('UPDATE')) && 
        !upperSQL.includes('WHERE')) {
      violations.push('DELETE/UPDATE requires WHERE clause');
    }
    
    // Check for TRUNCATE (not allowed)
    if (upperSQL.includes('TRUNCATE')) {
      violations.push('TRUNCATE not allowed - use DELETE with WHERE');
    }
    
    return {
      compliant: violations.length === 0,
      violations
    };
  }
}

// Export singleton instance
export const governanceService = new AutomaticGovernanceService();