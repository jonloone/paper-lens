'use client';

import React, { useMemo } from 'react';
import { Circle, Line } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear, scaleOrdinal } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { Text } from '@visx/text';
import { ParentSize } from '@visx/responsive';
import { Tooltip, useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { timeFormat } from 'd3-time-format';

interface SchemaChangeEvent {
  id: string;
  date: Date;
  table: string;
  domain: string;
  changeType: 'added' | 'modified' | 'removed' | 'breaking';
  field: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedPipelines: number;
}

interface SchemaDriftTimelineProps {
  data: SchemaChangeEvent[];
  width?: number;
  height?: number;
}

const formatDate = timeFormat("%b %d, %H:%M");
const formatDateShort = timeFormat("%m/%d");

// Schema change type colors
const changeTypeColors = {
  added: 'hsl(142 76% 36%)', // green
  modified: 'hsl(48 96% 53%)', // yellow
  removed: 'hsl(0 84% 60%)', // red
  breaking: 'hsl(346 87% 43%)', // dark red
};

// Impact level sizes
const impactSizes = {
  low: 4,
  medium: 6,
  high: 8,
  critical: 10,
};

const tooltipStyles = {
  ...defaultStyles,
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--popover-foreground))',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  maxWidth: '280px',
};

function SchemaDriftTimelineInner({ data, width = 800, height = 200 }: SchemaDriftTimelineProps) {
  const {
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<SchemaChangeEvent>();

  const margin = { top: 20, right: 40, bottom: 40, left: 60 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Group events by table
  const tableGroups = useMemo(() => {
    const groups = data.reduce((acc, event) => {
      if (!acc[event.table]) {
        acc[event.table] = [];
      }
      acc[event.table].push(event);
      return acc;
    }, {} as Record<string, SchemaChangeEvent[]>);
    return Object.keys(groups).map(table => ({ table, events: groups[table] }));
  }, [data]);

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

  const tableScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [0, yMax],
        domain: [0, tableGroups.length - 1],
      }),
    [yMax, tableGroups.length],
  );

  // Event handlers
  const handleTooltip = React.useCallback(
    (event: React.MouseEvent<SVGCircleElement>, data: SchemaChangeEvent) => {
      const coords = localPoint(event.target.ownerSVGElement!, event);
      showTooltip({
        tooltipData: data,
        tooltipLeft: coords?.x,
        tooltipTop: coords?.y,
      });
    },
    [showTooltip],
  );

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Draw timeline lanes for each table */}
          {tableGroups.map((group, i) => {
            const y = tableScale(i);
            return (
              <g key={group.table}>
                {/* Lane background */}
                <rect
                  x={0}
                  y={y - 12}
                  width={xMax}
                  height={24}
                  fill={i % 2 === 0 ? 'hsl(var(--muted) / 0.3)' : 'transparent'}
                  rx={4}
                />

                {/* Table label */}
                <Text
                  x={-10}
                  y={y + 4}
                  fontSize={11}
                  textAnchor="end"
                  fill="hsl(var(--muted-foreground))"
                  fontWeight={500}
                >
                  {group.table}
                </Text>

                {/* Timeline line */}
                <Line
                  from={{ x: 0, y }}
                  to={{ x: xMax, y }}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />

                {/* Schema change events */}
                {group.events.map((event) => (
                  <Circle
                    key={event.id}
                    cx={dateScale(event.date)}
                    cy={y}
                    r={impactSizes[event.impact]}
                    fill={changeTypeColors[event.changeType]}
                    stroke={event.changeType === 'breaking' ? 'hsl(var(--destructive))' : 'white'}
                    strokeWidth={event.changeType === 'breaking' ? 2 : 1}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => handleTooltip(e, event)}
                    onMouseLeave={hideTooltip}
                  />
                ))}
              </g>
            );
          })}

          {/* Bottom axis */}
          <AxisBottom
            top={yMax + 10}
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
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div className="space-y-2">
            <div className="border-b pb-1">
              <div className="font-medium">{tooltipData.table}</div>
              <div className="text-xs text-muted-foreground">{formatDate(tooltipData.date)}</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: changeTypeColors[tooltipData.changeType] }}
                ></div>
                <span className="text-xs font-medium capitalize">{tooltipData.changeType}</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">
                  {tooltipData.impact}
                </span>
              </div>

              <div className="text-sm">
                <span className="font-medium">Field:</span> {tooltipData.field}
              </div>

              <div className="text-xs text-muted-foreground">
                {tooltipData.description}
              </div>

              {tooltipData.affectedPipelines > 0 && (
                <div className="text-xs text-amber-600">
                  ⚠️ Affects {tooltipData.affectedPipelines} pipeline{tooltipData.affectedPipelines > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </TooltipWithBounds>
      )}

      {/* Legend */}
      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border rounded-md p-2">
        <div className="text-xs font-medium mb-1">Change Types</div>
        <div className="space-y-0.5">
          {Object.entries(changeTypeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-xs capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SchemaDriftTimeline({ data, ...props }: SchemaDriftTimelineProps) {
  return (
    <ParentSize>
      {({ width, height }) => (
        <SchemaDriftTimelineInner
          data={data}
          width={width}
          height={height || 200}
          {...props}
        />
      )}
    </ParentSize>
  );
}