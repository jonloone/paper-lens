'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Download,
  Filter
} from "lucide-react";

// Mock data generation
const generateTimeSeriesData = (points: number = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // Daily data
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      throughput: Math.floor(Math.random() * 500) + 800,
      latency: Math.floor(Math.random() * 50) + 20,
      errors: Math.floor(Math.random() * 10),
      success_rate: 95 + Math.random() * 4
    });
  }
  
  return data;
};

interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down';
}

export function PerformanceChart() {
  const data = useMemo(() => generateTimeSeriesData(), []);
  
  const metrics: PerformanceMetric[] = [
    {
      label: 'Avg Throughput',
      value: 1234,
      unit: 'MB/s',
      change: 12.5,
      trend: 'up'
    },
    {
      label: 'Avg Latency',
      value: 45,
      unit: 'ms',
      change: -8.2,
      trend: 'down'
    },
    {
      label: 'Success Rate',
      value: 98.7,
      unit: '%',
      change: 0.3,
      trend: 'up'
    },
    {
      label: 'Error Rate',
      value: 1.3,
      unit: '%',
      change: -0.3,
      trend: 'down'
    }
  ];

  // Simple SVG chart (since we're not using a full charting library yet)
  const renderChart = () => {
    const width = 600;
    const height = 200;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const maxThroughput = Math.max(...data.map(d => d.throughput));
    const minThroughput = Math.min(...data.map(d => d.throughput));
    
    const xScale = (index: number) => 
      padding + (index / (data.length - 1)) * chartWidth;
    
    const yScale = (value: number) => 
      padding + (1 - (value - minThroughput) / (maxThroughput - minThroughput)) * chartHeight;
    
    const pathData = data
      .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(point.throughput)}`)
      .join(' ');
    
    const areaData = pathData + 
      ` L ${xScale(data.length - 1)} ${height - padding}` +
      ` L ${xScale(0)} ${height - padding} Z`;

    return (
      <svg width={width} height={height} className="w-full h-auto">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding}
            x2={width - padding}
            y1={padding + (i * chartHeight) / 4}
            y2={padding + (i * chartHeight) / 4}
            stroke="rgba(156, 163, 175, 0.1)"
            strokeDasharray="3,3"
          />
        ))}
        
        {/* Area */}
        <path
          d={areaData}
          fill="url(#gradient)"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((point, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(point.throughput)}
            r="3"
            fill="rgb(59, 130, 246)"
            className="hover:r-5 transition-all cursor-pointer"
          />
        ))}
        
        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const value = minThroughput + (i * (maxThroughput - minThroughput)) / 4;
          return (
            <text
              key={i}
              x={padding - 5}
              y={height - padding - (i * chartHeight) / 4}
              textAnchor="end"
              className="text-xs fill-gray-400"
            >
              {Math.round(value)}
            </text>
          );
        })}
        
        {/* X-axis labels */}
        {data.filter((_, i) => i % 5 === 0).map((point, i) => (
          <text
            key={i}
            x={xScale(i * 5)}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-400"
          >
            {point.date.substring(5)}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5" />
            Pipeline Performance
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-white">
                    {metric.value}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">
                    {metric.unit}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  metric.trend === 'up' && metric.change > 0 ? 'text-green-400' : 
                  metric.trend === 'down' && metric.change < 0 ? 'text-green-400' :
                  'text-red-400'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Chart */}
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300">Throughput Trend</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">Live</Badge>
              <Badge variant="secondary" className="text-xs">30 Days</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            {renderChart()}
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Peak Time</div>
            <div className="text-sm text-white font-medium">14:30 - 15:30</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Avg Processing</div>
            <div className="text-sm text-white font-medium">2.4M records/hour</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Efficiency Score</div>
            <div className="text-sm text-white font-medium">94/100</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}