import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { NodeTypeDefinition } from '@/lib/services/NodeTypeRegistry';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  nodeTypes: NodeTypeDefinition[];
  className?: string;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ nodeTypes, className }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Group node types by category
  const categorizedNodes = useMemo(() => {
    const categories: Record<string, NodeTypeDefinition[]> = {};
    
    for (const nodeType of nodeTypes) {
      if (!categories[nodeType.category]) {
        categories[nodeType.category] = [];
      }
      categories[nodeType.category].push(nodeType);
    }
    
    // Sort categories and nodes within each category
    const sortedCategories: Record<string, NodeTypeDefinition[]> = {};
    Object.keys(categories).sort().forEach(cat => {
      sortedCategories[cat] = categories[cat].sort((a, b) => {
        const labelA = a.label || a.type || '';
        const labelB = b.label || b.type || '';
        return labelA.localeCompare(labelB);
      });
    });
    
    return sortedCategories;
  }, [nodeTypes]);
  
  // Filter nodes based on search
  const filteredCategories = useMemo(() => {
    if (!search) return categorizedNodes;
    
    const filtered: Record<string, NodeTypeDefinition[]> = {};
    
    Object.entries(categorizedNodes).forEach(([category, nodes]) => {
      const matchingNodes = nodes.filter(node =>
        (node.label || '').toLowerCase().includes(search.toLowerCase()) ||
        (node.type || '').toLowerCase().includes(search.toLowerCase()) ||
        category.toLowerCase().includes(search.toLowerCase())
      );
      
      if (matchingNodes.length > 0) {
        filtered[category] = matchingNodes;
      }
    });
    
    return filtered;
  }, [categorizedNodes, search]);
  
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('nodeType', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Category colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      nifi: 'text-blue-600 bg-blue-50',
      spark: 'text-orange-600 bg-orange-50',
      dbt: 'text-teal-600 bg-teal-50',
      kafka: 'text-purple-600 bg-purple-50',
      flink: 'text-indigo-600 bg-indigo-50',
      airflow: 'text-pink-600 bg-pink-50',
      snowflake: 'text-cyan-600 bg-cyan-50',
      postgres: 'text-green-600 bg-green-50',
      s3: 'text-yellow-600 bg-yellow-50',
      trino: 'text-rose-600 bg-rose-50'
    };
    return colors[category] || 'text-gray-600 bg-gray-50';
  };
  
  // Auto-expand categories when searching
  React.useEffect(() => {
    if (search) {
      setExpandedCategories(new Set(Object.keys(filteredCategories)));
    }
  }, [search, filteredCategories]);
  
  return (
    <div className={cn("w-72 bg-background border-r flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-3">Components</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        {/* Stats */}
        <div className="mt-3 text-xs text-muted-foreground">
          {Object.keys(filteredCategories).length} categories • {
            Object.values(filteredCategories).reduce((sum, nodes) => sum + nodes.length, 0)
          } components
        </div>
      </div>
      
      {/* Categories and Nodes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.entries(filteredCategories).map(([category, nodes]) => (
          <div key={category} className="space-y-1">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={cn(
                  "text-sm font-medium px-2 py-0.5 rounded",
                  getCategoryColor(category)
                )}>
                  {category.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({nodes.length})
                </span>
              </div>
            </button>
            
            {/* Nodes */}
            {expandedCategories.has(category) && (
              <div className="ml-6 space-y-1">
                {nodes.map(nodeType => (
                  <div
                    key={nodeType.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, nodeType.type)}
                    className={cn(
                      "group p-2 bg-card border rounded-md cursor-move",
                      "hover:shadow-md hover:border-primary/50 transition-all",
                      "flex items-center gap-2"
                    )}
                    title={`Drag to add ${nodeType.label || nodeType.type}`}
                  >
                    <span className="text-lg flex-shrink-0" title={nodeType.category}>
                      {nodeType.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {nodeType.label || nodeType.type}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {nodeType.type}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No components found</p>
            {search && (
              <p className="text-xs mt-1">Try a different search term</p>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Drag components to canvas</span>
          <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
            {nodeTypes.length} total
          </span>
        </div>
      </div>
    </div>
  );
};