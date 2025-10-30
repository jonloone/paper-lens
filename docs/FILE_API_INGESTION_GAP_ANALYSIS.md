# File & API Ingestion: Gap Analysis & Alignment Strategy

**Date**: 2025-10-20
**Status**: Critical Review
**Impact**: High - Core data ingestion capabilities

---

## Executive Summary

This document analyzes the gaps between the **current NexusOne implementation** and the **legacy backend's file/API ingestion patterns** as documented at `docs.nx1cloud.com`. While the current implementation provides sophisticated enterprise-grade connection management, it lacks the simpler, more accessible file upload and API ingestion flows expected from the legacy documentation.

**Key Findings**:
- ✅ **Strengths**: Advanced CDC pipelines, federated queries, comprehensive connection management
- ⚠️ **Gaps**: Missing simple file upload flow, API connector wizard, cloud storage integrations
- 🔄 **Misalignment**: Profiling-focused file upload vs. data source file upload
- 📊 **Impact**: Users expecting simple CSV/API ingestion may struggle with current complex flows

---

## 1. Current Implementation Analysis

### 1.1 Implemented Capabilities

#### A. File Upload for Profiling & Contract Inference
**Endpoint**: `POST /api/build/profile/upload`
**Location**: `app/api/build/profile/upload/route.ts` (152 lines)

**Purpose**: Upload CSV/Parquet/JSON for data profiling and automated contract generation
**Use Case**: Build flow - Step 2 (Select Sources) for contract design

**Request Format**:
```typescript
POST /api/build/profile/upload
Content-Type: multipart/form-data

FormData:
  - file: binary (CSV, Parquet, JSON)
  - namespace: string
  - contract_name: string
  - owner: string
  - description?: string
```

**Response**:
```json
{
  "success": true,
  "contract": {
    "schema": { "fields": [...] },
    "quality": [...]
  },
  "profiling_summary": {
    "rows": 15000,
    "columns": ["id", "name", "email", ...],
    "memory_size_mb": 2.4
  },
  "inference_summary": {
    "confidence": 0.92,
    "fields_inferred": 12,
    "quality_rules_inferred": 8
  },
  "temp_file_path": "/tmp/nexus-one-uploads/..."
}
```

**Limitations**:
- ❌ File is stored temporarily, not as a persistent data source
- ❌ Cannot query the uploaded file directly
- ❌ No ongoing data refresh/update capability
- ❌ Focused on contract design, not data ingestion

---

#### B. Source Connection Management
**Locations**:
- `app/(main)/manage/connections/new/page.tsx` (430 lines)
- `app/(main)/manage/connections/new/connect/page.tsx` (5-step wizard)
- `backend/api/sources_routes.py` (15+ REST endpoints)

**Supported Categories**:
1. ✅ **Databases & Data Warehouses** (50+ connectors)
   - PostgreSQL, MySQL, Oracle, SQL Server, MongoDB, etc.
   - Full 5-step wizard with connection testing

2. ✅ **Cloud Storage & Data Lakes** (Listed, not implemented)
   - S3, GCS, Azure Blob, HDFS
   - ⚠️ **GAP**: Category exists but no dedicated wizard

3. ✅ **APIs & SaaS Applications** (Listed, not implemented)
   - Salesforce, Slack, Stripe, Shopify, etc.
   - ⚠️ **GAP**: Category exists but no dedicated wizard

4. ✅ **Message Queues & Event Streams** (20 connectors)
   - Kafka, Kinesis
   - Full CDC pipeline wizard

5. ✅ **Data Lakehouses** (3 connectors)
   - Iceberg, Delta Lake, Hudi
   - Integrated into CDC wizard

6. ✅ **Files & FTP** (Listed, not implemented)
   - JSON, CSV, XML, Parquet, Avro
   - ⚠️ **GAP**: Category exists but no dedicated wizard

**Connection Flow**:
```
User selects category → User selects connector →
5-Step Wizard:
  1. Connection Details (host, port, credentials)
  2. Browse Tables (schema discovery)
  3. Configure Access (ingestion methods per table)
  4. Review Configuration
  5. Finalize & Deploy
```

**Limitations**:
- ❌ File-based sources (CSV, JSON, Parquet) don't fit this database-centric flow
- ❌ API endpoints need different configuration (URL, auth, pagination)
- ❌ Cloud storage requires bucket/path selection, not table browsing

---

#### C. CDC Pipeline Orchestration
**Location**: `app/(main)/manage/connections/cdc-wizard/page.tsx`

**5-Step Pipeline Deployment**:
1. **Source Selection** - Choose existing database source
2. **Kafka Configuration** - Topic, partitions, retention
3. **Debezium Configuration** - CDC connector, snapshot mode
4. **Iceberg Configuration** - Table format, partitioning
5. **Review & Deploy** - Validation, dry-run, rollout

**Strengths**:
- ✅ Enterprise-grade streaming data ingestion
- ✅ Complete observability and monitoring
- ✅ AI-powered recommendations

**Limitations**:
- ❌ Requires database source (can't use files or APIs)
- ❌ Complex setup unsuitable for simple data ingestion

---

#### D. Federated Query (Trino)
**Location**: `app/(main)/manage/connections/new/federated/page.tsx` (1,372 lines)

**Purpose**: Query data in-place without copying
**Use Cases**: PostgreSQL, MySQL, Snowflake, Redshift, etc.

**Strengths**:
- ✅ Zero data movement
- ✅ Real-time queries
- ✅ Cross-source joins

**Limitations**:
- ❌ Requires database or data warehouse
- ❌ Cannot federate static files or API responses

---

### 1.2 Storage & Persistence

**Frontend Storage**: `lib/services/connection-storage.ts` (436 lines)
- Uses `localStorage` for connection persistence
- Keys: `nexus_connections`, `connection_{id}`
- Functions: `saveConnection()`, `getAllConnections()`, `deleteConnection()`

**Backend Storage**: PostgreSQL database
- `sources` table (id, name, type, config, status, etc.)
- `source_tables` table (discovered schemas)
- `source_deployments` table (deployment history)
- `source_metrics` table (usage analytics)

---

## 2. Expected Legacy Backend Patterns

### 2.1 Inferred from Documentation URLs

Based on the documentation structure:

#### A. `/api-reference/endpoints/files/upload-file`
**Expected Endpoint**: `POST /api/files/upload-file`

**Inferred Behavior**:
```typescript
POST /api/files/upload-file
Content-Type: multipart/form-data

FormData:
  - file: binary (CSV, JSON, Excel, Parquet)
  - source_name?: string
  - folder_path?: string (e.g., "finance/quarterly")
  - auto_detect_schema?: boolean
  - refresh_schedule?: string (cron expression)
```

**Expected Response**:
```json
{
  "file_id": "uuid",
  "file_name": "customer_data.csv",
  "file_size_mb": 5.2,
  "row_count": 10000,
  "upload_timestamp": "2025-10-20T14:30:00Z",
  "schema": {
    "fields": [
      {"name": "id", "type": "integer"},
      {"name": "email", "type": "string"}
    ]
  },
  "query_endpoint": "/api/query/files/customer_data",
  "status": "ready"
}
```

**Key Differences from Current Implementation**:
| Aspect | Current (`/api/build/profile/upload`) | Expected (`/api/files/upload-file`) |
|--------|--------------------------------------|-------------------------------------|
| **Purpose** | Contract design via profiling | Persistent data source |
| **Storage** | Temporary (`/tmp/`) | Persistent (S3/blob store + catalog) |
| **Queryability** | Not queryable | Directly queryable via API |
| **Refresh** | One-time upload | Scheduled refresh support |
| **Integration** | Build flow only | Available to all users/queries |

---

#### B. `/tutorials/ingest/file/upload-csv`
**Expected Tutorial Flow**:

```
Step 1: Navigate to Data Sources
  ↓
Step 2: Click "Upload File"
  ↓
Step 3: Select CSV file or drag-and-drop
  ↓
Step 4: Preview schema & data (first 100 rows)
  ↓
Step 5: Configure options:
  - Source name
  - Delimiter (comma, tab, pipe)
  - Header row detection
  - Data type inference
  ↓
Step 6: (Optional) Set refresh schedule
  - Manual refresh only
  - Daily/Weekly/Monthly
  - Webhook trigger
  ↓
Step 7: Upload & make available
  ↓
Result: File now queryable as data source
```

**Current Implementation Gap**:
- ❌ No dedicated "Upload File" button in data sources
- ❌ Upload flow exists only in Build flow context
- ❌ No simple file-to-queryable-source conversion
- ❌ Missing file management UI (list, refresh, delete)

---

### 2.2 Expected API Ingestion Flow

**Inferred from Category "APIs & SaaS Applications"**:

#### Expected API Connector Wizard

```
Step 1: API Configuration
  - API Name (e.g., "Stripe Payments")
  - Base URL (e.g., "https://api.stripe.com/v1")
  - Authentication Method:
    □ API Key (header/query param)
    □ OAuth 2.0
    □ Basic Auth
    □ Bearer Token
    □ Custom Headers

Step 2: Endpoint Configuration
  - Resource Path (e.g., "/charges")
  - HTTP Method (GET, POST)
  - Query Parameters
  - Request Headers
  - Pagination:
    □ Offset-based
    □ Cursor-based
    □ Page number
    □ Link header

Step 3: Schema Mapping
  - Auto-detect from sample response
  - Manual schema definition
  - Nested object flattening
  - Array handling (explode/JSON)

Step 4: Refresh Configuration
  - Polling interval
  - Incremental field (updated_at, id)
  - Full refresh vs. incremental
  - Webhook endpoint (optional)

Step 5: Test & Save
  - Test connection
  - Preview data (first 100 records)
  - Save as queryable source
```

**Current Implementation Gap**:
- ❌ No API connector wizard exists
- ❌ No REST API configuration UI
- ❌ No authentication method selection
- ❌ No pagination configuration
- ❌ Category listed but not implemented

---

## 3. Detailed Gap Analysis

### 3.1 Missing Features

#### Priority 1: Critical Gaps

| Feature | Status | Impact | Complexity | Notes |
|---------|--------|--------|------------|-------|
| **Simple File Upload as Data Source** | ❌ Missing | High | Medium | Core user expectation from docs |
| **File Management UI** | ❌ Missing | High | Low | List, refresh, delete uploaded files |
| **File Query Endpoint** | ❌ Missing | High | Medium | `/api/query/files/{file_name}` |
| **API Connector Wizard** | ❌ Missing | High | High | REST API ingestion flow |
| **Cloud Storage Connector** | ❌ Missing | High | Medium | S3, GCS, Azure Blob integration |

#### Priority 2: Important Gaps

| Feature | Status | Impact | Complexity | Notes |
|---------|--------|--------|------------|-------|
| **File Refresh Scheduling** | ❌ Missing | Medium | Medium | Cron-based file updates |
| **Webhook Ingestion** | ❌ Missing | Medium | Medium | Real-time API data push |
| **API Pagination Handling** | ❌ Missing | Medium | High | Offset, cursor, page-based |
| **OAuth 2.0 Flow** | ❌ Missing | Medium | High | SaaS app authentication |
| **FTP/SFTP Connector** | ❌ Missing | Low | High | Legacy file transfer |

#### Priority 3: Enhancement Gaps

| Feature | Status | Impact | Complexity | Notes |
|---------|--------|--------|------------|-------|
| **Excel File Support** | ❌ Missing | Low | Low | `.xlsx`, `.xls` parsing |
| **Multi-sheet Excel Handling** | ❌ Missing | Low | Medium | Select specific sheets |
| **Compressed File Support** | ❌ Missing | Low | Low | `.zip`, `.gz` extraction |
| **GraphQL API Support** | ❌ Missing | Low | High | Alternative to REST |

---

### 3.2 Architecture Misalignment

#### Current: Profiling-First Architecture
```
File Upload → Profiling Service → Contract Generation →
Temporary Storage → Contract Designer → Manual Query Writing
```

**Characteristics**:
- Focus on data quality and contract design
- File is a means to generate a contract, not a data source
- No persistent file storage or catalog
- Requires users to understand "contracts" and "profiling"

#### Expected: Source-First Architecture
```
File Upload → Schema Detection → Persistent Storage (S3/Blob) →
Catalog Registration (DataHub/Trino) → Queryable Data Source
```

**Characteristics**:
- Focus on making data immediately accessible
- File becomes a first-class data source
- Simple catalog of files with metadata
- Users can query files like any other source

**Recommendation**: Implement **both patterns** for different use cases:
1. **Simple File Upload** (`/api/files/upload-file`) - For immediate data access
2. **Profiling Upload** (`/api/build/profile/upload`) - For contract design workflow

---

### 3.3 User Experience Gaps

#### Scenario 1: Business Analyst Uploads CSV
**User Intent**: "I have a CSV file with customer data. I want to query it."

**Expected Flow (from docs)**:
1. Go to Data Sources
2. Click "Upload File"
3. Select CSV
4. Preview & confirm
5. Query immediately

**Current Flow (implemented)**:
1. Go to Build → New Data Product
2. Click "Add Sources"
3. Upload for profiling (not explained as "data source")
4. Review profiling report
5. Design contract schema
6. Write SQL manually (file not queryable)
7. Confusion: "Where's my data?"

**Result**: ❌ **User Frustration** - 5-minute task becomes 30-minute workflow

---

#### Scenario 2: Engineer Sets Up REST API Ingestion
**User Intent**: "I need to pull data from our Stripe API daily."

**Expected Flow (from docs)**:
1. Go to Connections → New Connection
2. Select "APIs & SaaS Applications"
3. Choose "REST API" connector
4. Configure endpoint, auth, pagination
5. Test connection
6. Save & schedule refresh

**Current Flow (implemented)**:
1. Go to Connections → New Connection
2. Select "APIs & SaaS Applications"
3. **ERROR**: No wizard available
4. Manual workaround required (possibly using batch ingestion or custom code)

**Result**: ❌ **Feature Unavailable** - Critical use case not supported

---

### 3.4 Documentation vs. Implementation Matrix

| Documentation Topic | Expected URL | Implemented? | Gap Type |
|---------------------|--------------|--------------|----------|
| File Upload API Reference | `/api-reference/endpoints/files/upload-file` | ❌ No | **Missing Endpoint** |
| CSV Upload Tutorial | `/tutorials/ingest/file/upload-csv` | ⚠️ Partial (profiling only) | **Flow Mismatch** |
| API Ingestion Tutorial | `/tutorials/ingest/api/rest-api` | ❌ No | **Missing Feature** |
| Cloud Storage Setup | `/tutorials/ingest/cloud/s3-setup` | ❌ No | **Missing Feature** |
| Webhook Configuration | `/tutorials/ingest/api/webhooks` | ❌ No | **Missing Feature** |
| File Management | `/guides/managing-files` | ❌ No | **Missing UI** |

---

## 4. Recommended Implementation Plan

### Phase 1: Simple File Upload (2-3 weeks)

#### 4.1.1 Backend: File Upload Endpoint
**New File**: `backend/api/files_routes.py`

```python
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/files", tags=["files"])

@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    source_name: Optional[str] = Form(None),
    folder_path: Optional[str] = Form("uploads"),
    auto_detect_schema: bool = Form(True),
    refresh_schedule: Optional[str] = Form(None),
):
    """
    Upload a file (CSV, JSON, Parquet, Excel) as a persistent data source.

    - Stores file in S3/Blob storage
    - Registers in Trino catalog
    - Returns queryable endpoint
    """
    file_id = str(uuid.uuid4())
    file_extension = file.filename.split('.')[-1].lower()

    # Supported formats
    if file_extension not in ['csv', 'json', 'parquet', 'xlsx', 'xls', 'avro']:
        raise HTTPException(400, f"Unsupported file type: {file_extension}")

    # Save to persistent storage (S3 or local for dev)
    storage_path = await save_to_storage(file, folder_path, file_id)

    # Auto-detect schema
    schema = await detect_schema(storage_path, file_extension)

    # Register in Trino catalog (Hive metastore or Iceberg)
    catalog_entry = await register_in_catalog(
        file_id=file_id,
        file_name=file.filename,
        storage_path=storage_path,
        schema=schema,
        source_name=source_name or file.filename.replace(f'.{file_extension}', ''),
    )

    # Save metadata to PostgreSQL
    file_metadata = FileSource(
        id=file_id,
        name=source_name or file.filename,
        file_path=storage_path,
        file_type=file_extension,
        schema=schema,
        row_count=await count_rows(storage_path, file_extension),
        file_size_mb=file.size / (1024 * 1024),
        uploaded_at=datetime.utcnow(),
        refresh_schedule=refresh_schedule,
        status="ready",
    )
    await file_metadata.save()

    return {
        "file_id": file_id,
        "file_name": file.filename,
        "source_name": file_metadata.name,
        "file_size_mb": file_metadata.file_size_mb,
        "row_count": file_metadata.row_count,
        "schema": schema,
        "query_endpoint": f"/api/query/files/{file_metadata.name}",
        "trino_table": f"files.{file_metadata.name}",
        "status": "ready",
    }

@router.get("/files")
async def list_files(
    folder_path: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
):
    """List all uploaded files with metadata."""
    # Query PostgreSQL for file sources
    # Return paginated results
    pass

@router.get("/files/{file_id}")
async def get_file(file_id: str):
    """Get file metadata and statistics."""
    pass

@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """Delete file from storage and catalog."""
    pass

@router.post("/files/{file_id}/refresh")
async def refresh_file(file_id: str, file: UploadFile = File(...)):
    """Update an existing file source with new data."""
    pass
```

#### 4.1.2 Frontend: File Upload UI
**New File**: `app/(main)/manage/sources/upload-file/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadFilePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Auto-populate source name from filename
      setSourceName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_name', sourceName);
    formData.append('auto_detect_schema', 'true');

    try {
      const response = await fetch('/api/files/upload-file', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      // Success - show result and option to query
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Upload File as Data Source</h1>
      <p className="text-muted-foreground mb-8">
        Upload CSV, JSON, Parquet, or Excel files to make them queryable
      </p>

      {!result ? (
        <Card className="p-8">
          {/* File drop zone */}
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center"
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) {
                setFile(e.dataTransfer.files[0]);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-2">Drag and drop your file here</p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
              Choose File
            </Button>
            <input
              id="file-input"
              type="file"
              accept=".csv,.json,.parquet,.xlsx,.xls,.avro"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileText className="w-8 h-8" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div>
                <Label>Source Name</Label>
                <Input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="my_data_source"
                />
              </div>

              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? 'Uploading...' : 'Upload & Make Queryable'}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <h2 className="text-2xl font-semibold">Upload Complete!</h2>
          </div>

          {/* Display result metadata */}
          <div className="space-y-4">
            <div>
              <Label>Trino Table</Label>
              <code className="block p-3 bg-muted rounded">
                {result.trino_table}
              </code>
            </div>

            <div>
              <Label>Query Endpoint</Label>
              <code className="block p-3 bg-muted rounded">
                {result.query_endpoint}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rows</Label>
                <p className="text-2xl font-semibold">{result.row_count.toLocaleString()}</p>
              </div>
              <div>
                <Label>Columns</Label>
                <p className="text-2xl font-semibold">{result.schema.fields.length}</p>
              </div>
            </div>

            <Button onClick={() => router.push(`/discover?source=${result.file_id}`)}>
              Explore Data
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
```

#### 4.1.3 Integration with Existing UI
**Modify**: `app/(main)/manage/connections/new/page.tsx`

Add "Upload File" quick action button:
```typescript
<div className="mb-8 flex items-center justify-between">
  <div>
    <h1>Add New Data Source</h1>
  </div>
  <div className="flex gap-3">
    <Button variant="outline" onClick={() => router.push('/manage/sources/upload-file')}>
      <Upload className="w-4 h-4 mr-2" />
      Upload File
    </Button>
  </div>
</div>
```

---

### Phase 2: API Connector Wizard (3-4 weeks)

#### 4.2.1 Backend: API Source Management
**New File**: `backend/api/api_sources_routes.py`

```python
from pydantic import BaseModel, HttpUrl
from enum import Enum

class AuthMethod(str, Enum):
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC_AUTH = "basic_auth"
    BEARER_TOKEN = "bearer_token"

class PaginationType(str, Enum):
    OFFSET = "offset"
    CURSOR = "cursor"
    PAGE_NUMBER = "page_number"
    LINK_HEADER = "link_header"

class APISourceConfig(BaseModel):
    name: str
    base_url: HttpUrl
    endpoint_path: str
    http_method: str = "GET"
    auth_method: AuthMethod
    auth_config: dict  # Varies by auth_method
    headers: dict = {}
    query_params: dict = {}
    pagination: Optional[PaginationType] = None
    pagination_config: Optional[dict] = None
    incremental_field: Optional[str] = None
    refresh_schedule: Optional[str] = None

@router.post("/api/api-sources")
async def create_api_source(config: APISourceConfig):
    """
    Create a new API source.

    - Tests connection
    - Fetches sample data
    - Auto-detects schema
    - Registers as queryable source
    """
    # Test API connection
    test_result = await test_api_connection(config)
    if not test_result.success:
        raise HTTPException(400, f"Connection failed: {test_result.error}")

    # Fetch sample data for schema detection
    sample_data = await fetch_sample_data(config, limit=100)
    schema = await detect_schema_from_json(sample_data)

    # Save API source configuration
    api_source = APISource(
        id=str(uuid.uuid4()),
        name=config.name,
        config=config.dict(),
        schema=schema,
        status="active",
        created_at=datetime.utcnow(),
    )
    await api_source.save()

    # Schedule refresh job
    if config.refresh_schedule:
        await schedule_api_refresh(api_source.id, config.refresh_schedule)

    return api_source
```

#### 4.2.2 Frontend: API Connector Wizard
**New File**: `app/(main)/manage/connections/new/api-connector/page.tsx`

```typescript
'use client';

import { useState } from 'react';

type Step = 'config' | 'auth' | 'schema' | 'refresh' | 'test';

export default function APIConnectorPage() {
  const [step, setStep] = useState<Step>('config');
  const [config, setConfig] = useState({
    name: '',
    baseUrl: '',
    endpointPath: '',
    authMethod: 'api_key',
    // ... more fields
  });

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1>Configure REST API Connector</h1>

      {/* Multi-step wizard */}
      {step === 'config' && (
        <APIConfigStep
          config={config}
          onChange={setConfig}
          onNext={() => setStep('auth')}
        />
      )}

      {step === 'auth' && (
        <AuthConfigStep
          authMethod={config.authMethod}
          onChange={(authConfig) => setConfig({...config, ...authConfig})}
          onNext={() => setStep('schema')}
        />
      )}

      {/* ... other steps */}
    </div>
  );
}
```

---

### Phase 3: Cloud Storage Connectors (2-3 weeks)

#### 4.3.1 S3 Connector
**New File**: `app/(main)/manage/connections/new/cloud-storage/s3/page.tsx`

```typescript
// S3-specific configuration:
// - Bucket name
// - Path/prefix
// - AWS credentials (IAM role or access keys)
// - File format (CSV, Parquet, JSON)
// - Auto-discovery of files
// - Refresh schedule
```

#### 4.3.2 GCS & Azure Blob Connectors
Similar patterns for Google Cloud Storage and Azure Blob Storage.

---

## 5. Migration & Compatibility Strategy

### 5.1 Backward Compatibility

**Preserve Existing Functionality**:
- ✅ Keep `/api/build/profile/upload` for contract design
- ✅ Maintain current connection wizards
- ✅ No breaking changes to existing APIs

**Add New Functionality**:
- ✅ New `/api/files/upload-file` endpoint
- ✅ New `/api/api-sources` endpoints
- ✅ New UI routes for simple workflows

### 5.2 User Migration Path

**For Existing Users**:
1. Announce new "Simple File Upload" feature
2. Provide tutorial: "Migrating from Profiling to Direct Upload"
3. Keep both workflows available with clear use case guidance:
   - **Simple Upload**: "I want to query a file immediately"
   - **Profiling Upload**: "I want to design a contract with quality rules"

### 5.3 Documentation Alignment

**Update Documentation**:
1. Create `/tutorials/ingest/file/upload-csv` tutorial matching new flow
2. Document `/api-reference/endpoints/files/upload-file` API
3. Add `/tutorials/ingest/api/rest-api` for API connector
4. Clarify when to use each ingestion method

---

## 6. Success Metrics

### 6.1 Feature Adoption

| Metric | Target | Measurement |
|--------|--------|-------------|
| File uploads per week | 100+ | Track `/api/files/upload-file` calls |
| API sources created | 20+ | Track API connector usage |
| Avg. time to first query | < 5 minutes | From upload to first query |
| User satisfaction | 4.5/5 | Survey after using file upload |

### 6.2 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| File upload success rate | > 95% | Monitor errors |
| API connection test success | > 90% | Track test endpoint |
| Schema auto-detection accuracy | > 85% | Manual review sample |
| Query performance (files) | < 3s | p95 latency |

---

## 7. Risks & Mitigation

### 7.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Storage costs (S3/Blob)** | Medium | High | Implement retention policies, compression |
| **Schema drift in files** | High | Medium | Version file schemas, detect changes |
| **API rate limiting** | Medium | High | Implement backoff, caching, scheduling |
| **Large file uploads** | Medium | Medium | Streaming uploads, chunking, size limits |

### 7.2 User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Confusion between upload types** | High | High | Clear UI labels, use case guidance |
| **Broken legacy workflows** | High | Low | Maintain backward compatibility |
| **Complex API setup** | Medium | Medium | Provide templates, pre-built connectors |

---

## 8. Conclusion & Recommendations

### 8.1 Summary

The current NexusOne implementation has **sophisticated enterprise-grade data ingestion capabilities** for databases and CDC pipelines, but **lacks the simple, accessible file and API ingestion flows** expected from the legacy backend documentation.

**Core Issues**:
1. ❌ No simple "upload file and query it" workflow
2. ❌ File upload only available in contract design context
3. ❌ API/SaaS connectors listed but not implemented
4. ❌ Cloud storage connectors not implemented
5. ⚠️ Documentation describes simpler flows than what exists

### 8.2 Recommendations (Prioritized)

#### Immediate (Next Sprint)
1. ✅ **Implement `/api/files/upload-file` endpoint** - 3 days
2. ✅ **Create simple file upload UI** - 2 days
3. ✅ **Add "Upload File" button to connections page** - 1 day
4. ✅ **Document file upload API and tutorial** - 2 days

#### Short-Term (Next Month)
5. ✅ **Build API connector wizard** (5-step flow) - 2 weeks
6. ✅ **Implement S3 connector** - 1 week
7. ✅ **Add file management UI** (list, refresh, delete) - 1 week

#### Medium-Term (Next Quarter)
8. ✅ **GCS and Azure Blob connectors** - 2 weeks
9. ✅ **OAuth 2.0 flow for SaaS apps** - 2 weeks
10. ✅ **Webhook ingestion endpoints** - 1 week
11. ✅ **File refresh scheduling** - 1 week

### 8.3 Alignment Strategy

**Dual-Track Approach**:
- **Track 1**: Maintain and enhance enterprise CDC/federated query capabilities
- **Track 2**: Build simple, accessible file/API ingestion for broader adoption

**Target User Experience**:
- **Data Engineers**: Continue using advanced CDC pipelines and Trino federation
- **Analysts & Business Users**: Use new simple file upload and API connectors
- **Hybrid Users**: Choose the right tool for each use case

### 8.4 Next Steps

1. **Review this analysis** with product and engineering teams
2. **Prioritize features** based on user feedback and analytics
3. **Create detailed implementation tickets** for Phase 1
4. **Update documentation** to reflect both workflows
5. **Communicate changes** to users with clear use case guidance

---

**Document Owner**: Engineering Team
**Last Updated**: 2025-10-20
**Status**: Ready for Review
**Related Documents**:
- `/docs/PRODUCT_DEFINITION.md`
- `/docs/ARCHITECTURE.md`
- `/docs/06-feature-implementations/connections-sources/`
