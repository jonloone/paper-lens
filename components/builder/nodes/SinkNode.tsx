import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, HardDrive, Cloud, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SinkNode: React.FC<NodeProps> = ({ data, selected }) => {
  const getIcon = () => {
    switch (data.sinkType) {
      case 'lakehouse': return <Database className="h-4 w-4" />;
      case 'warehouse': return <Package className="h-4 w-4" />;
      case 'object_store': return <Cloud className="h-4 w-4" />;
      case 'database': return <HardDrive className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getDestinationInfo = () => {
    if (data.config?.format === 'iceberg') return 'Apache Iceberg';
    if (data.config?.format === 'delta') return 'Delta Lake';
    if (data.config?.format === 'parquet') return 'Parquet Files';
    if (data.config?.format === 'postgres') return 'PostgreSQL';
    return 'Data Store';
  };

  return (
    <div className={cn(
      "px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[180px]",
      selected ? "border-orange-500" : "border-gray-200"
    )}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-100 rounded">
            {getIcon()}
          </div>
          <Badge variant="outline" className="text-xs">
            Sink
          </Badge>
        </div>
        {data.config?.format && (
          <Badge variant="secondary" className="text-xs">
            {data.config.format}
          </Badge>
        )}
      </div>
      
      <div className="font-medium text-sm">{data.label || 'Data Sink'}</div>
      <div className="text-xs text-gray-500 mt-1">{getDestinationInfo()}</div>
      
      {data.config?.path && (
        <div className="text-xs text-gray-600 mt-2 font-mono bg-gray-50 px-2 py-1 rounded truncate">
          {data.config.path}
        </div>
      )}
      
      {data.config?.partitioning && (
        <div className="flex items-center gap-1 mt-2">
          <Badge variant="outline" className="text-xs">
            Partitioned: {data.config.partitioning}
          </Badge>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
    </div>
  );
};

export default SinkNode;