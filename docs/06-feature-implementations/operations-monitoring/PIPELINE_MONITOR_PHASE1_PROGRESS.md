# Pipeline Monitor - Phase 1 Progress Report
**Date**: 2025-10-08
**Status**: 🚧 In Progress
**Page**: `/monitor/pipelines`

---

## Completed Tasks ✅

### 1. Navigation Restructure
**File**: `/components/layout/TopNavigation.tsx`

**Changes**:
- Removed "Manage" top-level item
- Expanded "Monitor" dropdown with operational items:
  - System Status
  - Connections
  - Pipelines
  - Data Products
- Added new "Govern" top-level item with policy items:
  - Access Control
  - Quality Rules
  - Compliance

**Result**: Cleaner 5-item navigation (Overview | Build | Discover | Monitor | Govern)

---

### 2. Enhanced Pipeline Interface
**File**: `/app/(main)/monitor/pipelines/page.tsx`

**Added**:
- `IngestionMethod` type: `'federated' | 'streaming_cdc' | 'batch_cdc' | 'incremental'`
- Extended `Pipeline` interface with:
  - `method: IngestionMethod` field
  - Method-specific metric objects:
    - `streamingMetrics`: consumer lag, throughput, error rate, DLQ count, Kafka topic
    - `batchMetrics`: last snapshot, row delta, avg duration, interval, storage size
    - `incrementalMetrics`: watermark, rows processed, late arrivals, offset
    - `federatedMetrics`: latencies (avg, P95, P99), error rate, query volume, connection status
  - New status values: `'healthy' | 'lagging' | 'delayed' | 'stuck' | 'unreachable'`

---

### 3. Realistic Mock Data
**File**: `/app/(main)/monitor/pipelines/page.tsx`

**Created 9 pipelines** covering all ingestion methods:

**Streaming CDC (2)**:
- `orders_stream` - Status: lagging (15min behind, 145k msg lag)
- `customers_stream` - Status: healthy (890 msg/sec, minimal lag)

**Batch CDC (2)**:
- `inventory_batch` - Status: success (5min snapshots, +1.2k rows)
- `products_batch` - Status: delayed (25min since last snapshot)

**Incremental Query (2)**:
- `events_incremental` - Status: success (45k rows processed, 234 late arrivals)
- `logs_incremental` - Status: stuck (watermark 24h old, 0 new rows)

**Federated Query (3)**:
- `pg_orders_live` - Status: healthy (234ms avg, 567ms P95)
- `mysql_users_live` - Status: healthy (156ms avg, 345ms P95)
- `mongo_events_live` - Status: unreachable (connection error, 100% error rate)

---

### 4. Method-Specific Helper Functions
**File**: `/app/(main)/monitor/pipelines/page.tsx`

**Added helper functions**:

```typescript
getMethodIcon(method) → Database | Zap | Clock | TrendingUp
getMethodLabel(method) → "Federated Query (Trino)" | "Streaming CDC (Kafka)" | etc.
getMethodMetrics(pipeline) → Method-specific metric summary
toggleMethodCollapse(method) → Collapse/expand method groups
```

---

## In Progress 🚧

### Current Task: Method-Based Grouping UI

**Objective**: Replace flat table with grouped view organized by ingestion method

**Planned UI Structure**:
```
┌─────────────────────────────────────────────────────┐
│ Streaming CDC (Kafka)                  [Collapse]   │
├─────────────────────────────────────────────────────┤
│ orders_stream     ⚠️ Lag: 15min  1.2k msg/s  [View]│
│ customers_stream  ✅ Healthy     890 msg/s   [View]│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Batch CDC (Snapshots)                  [Collapse]   │
├─────────────────────────────────────────────────────┤
│ inventory_batch   ✅ Fresh (3m ago)  2m 34s   [View]│
│ products_batch    ⚠️ Delayed (25m ago) 5m    [View]│
└─────────────────────────────────────────────────────┘
```

---

## Pending Tasks 📋

### Task 1: Complete Method-Based Grouping (Phase 1)
**Complexity**: Medium
**Time Estimate**: 2-3 hours

**Subtasks**:
1. Group filtered pipelines by method
2. Render collapsible sections for each method
3. Show method-specific metrics inline
4. Update status badges with method-appropriate indicators
5. Add method filter dropdown (in addition to domain/status)

---

### Task 2: Update Pipeline Detail Panel (Phase 2)
**Complexity**: High
**Time Estimate**: 4-6 hours

**Subtasks**:
1. Update `PipelineDetailPanel` to accept method field
2. Create method-specific tab structures:
   - Streaming CDC: Overview | Consumer Lag | Errors | Schema
   - Batch CDC: Overview | Run History | Row Diffs | Schedule
   - Incremental: Overview | Watermark | Late Arrivals | Backfill
   - Federated: Overview | Performance | Queries | Connection
3. Render method-specific metrics in detail tabs
4. Add method-specific action buttons
5. Update mock data in detail panel

---

### Task 3: Cross-System Integration (Phase 3)
**Complexity**: Very High
**Time Estimate**: 1-2 weeks

**Backend Work Required**:
- Kafka Admin API integration (consumer lag, topic health)
- Trino Stats API integration (query performance, errors)
- Airflow REST API integration (DAG runs, task statuses)
- DataHub GraphQL integration (lineage, metadata)

**Frontend Work**:
- Real-time metric updates (WebSocket or polling)
- Correlated alert timeline
- Cross-system health indicators
- Embedded Airflow/Kafka views

---

### Task 4: AI-Powered Insights (Phase 4)
**Complexity**: Very High
**Time Estimate**: 2-3 weeks

**Features**:
- Lag spike prediction for streaming CDC
- Optimal batch interval recommendations
- Watermark drift detection
- Query performance regression alerts
- Root cause correlation (e.g., "Kafka lag increased when source DB was slow")
- Auto-remediation suggestions

---

## Technical Debt & Considerations

### 1. State Management
- **Current**: Local component state
- **Future**: Consider moving to Zustand or Context for cross-component pipeline state
- **Reason**: Avoid prop drilling when adding filters, sorts, and cross-page navigation

### 2. Data Fetching
- **Current**: Mock data
- **Future**: React Query for caching, background refetching, and optimistic updates
- **Reason**: Real-time metrics require efficient polling without UI jank

### 3. Type Safety
- **Current**: Method-specific metrics are optional (using `?`)
- **Future**: Discriminated unions for type-safe method access
- **Example**:
```typescript
type Pipeline =
  | { method: 'streaming_cdc', streamingMetrics: Required<StreamingMetrics> }
  | { method: 'batch_cdc', batchMetrics: Required<BatchMetrics> }
  | { method: 'incremental', incrementalMetrics: Required<IncrementalMetrics> }
  | { method: 'federated', federatedMetrics: Required<FederatedMetrics> };
```

### 4. Performance Optimization
- **Current**: Rendering all pipelines at once
- **Future**: Virtual scrolling for large pipeline lists (100+ items)
- **Reason**: Enterprises may have hundreds of ingestion pipelines

---

## Testing Strategy

### Unit Tests (To Add)
- Method helper functions (icon, label, metrics)
- Filter logic (search, domain, status, method)
- Collapse/expand state management

### Integration Tests (To Add)
- Pipeline list rendering with different methods
- Detail panel opening with correct method context
- Filter combinations produce expected results

### E2E Tests (To Add)
- Complete workflow: filter → select pipeline → view details → take action
- Method-specific actions (e.g., restart Kafka consumer, trigger snapshot)

---

## Next Steps

**Immediate (Today)**:
1. Complete method-based grouping UI
2. Test grouping with mock data
3. Add method filter dropdown

**Short-term (This Week)**:
1. Update PipelineDetailPanel with method-specific tabs
2. Add method-specific action buttons
3. Test complete flow (list → details → actions)

**Medium-term (Next 2 Weeks)**:
1. Begin backend API integrations (Kafka, Trino, Airflow)
2. Replace mock data with real metrics
3. Add real-time updates

**Long-term (Month 1-2)**:
1. Implement AI-powered insights
2. Add predictive alerting
3. Build auto-remediation workflows

---

## Conclusion

Phase 1 is **70% complete**. Core data structures and helper functions are in place. Remaining work focuses on UI rendering and user interactions. Once Phase 1 is complete, we'll have a functional method-aware pipeline monitor that properly represents the operational reality of different ingestion methods.

**Key Achievement**: We've moved from treating all pipelines as generic Airflow DAGs to recognizing the fundamental differences between Federated Query, Streaming CDC, Batch CDC, and Incremental Query - setting the foundation for a more intelligent and user-friendly monitoring experience.
