import { RealNode, IntegrationLevel, PipelineSource, RealPipeline } from '@/lib/types/RealNode';
import { createMockMCPClient } from '@/lib/mcp/mockMCPClient';

interface ToolInterface {
  openInModal: (url: string, options?: ModalOptions) => void;
  openInNewTab: (url: string) => void;
  embedIframe: (url: string, container: HTMLElement) => void;
}

interface ModalOptions {
  width?: number;
  height?: number;
  title?: string;
  onClose?: () => void;
  syncCallback?: () => Promise<void>;
}

interface SyncResult {
  success: boolean;
  changes?: any;
  error?: string;
}

export class HybridIntegrationHandler {
  private toolInterface: ToolInterface;
  private mcpClients: Map<string, any> = new Map();

  constructor(toolInterface: ToolInterface) {
    this.toolInterface = toolInterface;
  }

  /**
   * Handle node interaction based on integration level
   */
  async handleNodeClick(node: RealNode): Promise<void> {
    switch (node.reality.integration.level) {
      case 'mcp-full':
        await this.handleMCPFullInteraction(node);
        break;
        
      case 'tool-direct':
        await this.handleToolDirectInteraction(node);
        break;
        
      case 'config-only':
        await this.handleConfigOnlyInteraction(node);
        break;
        
      case 'documentation':
        await this.handleDocumentationInteraction(node);
        break;
        
      default:
        console.warn(`Unknown integration level: ${node.reality.integration.level}`);
    }
  }

  /**
   * Handle MCP Full Integration - complete control via MCP
   */
  private async handleMCPFullInteraction(node: RealNode): Promise<void> {
    try {
      const mcpServer = node.reality.integration.mcpServer;
      if (!mcpServer) {
        throw new Error('MCP server not specified for MCP-full node');
      }

      // Get or create MCP client
      let client = this.mcpClients.get(mcpServer);
      if (!client) {
        client = createMockMCPClient(`mcp://${mcpServer}:3000`);
        await client.connect();
        this.mcpClients.set(mcpServer, client);
      }

      // Open configuration panel
      this.openConfigurationPanel(node, {
        mode: 'mcp',
        client,
        capabilities: ['read', 'write', 'execute', 'monitor']
      });

    } catch (error) {
      console.error('MCP interaction failed:', error);
      // Fallback to tool-direct if available
      if (node.reality.location.url) {
        await this.handleToolDirectInteraction(node);
      }
    }
  }

  /**
   * Handle Tool Direct Integration - link to tool UI with sync
   */
  private async handleToolDirectInteraction(node: RealNode): Promise<void> {
    if (!node.reality.location.url) {
      console.error('No URL available for tool-direct integration');
      return;
    }

    const toolUrl = this.buildToolURL(node);
    
    // Determine how to open based on tool type and user preference
    const openMode = this.getToolOpenMode(node.reality.source);
    
    switch (openMode) {
      case 'modal':
        this.toolInterface.openInModal(toolUrl, {
          width: 1200,
          height: 800,
          title: `Edit ${node.label} in ${node.reality.source}`,
          syncCallback: () => this.syncNodeFromTool(node)
        });
        break;
        
      case 'embedded':
        // For tools that support embedding
        this.openEmbeddedTool(node, toolUrl);
        break;
        
      case 'new-tab':
      default:
        this.toolInterface.openInNewTab(toolUrl);
        // Set up polling for changes
        this.setupChangePolling(node);
        break;
    }
  }

  /**
   * Handle Config Only Integration - show config editor
   */
  private async handleConfigOnlyInteraction(node: RealNode): Promise<void> {
    this.openConfigurationPanel(node, {
      mode: 'config-only',
      capabilities: ['read', 'manual-update'],
      showSyncButton: true,
      readOnly: false
    });
  }

  /**
   * Handle Documentation Integration - show templates and docs
   */
  private async handleDocumentationInteraction(node: RealNode): Promise<void> {
    this.openDocumentationPanel(node, {
      template: await this.getNodeTemplate(node.type),
      examples: await this.getNodeExamples(node.type),
      setupGuide: await this.getSetupGuide(node.reality.source)
    });
  }

  /**
   * Sync node configuration from external tool
   */
  async syncNodeConfig(node: RealNode): Promise<SyncResult> {
    const syncMethods = [
      () => this.syncViaMCP(node),
      () => this.syncViaAPI(node),
      () => this.syncViaWebhook(node),
      () => this.promptManualSync(node)
    ];

    for (const method of syncMethods) {
      try {
        const result = await method();
        if (result.success) {
          // Update last sync status
          node.reality.lastSync = {
            timestamp: new Date().toISOString(),
            status: 'synced',
            hash: this.generateConfigHash(result.changes || node.config.actual)
          };
          return result;
        }
      } catch (error) {
        console.warn('Sync method failed:', error);
        continue;
      }
    }

    return {
      success: false,
      error: 'All sync methods failed'
    };
  }

  /**
   * Sync via MCP server
   */
  private async syncViaMCP(node: RealNode): Promise<SyncResult> {
    if (node.reality.integration.level !== 'mcp-full' || !node.reality.integration.mcpServer) {
      throw new Error('Node does not support MCP sync');
    }

    const client = this.mcpClients.get(node.reality.integration.mcpServer!);
    if (!client) {
      throw new Error('MCP client not available');
    }

    try {
      const currentConfig = await client.request('getNodeConfig', {
        nodeType: node.type,
        nodeId: node.reality.sourceId
      });

      return {
        success: true,
        changes: currentConfig
      };
    } catch (error) {
      throw new Error(`MCP sync failed: ${error}`);
    }
  }

  /**
   * Sync via direct API
   */
  private async syncViaAPI(node: RealNode): Promise<SyncResult> {
    if (!node.reality.integration.apiEndpoint) {
      throw new Error('No API endpoint available for sync');
    }

    try {
      const response = await fetch(node.reality.integration.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers based on source
          ...this.getAuthHeaders(node.reality.source)
        }
      });

      if (!response.ok) {
        throw new Error(`API sync failed: ${response.status}`);
      }

      const config = await response.json();
      
      return {
        success: true,
        changes: config
      };
    } catch (error) {
      throw new Error(`API sync failed: ${error}`);
    }
  }

  /**
   * Sync via webhook (for tools that support push notifications)
   */
  private async syncViaWebhook(node: RealNode): Promise<SyncResult> {
    // This would be implemented for tools that can push changes
    throw new Error('Webhook sync not implemented');
  }

  /**
   * Prompt user for manual sync
   */
  private async promptManualSync(node: RealNode): Promise<SyncResult> {
    // Show modal asking user to manually update configuration
    return new Promise((resolve) => {
      this.showManualSyncModal(node, (updatedConfig) => {
        resolve({
          success: true,
          changes: updatedConfig
        });
      });
    });
  }

  /**
   * Build tool-specific URL for direct integration
   */
  private buildToolURL(node: RealNode): string {
    let url = node.reality.location.url || '';

    // Add tool-specific parameters for better integration
    switch (node.reality.source) {
      case 'airflow':
        // Add return URL for better integration
        url += `&return_url=${encodeURIComponent(window.location.href)}`;
        break;
        
      case 'nifi':
        // NiFi URLs might need processor ID in fragment
        if (node.reality.sourceId) {
          url += `#/flow/${node.reality.sourceId}`;
        }
        break;
        
      case 'jenkins':
        // Jenkins might need build parameters
        url += `/configure`;
        break;
    }

    return url;
  }

  /**
   * Determine how to open tool interface
   */
  private getToolOpenMode(source: PipelineSource): 'modal' | 'embedded' | 'new-tab' {
    // Tool-specific opening preferences
    const preferences: Record<PipelineSource, 'modal' | 'embedded' | 'new-tab'> = {
      airflow: 'modal',      // Airflow UI works well in modal
      nifi: 'new-tab',       // NiFi needs full screen
      spark: 'new-tab',      // Spark UI needs full access
      dbt: 'embedded',       // dbt docs can be embedded
      kubernetes: 'new-tab', // K8s dashboard needs full screen
      jenkins: 'modal',      // Jenkins forms work in modal
      manual: 'embedded'     // Manual config stays in app
    };

    return preferences[source] || 'new-tab';
  }

  /**
   * Open embedded tool interface
   */
  private openEmbeddedTool(node: RealNode, url: string): void {
    // Create iframe container
    const container = document.createElement('div');
    container.className = 'embedded-tool-container';
    
    // Add to DOM in appropriate location
    const modal = this.createEmbeddedModal(node, url);
    document.body.appendChild(modal);
  }

  /**
   * Set up polling for external changes
   */
  private setupChangePolling(node: RealNode): void {
    const pollInterval = setInterval(async () => {
      try {
        const syncResult = await this.syncNodeConfig(node);
        if (syncResult.success && syncResult.changes) {
          // Notify UI of changes
          this.notifyConfigChange(node, syncResult.changes);
        }
      } catch (error) {
        console.warn('Polling sync failed:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Store interval ID for cleanup
    (node as any)._pollInterval = pollInterval;
  }

  /**
   * Open configuration panel
   */
  private openConfigurationPanel(node: RealNode, options: any): void {
    // This would integrate with the existing ConfigurationModal
    // but with enhanced capabilities based on integration level
    console.log('Opening configuration panel for:', node.label, options);
  }

  /**
   * Open documentation panel
   */
  private openDocumentationPanel(node: RealNode, content: any): void {
    console.log('Opening documentation panel for:', node.label, content);
  }

  /**
   * Show manual sync modal
   */
  private showManualSyncModal(node: RealNode, callback: (config: any) => void): void {
    console.log('Showing manual sync modal for:', node.label);
  }

  /**
   * Create embedded modal for tool interface
   */
  private createEmbeddedModal(node: RealNode, url: string): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'embedded-tool-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit ${node.label} in ${node.reality.source}</h3>
          <button class="close-btn">&times;</button>
        </div>
        <iframe src="${url}" width="100%" height="600px"></iframe>
        <div class="modal-footer">
          <button class="sync-btn">Sync Changes</button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * Helper methods
   */
  private getAuthHeaders(source: PipelineSource): Record<string, string> {
    // Return appropriate auth headers based on source
    // This would be configured per environment
    return {};
  }

  private generateConfigHash(config: any): string {
    return btoa(JSON.stringify(config)).slice(0, 8);
  }

  private async getNodeTemplate(nodeType: string): Promise<any> {
    // Return template for node type
    return {};
  }

  private async getNodeExamples(nodeType: string): Promise<any[]> {
    // Return examples for node type
    return [];
  }

  private async getSetupGuide(source: PipelineSource): Promise<string> {
    // Return setup guide for tool
    return '';
  }

  private notifyConfigChange(node: RealNode, changes: any): void {
    // Notify UI components of configuration changes
    const event = new CustomEvent('nodeConfigChanged', {
      detail: { node, changes }
    });
    window.dispatchEvent(event);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clean up MCP clients
    for (const [server, client] of this.mcpClients) {
      try {
        client.disconnect();
      } catch (error) {
        console.warn(`Failed to disconnect from ${server}:`, error);
      }
    }
    this.mcpClients.clear();
  }
}

// Tool-specific integration helpers
export class AirflowIntegration {
  static async getDAGTasks(dagId: string, endpoint: string): Promise<any[]> {
    const response = await fetch(`${endpoint}/api/v1/dags/${dagId}/tasks`);
    if (!response.ok) {
      throw new Error(`Failed to fetch DAG tasks: ${response.status}`);
    }
    const data = await response.json();
    return data.tasks || [];
  }

  static async updateTaskConfig(dagId: string, taskId: string, config: any, endpoint: string): Promise<void> {
    // Note: Airflow doesn't directly support updating task config via API
    // This would require custom implementation or file-based updates
    console.warn('Airflow task config updates not supported via API');
  }

  static buildTaskURL(baseUrl: string, dagId: string, taskId: string): string {
    return `${baseUrl}/dags/${dagId}/grid?task_id=${taskId}`;
  }
}

export class NiFiIntegration {
  static async getProcessorConfig(processorId: string, endpoint: string): Promise<any> {
    const response = await fetch(`${endpoint}/nifi-api/processors/${processorId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch processor config: ${response.status}`);
    }
    return response.json();
  }

  static async updateProcessorConfig(processorId: string, config: any, endpoint: string): Promise<void> {
    // Get current revision first
    const processor = await this.getProcessorConfig(processorId, endpoint);
    
    const response = await fetch(`${endpoint}/nifi-api/processors/${processorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        revision: processor.revision,
        component: {
          id: processorId,
          config: config
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update processor config: ${response.status}`);
    }
  }

  static buildProcessorURL(baseUrl: string, processGroupId: string, processorId: string): string {
    return `${baseUrl}/nifi/#/flow/${processGroupId}?componentIds=${processorId}`;
  }
}