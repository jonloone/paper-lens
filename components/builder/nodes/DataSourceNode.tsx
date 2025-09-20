import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, Zap, Cloud, Calendar, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DataSourceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const getIcon = () => {
    switch (data.sourceType) {
      case 'streaming': return <Zap className="h-4 w-4" />;
      case 'batch': return <Calendar className="h-4 w-4" />;
      case 'api': return <Globe className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      default: return <Cloud className="h-4 w-4" />;
    }
  };

  const getSourceDescription = () => {
    if (data.config?.system === 'kafka') return 'Kafka Stream';
    if (data.config?.system === 's3') return 'S3 Bucket';
    if (data.config?.system === 'postgres') return 'PostgreSQL';
    if (data.config?.system === 'api') return 'REST API';
    return 'Data Source';
  };

  return (
    <div className={cn(
      "px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[180px]",
      selected ? "border-blue-500" : "border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded">
            {getIcon()}
          </div>
          <Badge variant="outline" className="text-xs">
            Source
          </Badge>
        </div>
        {data.config?.format && (
          <Badge variant="secondary" className="text-xs">
            {data.config.format}
          </Badge>
        )}
      </div>
      
      <div className="font-medium text-sm">{data.label || 'Data Source'}</div>
      <div className="text-xs text-gray-500 mt-1">{getSourceDescription()}</div>
      
      {data.config?.topic && (
        <div className="text-xs text-gray-600 mt-2 font-mono bg-gray-50 px-2 py-1 rounded">
          {data.config.topic}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};

export default DataSourceNode;