// DataHub MCP Client - Integration with DataHub for catalog and metadata

import { BaseMCP } from './BaseMCP';
import { MCPResponse, DataSource } from './types';

export interface DataHubDataset {
  urn: string;
  name: string;
  platform: string;
  properties: {
    name: string;
    description?: string;
    tags?: string[];
    customProperties?: Record<string, string>;
  };
  schema?: {
    fields: Array<{
      fieldPath: string;
      type: string;
      nullable: boolean;
      description?: string;
    }>;
  };
  ownership?: {
    owners: Array<{
      owner: string;
      type: string;
    }>;
  };
  lineage?: {
    upstreams: string[];
    downstreams: string[];
  };
}

export interface DataHubCatalog {
  id: string;
  name: string;
  description?: string;
  datasets: number;
  lastUpdated: Date;
}

export class DataHubMCP extends BaseMCP {
  async getUIUrl(): Promise<string> {
    return `${this.config.endpoint.replace('/api', '')}`;
  }
  
  async getCatalogs(): Promise<MCPResponse<DataHubCatalog[]>> {
    // In DataHub, catalogs are typically domains or platforms
    const response = await this.request('/domains');
    
    if (response.success && response.data) {
      const catalogs = response.data.domains?.map((domain: any) => ({
        id: domain.urn,
        name: domain.properties.name,
        description: domain.properties.description,
        datasets: domain.entities?.total || 0,
        lastUpdated: new Date(domain.lastModified || Date.now()),
      })) || [];
      
      return { ...response, data: catalogs };
    }
    
    return response;
  }
  
  async getDatasets(catalogId?: string): Promise<MCPResponse<DataHubDataset[]>> {
    const query = catalogId ? `?domain=${catalogId}` : '';
    return await this.request(`/datasets${query}`);
  }
  
  async searchDatasets(keywords: string): Promise<MCPResponse<DataSource[]>> {
    const response = await this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        input: keywords,
        entity: 'dataset',
        start: 0,
        count: 100,
      }),
    });
    
    if (response.success && response.data) {
      const sources = response.data.entities?.map((entity: any) => ({
        id: entity.entity,
        name: entity.matchedFields?.name || entity.entity.split(':').pop(),
        type: 'table' as const,
        description: entity.matchedFields?.description,
        tags: entity.matchedFields?.tags || [],
        owner: entity.matchedFields?.owners?.[0],
        lastModified: entity.lastModified ? new Date(entity.lastModified) : undefined,
      })) || [];
      
      return { ...response, data: sources };
    }
    
    return response;
  }
  
  async getSchemas(): Promise<MCPResponse<any[]>> {
    const response = await this.request('/datasets');
    
    if (response.success && response.data) {
      // Group datasets by schema/database
      const schemaMap = new Map<string, any>();
      
      response.data.entities?.forEach((dataset: any) => {
        const parts = dataset.name.split('.');
        const schema = parts.length > 1 ? parts[0] : 'default';
        
        if (!schemaMap.has(schema)) {
          schemaMap.set(schema, {
            name: schema,
            tables: [],
          });
        }
        
        schemaMap.get(schema).tables.push({
          name: parts[parts.length - 1],
          fullName: dataset.name,
          urn: dataset.urn,
        });
      });
      
      return { ...response, data: Array.from(schemaMap.values()) };
    }
    
    return response;
  }
  
  async getMetadata(datasetUrn: string): Promise<MCPResponse<DataHubDataset>> {
    return await this.request(`/datasets/${encodeURIComponent(datasetUrn)}`);
  }
  
  async updateMetadata(datasetUrn: string, metadata: Partial<DataHubDataset>): Promise<MCPResponse<void>> {
    return await this.request(`/datasets/${encodeURIComponent(datasetUrn)}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata),
    });
  }
  
  async registerDataset(dataset: {
    name: string;
    platform: string;
    schema: any;
    description?: string;
    tags?: string[];
    owner?: string;
  }): Promise<MCPResponse<string>> {
    const urn = `urn:li:dataset:(urn:li:dataPlatform:${dataset.platform},${dataset.name},PROD)`;
    
    const response = await this.request('/datasets', {
      method: 'POST',
      body: JSON.stringify({
        urn,
        properties: {
          name: dataset.name,
          description: dataset.description,
          tags: dataset.tags,
        },
        schema: dataset.schema,
        ownership: dataset.owner ? {
          owners: [{
            owner: dataset.owner,
            type: 'DATAOWNER',
          }],
        } : undefined,
      }),
    });
    
    if (response.success) {
      return { ...response, data: urn };
    }
    
    return response;
  }
  
  async updateLineage(datasetUrn: string, upstreams: string[], downstreams: string[]): Promise<MCPResponse<void>> {
    return await this.request(`/lineage/${encodeURIComponent(datasetUrn)}`, {
      method: 'PUT',
      body: JSON.stringify({
        upstreams,
        downstreams,
      }),
    });
  }
  
  async getTags(): Promise<MCPResponse<string[]>> {
    const response = await this.request('/tags');
    
    if (response.success && response.data) {
      const tags = response.data.tags?.map((tag: any) => tag.name) || [];
      return { ...response, data: tags };
    }
    
    return response;
  }
  
  async getOwners(): Promise<MCPResponse<string[]>> {
    const response = await this.request('/corpusers');
    
    if (response.success && response.data) {
      const owners = response.data.entities?.map((user: any) => user.username) || [];
      return { ...response, data: owners };
    }
    
    return response;
  }
}