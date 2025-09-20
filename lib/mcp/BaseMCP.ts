// Base MCP Client - Abstract class for all tool MCP implementations

import { MCPConfig, MCPResponse, MCPHealth } from './types';

export abstract class BaseMCP {
  protected config: MCPConfig;
  protected headers: Record<string, string>;
  
  constructor(config: MCPConfig) {
    this.config = config;
    this.headers = this.buildHeaders();
  }
  
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    switch (this.config.auth.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.config.auth.credentials?.token}`;
        break;
      case 'basic':
        const encoded = Buffer.from(
          `${this.config.auth.credentials?.username}:${this.config.auth.credentials?.password}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
        break;
      case 'apikey':
        headers['X-API-Key'] = this.config.auth.credentials?.apiKey;
        break;
    }
    
    return headers;
  }
  
  protected async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<MCPResponse<T>> {
    const startTime = Date.now();
    
    try {
      const url = `${this.config.endpoint}${path}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
          source: this.config.name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          duration: Date.now() - startTime,
          source: this.config.name,
        },
      };
    }
  }
  
  async health(): Promise<MCPHealth> {
    const startTime = Date.now();
    
    try {
      // Most tools have a health endpoint
      const response = await this.request('/health');
      
      return {
        service: this.config.name,
        status: response.success ? 'healthy' : 'unhealthy',
        latency: Date.now() - startTime,
        lastCheck: new Date(),
        details: response.data,
      };
    } catch (error) {
      return {
        service: this.config.name,
        status: 'unhealthy',
        latency: Date.now() - startTime,
        lastCheck: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }
  
  abstract getUIUrl(): Promise<string>;
}