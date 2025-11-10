'use client';

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface RechartsAreaData {
  name: string | number;
  value: number;
  [key: string]: any;
}

interface RechartsAreaProps {
  data: RechartsAreaData[];
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  areaColor?: string;
}

/**
 * Simple Area Chart using Recharts
 * Great for showing trends with volume/magnitude
 */
export function RechartsArea({
  data,
  width,
  height = 300,
  xAxisLabel,
  yAxisLabel,
  areaColor = '#8b5cf6',
}: RechartsAreaProps) {
  return (
    <ResponsiveContainer width={width || '100%'} height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={areaColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={areaColor} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="name"
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af' }}
        />
        <YAxis
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
          }}
          labelStyle={{ color: '#f9fafb' }}
        />
        <Legend wrapperStyle={{ color: '#9ca3af' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={areaColor}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
