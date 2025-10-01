'use client';

import React from 'react';
import { LinePath, Bar, Area } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { scaleLinear, scaleTime, scaleBand } from '@visx/scale';
import { curveMonotoneX } from '@visx/curve';
import { Grid } from '@visx/grid';
import { LinearGradient } from '@visx/gradient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Line Chart Data
const lineData = [
  { date: new Date('2024-01-20'), value: 92, secondary: 88 },
  { date: new Date('2024-01-21'), value: 94, secondary: 90 },
  { date: new Date('2024-01-22'), value: 91, secondary: 87 },
  { date: new Date('2024-01-23'), value: 95, secondary: 92 },
  { date: new Date('2024-01-24'), value: 97, secondary: 94 },
  { date: new Date('2024-01-25'), value: 96, secondary: 95 },
  { date: new Date('2024-01-26'), value: 98, secondary: 96 },
];

// Bar Chart Data
const barData = [
  { pipeline: 'ETL-1', success: 45, failed: 5 },
  { pipeline: 'ETL-2', success: 38, failed: 3 },
  { pipeline: 'Analytics', success: 52, failed: 8 },
  { pipeline: 'Reporting', success: 41, failed: 2 },
  { pipeline: 'ML-Pipeline', success: 35, failed: 7 },
];

// Area Chart Data
const areaData = [
  { time: '00:00', cpu: 45, memory: 62 },
  { time: '04:00', cpu: 38, memory: 55 },
  { time: '08:00', cpu: 72, memory: 78 },
  { time: '12:00', cpu: 85, memory: 88 },
  { time: '16:00', cpu: 68, memory: 72 },
  { time: '20:00', cpu: 52, memory: 65 },
  { time: '24:00', cpu: 41, memory: 58 },
];

function LineChart() {
  const width = 400;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleTime({
    domain: [Math.min(...lineData.map(d => d.date.getTime())), Math.max(...lineData.map(d => d.date.getTime()))],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [85, 100],
    range: [innerHeight, 0],
  });

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="text-lg font-mono">
          Quality Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height}>
          <LinearGradient id="line-gradient" from="#5B6EFF" to="#9B87FF" />
          <LinearGradient id="area-gradient" from="#5B6EFF" to="#5B6EFF" fromOpacity={0.3} toOpacity={0} />

          <Group left={margin.left} top={margin.top}>
            <Grid
              xScale={xScale}
              yScale={yScale}
              width={innerWidth}
              height={innerHeight}
              stroke="#333333"
              strokeOpacity={0.1}
              strokeDasharray="2,2"
            />

            <Area
              data={lineData}
              x={d => xScale(d.date)}
              y0={innerHeight}
              y1={d => yScale(d.value)}
              fill="url(#area-gradient)"
              curve={curveMonotoneX}
            />

            <LinePath
              data={lineData}
              x={d => xScale(d.date)}
              y={d => yScale(d.value)}
              stroke="url(#line-gradient)"
              strokeWidth={2}
              curve={curveMonotoneX}
            />

            <LinePath
              data={lineData}
              x={d => xScale(d.date)}
              y={d => yScale(d.secondary)}
              stroke="#00E5C8"
              strokeWidth={2}
              strokeDasharray="4,4"
              strokeOpacity={0.6}
              curve={curveMonotoneX}
            />

            <AxisBottom
              scale={xScale}
              top={innerHeight}
              stroke="#666666"
              tickStroke="#666666"
              tickLabelProps={() => ({
                fill: '#999999',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textAnchor: 'middle',
              })}
              tickFormat={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            />

            <AxisLeft
              scale={yScale}
              stroke="#666666"
              tickStroke="#666666"
              tickLabelProps={() => ({
                fill: '#999999',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textAnchor: 'end',
                dx: -4,
              })}
              tickFormat={(d) => `${d}%`}
            />
          </Group>
        </svg>
      </CardContent>
    </Card>
  );
}

function BarChart() {
  const width = 400;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    domain: barData.map(d => d.pipeline),
    range: [0, innerWidth],
    padding: 0.2,
  });

  const yScale = scaleLinear({
    domain: [0, 60],
    range: [innerHeight, 0],
  });

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="text-lg font-mono">
          Pipeline Runs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height}>
          <LinearGradient id="bar-gradient" from="#5B6EFF" to="#7A85FF" />

          <Group left={margin.left} top={margin.top}>
            <Grid
              xScale={xScale}
              yScale={yScale}
              width={innerWidth}
              height={innerHeight}
              stroke="#333333"
              strokeOpacity={0.1}
              strokeDasharray="2,2"
              numTicksRows={6}
            />

            {barData.map((d, i) => {
              const barHeight = innerHeight - yScale(d.success);
              const barX = xScale(d.pipeline) ?? 0;
              const barWidth = xScale.bandwidth();
              const failedHeight = innerHeight - yScale(d.failed);

              return (
                <Group key={`bar-${i}`}>
                  <Bar
                    x={barX}
                    y={yScale(d.success)}
                    width={barWidth}
                    height={barHeight}
                    fill="url(#bar-gradient)"
                    rx={4}
                  />
                  <Bar
                    x={barX}
                    y={yScale(d.failed)}
                    width={barWidth}
                    height={failedHeight}
                    fill="#FF6B7A"
                    fillOpacity={0.5}
                    rx={4}
                  />
                </Group>
              );
            })}

            <AxisBottom
              scale={xScale}
              top={innerHeight}
              stroke="#666666"
              tickStroke="#666666"
              tickLabelProps={() => ({
                fill: '#999999',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textAnchor: 'middle',
              })}
            />

            <AxisLeft
              scale={yScale}
              stroke="#666666"
              tickStroke="#666666"
              tickLabelProps={() => ({
                fill: '#999999',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textAnchor: 'end',
                dx: -4,
              })}
            />
          </Group>
        </svg>
      </CardContent>
    </Card>
  );
}

function AreaChart() {
  const width = 400;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    domain: areaData.map(d => d.time),
    range: [0, innerWidth],
    padding: 0.1,
  });

  const yScale = scaleLinear({
    domain: [0, 100],
    range: [innerHeight, 0],
  });

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="text-lg font-mono">
          Resource Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height}>
          <LinearGradient id="cpu-gradient" from="#5B6EFF" to="#5B6EFF" fromOpacity={0.5} toOpacity={0} />
          <LinearGradient id="memory-gradient" from="#00E5C8" to="#00E5C8" fromOpacity={0.5} toOpacity={0} />

          <Group left={margin.left} top={margin.top}>
            <Grid
              xScale={xScale}
              yScale={yScale}
              width={innerWidth}
              height={innerHeight}
              stroke="#333333"
              strokeOpacity={0.1}
              strokeDasharray="2,2"
            />

            <Area
              data={areaData}
              x={d => (xScale(d.time) ?? 0) + xScale.bandwidth() / 2}
              y0={innerHeight}
              y1={d => yScale(d.cpu)}
              fill="url(#cpu-gradient)"
              curve={curveMonotoneX}
            />

            <Area
              data={areaData}
              x={d => (xScale(d.time) ?? 0) + xScale.bandwidth() / 2}
              y0={innerHeight}
              y1={d => yScale(d.memory)}
              fill="url(#memory-gradient)"
              curve={curveMonotoneX}
            />

            <LinePath
              data={areaData}
              x={d => (xScale(d.time) ?? 0) + xScale.bandwidth() / 2}
              y={d => yScale(d.cpu)}
              stroke="#5B6EFF"
              strokeWidth={2}
              curve={curveMonotoneX}
            />

            <LinePath
              data={areaData}
              x={d => (xScale(d.time) ?? 0) + xScale.bandwidth() / 2}
              y={d => yScale(d.memory)}
              stroke="#00E5C8"
              strokeWidth={2}
              curve={curveMonotoneX}
            />

            <AxisBottom
              scale={xScale}
              top={innerHeight}
              stroke="#666666"
              tickStroke="#666666"
              tickLabelProps={() => ({
                fill: '#999999',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textAnchor: 'middle',
              })}
            />

            <AxisLeft
              scale={yScale}
              stroke="#666666"
              tickStroke="#666666"
              tickLabelProps={() => ({
                fill: '#999999',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textAnchor: 'end',
                dx: -4,
              })}
              tickFormat={(d) => `${d}%`}
            />
          </Group>
        </svg>
      </CardContent>
    </Card>
  );
}

export function VisualizationExamples() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-display font-medium">
          Chart Examples
        </h2>
        <p className="text-muted-foreground">
          Modern graph visualizations powered by ViSX for data visualization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LineChart />
        <BarChart />
        <div className="md:col-span-2">
          <AreaChart />
        </div>
      </div>
    </div>
  );
}