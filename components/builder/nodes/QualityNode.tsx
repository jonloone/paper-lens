import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const QualityNode: React.FC<NodeProps> = ({ data, selected }) => {
  const getRules = () => {
    if (data.rules && Array.isArray(data.rules)) {
      return data.rules.join(', ');
    }
    return 'Quality Checks';
  };

  const getThresholdBadge = () => {
    if (data.config?.thresholds?.completeness) {
      const threshold = data.config.thresholds.completeness;
      return (
        <Badge 
          variant={threshold >= 0.95 ? "secondary" : "outline"} 
          className="text-xs"
        >
          {(threshold * 100).toFixed(0)}%
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className={cn(
      "px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[180px]",
      selected ? "border-green-500" : "border-gray-200"
    )}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded">
            <Shield className="h-4 w-4 text-green-600" />
          </div>
          <Badge variant="outline" className="text-xs">
            Quality
          </Badge>
        </div>
        {getThresholdBadge()}
      </div>
      
      <div className="font-medium text-sm">{data.label || 'Quality Gate'}</div>
      <div className="text-xs text-gray-500 mt-1">{getRules()}</div>
      
      {data.config && (
        <div className="space-y-1 mt-2">
          {data.config.nullCheck && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs">Null checks</span>
            </div>
          )}
          {data.config.schemaValidation && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs">Schema validation</span>
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
};

export default QualityNode;