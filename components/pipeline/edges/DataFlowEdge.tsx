'use client';

import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
import { Badge } from '@/components/ui/badge';

interface DataFlowEdgeData {
  label?: string;
  condition?: string;
  dataFlow?: {
    records?: number;
    bytes?: number;
    latency?: number;
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getLatencyColor = (latency?: number): string => {
  if (!latency) return '#6B7280';
  if (latency < 100) return '#10B981'; // Green - fast
  if (latency < 1000) return '#F59E0B'; // Yellow - moderate  
  return '#EF4444'; // Red - slow
};

export const DataFlowEdge: React.FC<EdgeProps<DataFlowEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dataFlow = data?.dataFlow;
  const hasDataFlow = dataFlow && (dataFlow.records || 0) > 0;

  // Calculate edge thickness based on record count
  const thickness = hasDataFlow 
    ? Math.min(8, Math.max(2, Math.log(dataFlow.records || 1) * 0.8))
    : 2;

  // Get color based on latency
  const edgeColor = hasDataFlow 
    ? getLatencyColor(dataFlow.latency)
    : '#6B7280';

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: thickness,
          stroke: edgeColor,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {hasDataFlow && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: '11px',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="bg-white border border-gray-200 rounded-md shadow-sm px-2 py-1">
              <div className="flex flex-col items-center gap-1">
                {dataFlow.records && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {formatNumber(dataFlow.records)} records
                  </Badge>
                )}
                {dataFlow.latency && (
                  <div 
                    className="text-xs font-medium"
                    style={{ color: edgeColor }}
                  >
                    {dataFlow.latency}ms
                  </div>
                )}
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Condition label for branching edges */}
      {data?.condition && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 20}px)`,
              fontSize: '10px',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <Badge variant="secondary" className="text-xs">
              {data.condition}
            </Badge>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default DataFlowEdge;