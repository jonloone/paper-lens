'use client';

import React, { useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatLabel, formatNumber, getAxisLabelProps } from '@/lib/utils/chart-formatting';

export interface RechartsBarData {
  name: string;
  value: number;
  [key: string]: any;
}

interface RechartsBarProps {
  data: RechartsBarData[];
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  barColor?: string;
}

/**
 * Enhanced Bar Chart with smart formatting
 * - Responsive width (100%)
 * - Auto-rotating labels for long text
 * - Number formatting with commas
 * - Date formatting (Jan 2024, etc.)
 */
export function RechartsBar({
  data,
  width,
  height = 300,
  xAxisLabel,
  yAxisLabel,
  barColor = '#3b82f6',
}: RechartsBarProps) {
  // Calculate axis label formatting based on data
  const xAxisProps = useMemo(() => {
    const labels = data.map(d => d.name);
    return getAxisLabelProps(labels);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 60,
          bottom: xAxisProps.height,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="name"
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickFormatter={formatLabel}
          angle={xAxisProps.angle}
          textAnchor={xAxisProps.textAnchor}
          height={xAxisProps.height}
          label={xAxisLabel ? {
            value: xAxisLabel,
            position: 'insideBottom',
            offset: -5,
            style: { fill: '#9ca3af', fontSize: 11, fontWeight: 600 }
          } : undefined}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickFormatter={(value: number) => formatNumber(value, 'compact')}
          label={yAxisLabel ? {
            value: yAxisLabel,
            angle: -90,
            position: 'insideLeft',
            style: { fill: '#9ca3af', fontSize: 11, fontWeight: 600 }
          } : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: '#f9fafb', fontWeight: 600, marginBottom: 4 }}
          formatter={(value: number) => [formatNumber(value, 'precise'), yAxisLabel || 'Value']}
          labelFormatter={formatLabel}
        />
        <Legend
          wrapperStyle={{ color: '#9ca3af', paddingTop: 10 }}
          formatter={() => yAxisLabel || 'Value'}
        />
        <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
