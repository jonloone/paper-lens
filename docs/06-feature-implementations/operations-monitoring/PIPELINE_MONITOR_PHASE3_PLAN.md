# Pipeline Monitor - Phase 3 Implementation Plan
**Date**: 2025-10-08
**Status**: 🚧 In Progress
**Goal**: Cross-System Integration & Real-Time Metrics

---

## Executive Summary

Phase 3 connects the method-specific UI (built in Phase 2) to real backend systems, replacing mock data with live metrics from Kafka, Trino, Airflow, and other data infrastructure components.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /monitor/pipelines Page                              │  │
│  │  - Method-grouped pipeline cards                      │  │
│  │  - Real-time status updates                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PipelineDetailPanel Component                        │  │
│  │  - Method-specific tabs                               │  │
│  │  - Live metrics display                               │  │
│  │  - Chart visualizations                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API Layer (FastAPI)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/monitor/pipelines                               │  │
│  │  - List all pipelines with current status             │  │
│  │  - Aggregate metrics from all sources                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/monitor/pipelines/{id}/metrics                  │  │
│  │  - Detailed metrics for specific pipeline             │  │
│  │  - Method-specific metric fetching                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/monitor/pipelines/{id}/history                  │  │
│  │  - Historical data for charts                         │  │
│  │  - Time-series metrics                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │               │              │              │
         ▼               ▼              ▼              ▼
┌──────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────┐
│   Kafka      │ │   Trino     │ │  Airflow   │ │ DataHub  │
│ Admin API    │ │  Stats API  │ │  REST API  │ │ GraphQL  │
│              │ │             │ │            │ │          │
│ - Consumer   │ │ - Query     │ │ - DAG runs │ │ - Lineage│
│   lag        │ │   latency   │ │ - Task     │ │ - Schema │
│ - Topics     │ │ - Query     │ │   status   │ │   info   │
│ - Throughput │ │   volume    │ │ - Logs     │ │          │
└──────────────┘ └─────────────┘ └────────────┘ └──────────┘
```

---

## Phase 3 Components

### 1. Backend API Services

#### A. Kafka Integration Service
**Purpose**: Fetch real-time Kafka consumer metrics

**Endpoints**:
- `GET /api/monitor/kafka/consumer-lag/{topic}/{consumer-group}`
- `GET /api/monitor/kafka/topic/{topic}/metrics`
- `GET /api/monitor/kafka/consumer-group/{group}/history`

**Metrics to Fetch**:
- Consumer lag (per partition)
- Throughput (messages/sec)
- Error rate
- DLQ count
- Topic partition count
- Consumer group members

**Implementation**:
```python
# backend/services/kafka_metrics_service.py
from kafka import KafkaAdminClient, KafkaConsumer
from typing import Dict, List

class KafkaMetricsService:
    def __init__(self, bootstrap_servers: str):
        self.admin_client = KafkaAdminClient(
            bootstrap_servers=bootstrap_servers
        )

    async def get_consumer_lag(
        self,
        topic: str,
        consumer_group: str
    ) -> Dict:
        """Get current consumer lag for a topic/group"""
        pass

    async def get_throughput(self, topic: str) -> float:
        """Calculate current throughput for a topic"""
        pass
```

#### B. Trino Integration Service
**Purpose**: Fetch query performance metrics

**Endpoints**:
- `GET /api/monitor/trino/catalog/{catalog}/metrics`
- `GET /api/monitor/trino/queries/recent`
- `GET /api/monitor/trino/queries/{query_id}`

**Metrics to Fetch**:
- Query latencies (avg, p50, p95, p99)
- Query volume
- Error rate
- Active queries
- Connection status
- Resource utilization

**Implementation**:
```python
# backend/services/trino_metrics_service.py
import httpx
from typing import Dict, List

class TrinoMetricsService:
    def __init__(self, trino_url: str):
        self.trino_url = trino_url
        self.client = httpx.AsyncClient()

    async def get_query_stats(
        self,
        catalog: str,
        time_window: str = "1h"
    ) -> Dict:
        """Get aggregated query statistics"""
        pass

    async def get_recent_queries(
        self,
        catalog: str,
        limit: int = 100
    ) -> List[Dict]:
        """Get recent query history"""
        pass
```

#### C. Airflow Integration Service
**Purpose**: Fetch DAG run history and status

**Endpoints**:
- `GET /api/monitor/airflow/dags/{dag_id}/runs`
- `GET /api/monitor/airflow/dags/{dag_id}/runs/{run_id}/tasks`
- `GET /api/monitor/airflow/dags/{dag_id}/stats`

**Metrics to Fetch**:
- DAG run history
- Task-level status
- Duration metrics
- Success/failure rates
- Next scheduled run
- Recent logs

**Implementation**:
```python
# backend/services/airflow_metrics_service.py
import httpx
from typing import Dict, List

class AirflowMetricsService:
    def __init__(self, airflow_url: str, auth: tuple):
        self.airflow_url = airflow_url
        self.auth = auth
        self.client = httpx.AsyncClient()

    async def get_dag_runs(
        self,
        dag_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """Get recent DAG runs"""
        pass

    async def get_task_instances(
        self,
        dag_id: str,
        run_id: str
    ) -> List[Dict]:
        """Get task instances for a specific run"""
        pass
```

#### D. Unified Pipeline Service
**Purpose**: Aggregate metrics from all sources

**Endpoints**:
- `GET /api/monitor/pipelines`
- `GET /api/monitor/pipelines/{pipeline_id}`
- `GET /api/monitor/pipelines/{pipeline_id}/metrics`
- `GET /api/monitor/pipelines/{pipeline_id}/history?window=24h`

**Implementation**:
```python
# backend/services/pipeline_metrics_service.py
from typing import Dict, List
from .kafka_metrics_service import KafkaMetricsService
from .trino_metrics_service import TrinoMetricsService
from .airflow_metrics_service import AirflowMetricsService

class PipelineMetricsService:
    def __init__(self):
        self.kafka = KafkaMetricsService(...)
        self.trino = TrinoMetricsService(...)
        self.airflow = AirflowMetricsService(...)

    async def get_pipeline_metrics(
        self,
        pipeline_id: str
    ) -> Dict:
        """Aggregate metrics from all relevant sources"""
        pipeline = await self.get_pipeline_config(pipeline_id)

        if pipeline.method == 'streaming_cdc':
            return await self._get_streaming_metrics(pipeline)
        elif pipeline.method == 'batch_cdc':
            return await self._get_batch_metrics(pipeline)
        elif pipeline.method == 'incremental':
            return await self._get_incremental_metrics(pipeline)
        elif pipeline.method == 'federated':
            return await self._get_federated_metrics(pipeline)

    async def _get_streaming_metrics(self, pipeline) -> Dict:
        """Get Kafka + Airflow metrics"""
        kafka_metrics = await self.kafka.get_consumer_lag(
            pipeline.kafka_topic,
            pipeline.consumer_group
        )
        airflow_metrics = await self.airflow.get_dag_runs(
            pipeline.dag_id
        )
        return {
            'streamingMetrics': kafka_metrics,
            'recent_runs': airflow_metrics
        }
```

---

### 2. Frontend API Integration

#### A. API Client Layer
**File**: `lib/api/pipeline-metrics-client.ts`

```typescript
export class PipelineMetricsClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/monitor') {
    this.baseUrl = baseUrl;
  }

  async getAllPipelines(): Promise<Pipeline[]> {
    const response = await fetch(`${this.baseUrl}/pipelines`);
    return response.json();
  }

  async getPipelineMetrics(
    pipelineId: string
  ): Promise<PipelineMetrics> {
    const response = await fetch(
      `${this.baseUrl}/pipelines/${pipelineId}/metrics`
    );
    return response.json();
  }

  async getPipelineHistory(
    pipelineId: string,
    window: string = '24h'
  ): Promise<HistoricalMetrics> {
    const response = await fetch(
      `${this.baseUrl}/pipelines/${pipelineId}/history?window=${window}`
    );
    return response.json();
  }
}
```

#### B. Real-Time Updates with SWR
**File**: `hooks/usePipelineMetrics.ts`

```typescript
import useSWR from 'swr';
import { PipelineMetricsClient } from '@/lib/api/pipeline-metrics-client';

const client = new PipelineMetricsClient();

export function usePipelineMetrics(pipelineId: string) {
  const { data, error, mutate } = useSWR(
    pipelineId ? `/pipelines/${pipelineId}/metrics` : null,
    () => client.getPipelineMetrics(pipelineId),
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    metrics: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
}

export function usePipelineList() {
  const { data, error, mutate } = useSWR(
    '/pipelines',
    () => client.getAllPipelines(),
    {
      refreshInterval: 10000, // Poll every 10 seconds
    }
  );

  return {
    pipelines: data || [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
}
```

---

### 3. Chart Visualizations

#### A. Install Chart Library

```bash
npm install recharts
npm install @types/recharts --save-dev
```

#### B. Create Chart Components

**Lag Trend Chart** (Streaming CDC):
```typescript
// components/charts/LagTrendChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface LagTrendChartProps {
  data: Array<{ timestamp: Date; lag: number }>;
}

export function LagTrendChart({ data }: LagTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
        />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="lag"
          stroke="#ef4444"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Latency Distribution Chart** (Federated):
```typescript
// components/charts/LatencyDistributionChart.tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface LatencyDistributionChartProps {
  data: Array<{
    timestamp: Date;
    p50: number;
    p95: number;
    p99: number;
  }>;
}

export function LatencyDistributionChart({ data }: LatencyDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
        />
        <YAxis label={{ value: 'Latency (ms)', angle: -90 }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="p50"
          stackId="1"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="p95"
          stackId="1"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="p99"
          stackId="1"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

---

### 4. Action Handlers

#### A. Pipeline Actions API
**File**: `app/api/monitor/pipelines/[id]/actions/route.ts`

```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { action, ...actionParams } = await request.json();

  switch (action) {
    case 'trigger':
      return handleTrigger(params.id);
    case 'pause':
      return handlePause(params.id);
    case 'resume':
      return handleResume(params.id);
    case 'test_connection':
      return handleTestConnection(params.id);
    case 'trigger_backfill':
      return handleBackfill(params.id, actionParams);
    default:
      return Response.json(
        { error: 'Unknown action' },
        { status: 400 }
      );
  }
}
```

#### B. Frontend Action Hooks
**File**: `hooks/usePipelineActions.ts`

```typescript
export function usePipelineActions(pipelineId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerRun = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/monitor/pipelines/${pipelineId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger' })
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/monitor/pipelines/${pipelineId}/actions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'test_connection' })
        }
      );
      return await response.json();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerRun,
    testConnection,
    isLoading,
    error
  };
}
```

---

## Implementation Order

### Week 1: Backend Foundation
1. **Day 1-2**: Implement Airflow integration service
   - Most straightforward (REST API)
   - Provides immediate value (run history)
   - Test with existing DAGs

2. **Day 3-4**: Implement Trino integration service
   - Query stats API
   - Recent queries
   - Connection testing

3. **Day 5**: Implement Kafka integration service
   - Consumer lag monitoring
   - Topic metrics
   - Error tracking

### Week 2: Frontend Integration
1. **Day 1-2**: Create API client layer and hooks
   - TypeScript client classes
   - SWR hooks for data fetching
   - Real-time polling setup

2. **Day 3-4**: Replace mock data with real APIs
   - Update pipelines page
   - Update detail panel
   - Test with live data

3. **Day 5**: Error handling and loading states
   - Skeleton loaders
   - Error boundaries
   - Retry logic

### Week 3: Visualizations & Actions
1. **Day 1-2**: Implement chart components
   - Lag trend charts
   - Latency distribution
   - Row delta trends

2. **Day 3-4**: Implement action handlers
   - Trigger pipeline runs
   - Test connections
   - Pause/resume functionality

3. **Day 5**: Testing and optimization
   - End-to-end testing
   - Performance optimization
   - Documentation

---

## Configuration Management

### Environment Variables

```bash
# .env.local
KAFKA_BOOTSTRAP_SERVERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
TRINO_COORDINATOR_URL=http://trino-coordinator:8080
AIRFLOW_API_URL=http://airflow-webserver:8080/api/v1
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=***
DATAHUB_GMS_URL=http://datahub-gms:8080
```

### Pipeline Configuration

```typescript
// lib/config/pipeline-sources.ts
export const pipelineSourceConfig = {
  'orders_stream': {
    method: 'streaming_cdc',
    kafka_topic: 'ecommerce.orders',
    consumer_group: 'orders_stream_consumer',
    dag_id: 'orders_streaming_pipeline'
  },
  'inventory_batch': {
    method: 'batch_cdc',
    dag_id: 'inventory_batch_snapshot',
    source_table: 'warehouse.inventory',
    snapshot_interval: '5m'
  },
  // ... other pipelines
};
```

---

## Testing Strategy

### Unit Tests
- Test each service client independently
- Mock external API responses
- Validate data transformations

### Integration Tests
- Test full data flow from backend to frontend
- Verify metric aggregation logic
- Test error handling

### E2E Tests
- Test complete user workflows
- Verify real-time updates
- Test action handlers

---

## Performance Considerations

### Caching Strategy
- Cache pipeline list (10s TTL)
- Cache individual metrics (5s TTL)
- Cache historical data (1m TTL)

### Rate Limiting
- Limit API calls to external services
- Batch requests where possible
- Implement request debouncing

### Optimization Techniques
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load charts

---

## Monitoring & Observability

### Metrics to Track
- API response times
- Error rates by service
- Frontend render performance
- WebSocket connection health

### Logging
- Log all external API calls
- Log metric aggregation operations
- Log user actions

---

## Success Criteria

### Functional Requirements
- ✅ All pipelines show real metrics (not mock data)
- ✅ Metrics update in real-time (5-10s refresh)
- ✅ Charts display historical trends
- ✅ Actions successfully trigger backend operations

### Performance Requirements
- ✅ Page load < 2s
- ✅ Metric refresh < 1s
- ✅ Chart rendering < 500ms
- ✅ 99th percentile API latency < 1s

### User Experience Requirements
- ✅ Clear loading states
- ✅ Helpful error messages
- ✅ Smooth transitions
- ✅ Responsive UI (no jank)

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| External API downtime | Graceful degradation, show last known values |
| High metric volume | Implement aggregation, pagination |
| Network latency | Client-side caching, optimistic updates |
| Authentication failures | Token refresh logic, clear error messages |

### Operational Risks
| Risk | Mitigation |
|------|------------|
| Incomplete pipeline configs | Validation on startup, default values |
| Schema changes | Versioned APIs, backward compatibility |
| Performance degradation | Circuit breakers, rate limiting |
| Data inconsistency | Reconciliation jobs, manual refresh |

---

## Next Steps

1. **Immediate**: Start with Airflow integration (easiest win)
2. **Short-term**: Add Trino and Kafka integrations
3. **Medium-term**: Implement charts and actions
4. **Long-term**: Add predictive analytics and AI insights

This plan provides a clear roadmap for Phase 3 implementation while maintaining flexibility to adjust based on learnings during development.
