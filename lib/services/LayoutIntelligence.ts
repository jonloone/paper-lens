import { RealNode, RealEdge, LayoutStrategy } from '@/lib/types/RealNode';

interface Position {
  x: number;
  y: number;
}

interface LayoutGroup {
  name: string;
  nodes: string[];
  order: number;
  type: 'source' | 'processing' | 'sink' | 'parallel';
}

interface PipelinePattern {
  type: 'linear' | 'fan-out-fan-in' | 'staged' | 'complex-dag' | 'star' | 'mesh';
  characteristics: {
    stages: number;
    parallelism: number;
    complexity: number;
    fanOut: number;
    fanIn: number;
  };
}

export class LayoutIntelligence {
  /**
   * Analyze pipeline structure and determine optimal layout strategy
   */
  async analyzePipeline(nodes: RealNode[], edges: RealEdge[]): Promise<LayoutStrategy> {
    const pattern = this.detectPipelinePattern(nodes, edges);
    
    switch (pattern.type) {
      case 'linear':
        return {
          algorithm: 'dagre',
          direction: 'LR',
          spacing: { x: 180, y: 100 },
          grouping: 'none',
          layering: 'longest-path'
        };
        
      case 'fan-out-fan-in':
        return {
          algorithm: 'elk',
          direction: 'TB',
          spacing: { x: 120, y: 120 },
          grouping: 'parallel-paths',
          layering: 'network-simplex'
        };
        
      case 'staged':
        return {
          algorithm: 'dagre',
          direction: 'LR',
          spacing: { x: 220, y: 80 },
          grouping: 'by-stage',
          layering: 'longest-path'
        };
        
      case 'star':
        return {
          algorithm: 'force',
          direction: 'TB',
          spacing: { x: 150, y: 150 },
          grouping: 'by-tool'
        };
        
      case 'complex-dag':
      default:
        return {
          algorithm: 'elk',
          direction: 'TB',
          spacing: { x: 140, y: 100 },
          grouping: 'by-stage',
          layering: 'longest-path'
        };
    }
  }

  /**
   * Detect pipeline pattern based on structure
   */
  private detectPipelinePattern(nodes: RealNode[], edges: RealEdge[]): PipelinePattern {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    
    // Build adjacency lists
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    
    for (const edge of edges) {
      if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
      if (!incoming.has(edge.target)) incoming.set(edge.target, []);
      
      outgoing.get(edge.source)!.push(edge.target);
      incoming.get(edge.target)!.push(edge.source);
    }

    // Calculate metrics
    const sources = nodes.filter(n => !incoming.has(n.id) || incoming.get(n.id)!.length === 0);
    const sinks = nodes.filter(n => !outgoing.has(n.id) || outgoing.get(n.id)!.length === 0);
    
    const maxFanOut = Math.max(...nodes.map(n => outgoing.get(n.id)?.length || 0));
    const maxFanIn = Math.max(...nodes.map(n => incoming.get(n.id)?.length || 0));
    
    const avgFanOut = edges.length / Math.max(nodes.length - sinks.length, 1);
    const stages = this.calculateStageDepth(nodes, edges);
    
    // Determine pattern
    if (nodeCount <= 5 && maxFanOut <= 1 && maxFanIn <= 1) {
      return {
        type: 'linear',
        characteristics: {
          stages: nodeCount,
          parallelism: 1,
          complexity: 1,
          fanOut: maxFanOut,
          fanIn: maxFanIn
        }
      };
    }
    
    if (sources.length === 1 && sinks.length === 1 && maxFanOut > 2 && stages >= 3) {
      return {
        type: 'fan-out-fan-in',
        characteristics: {
          stages,
          parallelism: maxFanOut,
          complexity: 2,
          fanOut: maxFanOut,
          fanIn: maxFanIn
        }
      };
    }
    
    if (stages >= 3 && avgFanOut < 2 && this.hasDistinctStages(nodes, edges)) {
      return {
        type: 'staged',
        characteristics: {
          stages,
          parallelism: Math.ceil(nodeCount / stages),
          complexity: 2,
          fanOut: maxFanOut,
          fanIn: maxFanIn
        }
      };
    }
    
    if (sources.length === 1 && maxFanOut > 3) {
      return {
        type: 'star',
        characteristics: {
          stages: 2,
          parallelism: maxFanOut,
          complexity: 2,
          fanOut: maxFanOut,
          fanIn: maxFanIn
        }
      };
    }
    
    return {
      type: 'complex-dag',
      characteristics: {
        stages,
        parallelism: Math.ceil(nodeCount / stages),
        complexity: 3,
        fanOut: maxFanOut,
        fanIn: maxFanIn
      }
    };
  }

  /**
   * Calculate stage depth of pipeline
   */
  private calculateStageDepth(nodes: RealNode[], edges: RealEdge[]): number {
    const incoming = new Map<string, string[]>();
    
    for (const edge of edges) {
      if (!incoming.has(edge.target)) incoming.set(edge.target, []);
      incoming.get(edge.target)!.push(edge.source);
    }

    // Find sources (nodes with no incoming edges)
    const sources = nodes.filter(n => !incoming.has(n.id) || incoming.get(n.id)!.length === 0);
    
    // BFS to find maximum depth
    const depths = new Map<string, number>();
    const queue = sources.map(s => ({ id: s.id, depth: 0 }));
    
    for (const source of sources) {
      depths.set(source.id, 0);
    }
    
    let maxDepth = 0;
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      maxDepth = Math.max(maxDepth, depth);
      
      // Find nodes that depend on this node
      for (const edge of edges) {
        if (edge.source === id) {
          const targetDepth = depth + 1;
          const currentDepth = depths.get(edge.target) || 0;
          
          if (targetDepth > currentDepth) {
            depths.set(edge.target, targetDepth);
            queue.push({ id: edge.target, depth: targetDepth });
          }
        }
      }
    }
    
    return maxDepth + 1;
  }

  /**
   * Check if pipeline has distinct processing stages
   */
  private hasDistinctStages(nodes: RealNode[], edges: RealEdge[]): boolean {
    const stages = this.identifyStages(nodes, edges);
    return stages.length >= 3 && stages.some(s => s.type === 'source') && stages.some(s => s.type === 'sink');
  }

  /**
   * Identify logical stages in the pipeline
   */
  identifyStages(nodes: RealNode[], edges: RealEdge[]): LayoutGroup[] {
    const stages: LayoutGroup[] = [];
    
    // Categorize nodes by type patterns
    const sourceNodes = nodes.filter(n => this.isSourceNodeType(n.type));
    const sinkNodes = nodes.filter(n => this.isSinkNodeType(n.type));
    const processingNodes = nodes.filter(n => !this.isSourceNodeType(n.type) && !this.isSinkNodeType(n.type));
    
    // Add source stage
    if (sourceNodes.length > 0) {
      stages.push({
        name: 'Data Sources',
        nodes: sourceNodes.map(n => n.id),
        order: 0,
        type: 'source'
      });
    }
    
    // Group processing nodes by dependency depth
    const processingStages = this.groupProcessingNodesByDepth(processingNodes, edges);
    stages.push(...processingStages);
    
    // Add sink stage
    if (sinkNodes.length > 0) {
      stages.push({
        name: 'Data Sinks',
        nodes: sinkNodes.map(n => n.id),
        order: stages.length,
        type: 'sink'
      });
    }
    
    return stages;
  }

  /**
   * Group processing nodes by their dependency depth
   */
  private groupProcessingNodesByDepth(processingNodes: RealNode[], edges: RealEdge[]): LayoutGroup[] {
    const stages: LayoutGroup[] = [];
    
    // Calculate dependency depth for each processing node
    const depths = new Map<string, number>();
    
    // Simple depth calculation - could be more sophisticated
    for (const node of processingNodes) {
      const incomingEdges = edges.filter(e => e.target === node.id);
      depths.set(node.id, incomingEdges.length);
    }
    
    // Group by depth
    const depthGroups = new Map<number, string[]>();
    for (const [nodeId, depth] of depths) {
      if (!depthGroups.has(depth)) depthGroups.set(depth, []);
      depthGroups.get(depth)!.push(nodeId);
    }
    
    // Convert to stages
    let stageIndex = 1; // Start after sources
    for (const [depth, nodeIds] of Array.from(depthGroups.entries()).sort(([a], [b]) => a - b)) {
      stages.push({
        name: `Processing Stage ${stageIndex}`,
        nodes: nodeIds,
        order: stageIndex,
        type: 'processing'
      });
      stageIndex++;
    }
    
    return stages;
  }

  /**
   * Suggest position for new node based on context
   */
  suggestPosition(
    newNodeType: string,
    existingNodes: RealNode[],
    edges: RealEdge[]
  ): Position {
    if (existingNodes.length === 0) {
      return { x: 100, y: 100 };
    }

    const nodeCategory = this.categorizeNodeType(newNodeType);
    
    switch (nodeCategory) {
      case 'source':
        return this.findSourcePosition(existingNodes);
      case 'sink':
        return this.findSinkPosition(existingNodes);
      case 'processing':
      default:
        return this.findProcessingPosition(newNodeType, existingNodes, edges);
    }
  }

  /**
   * Find optimal position for source node
   */
  private findSourcePosition(existingNodes: RealNode[]): Position {
    // Find leftmost position and place source to the left
    const leftmost = Math.min(...existingNodes.map(n => n.position.x));
    const avgY = existingNodes.reduce((sum, n) => sum + n.position.y, 0) / existingNodes.length;
    
    return {
      x: leftmost - 200,
      y: avgY
    };
  }

  /**
   * Find optimal position for sink node
   */
  private findSinkPosition(existingNodes: RealNode[]): Position {
    // Find rightmost position and place sink to the right
    const rightmost = Math.max(...existingNodes.map(n => n.position.x));
    const avgY = existingNodes.reduce((sum, n) => sum + n.position.y, 0) / existingNodes.length;
    
    return {
      x: rightmost + 200,
      y: avgY
    };
  }

  /**
   * Find optimal position for processing node
   */
  private findProcessingPosition(
    nodeType: string,
    existingNodes: RealNode[],
    edges: RealEdge[]
  ): Position {
    // Try to find similar nodes and place nearby
    const similarNodes = existingNodes.filter(n => 
      this.getNodeCategory(n.type) === this.getNodeCategory(nodeType)
    );
    
    if (similarNodes.length > 0) {
      const avgX = similarNodes.reduce((sum, n) => sum + n.position.x, 0) / similarNodes.length;
      const avgY = similarNodes.reduce((sum, n) => sum + n.position.y, 0) / similarNodes.length;
      
      return {
        x: avgX,
        y: avgY + 120 // Offset to avoid overlap
      };
    }
    
    // Fall back to center position
    const avgX = existingNodes.reduce((sum, n) => sum + n.position.x, 0) / existingNodes.length;
    const avgY = existingNodes.reduce((sum, n) => sum + n.position.y, 0) / existingNodes.length;
    
    return { x: avgX, y: avgY };
  }

  /**
   * Auto-connect when dropping node between existing nodes
   */
  autoConnect(
    droppedNode: RealNode,
    nearbyNodes: RealNode[],
    edges: RealEdge[]
  ): RealEdge[] {
    const threshold = 120; // pixels
    const newEdges: RealEdge[] = [];
    
    // Find nodes within threshold
    const upstream = nearbyNodes.find(n => 
      n.position.x < droppedNode.position.x &&
      Math.abs(n.position.y - droppedNode.position.y) < threshold
    );
    
    const downstream = nearbyNodes.find(n =>
      n.position.x > droppedNode.position.x &&
      Math.abs(n.position.y - droppedNode.position.y) < threshold
    );
    
    if (upstream && downstream) {
      // Check if there's an existing edge between upstream and downstream
      const existingEdge = edges.find(e => 
        e.source === upstream.id && e.target === downstream.id
      );
      
      if (existingEdge) {
        // Splice into existing flow
        newEdges.push(
          {
            id: `${upstream.id}-${droppedNode.id}`,
            source: upstream.id,
            target: droppedNode.id,
            animated: true
          },
          {
            id: `${droppedNode.id}-${downstream.id}`,
            source: droppedNode.id,
            target: downstream.id,
            animated: true
          }
        );
      }
    } else if (upstream) {
      // Connect to upstream only
      newEdges.push({
        id: `${upstream.id}-${droppedNode.id}`,
        source: upstream.id,
        target: droppedNode.id,
        animated: true
      });
    } else if (downstream) {
      // Connect to downstream only
      newEdges.push({
        id: `${droppedNode.id}-${downstream.id}`,
        source: droppedNode.id,
        target: downstream.id,
        animated: true
      });
    }
    
    return newEdges;
  }

  /**
   * Apply layout strategy to nodes
   */
  async applyLayout(
    nodes: RealNode[],
    edges: RealEdge[],
    strategy: LayoutStrategy
  ): Promise<{ nodes: RealNode[]; edges: RealEdge[] }> {
    switch (strategy.algorithm) {
      case 'dagre':
        return this.applyDagreLayout(nodes, edges, strategy);
      case 'elk':
        return this.applyElkLayout(nodes, edges, strategy);
      case 'force':
        return this.applyForceLayout(nodes, edges, strategy);
      default:
        return { nodes, edges };
    }
  }

  /**
   * Apply Dagre layout algorithm
   */
  private applyDagreLayout(
    nodes: RealNode[],
    edges: RealEdge[],
    strategy: LayoutStrategy
  ): { nodes: RealNode[]; edges: RealEdge[] } {
    // Simple implementation - in production would use actual Dagre library
    const positioned = [...nodes];
    
    if (strategy.grouping === 'by-stage') {
      const stages = this.identifyStages(nodes, edges);
      let currentX = 100;
      
      for (const stage of stages) {
        let currentY = 100;
        
        for (const nodeId of stage.nodes) {
          const node = positioned.find(n => n.id === nodeId);
          if (node) {
            node.position = { x: currentX, y: currentY };
            currentY += strategy.spacing.y;
          }
        }
        
        currentX += strategy.spacing.x;
      }
    } else {
      // Simple linear layout
      nodes.forEach((node, index) => {
        if (strategy.direction === 'LR') {
          positioned[index].position = {
            x: 100 + index * strategy.spacing.x,
            y: 100
          };
        } else {
          positioned[index].position = {
            x: 100,
            y: 100 + index * strategy.spacing.y
          };
        }
      });
    }
    
    return { nodes: positioned, edges };
  }

  /**
   * Apply ELK layout algorithm (simplified)
   */
  private applyElkLayout(
    nodes: RealNode[],
    edges: RealEdge[],
    strategy: LayoutStrategy
  ): { nodes: RealNode[]; edges: RealEdge[] } {
    // Simplified ELK-style layout
    return this.applyDagreLayout(nodes, edges, strategy);
  }

  /**
   * Apply force-directed layout
   */
  private applyForceLayout(
    nodes: RealNode[],
    edges: RealEdge[],
    strategy: LayoutStrategy
  ): { nodes: RealNode[]; edges: RealEdge[] } {
    // Simple force-directed positioning
    const positioned = [...nodes];
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    positioned.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      node.position = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    return { nodes: positioned, edges };
  }

  /**
   * Helper methods for node categorization
   */
  private isSourceNodeType(type: string): boolean {
    const sourcePatterns = [
      'kafka.consumer', 'kafka.source',
      'file.source', 'database.source',
      's3.source', 'api.source',
      'webhook.source', 'stream.source'
    ];
    
    return sourcePatterns.some(pattern => type.includes(pattern.split('.')[1]));
  }

  private isSinkNodeType(type: string): boolean {
    const sinkPatterns = [
      'kafka.producer', 'kafka.sink',
      'file.sink', 'database.sink',
      's3.sink', 'warehouse.sink',
      'api.sink', 'notification.sink'
    ];
    
    return sinkPatterns.some(pattern => type.includes(pattern.split('.')[1]));
  }

  private categorizeNodeType(type: string): 'source' | 'processing' | 'sink' {
    if (this.isSourceNodeType(type)) return 'source';
    if (this.isSinkNodeType(type)) return 'sink';
    return 'processing';
  }

  private getNodeCategory(type: string): string {
    const parts = type.split('.');
    return parts[0] || 'generic';
  }
}