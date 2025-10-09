# Unified Source Ingestion Flow - Design & Implementation Plan

## Executive Summary

**Current Problem**: The 3-mode approach (Federated/Lakehouse/Hybrid) forces upfront decisions before engineers can explore the data. This doesn't match real-world workflows where table-level decisions are made based on characteristics and usage patterns.

**Solution**: Unified flow with per-table ingestion strategy selection, supporting 4 ingestion methods optimized for different use cases.

---

## Design Philosophy

### Core Principle: **Table-First Decision Making**

Data engineers think in terms of **individual table requirements**, not source-level modes:
- "These 3 reference tables can be federated"
- "This fact table needs real-time CDC"
- "That dimension table can be batch-loaded daily"

### User Journey
```
Connect to Source → Browse Tables → Configure Per Table → Deploy
```

---

## Architecture Overview

### Ingestion Methods (4 Patterns)

#### 1. **Federated Query** (Trino-only)
```
Source DB ←→ Trino Catalog
```
- **When**: Infrequent access, small tables (<100k rows), reference data
- **Latency**: Real-time (query source directly)
- **Infrastructure**: Trino only
- **Cost**: Lowest
- **Example**: Product categories, country codes, configuration tables

#### 2. **Incremental Query** (Spark-only, No CDC)
```
Source DB → Spark (query by timestamp) → Iceberg
```
- **When**: Has `updated_at` column, hourly/daily refresh acceptable
- **Latency**: Based on schedule (hourly/daily)
- **Infrastructure**: Spark only
- **Cost**: Low (no Debezium, no Kafka)
- **Example**: Customer profiles, product catalog

#### 3. **Batch CDC** (Debezium + Spark, No Kafka)
```
Source DB → Debezium (snapshot) → Spark Batch → Iceberg
```
- **When**: Full CDC needed but real-time not required
- **Latency**: Based on schedule (hourly/daily)
- **Infrastructure**: Debezium + Spark (no Kafka)
- **Cost**: Medium
- **Example**: Order history, transaction logs

#### 4. **Streaming CDC** (Full Pipeline)
```
Source DB → Debezium → Kafka → Spark Streaming → Iceberg
```
- **When**: Real-time requirements, high-volume changes
- **Latency**: <1 minute
- **Infrastructure**: Debezium + Kafka + Spark Streaming
- **Cost**: Highest
- **Example**: Real-time transactions, live inventory

---

## Type System Design

### Updated Source Connection Types

```typescript
// Remove Hybrid mode, add table-level configuration
export type IngestionMethod =
  | 'federated'           // Query in place
  | 'incremental_query'   // Spark-based incremental
  | 'batch_cdc'          // Debezium snapshot + Spark batch
  | 'streaming_cdc';     // Full CDC pipeline

export interface TableIngestionConfig {
  schema: string;
  table: string;
  method: IngestionMethod;

  // Common to all replicated methods
  primaryKey?: string[];

  // Streaming CDC specific
  streamingConfig?: {
    kafkaTopic: string;
    updateFrequency: 'real-time' | '5min' | '15min' | '30min';
    captureDeletes: boolean;
    snapshotMode: 'initial' | 'schema_only' | 'never';
  };

  // Batch CDC specific
  batchCdcConfig?: {
    schedule: 'hourly' | 'daily' | 'weekly';
    scheduleTime?: string; // e.g., "02:00"
    captureDeletes: boolean;
    snapshotMode: 'initial' | 'schema_only';
  };

  // Incremental Query specific
  incrementalConfig?: {
    timestampColumn: string;
    watermarkOffset: string; // e.g., "1 hour" for safety
    schedule: 'hourly' | 'every_6_hours' | 'daily';
    scheduleTime?: string;
  };
}

export interface UnifiedSourceConnection {
  id: string;
  name: string;
  type: DatabaseType;
  connection: ConnectionDetails;

  // Tables with ingestion configurations
  tables: TableIngestionConfig[];

  // Generated catalogs/pipelines
  trinoCatalog?: TrinoConfig;          // For federated tables
  cdcPipelines?: CDCPipelineConfig[];  // One per replicated table group

  owner: string;
  team: string;
  created_at: Date;
  updated_at: Date;
}

export interface CDCPipelineConfig {
  name: string;
  method: 'batch_cdc' | 'streaming_cdc';
  tables: string[]; // Tables in this pipeline
  debezium: DebeziumConfig;
  kafka?: KafkaConfig;      // Only for streaming
  spark: SparkConfig;
  iceberg: IcebergConfig;
}
```

---

## User Experience Flow

### New Unified Flow

#### **Step 1: Connect to Source**
```
┌─────────────────────────────────────┐
│  Connect to Data Source             │
├─────────────────────────────────────┤
│                                     │
│  Source Name: [production_db    ]  │
│  Database Type: [PostgreSQL    ▼]  │
│                                     │
│  Connection Details:                │
│  Host: [db.company.com         ]   │
│  Port: [5432                   ]   │
│  Database: [production         ]   │
│  Username: [readonly_user      ]   │
│  Password: ${ENV:DB_PASSWORD}      │
│                                     │
│  [Test Connection] [Continue]      │
└─────────────────────────────────────┘
```

#### **Step 2: Browse & Select Tables**
```
┌─────────────────────────────────────────────────────────────┐
│  Available Tables (47)              [Search: customers  ]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐ public.customers_360         2.5M rows  Updated: 2h ago │
│     Suggested: Replicate (Incremental)  Has: updated_at    │
│                                                             │
│  ☐ public.transactions          12M rows   Updated: Real-time │
│     Suggested: Replicate (Streaming CDC)  High volume      │
│                                                             │
│  ☐ public.product_categories    250 rows   Updated: Monthly │
│     Suggested: Federate  Small, static reference table     │
│                                                             │
│  ☐ public.orders               5M rows    Updated: Hourly  │
│     Suggested: Replicate (Batch CDC)  Moderate updates     │
│                                                             │
│  [Select All] [Clear]           Selected: 0 tables          │
│                                                             │
│  [Back] [Continue: Configure Selected →]                   │
└─────────────────────────────────────────────────────────────┘
```

#### **Step 3: Configure Ingestion Per Table**
```
┌─────────────────────────────────────────────────────────────┐
│  Configure: customers_360 (1 of 4)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  How to access this table?                                  │
│                                                             │
│  ⚪ Federate (Query in Place)                              │
│     • Direct queries to source database                     │
│     • Best for: Infrequent access, <100K rows              │
│     • Infrastructure: Trino only                            │
│                                                             │
│  ⚫ Replicate (Copy to Lakehouse)                          │
│     • Dedicated copy in Iceberg lakehouse                   │
│     • Best for: Frequent queries, large joins, analytics   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Replication Method:                                   │  │
│  │                                                       │  │
│  │ ⚪ Incremental Query (Simplest)                      │  │
│  │    Updates: Based on timestamp column                │  │
│  │    Infrastructure: Spark only                        │  │
│  │    Timestamp Column: [updated_at            ▼]      │  │
│  │    Schedule: [Every 6 hours                ▼]       │  │
│  │    Buffer: [1 hour                         ▼]       │  │
│  │                                                       │  │
│  │ ⚪ Batch CDC (Full capture)                          │  │
│  │    Updates: Scheduled snapshots                      │  │
│  │    Infrastructure: Debezium + Spark                  │  │
│  │    Schedule: [Daily at 02:00               ▼]       │  │
│  │    Capture Deletes: [✓] Track deletions             │  │
│  │                                                       │  │
│  │ ⚪ Streaming CDC (Real-time)                         │  │
│  │    Updates: Continuous, <1 min latency               │  │
│  │    Infrastructure: Debezium + Kafka + Spark          │  │
│  │    Update Frequency: [Real-time            ▼]       │  │
│  │    Capture Deletes: [✓] Track deletions             │  │
│  │                                                       │  │
│  │ Primary Key: [customer_id ▼] [+ Add Column]         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [← Previous Table]  [Next Table →]  [Skip]               │
└─────────────────────────────────────────────────────────────┘
```

#### **Step 4: Review & Deploy**
```
┌─────────────────────────────────────────────────────────────┐
│  Deployment Summary: production_db                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Trino Federated Catalog                                │
│  Name: production_db_federated                              │
│  Tables (2):                                                │
│    • public.product_categories                              │
│    • public.shipping_zones                                  │
│  Infrastructure: Trino catalog only                         │
│                                                             │
│  ──────────────────────────────────────────────────────────│
│                                                             │
│  🔄 Incremental Query Pipeline                             │
│  Name: production_db_incremental                            │
│  Tables (1):                                                │
│    • public.customers_360 (Every 6 hours)                   │
│  Infrastructure: Spark scheduled jobs                       │
│                                                             │
│  ──────────────────────────────────────────────────────────│
│                                                             │
│  📦 Batch CDC Pipeline                                      │
│  Name: production_db_batch_cdc                              │
│  Tables (1):                                                │
│    • public.orders (Daily at 02:00)                        │
│  Infrastructure: Debezium + Spark batch                     │
│                                                             │
│  ──────────────────────────────────────────────────────────│
│                                                             │
│  ⚡ Streaming CDC Pipeline                                 │
│  Name: production_db_streaming_cdc                          │
│  Tables (1):                                                │
│    • public.transactions (Real-time)                        │
│  Infrastructure: Debezium + Kafka + Spark Streaming         │
│                                                             │
│  ──────────────────────────────────────────────────────────│
│                                                             │
│  Estimated Monthly Cost: $450                               │
│    • Trino: $50                                            │
│    • Spark: $150                                           │
│    • Kafka: $200                                           │
│    • Storage: $50                                          │
│                                                             │
│  [← Back] [Deploy All Components →]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Smart Recommendations Engine

### Auto-Suggestion Logic

```typescript
function suggestIngestionMethod(table: TableMetadata): IngestionSuggestion {
  const { rowCount, updateFrequency, columns, queryFrequency } = table;

  // 1. Small, static tables → Federate
  if (rowCount < 100_000 && updateFrequency === 'rarely') {
    return {
      method: 'federated',
      confidence: 'high',
      reason: 'Small reference table, query directly from source',
      estimatedCost: 'Minimal'
    };
  }

  // 2. Has timestamp column → Incremental Query
  const hasTimestamp = columns.some(c =>
    ['updated_at', 'modified_at', 'last_modified', 'updated_date'].includes(c.name)
  );

  if (hasTimestamp && updateFrequency !== 'real-time') {
    return {
      method: 'incremental_query',
      confidence: 'high',
      reason: `Has ${timestampCol} column, suitable for scheduled incremental loads`,
      estimatedCost: 'Low',
      config: {
        timestampColumn: timestampCol,
        schedule: updateFrequency === 'hourly' ? 'hourly' : 'every_6_hours'
      }
    };
  }

  // 3. Real-time requirements → Streaming CDC
  if (updateFrequency === 'real-time' || queryFrequency === 'very_high') {
    return {
      method: 'streaming_cdc',
      confidence: 'medium',
      reason: 'High update frequency requires real-time replication',
      estimatedCost: 'High',
      note: 'Requires Kafka infrastructure'
    };
  }

  // 4. Default → Batch CDC
  return {
    method: 'batch_cdc',
    confidence: 'medium',
    reason: 'Balanced approach with full CDC capabilities',
    estimatedCost: 'Medium',
    config: {
      schedule: updateFrequency === 'hourly' ? 'hourly' : 'daily',
      scheduleTime: '02:00'
    }
  };
}
```

---

## Implementation Phases

### **Phase 1: Type System & Backend (Week 1)**

**Goals:**
- Update type system to support unified flow
- Remove Hybrid mode
- Add 4 ingestion method types

**Tasks:**
1. Update `source-connections.ts` types
   - Remove `HybridSource` type
   - Add `TableIngestionConfig` interface
   - Add `IngestionMethod` type
   - Update `UnifiedSourceConnection` interface

2. Create ingestion method validators
   - `validateIncrementalConfig()`
   - `validateBatchCdcConfig()`
   - `validateStreamingCdcConfig()`

3. Update backend models
   - Create `table_ingestion_config` table
   - Add migration scripts
   - Update API schemas

**Deliverables:**
- ✅ Updated TypeScript types
- ✅ Backend schema migrations
- ✅ Validation utilities

---

### **Phase 2: Pipeline Generators (Week 2)**

**Goals:**
- Implement pipeline generation for all 4 methods
- Create deployment templates

**Tasks:**
1. Incremental Query Generator
   ```typescript
   function generateIncrementalPipeline(
     table: TableIngestionConfig
   ): SparkJobConfig {
     return {
       jobName: `incremental_${table.table}`,
       query: `
         SELECT * FROM ${table.schema}.${table.table}
         WHERE ${table.incrementalConfig.timestampColumn} >
           (SELECT MAX(${table.incrementalConfig.timestampColumn})
            FROM lakehouse.${table.table})
       `,
       schedule: table.incrementalConfig.schedule,
       targetTable: `lakehouse.${table.table}`
     };
   }
   ```

2. Batch CDC Generator (Debezium + Spark)
   ```typescript
   function generateBatchCDCPipeline(
     tables: TableIngestionConfig[]
   ): BatchCDCConfig {
     return {
       debezium: {
         connector: 'debezium-postgres-snapshot',
         tasks: tables.map(t => ({
           schema: t.schema,
           table: t.table,
           snapshotMode: t.batchCdcConfig.snapshotMode
         }))
       },
       spark: {
         schedule: determineCombinedSchedule(tables),
         outputFormat: 'iceberg'
       }
     };
   }
   ```

3. Streaming CDC Generator (Full pipeline)
   - Existing implementation, refactor to work with new types

4. Federated Catalog Generator
   - Use existing `trino-catalog-generator.ts`

**Deliverables:**
- ✅ Incremental query pipeline generator
- ✅ Batch CDC pipeline generator
- ✅ Updated streaming CDC generator
- ✅ Deployment template generators

---

### **Phase 3: UI - Step 1 & 2 (Week 3)**

**Goals:**
- Remove mode selection page
- Implement unified connection flow
- Build table browser with smart suggestions

**Tasks:**
1. Update `/manage/sources/new` page
   - Remove mode selection (federated/lakehouse/hybrid)
   - Direct to connection configuration
   - Reuse connection form from federated flow

2. Create unified table browser (`Step2BrowseTables.tsx`)
   - Multi-select table grid
   - Display table metadata (rows, columns, update frequency)
   - Show auto-suggestions per table
   - Quick filter by suggestion type

3. Implement suggestion engine integration
   - Call backend for table analysis
   - Display confidence levels
   - Allow override of suggestions

**Components to Create:**
- `UnifiedConnectionFlow.tsx`
- `Step2BrowseTables.tsx`
- `TableMetadataCard.tsx`
- `IngestionSuggestionBadge.tsx`

**Deliverables:**
- ✅ Updated connection flow
- ✅ Table browser with metadata
- ✅ Smart suggestions UI

---

### **Phase 4: UI - Step 3 Configuration (Week 4)**

**Goals:**
- Build per-table configuration interface
- Support all 4 ingestion methods
- Implement progressive disclosure

**Tasks:**
1. Create `Step3ConfigureTables.tsx`
   - Wizard-style per-table configuration
   - Radio selection for federated vs replicated
   - Conditional forms for each replication method

2. Build method-specific forms:
   - `IncrementalQueryForm.tsx`
     - Timestamp column selector (auto-detect)
     - Schedule picker
     - Watermark offset configuration

   - `BatchCDCForm.tsx`
     - Schedule configuration
     - Snapshot mode selector
     - Delete tracking toggle

   - `StreamingCDCForm.tsx`
     - Frequency selector (real-time/5min/15min/30min)
     - Kafka topic configuration
     - Advanced Debezium settings

3. Implement validation
   - Primary key detection
   - Timestamp column validation
   - Schedule conflict detection

**Components to Create:**
- `Step3ConfigureTables.tsx`
- `IngestionMethodSelector.tsx`
- `IncrementalQueryForm.tsx`
- `BatchCDCForm.tsx`
- `StreamingCDCForm.tsx`
- `PrimaryKeySelector.tsx`

**Deliverables:**
- ✅ Per-table configuration UI
- ✅ All 4 method forms
- ✅ Validation logic

---

### **Phase 5: UI - Step 4 Review & Deploy (Week 5)**

**Goals:**
- Build deployment summary
- Show cost estimates
- Generate deployment artifacts

**Tasks:**
1. Create `Step4ReviewDeploy.tsx`
   - Group tables by ingestion method
   - Display infrastructure requirements per method
   - Show cost breakdown
   - List generated artifacts

2. Implement deployment preview
   - Trino catalog YAML (for federated)
   - Spark job configs (for incremental)
   - Debezium connector config (for CDC)
   - Kafka topic configs (for streaming)
   - K8s ConfigMaps/CronJobs

3. Build deployment orchestrator
   - Deploy in correct order (Kafka → Debezium → Spark)
   - Health checks between stages
   - Rollback capability

4. Add cost estimation
   - Infrastructure cost calculator
   - Storage growth projections
   - Compute cost estimates

**Components to Create:**
- `Step4ReviewDeploy.tsx`
- `DeploymentSummaryCard.tsx`
- `InfrastructureRequirements.tsx`
- `CostEstimator.tsx`
- `DeploymentArtifactViewer.tsx`

**Deliverables:**
- ✅ Deployment summary UI
- ✅ Cost estimation
- ✅ Artifact generation
- ✅ Deployment orchestration

---

### **Phase 6: Backend APIs (Week 6)**

**Goals:**
- Implement all backend endpoints
- Add table analysis service
- Create deployment orchestrator

**Tasks:**
1. Table Analysis API
   ```python
   @router.get("/api/v1/sources/{source_id}/tables/analyze")
   async def analyze_tables(source_id: str):
       """
       Analyze tables and return suggestions
       """
       tables = await discover_tables(source_id)
       suggestions = []

       for table in tables:
           metadata = await get_table_metadata(table)
           suggestion = suggest_ingestion_method(metadata)
           suggestions.append({
               "table": table,
               "metadata": metadata,
               "suggestion": suggestion
           })

       return suggestions
   ```

2. Pipeline Generation API
   ```python
   @router.post("/api/v1/sources/unified/generate")
   async def generate_pipelines(config: UnifiedSourceConfig):
       """
       Generate all pipeline configs based on table selections
       """
       pipelines = []

       # Group by method
       federated = [t for t in config.tables if t.method == 'federated']
       incremental = [t for t in config.tables if t.method == 'incremental_query']
       batch_cdc = [t for t in config.tables if t.method == 'batch_cdc']
       streaming_cdc = [t for t in config.tables if t.method == 'streaming_cdc']

       # Generate configs
       if federated:
           pipelines.append(generate_trino_catalog(federated))
       if incremental:
           pipelines.append(generate_incremental_jobs(incremental))
       if batch_cdc:
           pipelines.append(generate_batch_cdc_pipeline(batch_cdc))
       if streaming_cdc:
           pipelines.append(generate_streaming_cdc_pipeline(streaming_cdc))

       return pipelines
   ```

3. Deployment Orchestration API
   ```python
   @router.post("/api/v1/sources/unified/deploy")
   async def deploy_unified_source(deployment: UnifiedDeployment):
       """
       Deploy all components in correct order
       """
       # 1. Deploy Trino catalogs (if any)
       if deployment.trino_catalog:
           await deploy_trino_catalog(deployment.trino_catalog)

       # 2. Deploy Kafka topics (if streaming)
       if deployment.streaming_pipelines:
           await deploy_kafka_topics(deployment.streaming_pipelines)

       # 3. Deploy Debezium connectors (if CDC)
       if deployment.batch_cdc or deployment.streaming_cdc:
           await deploy_debezium_connectors(...)

       # 4. Deploy Spark jobs
       await deploy_spark_jobs(deployment.spark_jobs)

       # 5. Run health checks
       await validate_deployment(deployment.id)

       return {"status": "deployed", "deployment_id": deployment.id}
   ```

**Deliverables:**
- ✅ Table analysis endpoint
- ✅ Pipeline generation endpoint
- ✅ Deployment orchestration endpoint
- ✅ Health check endpoints

---

### **Phase 7: Testing & Documentation (Week 7)**

**Goals:**
- Comprehensive testing
- User documentation
- Migration guide

**Tasks:**
1. Unit Tests
   - Test each ingestion method generator
   - Validate configuration validators
   - Test suggestion engine

2. Integration Tests
   - End-to-end flow tests
   - Multi-method deployment tests
   - Rollback scenarios

3. E2E Tests (Playwright)
   - Complete user journey
   - All 4 ingestion methods
   - Error handling flows

4. Documentation
   - User guide with decision tree
   - Architecture documentation
   - API documentation
   - Migration guide from old flow

**Deliverables:**
- ✅ Test suite (80%+ coverage)
- ✅ E2E tests
- ✅ User documentation
- ✅ Migration guide

---

## Migration Strategy

### From Old Flow to New Flow

**Existing Sources:**
- Federated sources → Convert to unified with `method: 'federated'` for all tables
- Lakehouse sources → Convert to unified with `method: 'streaming_cdc'` for all tables
- Hybrid sources → Split into federated + CDC tables

**Migration Script:**
```typescript
async function migrateLegacySources() {
  const legacySources = await db.sources.findAll();

  for (const source of legacySources) {
    const unified: UnifiedSourceConnection = {
      id: source.id,
      name: source.name,
      type: source.type,
      connection: source.connection,
      tables: [],
      owner: source.owner,
      team: source.team
    };

    if (source.mode === 'federated') {
      // All tables as federated
      unified.tables = source.tables.map(t => ({
        schema: t.schema,
        table: t.table,
        method: 'federated'
      }));
    } else if (source.mode === 'lakehouse') {
      // All tables as streaming CDC
      unified.tables = source.selected_tables.map(t => ({
        schema: t.schema,
        table: t.table,
        method: 'streaming_cdc',
        primaryKey: t.primary_key,
        streamingConfig: {
          kafkaTopic: `${source.name}.${t.table}`,
          updateFrequency: 'real-time',
          captureDeletes: true,
          snapshotMode: 'initial'
        }
      }));
    } else if (source.mode === 'hybrid') {
      // Split into federated + CDC
      unified.tables = [
        ...source.federated_tables.map(t => ({
          schema: t.schema,
          table: t.table,
          method: 'federated'
        })),
        ...source.lakehouse_tables.map(t => ({
          schema: t.schema,
          table: t.table,
          method: 'streaming_cdc',
          primaryKey: t.primary_key,
          streamingConfig: { /* ... */ }
        }))
      ];
    }

    await db.unified_sources.create(unified);
  }
}
```

---

## Success Metrics

### User Experience
- ✅ 60% reduction in time to configure sources (from 30min to 12min)
- ✅ 90% of users accept AI suggestions
- ✅ Zero mode-selection confusion (removed!)
- ✅ 80% prefer per-table configuration

### Infrastructure Efficiency
- ✅ 40% reduction in Kafka usage (only for streaming tables)
- ✅ 30% cost savings (incremental query vs full CDC where appropriate)
- ✅ 50% fewer failed deployments (better validation)

### Developer Productivity
- ✅ 70% faster table onboarding
- ✅ 85% reduction in support tickets ("which mode do I choose?")
- ✅ 3x more tables onboarded per sprint

---

## Technical Debt & Future Enhancements

### Phase 8+ (Future)
1. **ML-based Suggestion Engine**
   - Learn from user override patterns
   - Predict optimal ingestion method
   - Cost-performance optimization

2. **Auto-scaling CDC Pipelines**
   - Dynamic Kafka partition scaling
   - Spark executor auto-scaling
   - Storage tiering based on access patterns

3. **Multi-region Support**
   - Geo-distributed ingestion
   - Regional cost optimization
   - Data residency compliance

4. **Incremental Schema Evolution**
   - Automatic schema migration
   - Backward compatibility checks
   - Zero-downtime updates

---

## Conclusion

This unified approach:
- ✅ **Matches real-world workflows** - Table-first decision making
- ✅ **Reduces complexity** - Single flow instead of 3 modes
- ✅ **Optimizes costs** - Right method for each table
- ✅ **Improves UX** - Smart suggestions, progressive disclosure
- ✅ **Increases flexibility** - 4 ingestion methods for different needs

**Next Steps:** Begin Phase 1 implementation - Type system updates and backend foundation.
