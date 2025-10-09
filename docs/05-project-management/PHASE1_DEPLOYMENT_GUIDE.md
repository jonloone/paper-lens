# Phase 1 Source Management - Deployment Guide

**Purpose**: Step-by-step guide to deploy Phase 1 Source Management to production
**Prerequisites**: PostgreSQL 14+, Python 3.10+, Node.js 18+
**Estimated Time**: 30 minutes

---

## 🎯 Deployment Overview

This guide will help you:
1. Set up PostgreSQL database
2. Apply database migrations
3. Configure environment variables
4. Start backend API server
5. Start frontend Next.js server
6. Add sample data for testing
7. Verify end-to-end functionality

---

## 📋 Prerequisites Checklist

### System Requirements
- [ ] PostgreSQL 14+ installed and running
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Git repository cloned

### Python Packages Required
```bash
pip3 install fastapi uvicorn asyncpg pydantic email-validator crewai
```

### Node Packages Required
```bash
npm install
```

---

## 🗄️ Step 1: Database Setup

### 1.1 Create Database

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE nexusone;
CREATE USER nexusone_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nexusone TO nexusone_user;

# Exit psql
\q
```

### 1.2 Apply Migrations

```bash
# Connect to nexusone database
psql -U nexusone_user -d nexusone

# Run migration script
\i backend/migrations/001_create_sources_schema.sql

# Verify tables created
\dt

# Expected output:
#  sources
#  source_connections
#  source_deployments
#  source_metrics
#  source_tables
#  source_configurations

# Exit psql
\q
```

### 1.3 Verify Schema

```bash
# Check table counts
psql -U nexusone_user -d nexusone -c "SELECT count(*) FROM sources;"

# Should return 0 (no data yet)
```

---

## ⚙️ Step 2: Environment Configuration

### 2.1 Create Environment File

```bash
# Create .env file in project root
cat > .env.local << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://nexusone_user:your_secure_password@localhost:5432/nexusone

# Backend API Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# CrewAI Configuration (optional)
OPENAI_API_KEY=your_openai_key_here
EOF
```

### 2.2 Set Permissions

```bash
chmod 600 .env.local
```

---

## 🚀 Step 3: Start Backend Server

### 3.1 Install Python Dependencies

```bash
cd /mnt/blockstorage/paper-lens

# Install required packages
pip3 install -r backend/requirements.txt

# Or install individually
pip3 install fastapi uvicorn asyncpg pydantic email-validator crewai
```

### 3.2 Start Backend

```bash
# Start backend server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete.
```

### 3.3 Verify Backend

Open another terminal and test:

```bash
# Test health endpoint
curl http://localhost:8000/

# Should return JSON with API info

# Test sources endpoint
curl http://localhost:8000/api/v1/sources/summary

# Should return overview with zero sources
```

---

## 🎨 Step 4: Start Frontend Server

### 4.1 Install Node Dependencies

```bash
# In project root
npm install
```

### 4.2 Start Frontend

```bash
# Start Next.js dev server
npm run dev -- -H 0.0.0.0 -p 3000

# Expected output:
# ▲ Next.js 14.x
# - Local:        http://localhost:3000
# - Network:      http://0.0.0.0:3000
```

### 4.3 Verify Frontend

Open browser:
```
http://localhost:3000/manage/sources
```

You should see:
- Empty state with "No sources found"
- "Connect New Source" button
- Overview cards showing 0 sources

---

## 📝 Step 5: Add Sample Data

### 5.1 Create Sample PostgreSQL Source (Federated)

```bash
# Create sample source via API
curl -X POST http://localhost:8000/api/v1/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample PostgreSQL Analytics",
    "description": "Sample federated PostgreSQL source for testing",
    "type": "postgresql",
    "connection_mode": "federated",
    "domain": "analytics",
    "owner_email": "data-eng@company.com",
    "team": "Data Engineering",
    "tags": ["sample", "test"],
    "connection_details": {
      "host": "postgres.example.com",
      "port": 5432,
      "database_name": "analytics",
      "schema_name": "public",
      "username": "readonly",
      "ssl_enabled": true,
      "password_secret": {
        "type": "environment",
        "reference": "POSTGRES_PASSWORD"
      }
    },
    "federated_config": {
      "trino_catalog_name": "analytics_postgres",
      "connection_pool_size": 10,
      "connection_pool_min_size": 2,
      "connection_pool_max_size": 20,
      "query_timeout_seconds": 60
    }
  }'
```

### 5.2 Update Source Status to Active

```bash
# Get the source_id from the response above, then:
curl -X PUT http://localhost:8000/api/v1/sources/{source_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### 5.3 Add Sample Tables

```sql
-- Connect to nexusone database
psql -U nexusone_user -d nexusone

-- Get the source_id first
SELECT id, name FROM sources;

-- Add sample tables (replace {source_id} with actual UUID)
INSERT INTO source_tables (
  source_id,
  table_schema,
  table_name,
  row_count,
  size_mb,
  column_count,
  primary_key_columns
) VALUES
  ('{source_id}', 'public', 'customers', 1000000, 250.5, 15, ARRAY['customer_id']),
  ('{source_id}', 'public', 'orders', 5000000, 1200.8, 20, ARRAY['order_id']),
  ('{source_id}', 'public', 'order_items', 15000000, 3500.2, 12, ARRAY['order_item_id']);

-- Verify
SELECT table_schema, table_name, row_count FROM source_tables;
```

### 5.4 Add Sample Metrics

```sql
-- Add sample metrics (replace {source_id} with actual UUID)
INSERT INTO source_metrics (
  source_id,
  query_count_30d,
  avg_query_latency_ms,
  storage_gb,
  row_count
) VALUES
  ('{source_id}', 5420, 120, 500.5, 16000000);

-- Verify
SELECT * FROM source_metrics;
```

### 5.5 Update Health Score

```sql
-- Update source with health score
UPDATE sources
SET health_score = 95,
    last_health_check = NOW()
WHERE id = '{source_id}';
```

---

## ✅ Step 6: Verification

### 6.1 Verify Backend API

```bash
# List sources
curl http://localhost:8000/api/v1/sources

# Should return array with 1 source

# Get overview
curl http://localhost:8000/api/v1/sources/summary

# Should return:
# {
#   "total": 1,
#   "by_status": {"active": 1},
#   "by_mode": {"federated": 1},
#   "by_domain": {"analytics": 1},
#   "issues_count": 0,
#   "recent_deployments": []
# }

# Get source detail
curl http://localhost:8000/api/v1/sources/{source_id}

# Should return full source details with tables
```

### 6.2 Verify Frontend

Visit in browser:
```
http://localhost:3000/manage/sources
```

You should see:
- ✅ Overview cards: 1 Total, 1 Active, 0 Issues
- ✅ Source list with "Sample PostgreSQL Analytics"
- ✅ Health score: 95
- ✅ 3 tables listed
- ✅ Filters working (status, mode, domain)
- ✅ Search working

Click on source:
```
http://localhost:3000/manage/sources/{source_id}
```

You should see:
- ✅ Health status card (healthy, score 95)
- ✅ 5 tabs (Overview, Tables, Configuration, Deployments, Metrics)
- ✅ Overview tab: owner, domain, connection details
- ✅ Tables tab: 3 tables (customers, orders, order_items)
- ✅ Configuration tab: JSON config
- ✅ Deployments tab: empty (no deployments yet)
- ✅ Metrics tab: query count, storage

---

## 🔧 Step 7: Test Additional Features

### 7.1 Test Validation

```bash
# Test connection validation
curl -X POST http://localhost:8000/api/v1/sources/validate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Duplicate",
    "type": "postgresql",
    "connection_mode": "federated",
    "domain": "test",
    "owner_email": "test@example.com",
    "connection_details": {
      "host": "localhost",
      "port": 5432,
      "username": "test",
      "ssl_enabled": true
    },
    "federated_config": {
      "trino_catalog_name": "test_catalog"
    }
  }'

# Should return validation result with checks
```

### 7.2 Test Cost Estimation

```bash
# Test cost estimation
curl -X POST http://localhost:8000/api/v1/sources/cost-estimate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test CDC",
    "type": "postgresql",
    "connection_mode": "cdc",
    "domain": "test",
    "owner_email": "test@example.com",
    "connection_details": {
      "host": "localhost",
      "port": 5432,
      "username": "test",
      "ssl_enabled": true
    },
    "cdc_config": {
      "debezium_connector_name": "test-cdc",
      "snapshot_mode": "initial",
      "kafka_topic_prefix": "test",
      "kafka_partitions": 12,
      "kafka_replication_factor": 3,
      "iceberg_catalog": "prod",
      "iceberg_schema": "test",
      "iceberg_file_format": "parquet",
      "iceberg_compression": "snappy"
    }
  }'

# Should return cost estimate ~$1000/month for CDC
```

### 7.3 Test CrewAI Recommendations

```bash
# Test recommendations
curl -X POST http://localhost:8000/api/v1/sources/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Federated",
    "type": "postgresql",
    "connection_mode": "federated",
    "domain": "test",
    "owner_email": "test@example.com",
    "connection_details": {
      "host": "localhost",
      "port": 5432,
      "username": "test",
      "ssl_enabled": false
    },
    "federated_config": {
      "trino_catalog_name": "test",
      "connection_pool_size": 3
    }
  }'

# Should return array of recommendations including:
# - SSL recommendation (currently disabled)
# - Pool size recommendation (too small)
# - Security recommendations
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error**: `ModuleNotFoundError: No module named 'backend'`
```bash
# Make sure you're in the project root
cd /mnt/blockstorage/paper-lens

# Try with python module syntax
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

**Error**: `asyncpg.exceptions.InvalidCatalogNameError`
```bash
# Database doesn't exist
createdb -U postgres nexusone
```

**Error**: `asyncpg.exceptions.InvalidAuthorizationSpecificationError`
```bash
# Check DATABASE_URL in .env.local
# Make sure password is correct
```

### Frontend Shows Connection Error

**Error**: Frontend can't connect to backend
```bash
# Check backend is running
curl http://localhost:8000/

# Check NEXT_PUBLIC_API_URL in .env.local
# Should be: http://localhost:8000

# Restart frontend
npm run dev -- -H 0.0.0.0 -p 3000
```

### No Data Showing

**Issue**: Frontend shows empty state
```bash
# Check database has data
psql -U nexusone_user -d nexusone -c "SELECT count(*) FROM sources;"

# If 0, add sample data (see Step 5)

# Check API returns data
curl http://localhost:8000/api/v1/sources

# Check browser console for errors (F12)
```

### CrewAI Errors

**Error**: `openai.error.AuthenticationError`
```bash
# Set OPENAI_API_KEY in .env.local
# Or CrewAI will use fallback recommendations

# CrewAI is optional - system works without it
# Recommendations will use intelligent fallback logic
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change default database password
- [ ] Use environment variables for secrets (not .env.local in git)
- [ ] Enable SSL for database connections
- [ ] Configure firewall rules (only allow necessary ports)
- [ ] Set up secret management (Vault, AWS Secrets Manager, K8s)
- [ ] Enable HTTPS for frontend (nginx/Caddy reverse proxy)
- [ ] Configure CORS properly in backend
- [ ] Set up authentication (Keycloak, Auth0, etc.)
- [ ] Enable database backups
- [ ] Set up monitoring (Prometheus, Datadog)

---

## 📊 Health Check Endpoints

Once deployed, monitor these endpoints:

```bash
# Backend health
curl http://localhost:8000/

# Sources overview
curl http://localhost:8000/api/v1/sources/summary

# Frontend health
curl http://localhost:3000/

# Database health
psql -U nexusone_user -d nexusone -c "SELECT count(*) FROM sources;"
```

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Backend responds on http://localhost:8000
- ✅ Frontend loads on http://localhost:3000
- ✅ Sources landing page shows overview cards
- ✅ Can create new source via API
- ✅ Source detail page shows tabs and health
- ✅ Filters and search work on landing page
- ✅ No console errors in browser
- ✅ Database queries return expected data

---

## 📞 Support

If you encounter issues:

1. Check logs:
   - Backend: Terminal running uvicorn
   - Frontend: Terminal running npm
   - Browser: Console (F12)
   - Database: PostgreSQL logs

2. Review documentation:
   - PHASE1_COMPLETE_SUMMARY.md
   - PHASE1_SOURCES_MANAGEMENT_COMPLETE.md

3. Run validation tests:
   ```bash
   python3 backend/test_sources_api.py
   ```

---

## 🚀 Next Steps After Deployment

1. **Add More Sample Data**
   - Create sources for all 4 connection modes
   - Add deployment records
   - Add time-series metrics

2. **Configure Monitoring**
   - Set up health check cron jobs
   - Configure alerting for failed sources
   - Set up performance monitoring

3. **Begin Phase 2**
   - CDC Pipeline Wizard (Weeks 4-7)
   - Automated Debezium deployment
   - Kafka topic creation

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: 2025-10-03
**Status**: Production Ready ✅
