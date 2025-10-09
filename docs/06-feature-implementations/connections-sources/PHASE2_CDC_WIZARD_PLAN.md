# Phase 2: CDC Pipeline Wizard - Implementation Plan

**Duration**: Weeks 4-7 (4 weeks)
**Goal**: End-to-end CDC pipeline creation (Debezium + Kafka + Iceberg)
**Status**: Planning → Implementation
**Depends On**: Phase 1 (Source Management) ✅ Complete

---

## 🎯 Phase 2 Objectives

Build automated CDC pipeline wizard that:
1. Deploys Debezium connectors for PostgreSQL/MySQL sources
2. Creates Kafka topics with proper configuration
3. Initializes Iceberg tables from source schemas
4. Provides real-time deployment progress tracking
5. Integrates with DataHub for metadata management
6. Sets up monitoring dashboards automatically

**User Value**: One-click CDC pipeline deployment instead of manual 2-3 day setup

---

## 📋 Week 4: CDC Backend Infrastructure (Days 1-5)

### Day 1-2: Kafka Service Integration

**Goal**: API wrapper for Kafka Admin operations

**Files to Create**:
- `backend/services/kafka_service.py`
- `backend/models/kafka.py`

**Implementation**:

```python
# backend/services/kafka_service.py

from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import KafkaError
from typing import List, Dict
import logging

class KafkaService:
    """
    Kafka topic management and admin operations
    """

    def __init__(self, bootstrap_servers: str):
        self.admin_client = KafkaAdminClient(
            bootstrap_servers=bootstrap_servers.split(','),
            client_id='nexusone-admin'
        )
        self.logger = logging.getLogger(__name__)

    async def create_topics_for_tables(
        self,
        prefix: str,
        tables: List[Dict],
        partitions: int = 6,
        replication_factor: int = 3
    ) -> List[str]:
        """
        Create Kafka topics for CDC tables

        Args:
            prefix: Topic prefix (e.g., 'prod.orders_db')
            tables: List of table metadata dicts
            partitions: Number of partitions per topic
            replication_factor: Replication factor

        Returns:
            List of created topic names
        """
        topics_to_create = []

        for table in tables:
            topic_name = f"{prefix}.{table['schema']}.{table['table']}"
            topic = NewTopic(
                name=topic_name,
                num_partitions=partitions,
                replication_factor=replication_factor,
                topic_configs={
                    'compression.type': 'snappy',
                    'retention.ms': '604800000',  # 7 days
                    'cleanup.policy': 'delete'
                }
            )
            topics_to_create.append(topic)

        # Create topics
        result = self.admin_client.create_topics(
            new_topics=topics_to_create,
            validate_only=False
        )

        created_topics = []
        for topic_name, future in result.items():
            try:
                future.result()  # Wait for creation
                created_topics.append(topic_name)
                self.logger.info(f"Created topic: {topic_name}")
            except KafkaError as e:
                self.logger.error(f"Failed to create topic {topic_name}: {e}")
                raise

        return created_topics

    async def verify_topic_exists(self, topic_name: str) -> bool:
        """Check if topic exists"""
        metadata = self.admin_client.list_topics()
        return topic_name in metadata

    async def get_topic_config(self, topic_name: str) -> Dict:
        """Get topic configuration"""
        configs = self.admin_client.describe_configs(
            config_resources=[('TOPIC', topic_name)]
        )
        return configs[0].resources[0][4]  # Config dict
```

**Success Criteria**:
- ✅ Create topics with proper partitions/replication
- ✅ Configure retention and compression
- ✅ Verify topic creation
- ✅ Handle errors gracefully

---

### Day 2-3: Debezium Connector Service

**Goal**: Deploy and manage Debezium connectors via Kafka Connect API

**Files to Create**:
- `backend/services/debezium_service.py`
- `backend/models/debezium.py`

**Implementation**:

```python
# backend/services/debezium_service.py

import httpx
from typing import Dict, Optional
import logging

class DebeziumService:
    """
    Debezium connector management via Kafka Connect REST API
    """

    def __init__(self, connect_url: str = "http://kafka-connect:8083"):
        self.connect_url = connect_url
        self.client = httpx.AsyncClient(base_url=connect_url)
        self.logger = logging.getLogger(__name__)

    async def create_postgres_connector(
        self,
        name: str,
        host: str,
        port: int,
        database: str,
        username: str,
        password_secret: str,
        server_name: str,
        tables: List[str],
        snapshot_mode: str = "initial"
    ) -> Dict:
        """
        Create PostgreSQL CDC connector

        Args:
            name: Connector name
            host: PostgreSQL host
            port: PostgreSQL port
            database: Database name
            username: DB username
            password_secret: Secret reference
            server_name: Logical server name for topics
            tables: List of tables (schema.table format)
            snapshot_mode: initial, schema_only, never

        Returns:
            Connector configuration
        """
        config = {
            "name": name,
            "config": {
                "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
                "tasks.max": "1",
                "database.hostname": host,
                "database.port": str(port),
                "database.user": username,
                "database.password": password_secret,
                "database.dbname": database,
                "database.server.name": server_name,
                "table.include.list": ",".join(tables),
                "plugin.name": "pgoutput",
                "slot.name": f"debezium_{name}",
                "publication.name": f"debezium_pub_{name}",
                "snapshot.mode": snapshot_mode,
                "decimal.handling.mode": "precise",
                "time.precision.mode": "adaptive",
                "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
                "schema.history.internal.kafka.topic": f"{server_name}.schema_history"
            }
        }

        response = await self.client.post("/connectors", json=config)
        response.raise_for_status()

        self.logger.info(f"Created Debezium connector: {name}")
        return response.json()

    async def get_connector_status(self, name: str) -> Dict:
        """Get connector status"""
        response = await self.client.get(f"/connectors/{name}/status")
        response.raise_for_status()
        return response.json()

    async def monitor_snapshot_progress(self, name: str) -> Dict:
        """
        Monitor initial snapshot progress
        Returns: Dict with progress percentage and status
        """
        status = await self.get_connector_status(name)

        # Parse connector metrics for snapshot progress
        connector_state = status['connector']['state']
        task_state = status['tasks'][0]['state'] if status['tasks'] else 'UNKNOWN'

        return {
            "connector_state": connector_state,
            "task_state": task_state,
            "snapshot_completed": connector_state == 'RUNNING' and task_state == 'RUNNING'
        }
```

**Success Criteria**:
- ✅ Create PostgreSQL connectors
- ✅ Monitor connector status
- ✅ Track snapshot progress
- ✅ Handle connector failures

---

### Day 3-4: Iceberg Service Integration

**Goal**: Create Iceberg tables from source schemas

**Files to Create**:
- `backend/services/iceberg_service.py`
- `backend/models/iceberg.py`

**Implementation**:

```python
# backend/services/iceberg_service.py

from pyiceberg.catalog import load_catalog
from pyiceberg.schema import Schema
from pyiceberg.types import *
from typing import Dict, List
import logging

class IcebergService:
    """
    Iceberg table management
    """

    def __init__(self, catalog_config: Dict):
        self.catalog = load_catalog(**catalog_config)
        self.logger = logging.getLogger(__name__)

    async def create_table_from_source_schema(
        self,
        namespace: str,
        table_name: str,
        source_columns: List[Dict],
        partition_spec: Optional[List[str]] = None
    ) -> str:
        """
        Create Iceberg table from source schema

        Args:
            namespace: Iceberg namespace (schema)
            table_name: Table name
            source_columns: List of column metadata
            partition_spec: Optional partition columns

        Returns:
            Table identifier
        """
        # Convert source columns to Iceberg schema
        fields = []
        for col in source_columns:
            iceberg_type = self._map_type_to_iceberg(col['data_type'])
            fields.append(
                NestedField(
                    field_id=col['ordinal_position'],
                    name=col['column_name'],
                    field_type=iceberg_type,
                    required=col['is_nullable'] == 'NO'
                )
            )

        schema = Schema(*fields)

        # Create table
        table_id = f"{namespace}.{table_name}"

        if partition_spec:
            partition_spec_obj = self._create_partition_spec(partition_spec)
            table = self.catalog.create_table(
                identifier=table_id,
                schema=schema,
                partition_spec=partition_spec_obj
            )
        else:
            table = self.catalog.create_table(
                identifier=table_id,
                schema=schema
            )

        self.logger.info(f"Created Iceberg table: {table_id}")
        return table_id

    def _map_type_to_iceberg(self, pg_type: str) -> IcebergType:
        """Map PostgreSQL types to Iceberg types"""
        type_mapping = {
            'integer': IntegerType(),
            'bigint': LongType(),
            'smallint': IntegerType(),
            'numeric': DecimalType(38, 18),
            'decimal': DecimalType(38, 18),
            'real': FloatType(),
            'double precision': DoubleType(),
            'character varying': StringType(),
            'varchar': StringType(),
            'text': StringType(),
            'boolean': BooleanType(),
            'date': DateType(),
            'timestamp': TimestampType(),
            'timestamp with time zone': TimestamptzType(),
            'uuid': UUIDType(),
            'bytea': BinaryType()
        }

        return type_mapping.get(pg_type.lower(), StringType())
```

**Success Criteria**:
- ✅ Create Iceberg tables from source schemas
- ✅ Map PostgreSQL types to Iceberg types
- ✅ Support partitioning strategies
- ✅ Handle schema validation

---

### Day 4-5: CDC Deployment Orchestrator

**Goal**: Orchestrate multi-phase CDC deployment

**Files to Create**:
- `backend/services/cdc_deployment_service.py`
- `backend/api/cdc_routes.py`

**Implementation**: (See plan above for full orchestrator)

**API Endpoints**:
```python
POST /api/v1/sources/{source_id}/cdc/deploy
GET  /api/v1/sources/{source_id}/cdc/deployment/{deployment_id}
POST /api/v1/sources/{source_id}/cdc/validate
GET  /api/v1/sources/{source_id}/cdc/tables (discover source tables)
```

**Success Criteria**:
- ✅ 6-phase deployment workflow
- ✅ Real-time progress tracking
- ✅ Error handling and rollback
- ✅ Artifact tracking (topics, connectors, tables)

---

## 📋 Week 5: CDC Wizard Frontend (Days 6-10)

### Day 6-7: CDC Wizard UI Structure

**Goal**: Multi-step wizard for CDC configuration

**Files to Create**:
- `app/(main)/manage/sources/[sourceId]/cdc/page.tsx`
- `components/sources/CDCWizard.tsx`
- `components/sources/cdc-steps/*.tsx`

**Wizard Steps**:
1. **Source Connection** - Test connectivity
2. **Table Selection** - Browse and select tables
3. **Configuration** - Kafka/Iceberg settings
4. **Review** - Show deployment plan
5. **Deploy** - Real-time progress tracking

**Success Criteria**:
- ✅ 5-step wizard navigation
- ✅ Form validation at each step
- ✅ State persistence across steps
- ✅ Back/Next navigation

---

### Day 7-8: Table Discovery & Selection UI

**Goal**: Browse source tables and select for CDC

**Component**:
```typescript
// components/sources/cdc-steps/TableSelection.tsx

interface TableSelectionProps {
  sourceId: string;
  onTablesSelected: (tables: SelectedTable[]) => void;
}

export function TableSelection({ sourceId, onTablesSelected }: TableSelectionProps) {
  const [tables, setTables] = useState<SourceTable[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Fetch available tables
  useEffect(() => {
    fetch(`/api/v1/sources/${sourceId}/cdc/tables`)
      .then(res => res.json())
      .then(setTables);
  }, [sourceId]);

  return (
    <div>
      {/* Table browser with:
          - Search/filter
          - Row count estimates
          - Size estimates
          - Multi-select checkboxes
          - Estimated Kafka throughput
      */}
    </div>
  );
}
```

**Success Criteria**:
- ✅ Display all source tables
- ✅ Show row counts and sizes
- ✅ Multi-select with estimates
- ✅ Search and filter

---

### Day 8-9: Configuration UI

**Goal**: Configure Kafka, Debezium, and Iceberg settings

**Component**:
```typescript
// components/sources/cdc-steps/Configuration.tsx

interface ConfigurationProps {
  sourceType: string;
  selectedTables: SelectedTable[];
  onConfigUpdate: (config: CDCConfig) => void;
}

export function Configuration({ sourceType, selectedTables, onConfigUpdate }: ConfigurationProps) {
  return (
    <Tabs defaultValue="kafka">
      <TabsList>
        <TabsTrigger value="kafka">Kafka</TabsTrigger>
        <TabsTrigger value="debezium">Debezium</TabsTrigger>
        <TabsTrigger value="iceberg">Iceberg</TabsTrigger>
      </TabsList>

      <TabsContent value="kafka">
        {/* Kafka configuration:
            - Topic prefix
            - Partitions per topic
            - Replication factor
            - Retention period
            - Compression type
        */}
      </TabsContent>

      <TabsContent value="debezium">
        {/* Debezium configuration:
            - Snapshot mode
            - Slot name
            - Publication name
            - Decimal handling
            - Time precision
        */}
      </TabsContent>

      <TabsContent value="iceberg">
        {/* Iceberg configuration:
            - Catalog selection
            - Namespace/schema
            - Partition strategy
            - File format
            - Compression
        */}
      </TabsContent>
    </Tabs>
  );
}
```

**Success Criteria**:
- ✅ Tabbed configuration interface
- ✅ Intelligent defaults from CrewAI
- ✅ Validation on all fields
- ✅ Help text and recommendations

---

### Day 9-10: Deployment Progress UI

**Goal**: Real-time deployment tracking

**Component**:
```typescript
// components/sources/cdc-steps/DeploymentProgress.tsx

interface DeploymentProgressProps {
  deploymentId: string;
}

const DEPLOYMENT_PHASES = [
  { id: 'create_kafka_topics', label: 'Creating Kafka Topics', duration: '1-2 min' },
  { id: 'deploy_debezium', label: 'Deploying Debezium Connector', duration: '30 sec' },
  { id: 'initial_snapshot', label: 'Initial Snapshot', duration: '5-30 min' },
  { id: 'create_iceberg_tables', label: 'Creating Iceberg Tables', duration: '2-5 min' },
  { id: 'register_datahub', label: 'Registering in DataHub', duration: '30 sec' },
  { id: 'setup_monitoring', label: 'Setting up Monitoring', duration: '1 min' }
];

export function DeploymentProgress({ deploymentId }: DeploymentProgressProps) {
  const [deployment, setDeployment] = useState<Deployment | null>(null);

  // Poll deployment status every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/v1/sources/deployments/${deploymentId}`)
        .then(res => res.json())
        .then(setDeployment);
    }, 3000);

    return () => clearInterval(interval);
  }, [deploymentId]);

  return (
    <div>
      {/* Phase-by-phase progress with:
          - Visual stepper
          - Current phase highlight
          - Estimated time remaining
          - Log stream
          - Success/error indicators
      */}
    </div>
  );
}
```

**Success Criteria**:
- ✅ Real-time phase tracking
- ✅ Progress indicators
- ✅ Log streaming
- ✅ Error display with retry options

---

## 📋 Week 6: Integration & Testing (Days 11-15)

### Day 11-12: End-to-End Integration

**Tasks**:
1. Integrate CDC wizard with source detail page
2. Add "Deploy CDC" button for eligible sources
3. Wire up all API endpoints
4. Test complete flow (source → wizard → deployment → monitoring)

**Success Criteria**:
- ✅ Full wizard flow works
- ✅ Deployment completes successfully
- ✅ Tables appear in Iceberg
- ✅ Data flowing through Kafka

---

### Day 12-13: Error Handling & Validation

**Tasks**:
1. Add comprehensive error handling at each phase
2. Implement rollback on failure
3. Add validation warnings for common issues
4. CrewAI recommendations for optimization

**Success Criteria**:
- ✅ Graceful error handling
- ✅ Clear error messages
- ✅ Rollback functionality
- ✅ Validation warnings

---

### Day 13-15: Testing & Documentation

**Tasks**:
1. Unit tests for services
2. Integration tests for deployment flow
3. E2E tests for wizard
4. Update documentation

**Success Criteria**:
- ✅ 80%+ test coverage
- ✅ All critical paths tested
- ✅ Documentation updated

---

## 📋 Week 7: Monitoring & Polish (Days 16-20)

### Day 16-17: Monitoring Integration

**Tasks**:
1. Create Datadog/Prometheus dashboards
2. Set up alerts for connector failures
3. Track replication lag metrics
4. Monitor Kafka consumer lag

**Success Criteria**:
- ✅ Dashboards auto-created
- ✅ Alerts configured
- ✅ Metrics flowing

---

### Day 17-20: Polish & Optimization

**Tasks**:
1. Performance optimization
2. UX improvements
3. CrewAI tuning
4. Production readiness review

**Success Criteria**:
- ✅ Fast wizard navigation
- ✅ Smooth deployment
- ✅ Professional UX

---

## 🎯 Phase 2 Success Metrics

### Functionality
- ✅ Deploy CDC pipeline in <5 minutes (vs 2-3 days manual)
- ✅ Support PostgreSQL and MySQL sources
- ✅ Handle 10+ tables per deployment
- ✅ 95%+ deployment success rate

### Performance
- ✅ Deployment orchestration completes in <30 minutes
- ✅ Real-time progress updates (<3s latency)
- ✅ Support concurrent deployments

### User Experience
- ✅ Intuitive 5-step wizard
- ✅ Clear error messages
- ✅ AI-powered recommendations
- ✅ Real-time feedback

---

## 📦 Deliverables

### Backend (Week 4-5)
- `backend/services/kafka_service.py` - Kafka admin operations
- `backend/services/debezium_service.py` - Debezium connector management
- `backend/services/iceberg_service.py` - Iceberg table creation
- `backend/services/cdc_deployment_service.py` - Orchestration
- `backend/api/cdc_routes.py` - API endpoints

### Frontend (Week 5-6)
- `app/(main)/manage/sources/[sourceId]/cdc/page.tsx` - CDC wizard page
- `components/sources/CDCWizard.tsx` - Wizard component
- `components/sources/cdc-steps/*.tsx` - Step components

### Testing (Week 6)
- Unit tests for all services
- Integration tests for deployment flow
- E2E tests for wizard

### Documentation (Week 7)
- CDC Wizard User Guide
- Deployment troubleshooting guide
- API documentation

---

## 🚀 Ready to Begin Phase 2!

**Next Step**: Start Week 4 Day 1 - Kafka Service Implementation

**Estimated Completion**: 4 weeks from start
**Dependencies**: Phase 1 ✅ Complete
