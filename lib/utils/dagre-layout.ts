// Dagre Layout Utility for automatic graph positioning
import dagre from 'dagre';
import { Node, Edge } from 'reactflow';

export interface LayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  nodesep?: number;  // Separation between nodes in same rank
  ranksep?: number;  // Separation between ranks
  marginx?: number;
  marginy?: number;
  swimlanes?: boolean;
}

const defaultOptions: LayoutOptions = {
  direction: 'LR',
  nodeWidth: 200,
  nodeHeight: 80,
  nodesep: 50,
  ranksep: 150,
  marginx: 20,
  marginy: 20,
  swimlanes: true
};

// Apply Dagre layout to nodes and edges
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...defaultOptions, ...options };
  const g = new dagre.graphlib.Graph();
  
  // Set graph options
  g.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodesep,
    ranksep: opts.ranksep,
    marginx: opts.marginx,
    marginy: opts.marginy
  });
  
  g.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes to graph
  nodes.forEach((node) => {
    g.setNode(node.id, { 
      width: opts.nodeWidth, 
      height: opts.nodeHeight
    });
  });
  
  // Add edges to graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });
  
  // Run the layout algorithm
  dagre.layout(g);
  
  // Apply the computed layout to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    
    if (!nodeWithPosition) {
      return node;
    }
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth! / 2,
        y: nodeWithPosition.y - opts.nodeHeight! / 2
      }
    };
  });
  
  return { nodes: layoutedNodes, edges };
}

// Apply swimlane-based layout
export function applySwimlaneLayout(
  nodes: Node[],
  edges: Edge[],
  lanes: Record<string, { x: number; label: string }>
): { nodes: Node[]; edges: Edge[] } {
  // Group nodes by their lane/category
  const laneGroups: Record<string, Node[]> = {};
  
  nodes.forEach((node) => {
    const lane = node.data?.lane || 'default';
    if (!laneGroups[lane]) {
      laneGroups[lane] = [];
    }
    laneGroups[lane].push(node);
  });
  
  // Position nodes within each lane
  const layoutedNodes: Node[] = [];
  
  Object.entries(laneGroups).forEach(([lane, laneNodes]) => {
    const laneConfig = lanes[lane] || { x: 500, label: lane };
    const startY = 100;
    const nodeSpacing = 120;
    
    // Sort nodes by their dependencies to minimize edge crossings
    const sortedNodes = topologicalSort(laneNodes, edges);
    
    sortedNodes.forEach((node, index) => {
      layoutedNodes.push({
        ...node,
        position: {
          x: laneConfig.x,
          y: startY + (index * nodeSpacing)
        }
      });
    });
  });
  
  return { nodes: layoutedNodes, edges };
}

// Topological sort for minimizing edge crossings
function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  
  // Initialize
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  });
  
  // Build adjacency list and calculate in-degrees
  edges.forEach(edge => {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      adjList.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  });
  
  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  const sorted: Node[] = [];
  
  // Find all nodes with no incoming edges
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      sorted.push(node);
    }
    
    // Reduce in-degree for neighbors
    adjList.get(nodeId)?.forEach(neighbor => {
      const degree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, degree);
      
      if (degree === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  // Add any remaining nodes (in case of cycles)
  nodes.forEach(node => {
    if (!sorted.some(n => n.id === node.id)) {
      sorted.push(node);
    }
  });
  
  return sorted;
}

// Calculate optimal graph bounds
export function calculateGraphBounds(nodes: Node[]): {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
} {
  if (nodes.length === 0) {
    return { width: 0, height: 0, centerX: 0, centerY: 0 };
  }
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.width || 200;
    const height = node.height || 80;
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x + width);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + height);
  });
  
  return {
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

// Group nodes by tool type for better organization
export function groupNodesByTool(nodes: Node[]): Record<string, Node[]> {
  const groups: Record<string, Node[]> = {};
  
  nodes.forEach(node => {
    const toolType = node.data?.toolType || 'unknown';
    if (!groups[toolType]) {
      groups[toolType] = [];
    }
    groups[toolType].push(node);
  });
  
  return groups;
}

// Calculate edge path style based on connection type
export function getEdgeStyle(edge: Edge): {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated?: boolean;
} {
  const edgeType = edge.data?.edgeType || edge.type;
  
  switch (edgeType) {
    case 'data-flow':
      return {
        stroke: '#2563eb',
        strokeWidth: 2,
        animated: edge.data?.metadata?.frequency === 'streaming'
      };
    
    case 'trigger':
      return {
        stroke: '#16a34a',
        strokeWidth: 2,
        strokeDasharray: '5 5'
      };
    
    case 'dependency':
      return {
        stroke: '#dc2626',
        strokeWidth: 1.5
      };
    
    case 'transformation':
      return {
        stroke: '#9333ea',
        strokeWidth: 2,
        animated: true
      };
    
    case 'quality-check':
      return {
        stroke: '#f59e0b',
        strokeWidth: 2,
        strokeDasharray: '3 3'
      };
    
    default:
      return {
        stroke: '#6b7280',
        strokeWidth: 1.5
      };
  }
}