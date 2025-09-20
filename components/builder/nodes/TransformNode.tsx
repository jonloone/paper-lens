import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Sparkles, Filter, Calculator, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TransformNode: React.FC<NodeProps> = ({ data, selected }) => {
  const getIcon = () => {
    switch (data.transformType) {
      case 'enrichment': return <Sparkles className="h-4 w-4" />;
      case 'filter': return <Filter className="h-4 w-4" />;
      case 'aggregate': return <Calculator className="h-4 w-4" />;
      case 'join': return <Layers className="h-4 w-4" />;
      default: return <GitBranch className="h-4 w-4" />;
    }
  };

  const getOperations = () => {
    if (data.config?.operations) {
      return data.config.operations.join(', ');
    }
    return 'Transform';
  };

  return (
    <div className={cn(
      "px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[180px]",
      selected ? "border-purple-500" : "border-gray-200"
    )}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded">
            {getIcon()}
          </div>
          <Badge variant="outline" className="text-xs">
            Transform
          </Badge>
        </div>
        {data.config?.window && (
          <Badge variant="secondary" className="text-xs">
            {data.config.window}
          </Badge>
        )}
      </div>
      
      <div className="font-medium text-sm">{data.label || 'Transformation'}</div>
      <div className="text-xs text-gray-500 mt-1">{getOperations()}</div>
      
      {data.config?.operations && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.config.operations.map((op: string, idx: number) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {op}
            </Badge>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  );
};

export default TransformNode;