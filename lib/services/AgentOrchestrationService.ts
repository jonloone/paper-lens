import { ConnectionSetupAgent } from '@/lib/agents/assistants/ConnectionSetupAgent';
import { TroubleshootingAgent } from '@/lib/agents/assistants/TroubleshootingAgent';
import { OptimizationAgent } from '@/lib/agents/assistants/OptimizationAgent';
import { GovernanceAgent } from '@/lib/agents/assistants/GovernanceAgent';
import { AgentSuggestion } from '@/components/agents/AgentAssistPanel';

/**
 * AgentOrchestrationService - Coordinates all assistant agents
 * Runs agents in background and surfaces relevant suggestions
 */
export class AgentOrchestrationService {
  private agents = {
    connection: new ConnectionSetupAgent(),
    troubleshooting: new TroubleshootingAgent(),
    optimization: new OptimizationAgent(),
    governance: new GovernanceAgent()
  };

  /**
   * Analyze context and return suggestions from relevant agents
   */
  async analyzeContext(mode: string, context: any): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    
    try {
      // Run appropriate agents based on mode and context
      const analyses = await Promise.allSettled([
        this.checkOptimizations(context),
        this.checkGovernance(context),
        this.checkCommonIssues(context)
      ]);
      
      // Collect successful results
      analyses.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          suggestions.push(...result.value);
        }
      });
      
      // Filter by confidence and relevance
      return suggestions
        .filter(s => s.confidence > 0.5)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Limit to top 5 suggestions
    } catch (error) {
      console.error('Agent orchestration error:', error);
      return [];
    }
  }

  /**
   * Check for optimization opportunities
   */
  private async checkOptimizations(context: any): Promise<AgentSuggestion[]> {
    if (!context.sql && !context.pipeline) return [];
    
    try {
      const result = await this.agents.optimization.processRequest({
        id: `opt-${Date.now()}`,
        agentType: 'optimization',
        task: {
          title: 'Analyze for optimizations',
          description: 'Check query/pipeline performance',
          input: {
            sql: context.sql || '',
            pipeline: context.pipeline
          },
          createdAt: new Date()
        }
      });
      
      if (result.status === 'success' && result.result) {
        const analysis = result.result;
        return analysis.suggestions.map((opt: any) => ({
          id: `opt-${Date.now()}-${Math.random()}`,
          type: 'optimization' as const,
          title: opt.title,
          message: opt.description,
          impact: opt.estimatedImprovement,
          implementation: opt.implementation,
          confidence: analysis.confidenceScore || 0.7,
          agent: 'optimization'
        }));
      }
    } catch (error) {
      console.error('Optimization check failed:', error);
    }
    
    return [];
  }

  /**
   * Check for governance/compliance issues
   */
  private async checkGovernance(context: any): Promise<AgentSuggestion[]> {
    if (!context.sql && !context.code) return [];
    
    try {
      const result = await this.agents.governance.processRequest({
        id: `gov-${Date.now()}`,
        agentType: 'governance',
        task: {
          title: 'Check compliance',
          description: 'Analyze for governance requirements',
          input: {
            code: context.sql || context.code || '',
            dataType: context.type || 'sql',
            columns: context.columns || []
          },
          createdAt: new Date()
        }
      });
      
      if (result.status === 'success' && result.result) {
        const analysis = result.result;
        return analysis.additions.map((addition: any) => ({
          id: `gov-${Date.now()}-${Math.random()}`,
          type: 'governance' as const,
          title: addition.title,
          message: addition.description,
          impact: addition.required ? 'Required for compliance' : 'Recommended',
          implementation: addition.implementation,
          confidence: addition.required ? 0.9 : 0.6,
          agent: 'governance',
          details: `Compliance: ${addition.complianceStandard || 'Best practice'}`
        }));
      }
    } catch (error) {
      console.error('Governance check failed:', error);
    }
    
    return [];
  }

  /**
   * Check for common issues proactively
   */
  private async checkCommonIssues(context: any): Promise<AgentSuggestion[]> {
    const suggestions: AgentSuggestion[] = [];
    
    // Check for null handling issues
    if (context.sql?.toLowerCase().includes('join') && 
        !context.sql?.toLowerCase().includes('coalesce')) {
      suggestions.push({
        id: `issue-null-${Date.now()}`,
        type: 'info',
        title: 'Consider NULL handling',
        message: 'JOINs may produce NULLs. Consider using COALESCE for important fields.',
        implementation: `-- Add null handling:
SELECT 
  COALESCE(t1.id, t2.id) as id,
  COALESCE(t1.value, 0) as value
FROM table1 t1
LEFT JOIN table2 t2 ON t1.id = t2.id`,
        confidence: 0.6,
        agent: 'optimization'
      });
    }
    
    // Check for missing WHERE clause
    if (context.sql?.toLowerCase().includes('delete') && 
        !context.sql?.toLowerCase().includes('where')) {
      suggestions.push({
        id: `issue-delete-${Date.now()}`,
        type: 'troubleshooting',
        title: 'Dangerous DELETE without WHERE',
        message: 'DELETE without WHERE clause will delete all rows!',
        impact: 'Critical - Data loss risk',
        implementation: `-- Always include WHERE clause:
DELETE FROM table_name 
WHERE condition = 'value';

-- Or use TRUNCATE if you really want to delete all:
TRUNCATE TABLE table_name;`,
        confidence: 0.95,
        agent: 'governance'
      });
    }
    
    return suggestions;
  }

  /**
   * Troubleshoot current failure/issue
   */
  async troubleshootCurrent(context: any): Promise<any> {
    if (!context.error && !context.pipelineId) return null;
    
    try {
      const result = await this.agents.troubleshooting.processRequest({
        id: `trouble-${Date.now()}`,
        agentType: 'troubleshooting',
        task: {
          title: 'Diagnose issue',
          description: context.error || 'Pipeline failure',
          input: {
            pipelineId: context.pipelineId || 'unknown',
            pipelineName: context.pipelineName || 'Current Pipeline',
            failureTime: new Date(),
            errorMessage: context.error || context.errorMessage || ''
          },
          createdAt: new Date()
        }
      });
      
      return result.result;
    } catch (error) {
      console.error('Troubleshooting failed:', error);
      return null;
    }
  }

  /**
   * Optimize current query/pipeline
   */
  async optimizeCurrent(context: any): Promise<AgentSuggestion[]> {
    return this.checkOptimizations(context);
  }

  /**
   * Add governance controls
   */
  async addGovernance(context: any): Promise<AgentSuggestion[]> {
    return this.checkGovernance(context);
  }

  /**
   * Setup connection with minimal config
   */
  async setupConnection(type: string, basicInfo: any): Promise<any> {
    try {
      const result = await this.agents.connection.processRequest({
        id: `conn-${Date.now()}`,
        agentType: 'connection_setup',
        task: {
          title: `Setup ${type} connection`,
          description: 'Generate complete connection configuration',
          input: {
            type,
            basicInfo
          },
          createdAt: new Date()
        }
      });
      
      return result.result;
    } catch (error) {
      console.error('Connection setup failed:', error);
      return null;
    }
  }
}