'use client';

import React, { useMemo } from 'react';
import { AreaClosed, Line, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinearGradient } from '@visx/gradient';
import { Text } from '@visx/text';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { Tooltip, useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { timeFormat } from 'd3-time-format';

interface DataPoint {
  date: Date;
  customer: number;
  finance: number;
  product: number;
  marketing: number;
  operations: number;
}

interface QualityTrendsChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

const formatDate = timeFormat("%b %d");
const formatValue = (value: number) => `${value.toFixed(1)}%`;

// Domain colors matching your theme
const domainColors = {
  customer: 'hsl(var(--chart-1))',
  finance: 'hsl(var(--chart-2))',
  product: 'hsl(var(--chart-3))',
  marketing: 'hsl(var(--chart-4))',
  operations: 'hsl(var(--chart-5))'
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
};

const bisectDate = bisector<DataPoint, Date>((d) => d.date).left;

function QualityTrendsChartInner({ data, width = 800, height = 400 }: QualityTrendsChartProps) {
  const {
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<DataPoint>();

  const margin = { top: 20, right: 40, bottom: 40, left: 60 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Scales
  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: [Math.min(...data.map(d => d.date.getTime())), Math.max(...data.map(d => d.date.getTime()))],
      }),
    [xMax, data],
  );

  const qualityScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [75, 100], // Quality scores typically range from 75-100%
        nice: true,
      }),
    [yMax],
  );

  // Event handlers
  const handleTooltip = React.useCallback(
    (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = dateScale.invert(x - margin.left);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;
      if (d1 && d1.date) {
        d = x0.valueOf() - d0.date.valueOf() > d1.date.valueOf() - x0.valueOf() ? d1 : d0;
      }
      showTooltip({
        tooltipData: d,
        tooltipLeft: x,
        tooltipTop: qualityScale((d.customer + d.finance + d.product + d.marketing + d.operations) / 5),
      });
    },
    [showTooltip, qualityScale, dateScale, data, margin.left],
  );

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <LinearGradient id="customer-gradient" from={domainColors.customer} to={domainColors.customer} fromOpacity={0.3} toOpacity={0} />
        <LinearGradient id="finance-gradient" from={domainColors.finance} to={domainColors.finance} fromOpacity={0.3} toOpacity={0} />
        <LinearGradient id="product-gradient" from={domainColors.product} to={domainColors.product} fromOpacity={0.3} toOpacity={0} />

        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={qualityScale}
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

          {/* Area charts for each domain */}
          <AreaClosed<DataPoint>
            data={data}
            x={(d) => dateScale(d.date) ?? 0}
            y={(d) => qualityScale(d.customer) ?? 0}
            yScale={qualityScale}
            fill="url(#customer-gradient)"
            curve={curveMonotoneX}
            strokeWidth={0}
          />

          {/* Lines for each domain */}
          <Line
            data={data}
            x={(d) => dateScale(d.date) ?? 0}
            y={(d) => qualityScale(d.customer) ?? 0}
            stroke={domainColors.customer}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          <Line
            data={data}
            x={(d) => dateScale(d.date) ?? 0}
            y={(d) => qualityScale(d.finance) ?? 0}
            stroke={domainColors.finance}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          <Line
            data={data}
            x={(d) => dateScale(d.date) ?? 0}
            y={(d) => qualityScale(d.product) ?? 0}
            stroke={domainColors.product}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          <Line
            data={data}
            x={(d) => dateScale(d.date) ?? 0}
            y={(d) => qualityScale(d.marketing) ?? 0}
            stroke={domainColors.marketing}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          <Line
            data={data}
            x={(d) => dateScale(d.date) ?? 0}
            y={(d) => qualityScale(d.operations) ?? 0}
            stroke={domainColors.operations}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          {/* Axes */}
          <AxisBottom
            top={yMax}
            scale={dateScale}
            numTicks={6}
            tickStroke="hsl(var(--muted-foreground))"
            tickLabelProps={{
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11,
              textAnchor: 'middle',
            }}
            tickFormat={(value) => formatDate(new Date(value))}
          />

          <AxisLeft
            scale={qualityScale}
            numTicks={5}
            tickStroke="hsl(var(--muted-foreground))"
            tickLabelProps={{
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11,
              textAnchor: 'end',
            }}
            tickFormat={formatValue}
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
          <div className="space-y-1">
            <div className="font-medium">{formatDate(tooltipData.date)}</div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: domainColors.customer }}></div>
                  <span className="text-xs">Customer</span>
                </div>
                <span className="text-xs font-medium">{formatValue(tooltipData.customer)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: domainColors.finance }}></div>
                  <span className="text-xs">Finance</span>
                </div>
                <span className="text-xs font-medium">{formatValue(tooltipData.finance)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: domainColors.product }}></div>
                  <span className="text-xs">Product</span>
                </div>
                <span className="text-xs font-medium">{formatValue(tooltipData.product)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: domainColors.marketing }}></div>
                  <span className="text-xs">Marketing</span>
                </div>
                <span className="text-xs font-medium">{formatValue(tooltipData.marketing)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: domainColors.operations }}></div>
                  <span className="text-xs">Operations</span>
                </div>
                <span className="text-xs font-medium">{formatValue(tooltipData.operations)}</span>
              </div>
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

export function QualityTrendsChart({ data, ...props }: QualityTrendsChartProps) {
  return (
    <ParentSize>
      {({ width, height }) => (
        <QualityTrendsChartInner
          data={data}
          width={width}
          height={height || 300}
          {...props}
        />
      )}
    </ParentSize>
  );
}