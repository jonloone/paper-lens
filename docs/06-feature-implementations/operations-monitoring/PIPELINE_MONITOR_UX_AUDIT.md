# Pipeline Monitor Page - Critical UX Audit & Redesign
**Date**: 2025-10-08
**Status**: 🔍 Analysis & Planning
**Page**: `/monitor/pipelines`

---

## Executive Summary

The current pipeline monitoring page treats all ingestion methods (Federated Query, Streaming CDC, Batch CDC, Incremental Query) as generic "pipelines" scheduled via Airflow. This is fundamentally incorrect and creates a UX that doesn't match operational reality.

**Critical Issue**: Different ingestion methods have **completely different operational characteristics, monitoring needs, and failure modes**. Treating them uniformly creates cognitive overhead and hides critical information.

---

## Current State Analysis

### What We Have Now
```
Pipeline List Table:
- Pipeline Name
- Status (running/success/failed/paused)
- Next Run
- Last Run
- Duration
- Schedule (cron)
- Actions (Pause/Resume, Trigger, Open Airflow)
```

### Critical Problems

#### Problem 1: **Ingestion Methods ≠ Airflow DAGs**
**Reality**:
- **Federated Query**: No pipeline - queries run on-demand via Trino
- **Streaming CDC**: Continuous Kafka consumer - no schedule, no "runs"
- **Batch CDC**: Scheduled snapshots - has runs and schedules
- **Incremental Query**: Scheduled SQL queries - has runs and schedules

**Current UX Issue**: Shows all as "pipelines" with schedules, which is misleading for Federated and Streaming.

#### Problem 2: **Wrong Mental Model for Monitoring**
**What Users Actually Need to Monitor**:

| Method | Key Metrics | Failure Modes | Actions |
|--------|-------------|---------------|---------|
| **Federated** | Query latency, connection health | Source down, auth expired | Re-auth, test query |
| **Streaming CDC** | Consumer lag, throughput, topic health | Kafka down, schema drift | Restart consumer, reset offset |
| **Batch CDC** | Last snapshot time, row count delta | Snapshot failure, data drift | Re-run, investigate diff |
| **Incremental** | Watermark position, missing rows | Timestamp gaps, duplicates | Backfill, adjust watermark |

**Current UX Issue**: None of this context-specific information is shown. Everything looks like a generic DAG.

#### Problem 3: **Persona Mismatch**

**Senior Data Engineer (40% of users)**:
- **Needs**: Fast root cause analysis, performance optimization, cross-system correlation
- **Current UX Fails**: Can't see Kafka lag, Trino stats, or CDC metrics without leaving the page

**Data Engineer (30% of users)**:
- **Needs**: Clear health indicators, guided troubleshooting, best practices
- **Current UX Fails**: No context on what "failed" means for each method, no suggested fixes

**Analytics Engineer (20% of users)**:
- **Needs**: Data freshness, quality status, usage tracking
- **Current UX Fails**: Can't see when data was last updated or if quality checks passed

**Data Analyst (10% of users)**:
- **Needs**: Simple "is my data fresh?" indicator
- **Current UX Fails**: Too technical, no plain-language status

---

## Persona-Driven Requirements Analysis

### Primary Persona: Senior Data Engineer

**"I need to know if my data pipelines are healthy and why they're failing"**

**Critical Information**:
1. **Health at a Glance**: Color-coded status across all ingestion methods
2. **Performance Trends**: Lag, throughput, duration over time
3. **Root Cause Indicators**: Kafka lag spike, source connection down, schema change
4. **Cross-System Context**: Airflow run + Kafka metrics + Trino stats + source DB health
5. **Action Priorities**: What needs attention NOW vs. what's trending bad

**Critical Actions**:
- Restart streaming consumer with offset reset
- Trigger backfill for incremental query
- Force snapshot for batch CDC
- Test federated connection health
- View correlated alerts (Kafka + Airflow + DataHub)

**Time Sensitivity**: Needs to diagnose and fix issues in <5 minutes

---

### Secondary Persona: Data Engineer

**"I need to understand if my pipelines are configured correctly and running smoothly"**

**Critical Information**:
1. **Configuration Health**: Is my Kafka topic healthy? Is my cron schedule optimal?
2. **Error Patterns**: What errors are recurring? Are they configuration issues?
3. **Best Practices**: Am I following the right patterns for this ingestion method?
4. **Data Quality**: Are my quality checks passing?
5. **Resource Usage**: Am I over-provisioning or under-provisioning?

**Critical Actions**:
- Adjust batch interval based on data volume
- Fix incremental query watermark offset
- Reconfigure CDC snapshot mode
- Enable/disable quality checks
- View recommended optimizations

**Time Sensitivity**: Needs to understand issues and plan fixes within 10-15 minutes

---

### Tertiary Persona: Analytics Engineer

**"I need to know if my data products are fresh and high-quality"**

**Critical Information**:
1. **Data Freshness**: When was data last updated? Is it within SLA?
2. **Quality Status**: Are quality rules passing? Any anomalies?
3. **Usage Tracking**: Which tables are being queried? By whom?
4. **Downstream Impact**: What data products depend on this pipeline?
5. **SLA Compliance**: Are we meeting freshness and quality commitments?

**Critical Actions**:
- View data freshness timeline
- Check quality rule results
- See downstream dependencies
- Export quality report
- Set freshness alerts

**Time Sensitivity**: Needs daily/hourly health checks, not real-time firefighting

---

### Quaternary Persona: Data Analyst

**"I just need to know if my data is up-to-date"**

**Critical Information**:
1. **Simple Status**: ✅ Fresh, ⚠️ Delayed, ❌ Stale
2. **Plain Language**: "Updated 5 minutes ago" not "Last run: 2025-10-08T14:23:47Z"
3. **Expected Refresh**: "Updates every hour" not "0 * * * *"
4. **Quality Indicator**: "Data quality: Good" not "12 rules passed"

**Critical Actions**:
- View data product (not pipeline details)
- Request refresh (if allowed)
- Contact owner if data is stale

**Time Sensitivity**: Just needs quick status check before using data

---

## Ingestion Method Deep Dive

### Method 1: Federated Query (Trino)

**Operational Reality**:
- **No pipeline runs** - queries execute on-demand via Trino
- **No schedule** - users query when they need data
- **No data replication** - always hitting source database

**Key Monitoring Needs**:
1. **Connection Health**: Is source database reachable?
2. **Query Performance**: Average latency, P95, P99
3. **Error Rate**: Failed queries, timeouts, auth failures
4. **Source Load**: Are we overwhelming the source DB?
5. **Cost Tracking**: Compute resources used (if billable)

**Failure Modes**:
- Source database down or unreachable
- Authentication expired or invalid
- Query timeout (source too slow)
- Source schema changed (breaking queries)
- Network connectivity issues

**Critical Actions**:
- Test connection health
- Re-authenticate to source
- View query performance stats
- Adjust query timeout settings
- Disable if source is overloaded

**UI Requirements**:
```
Federated: PostgreSQL Production Orders
Status: ✅ Healthy
Last Query: 2 minutes ago
Avg Latency: 234ms (P95: 567ms)
Error Rate: 0.02% (3 failed / 15,234 queries)
Source Health: ✅ Connected

Actions:
[Test Connection] [View Performance] [Re-Auth] [Disable]
```

---

### Method 2: Streaming CDC (Kafka + Debezium)

**Operational Reality**:
- **Continuous consumer** - no discrete runs, always running
- **No schedule** - streams changes in real-time
- **Kafka-based** - health tied to Kafka and source database

**Key Monitoring Needs**:
1. **Consumer Lag**: How far behind is the consumer?
2. **Throughput**: Messages/sec, bytes/sec
3. **Error Rate**: Failed messages, DLQ entries
4. **Topic Health**: Partition balance, replication status
5. **Schema Evolution**: Detected schema changes
6. **Backpressure**: Is consumer keeping up with producer?

**Failure Modes**:
- Consumer crashed or stuck
- Kafka topic unavailable
- Schema incompatibility
- Source database connection lost
- Out of memory (large messages)
- Deserialization errors

**Critical Actions**:
- Restart consumer
- Reset consumer offset (re-sync from snapshot)
- View dead-letter queue
- Adjust consumer parallelism
- Handle schema change
- Scale consumer resources

**UI Requirements**:
```
Streaming CDC: PostgreSQL Orders (Kafka)
Status: ⚠️ Lagging
Consumer Lag: 145,234 messages (~15 min behind)
Throughput: 1,234 msg/sec
Error Rate: 0.01% (12 in DLQ)
Topic: cdc.production.orders (3 partitions)
Schema Version: v12 (compatible)

Actions:
[Restart Consumer] [Reset Offset] [View DLQ] [Scale Up] [Pause]
```

---

### Method 3: Batch CDC (Scheduled Snapshots)

**Operational Reality**:
- **Scheduled snapshots** - discrete runs at intervals
- **Has cron schedule** - runs every 5min to 4hrs
- **Airflow-based** - traditional DAG runs

**Key Monitoring Needs**:
1. **Last Snapshot Time**: When did we last capture data?
2. **Row Count Delta**: How many rows changed?
3. **Duration Trend**: Is snapshot taking longer over time?
4. **Failure History**: Pattern of failures?
5. **Data Drift**: Are we capturing all changes?
6. **Storage Growth**: Is snapshot size growing?

**Failure Modes**:
- Source query timeout
- Network connectivity issues
- Target storage full
- Schema mismatch
- Row count anomaly (unexpected spike/drop)
- Duplicate key conflicts

**Critical Actions**:
- Trigger immediate snapshot
- Adjust snapshot interval
- View row count diff
- Investigate data drift
- Reconfigure snapshot query
- Manage snapshot retention

**UI Requirements**:
```
Batch CDC: PostgreSQL Inventory (5min snapshots)
Status: ✅ Healthy
Last Snapshot: 3 minutes ago
Row Delta: +1,234 rows (within normal range)
Duration: 2m 34s (avg: 2m 45s)
Next Snapshot: in 2 minutes
Storage: 234 MB (+12 MB this hour)

Actions:
[Trigger Now] [View Diffs] [Adjust Interval] [Pause]
```

---

### Method 4: Incremental Query (Timestamp-Based)

**Operational Reality**:
- **Scheduled queries** - discrete runs
- **Watermark tracking** - tracks last processed timestamp
- **Airflow-based** - traditional DAG runs

**Key Monitoring Needs**:
1. **Watermark Position**: What timestamp are we at?
2. **Missing Rows**: Are we missing data due to late arrivals?
3. **Backfill Status**: Is backfill running?
4. **Query Performance**: Is query slowing down over time?
5. **Timestamp Column Health**: Any null or future timestamps?
6. **Overlap/Gaps**: Are we double-processing or missing ranges?

**Failure Modes**:
- Watermark stuck (no new data)
- Query timeout (scanning too much data)
- Late-arriving data missed
- Timestamp column has nulls
- Source schema changed
- Clock skew issues

**Critical Actions**:
- Adjust watermark offset
- Trigger backfill for missing range
- View missed rows report
- Optimize query plan
- Change timestamp column
- Reset watermark

**UI Requirements**:
```
Incremental: PostgreSQL Events (Hourly)
Status: ✅ Healthy
Watermark: 2025-10-08 14:00:00 UTC
Last Run: 15 minutes ago
Rows Processed: 45,234 (+234 late arrivals)
Late Arrival Window: 1 hour
Next Run: in 45 minutes

Actions:
[Trigger Run] [Adjust Watermark] [Backfill] [View Stats]
```

---

## Redesigned Information Architecture

### Level 1: Overview Dashboard

**Purpose**: Quick health check across ALL ingestion methods

```
┌─────────────────────────────────────────────────────┐
│ Pipeline Health Overview                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ✅ 12 Healthy   ⚠️ 3 Issues   ❌ 1 Failed         │
│                                                     │
│ By Method:                                          │
│ Federated Query:    4 healthy                      │
│ Streaming CDC:      2 healthy, 1 lagging           │
│ Batch CDC:          3 healthy, 1 delayed           │
│ Incremental Query:  3 healthy, 1 watermark stuck   │
│                                                     │
│ [View All] [Issues Only] [By Domain]               │
└─────────────────────────────────────────────────────┘
```

---

### Level 2: Method-Grouped List

**Purpose**: Show pipelines grouped by ingestion method with method-specific metrics

```
┌─────────────────────────────────────────────────────────────┐
│ Streaming CDC (Kafka)                          [Collapse]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ orders_stream         ⚠️ Lag: 15min  1.2k msg/s  [View]   │
│ customers_stream      ✅ Healthy     890 msg/s   [View]   │
│ inventory_stream      ✅ Healthy     450 msg/s   [View]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Batch CDC (Snapshots)                          [Collapse]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ inventory_batch       ✅ Fresh (3m ago)  2m 34s   [View]   │
│ products_batch        ⚠️ Delayed (25m ago) 5m 12s [View]   │
│ categories_batch      ✅ Fresh (8m ago)  1m 02s   [View]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Incremental Query                              [Collapse]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ events_incremental    ✅ Current      45k rows    [View]   │
│ logs_incremental      ⚠️ Stuck        0 new rows  [View]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Federated Query (Trino)                        [Collapse]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ pg_orders_live        ✅ Healthy      234ms avg   [View]   │
│ mysql_users_live      ✅ Healthy      156ms avg   [View]   │
│ mongo_events_live     ❌ Unreachable  N/A         [View]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Improvements**:
1. **Method-specific metrics** - each group shows relevant KPIs
2. **Visual hierarchy** - collapsible sections reduce clutter
3. **At-a-glance health** - emoji + brief status
4. **Scannable layout** - aligned columns for quick scanning

---

### Level 3: Detail Panel (Method-Specific)

**Purpose**: Deep dive into individual pipeline with method-specific tabs and metrics

#### Streaming CDC Detail Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Streaming CDC: orders_stream                    [X Close]   │
│ Status: ⚠️ Lagging (15 min behind)                         │
│                                                             │
│ [Overview] [Consumer Lag] [Errors] [Schema] [Actions]      │
├─────────────────────────────────────────────────────────────┤
│ Overview Tab:                                               │
│                                                             │
│ Consumer Status:  Running (3 partitions)                   │
│ Current Lag:      145,234 messages (~15 min)               │
│ Throughput:       1,234 msg/sec                            │
│ Error Rate:       0.01% (12 in DLQ)                        │
│ Topic:            cdc.production.orders                     │
│ Schema Version:   v12 (compatible)                          │
│ Last Message:     2 seconds ago                             │
│                                                             │
│ Lag Trend (24h):                                            │
│ [Chart showing lag over time with spike at 2pm]            │
│                                                             │
│ Recommended Actions:                                        │
│ • Consumer lag increasing - consider scaling up             │
│ • 12 messages in DLQ - review for data quality issues      │
│                                                             │
│ [Restart Consumer] [Reset Offset] [View DLQ] [Scale Up]    │
└─────────────────────────────────────────────────────────────┘
```

#### Batch CDC Detail Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Batch CDC: inventory_batch                      [X Close]   │
│ Status: ✅ Healthy (last snapshot 3m ago)                  │
│                                                             │
│ [Overview] [Run History] [Row Diffs] [Schedule] [Actions]  │
├─────────────────────────────────────────────────────────────┤
│ Overview Tab:                                               │
│                                                             │
│ Snapshot Status:  ✅ Success                                │
│ Last Snapshot:    3 minutes ago                             │
│ Row Delta:        +1,234 rows (within normal range)        │
│ Duration:         2m 34s (avg: 2m 45s)                     │
│ Schedule:         */5 * * * * (every 5 minutes)            │
│ Next Snapshot:    in 2 minutes                              │
│                                                             │
│ Row Count Trend (24h):                                      │
│ [Chart showing row count deltas over time]                 │
│                                                             │
│ Recent Snapshots:                                           │
│ • 14:57 - Success - +1,234 rows - 2m 34s                   │
│ • 14:52 - Success - +1,156 rows - 2m 41s                   │
│ • 14:47 - Success - +1,289 rows - 2m 38s                   │
│                                                             │
│ [Trigger Now] [View Diffs] [Adjust Interval] [Pause]       │
└─────────────────────────────────────────────────────────────┘
```

#### Incremental Query Detail Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Incremental: events_incremental                 [X Close]   │
│ Status: ✅ Current                                          │
│                                                             │
│ [Overview] [Watermark] [Late Arrivals] [Backfill] [Query]  │
├─────────────────────────────────────────────────────────────┤
│ Overview Tab:                                               │
│                                                             │
│ Watermark:        2025-10-08 14:00:00 UTC                  │
│ Last Run:         15 minutes ago                            │
│ Rows Processed:   45,234                                    │
│ Late Arrivals:    +234 (within 1h window)                  │
│ Schedule:         0 * * * * (hourly)                        │
│ Next Run:         in 45 minutes                             │
│                                                             │
│ Watermark Progress (24h):                                   │
│ [Chart showing watermark advancement over time]            │
│                                                             │
│ Recent Runs:                                                │
│ • 14:00 - Success - 45,234 rows - 3m 12s                   │
│ • 13:00 - Success - 43,128 rows - 3m 08s                   │
│ • 12:00 - Success - 41,567 rows - 3m 15s                   │
│                                                             │
│ [Trigger Run] [Adjust Watermark] [Backfill] [View Stats]   │
└─────────────────────────────────────────────────────────────┘
```

#### Federated Query Detail Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Federated: pg_orders_live                       [X Close]   │
│ Status: ✅ Healthy                                          │
│                                                             │
│ [Overview] [Performance] [Queries] [Connection] [Actions]  │
├─────────────────────────────────────────────────────────────┤
│ Overview Tab:                                               │
│                                                             │
│ Connection:       ✅ Healthy (authenticated)                │
│ Last Query:       2 minutes ago                             │
│ Avg Latency:      234ms (P95: 567ms, P99: 1.2s)           │
│ Error Rate:       0.02% (3 failed / 15,234 queries)        │
│ Query Volume:     ~250 queries/hour                         │
│                                                             │
│ Latency Trend (24h):                                        │
│ [Chart showing P50/P95/P99 latency over time]              │
│                                                             │
│ Recent Errors:                                              │
│ • 14:45 - Timeout after 30s - SELECT with large scan      │
│ • 12:23 - Connection refused - Network issue               │
│                                                             │
│ [Test Connection] [View Performance] [Re-Auth] [Disable]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Phased Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal**: Split view by ingestion method with basic metrics

**Deliverables**:
1. ✅ Method-based grouping (collapsible sections)
2. ✅ Method-specific status indicators
3. ✅ Method-specific key metrics in list view
4. ✅ Filter by method type
5. ✅ Search across all methods

**Files to Modify**:
- `/app/(main)/monitor/pipelines/page.tsx` - Add method grouping
- `/components/monitor/PipelineDetailPanel.tsx` - Add method detection

**Success Metrics**:
- Users can quickly identify which method type has issues
- Relevant metrics shown without opening detail panel
- <5 seconds to identify lagging streaming CDC vs delayed batch CDC

---

### Phase 2: Method-Specific Detail Panels (Week 2)
**Goal**: Deep dive with method-specific tabs and metrics

**Deliverables**:
1. ✅ Streaming CDC panel with Consumer Lag, Errors, Schema tabs
2. ✅ Batch CDC panel with Run History, Row Diffs tabs
3. ✅ Incremental panel with Watermark, Late Arrivals tabs
4. ✅ Federated panel with Performance, Queries tabs
5. ✅ Method-specific action buttons

**New Components**:
- `/components/monitor/StreamingCDCPanel.tsx`
- `/components/monitor/BatchCDCPanel.tsx`
- `/components/monitor/IncrementalPanel.tsx`
- `/components/monitor/FederatedPanel.tsx`

**Success Metrics**:
- Senior Engineers can diagnose streaming lag in <2 minutes
- Data Engineers understand configuration issues without docs
- All personas see relevant info without scrolling

---

### Phase 3: Cross-System Intelligence (Week 3)
**Goal**: Correlate metrics from Kafka, Airflow, Trino, DataHub

**Deliverables**:
1. ✅ Kafka lag metrics integrated
2. ✅ Trino query performance stats
3. ✅ DataHub lineage links
4. ✅ Airflow run logs embedded
5. ✅ Correlated alert timeline

**Backend Work**:
- Kafka Admin API integration
- Trino stats API integration
- DataHub GraphQL queries
- Airflow REST API calls

**Success Metrics**:
- 80% of root cause analysis done without leaving page
- Cross-system correlation surfaces hidden issues
- Reduced Airflow/Kafka/Trino context switches by 70%

---

### Phase 4: AI-Powered Insights (Week 4)
**Goal**: Proactive recommendations and pattern detection

**Deliverables**:
1. ✅ Lag spike predictions for streaming CDC
2. ✅ Optimal batch interval recommendations
3. ✅ Watermark drift detection
4. ✅ Query performance regression alerts
5. ✅ Auto-remediation suggestions

**AI Features**:
- Pattern recognition across similar pipelines
- Anomaly detection on lag/throughput/duration
- Root cause correlation (e.g., "Kafka lag increased when source DB was slow")
- Proactive scaling recommendations

**Success Metrics**:
- 50% of issues detected before users notice
- 80% of AI recommendations are accepted
- 30% reduction in mean-time-to-resolution (MTTR)

---

## Success Metrics

### User Experience Metrics
- **Time to Identify Issue**: <30 seconds (current: 3-5 minutes)
- **Time to Root Cause**: <5 minutes (current: 15-30 minutes)
- **Context Switches**: 0-1 (current: 4-6)
- **Actions per Issue**: 1-2 clicks (current: 5-8 clicks + navigation)

### Operational Metrics
- **MTTR**: <10 minutes (current: 30-60 minutes)
- **False Positives**: <5% (alerts that weren't real issues)
- **Proactive Detection**: 50% of issues caught before user impact
- **Self-Service Resolution**: 70% (current: 30%)

### Adoption Metrics
- **Daily Active Users**: 80% of data team
- **Avg Session Time**: 3-5 minutes (focused, not exploratory)
- **Return Rate**: 5-10x per day (frequent health checks)
- **Airflow Direct Access**: 50% reduction (handle more in NexusOne)

---

## Design System Alignment

### Visual Language
- **Status Indicators**: ✅ Healthy, ⚠️ Warning, ❌ Error, ⏸️ Paused, 🔄 Running
- **Method Icons**:
  - Federated: `<Database />` (real-time query)
  - Streaming CDC: `<Zap />` (continuous flow)
  - Batch CDC: `<Clock />` (scheduled)
  - Incremental: `<TrendingUp />` (progressive)

### Component Patterns
- **Collapsible Sections**: For method grouping
- **Detail Panels**: 60vw slide-out (consistent with connections panel)
- **Metric Cards**: Small cards for key metrics in list view
- **Charts**: Line charts for trends, bar charts for comparisons
- **Action Buttons**: Primary (Trigger), Secondary (Pause), Tertiary (View)

### Information Density
- **List View**: 1-2 lines per pipeline, 3-4 key metrics
- **Overview Tab**: 6-8 key metrics, 1 trend chart, 3-5 recent items
- **Detail Tabs**: Deep dive data, charts, logs, actions

---

## Conclusion

The current pipeline monitoring page treats all ingestion methods as generic Airflow DAGs, hiding critical method-specific information and creating unnecessary cognitive load. By redesigning around the **operational reality** of each method and the **persona-specific needs** of our users, we can create a monitoring experience that:

1. ✅ **Surfaces the right information** - method-specific metrics at a glance
2. ✅ **Enables fast diagnosis** - correlated cross-system data in one place
3. ✅ **Reduces context switching** - 80% of tasks done in NexusOne
4. ✅ **Empowers all personas** - from analyst ("is my data fresh?") to senior engineer ("why is Kafka lagging?")

This redesign transforms the page from a generic pipeline list into an **intelligent operational dashboard** that reflects how data engineers actually work.
