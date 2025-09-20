import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BarChart3, Globe, Cpu, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ConsumerNode: React.FC<NodeProps> = ({ data, selected }) => {
  const getIcon = () => {
    switch (data.consumerType) {
      case 'dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'api': return <Globe className="h-4 w-4" />;
      case 'ml_model': return <Cpu className="h-4 w-4" />;
      case 'application': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getConsumerInfo = () => {
    if (data.consumerType === 'dashboard') return 'BI Dashboard';
    if (data.consumerType === 'api') return 'REST API';
    if (data.consumerType === 'ml_model') return 'ML Pipeline';
    if (data.consumerType === 'application') return 'Application';
    return 'Data Consumer';
  };

  return (
    <div className={cn(
      "px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[180px]",
      selected ? "border-cyan-500" : "border-gray-200"
    )}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-cyan-500 border-2 border-white"
      />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-100 rounded">
            {getIcon()}
          </div>
          <Badge variant="outline" className="text-xs">
            Consumer
          </Badge>
        </div>
        {data.config?.sla && (
          <Badge variant="secondary" className="text-xs">
            SLA: {data.config.sla}
          </Badge>
        )}
      </div>
      
      <div className="font-medium text-sm">{data.label || 'Data Consumer'}</div>
      <div className="text-xs text-gray-500 mt-1">{getConsumerInfo()}</div>
      
      {data.config?.endpoint && (
        <div className="text-xs text-gray-600 mt-2 font-mono bg-gray-50 px-2 py-1 rounded truncate">
          {data.config.endpoint}
        </div>
      )}
      
      {data.config?.users && (
        <div className="flex items-center gap-1 mt-2">
          <Users className="h-3 w-3 text-gray-500" />
          <span className="text-xs text-gray-600">{data.config.users} users</span>
        </div>
      )}
    </div>
  );
};

export default ConsumerNode;