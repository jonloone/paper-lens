'use client';

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { motion } from 'framer-motion';

export interface BarChartData {
  label: string;
  value: number;
  [key: string]: any; // Allow additional properties
}

interface BarChartProps {
  data: BarChartData[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  isHorizontal?: boolean;
  color?: string;
  showGrid?: boolean;
  animate?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const defaultMargin = { top: 20, right: 20, bottom: 40, left: 60 };

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
  fontSize: 12,
  padding: '8px 12px',
  borderRadius: '4px',
};

export function BarChart({
  data,
  width,
  height,
  margin = defaultMargin,
  isHorizontal = false,
  color = 'hsl(var(--primary))',
  showGrid = true,
  animate = true,
  xAxisLabel,
  yAxisLabel,
}: BarChartProps) {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<BarChartData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  // Bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Scales
  const xScale = useMemo(() => {
    if (isHorizontal) {
      return scaleLinear<number>({
        range: [0, xMax],
        domain: [0, Math.max(...data.map(d => d.value))],
        nice: true,
      });
    }
    return scaleBand<string>({
      range: [0, xMax],
      domain: data.map(d => d.label),
      padding: 0.3,
    });
  }, [data, xMax, isHorizontal]);

  const yScale = useMemo(() => {
    if (isHorizontal) {
      return scaleBand<string>({
        range: [0, yMax],
        domain: data.map(d => d.label),
        padding: 0.3,
      });
    }
    return scaleLinear<number>({
      range: [yMax, 0],
      domain: [0, Math.max(...data.map(d => d.value))],
      nice: true,
    });
  }, [data, yMax, isHorizontal]);

  // Event handlers
  const handleMouseMove = (event: React.MouseEvent | React.TouchEvent, datum: BarChartData) => {
    const coords = localPoint(event) || { x: 0, y: 0 };
    showTooltip({
      tooltipData: datum,
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Grid */}
          {showGrid && (
            <GridRows
              scale={isHorizontal ? yScale : yScale}
              width={xMax}
              height={isHorizontal ? undefined : yMax}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="3,3"
            />
          )}

          {/* Bars */}
          {data.map((d, i) => {
            if (isHorizontal) {
              const barHeight = yScale.bandwidth?.() || 0;
              const barWidth = xScale(d.value) || 0;
              const barY = yScale(d.label) || 0;

              return (
                <motion.g
                  key={`bar-${d.label}-${i}`}
                  initial={animate ? { x: 0, scaleX: 0 } : undefined}
                  animate={animate ? { x: 0, scaleX: 1 } : undefined}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Bar
                    x={0}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={color}
                    opacity={0.8}
                    onMouseMove={(event) => handleMouseMove(event, d)}
                    onMouseLeave={hideTooltip}
                    onTouchStart={(event) => handleMouseMove(event, d)}
                    onTouchEnd={hideTooltip}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  />
                </motion.g>
              );
            } else {
              const barWidth = xScale.bandwidth?.() || 0;
              const barHeight = yMax - (yScale(d.value) || 0);
              const barX = xScale(d.label) || 0;
              const barY = yScale(d.value) || 0;

              return (
                <motion.g
                  key={`bar-${d.label}-${i}`}
                  initial={animate ? { y: yMax, scaleY: 0 } : undefined}
                  animate={animate ? { y: barY, scaleY: 1 } : undefined}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Bar
                    x={barX}
                    y={animate ? yMax : barY}
                    width={barWidth}
                    height={animate ? 0 : barHeight}
                    fill={color}
                    opacity={0.8}
                    onMouseMove={(event) => handleMouseMove(event, d)}
                    onMouseLeave={hideTooltip}
                    onTouchStart={(event) => handleMouseMove(event, d)}
                    onTouchEnd={hideTooltip}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  />
                </motion.g>
              );
            }
          })}

          {/* Axes */}
          <AxisBottom
            top={yMax}
            scale={isHorizontal ? xScale : xScale}
            stroke="currentColor"
            tickStroke="currentColor"
            strokeOpacity={0.2}
            tickLabelProps={() => ({
              fill: 'currentColor',
              fontSize: 11,
              textAnchor: 'middle',
              opacity: 0.7,
            })}
            label={xAxisLabel}
            labelProps={{
              fill: 'currentColor',
              fontSize: 12,
              textAnchor: 'middle',
              opacity: 0.8,
            }}
          />

          <AxisLeft
            scale={isHorizontal ? yScale : yScale}
            stroke="currentColor"
            tickStroke="currentColor"
            strokeOpacity={0.2}
            tickLabelProps={() => ({
              fill: 'currentColor',
              fontSize: 11,
              textAnchor: 'end',
              opacity: 0.7,
            })}
            label={yAxisLabel}
            labelProps={{
              fill: 'currentColor',
              fontSize: 12,
              textAnchor: 'middle',
              opacity: 0.8,
            }}
          />
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div>
            <strong>{tooltipData.label}</strong>
            <div>{tooltipData.value.toLocaleString()}</div>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
