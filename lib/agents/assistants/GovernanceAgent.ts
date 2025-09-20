import { BaseAgent } from '../BaseAgent';
import { AgentCapability, AgentTask } from '../types';

interface GovernanceAddition {
  type: 'pii_masking' | 'audit_column' | 'access_control' | 'retention_policy' | 'encryption';
  title: string;
  description: string;
  implementation: string;
  complianceStandard?: string;
  required: boolean;
}

interface ComplianceAnalysis {
  issues: ComplianceIssue[];
  additions: GovernanceAddition[];
  riskScore: number;
  complianceScore: number;
  remediationEffort: 'low' | 'medium' | 'high';
}

interface ComplianceIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  regulation?: string;
}

interface GovernanceContext {
  code: string;
  dataType?: 'sql' | 'pipeline' | 'api';
  tables?: string[];
  columns?: string[];
  regulations?: string[]; // GDPR, CCPA, HIPAA, etc.
}

/**
 * GovernanceAgent - Adds the required compliance stuff engineers always forget
 * Handles PII masking, audit trails, access controls, and regulatory compliance
 */
export class GovernanceAgent extends BaseAgent {
  private piiPatterns = [
    'email', 'phone', 'ssn', 'social_security',
    'credit_card', 'card_number', 'cvv',
    'passport', 'driver_license', 'license_number',
    'date_of_birth', 'dob', 'birthdate',
    'address', 'street', 'zip', 'postal',
    'salary', 'income', 'wage',
    'medical', 'diagnosis', 'prescription',
    'ip_address', 'device_id', 'cookie_id'
  ];

  constructor() {
    super(
      'governance',
      'Governance Assistant',
      'Automatically adds compliance requirements, PII masking, and audit controls'
    );
  }

  protected defineCapabilities(): AgentCapability[] {
    return [
      {
        name: 'add_pii_masking',
        description: 'Add PII masking to queries and pipelines',
        requiredContext: ['code', 'columns']
      },
      {
        name: 'add_audit_trails',
        description: 'Add audit columns and tracking',
        requiredContext: ['code']
      },
      {
        name: 'add_access_controls',
        description: 'Implement row-level and column-level security',
        requiredContext: ['code', 'userRoles']
      },
      {
        name: 'check_compliance',
        description: 'Check for regulatory compliance issues',
        requiredContext: ['code', 'regulations']
      }
    ];
  }

  protected async executeTask(task: AgentTask): Promise<ComplianceAnalysis> {
    const context = task.input as GovernanceContext;
    
    // Analyze compliance requirements
    const analysis = await this.analyzeCompliance(context);
    
    // Add insights
    if (analysis.issues.length > 0 || analysis.additions.length > 0) {
      this.insights.push({
        id: `insight-governance-${Date.now()}`,
        agent: this.role,
        type: analysis.riskScore > 7 ? 'warning' : 'recommendation',
        title: `${analysis.issues.length} compliance issues found`,
        description: `Need to add ${analysis.additions.length} governance controls. Compliance score: ${analysis.complianceScore}/100`,
        confidence: 0.9,
        actions: [{
          label: 'Add Governance Controls',
          action: 'apply_governance',
          params: { additions: analysis.additions },
          impact: 'high'
        }]
      });
    }
    
    return analysis;
  }

  /**
   * Comprehensive compliance analysis
   */
  private async analyzeCompliance(context: GovernanceContext): Promise<ComplianceAnalysis> {
    const issues: ComplianceIssue[] = [];
    const additions: GovernanceAddition[] = [];
    
    // Check for PII exposure
    const piiFields = this.detectPIIFields(context);
    if (piiFields.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'pii_exposure',
        description: `Exposed PII fields: ${piiFields.join(', ')}`,
        regulation: 'GDPR, CCPA'
      });
      
      additions.push(this.generatePIIMasking(piiFields, context));
    }
    
    // Check for missing audit trails
    if (!this.hasAuditColumns(context.code)) {
      issues.push({
        severity: 'medium',
        type: 'missing_audit_trail',
        description: 'No audit columns for tracking changes',
        regulation: 'SOX, HIPAA'
      });
      
      additions.push(this.generateAuditColumns());
    }
    
    // Check for access controls
    if (this.needsAccessControl(context)) {
      issues.push({
        severity: 'high',
        type: 'missing_access_control',
        description: 'No row-level or column-level security implemented',
        regulation: 'HIPAA, PCI-DSS'
      });
      
      additions.push(this.generateAccessControls(context));
    }
    
    // Check for data retention
    if (this.needsRetentionPolicy(context)) {
      additions.push(this.generateRetentionPolicy(context));
    }
    
    // Check for encryption
    if (this.needsEncryption(context)) {
      additions.push(this.generateEncryption(context));
    }
    
    // Calculate scores
    const riskScore = this.calculateRiskScore(issues);
    const complianceScore = this.calculateComplianceScore(issues, additions);
    const remediationEffort = this.estimateRemediationEffort(additions);
    
    return {
      issues,
      additions,
      riskScore,
      complianceScore,
      remediationEffort
    };
  }

  /**
   * Detect PII fields in code
   */
  private detectPIIFields(context: GovernanceContext): string[] {
    const piiFields: string[] = [];
    const code = context.code.toLowerCase();
    
    // Check column names
    if (context.columns) {
      context.columns.forEach(column => {
        const colLower = column.toLowerCase();
        if (this.piiPatterns.some(pattern => colLower.includes(pattern))) {
          piiFields.push(column);
        }
      });
    }
    
    // Check SQL for PII patterns
    this.piiPatterns.forEach(pattern => {
      if (code.includes(pattern)) {
        piiFields.push(pattern);
      }
    });
    
    return [...new Set(piiFields)]; // Remove duplicates
  }

  /**
   * Generate PII masking implementation
   */
  private generatePIIMasking(piiFields: string[], context: GovernanceContext): GovernanceAddition {
    const maskingRules = piiFields.map(field => {
      if (field.includes('email')) {
        return `  CASE 
    WHEN current_user_role() IN ('admin', 'data_owner') THEN ${field}
    ELSE CONCAT(LEFT(${field}, 3), '****@****.***')
  END AS ${field}`;
      } else if (field.includes('phone')) {
        return `  CASE 
    WHEN current_user_role() IN ('admin', 'data_owner') THEN ${field}
    ELSE CONCAT('***-***-', RIGHT(${field}, 4))
  END AS ${field}`;
      } else if (field.includes('ssn') || field.includes('social')) {
        return `  CASE 
    WHEN current_user_role() IN ('admin', 'data_owner') THEN ${field}
    ELSE CONCAT('XXX-XX-', RIGHT(${field}, 4))
  END AS ${field}`;
      } else if (field.includes('credit_card') || field.includes('card_number')) {
        return `  CASE 
    WHEN current_user_role() IN ('admin', 'data_owner') THEN ${field}
    ELSE CONCAT('****-****-****-', RIGHT(${field}, 4))
  END AS ${field}`;
      } else {
        return `  CASE 
    WHEN current_user_role() IN ('admin', 'data_owner') THEN ${field}
    ELSE MD5(${field})  -- Hash for other PII
  END AS ${field}`;
      }
    }).join(',\n');
    
    return {
      type: 'pii_masking',
      title: 'Add PII Masking',
      description: `Mask ${piiFields.length} PII fields to comply with GDPR/CCPA`,
      implementation: `-- Replace PII fields with masked versions:
SELECT 
${maskingRules},
  -- Non-PII fields remain unchanged
  other_column1,
  other_column2
FROM your_table;

-- For dynamic masking, create a view:
CREATE OR REPLACE VIEW masked_customer_data AS
SELECT 
${maskingRules},
  -- Other columns
  customer_id,
  created_date
FROM customers;

-- Grant access to the view, not the base table:
REVOKE ALL ON customers FROM public;
GRANT SELECT ON masked_customer_data TO analyst_role;`,
      complianceStandard: 'GDPR, CCPA, HIPAA',
      required: true
    };
  }

  /**
   * Check if code has audit columns
   */
  private hasAuditColumns(code: string): boolean {
    const auditColumns = ['created_at', 'updated_at', 'created_by', 'updated_by', 'version'];
    const codeLower = code.toLowerCase();
    return auditColumns.some(col => codeLower.includes(col));
  }

  /**
   * Generate audit columns
   */
  private generateAuditColumns(): GovernanceAddition {
    return {
      type: 'audit_column',
      title: 'Add Audit Tracking',
      description: 'Add columns to track data lineage and modifications',
      implementation: `-- Add audit columns to your query/table:
SELECT 
  *,
  -- Audit columns
  CURRENT_TIMESTAMP AS processed_at,
  CURRENT_USER AS processed_by,
  '${new Date().toISOString().split('T')[0]}' AS processing_date,
  'pipeline_v1.2.3' AS pipeline_version,
  MD5(CAST(ROW(*) AS TEXT)) AS row_hash,  -- For change detection
  gen_random_uuid() AS audit_id
FROM source_table;

-- For tables, add audit columns:
ALTER TABLE your_table 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN created_by VARCHAR(100) DEFAULT CURRENT_USER,
ADD COLUMN updated_by VARCHAR(100) DEFAULT CURRENT_USER,
ADD COLUMN version INTEGER DEFAULT 1;

-- Add trigger for automatic update tracking:
CREATE OR REPLACE FUNCTION update_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = CURRENT_USER;
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_trigger
BEFORE UPDATE ON your_table
FOR EACH ROW EXECUTE FUNCTION update_audit_columns();`,
      complianceStandard: 'SOX, ISO 27001',
      required: false
    };
  }

  /**
   * Check if access control is needed
   */
  private needsAccessControl(context: GovernanceContext): boolean {
    const sensitivePatterns = ['salary', 'medical', 'diagnosis', 'ssn', 'credit'];
    const code = context.code.toLowerCase();
    return sensitivePatterns.some(pattern => code.includes(pattern));
  }

  /**
   * Generate access control implementation
   */
  private generateAccessControls(context: GovernanceContext): GovernanceAddition {
    return {
      type: 'access_control',
      title: 'Implement Access Controls',
      description: 'Add row-level and column-level security',
      implementation: `-- Row-Level Security (RLS)
-- 1. Enable RLS on table
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for different roles
-- Policy for data owners - see all
CREATE POLICY owner_all ON sensitive_data
  FOR ALL
  TO data_owner_role
  USING (true);

-- Policy for department users - see only their department
CREATE POLICY dept_isolation ON sensitive_data
  FOR SELECT
  TO analyst_role
  USING (department = current_setting('app.current_department'));

-- Policy for regional users - see only their region
CREATE POLICY region_isolation ON sensitive_data
  FOR SELECT
  TO regional_role
  USING (region IN (
    SELECT region FROM user_regions 
    WHERE user_id = current_user
  ));

-- Column-Level Security
-- Revoke access to sensitive columns
REVOKE ALL ON sensitive_data FROM public;

-- Grant selective column access
GRANT SELECT (
  customer_id,
  order_date,
  product_id
  -- Exclude: ssn, credit_card, salary
) ON sensitive_data TO analyst_role;

-- For dynamic column filtering, use a view:
CREATE VIEW filtered_data AS
SELECT 
  customer_id,
  order_date,
  CASE 
    WHEN pg_has_role(current_user, 'hr_role', 'MEMBER') 
    THEN salary 
    ELSE NULL 
  END AS salary,
  CASE 
    WHEN pg_has_role(current_user, 'medical_role', 'MEMBER') 
    THEN diagnosis 
    ELSE 'RESTRICTED' 
  END AS diagnosis
FROM sensitive_data;`,
      complianceStandard: 'HIPAA, PCI-DSS',
      required: true
    };
  }

  /**
   * Check if retention policy is needed
   */
  private needsRetentionPolicy(context: GovernanceContext): boolean {
    return context.regulations?.includes('GDPR') || 
           context.regulations?.includes('CCPA') ||
           context.code.toLowerCase().includes('delete');
  }

  /**
   * Generate retention policy
   */
  private generateRetentionPolicy(context: GovernanceContext): GovernanceAddition {
    return {
      type: 'retention_policy',
      title: 'Add Data Retention Policy',
      description: 'Implement automatic data deletion per regulations',
      implementation: `-- Data Retention Policy Implementation

-- 1. Add retention metadata
ALTER TABLE your_table 
ADD COLUMN retention_date DATE,
ADD COLUMN deletion_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN retention_policy VARCHAR(50);

-- 2. Set retention periods based on data type
UPDATE your_table
SET retention_date = CASE
  WHEN data_type = 'transactional' THEN created_date + INTERVAL '7 years'
  WHEN data_type = 'analytical' THEN created_date + INTERVAL '3 years'  
  WHEN data_type = 'temporary' THEN created_date + INTERVAL '90 days'
  ELSE created_date + INTERVAL '5 years'  -- Default
END,
retention_policy = CASE
  WHEN data_type = 'transactional' THEN 'REGULATORY_7Y'
  WHEN data_type = 'analytical' THEN 'BUSINESS_3Y'
  WHEN data_type = 'temporary' THEN 'TEMP_90D'
  ELSE 'DEFAULT_5Y'
END;

-- 3. Create deletion job
CREATE OR REPLACE FUNCTION delete_expired_data()
RETURNS void AS $$
BEGIN
  -- Log deletions for audit
  INSERT INTO deletion_log (table_name, record_count, deletion_date, policy)
  SELECT 
    'your_table',
    COUNT(*),
    CURRENT_DATE,
    retention_policy
  FROM your_table
  WHERE retention_date < CURRENT_DATE
  GROUP BY retention_policy;
  
  -- Perform deletion
  DELETE FROM your_table
  WHERE retention_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 4. Schedule daily cleanup
SELECT cron.schedule('delete-expired-data', '0 2 * * *', 
  'SELECT delete_expired_data()');

-- 5. GDPR Right to Erasure support
CREATE OR REPLACE FUNCTION request_deletion(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE your_table
  SET 
    deletion_requested = TRUE,
    retention_date = CURRENT_DATE  -- Mark for immediate deletion
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;`,
      complianceStandard: 'GDPR Article 17, CCPA',
      required: false
    };
  }

  /**
   * Check if encryption is needed
   */
  private needsEncryption(context: GovernanceContext): boolean {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'certificate'];
    return sensitiveFields.some(field => 
      context.code.toLowerCase().includes(field)
    );
  }

  /**
   * Generate encryption implementation
   */
  private generateEncryption(context: GovernanceContext): GovernanceAddition {
    return {
      type: 'encryption',
      title: 'Add Encryption',
      description: 'Encrypt sensitive data at rest and in transit',
      implementation: `-- Encryption Implementation

-- 1. Column-level encryption for sensitive data
-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
UPDATE your_table
SET 
  -- Symmetric encryption for PII
  ssn = pgp_sym_encrypt(ssn, current_setting('app.encryption_key')),
  credit_card = pgp_sym_encrypt(credit_card, current_setting('app.encryption_key')),
  
  -- One-way hash for passwords (never decrypt)
  password_hash = crypt(password, gen_salt('bf', 8));

-- 2. Create encrypted view for reading
CREATE VIEW decrypted_data AS
SELECT 
  customer_id,
  pgp_sym_decrypt(ssn::bytea, current_setting('app.encryption_key')) AS ssn,
  pgp_sym_decrypt(credit_card::bytea, current_setting('app.encryption_key')) AS credit_card,
  -- Other columns
FROM your_table
WHERE pg_has_role(current_user, 'encryption_reader', 'MEMBER');

-- 3. Transparent Data Encryption (TDE) at table level
-- For PostgreSQL:
ALTER TABLE sensitive_table SET (encryption_key_id = 'aws/s3/key/id');

-- For other databases, enable TDE:
-- SQL Server: 
-- ALTER DATABASE YourDB SET ENCRYPTION ON;
-- Oracle: 
-- ALTER TABLE sensitive_table ENCRYPT;

-- 4. Connection encryption enforcement
-- In postgresql.conf:
-- ssl = on
-- ssl_cert_file = 'server.crt'
-- ssl_key_file = 'server.key'

-- Force SSL for specific users/databases:
ALTER USER sensitive_user SET ssl_required = on;`,
      complianceStandard: 'PCI-DSS, HIPAA',
      required: true
    };
  }

  /**
   * Calculate risk score based on issues found
   */
  private calculateRiskScore(issues: ComplianceIssue[]): number {
    let score = 0;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score += 4; break;
        case 'high': score += 3; break;
        case 'medium': score += 2; break;
        case 'low': score += 1; break;
      }
    });
    
    return Math.min(10, score); // Cap at 10
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(issues: ComplianceIssue[], additions: GovernanceAddition[]): number {
    const baseScore = 100;
    const deduction = issues.length * 10;
    const bonus = additions.filter(a => a.required).length * 5;
    
    return Math.max(0, Math.min(100, baseScore - deduction + bonus));
  }

  /**
   * Estimate remediation effort
   */
  private estimateRemediationEffort(additions: GovernanceAddition[]): 'low' | 'medium' | 'high' {
    const requiredCount = additions.filter(a => a.required).length;
    
    if (requiredCount === 0) return 'low';
    if (requiredCount <= 2) return 'medium';
    return 'high';
  }
}