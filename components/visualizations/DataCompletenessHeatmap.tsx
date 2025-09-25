'use client';

import React, { useMemo } from 'react';
import { HeatmapRect, HeatmapCircle } from '@visx/heatmap';
import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { scaleLinear, scaleBand } from '@visx/scale';
import { ParentSize } from '@visx/responsive';
import { Tooltip, useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';

interface CompletenessDataPoint {
  dataset: string;
  domain: string;
  field: string;
  completeness: number;
  recordCount: number;
  missingCount: number;
  lastUpdated: Date;
}

interface DataCompletenessHeatmapProps {
  data: CompletenessDataPoint[];
  width?: number;
  height?: number;
}

const tooltipStyles = {
  ...defaultStyles,
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--popover-foreground))',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  maxWidth: '260px',
};

// Color scale from red (bad) to green (good)
const getCompletenessColor = (completeness: number, opacity: number = 1) => {
  if (completeness >= 95) return `hsla(142, 76%, 36%, ${opacity})`; // Green
  if (completeness >= 90) return `hsla(84, 81%, 44%, ${opacity})`; // Light green
  if (completeness >= 80) return `hsla(48, 96%, 53%, ${opacity})`; // Yellow
  if (completeness >= 70) return `hsla(25, 95%, 53%, ${opacity})`; // Orange
  return `hsla(0, 84%, 60%, ${opacity})`; // Red
};

function DataCompletenessHeatmapInner({ data, width = 800, height = 400 }: DataCompletenessHeatmapProps) {
  const {
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<CompletenessDataPoint>();

  const margin = { top: 60, right: 40, bottom: 40, left: 120 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Transform data into matrix format
  const { matrixData, datasets, fields } = useMemo(() => {
    const datasetSet = new Set<string>();
    const fieldSet = new Set<string>();

    // Collect unique datasets and fields
    data.forEach(d => {
      datasetSet.add(d.dataset);
      fieldSet.add(d.field);
    });

    const datasets = Array.from(datasetSet);
    const fields = Array.from(fieldSet);

    // Create matrix
    const matrix = datasets.map(dataset => {
      return fields.map(field => {
        const item = data.find(d => d.dataset === dataset && d.field === field);
        return item || null;
      });
    });

    return { matrixData: matrix, datasets, fields };
  }, [data]);

  // Scales
  const xScale = scaleBand<string>({
    range: [0, xMax],
    domain: fields,
    padding: 0.1,
  });

  const yScale = scaleBand<string>({
    range: [0, yMax],
    domain: datasets,
    padding: 0.1,
  });

  const cellWidth = xScale.bandwidth();
  const cellHeight = yScale.bandwidth();

  // Event handlers
  const handleTooltip = React.useCallback(
    (event: React.MouseEvent<SVGRectElement>, data: CompletenessDataPoint | null) => {
      if (!data) return;

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
          {/* Column headers (fields) */}
          {fields.map((field, i) => (
            <Text
              key={field}
              x={(xScale(field) || 0) + cellWidth / 2}
              y={-10}
              fontSize={11}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontWeight={500}
              angle={-45}
            >
              {field}
            </Text>
          ))}

          {/* Row headers (datasets) */}
          {datasets.map((dataset, i) => (
            <Text
              key={dataset}
              x={-10}
              y={(yScale(dataset) || 0) + cellHeight / 2 + 4}
              fontSize={11}
              textAnchor="end"
              fill="hsl(var(--muted-foreground))"
              fontWeight={500}
            >
              {dataset}
            </Text>
          ))}

          {/* Heatmap cells */}
          {matrixData.map((datasetRow, i) => (
            datasetRow.map((dataPoint, j) => {
              const x = xScale(fields[j]) || 0;
              const y = yScale(datasets[i]) || 0;

              if (!dataPoint) {
                // Empty cell for missing data
                return (
                  <rect
                    key={`empty-${i}-${j}`}
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={cellHeight}
                    fill="hsl(var(--muted) / 0.3)"
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                    rx={2}
                  />
                );
              }

              return (
                <rect
                  key={`${datasets[i]}-${fields[j]}`}
                  x={x}
                  y={y}
                  width={cellWidth}
                  height={cellHeight}
                  fill={getCompletenessColor(dataPoint.completeness)}
                  stroke="hsl(var(--background))"
                  strokeWidth={1}
                  rx={2}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => handleTooltip(e, dataPoint)}
                  onMouseLeave={hideTooltip}
                />
              );
            })
          ))}

          {/* Completeness percentage text overlay */}
          {matrixData.map((datasetRow, i) => (
            datasetRow.map((dataPoint, j) => {
              if (!dataPoint) return null;

              const x = xScale(fields[j]) || 0;
              const y = yScale(datasets[i]) || 0;

              return (
                <Text
                  key={`text-${datasets[i]}-${fields[j]}`}
                  x={x + cellWidth / 2}
                  y={y + cellHeight / 2 + 3}
                  fontSize={9}
                  textAnchor="middle"
                  fill={dataPoint.completeness > 50 ? 'white' : 'hsl(var(--foreground))'}
                  fontWeight={600}
                  pointerEvents="none"
                >
                  {Math.round(dataPoint.completeness)}%
                </Text>
              );
            })
          ))}
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
              <div className="font-medium">{tooltipData.dataset}</div>
              <div className="text-xs text-muted-foreground">{tooltipData.field}</div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="font-medium">Completeness:</div>
              <div className="text-right font-mono">
                {tooltipData.completeness.toFixed(1)}%
              </div>

              <div className="text-muted-foreground">Total records:</div>
              <div className="text-right font-mono">
                {tooltipData.recordCount.toLocaleString()}
              </div>

              <div className="text-muted-foreground">Missing:</div>
              <div className="text-right font-mono">
                {tooltipData.missingCount.toLocaleString()}
              </div>

              <div className="text-muted-foreground">Domain:</div>
              <div className="text-right">{tooltipData.domain}</div>
            </div>

            <div className="pt-1 border-t text-xs text-muted-foreground">
              Last updated: {tooltipData.lastUpdated.toLocaleDateString()}
            </div>
          </div>
        </TooltipWithBounds>
      )}

      {/* Legend */}
      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border rounded-md p-2">
        <div className="text-xs font-medium mb-1">Completeness</div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getCompletenessColor(98) }}></div>
            <span className="text-xs">95-100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getCompletenessColor(92) }}></div>
            <span className="text-xs">90-94%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getCompletenessColor(85) }}></div>
            <span className="text-xs">80-89%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getCompletenessColor(75) }}></div>
            <span className="text-xs">70-79%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getCompletenessColor(60) }}></div>
            <span className="text-xs">&lt;70%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataCompletenessHeatmap({ data, ...props }: DataCompletenessHeatmapProps) {
  return (
    <ParentSize>
      {({ width, height }) => (
        <DataCompletenessHeatmapInner
          data={data}
          width={width}
          height={height || 400}
          {...props}
        />
      )}
    </ParentSize>
  );
}