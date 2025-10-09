# How to Test the Build Flow

**Complete Guide to Testing the 6-Step Data Product Creation Workflow**

---

## Quick Start

### 1. Start the Development Server

The server is already running at:
```
http://0.0.0.0:3000
```

### 2. Navigate to Build Page

Visit: **http://0.0.0.0:3000/build/new**

You should see the 6-step stepper interface with Step 1 active.

---

## Step-by-Step Testing Guide

### **Step 1: Define Product**

**What to Test:**
1. Enter product name (lowercase with underscores)
   - Try: `customer_churn_risk`
   - Try invalid: `Customer-Churn` (should show error)

2. Fill in metadata:
   - Display Name: `Customer Churn Risk`
   - Description: `Predictive model for identifying at-risk customers`
   - Owner: `data-team`
   - Domain: `analytics`
   - Tags: Add `ml`, `customer`, `churn`

3. Configure schedule:
   - Select `Daily`
   - Time: `02:00`

4. Set SLA:
   - Freshness: `24` hours
   - Quality: `95` %
   - Availability: `99.9` %

5. Click **Continue to Sources** →

**Expected Behavior:**
- ✅ Name validation in real-time
- ✅ Error messages for invalid formats
- ✅ Continue button disabled until valid
- ✅ Progresses to Step 2

---

### **Step 2: Select Sources**

**What to Test:**
1. Browse available sources (left column)
   - See 3 mock tables:
     - `analytics.customer_360` (2.5M rows)
     - `support.support_tickets` (450K rows)
     - `sales.order_history` (12M rows)

2. Search functionality:
   - Type `customer` in search
   - Should filter to `customer_360`

3. Preview schema:
   - Click **Preview** (eye icon) on any table
   - Modal shows columns, types, descriptions

4. Select sources:
   - Click **+ Add** on `customer_360`
   - Click **+ Add** on `order_history`
   - Should appear in right column (Selected Sources)

5. View estimation:
   - Should show total rows (~14.5M)
   - Estimated output size

6. Click **Continue to Transform** →

**Expected Behavior:**
- ✅ Search filters immediately
- ✅ Schema preview modal opens
- ✅ Sources move to selected column
- ✅ Estimation updates in real-time
- ✅ Continue button enabled when ≥1 source selected

---

### **Step 3: Write SQL**

**What to Test:**
1. Try SQL templates:
   - Click **📊 Aggregation** button
   - SQL should populate editor
   - Syntax highlighting active

2. Real-time validation:
   - Edit SQL (add SELECT and FROM)
   - Wait 1 second
   - Should show "Validating syntax..."
   - Should show ✓ "Syntax validated successfully"

3. Try invalid SQL:
   - Delete `FROM` clause
   - Should show error after 1 second

4. Sample data preview:
   - Write valid SQL:
     ```sql
     SELECT
       customer_id,
       COUNT(*) as order_count,
       SUM(total) as revenue
     FROM {{ ref('orders') }}
     GROUP BY 1
     ```
   - Click **Test on Sample Data**
   - Should show loading state
   - Should display results table
   - Should show execution metrics (rows, time)

5. Click **Continue to Quality Rules** →

**Expected Behavior:**
- ✅ CodeMirror editor with syntax highlighting
- ✅ Debounced validation (1 second delay)
- ✅ Error messages with details
- ✅ Preview shows mock data table
- ✅ Continue disabled until valid SQL

---

### **Step 4: Quality Rules**

**What to Test:**
1. View Phase 2 notice
2. See auto-generated quality checks preview:
   - Row count validation
   - Schema validation
   - Freshness check

3. Click **Continue to Delivery** →

**Expected Behavior:**
- ✅ Shows Phase 2 notice
- ✅ Lists auto-generated checks
- ✅ Continue button immediately available

---

### **Step 5: Configure Delivery**

**What to Test:**
1. Select catalog:
   - Choose `iceberg_prod`

2. Select schema:
   - Choose `analytics`

3. Enter table name:
   - Type `customer_churn_risk`
   - (Auto-populated with product name)

4. Select format:
   - Choose `Apache Iceberg`

5. Select materialization:
   - Choose `Table (full refresh)`

6. View full path preview:
   - Should show: `iceberg_prod.analytics.customer_churn_risk`

7. Click **Continue to Review** →

**Expected Behavior:**
- ✅ Dropdowns populated with options
- ✅ Table name pre-filled
- ✅ Full path updates in real-time
- ✅ Continue button enabled when all fields filled

---

### **Step 6: Review & Deploy**

**What to Test:**
1. Review summary:
   - Product name, owner, domain
   - Schedule: "Daily at 02:00"
   - Output location: full table path
   - Source tables as badges

2. View generated artifacts:
   - Wait 1 second for generation
   - Should see 3 artifacts:
     1. 📄 ODCS Data Contract
     2. 🗄️ dbt Model
     3. 📅 Airflow DAG

3. Preview artifacts:
   - Click **Preview** (eye icon) on ODCS Contract
   - Modal opens with full YAML content
   - Scroll through contract
   - Click **Close**

4. Download artifact:
   - Click **Download** on dbt Model
   - File should download: `customer_churn_risk.sql`

5. Preview all artifacts:
   - Preview ODCS contract (YAML)
   - Preview dbt model (SQL with config block)
   - Preview Airflow DAG (Python)

6. Click **Create Pull Request** →

**Expected Behavior:**
- ✅ Summary shows all workflow data
- ✅ Artifacts generate after 1 second
- ✅ Preview modal shows full content
- ✅ Download works for each file
- ✅ Mock PR URL returned
- ✅ Flow completes successfully

---

## Example Generated Artifacts

### **ODCS Contract Preview**

```yaml
# Data Contract (ODCS v3.0)
# Generated by NexusOne Build Flow

version: "3.0.0"
kind: DataContract

info:
  title: Customer Churn Risk
  version: "1.0.0"
  description: Predictive model for identifying at-risk customers
  owner: data-team
  domain: analytics
  tags:
    - ml
    - customer
    - churn

servers:
  production:
    type: trino
    host: trino.nexusone.com
    port: 8080
    catalog: iceberg_prod
    schema: analytics

models:
  - name: customer_churn_risk
    type: table
    description: Predictive model for identifying at-risk customers

quality:
  type: great_expectations
  expectationSuiteName: customer_churn_risk_quality

sla:
  freshnessHours: 24
  qualityThreshold: 95
  availabilityTarget: 99.9

schedule:
  type: daily
  time: "02:00"
```

### **dbt Model Preview**

```sql
{{
  config(
    materialized='table',
    schema='analytics',
    tags=["data-product", "generated"],
    enabled=true
  )
}}

-- Generated by NexusOne Build Flow
-- Product: customer_churn_risk
-- Format: iceberg

SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(total) as revenue
FROM {{ ref('orders') }}
GROUP BY 1
```

### **Airflow DAG Preview**

```python
"""
Airflow DAG for Customer Churn Risk
Generated by NexusOne Build Flow

Owner: data-team
Description: Predictive model for identifying at-risk customers
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='customer_churn_risk',
    default_args=default_args,
    description='Predictive model for identifying at-risk customers',
    schedule_interval='0 2 * * *',
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['data-product', 'dbt', 'analytics'],
) as dag:

    start = EmptyOperator(task_id='start')

    dbt_run = BashOperator(
        task_id='dbt_run_customer_churn_risk',
        bash_command='dbt run --select customer_churn_risk',
    )

    dbt_test = BashOperator(
        task_id='dbt_test_customer_churn_risk',
        bash_command='dbt test --select customer_churn_risk',
    )

    ge_validate = BashOperator(
        task_id='ge_validate_customer_churn_risk',
        bash_command='great_expectations checkpoint run customer_churn_risk_checkpoint',
    )

    end = EmptyOperator(task_id='end')

    start >> dbt_run >> dbt_test >> ge_validate >> end
```

---

## Testing Checklist

### **Navigation**
- [ ] Can navigate forward through all 6 steps
- [ ] Can navigate backward to previous steps
- [ ] Stepper shows current/completed/pending states
- [ ] Form data persists when navigating back

### **Step 1: Define Product**
- [ ] Name validation works (lowercase + underscore only)
- [ ] All fields required before continuing
- [ ] Schedule dropdown changes based on type
- [ ] SLA sliders work
- [ ] Tags can be added/removed

### **Step 2: Select Sources**
- [ ] Search filters tables
- [ ] Schema preview modal opens
- [ ] Sources can be added/removed
- [ ] Selection count updates
- [ ] Estimation shows row counts

### **Step 3: Write SQL**
- [ ] CodeMirror editor loads
- [ ] Syntax highlighting works
- [ ] Real-time validation (1s debounce)
- [ ] Templates insert SQL
- [ ] Preview executes and shows results

### **Step 4: Quality Rules**
- [ ] Phase 2 notice displays
- [ ] Auto-generated checks shown
- [ ] Can continue immediately

### **Step 5: Delivery Config**
- [ ] All dropdowns populated
- [ ] Table name auto-filled
- [ ] Full path preview updates
- [ ] All fields required

### **Step 6: Review & Deploy**
- [ ] Summary shows all data
- [ ] Artifacts generate after 1s
- [ ] Preview modal works for all artifacts
- [ ] Download works for all artifacts
- [ ] Artifacts contain correct data
- [ ] Create PR completes flow

---

## Edge Cases to Test

### **Invalid Inputs**
1. Step 1: Product name with spaces → Should show error
2. Step 1: Product name with uppercase → Should show error
3. Step 2: Continue with 0 sources → Button disabled
4. Step 3: Invalid SQL → Error message shown
5. Step 3: Preview with invalid SQL → Button disabled
6. Step 5: Empty table name → Continue disabled

### **Boundary Cases**
1. Step 1: Very long description (500+ chars)
2. Step 2: Select all 3 sources
3. Step 2: Deselect all sources
4. Step 3: Very long SQL (1000+ lines)
5. Step 6: Preview very long artifact

### **Navigation Edge Cases**
1. Navigate back from Step 6 to Step 1
2. Navigate forward without completing step (should be blocked)
3. Refresh page mid-flow (data will be lost - no persistence yet)

---

## Known Limitations (Mock Data)

### **Step 2: Sources**
- Only 3 mock sources available
- Search only filters mock data (not real DataHub)
- Quality scores are hardcoded
- Row counts are estimates

### **Step 3: SQL**
- Validation is simple (checks for SELECT/FROM only)
- Preview shows hardcoded mock data
- No actual Trino execution
- Estimated rows are random

### **Step 6: Deploy**
- No actual Git integration
- PR URL is mock: `https://github.com/org/repo/pull/123`
- No actual file writing
- No CI/CD triggering

---

## Success Criteria

After testing, you should confirm:

✅ **Complete Flow**: Can navigate from Step 1 → Step 6
✅ **Data Persistence**: Data flows between steps correctly
✅ **Validation**: Invalid inputs are caught and shown
✅ **Artifact Generation**: All 3 files generate with correct content
✅ **Professional UX**: Interface is clean, clear, and responsive
✅ **No Errors**: Console shows no errors (warnings OK)

---

## Troubleshooting

### **Artifacts Not Generating**
- Wait at least 1 second on Step 6
- Check browser console for errors
- Verify all previous steps have data

### **Preview Modal Not Opening**
- Check if Dialog component loaded
- Look for z-index conflicts
- Try different browser

### **Continue Button Disabled**
- Check all required fields filled
- Look for validation errors
- Verify data format (e.g., product name)

### **TypeScript Errors**
- Check console for compilation errors
- Verify all imports correct
- Check type definitions match

---

## Next Steps After Testing

### **Report Issues**
If you find bugs:
1. Note the step number
2. Describe expected vs actual behavior
3. Include browser console errors
4. Screenshot if helpful

### **Backend Integration**
Once frontend testing complete:
1. Implement backend APIs (see docs/PHASE1_BUILD_FLOW_COMPLETION.md)
2. Replace mock data with real DataHub queries
3. Add Trino validation service
4. Implement Git integration
5. Add workflow state persistence

### **Phase 2 Features**
After backend integration:
1. Implement Quality Rules builder (Step 4)
2. Add REST API configuration (Step 5)
3. Enhance artifact preview
4. Add PR creation via GitHub API

---

## Questions?

**Documentation**:
- Full implementation: `docs/PHASE1_BUILD_FLOW_COMPLETION.md`
- Visual guide: `docs/BUILD_FLOW_VISUAL_GUIDE.md`
- PRD reference: `docs/BUILD_FLOW_REALISTIC_IMPLEMENTATION.md`

**Code Locations**:
- Main page: `app/(main)/build/page.tsx`
- Step components: `components/build/steps/Step*.tsx`
- Artifact generation: `components/build/steps/Step6ReviewDeploy.tsx:301-453`

---

## Enjoy Testing! 🚀

The build flow represents **Phase 1 completion** of the NexusOne data product creation workflow. Test thoroughly and enjoy the **85% time savings** from traditional manual processes!
