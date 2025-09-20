import React from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
  showArea?: boolean;
}

export function Sparkline({ 
  data, 
  width = 100, 
  height = 20, 
  className,
  color = 'currentColor',
  strokeWidth = 1.5,
  showArea = true
}: SparklineProps) {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Calculate points for the line
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  // Create area path if needed
  const areaPath = showArea ? `
    M 0,${height} 
    L ${points} 
    L ${width},${height} 
    Z
  ` : '';
  
  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {showArea && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.1}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface MiniSparklineProps {
  data: number[];
  height?: number;
  className?: string;
  trend?: boolean;
}

export function MiniSparkline({ 
  data, 
  height = 16,
  className,
  trend = true
}: MiniSparklineProps) {
  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const isUp = lastValue > firstValue;
  
  return (
    <div className={cn("w-full", className)}>
      <Sparkline
        data={data}
        height={height}
        color={trend ? (isUp ? '#10b981' : '#ef4444') : undefined}
        showArea
      />
    </div>
  );
}