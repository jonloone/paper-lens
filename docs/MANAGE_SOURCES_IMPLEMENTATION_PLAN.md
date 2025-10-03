# /manage/sources: Tactical Implementation Plan

## Executive Summary

This document provides a **phased tactical implementation plan** for the `/manage/sources` page based on the comprehensive PRD. The plan builds on the **Phase 1 Federated Enhancements** already completed and provides a realistic 16-week roadmap to a production-ready source management system.

**Current State (Week 0):**
- ✅ Federated wizard: 90% production-ready (Phase 1 complete)
- ✅ Infrastructure: Prerequisites validation
- ✅ Secret management: 6 backend options
- ✅ Connection pool: Full timeout configuration
- ✅ Deployment targets: K8s, self-hosted, cloud
- ⚠️ No sources landing page yet
- ⚠️ No CDC/batch/streaming wizards yet
- ⚠️ Limited MCP integration (validation only)

**Goal State (Week 16):**
- ✅ Complete source management system with all 4 connection types
- ✅ MCP-powered intelligent recommendations
- ✅ Automatic DataHub registration (source products)
- ✅ Health monitoring and deployment tracking
- ✅ Production deployment with 25+ pilot sources

---

## Implementation Phases

### Phase 1: Sources Landing Page & Core Infrastructure (Weeks 1-3)

**Goal:** Create the entry point for source management and basic infrastructure for tracking sources.

#### Week 1: Database Schema & API Foundation

**Backend Tasks:**

1. **Database Schema Design** (2 days)
```sql
-- Core tables for source management

CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'postgresql', 'mysql', 'mongodb', etc.
    connection_mode VARCHAR(50) NOT NULL, -- 'federated', 'cdc', 'batch', 'streaming'

    -- Ownership
    domain VARCHAR(100) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    team VARCHAR(100),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'configuring', -- 'active', 'paused', 'failed', 'deploying'
    health_score INTEGER, -- 0-100
    last_health_check TIMESTAMP,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deployed_at TIMESTAMP,

    -- Tags
    tags TEXT[], -- Array of tags

    CONSTRAINT valid_connection_mode CHECK (connection_mode IN ('federated', 'cdc', 'batch', 'streaming')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'failed', 'configuring', 'deploying'))
);

CREATE TABLE source_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    -- Connection details (encrypted)
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    database_name VARCHAR(255),
    schema_name VARCHAR(255),
    username VARCHAR(255),
    password_secret_type VARCHAR(50), -- 'environment', 'k8s_secret', 'vault', etc.
    password_secret_ref TEXT,
    ssl_enabled BOOLEAN DEFAULT true,

    -- Additional params (JSON)
    additional_params JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE source_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    -- Deployment info
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'rolled_back'
    progress INTEGER DEFAULT 0, -- 0-100

    -- Artifacts created
    artifacts JSONB, -- {trino_catalog, kafka_topics, iceberg_tables, etc.}

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion TIMESTAMP,

    -- Errors
    error_message TEXT,
    error_phase VARCHAR(100),

    -- Logs
    deployment_logs JSONB[], -- Array of log entries

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_deployment_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back'))
);

CREATE TABLE source_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    -- Metrics by connection type
    -- Federated: query count, avg latency
    query_count_30d INTEGER,
    avg_query_latency_ms INTEGER,

    -- CDC: replication lag, throughput
    replication_lag_seconds INTEGER,
    throughput_mb_per_sec DECIMAL(10, 2),

    -- Batch: last run, success rate
    last_run_at TIMESTAMP,
    success_rate_30d DECIMAL(5, 2), -- Percentage

    -- Storage
    storage_gb DECIMAL(12, 2),

    -- Timestamp
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE source_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    table_schema VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,

    -- Metadata
    row_count BIGINT,
    size_mb DECIMAL(12, 2),
    primary_key_columns TEXT[], -- Array of column names

    -- Destination (for CDC/batch/streaming)
    iceberg_table_name VARCHAR(255),
    kafka_topic_name VARCHAR(255),

    -- Profiling
    last_profiled_at TIMESTAMP,
    quality_score INTEGER, -- 0-100

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(source_id, table_schema, table_name)
);

-- Indexes for performance
CREATE INDEX idx_sources_status ON sources(status);
CREATE INDEX idx_sources_connection_mode ON sources(connection_mode);
CREATE INDEX idx_sources_owner ON sources(owner_email);
CREATE INDEX idx_sources_domain ON sources(domain);
CREATE INDEX idx_source_deployments_status ON source_deployments(status);
CREATE INDEX idx_source_metrics_recorded_at ON source_metrics(recorded_at);
```

2. **Backend API Routes** (3 days)
```python
# /backend/api/sources_routes.py

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from backend.models.sources import (
    Source, SourceCreate, SourceUpdate, SourceSummary,
    SourceDetail, SourceMetrics, SourceDeployment,
    ConnectionConfig, ValidationResult
)
from backend.services.sources_service import SourcesService
from backend.auth import get_current_user

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])

@router.get("", response_model=List[SourceSummary])
async def list_sources(
    status: Optional[str] = Query(None),
    connection_mode: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    owner: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    service: SourcesService = Depends(),
    current_user = Depends(get_current_user)
):
    """
    List all sources with optional filtering
    """
    return await service.list_sources(
        status=status,
        connection_mode=connection_mode,
        domain=domain,
        owner=owner,
        limit=limit,
        offset=offset
    )

@router.get("/summary", response_model=dict)
async def get_sources_summary(
    service: SourcesService = Depends(),
    current_user = Depends(get_current_user)
):
    """
    Get overview statistics for dashboard
    """
    return await service.get_summary()

@router.get("/{source_id}", response_model=SourceDetail)
async def get_source(
    source_id: UUID,
    service: SourcesService = Depends(),
    current_user = Depends(get_current_user)
):
    """
    Get detailed information about a specific source
    """
    source = await service.get_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source

@router.post("/validate", response_model=ValidationResult)
async def validate_connection(
    config: ConnectionConfig,
    service: SourcesService = Depends(),
    current_user = Depends(get_current_user)
):
    """
    Validate connection configuration before deployment
    Uses MCP servers for intelligent validation
    """
    return await service.validate_connection(config)

@router.post("/deploy", response_model=SourceDeployment)
async def deploy_source(
    config: ConnectionConfig,
    schedule_for: Optional[datetime] = None,
    service: SourcesService = Depends(),
    current_user = Depends(get_current_user)
):
    """
    Deploy a new source connection
    """
    return await service.deploy_source(config, schedule_for, current_user.email)

@router.get("/deployments/{deployment_id}", response_model=SourceDeployment)
async def get_deployment_status(
    deployment_id: UUID,
    service: SourcesService = Depends(),
    current_user = Depends(get_current_user)
):
    """
    Get status of ongoing deployment
    """
    deployment = await service.get_deployment(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment

@router.post("/test-connection")
async def test_connection(
    config: ConnectionConfig,
    service: SourcesService = Depends(),
    current_user = Depends(get_current_user)
):
    """
    Lightweight connection test
    """
    return await service.test_connection(config)
```

#### Week 2: Sources Landing Page Frontend

**Frontend Tasks:**

1. **Sources List Component** (2 days)
```typescript
// /app/(main)/manage/sources/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Plus,
  Database,
  Workflow,
  Zap,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface SourceSummary {
  id: string;
  name: string;
  type: string;
  connection_mode: 'federated' | 'cdc' | 'batch' | 'streaming';
  domain: string;
  status: 'active' | 'paused' | 'failed' | 'configuring' | 'deploying';
  health_score: number | null;
  owner_email: string;
  created_at: string;
  table_count: number;
  query_count_30d?: number;
  error_message?: string;
}

interface SourcesOverview {
  total: number;
  by_status: {
    active: number;
    paused: number;
    failed: number;
    configuring: number;
    deploying: number;
  };
  by_mode: {
    federated: number;
    cdc: number;
    batch: number;
    streaming: number;
  };
}

export default function ManageSourcesPage() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [overview, setOverview] = useState<SourcesOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSources();
    fetchOverview();
  }, [statusFilter, modeFilter, domainFilter, searchQuery]);

  const fetchSources = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (modeFilter !== 'all') params.append('connection_mode', modeFilter);
    if (domainFilter !== 'all') params.append('domain', domainFilter);

    const response = await fetch(`/api/v1/sources?${params.toString()}`);
    const data = await response.json();

    // Apply client-side search filter
    const filtered = searchQuery
      ? data.filter((s: SourceSummary) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.type.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : data;

    setSources(filtered);
    setLoading(false);
  };

  const fetchOverview = async () => {
    const response = await fetch('/api/v1/sources/summary');
    const data = await response.json();
    setOverview(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'deploying': return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'paused': return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'federated': return <Database className="h-4 w-4" />;
      case 'cdc': return <Workflow className="h-4 w-4" />;
      case 'batch': return <Clock className="h-4 w-4" />;
      case 'streaming': return <Zap className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getModeBadgeColor = (mode: string) => {
    switch (mode) {
      case 'federated': return 'default';
      case 'cdc': return 'secondary';
      case 'batch': return 'outline';
      case 'streaming': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Sources</h1>
            <p className="text-muted-foreground mt-1">
              Connect and manage data sources in the NexusOne ecosystem
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => window.location.href = '/manage/sources/new'}
          >
            <Plus className="h-5 w-5" />
            Connect New Source
          </Button>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.total}</div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    {overview.by_status.active} active
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    {overview.by_status.failed} failed
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Federated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.by_mode.federated}</div>
                <p className="text-xs text-muted-foreground mt-1">No storage cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  CDC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.by_mode.cdc}</div>
                <p className="text-xs text-muted-foreground mt-1">Real-time sync</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Batch & Streaming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {overview.by_mode.batch + overview.by_mode.streaming}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.by_mode.batch} batch, {overview.by_mode.streaming} streaming
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attention Required Section */}
        {sources.filter(s => s.status === 'failed').length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                <AlertCircle className="h-5 w-5" />
                Attention Required ({sources.filter(s => s.status === 'failed').length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sources.filter(s => s.status === 'failed').map(source => (
                <div key={source.id} className="flex items-start justify-between p-3 bg-white border border-red-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">{source.name}</span>
                      <Badge variant="outline">{source.connection_mode}</Badge>
                    </div>
                    <p className="text-sm text-red-800 mt-1">{source.error_message}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Investigate</Button>
                    <Button size="sm">Fix Configuration</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="deploying">Deploying</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>

          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Connection Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="federated">Federated</SelectItem>
              <SelectItem value="cdc">CDC</SelectItem>
              <SelectItem value="batch">Batch</SelectItem>
              <SelectItem value="streaming">Streaming</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sources List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading sources...
              </CardContent>
            </Card>
          ) : sources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <Database className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium text-lg">No sources found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get started by connecting your first data source
                  </p>
                </div>
                <Button onClick={() => window.location.href = '/manage/sources/new'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect New Source
                </Button>
              </CardContent>
            </Card>
          ) : (
            sources.map(source => (
              <Card key={source.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(source.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium">{source.name}</h3>
                          <Badge variant={getModeBadgeColor(source.connection_mode)}>
                            <span className="flex items-center gap-1">
                              {getModeIcon(source.connection_mode)}
                              {source.connection_mode}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Type: {source.type}</span>
                          <span>•</span>
                          <span>Domain: {source.domain}</span>
                          <span>•</span>
                          <span>Owner: {source.owner_email}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Tables: {source.table_count}</span>
                          {source.query_count_30d !== undefined && (
                            <>
                              <span>•</span>
                              <span>Queries (30d): {source.query_count_30d.toLocaleString()}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Added: {new Date(source.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/manage/sources/${source.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/manage/sources/${source.id}/configure`}
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

#### Week 3: Source Detail Page & Health Monitoring

**Tasks:**

1. **Source Detail Page** - Individual source dashboard with health metrics, tables list, lineage visualization
2. **Health Check Service** - Background job that tests connections and updates health scores
3. **Deployment Status Page** - Real-time deployment progress tracking

**Deliverables:**
- ✅ Sources landing page with filtering and search
- ✅ Source detail page with metrics
- ✅ Health monitoring system
- ✅ Basic MCP integration for validation

---

### Phase 2: CDC Pipeline Wizard (Weeks 4-7)

**Goal:** Implement end-to-end CDC pipeline creation (Debezium + Kafka + Iceberg).

#### Week 4-5: CDC Backend Infrastructure

**Tasks:**

1. **Debezium Connector Service** - API wrapper for Kafka Connect REST API
2. **Kafka Topic Management** - Create topics with proper configuration
3. **Iceberg Sink Connector** - Configure streaming writers
4. **CDC Deployment Orchestrator** - Multi-phase deployment workflow

```python
# /backend/services/cdc_deployment_service.py

from typing import List, Dict
import asyncio
from uuid import UUID

class CDCDeploymentService:
    """
    Orchestrates CDC pipeline deployment:
    1. Create Kafka topics
    2. Deploy Debezium connector
    3. Wait for initial snapshot
    4. Deploy Iceberg sink connectors
    5. Register in DataHub
    6. Setup monitoring
    """

    async def deploy_cdc_pipeline(
        self,
        source_id: UUID,
        config: CDCConfig
    ) -> DeploymentResult:
        """
        Deploy complete CDC pipeline
        """
        deployment_id = await self.create_deployment_record(source_id)

        try:
            # Phase 1: Create Kafka topics
            await self.update_deployment_phase(deployment_id, "create_kafka_topics", "in_progress")
            topics = await self.kafka_service.create_topics_for_tables(
                prefix=config.topic_prefix,
                tables=config.selected_tables,
                partitions=config.partitions_per_topic,
                replication_factor=config.replication_factor
            )
            await self.update_deployment_phase(deployment_id, "create_kafka_topics", "completed")

            # Phase 2: Deploy Debezium connector
            await self.update_deployment_phase(deployment_id, "deploy_debezium", "in_progress")
            connector_name = await self.debezium_service.create_connector(
                name=f"{config.source_name}-connector",
                config={
                    "connector.class": f"io.debezium.connector.{config.source_type}.{config.source_type.capitalize()}Connector",
                    "database.hostname": config.host,
                    "database.port": config.port,
                    "database.user": config.username,
                    "database.password": f"${{file:{config.password_secret_ref}}}",
                    "database.dbname": config.database,
                    "database.server.name": config.topic_prefix,
                    "table.include.list": ",".join([f"{t.schema}.{t.table}" for t in config.selected_tables]),
                    "snapshot.mode": config.snapshot_mode,
                    "topic.prefix": config.topic_prefix,
                    # ... more config
                }
            )
            await self.update_deployment_phase(deployment_id, "deploy_debezium", "completed")

            # Phase 3: Monitor initial snapshot
            await self.update_deployment_phase(deployment_id, "initial_snapshot", "in_progress")
            await self.monitor_snapshot_progress(connector_name, deployment_id)
            await self.update_deployment_phase(deployment_id, "initial_snapshot", "completed")

            # Phase 4: Create Iceberg tables and sink connectors
            await self.update_deployment_phase(deployment_id, "create_iceberg_tables", "in_progress")
            for table in config.selected_tables:
                # Create Iceberg table
                await self.iceberg_service.create_table(
                    catalog=config.iceberg_catalog,
                    schema=config.iceberg_schema,
                    table_name=f"src_{table.table}",
                    source_schema=table.schema_definition
                )

                # Create sink connector
                await self.kafka_connect_service.create_iceberg_sink(
                    topic=f"{config.topic_prefix}.{table.schema}.{table.table}",
                    iceberg_table=f"{config.iceberg_schema}.src_{table.table}"
                )
            await self.update_deployment_phase(deployment_id, "create_iceberg_tables", "completed")

            # Phase 5: Register in DataHub
            await self.update_deployment_phase(deployment_id, "register_datahub", "in_progress")
            await self.datahub_service.register_source_product(
                source_id=source_id,
                tables=[f"{config.iceberg_schema}.src_{t.table}" for t in config.selected_tables],
                lineage={
                    "upstream": f"{config.source_type}://{config.host}/{config.database}",
                    "pipeline": ["debezium", "kafka", "iceberg"]
                }
            )
            await self.update_deployment_phase(deployment_id, "register_datahub", "completed")

            # Phase 6: Setup monitoring
            await self.update_deployment_phase(deployment_id, "setup_monitoring", "in_progress")
            await self.monitoring_service.create_dashboards(
                source_id=source_id,
                connector_name=connector_name,
                topics=topics
            )
            await self.update_deployment_phase(deployment_id, "setup_monitoring", "completed")

            # Mark deployment as successful
            await self.complete_deployment(deployment_id, "completed")

            return DeploymentResult(
                deployment_id=deployment_id,
                status="completed",
                artifacts={
                    "debezium_connector": connector_name,
                    "kafka_topics": topics,
                    "iceberg_tables": [f"{config.iceberg_schema}.src_{t.table}" for t in config.selected_tables]
                }
            )

        except Exception as e:
            await self.fail_deployment(deployment_id, str(e))
            raise
```

#### Week 6-7: CDC Wizard Frontend

**Tasks:**

1. **CDC Configuration Wizard** - Multi-step form similar to federated wizard
2. **Table Selection UI** - Browse available tables, show estimates
3. **Deployment Progress UI** - Real-time phase tracking
4. **Integration with existing mode selector** - Route to CDC wizard

**Deliverables:**
- ✅ CDC wizard with 5 steps
- ✅ Backend CDC deployment service
- ✅ Real-time deployment tracking
- ✅ First end-to-end CDC pipeline deployed

---

### Phase 3: Batch & Streaming Wizards (Weeks 8-11)

#### Week 8-9: Batch Ingestion (NiFi)

**Tasks:**

1. **NiFi Flow Generator** - Programmatically generate process groups
2. **API Connector Templates** - Pre-built templates for common APIs
3. **Batch Wizard Frontend** - Schedule configuration, data selection
4. **NiFi MCP Server** - Monitor flow execution

#### Week 10-11: Streaming Connections (Kafka → Iceberg)

**Tasks:**

1. **Kafka Topic Discovery** - List existing topics, infer schema
2. **Schema Registry Integration** - Support Avro/Protobuf
3. **Streaming Wizard Frontend** - Topic selection, partition strategy
4. **Compaction Scheduler** - Automated compaction for streaming tables

**Deliverables:**
- ✅ All 4 connection types supported
- ✅ Batch and streaming wizards complete
- ✅ Template library for common sources

---

### Phase 4: MCP-Powered Intelligence (Weeks 12-14)

**Goal:** Add intelligent recommendations and cost optimization.

#### Week 12: MCP Server Implementation

**Tasks:**

1. **Trino MCP Server** - Catalog state, query performance
2. **Kafka MCP Server** - Topic health, consumer lag
3. **Iceberg MCP Server** - Table stats, storage costs
4. **NiFi MCP Server** - Flow status

```python
# /backend/mcp_servers/trino_mcp.py

from mcp.server import MCPServer, Tool
from typing import List, Dict

class TrinoMCPServer(MCPServer):
    """
    MCP server for Trino context
    """

    @Tool(name="list_catalogs")
    async def list_catalogs(self) -> List[str]:
        """List all Trino catalogs"""
        result = await self.trino_client.query("SHOW CATALOGS")
        return [row['Catalog'] for row in result]

    @Tool(name="get_catalog_info")
    async def get_catalog_info(self, catalog: str) -> Dict:
        """Get catalog metadata and statistics"""
        schemas = await self.trino_client.query(f"SHOW SCHEMAS FROM {catalog}")
        stats = await self.trino_client.query(f"""
            SELECT
                COUNT(DISTINCT table_schema) as schema_count,
                COUNT(*) as table_count
            FROM {catalog}.information_schema.tables
        """)

        # Get query statistics
        query_stats = await self.trino_client.query(f"""
            SELECT
                catalog,
                COUNT(*) as query_count,
                AVG(elapsed_time_millis) as avg_latency_ms
            FROM system.runtime.queries
            WHERE catalog = '{catalog}'
            AND created > CURRENT_TIMESTAMP - INTERVAL '30' DAY
            GROUP BY catalog
        """)

        return {
            "catalog": catalog,
            "schema_count": stats[0]['schema_count'],
            "table_count": stats[0]['table_count'],
            "query_count_30d": query_stats[0]['query_count'] if query_stats else 0,
            "avg_latency_ms": query_stats[0]['avg_latency_ms'] if query_stats else None
        }

    @Tool(name="validate_catalog_name")
    async def validate_catalog_name(self, proposed_name: str) -> Dict:
        """Check if catalog name is available"""
        catalogs = await self.list_catalogs()

        if proposed_name in catalogs:
            return {
                "valid": False,
                "reason": f"Catalog '{proposed_name}' already exists",
                "suggestion": f"{proposed_name}_2"
            }

        # Check naming conventions
        if not proposed_name.islower():
            return {
                "valid": False,
                "reason": "Catalog names must be lowercase",
                "suggestion": proposed_name.lower()
            }

        return {"valid": True}

    @Tool(name="estimate_query_performance")
    async def estimate_query_performance(
        self,
        catalog: str,
        estimated_rows: int,
        join_complexity: str = "simple"
    ) -> Dict:
        """
        Estimate query performance for federated source
        """
        # Get historical performance for similar catalogs
        similar_catalogs = await self.find_similar_catalogs(catalog)

        # Adjust based on row count and complexity
        base_latency_ms = 100  # Base latency for simple query

        if estimated_rows > 10_000_000:
            base_latency_ms *= 5  # Large tables are slower
        elif estimated_rows > 1_000_000:
            base_latency_ms *= 2

        if join_complexity == "complex":
            base_latency_ms *= 3
        elif join_complexity == "moderate":
            base_latency_ms *= 1.5

        return {
            "simple_queries": f"{base_latency_ms}ms - {base_latency_ms * 2}ms",
            "aggregations": f"{base_latency_ms * 5}ms - {base_latency_ms * 10}ms",
            "large_joins": f"{base_latency_ms * 10}ms - {base_latency_ms * 30}ms",
            "recommendation": (
                "Consider CDC for materialized copy"
                if base_latency_ms > 5000
                else "Federated should perform well"
            )
        }
```

#### Week 13: Intelligent Recommendation Engine

**Tasks:**

1. **Connection Type Recommender** - ML-based recommendation system
2. **Cost Estimator** - Storage and compute cost predictions
3. **Partition Strategy Optimizer** - Recommend optimal partitioning
4. **Duplicate Detector** - Find similar existing sources

#### Week 14: Frontend Integration

**Tasks:**

1. **Recommendation UI** - Show intelligent suggestions throughout wizards
2. **Cost Comparison** - Real-time cost estimates for different approaches
3. **Conflict Warnings** - Alert on potential issues before deployment

**Deliverables:**
- ✅ MCP servers for all tools
- ✅ Intelligent recommendations throughout UI
- ✅ Cost estimation and optimization

---

### Phase 5: Production Hardening (Weeks 15-16)

**Goal:** Make system production-ready with monitoring, alerting, and automation.

#### Week 15: Monitoring & Alerting

**Tasks:**

1. **Health Check System** - Automated testing of all sources
2. **Datadog Integration** - Dashboards and alerts
3. **Incident Management** - Auto-remediation for common failures
4. **Performance Monitoring** - Query latency, lag tracking

#### Week 16: Documentation & Training

**Tasks:**

1. **User Documentation** - Step-by-step guides for each connection type
2. **Admin Playbooks** - Troubleshooting and operations
3. **Team Training** - Hands-on workshops
4. **Pilot Program** - Deploy 25+ sources with early adopters

**Deliverables:**
- ✅ Production monitoring and alerting
- ✅ Complete documentation
- ✅ 25+ pilot sources deployed
- ✅ System ready for general availability

---

## Success Criteria by Phase

| Phase | Success Metrics | Target |
|-------|----------------|--------|
| **Phase 1** | Sources landing page deployed | ✅ |
| | Database schema complete | ✅ |
| | API endpoints functional | ✅ |
| | Health monitoring active | ✅ |
| **Phase 2** | First CDC pipeline deployed | ✅ |
| | Deployment success rate | >90% |
| | Average CDC setup time | <30 min |
| | Real-time lag | <60 sec |
| **Phase 3** | All 4 connection types supported | ✅ |
| | Batch and streaming wizards complete | ✅ |
| | Template library | 10+ templates |
| **Phase 4** | MCP servers deployed | 5+ servers |
| | Recommendation accuracy | >80% |
| | Cost estimation accuracy | ±20% |
| **Phase 5** | Production monitoring | ✅ |
| | Pilot sources deployed | 25+ |
| | User satisfaction | >4/5 |
| | First-deployment success | >95% |

---

## Resource Requirements

### Team Composition

**Backend (2 engineers):**
- Database schema and API development
- MCP server implementation
- Deployment orchestration services
- Integration with Kafka, Debezium, NiFi, Iceberg

**Frontend (2 engineers):**
- React/TypeScript UI development
- Wizard flows and form validation
- Real-time deployment tracking
- Dashboard and visualization

**DevOps (1 engineer, 50%):**
- Infrastructure setup (Kafka, NiFi, Iceberg, Trino)
- Monitoring and alerting
- Deployment automation
- Production support

**Data Engineer (1 engineer, 50%):**
- CDC pipeline configuration
- NiFi flow templates
- Iceberg table optimization
- Pilot program support

### Infrastructure Requirements

**Development:**
- Kubernetes cluster for NexusOne portal (existing)
- Dev Kafka cluster (3 brokers)
- Dev Trino coordinator
- Dev PostgreSQL for metadata
- Dev DataHub instance

**Production:**
- Production Kafka cluster (6+ brokers)
- Production Trino cluster (3+ workers)
- Production DataHub
- S3/MinIO for Iceberg storage
- NiFi cluster (3+ nodes)

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **CDC initial snapshot takes too long** | High | Medium | Implement snapshot progress tracking, allow off-peak scheduling, support incremental adoption |
| **Kafka cluster capacity issues** | Medium | High | MCP-based capacity monitoring, auto-scaling recommendations, preventive alerts |
| **Complex source configurations fail** | High | Medium | Comprehensive validation before deployment, rollback capabilities, detailed error messages |
| **User adoption slower than expected** | Medium | High | Pilot program with early adopters, comprehensive training, gradual rollout |
| **MCP server performance bottleneck** | Low | Medium | Caching layer, async calls, timeout handling |

---

## Next Steps (Week 1 Actions)

1. **Database Schema** - Create migration scripts, deploy to dev
2. **API Foundation** - Implement core CRUD endpoints for sources
3. **Frontend Skeleton** - Set up sources landing page structure
4. **Team Alignment** - Kickoff meeting, assign tasks, set up sprint board

---

## Appendix: Technology Stack

```yaml
Frontend:
  framework: Next.js 14 + React + TypeScript
  components: shadcn/ui
  state: React Query + Zustand
  forms: React Hook Form + Zod validation

Backend:
  framework: FastAPI (Python)
  database: PostgreSQL
  orm: SQLAlchemy
  async: asyncio + aiohttp

Data Infrastructure:
  query_engine: Trino
  streaming: Apache Kafka
  batch: Apache NiFi
  cdc: Debezium
  storage: Apache Iceberg (S3/MinIO)
  catalog: DataHub

MCP:
  framework: Model Context Protocol
  servers: Python-based MCP servers
  communication: JSON-RPC over HTTP

Monitoring:
  metrics: Datadog
  logs: CloudWatch / ELK
  tracing: OpenTelemetry
```

---

**Document Status:** Ready for Implementation
**Next Review:** End of Week 3 (Phase 1 completion)
