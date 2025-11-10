'use client';

import React, { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatLabel, formatNumber, getAxisLabelProps } from '@/lib/utils/chart-formatting';

export interface RechartsLineData {
  name: string | number;
  value: number;
  [key: string]: any;
}

interface RechartsLineProps {
  data: RechartsLineData[];
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  lineColor?: string;
}

/**
 * Enhanced Line Chart with smart formatting
 * Perfect for time series and trend visualization
 */
export function RechartsLine({
  data,
  width,
  height = 300,
  xAxisLabel,
  yAxisLabel,
  lineColor = '#10b981',
}: RechartsLineProps) {
  const xAxisProps = useMemo(() => {
    const labels = data.map(d => d.name);
    return getAxisLabelProps(labels);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
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
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
