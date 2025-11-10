'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface RechartsPieData {
  name: string;
  value: number;
}

interface RechartsPieProps {
  data: RechartsPieData[];
  width?: number;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

/**
 * Simple Pie Chart using Recharts
 * Great for showing proportions and distributions
 */
export function RechartsPie({
  data,
  width,
  height = 300,
  colors = DEFAULT_COLORS,
}: RechartsPieProps) {
  return (
    <ResponsiveContainer width={width || '100%'} height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
          }}
          labelStyle={{ color: '#f9fafb' }}
        />
        <Legend wrapperStyle={{ color: '#9ca3af' }} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
