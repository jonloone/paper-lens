// Data Lineage Service
// Tracks and visualizes data flow through the platform

export interface LineageNode {
  id: string;
  type: 'source' | 'transformation' | 'destination' | 'pipeline' | 'product';
  name: string;
  category?: string;
  metadata: {
    owner?: string;
    team?: string;
    created?: Date;
    updated?: Date;
    quality?: number;
    status?: string;
    schema?: any;
    tags?: string[];
  };
  position?: {
    x: number;
    y: number;
  };
}

export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  type: 'data-flow' | 'dependency' | 'derived' | 'quality-check';
  metadata: {
    transformationType?: string;
    dataVolume?: number;
    frequency?: string;
    latency?: number;
    qualityImpact?: number;
  };
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  metadata: {
    version: string;
    generated: Date;
    scope: 'pipeline' | 'product' | 'system';
    depth: number;
  };
}

export interface LineageImpactAnalysis {
  affectedNodes: LineageNode[];
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  propagationPath: string[];
  estimatedDowntime?: number;
  recommendations: string[];
}

// Sample lineage data for demonstration
const sampleLineageData: Record<string, LineageGraph> = {
  'pipeline-customer-360': {
    nodes: [
      {
        id: 'source-crm',
        type: 'source',
        name: 'CRM Database',
        category: 'postgresql',
        metadata: {
          owner: 'Sales Team',
          quality: 95,
          status: 'active',
          tags: ['customer', 'sales']
        },
        position: { x: 100, y: 200 }
      },
      {
        id: 'source-transactions',
        type: 'source',
        name: 'Transaction System',
        category: 'mysql',
        metadata: {
          owner: 'Finance Team',
          quality: 98,
          status: 'active',
          tags: ['transactions', 'payments']
        },
        position: { x: 100, y: 350 }
      },
      {
        id: 'source-support',
        type: 'source',
        name: 'Support Tickets',
        category: 'mongodb',
        metadata: {
          owner: 'Support Team',
          quality: 87,
          status: 'active',
          tags: ['support', 'tickets']
        },
        position: { x: 100, y: 500 }
      },
      {
        id: 'transform-dedupe',
        type: 'transformation',
        name: 'Deduplication',
        metadata: {
          owner: 'Data Platform',
          status: 'active'
        },
        position: { x: 400, y: 250 }
      },
      {
        id: 'transform-enrich',
        type: 'transformation',
        name: 'Data Enrichment',
        metadata: {
          owner: 'Data Platform',
          status: 'active'
        },
        position: { x: 400, y: 400 }
      },
      {
        id: 'transform-aggregate',
        type: 'transformation',
        name: 'Metric Aggregation',
        metadata: {
          owner: 'Data Platform',
          status: 'active'
        },
        position: { x: 600, y: 325 }
      },
      {
        id: 'quality-gate',
        type: 'transformation',
        name: 'Quality Validation',
        metadata: {
          owner: 'Data Platform',
          quality: 100,
          status: 'active'
        },
        position: { x: 800, y: 325 }
      },
      {
        id: 'dest-warehouse',
        type: 'destination',
        name: 'Data Warehouse',
        category: 'snowflake',
        metadata: {
          owner: 'Analytics Team',
          status: 'active',
          tags: ['warehouse', 'analytics']
        },
        position: { x: 1000, y: 250 }
      },
      {
        id: 'product-customer360',
        type: 'product',
        name: 'Customer 360 API',
        metadata: {
          owner: 'Product Team',
          quality: 94,
          status: 'active',
          tags: ['api', 'customer']
        },
        position: { x: 1200, y: 325 }
      },
      {
        id: 'dest-ml-platform',
        type: 'destination',
        name: 'ML Platform',
        category: 'feature-store',
        metadata: {
          owner: 'ML Team',
          status: 'active',
          tags: ['ml', 'features']
        },
        position: { x: 1000, y: 400 }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'source-crm',
        target: 'transform-dedupe',
        type: 'data-flow',
        metadata: {
          dataVolume: 50000,
          frequency: 'daily'
        }
      },
      {
        id: 'edge-2',
        source: 'source-transactions',
        target: 'transform-dedupe',
        type: 'data-flow',
        metadata: {
          dataVolume: 100000,
          frequency: 'hourly'
        }
      },
      {
        id: 'edge-3',
        source: 'source-support',
        target: 'transform-enrich',
        type: 'data-flow',
        metadata: {
          dataVolume: 5000,
          frequency: 'real-time'
        }
      },
      {
        id: 'edge-4',
        source: 'transform-dedupe',
        target: 'transform-enrich',
        type: 'data-flow',
        metadata: {
          transformationType: 'join'
        }
      },
      {
        id: 'edge-5',
        source: 'transform-enrich',
        target: 'transform-aggregate',
        type: 'data-flow',
        metadata: {
          transformationType: 'aggregate'
        }
      },
      {
        id: 'edge-6',
        source: 'transform-aggregate',
        target: 'quality-gate',
        type: 'quality-check',
        metadata: {
          qualityImpact: 95
        }
      },
      {
        id: 'edge-7',
        source: 'quality-gate',
        target: 'dest-warehouse',
        type: 'data-flow',
        metadata: {
          dataVolume: 48000,
          latency: 120
        }
      },
      {
        id: 'edge-8',
        source: 'dest-warehouse',
        target: 'product-customer360',
        type: 'derived',
        metadata: {
          frequency: 'real-time'
        }
      },
      {
        id: 'edge-9',
        source: 'quality-gate',
        target: 'dest-ml-platform',
        type: 'data-flow',
        metadata: {
          dataVolume: 48000,
          frequency: 'batch'
        }
      }
    ],
    metadata: {
      version: '1.0.0',
      generated: new Date(),
      scope: 'pipeline',
      depth: 4
    }
  }
};

export class DataLineageService {
  private lineageCache: Map<string, LineageGraph>;
  
  constructor() {
    this.lineageCache = new Map();
    // Initialize with sample data
    Object.entries(sampleLineageData).forEach(([key, value]) => {
      this.lineageCache.set(key, value);
    });
  }
  
  // Get lineage for a specific entity
  getLineage(entityId: string, depth: number = 3, direction: 'upstream' | 'downstream' | 'both' = 'both'): LineageGraph {
    // Check cache
    const cached = this.lineageCache.get(entityId);
    if (cached) {
      return cached;
    }
    
    // Generate lineage graph (in production, this would query the metadata store)
    return this.generateLineage(entityId, depth, direction);
  }
  
  // Generate lineage graph for an entity
  private generateLineage(entityId: string, depth: number, direction: string): LineageGraph {
    // This would typically query a metadata store or lineage tracking system
    // For demo, return a sample graph
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];
    
    // Add root node
    nodes.push({
      id: entityId,
      type: 'pipeline',
      name: entityId,
      metadata: {
        status: 'active'
      },
      position: { x: 500, y: 300 }
    });
    
    // Add upstream nodes
    if (direction === 'upstream' || direction === 'both') {
      nodes.push({
        id: `${entityId}-source-1`,
        type: 'source',
        name: 'Source System',
        metadata: {
          status: 'active'
        },
        position: { x: 200, y: 300 }
      });
      
      edges.push({
        id: `edge-up-1`,
        source: `${entityId}-source-1`,
        target: entityId,
        type: 'data-flow',
        metadata: {}
      });
    }
    
    // Add downstream nodes
    if (direction === 'downstream' || direction === 'both') {
      nodes.push({
        id: `${entityId}-dest-1`,
        type: 'destination',
        name: 'Target System',
        metadata: {
          status: 'active'
        },
        position: { x: 800, y: 300 }
      });
      
      edges.push({
        id: `edge-down-1`,
        source: entityId,
        target: `${entityId}-dest-1`,
        type: 'data-flow',
        metadata: {}
      });
    }
    
    return {
      nodes,
      edges,
      metadata: {
        version: '1.0.0',
        generated: new Date(),
        scope: 'pipeline',
        depth
      }
    };
  }
  
  // Perform impact analysis
  analyzeImpact(entityId: string, changeType: 'schema' | 'deletion' | 'quality' | 'maintenance'): LineageImpactAnalysis {
    const lineage = this.getLineage(entityId, 5, 'downstream');
    const affectedNodes = this.findDownstreamNodes(lineage, entityId);
    
    // Determine impact level based on affected nodes and change type
    let impactLevel: LineageImpactAnalysis['impactLevel'] = 'low';
    if (changeType === 'deletion' || affectedNodes.length > 10) {
      impactLevel = 'critical';
    } else if (changeType === 'schema' || affectedNodes.length > 5) {
      impactLevel = 'high';
    } else if (changeType === 'quality' || affectedNodes.length > 2) {
      impactLevel = 'medium';
    }
    
    // Generate recommendations
    const recommendations = this.generateImpactRecommendations(changeType, affectedNodes);
    
    return {
      affectedNodes,
      impactLevel,
      propagationPath: affectedNodes.map(n => n.id),
      estimatedDowntime: this.estimateDowntime(changeType, affectedNodes.length),
      recommendations
    };
  }
  
  // Find all downstream nodes from a starting point
  private findDownstreamNodes(lineage: LineageGraph, startNodeId: string): LineageNode[] {
    const visited = new Set<string>();
    const downstream: LineageNode[] = [];
    const queue = [startNodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      // Find edges from current node
      const outgoingEdges = lineage.edges.filter(e => e.source === currentId);
      
      outgoingEdges.forEach(edge => {
        const targetNode = lineage.nodes.find(n => n.id === edge.target);
        if (targetNode && !visited.has(targetNode.id)) {
          downstream.push(targetNode);
          queue.push(targetNode.id);
        }
      });
    }
    
    return downstream;
  }
  
  // Generate impact recommendations
  private generateImpactRecommendations(changeType: string, affectedNodes: LineageNode[]): string[] {
    const recommendations: string[] = [];
    
    switch (changeType) {
      case 'schema':
        recommendations.push('Notify all downstream consumers about schema changes');
        recommendations.push('Update transformation logic to handle new schema');
        recommendations.push('Test data quality after schema migration');
        break;
      case 'deletion':
        recommendations.push('Verify no critical dependencies before deletion');
        recommendations.push('Archive data before deletion if required');
        recommendations.push('Update documentation and notify stakeholders');
        break;
      case 'quality':
        recommendations.push('Run quality validation on affected data products');
        recommendations.push('Monitor downstream data quality metrics');
        recommendations.push('Consider implementing additional quality gates');
        break;
      case 'maintenance':
        recommendations.push('Schedule maintenance during low-traffic periods');
        recommendations.push('Prepare rollback plan');
        recommendations.push('Notify affected teams in advance');
        break;
    }
    
    if (affectedNodes.length > 5) {
      recommendations.push('Consider phased rollout due to high impact');
    }
    
    const criticalNodes = affectedNodes.filter(n => n.metadata.status === 'critical');
    if (criticalNodes.length > 0) {
      recommendations.unshift('⚠️ Critical systems affected - require executive approval');
    }
    
    return recommendations;
  }
  
  // Estimate downtime based on change type and scope
  private estimateDowntime(changeType: string, affectedNodeCount: number): number {
    const baseTime = {
      schema: 120,      // 2 hours
      deletion: 30,     // 30 minutes
      quality: 60,      // 1 hour
      maintenance: 180  // 3 hours
    };
    
    const time = baseTime[changeType] || 60;
    const scaleFactor = Math.log10(affectedNodeCount + 1) + 1;
    
    return Math.round(time * scaleFactor);
  }
  
  // Get data flow statistics
  getDataFlowStats(entityId: string): {
    totalVolume: number;
    avgLatency: number;
    qualityScore: number;
    updateFrequency: string;
  } {
    const lineage = this.getLineage(entityId);
    
    // Calculate statistics from edges
    const volumes = lineage.edges
      .filter(e => e.metadata.dataVolume)
      .map(e => e.metadata.dataVolume!);
    
    const latencies = lineage.edges
      .filter(e => e.metadata.latency)
      .map(e => e.metadata.latency!);
    
    const qualityScores = lineage.nodes
      .filter(n => n.metadata.quality)
      .map(n => n.metadata.quality!);
    
    return {
      totalVolume: volumes.reduce((sum, v) => sum + v, 0),
      avgLatency: latencies.length > 0 
        ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length 
        : 0,
      qualityScore: qualityScores.length > 0
        ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length
        : 0,
      updateFrequency: 'hourly' // Would be calculated from edge metadata
    };
  }
  
  // Search for entities in lineage
  searchLineage(query: string): LineageNode[] {
    const results: LineageNode[] = [];
    const queryLower = query.toLowerCase();
    
    this.lineageCache.forEach(graph => {
      graph.nodes.forEach(node => {
        if (
          node.name.toLowerCase().includes(queryLower) ||
          node.metadata.tags?.some(tag => tag.toLowerCase().includes(queryLower)) ||
          node.metadata.owner?.toLowerCase().includes(queryLower)
        ) {
          results.push(node);
        }
      });
    });
    
    return results;
  }
}

// Export singleton instance
export const lineageService = new DataLineageService();