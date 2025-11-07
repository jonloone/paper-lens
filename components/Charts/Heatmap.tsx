"use client";

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';

export interface HeatmapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

interface HeatmapProps {
  data: HeatmapDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  xLabel?: string;
  yLabel?: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  showValues?: boolean;
  animate?: boolean;
}

const defaultMargin = { top: 20, right: 20, bottom: 60, left: 80 };

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  fontSize: '12px',
  padding: '8px 12px',
  borderRadius: '4px',
};

const COLOR_SCHEMES = {
  blue: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
  green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d'],
  red: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'],
  purple: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce'],
  orange: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c'],
};

export function Heatmap({
  data,
  width = 600,
  height = 400,
  margin = defaultMargin,
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  colorScheme = 'blue',
  showValues = false,
  animate = true,
}: HeatmapProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<HeatmapDataPoint>();

  // Bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Extract unique x and y values
  const xValues = useMemo(
    () => Array.from(new Set(data.map((d) => String(d.x)))),
    [data]
  );
  const yValues = useMemo(
    () => Array.from(new Set(data.map((d) => String(d.y)))),
    [data]
  );

  // Scales
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: xValues,
        range: [0, xMax],
        padding: 0.1,
      }),
    [xValues, xMax]
  );

  const yScale = useMemo(
    () =>
      scaleBand<string>({
        domain: yValues,
        range: [0, yMax],
        padding: 0.1,
      }),
    [yValues, yMax]
  );

  // Color scale
  const colorScale = useMemo(() => {
    const values = data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return scaleLinear<string>({
      domain: Array.from({ length: 8 }, (_, i) => minValue + (maxValue - minValue) * (i / 7)),
      range: COLOR_SCHEMES[colorScheme],
    });
  }, [data, colorScheme]);

  // Create a map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    data.forEach((d) => {
      map.set(`${d.x}-${d.y}`, d);
    });
    return map;
  }, [data]);

  const handleMouseMove = (
    event: React.MouseEvent<SVGRectElement>,
    point: HeatmapDataPoint
  ) => {
    const coords = localPoint(event);
    if (!coords) return;

    showTooltip({
      tooltipData: point,
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
    });
  };

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ width, height }}
      >
        No data to display
      </div>
    );
  }

  const cellWidth = xScale.bandwidth();
  const cellHeight = yScale.bandwidth();

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Heatmap cells */}
          {xValues.map((xValue, xIdx) =>
            yValues.map((yValue, yIdx) => {
              const point = dataMap.get(`${xValue}-${yValue}`);
              if (!point) return null;

              const x = xScale(xValue) ?? 0;
              const y = yScale(yValue) ?? 0;
              const color = colorScale(point.value);

              return (
                <Group key={`cell-${xIdx}-${yIdx}`}>
                  <rect
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={cellHeight}
                    fill={color}
                    stroke="hsl(var(--background))"
                    strokeWidth={1}
                    onMouseMove={(event) => handleMouseMove(event, point)}
                    onMouseLeave={hideTooltip}
                    className="transition-opacity hover:opacity-80"
                    style={
                      animate
                        ? {
                            animation: `fadeIn 0.5s ease-in-out ${
                              (xIdx + yIdx) * 0.02
                            }s both`,
                          }
                        : undefined
                    }
                  />

                  {/* Value labels */}
                  {showValues && cellWidth > 40 && cellHeight > 30 && (
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fill="hsl(var(--foreground))"
                      opacity={0.8}
                      pointerEvents="none"
                    >
                      {point.value.toFixed(1)}
                    </text>
                  )}
                </Group>
              );
            })
          )}

          {/* Axes */}
          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke="hsl(var(--border))"
            tickStroke="hsl(var(--border))"
            tickLabelProps={() => ({
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
              textAnchor: 'middle',
              angle: xValues.length > 10 ? -45 : 0,
              dx: xValues.length > 10 ? -10 : 0,
              dy: xValues.length > 10 ? 5 : 10,
            })}
            label={xLabel}
            labelProps={{
              fill: 'hsl(var(--foreground))',
              fontSize: 12,
              textAnchor: 'middle',
            }}
            labelOffset={xValues.length > 10 ? 40 : 20}
          />
          <AxisLeft
            scale={yScale}
            stroke="hsl(var(--border))"
            tickStroke="hsl(var(--border))"
            tickLabelProps={() => ({
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
              textAnchor: 'end',
              dx: -4,
            })}
            label={yLabel}
            labelProps={{
              fill: 'hsl(var(--foreground))',
              fontSize: 12,
              textAnchor: 'middle',
            }}
            labelOffset={50}
          />
        </Group>

        {/* Color legend */}
        <Group left={width - margin.right - 60} top={margin.top}>
          <text
            x={30}
            y={-5}
            textAnchor="middle"
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
          >
            Value
          </text>
          {COLOR_SCHEMES[colorScheme].map((color, i) => {
            const legendHeight = Math.min(yMax, 200);
            const cellHeight = legendHeight / COLOR_SCHEMES[colorScheme].length;
            const y = i * cellHeight;

            return (
              <rect
                key={`legend-${i}`}
                x={15}
                y={y}
                width={30}
                height={cellHeight}
                fill={color}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
              />
            );
          })}
          {/* Legend labels */}
          <text
            x={50}
            y={5}
            fontSize={9}
            fill="hsl(var(--muted-foreground))"
          >
            {colorScale.domain()[7].toFixed(1)}
          </text>
          <text
            x={50}
            y={Math.min(yMax, 200) - 5}
            fontSize={9}
            fill="hsl(var(--muted-foreground))"
          >
            {colorScale.domain()[0].toFixed(1)}
          </text>
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          {tooltipData.label && (
            <div className="font-semibold">{tooltipData.label}</div>
          )}
          <div>
            {xLabel}: {tooltipData.x}
          </div>
          <div>
            {yLabel}: {tooltipData.y}
          </div>
          <div className="mt-1 font-semibold">
            Value: {tooltipData.value.toFixed(2)}
          </div>
        </TooltipWithBounds>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
