"use client";

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Circle } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { voronoi } from '@visx/voronoi';
import { localPoint } from '@visx/event';

export interface ScatterDataPoint {
  x: number;
  y: number;
  label?: string;
  category?: string;
  size?: number;
  metadata?: Record<string, any>;
}

interface ScatterPlotProps {
  data: ScatterDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  xLabel?: string;
  yLabel?: string;
  showTrendline?: boolean;
  colorBy?: 'category' | 'density';
  pointSize?: number;
  animate?: boolean;
}

const defaultMargin = { top: 20, right: 20, bottom: 40, left: 50 };

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  fontSize: '12px',
  padding: '8px 12px',
  borderRadius: '4px',
};

export function ScatterPlot({
  data,
  width = 600,
  height = 400,
  margin = defaultMargin,
  xLabel = 'X',
  yLabel = 'Y',
  showTrendline = false,
  colorBy = 'category',
  pointSize = 4,
  animate = true,
}: ScatterPlotProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<ScatterDataPoint>();

  // Bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Accessors
  const getX = (d: ScatterDataPoint) => d.x;
  const getY = (d: ScatterDataPoint) => d.y;

  // Scales
  const xScale = useMemo(() => {
    const xValues = data.map(getX);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const padding = (xMax - xMin) * 0.1;

    return scaleLinear<number>({
      domain: [xMin - padding, xMax + padding],
      range: [0, xMax],
      nice: true,
    });
  }, [data, xMax]);

  const yScale = useMemo(() => {
    const yValues = data.map(getY);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const padding = (yMax - yMin) * 0.1;

    return scaleLinear<number>({
      domain: [yMin - padding, yMax + padding],
      range: [yMax, 0],
      nice: true,
    });
  }, [data, yMax]);

  // Trendline calculation (linear regression)
  const trendlinePoints = useMemo(() => {
    if (!showTrendline || data.length < 2) return null;

    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + getX(d), 0);
    const sumY = data.reduce((sum, d) => sum + getY(d), 0);
    const sumXY = data.reduce((sum, d) => sum + getX(d) * getY(d), 0);
    const sumX2 = data.reduce((sum, d) => sum + getX(d) ** 2, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
    const intercept = (sumY - slope * sumX) / n;

    const xDomain = xScale.domain();
    return [
      { x: xDomain[0], y: slope * xDomain[0] + intercept },
      { x: xDomain[1], y: slope * xDomain[1] + intercept },
    ];
  }, [data, showTrendline, xScale]);

  // Color scale for categories
  const categories = useMemo(
    () => Array.from(new Set(data.map((d) => d.category).filter(Boolean))),
    [data]
  );

  const getColor = (point: ScatterDataPoint) => {
    if (colorBy === 'category' && point.category) {
      const index = categories.indexOf(point.category);
      const colors = [
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
      ];
      return colors[index % colors.length];
    }
    return 'hsl(var(--primary))';
  };

  // Voronoi for better hover detection
  const voronoiLayout = useMemo(
    () =>
      voronoi<ScatterDataPoint>({
        x: (d) => xScale(getX(d)) ?? 0,
        y: (d) => yScale(getY(d)) ?? 0,
        width: xMax,
        height: yMax,
      })(data),
    [data, xScale, yScale, xMax, yMax]
  );

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const point = localPoint(event);
    if (!point) return;

    const closest = voronoiLayout.find(
      point.x - margin.left,
      point.y - margin.top
    );

    if (closest && closest.data) {
      showTooltip({
        tooltipData: closest.data,
        tooltipLeft: xScale(getX(closest.data)) + margin.left,
        tooltipTop: yScale(getY(closest.data)) + margin.top,
      });
    }
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

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Grid */}
          <GridRows
            scale={yScale}
            width={xMax}
            strokeDasharray="2,2"
            stroke="hsl(var(--border))"
            strokeOpacity={0.3}
          />
          <GridColumns
            scale={xScale}
            height={yMax}
            strokeDasharray="2,2"
            stroke="hsl(var(--border))"
            strokeOpacity={0.3}
          />

          {/* Trendline */}
          {trendlinePoints && (
            <line
              x1={xScale(trendlinePoints[0].x)}
              y1={yScale(trendlinePoints[0].y)}
              x2={xScale(trendlinePoints[1].x)}
              y2={yScale(trendlinePoints[1].y)}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="4,4"
              opacity={0.5}
            />
          )}

          {/* Data points */}
          {data.map((point, i) => {
            const cx = xScale(getX(point));
            const cy = yScale(getY(point));
            const r = point.size ? point.size * pointSize : pointSize;

            return (
              <Circle
                key={`point-${i}`}
                cx={cx}
                cy={cy}
                r={r}
                fill={getColor(point)}
                fillOpacity={0.6}
                stroke={getColor(point)}
                strokeWidth={1}
                className="transition-all hover:fill-opacity-100"
                style={
                  animate
                    ? {
                        animation: `fadeIn 0.5s ease-in-out ${i * 0.01}s both`,
                      }
                    : undefined
                }
              />
            );
          })}

          {/* Voronoi overlay for better hover detection */}
          <rect
            width={xMax}
            height={yMax}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={hideTooltip}
          />

          {/* Axes */}
          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke="hsl(var(--border))"
            tickStroke="hsl(var(--border))"
            tickLabelProps={() => ({
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11,
              textAnchor: 'middle',
            })}
            label={xLabel}
            labelProps={{
              fill: 'hsl(var(--foreground))',
              fontSize: 12,
              textAnchor: 'middle',
            }}
            labelOffset={15}
          />
          <AxisLeft
            scale={yScale}
            stroke="hsl(var(--border))"
            tickStroke="hsl(var(--border))"
            tickLabelProps={() => ({
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11,
              textAnchor: 'end',
              dx: -4,
            })}
            label={yLabel}
            labelProps={{
              fill: 'hsl(var(--foreground))',
              fontSize: 12,
              textAnchor: 'middle',
            }}
            labelOffset={35}
          />
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
            {xLabel}: {tooltipData.x.toFixed(2)}
          </div>
          <div>
            {yLabel}: {tooltipData.y.toFixed(2)}
          </div>
          {tooltipData.category && (
            <div className="mt-1 text-xs opacity-75">
              {tooltipData.category}
            </div>
          )}
        </TooltipWithBounds>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
