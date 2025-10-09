# Pipeline Monitor - Phase 3 Week 3: Visx Data Visualization
**Status**: READY TO START
**Goal**: Add interactive charts to visualize pipeline metrics using existing Visx components

---

## Overview

Phase 3 Week 3 will leverage the **already-integrated Visx charting library** to add rich data visualizations to the Pipeline Monitor. We'll reuse existing chart components and adapt them for pipeline-specific metrics.

---

## Visx Already Integrated ✅

### Packages Installed
```json
"@visx/axis": "^3.12.0",
"@visx/curve": "^3.12.0",
"@visx/gradient": "^3.12.0",
"@visx/group": "^3.12.0",
"@visx/mock-data": "^3.12.0",
"@visx/scale": "^3.12.0",
"@visx/shape": "^3.12.0",
"@visx/visx": "^3.12.0"
```

### Existing Chart Components
1. **`/components/Charts/LineChart.tsx`** (~290 lines)
   - Time series visualization
   - Multi-series support
   - Interactive tooltips with crosshairs
   - Animated path rendering with Framer Motion
   - Auto-detects Date vs numeric scales

2. **`/components/Charts/AreaChart.tsx`**
   - Area/gradient fills
   - Line overlays
   - Grid support

3. **`/components/Charts/HeatmapChart.tsx`**
   - 2D heatmap visualization
   - Perfect for time-based activity patterns

4. **`/components/Charts/RadialChart.tsx`**
   - Circular visualizations
   - Good for status distributions

5. **`/components/visualizations/PipelineHealthChart.tsx`** (~343 lines)
   - **Already designed for pipeline metrics!**
   - Area + line chart combo
   - Supports: throughput, latency, CDC events
   - ParentSize responsive wrapper
   - Custom tooltips with multiple metrics
   - Time-based x-axis formatting

---

## Week 3 Tasks

### Task 1: Create Pipeline Metrics Charts Component
**File**: `/components/monitor/PipelineMetricsCharts.tsx`

**Features**:
- Container component for all pipeline visualizations
- Tab interface to switch between chart types
- Responsive sizing with ParentSize
- Export buttons (SVG, PNG)

**Chart Views**:
1. **Run History** - Success/failure trends over time
2. **Success Rate by Domain** - Bar chart comparison
3. **Throughput Trends** - Real-time data flow rates
4. **Latency Distribution** - Performance analysis
5. **Activity Heatmap** - Temporal patterns

### Task 2: Adapt PipelineHealthChart for Real-Time Data
**File**: `/components/visualizations/PipelineHealthChart.tsx`

**Changes Needed**:
- Connect to SWR hooks (`usePipelineMetrics`)
- Add time range selector (1h, 6h, 24h, 7d)
- Support streaming metrics updates
- Add data freshness indicator

### Task 3: Create Success Rate Bar Chart
**File**: `/components/monitor/SuccessRateChart.tsx`

**Using**: `@visx/shape` Bar component

**Data Structure**:
```typescript
interface DomainSuccessRate {
  domain: string;
  successRate: number;
  totalRuns: number;
  successCount: number;
  failedCount: number;
}
```

**Visual Design**:
- Horizontal bars grouped by domain
- Color-coded: green (>90%), yellow (70-90%), red (<70%)
- Tooltip shows detailed counts
- Sort by success rate (ascending/descending)

### Task 4: Create Pipeline Activity Heatmap
**File**: `/components/monitor/ActivityHeatmap.tsx`

**Using**: Adapt `/components/Charts/HeatmapChart.tsx`

**Data Structure**:
```typescript
interface PipelineActivity {
  hour: number; // 0-23
  day: string; // Mon-Sun or date
  runCount: number;
  avgDuration: number;
  successRate: number;
}
```

**Visual Design**:
- Y-axis: Days (last 7 days or Mon-Sun)
- X-axis: Hours (0-23)
- Color intensity: Run frequency
- Tooltip: Count, avg duration, success rate

### Task 5: Add Sparklines to Pipeline Cards
**File**: `/components/monitor/PipelineSparkline.tsx`

**Using**: Simplified LineChart

**Features**:
- Mini inline charts (width: 100px, height: 30px)
- No axes, just the trend line
- Last 24 hours of data
- Hover shows mini tooltip

### Task 6: Integrate Charts into Pipeline Detail Panel
**File**: Update `/components/monitor/PipelineDetailPanel.tsx`

**Add**:
- Tabbed interface: Overview | Metrics | History | Activity
- **Metrics Tab**: PipelineHealthChart with real-time updates
- **History Tab**: Run success/failure timeline
- **Activity Tab**: Heatmap of run patterns
- Export button for each chart

### Task 7: Create Data Transformation Utilities
**File**: `/lib/utils/pipeline-chart-data.ts`

**Functions**:
```typescript
// Transform API data to chart format
export function transformPipelineHistory(
  runs: PipelineRun[]
): LineChartSeries[];

export function calculateDomainSuccessRates(
  pipelines: Pipeline[]
): DomainSuccessRate[];

export function generateActivityHeatmap(
  runs: PipelineRun[],
  days: number
): PipelineActivity[][];

export function generateSparklineData(
  pipelineId: string,
  hours: number
): LineChartDataPoint[];
```

---

## Implementation Plan

### Day 1: Setup & Data Utilities
- [ ] Create `/lib/utils/pipeline-chart-data.ts`
- [ ] Implement data transformation functions
- [ ] Write unit tests for transformations
- [ ] Add mock data generators for testing

### Day 2: Core Chart Components
- [ ] Create `PipelineMetricsCharts.tsx` container
- [ ] Build `SuccessRateChart.tsx` (bar chart)
- [ ] Create `PipelineSparkline.tsx` (mini chart)
- [ ] Test with mock data

### Day 3: Heatmap & Timeline
- [ ] Create `ActivityHeatmap.tsx`
- [ ] Adapt existing HeatmapChart component
- [ ] Add time range selector component
- [ ] Test responsive behavior

### Day 4: Integration & Real-Time Updates
- [ ] Integrate charts into PipelineDetailPanel
- [ ] Connect to SWR hooks for live data
- [ ] Add loading skeletons
- [ ] Test auto-refresh behavior

### Day 5: Polish & Export
- [ ] Add export functionality (SVG, PNG)
- [ ] Implement time range filters
- [ ] Add data freshness indicators
- [ ] Performance optimization
- [ ] Documentation

---

## API Integration

### Existing SWR Hooks (Already Available)
```typescript
// From /hooks/usePipelineMetrics.ts
usePipelineList(filters?: PipelineFilters)
  → Returns: pipelines[], isLoading, error, mutate

usePipelineMetrics(pipelineId: string)
  → Returns: pipeline, isLoading, error, mutate
  → Auto-refresh: 5 seconds

useMonitorHealth()
  → Returns: health status
```

### New Endpoints Needed (Optional)
```typescript
// Pipeline run history for charts
GET /api/monitor/pipelines/{id}/history
  ?timeRange=1h|6h|24h|7d
  ?limit=100

Response: {
  runs: [{
    timestamp: "2025-10-08T10:00:00Z",
    status: "success" | "failed" | "running",
    duration: 1234,
    recordsProcessed: 50000
  }]
}

// Aggregated metrics for charts
GET /api/monitor/pipelines/{id}/metrics/timeseries
  ?metric=throughput|latency|successRate
  ?timeRange=1h|6h|24h|7d
  ?interval=1m|5m|15m|1h

Response: {
  data: [{
    timestamp: "2025-10-08T10:00:00Z",
    value: 123.45
  }]
}
```

**Note**: If backend endpoints aren't ready, we can use data transformation on existing pipeline list data.

---

## Example: Reusing PipelineHealthChart

The existing `PipelineHealthChart` component is **perfect** for our needs:

```typescript
// Current implementation supports:
<PipelineHealthChart
  data={pipelineMetrics}
  metric="throughput" | "latency" | "cdc"
  width={800}
  height={300}
/>

// We just need to:
1. Connect it to usePipelineMetrics() hook
2. Transform real-time data to PipelineMetric[] format
3. Add to PipelineDetailPanel
```

**Data Transformation**:
```typescript
// Transform API data to chart format
const chartData: PipelineMetric[] = useMemo(() => {
  if (!pipeline?.streamingMetrics) return [];

  // Generate time series from current metrics
  // (or fetch from /history endpoint)
  return generateTimeSeriesData(pipeline);
}, [pipeline]);
```

---

## UI/UX Design

### Chart Container Layout
```
┌────────────────────────────────────────────────────────┐
│  Pipeline Metrics                    [Export ▼] [⟳]    │
├────────────────────────────────────────────────────────┤
│  [Overview] [Metrics] [History] [Activity]             │
├────────────────────────────────────────────────────────┤
│                                                         │
│     [Chart renders here - responsive]                  │
│                                                         │
│     - Interactive tooltips on hover                    │
│     - Time range selector at bottom                    │
│     - Data freshness indicator: "Updated 3s ago"       │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Time Range Selector
```tsx
<div className="flex items-center gap-2">
  <Button size="sm" variant={range === '1h' ? 'default' : 'outline'}>
    1H
  </Button>
  <Button size="sm" variant={range === '6h' ? 'default' : 'outline'}>
    6H
  </Button>
  <Button size="sm" variant={range === '24h' ? 'default' : 'outline'}>
    24H
  </Button>
  <Button size="sm" variant={range === '7d' ? 'default' : 'outline'}>
    7D
  </Button>
</div>
```

### Data Freshness Indicator
```tsx
<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
  <span>Updated {timeAgo}</span>
</div>
```

---

## Performance Considerations

### Optimization Strategies

1. **useMemo for Data Transformations**
```typescript
const chartData = useMemo(() =>
  transformPipelineHistory(pipeline?.runs || []),
  [pipeline?.runs]
);
```

2. **Throttle Tooltip Updates**
```typescript
const handleTooltip = useMemo(
  () => throttle((event) => { /* ... */ }, 16), // 60fps
  []
);
```

3. **Virtual Rendering for Large Datasets**
- Limit data points to 1000 max
- Use data sampling for long time ranges
- Progressive loading for historical data

4. **Chart Memoization**
```typescript
export const MemoizedPipelineChart = React.memo(
  PipelineHealthChart,
  (prev, next) => prev.data === next.data
);
```

---

## Testing Strategy

### Unit Tests
```bash
# Test data transformations
jest /lib/utils/pipeline-chart-data.test.ts

# Test chart components with mock data
jest /components/monitor/PipelineMetricsCharts.test.tsx
```

### Integration Tests
```bash
# Test real-time updates
# Test export functionality
# Test responsive behavior
```

### Visual Regression Tests (Optional)
```bash
# Playwright screenshots of charts
# Compare with baseline
```

---

## Success Criteria

### Week 3 Deliverables
- [ ] 5 new chart components created
- [ ] Integrated into Pipeline Detail Panel
- [ ] Real-time updates via SWR (5s refresh)
- [ ] Interactive tooltips on all charts
- [ ] Time range selector (1h, 6h, 24h, 7d)
- [ ] Export functionality (SVG/PNG)
- [ ] Responsive design (mobile-friendly)
- [ ] Data freshness indicators
- [ ] ~800 lines of production code

### Quality Metrics
- [ ] Charts load in <500ms
- [ ] Smooth animations (60fps)
- [ ] Tooltips respond instantly (<16ms)
- [ ] Auto-refresh doesn't cause UI jank
- [ ] Mobile responsive (min width: 320px)

---

## Resources

### Visx Documentation
- https://airbnb.io/visx/docs
- https://airbnb.io/visx/gallery

### Reference Components
- `/components/Charts/LineChart.tsx` - Best example
- `/components/visualizations/PipelineHealthChart.tsx` - Pipeline-specific
- `/components/Charts/HeatmapChart.tsx` - Heatmap template

### Color Palette (from existing charts)
```typescript
// From existing PipelineHealthChart
color: 'hsl(var(--chart-1))', // Primary metric
color: 'hsl(var(--chart-2))', // Secondary metric
color: 'hsl(var(--chart-3))', // Tertiary metric
```

---

## Next Session Checklist

Before starting Week 3 implementation:

1. ✅ Verify Visx packages are installed
2. ✅ Review existing chart components
3. ✅ Understand PipelineHealthChart implementation
4. ✅ Check SWR hooks are working
5. ✅ Confirm backend API is returning data
6. [ ] Create task list for Day 1
7. [ ] Set up mock data generators
8. [ ] Design chart layouts (sketches/wireframes)

---

**Ready to Start**: Phase 3 Week 3 can begin immediately. All dependencies are installed and working.
