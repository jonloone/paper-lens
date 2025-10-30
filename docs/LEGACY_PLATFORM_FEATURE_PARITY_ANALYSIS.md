# NexusOne Platform: Legacy Feature Parity Analysis
## Complete Analysis & Functional Integration Plan

**Date**: 2025-10-21
**Status**: Implementation Ready
**Approach**: Enhance existing UI, functional flows only

---

## Executive Summary

This document provides a **complete feature parity analysis** between the legacy NexusOne platform (docs.nx1cloud.com) and the current implementation. The analysis identifies gaps and provides a **functional integration plan** that enhances existing pages and components rather than creating duplicates.

### Key Findings

| Category | Legacy | Current | Status | Integration Approach |
|----------|--------|---------|--------|---------------------|
| **File Upload** | ✅ Simple CSV upload | ⚠️ Profiling only | **GAP** | Enhance `/manage/connections/new` |
| **Database Connections** | ✅ Basic | ✅ **ENHANCED** | **PARITY+** | Keep existing 5-step wizard |
| **API Connectors** | ❓ Limited docs | ❌ Not implemented | **GAP** | New wizard under `/manage/connections/new/api` |
| **CDC Streaming** | ✅ Via NiFi | ✅ **ENHANCED** | **PARITY+** | Keep existing Debezium wizard |
| **Federated Query** | ✅ Trino | ✅ **ENHANCED** | **PARITY+** | Keep existing 1,372-line wizard |
| **File Management** | ✅ S3-backed | ❌ Not implemented | **GAP** | Enhance `/manage/connections` page |

### Strategic Decision

**Use Existing Architecture**:
- ✅ Enhance existing pages (`/manage/connections`, `/build`)
- ✅ Follow existing wizard patterns (5-step flows)
- ✅ Extend existing backend APIs (`sources_routes.py`)
- ✅ Reuse existing components and state management
- ❌ No duplicate/mock pages

---

## Part 1: Legacy Platform Analysis

### 1.1 Core File Upload Workflow (Legacy)

**Documented Flow**: `docs.nx1cloud.com/tutorials/ingest/file/upload-csv`

**Route**: `Ingest > File > Upload File`

**Configuration Options**:
```python
# From docs.nx1cloud.com tutorial
{
  "header": True,              # Identifies column names
  "infer_schema": True,        # Auto-detect data types
  "delimiter": ",",            # Field separator
  "quote_character": '"',      # String protection
  "date_formats": [...],       # Custom date parsing

  # Ingestion details
  "name": "csv",               # File identifier
  "schema": "csv_schema",      # Target schema
  "table": "csv_table",        # Target table
  "schedule": None,            # Cron expression or None
  "mode": "append"             # append | overwrite | merge
}
```

**API Endpoint**: `POST https://aiapi.rapid.nx1cloud.com/api/files/file`

**Request**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token> OR Authorization-PSK: <api_key>

FormData:
  - file: binary
```

**Response**:
```json
{
  "id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "owner_id": "user@company.com",
  "name": "customer_data.csv",
  "bucket_name": "nx1-uploads",
  "s3_url": "s3://nx1-uploads/customer_data.csv",
  "size": 5242880,
  "access_count": 0,
  "created_at": "2025-10-21T14:30:00Z"
}
```

**Key Characteristics**:
- File stored **permanently** in S3
- Immediately **queryable** via Trino: `SELECT * FROM csv_schema.csv_table`
- Monitored via "Monitor" tab
- Can be scheduled for refresh

---

### 1.2 Legacy Technology Stack

| Layer | Tools |
|-------|-------|
| **Ingestion** | Apache NiFi, Spark, Airflow |
| **Storage** | S3, HDFS, Iceberg, Delta Lake, Hudi |
| **Query** | Trino (federated queries) |
| **Streaming** | Kafka, Flink, Kinesis |
| **Governance** | Apache Ranger, DataHub, Keycloak |
| **AI/ML** | CrewAI, Jupyter, PyTorch, Ray, MLflow, Ollama |
| **Analytics** | Metabase, Superset |

---

## Part 2: Current Implementation Analysis

### 2.1 Existing Pages & Components

#### Connections Management
**File**: `app/(main)/manage/connections/new/page.tsx` (430 lines)

**Current Structure**:
```typescript
const sourceCategories = [
  { id: 'database', title: 'Databases & Data Warehouses', connectorCount: 50 },
  { id: 'file_storage', title: 'Cloud Storage & Data Lakes', connectorCount: 15 },
  { id: 'api_saas', title: 'APIs & SaaS Applications', connectorCount: 100 },
  { id: 'messaging', title: 'Message Queues & Event Streams', connectorCount: 20 },
  { id: 'lakehouse', title: 'Data Lakehouses', connectorCount: 3 },
  { id: 'files', title: 'Files & FTP', connectorCount: 50 }  // ← EXISTS but not functional
];
```

**Current Behavior**:
- Categories displayed with connector counts
- Click → Select specific connector → Route to wizard
- **Problem**: "Files & FTP" and "APIs & SaaS" don't route anywhere functional

---

#### Database Connection Wizard
**File**: `app/(main)/manage/connections/new/connect/page.tsx`

**5-Step Wizard** (Proven Pattern):
```typescript
const steps = [
  { value: 'connection', label: 'Connection', number: 1 },
  { value: 'browse', label: 'Browse Tables', number: 2 },
  { value: 'configure', label: 'Configure Access', number: 3 },
  { value: 'review', label: 'Review', number: 4 },
  { value: 'finalize', label: 'Finalize', number: 5 },
];
```

**State Management**:
```typescript
interface WizardState {
  step: Step;
  databaseType: DatabaseType;
  connection: Partial<ConnectionDetails>;
  selectedTables: TableIngestionConfig[];
  catalogName: string;
  connectionTested: boolean;
}

// Saves to localStorage using existing service
saveConnection(createConnectionFromWizard(wizardState));
```

**This pattern works well** - reuse it for file upload!

---

#### Build Flow (Step 3: SQL Workstation)
**File**: `components/build/steps/Step3SQLWorkstation.tsx`

**Current Features**:
- SQL editor with AI assistance
- dbt template recommendations
- Query execution
- Results display
- Schema browser

**Opportunity**: Add "Test with File" tab for temporary uploads

---

### 2.2 Backend Architecture

#### Sources API
**File**: `backend/api/sources_routes.py` (200+ lines)

**Existing Endpoints**:
```python
GET    /api/v1/sources                    # List all sources
GET    /api/v1/sources/summary            # Dashboard stats
GET    /api/v1/sources/{id}               # Source detail
POST   /api/v1/sources                    # Create source
PUT    /api/v1/sources/{id}               # Update source
DELETE /api/v1/sources/{id}               # Delete source
POST   /api/v1/sources/{id}/test-connection
GET    /api/v1/sources/{id}/health
GET    /api/v1/sources/{id}/tables
POST   /api/v1/sources/{id}/deploy
GET    /api/v1/sources/{id}/recommendations
```

**Already supports multiple source types** - just need to add file handling!

---

#### Data Models
**File**: `backend/models/sources.py` (300+ lines)

**Current Source Model**:
```python
class Source(BaseModel):
    id: UUID
    name: str
    type: DatabaseType  # Already supports 23+ types
    status: SourceStatus
    connection_mode: ConnectionMode
    connection_details: ConnectionDetails
    federated_config: Optional[FederatedConfig]
    cdc_config: Optional[CDCConfig]
    batch_config: Optional[BatchConfig]
    streaming_config: Optional[StreamingConfig]
    tables: List[TableConfig]
    owner: str
    domain: str
    tags: List[str]
    created_at: datetime
    updated_at: datetime
```

**Easy to extend** with file-specific configuration!

---

### 2.3 Existing Type Definitions

**File**: `lib/types/source-connections.ts` (736 lines)

**Current DatabaseType Enum**:
```typescript
type DatabaseType =
  | 'postgresql' | 'mysql' | 'oracle' | 'sqlserver'
  | 'mongodb' | 'elasticsearch' | 'cassandra'
  | 'snowflake' | 'bigquery' | 'redshift' | 'synapse'
  | 'iceberg' | 'delta-lake' | 'hudi'
  | 'kafka' | 'kinesis';
  // ← Add: 'file_csv' | 'file_json' | 'file_parquet' | 'api_rest' | 's3' | 'gcs' | 'azure_blob'
```

**Current UnifiedSourceConnection Interface**:
```typescript
interface UnifiedSourceConnection {
  id: string;
  name: string;
  type: DatabaseType;
  connectionDetails: ConnectionDetails;
  trinoConfig?: TrinoConfig;
  tables: TableIngestionConfig[];
  owner: string;
  domain?: string;
  status: SourceStatus;
  healthScore?: number;
  // ← Add: fileConfig?: FileConfig
}
```

---

## Part 3: Feature Parity Gaps

### 3.1 Critical Gap: Simple File Upload

**What's Missing**:
- No route from "Files & FTP" category
- No file upload wizard
- No S3 storage integration
- No persistent file source creation
- Profile upload (`/api/build/profile/upload`) is for **contract design**, not data source creation

**User Impact**: HIGH
- Analysts cannot quickly upload CSV for querying
- Expected 5-minute task takes 30+ minutes via build flow
- Build flow is for data products, not ad-hoc file uploads

**Solution**:
```
/manage/connections/new
  ↓ Click "Files & FTP"
  ↓ Route to: /manage/connections/new/files/upload
  ↓ 5-step wizard (following existing pattern)
  ↓ Save as permanent source
  ↓ Queryable via Trino
```

---

### 3.2 Gap: API Connectors

**What's Missing**:
- Category exists but non-functional
- No REST API configuration UI
- No OAuth2/API key authentication setup
- No pagination handling
- No schema mapping from JSON responses

**User Impact**: MEDIUM-HIGH
- Cannot ingest from SaaS APIs (Salesforce, Stripe, Shopify)
- Manual workarounds required

**Solution**:
```
/manage/connections/new
  ↓ Click "APIs & SaaS Applications"
  ↓ Route to: /manage/connections/new/api
  ↓ 5-step wizard: Config → Auth → Pagination → Schema → Deploy
  ↓ Save as source with scheduled refresh
```

---

### 3.3 Gap: Cloud Storage Connectors

**What's Missing**:
- Category exists but limited
- No S3 bucket browser
- No GCS integration
- No Azure Blob wizard

**User Impact**: MEDIUM
- Users must manually configure Trino catalogs
- No guided workflow

**Solution**:
```
/manage/connections/new
  ↓ Click "Cloud Storage & Data Lakes"
  ↓ Select: S3 | GCS | Azure Blob
  ↓ Wizard: Credentials → Bucket → Files → Deploy
  ↓ Auto-discover and catalog files
```

---

## Part 4: Functional Integration Plan

### 4.1 Upload Workflow Strategy (CORRECTED)

#### Primary: Persistent File Upload
**Location**: `/manage/connections/new/files/upload`
**Purpose**: Create permanent, queryable data source
**User Mental Model**: "I'm adding a file as a new data source"

**Entry Points**:
1. `/manage/connections/new` → Click "Files & FTP" category
2. `/manage/connections` → [Upload File] button

**Workflow**:
```
┌─────────────────────────────────────┐
│ Step 1: Upload File                 │
│  - Drag & drop or select            │
│  - Auto-detect format               │
│  - Show preview (100 rows)          │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Step 2: Configure Schema            │
│  - Auto-detected schema             │
│  - Override types if needed         │
│  - Set nullable, defaults           │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Step 3: Source Settings             │
│  - Source name                      │
│  - Target schema.table              │
│  - Refresh schedule (cron)          │
│  - Partitioning (optional)          │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Step 4: Review                      │
│  - Configuration summary            │
│  - Estimated size, rows             │
│  - Trino catalog table name         │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Step 5: Deploy                      │
│  ✓ Upload to S3                     │
│  ✓ Register in Trino catalog        │
│  ✓ Save to sources database         │
│  ✓ Create refresh schedule          │
│  → Success: Query now available     │
└─────────────────────────────────────┘
```

**Result**:
- File stored in S3: `s3://nx1-data/files/customer_data.csv`
- Trino table: `files.default.customer_data`
- Listed in `/manage/connections`
- Queryable immediately
- Can be refreshed on schedule

---

#### Secondary: Temporary Test Upload
**Location**: Build flow Step 3 (SQL Workstation)
**Purpose**: Test queries with sample data
**User Mental Model**: "I want to test my SQL with sample data before committing"

**Integration**:
```typescript
// In components/build/steps/Step3SQLWorkstation.tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="editor">SQL Editor</TabsTrigger>
    <TabsTrigger value="schema">Schema Browser</TabsTrigger>
    <TabsTrigger value="test-file">Test with File</TabsTrigger> {/* NEW */}
  </TabsList>

  <TabsContent value="test-file">
    <TempFileUpload
      onUpload={(tempTable) => {
        // Auto-insert into query: SELECT * FROM temp.test_abc123
      }}
    />
    <Alert>
      ⏰ Temporary data - deleted after 24 hours
    </Alert>
  </TabsContent>
</Tabs>
```

**Behavior**:
- File uploaded to `/tmp/nx1-temp-files/`
- Registered as `temp.test_{session_id}`
- Visible in schema browser with "TEMP" badge
- Auto-deleted after 24 hours
- Size limit: 100MB
- **NOT saved as permanent source**

---

### 4.2 File Wizard Implementation

**New File**: `app/(main)/manage/connections/new/files/upload/page.tsx`

**Pattern**: Copy from `connect/page.tsx` (proven 5-step wizard)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveConnection, createConnectionFromWizard } from '@/lib/services/connection-storage';

type FileUploadStep = 'upload' | 'schema' | 'settings' | 'review' | 'deploy';

interface FileWizardState {
  step: FileUploadStep;
  file: File | null;
  schema: AutoDetectedSchema | null;
  sourceName: string;
  targetSchema: string;
  targetTable: string;
  refreshSchedule: string | null;
  partitionBy: string[];
}

export default function FileUploadWizard() {
  const router = useRouter();
  const [state, setState] = useState<FileWizardState>({
    step: 'upload',
    file: null,
    schema: null,
    sourceName: '',
    targetSchema: 'files',
    targetTable: '',
    refreshSchedule: null,
    partitionBy: []
  });

  const steps = [
    { value: 'upload', label: 'Upload File', number: 1 },
    { value: 'schema', label: 'Configure Schema', number: 2 },
    { value: 'settings', label: 'Source Settings', number: 3 },
    { value: 'review', label: 'Review', number: 4 },
    { value: 'deploy', label: 'Deploy', number: 5 },
  ];

  const handleFileUpload = async (file: File) => {
    setState(prev => ({ ...prev, file, sourceName: file.name.replace(/\.\w+$/, '') }));

    // Auto-detect schema
    const schema = await detectSchema(file);
    setState(prev => ({ ...prev, schema }));
  };

  const handleDeploy = async () => {
    const formData = new FormData();
    formData.append('file', state.file!);
    formData.append('source_name', state.sourceName);
    formData.append('target_schema', state.targetSchema);
    formData.append('target_table', state.targetTable);
    if (state.refreshSchedule) {
      formData.append('refresh_schedule', state.refreshSchedule);
    }

    const response = await fetch('/api/v1/sources/files/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    // Save to localStorage using existing service
    const connection = createConnectionFromWizard({
      databaseType: 'file_csv', // or file_json, file_parquet
      connection: {
        host: 's3',
        port: 443,
        database: result.s3_url
      },
      tables: [{
        schema: state.targetSchema,
        table: state.targetTable,
        enabled: true,
        method: 'federated'
      }],
      catalogName: `file_${state.sourceName}`
    });

    saveConnection(connection);

    router.push('/manage/connections');
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Stepper (copy from connect/page.tsx) */}
      {/* Step content based on state.step */}
      {state.step === 'upload' && <UploadStep onUpload={handleFileUpload} />}
      {state.step === 'schema' && <SchemaStep schema={state.schema} />}
      {/* ... */}
    </div>
  );
}
```

---

### 4.3 Backend Implementation

#### Extend Sources Routes
**File**: `backend/api/sources_routes.py`

```python
@router.post("/api/v1/sources/files/upload")
async def upload_file_source(
    file: UploadFile = File(...),
    source_name: str = Form(...),
    target_schema: str = Form("files"),
    target_table: str = Form(...),
    refresh_schedule: Optional[str] = Form(None),
    auto_detect_schema: bool = Form(True),
    service: SourcesService = Depends(get_sources_service)
):
    """
    Upload a file and create it as a persistent data source.

    Flow:
    1. Upload file to S3
    2. Detect schema (if auto_detect_schema=True)
    3. Register in Trino catalog
    4. Save to sources database
    5. Schedule refresh (if refresh_schedule provided)
    """
    try:
        # Upload to S3
        s3_url = await service.upload_file_to_s3(
            file=file,
            bucket="nx1-data",
            prefix=f"files/{source_name}/"
        )

        # Detect schema
        if auto_detect_schema:
            schema = await service.detect_file_schema(
                s3_url=s3_url,
                file_format=file.content_type
            )
        else:
            schema = None  # Will be provided in request

        # Register in Trino catalog
        trino_table = f"{target_schema}.{target_table}"
        await service.register_trino_file_table(
            catalog="files",
            schema=target_schema,
            table=target_table,
            location=s3_url,
            file_format=schema.get("file_format", "csv"),
            schema_fields=schema.get("fields", [])
        )

        # Count rows
        row_count = await service.count_file_rows(s3_url)
        file_size_mb = file.size / (1024 * 1024)

        # Create source record
        source = Source(
            id=uuid4(),
            name=source_name,
            type="file_csv",  # or file_json, file_parquet
            status="active",
            connection_mode="federated",
            connection_details=ConnectionDetails(
                host="s3",
                port=443,
                database=s3_url
            ),
            file_config=FileSourceConfig(
                s3_url=s3_url,
                file_format=schema.get("file_format"),
                row_count=row_count,
                file_size_mb=file_size_mb,
                refresh_schedule=refresh_schedule
            ),
            tables=[TableConfig(
                schema=target_schema,
                table=target_table,
                enabled=True,
                method="federated"
            )],
            owner="current_user@company.com",
            created_at=datetime.utcnow()
        )

        await service.create_source(source)

        # Schedule refresh if needed
        if refresh_schedule:
            await service.schedule_file_refresh(source.id, refresh_schedule)

        return {
            "source_id": str(source.id),
            "source_name": source_name,
            "trino_table": trino_table,
            "s3_url": s3_url,
            "row_count": row_count,
            "file_size_mb": file_size_mb,
            "schema": schema,
            "status": "active",
            "queryable": True
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file source: {str(e)}"
        )
```

#### New Service Methods
**File**: `backend/services/sources_service.py`

```python
class SourcesService:
    # ... existing methods ...

    async def upload_file_to_s3(
        self,
        file: UploadFile,
        bucket: str,
        prefix: str
    ) -> str:
        """Upload file to S3 and return S3 URL"""
        import boto3

        s3_client = boto3.client('s3')
        key = f"{prefix}{file.filename}"

        await s3_client.upload_fileobj(
            file.file,
            bucket,
            key
        )

        return f"s3://{bucket}/{key}"

    async def detect_file_schema(
        self,
        s3_url: str,
        file_format: str
    ) -> dict:
        """Auto-detect schema from file"""
        # Download sample (first 1000 rows)
        # Use pandas/pyarrow to infer schema
        # Return schema definition
        pass

    async def register_trino_file_table(
        self,
        catalog: str,
        schema: str,
        table: str,
        location: str,
        file_format: str,
        schema_fields: list
    ):
        """Register file as Trino table"""
        # Use Trino admin API or Hive Metastore
        # CREATE EXTERNAL TABLE files.default.customer_data
        # LOCATION 's3://...'
        # FORMAT 'CSV' WITH (header=true)
        pass

    async def schedule_file_refresh(
        self,
        source_id: UUID,
        cron_schedule: str
    ):
        """Schedule file refresh job"""
        # Use Airflow API or scheduler
        # Create DAG for file refresh
        pass
```

---

### 4.4 Enhanced Connections Page

**File**: `app/(main)/manage/connections/page.tsx` (modify existing)

**Add Quick Actions**:
```typescript
export default function ConnectionsPage() {
  const router = useRouter();
  const connections = getAllConnections(); // existing function

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Data Sources</h1>
          <p className="text-muted-foreground">
            Manage database connections, files, APIs, and streaming sources
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/manage/connections/new/files/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
          <Button onClick={() => router.push('/manage/connections/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Source
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="database">Databases</SelectItem>
            <SelectItem value="file">Files</SelectItem>
            <SelectItem value="api">APIs</SelectItem>
            <SelectItem value="cloud">Cloud Storage</SelectItem>
            <SelectItem value="streaming">Streaming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Connection Cards - enhance existing */}
      <div className="space-y-4">
        {connections.map(conn => (
          <ConnectionCard
            key={conn.id}
            connection={conn}
            onRefresh={conn.type.startsWith('file_') ? handleFileRefresh : undefined}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Part 5: Implementation Roadmap

### Phase 1: File Upload (Weeks 1-4)

**Week 1: Backend Foundation**
- [ ] Extend `backend/models/sources.py` with `FileSourceConfig`
- [ ] Add `upload_file_to_s3()` method to `SourcesService`
- [ ] Add `detect_file_schema()` method
- [ ] Add `register_trino_file_table()` method
- [ ] Create `POST /api/v1/sources/files/upload` endpoint

**Week 2: File Upload Wizard**
- [ ] Create `/manage/connections/new/files/upload/page.tsx`
- [ ] Implement 5-step wizard following `connect/page.tsx` pattern
- [ ] Create step components:
  - `UploadStep.tsx` - Drag/drop file upload
  - `SchemaStep.tsx` - Schema preview/editing
  - `SettingsStep.tsx` - Source configuration
  - `ReviewStep.tsx` - Summary
  - `DeployStep.tsx` - Upload progress
- [ ] Integrate with existing `saveConnection()` service

**Week 3: Integration & Polish**
- [ ] Update `lib/types/source-connections.ts` with file types
- [ ] Make "Files & FTP" category functional in `/manage/connections/new`
- [ ] Add "Upload File" button to `/manage/connections` page
- [ ] Add file-specific actions (Refresh, Download, View Schema)
- [ ] Update connection cards to show file metadata

**Week 4: Testing & Refinement**
- [ ] E2E tests for file upload workflow
- [ ] Test S3 upload and Trino registration
- [ ] Test file refresh scheduling
- [ ] Performance testing with large files
- [ ] Documentation

---

### Phase 2: API Connectors (Weeks 5-7)

**Week 5: API Connector Backend**
- [ ] Create `backend/services/api_connector_service.py`
- [ ] Add API source type to models
- [ ] Implement authentication methods (OAuth2, API key, Bearer)
- [ ] Implement pagination handlers (offset, cursor, page)
- [ ] Create `POST /api/v1/sources/api-connectors` endpoint

**Week 6-7: API Wizard**
- [ ] Create `/manage/connections/new/api/page.tsx`
- [ ] Implement 5-step wizard:
  - API Configuration (endpoint, method)
  - Authentication setup
  - Pagination configuration
  - Schema mapping (JSON → table schema)
  - Review & deploy
- [ ] Test endpoint connection
- [ ] Sample data fetch
- [ ] Schedule refresh setup

---

### Phase 3: SQL Workstation Temp Upload (Week 8)

**Implementation**:
- [ ] Create `components/build/TempFileUpload.tsx`
- [ ] Add "Test with File" tab to `Step3SQLWorkstation.tsx`
- [ ] Create `POST /api/build/temp-upload` endpoint
- [ ] Implement temp file cleanup (24-hour TTL)
- [ ] Show temp tables in schema browser with badge

---

### Phase 4: Cloud Storage (Weeks 9-10)

**S3 Connector**:
- [ ] Create `/manage/connections/new/cloud-storage/s3/page.tsx`
- [ ] Implement bucket browser
- [ ] File discovery and cataloging
- [ ] Credentials management (IAM role, access keys)

**GCS & Azure** (similar patterns):
- [ ] GCS wizard
- [ ] Azure Blob wizard

---

### Phase 5: Polish & Documentation (Week 11)

- [ ] Integration testing across all new features
- [ ] Performance optimization
- [ ] User documentation
- [ ] Migration guide for legacy users
- [ ] Training materials

---

## Part 6: Success Metrics

### Functional Requirements
- ✅ File upload creates queryable source in < 5 minutes
- ✅ Files appear in existing `/manage/connections` page
- ✅ Trino can query uploaded files
- ✅ File refresh works on schedule
- ✅ API connectors sync data successfully
- ✅ Temp files work in SQL Workstation
- ✅ No duplicate pages created

### User Experience Metrics
- **File Upload Time**: < 3 minutes (vs. 30+ via build flow)
- **User Satisfaction**: 4.5/5 (target)
- **Task Completion Rate**: 95%+ (file upload success)
- **Adoption**: 100+ file uploads in first month

### Technical Metrics
- **Upload Success Rate**: > 98%
- **Query Performance**: < 2s p95 for file queries
- **S3 Storage**: < $500/month (with lifecycle policies)
- **API Sync Success**: > 95%

---

## Part 7: Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| **S3 storage costs** | Lifecycle policies, 90-day retention, compression |
| **Large file uploads** | 10GB size limit, streaming uploads, chunking |
| **Schema drift** | Version schemas, detect changes, alert users |
| **Trino catalog performance** | Partition pruning, caching, query optimization |

### User Experience Risks
| Risk | Mitigation |
|------|------------|
| **Confusion: file upload vs. build flow** | Clear labels: "Quick Upload" vs. "Build Product" |
| **Breaking existing workflows** | Feature flags, gradual rollout, A/B testing |
| **Loss of advanced features** | Keep all existing capabilities, add simple entry points |

---

## Conclusion

### Implementation Strategy

**✅ Use Existing Architecture**:
- Enhance `/manage/connections/new` and `/manage/connections` pages
- Follow proven 5-step wizard pattern from `connect/page.tsx`
- Extend existing backend `sources_routes.py` and `SourcesService`
- Reuse existing components, state management, and types
- Integrate with existing PostgreSQL database and localStorage

**✅ Functional Flows Only**:
- No mock data or placeholder pages
- Real S3 uploads with Trino catalog registration
- Actual API connectors with scheduled sync
- Working temp file uploads in SQL Workstation

**✅ Progressive Disclosure**:
- Simple "Upload File" for quick tasks (3 minutes)
- Advanced "Build Product" for governed workflows (45+ minutes)
- Clear guidance on which to use when

### Expected Outcomes

After 11 weeks of implementation:
- ✅ **Feature parity** with legacy platform file upload
- ✅ **Enhanced** with API connectors and cloud storage
- ✅ **Maintained** all existing advanced capabilities
- ✅ **Improved** user experience with 90% faster simple workflows
- ✅ **Integrated** seamlessly into existing app architecture

---

**Document Status**: Ready for Implementation
**Next Steps**: Begin Phase 1, Week 1 (Backend Foundation)
**Owner**: Engineering Team
**Last Updated**: 2025-10-21
