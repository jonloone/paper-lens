'use client';

import React, { useMemo } from 'react';
import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinearGradient } from '@visx/gradient';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { Tooltip, useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { timeFormat } from 'd3-time-format';

interface PipelineMetric {
  date: Date;
  throughputMBps: number;
  successRate: number;
  averageLatencyMs: number;
  activeConnections: number;
  cdcEvents: number;
}

interface PipelineHealthChartProps {
  data: PipelineMetric[];
  metric: 'throughput' | 'latency' | 'cdc';
  width?: number;
  height?: number;
}

const formatDate = timeFormat("%b %d, %H:%M");
const formatDateShort = timeFormat("%H:%M");

const tooltipStyles = {
  ...defaultStyles,
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--popover-foreground))',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

function PipelineHealthChartInner({
  data,
  metric = 'throughput',
  width = 800,
  height = 300
}: PipelineHealthChartProps) {
  const {
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<PipelineMetric>();

  const margin = { top: 20, right: 40, bottom: 40, left: 60 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Get metric accessor and formatting
  const { accessor, formatValue, label, color, gradientId } = useMemo(() => {
    switch (metric) {
      case 'throughput':
        return {
          accessor: (d: PipelineMetric) => d.throughputMBps,
          formatValue: (v: number) => `${v.toFixed(1)} MB/s`,
          label: 'Throughput (MB/s)',
          color: 'hsl(var(--chart-1))',
          gradientId: 'throughput-gradient',
        };
      case 'latency':
        return {
          accessor: (d: PipelineMetric) => d.averageLatencyMs,
          formatValue: (v: number) => `${v.toFixed(0)} ms`,
          label: 'Average Latency (ms)',
          color: 'hsl(var(--chart-2))',
          gradientId: 'latency-gradient',
        };
      case 'cdc':
        return {
          accessor: (d: PipelineMetric) => d.cdcEvents,
          formatValue: (v: number) => `${v.toLocaleString()} events`,
          label: 'CDC Events per Hour',
          color: 'hsl(var(--chart-3))',
          gradientId: 'cdc-gradient',
        };
      default:
        return {
          accessor: (d: PipelineMetric) => d.throughputMBps,
          formatValue: (v: number) => `${v.toFixed(1)} MB/s`,
          label: 'Throughput (MB/s)',
          color: 'hsl(var(--chart-1))',
          gradientId: 'throughput-gradient',
        };
    }
  }, [metric]);

  // Scales
  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: [
          Math.min(...data.map(d => d.date.getTime())),
          Math.max(...data.map(d => d.date.getTime()))
        ],
      }),
    [xMax, data],
  );

  const valueScale = useMemo(() => {
    const values = data.map(accessor);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const padding = (maxValue - minValue) * 0.1;

    return scaleLinear<number>({
      range: [yMax, 0],
      domain: [
        Math.max(0, minValue - padding),
        maxValue + padding
      ],
      nice: true,
    });
  }, [yMax, data, accessor]);

  // Event handlers
  const handleTooltip = React.useCallback(
    (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = dateScale.invert(x - margin.left);

      // Find closest data point
      let closestPoint = data[0];
      let minDistance = Math.abs(data[0].date.getTime() - x0.getTime());

      data.forEach(point => {
        const distance = Math.abs(point.date.getTime() - x0.getTime());
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      });

      showTooltip({
        tooltipData: closestPoint,
        tooltipLeft: x,
        tooltipTop: valueScale(accessor(closestPoint)),
      });
    },
    [showTooltip, valueScale, dateScale, data, margin.left, accessor],
  );

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <LinearGradient
          id={gradientId}
          from={color}
          to={color}
          fromOpacity={0.4}
          toOpacity={0}
        />

        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={valueScale}
            width={xMax}
            strokeDasharray="2,2"
            stroke="hsl(var(--border))"
            strokeOpacity={0.3}
          />
          <GridColumns
            scale={dateScale}
            height={yMax}
            strokeDasharray="2,2"
            stroke="hsl(var(--border))"
            strokeOpacity={0.3}
          />

          {/* Area chart */}
          <AreaClosed<PipelineMetric>
            data={data}
            x={(d) => dateScale(d.date) ?? 0}
            y={(d) => valueScale(accessor(d)) ?? 0}
            yScale={valueScale}
            fill={`url(#${gradientId})`}
            curve={curveMonotoneX}
            strokeWidth={0}
          />

          {/* Line chart */}
          <LinePath
            data={data}
            x={(d) => dateScale(d.date) ?? 0}
            y={(d) => valueScale(accessor(d)) ?? 0}
            stroke={color}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={dateScale(d.date)}
              cy={valueScale(accessor(d))}
              r={2}
              fill={color}
              stroke="hsl(var(--background))"
              strokeWidth={1}
            />
          ))}

          {/* Axes */}
          <AxisBottom
            top={yMax}
            scale={dateScale}
            numTicks={6}
            tickStroke="hsl(var(--muted-foreground))"
            tickLabelProps={{
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
              textAnchor: 'middle',
            }}
            tickFormat={(value) => formatDateShort(new Date(value))}
          />

          <AxisLeft
            scale={valueScale}
            numTicks={5}
            tickStroke="hsl(var(--muted-foreground))"
            tickLabelProps={{
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
              textAnchor: 'end',
            }}
            tickFormat={(value) => {
              switch (metric) {
                case 'throughput':
                  return `${value} MB/s`;
                case 'latency':
                  return `${value} ms`;
                case 'cdc':
                  return `${value / 1000}k`;
                default:
                  return value.toString();
              }
            }}
          />

          {/* Invisible rect for mouse events */}
          <rect
            x={0}
            y={0}
            width={xMax}
            height={yMax}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          top={tooltipTop + margin.top}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div className="space-y-2">
            <div className="font-medium">{formatDate(tooltipData.date)}</div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">Throughput:</span>
                <span className="text-xs font-mono">
                  {tooltipData.throughputMBps.toFixed(1)} MB/s
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">Success Rate:</span>
                <span className="text-xs font-mono">
                  {tooltipData.successRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">Avg Latency:</span>
                <span className="text-xs font-mono">
                  {tooltipData.averageLatencyMs.toFixed(0)} ms
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">CDC Events:</span>
                <span className="text-xs font-mono">
                  {tooltipData.cdcEvents.toLocaleString()}/hr
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">Active Connections:</span>
                <span className="text-xs font-mono">
                  {tooltipData.activeConnections}
                </span>
              </div>
            </div>
          </div>
        </TooltipWithBounds>
      )}

      {/* Chart title */}
      <div className="absolute top-1 left-2 text-xs font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function PipelineHealthChart({ data, metric, ...props }: PipelineHealthChartProps) {
  return (
    <ParentSize>
      {({ width, height }) => (
        <PipelineHealthChartInner
          data={data}
          metric={metric}
          width={width}
          height={height || 200}
          {...props}
        />
      )}
    </ParentSize>
  );
}