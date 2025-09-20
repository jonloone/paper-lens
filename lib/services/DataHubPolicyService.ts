/**
 * DataHubPolicyService
 * 
 * Handles policy evaluation following DataHub's access control model.
 * Determines what actions users can take on metadata entities.
 */

import type { DataHubPolicy, DataHubContext } from './DataHubContextService';

export interface PolicyEvaluationResult {
  allowed: boolean;
  policy?: DataHubPolicy;
  reason?: string;
}

export interface UserContext {
  urn: string; // e.g., "urn:li:corpuser:john.doe"
  groups: string[]; // e.g., ["urn:li:corpGroup:data-stewards"]
  isOwner?: boolean;
  roles?: string[];
}

// DataHub standard privileges
export enum DataHubPrivilege {
  // Dataset privileges
  VIEW_DATASET_USAGE = 'VIEW_DATASET_USAGE',
  VIEW_DATASET_PROFILE = 'VIEW_DATASET_PROFILE',
  VIEW_DATASET_SENSITIVE_DATA = 'VIEW_DATASET_SENSITIVE_DATA',
  EDIT_DATASET_PROPERTIES = 'EDIT_DATASET_PROPERTIES',
  EDIT_DATASET_TAGS = 'EDIT_DATASET_TAGS',
  EDIT_DATASET_GLOSSARY_TERMS = 'EDIT_DATASET_GLOSSARY_TERMS',
  EDIT_DATASET_OWNERS = 'EDIT_DATASET_OWNERS',
  DELETE_DATASET = 'DELETE_DATASET',
  
  // Platform privileges
  MANAGE_POLICIES = 'MANAGE_POLICIES',
  MANAGE_USERS_AND_GROUPS = 'MANAGE_USERS_AND_GROUPS',
  MANAGE_DOMAINS = 'MANAGE_DOMAINS',
  MANAGE_GLOSSARIES = 'MANAGE_GLOSSARIES',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  
  // Data quality privileges
  EDIT_DATA_QUALITY_RULES = 'EDIT_DATA_QUALITY_RULES',
  RUN_DATA_QUALITY_TESTS = 'RUN_DATA_QUALITY_TESTS',
  
  // Lineage privileges
  EDIT_LINEAGE = 'EDIT_LINEAGE',
  VIEW_LINEAGE = 'VIEW_LINEAGE'
}

export class DataHubPolicyService {
  /**
   * Evaluate if a user can perform a specific action
   */
  evaluatePolicy(params: {
    user: UserContext;
    privilege: string;
    resource: string;
    context: DataHubContext;
  }): PolicyEvaluationResult {
    // Check each applicable policy
    for (const policy of params.context.applicablePolicies) {
      if (policy.state !== 'ACTIVE') continue;
      
      // Check if policy grants the requested privilege
      if (!policy.privileges.includes(params.privilege)) continue;
      
      // Check if resource matches policy scope
      if (!this.resourceMatchesPolicy(params.resource, policy, params.context)) continue;
      
      // Check if user matches policy actors
      if (this.userMatchesPolicy(params.user, policy, params.context)) {
        return {
          allowed: true,
          policy,
          reason: `Allowed by policy: ${policy.name}`
        };
      }
    }
    
    // No matching policy found
    return {
      allowed: false,
      reason: `No policy grants ${params.privilege} on ${params.resource}`
    };
  }
  
  /**
   * Check if a resource matches policy scope
   */
  private resourceMatchesPolicy(
    resourceUrn: string,
    policy: DataHubPolicy,
    context: DataHubContext
  ): boolean {
    // No resource constraints means all resources
    if (!policy.resources) return true;
    
    // Check if all resources are allowed
    if (policy.resources.allResources) return true;
    
    // Check specific resource list
    if (policy.resources.resources?.includes(resourceUrn)) return true;
    
    // Check filter criteria (e.g., tags)
    if (policy.resources.filter) {
      for (const criterion of policy.resources.filter.criteria) {
        switch (criterion.field) {
          case 'tags':
            // Check if resource has required tags
            const hasAllTags = criterion.values.every(tag => 
              context.tags.includes(tag)
            );
            if (!hasAllTags) return false;
            break;
            
          case 'domain':
            // Check domain match
            if (!criterion.values.includes(context.dataset.origin)) return false;
            break;
            
          case 'platform':
            // Check platform match
            if (!criterion.values.includes(context.dataset.platform)) return false;
            break;
        }
      }
      return true; // All criteria matched
    }
    
    return false;
  }
  
  /**
   * Check if a user matches policy actors
   */
  private userMatchesPolicy(
    user: UserContext,
    policy: DataHubPolicy,
    context: DataHubContext
  ): boolean {
    // Check if all users are allowed
    if (policy.actors.allUsers) return true;
    
    // Check if resource owners are allowed and user is owner
    if (policy.actors.resourceOwners && user.isOwner) return true;
    if (policy.actors.resourceOwners && context.owners) {
      const isOwner = context.owners.some(o => o.owner === user.urn);
      if (isOwner) return true;
    }
    
    // Check specific users
    if (policy.actors.users?.includes(user.urn)) return true;
    
    // Check groups
    if (policy.actors.groups) {
      const userInGroup = policy.actors.groups.some(group => 
        user.groups.includes(group)
      );
      if (userInGroup) return true;
    }
    
    return false;
  }
  
  /**
   * Get effective privileges for a user on a resource
   */
  getEffectivePrivileges(params: {
    user: UserContext;
    resource: string;
    context: DataHubContext;
  }): string[] {
    const privileges = new Set<string>();
    
    for (const policy of params.context.applicablePolicies) {
      if (policy.state !== 'ACTIVE') continue;
      
      if (!this.resourceMatchesPolicy(params.resource, policy, params.context)) continue;
      
      if (this.userMatchesPolicy(params.user, policy, params.context)) {
        policy.privileges.forEach(p => privileges.add(p));
      }
    }
    
    return Array.from(privileges);
  }
  
  /**
   * Check if user can view unmasked PII
   */
  canViewSensitiveData(user: UserContext, context: DataHubContext): boolean {
    const result = this.evaluatePolicy({
      user,
      privilege: DataHubPrivilege.VIEW_DATASET_SENSITIVE_DATA,
      resource: context.dataset.urn,
      context
    });
    
    return result.allowed;
  }
  
  /**
   * Get data access level for user
   */
  getDataAccessLevel(user: UserContext, context: DataHubContext): 'full' | 'masked' | 'none' {
    // Check if user can view dataset at all
    const canView = this.evaluatePolicy({
      user,
      privilege: DataHubPrivilege.VIEW_DATASET_USAGE,
      resource: context.dataset.urn,
      context
    });
    
    if (!canView.allowed) return 'none';
    
    // Check if user can view sensitive data
    const canViewSensitive = this.canViewSensitiveData(user, context);
    
    return canViewSensitive ? 'full' : 'masked';
  }
  
  /**
   * Generate SQL modifications based on policies
   */
  generatePolicyBasedSQL(params: {
    user: UserContext;
    sql: string;
    context: DataHubContext;
  }): {
    modifiedSQL: string;
    appliedPolicies: string[];
    modifications: Array<{
      type: 'mask' | 'filter' | 'redact';
      field: string;
      reason: string;
    }>;
  } {
    const modifications: Array<{
      type: 'mask' | 'filter' | 'redact';
      field: string;
      reason: string;
    }> = [];
    const appliedPolicies: string[] = [];
    let modifiedSQL = params.sql;
    
    // Check data access level
    const accessLevel = this.getDataAccessLevel(params.user, params.context);
    
    if (accessLevel === 'none') {
      // User cannot access this data at all
      throw new Error('Access denied: No permission to view this dataset');
    }
    
    if (accessLevel === 'masked' && params.context.piiClassifications.length > 0) {
      // Apply PII masking
      appliedPolicies.push('PII Masking Policy');
      
      for (const piiField of params.context.piiClassifications) {
        const field = params.context.schemaMetadata?.fields.find(
          f => f.fieldPath === piiField.fieldPath
        );
        
        if (field && params.sql.includes(field.fieldPath)) {
          // Add masking to SQL
          const maskExpression = this.getMaskExpression(piiField, field);
          modifiedSQL = modifiedSQL.replace(
            new RegExp(`\\b${field.fieldPath}\\b`, 'g'),
            `${maskExpression} AS ${field.fieldPath}`
          );
          
          modifications.push({
            type: 'mask',
            field: field.fieldPath,
            reason: `PII field (${piiField.infoTypes[0].type}) - ${piiField.justification}`
          });
        }
      }
    }
    
    // Apply data quality filters if required by policy
    const qualityPolicy = params.context.applicablePolicies.find(
      p => p.name === 'Data Quality Enforcement' && p.state === 'ACTIVE'
    );
    
    if (qualityPolicy && params.context.datasetProfile) {
      // Add quality filters based on field profiles
      for (const fieldProfile of params.context.datasetProfile.fieldProfiles) {
        if (fieldProfile.nullProportion && fieldProfile.nullProportion > 0.1) {
          // Add null filter
          if (!modifiedSQL.toLowerCase().includes('where')) {
            modifiedSQL += `\nWHERE ${fieldProfile.fieldPath} IS NOT NULL`;
          } else {
            modifiedSQL = modifiedSQL.replace(
              /WHERE/i,
              `WHERE ${fieldProfile.fieldPath} IS NOT NULL AND`
            );
          }
          
          modifications.push({
            type: 'filter',
            field: fieldProfile.fieldPath,
            reason: `Quality filter: ${Math.round(fieldProfile.nullProportion * 100)}% null values`
          });
        }
      }
    }
    
    return {
      modifiedSQL,
      appliedPolicies,
      modifications
    };
  }
  
  /**
   * Generate appropriate mask expression based on PII type
   */
  private getMaskExpression(piiClass: any, field: any): string {
    const infoType = piiClass.infoTypes[0].type;
    
    switch (infoType) {
      case 'EMAIL':
        return `CASE 
          WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${field.fieldPath}
          ELSE CONCAT(LEFT(${field.fieldPath}, 2), '***@***.com')
        END`;
        
      case 'PHONE':
        return `CASE 
          WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${field.fieldPath}
          ELSE CONCAT('***-***-', RIGHT(${field.fieldPath}, 4))
        END`;
        
      case 'SSN':
        return `CASE 
          WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${field.fieldPath}
          ELSE '***-**-****'
        END`;
        
      case 'CREDIT_CARD':
        return `CASE 
          WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${field.fieldPath}
          ELSE CONCAT('****-****-****-', RIGHT(${field.fieldPath}, 4))
        END`;
        
      case 'NAME':
        return `CASE 
          WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${field.fieldPath}
          ELSE CONCAT(LEFT(${field.fieldPath}, 1), '***')
        END`;
        
      default:
        // Generic masking
        return `CASE 
          WHEN current_user() IN (SELECT user FROM privileged_users) THEN ${field.fieldPath}
          ELSE '***MASKED***'
        END`;
    }
  }
}

// Export singleton instance
export const dataHubPolicyService = new DataHubPolicyService();