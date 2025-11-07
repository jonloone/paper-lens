'use client';

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { motion } from 'framer-motion';
import { LegendOrdinal } from '@visx/legend';

export interface PieChartData {
  label: string;
  value: number;
  [key: string]: any;
}

interface PieChartProps {
  data: PieChartData[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showLegend?: boolean;
  animate?: boolean;
  colorScheme?: string[];
  innerRadius?: number; // For donut charts, 0 for full pie
}

const defaultMargin = { top: 20, right: 20, bottom: 20, left: 20 };

const defaultColorScheme = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
];

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
  fontSize: 12,
  padding: '8px 12px',
  borderRadius: '4px',
};

export function PieChart({
  data,
  width,
  height,
  margin = defaultMargin,
  showLegend = true,
  animate = true,
  colorScheme = defaultColorScheme,
  innerRadius = 0,
}: PieChartProps) {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<PieChartData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  // Calculate total for percentages
  const total = useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  // Dimensions
  const legendWidth = showLegend ? 120 : 0;
  const chartWidth = width - margin.left - margin.right - legendWidth;
  const chartHeight = height - margin.top - margin.bottom;
  const radius = Math.min(chartWidth, chartHeight) / 2;
  const centerX = chartWidth / 2;
  const centerY = chartHeight / 2;

  // Color scale
  const colorScale = useMemo(() => {
    return scaleOrdinal<string, string>({
      domain: data.map(d => d.label),
      range: colorScheme,
    });
  }, [data, colorScheme]);

  // Accessor functions
  const getValue = (d: PieChartData) => d.value;
  const getLabel = (d: PieChartData) => d.label;

  // Event handlers
  const handleMouseMove = (event: React.MouseEvent | React.TouchEvent, datum: PieChartData) => {
    const coords = localPoint(event) || { x: 0, y: 0 };
    showTooltip({
      tooltipData: datum,
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
    });
  };

  return (
    <div className="relative flex items-center" ref={containerRef}>
      <svg width={width} height={height}>
        <Group left={margin.left + centerX} top={margin.top + centerY}>
          <Pie
            data={data}
            pieValue={getValue}
            outerRadius={radius}
            innerRadius={innerRadius}
            cornerRadius={3}
            padAngle={0.02}
          >
            {(pie) => {
              return pie.arcs.map((arc, i) => {
                const [centroidX, centroidY] = pie.path.centroid(arc);
                const arcPath = pie.path(arc) || '';
                const arcData = arc.data;

                return (
                  <g key={`arc-${getLabel(arcData)}-${i}`}>
                    <motion.path
                      d={arcPath}
                      fill={colorScale(getLabel(arcData))}
                      initial={animate ? { opacity: 0, scale: 0 } : undefined}
                      animate={animate ? { opacity: 0.8, scale: 1 } : undefined}
                      whileHover={{ opacity: 1, scale: 1.05 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      onMouseMove={(event) => handleMouseMove(event, arcData)}
                      onMouseLeave={hideTooltip}
                      onTouchStart={(event) => handleMouseMove(event, arcData)}
                      onTouchEnd={hideTooltip}
                      className="cursor-pointer transition-opacity"
                    />
                    {/* Optional: Show percentage on larger slices */}
                    {arc.endAngle - arc.startAngle > 0.3 && (
                      <motion.text
                        x={centroidX}
                        y={centroidY}
                        dy=".33em"
                        fontSize={11}
                        fontWeight="bold"
                        fill="white"
                        textAnchor="middle"
                        pointerEvents="none"
                        initial={animate ? { opacity: 0 } : undefined}
                        animate={animate ? { opacity: 0.9 } : undefined}
                        transition={{ duration: 0.3, delay: i * 0.05 + 0.2 }}
                        className="drop-shadow-md"
                      >
                        {`${((getValue(arcData) / total) * 100).toFixed(0)}%`}
                      </motion.text>
                    )}
                  </g>
                );
              })}
            }
          </Pie>
        </Group>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="ml-4 flex flex-col gap-2 text-xs">
          <LegendOrdinal
            scale={colorScale}
            labelFormat={(label) => {
              const item = data.find(d => d.label === label);
              if (!item) return label;
              const percentage = ((item.value / total) * 100).toFixed(1);
              return `${label} (${percentage}%)`;
            }}
          >
            {(labels) => (
              <div className="flex flex-col gap-2">
                {labels.map((label, i) => {
                  const item = data.find(d => d.label === label.datum);
                  return (
                    <motion.div
                      key={`legend-${label.text}-${i}`}
                      className="flex items-center gap-2"
                      initial={animate ? { opacity: 0, x: -10 } : undefined}
                      animate={animate ? { opacity: 1, x: 0 } : undefined}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: label.value }}
                      />
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">
                          {label.datum}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {item?.value.toLocaleString()} ({((item!.value / total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </LegendOrdinal>
        </div>
      )}

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
            <div className="text-xs opacity-80">
              {((tooltipData.value / total) * 100).toFixed(1)}%
            </div>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
