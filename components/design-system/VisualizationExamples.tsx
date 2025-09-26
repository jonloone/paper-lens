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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quality Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height}>
          <LinearGradient id="area-gradient" from="#5B6EFF" to="#5B6EFF" fromOpacity={0.3} toOpacity={0} />
          <Group left={margin.left} top={margin.top}>
            <Grid
              xScale={xScale}
              yScale={yScale}
              width={innerWidth}
              height={innerHeight}
              stroke="#e0e0e0"
              strokeOpacity={0.1}
            />

            {/* Primary line */}
            <LinePath
              data={lineData}
              x={(d) => xScale(d.date) ?? 0}
              y={(d) => yScale(d.value) ?? 0}
              stroke="#5B6EFF"
              strokeWidth={2}
              curve={curveMonotoneX}
            />

            {/* Secondary line */}
            <LinePath
              data={lineData}
              x={(d) => xScale(d.date) ?? 0}
              y={(d) => yScale(d.secondary) ?? 0}
              stroke="#00E5C8"
              strokeWidth={2}
              curve={curveMonotoneX}
            />

            <AxisLeft
              scale={yScale}
              stroke="#888"
              tickStroke="#888"
              tickLabelProps={() => ({
                fill: '#888',
                fontSize: 10,
                textAnchor: 'end',
                dx: -4,
              })}
            />

            <AxisBottom
              scale={xScale}
              top={innerHeight}
              stroke="#888"
              tickStroke="#888"
              tickLabelProps={() => ({
                fill: '#888',
                fontSize: 10,
                textAnchor: 'middle',
              })}
              tickFormat={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
          </Group>
        </svg>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#5B6EFF]" />
            <span className="text-xs text-muted-foreground">Completeness</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00E5C8]" />
            <span className="text-xs text-muted-foreground">Validity</span>
          </div>
        </div>
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
    padding: 0.3,
  });

  const yScale = scaleLinear({
    domain: [0, 60],
    range: [innerHeight, 0],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pipeline Runs</CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <Grid
              xScale={xScale}
              yScale={yScale}
              width={innerWidth}
              height={innerHeight}
              stroke="#e0e0e0"
              strokeOpacity={0.1}
            />

            {barData.map((d) => {
              const barWidth = xScale.bandwidth();
              const barX = xScale(d.pipeline) ?? 0;
              const successHeight = innerHeight - (yScale(d.success) ?? 0);
              const failedHeight = innerHeight - (yScale(d.failed) ?? 0);

              return (
                <Group key={d.pipeline}>
                  <Bar
                    x={barX}
                    y={yScale(d.success) ?? 0}
                    width={barWidth / 2 - 2}
                    height={successHeight}
                    fill="#00E5C8"
                  />
                  <Bar
                    x={barX + barWidth / 2 + 2}
                    y={yScale(d.failed) ?? 0}
                    width={barWidth / 2 - 2}
                    height={failedHeight}
                    fill="#FF6B7A"
                  />
                </Group>
              );
            })}

            <AxisLeft
              scale={yScale}
              stroke="#888"
              tickStroke="#888"
              tickLabelProps={() => ({
                fill: '#888',
                fontSize: 10,
                textAnchor: 'end',
                dx: -4,
              })}
            />

            <AxisBottom
              scale={xScale}
              top={innerHeight}
              stroke="#888"
              tickStroke="#888"
              tickLabelProps={() => ({
                fill: '#888',
                fontSize: 10,
                textAnchor: 'middle',
                dy: 3,
              })}
            />
          </Group>
        </svg>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#00E5C8]" />
            <span className="text-xs text-muted-foreground">Success</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#FF6B7A]" />
            <span className="text-xs text-muted-foreground">Failed</span>
          </div>
        </div>
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
    padding: 0,
  });

  const yScale = scaleLinear({
    domain: [0, 100],
    range: [innerHeight, 0],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resource Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <svg width={width} height={height}>
          <defs>
            <linearGradient id="cpu-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B6EFF" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#5B6EFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="memory-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFB366" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#FFB366" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Group left={margin.left} top={margin.top}>
            <Grid
              xScale={xScale}
              yScale={yScale}
              width={innerWidth}
              height={innerHeight}
              stroke="#e0e0e0"
              strokeOpacity={0.1}
            />

            {/* CPU Area */}
            <Area
              data={areaData}
              x={(d) => (xScale(d.time) ?? 0) + xScale.bandwidth() / 2}
              y={(d) => yScale(d.cpu) ?? 0}
              yScale={yScale}
              fill="url(#cpu-gradient)"
              stroke="#5B6EFF"
              strokeWidth={2}
              curve={curveMonotoneX}
            />

            {/* Memory Area */}
            <Area
              data={areaData}
              x={(d) => (xScale(d.time) ?? 0) + xScale.bandwidth() / 2}
              y={(d) => yScale(d.memory) ?? 0}
              yScale={yScale}
              fill="url(#memory-gradient)"
              stroke="#FFB366"
              strokeWidth={2}
              curve={curveMonotoneX}
            />

            <AxisLeft
              scale={yScale}
              stroke="#888"
              tickStroke="#888"
              tickLabelProps={() => ({
                fill: '#888',
                fontSize: 10,
                textAnchor: 'end',
                dx: -4,
              })}
              tickFormat={(value) => `${value}%`}
            />

            <AxisBottom
              scale={xScale}
              top={innerHeight}
              stroke="#888"
              tickStroke="#888"
              tickLabelProps={() => ({
                fill: '#888',
                fontSize: 10,
                textAnchor: 'middle',
              })}
            />
          </Group>
        </svg>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#5B6EFF]" />
            <span className="text-xs text-muted-foreground">CPU Usage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFB366]" />
            <span className="text-xs text-muted-foreground">Memory Usage</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VisualizationExamples() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <LineChart />
      <BarChart />
      <AreaChart />
    </div>
  );
}