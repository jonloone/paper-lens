# Legacy Step-Based Flow Backup Documentation
**Created:** 2025-10-28
**Purpose:** Comprehensive backup of legacy step components before Phase 1 deletion
**Status:** Pre-deletion analysis complete

---

## Overview

The legacy build flow consisted of 6 sequential step components orchestrated by `LinearWorkflow.tsx`. This document preserves all reusable logic, validation patterns, API integrations, and data structures before consolidation into the unified workspace architecture.

---

## Component Inventory

### Files to be Deleted
- `/components/build/steps/Step1DefineProduct.tsx` (414 lines)
- `/components/build/steps/Step2SelectSources.tsx` (753 lines)
- `/components/build/steps/Step3SQLWorkstation.tsx` (352 lines)
- `/components/build/steps/Step4Quality.tsx` (528 lines)
- `/components/build/steps/Step5DeliveryConfig.tsx` (175 lines)
- `/components/build/steps/Step6ReviewDeploy.tsx` (897 lines)
- `/components/build/LinearWorkflow.tsx`

### Total Lines: 3,119 lines to be analyzed and consolidated

---

## Step 1: Define Product

### Data Structures (PRESERVE)
```typescript
interface ProductDefinition {
  name: string;              // Lowercase, underscores only
  displayName: string;
  description: string;
  domain: string;
  owner: string;
  tags: string[];
  schedule: {
    type: 'hourly' | 'daily' | 'weekly' | 'cron';
    time?: string;
    day?: string;
    cron?: string;
  };
  sla: {
    freshnessToleranceType?: 'real-time' | 'same-day' | 'next-day' | 'weekly';
    qualityLevel?: 'mission-critical' | 'production-ready' | 'analytics-grade' | 'experimental';
    freshnessHours: number;
    qualityThreshold: number;
    availabilityTarget: number;
  };
  businessContext?: {
    department: string;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    useCase: string;
    stakeholderName?: string;
    deadline?: string;
  };
}
```

### Reusable Validation Logic (EXTRACT)

**1. Product Name Validation**
```typescript
function validateProductName(name: string): boolean {
  // Check format: lowercase and underscores only
  if (!/^[a-z_]+$/.test(name)) {
    return false; // Error: 'Use lowercase and underscores only'
  }
  // TODO: Check uniqueness against DataHub
  return true;
}
```

**2. Tag Management**
```typescript
function addTag(tagInput: string, existingTags: string[]) {
  if (tagInput && !existingTags.includes(tagInput)) {
    return [...existingTags, tagInput];
  }
  return existingTags;
}

function removeTag(tag: string, existingTags: string[]) {
  return existingTags.filter(t => t !== tag);
}
```

**3. Urgency Inference from Schedule**
```typescript
function inferUrgencyFromSchedule(scheduleType: string): 'critical' | 'high' | 'medium' | 'low' {
  switch (scheduleType) {
    case 'hourly': return 'critical';
    case 'daily': return 'high';
    case 'weekly': return 'medium';
    default: return 'medium';
  }
}
```

**4. DataReliabilitySelector Integration**
```typescript
// Maps 2D reliability point (frequency + quality) to schedule and SLA
function handleReliabilityChange(point: DataReliabilityPoint) {
  const scheduleTypeMap: Record<FrequencyType, 'hourly' | 'daily' | 'weekly'> = {
    realtime: 'hourly',
    hourly: 'hourly',
    daily: 'daily',
    weekly: 'weekly',
    monthly: 'weekly'
  };

  const freshnessMap: Record<FrequencyType, number> = {
    realtime: 1,
    hourly: 4,
    daily: 24,
    weekly: 168,
    monthly: 720
  };

  let qualityLevel: 'mission-critical' | 'production-ready' | 'analytics-grade' | 'experimental';
  if (point.quality >= 99) qualityLevel = 'mission-critical';
  else if (point.quality >= 95) qualityLevel = 'production-ready';
  else if (point.quality >= 90) qualityLevel = 'analytics-grade';
  else qualityLevel = 'experimental';

  return {
    schedule: { type: scheduleTypeMap[point.frequency] },
    sla: {
      qualityLevel,
      qualityThreshold: point.quality,
      freshnessHours: freshnessMap[point.frequency]
    }
  };
}
```

**5. Business Context Auto-Population**
```typescript
function autoPopulateBusinessContext(definition: ProductDefinition) {
  return {
    department: definition.domain,
    urgency: inferUrgencyFromSchedule(definition.schedule.type),
    useCase: definition.description,
    stakeholderName: definition.owner,
  };
}
```

### Form Validation
```typescript
const isValid =
  definition.name.trim() !== '' &&
  !nameError &&
  definition.displayName.trim() !== '' &&
  definition.description.trim() !== '' &&
  definition.domain.trim() !== '' &&
  definition.owner.trim() !== '';
```

### Components Used (KEEP)
- `DataReliabilitySelector` - KEEP as reusable component

---

## Step 2: Select Sources

### Data Structures (PRESERVE)
```typescript
interface Source {
  id: string;                // DataHub URN
  name: string;
  schema: string;
  database: string;
  qualityScore: number;
  quality?: QualityBreakdown;
  sampleData?: SampleDataType;
  rowCount: number;
  columns: ColumnMetadata[];
  lastUpdated: string;
  description?: string;
}

interface ColumnMetadata {
  name: string;
  type: string;
  description?: string;
  isPrimaryKey?: boolean;
}

interface Step2Data {
  selectedSources: Source[];
  contextData?: {
    intentId?: string;
    businessContext?: any;
    qualityExpectations?: any;
    reasoning?: string[];
    confidence?: number;
    profilingResult?: any;
    qualityGapAnalysis?: any;
  };
}
```

### API Integrations (PRESERVE)

**1. Fetch Sources from DataHub**
```typescript
// Endpoint: via fetchSources() from '@/lib/api/build-api'
async function fetchAvailableSources(searchQuery: string) {
  const data = await fetchSources({ search: searchQuery });
  return data.sources;
}
```

**2. Living Context Graph - Quality Inference**
```typescript
// Endpoint: createIntent from '@/lib/api/context-api'
async function inferQualityExpectations(productDefinition: any) {
  const context = {
    stakeholder: {
      name: productDefinition.businessContext.stakeholderName,
      email: productDefinition.owner,
      department: productDefinition.businessContext.department,
    },
    businessNeed: {
      summary: productDefinition.businessContext.useCase,
      keywords: productDefinition.tags || [],
      urgency: productDefinition.businessContext.urgency,
    },
    deadline: {
      date: productDefinition.businessContext.deadline || '',
      type: 'soft' as const,
    },
    originalRequest: productDefinition.description,
  };

  const response = await createIntent(productDefinition.name, context);
  return {
    qualityExpectations: response.qualityExpectations,
    intentId: response.intentId,
    reasoning: response.reasoning,
    confidence: response.confidence,
  };
}
```

### Reusable Logic (EXTRACT)

**1. Source Selection Management**
```typescript
function toggleSource(source: Source, selectedSources: Source[]) {
  const isSelected = selectedSources.some(s => s.id === source.id);
  if (isSelected) {
    return selectedSources.filter(s => s.id !== source.id);
  } else {
    return [...selectedSources, source];
  }
}
```

**2. Potential Join Key Detection**
```typescript
function findPotentialJoins(source1: Source, source2: Source): string[] {
  const commonColumns: string[] = [];
  source1.columns.forEach(col1 => {
    source2.columns.forEach(col2 => {
      if (col1.name === col2.name && col1.type === col2.type) {
        commonColumns.push(col1.name);
      }
    });
  });
  return commonColumns;
}
```

**3. Search and Filter Logic**
```typescript
function filterSources(sources: Source[], searchQuery: string) {
  const query = searchQuery.toLowerCase();
  return sources.filter(source =>
    source.name.toLowerCase().includes(query) ||
    source.description?.toLowerCase().includes(query) ||
    source.columns.some(col =>
      col.name.toLowerCase().includes(query) ||
      col.description?.toLowerCase().includes(query)
    )
  );
}
```

**4. Smart Suggestions Integration**
```typescript
// Uses SmartSuggestionsPanel component
function handleSelectRecommendedTable(tableId: string, tableName: string, availableSources: Source[]) {
  const table = availableSources.find(s => s.id === tableId || s.name === tableName);
  if (table && !isSourceSelected(table.id)) {
    toggleSource(table);
  }
}
```

### UI Patterns (PRESERVE)
- **Split Panel**: Left (browse) + Right (detail)
- **Auto-focus**: Newly added source becomes focused source
- **Expandable cards**: Click chevron to show column list
- **Tabs**: Overview / Sample Data / Full Schema
- **Relationship detection**: Show potential joins when multiple sources selected

### Components Used (KEEP)
- `SmartSuggestionsPanel` - KEEP
- `QualityBreakdownCard` - KEEP
- `SampleDataPreview` - KEEP

---

## Step 3: SQL Workstation

### Data Structures (PRESERVE)
```typescript
interface Step3Data {
  sql: string;
  validationResult?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  testResult?: {
    success: boolean;
    rowCount: number;
    executionTime: number;
    previewData: any[];
    columns?: any[];
    bytesProcessed?: number;
    limited?: boolean;
    error?: string;
  };
}
```

### API Integrations (PRESERVE)

**1. Real Trino Validation and Execution**
```typescript
// Endpoint: /api/v1/trino/validate-and-execute
async function handleRun(sql: string) {
  const response = await fetch('/api/v1/trino/validate-and-execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sql,
      catalog: 'iceberg',
      schema: 'production',
      limit: 100,
      include_stats: true
    })
  });

  const data = await response.json();
  return {
    validation: data.validation,
    execution: data.execution
  };
}
```

**2. Real Trino Query Analysis**
```typescript
// Endpoint: /api/v1/trino/analyze
async function handleAnalyze(sql: string) {
  const response = await fetch('/api/v1/trino/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sql,
      catalog: 'iceberg',
      schema: 'production'
    })
  });

  const data = await response.json();
  return {
    valid: data.data.valid,
    errors: data.data.errors,
    warnings: data.data.warnings,
    performance_insights: data.data.performance_insights,
    optimization_suggestions: data.data.optimization_suggestions
  };
}
```

### Reusable Logic (EXTRACT)

**1. Query Pattern Saving for Organizational Learning**
```typescript
// Saves successful queries for reuse
if (result.success && result.rowCount > 0) {
  saveQueryPattern(sql, {
    title: productDefinition?.displayName,
    description: productDefinition?.description,
    sourceTables: selectedSources.map(s => s.name),
    catalog: 'iceberg',
    schema: 'production',
    createdBy: 'current-user',
    dataProductId: productDefinition?.id
  });
}
```

**2. Mock Data Generation (Fallback)**
```typescript
function generateMockData(schema: Array<{ name: string; type: string }>, rowCount: number = 5) {
  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {};
    schema.forEach(field => {
      const fieldType = field.type.toLowerCase();
      if (fieldType.includes('int')) row[field.name] = Math.floor(Math.random() * 10000) + 1;
      else if (fieldType.includes('decimal')) row[field.name] = (Math.random() * 10000).toFixed(2);
      else if (fieldType.includes('string')) {
        if (field.name.includes('id')) row[field.name] = `ID-${String(i + 1).padStart(5, '0')}`;
        else if (field.name.includes('email')) row[field.name] = `user${i + 1}@example.com`;
        else row[field.name] = `value_${i + 1}`;
      }
      else if (fieldType.includes('date')) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        row[field.name] = date.toISOString().split('T')[0];
      }
      else if (fieldType.includes('bool')) row[field.name] = i % 2 === 0;
      else row[field.name] = `data_${i + 1}`;
    });
    rows.push(row);
  }
  return rows;
}
```

### Delegation Pattern (KEEP)
This step delegates all UI to `TiSQLWorkstation` component - **KEEP THIS COMPONENT**

---

## Step 4: Quality Rules

### Data Structures (PRESERVE)
```typescript
interface QualityRule {
  id: string;
  field: string;
  type: string;
  condition: string;
  value: string;
  severity: 'error' | 'warning';
}

interface SLAConfig {
  freshnessTarget: string;
  freshnessUnit: 'minutes' | 'hours' | 'days';
  completenessThreshold: number;
  accuracyThreshold: number;
}

interface GovernanceConfig {
  security: {
    encryption_required: boolean;
    pii_fields: string[];
    retention_days?: number;
  };
  compliance: {
    frameworks: ('GDPR' | 'HIPAA' | 'SOC2' | 'PCI-DSS' | 'CCPA')[];
    requires_approval: boolean;
    audit_required: boolean;
  };
  access_control: {
    default_policy: 'deny' | 'allow';
    allowed_groups: string[];
  };
}

interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  level: 'industry' | 'organization' | 'domain' | 'product';
  policy_type: 'quality' | 'security' | 'compliance' | 'operational' | 'retention';
  enforcement: 'blocking' | 'warning' | 'monitoring';
  status: 'active' | 'draft' | 'archived';
}
```

### API Integrations (PRESERVE)

**1. Fetch Governance Policies**
```typescript
// Endpoint: /api/v1/policies?domain={domain}
async function fetchPolicies(domain: string) {
  const params = new URLSearchParams();
  if (domain) params.append('domain', domain);

  const response = await fetch(`http://localhost:8000/api/v1/policies?${params}`);
  const allPolicies = await response.json();

  // Filter policies based on domain and level
  const filtered = allPolicies.filter((policy: GovernancePolicy) =>
    policy.level === 'industry' ||
    policy.level === 'organization' ||
    (policy.level === 'domain' && policy.status === 'active')
  );

  return filtered;
}
```

### Reusable Logic (EXTRACT)

**1. Policy Display with Enforcement Badges**
```typescript
function getPolicyEnforcementBadge(enforcement: 'blocking' | 'warning' | 'monitoring') {
  if (enforcement === 'blocking') {
    return { variant: 'destructive', icon: 'XCircle', text: 'Blocking' };
  } else if (enforcement === 'warning') {
    return { variant: 'default', className: 'bg-yellow-500', icon: 'AlertTriangle', text: 'Warning' };
  } else {
    return { variant: 'secondary', icon: 'Info', text: 'Monitoring' };
  }
}
```

**2. Data Classification Levels**
```typescript
const dataClassificationLevels = [
  { value: 'public', label: 'Public - Unrestricted access' },
  { value: 'internal', label: 'Internal - Company employees only' },
  { value: 'confidential', label: 'Confidential - Need-to-know basis' },
  { value: 'restricted', label: 'Restricted - Highly sensitive' }
];
```

**3. Compliance Frameworks**
```typescript
const complianceFrameworks = ['GDPR', 'HIPAA', 'SOC2', 'PCI-DSS', 'CCPA'] as const;
```

### UI Patterns (PRESERVE)
- **Governance Policies Card First**: Shows applicable policies before quality rules
- **Collapsible Governance Section**: Hidden by default, chevron icon toggle
- **PII Field Selection**: Checkboxes for each schema field
- **Policy Enforcement Color Coding**:
  - Blocking: Red (destructive)
  - Warning: Yellow
  - Monitoring: Secondary

### Components Used (KEEP)
- `QualityRulesBuilder` - KEEP

---

## Step 5: Delivery Configuration

### Data Structures (PRESERVE)
```typescript
interface Step5Data {
  deliveryConfig: {
    catalog: string;
    schema: string;
    tableName: string;
    format: 'iceberg' | 'delta';
    materialization: 'table' | 'view' | 'incremental';
  };
}
```

### Reusable Logic (EXTRACT)

**1. Catalog Options**
```typescript
const catalogOptions = [
  { value: 'iceberg_prod', label: 'iceberg_prod' },
  { value: 'iceberg_staging', label: 'iceberg_staging' },
  { value: 'iceberg_dev', label: 'iceberg_dev' }
];
```

**2. Schema Options**
```typescript
const schemaOptions = [
  { value: 'analytics', label: 'analytics' },
  { value: 'marts', label: 'marts' },
  { value: 'staging', label: 'staging' },
  { value: 'raw', label: 'raw' }
];
```

**3. Full Table Path Preview**
```typescript
function getFullTablePath(catalog: string, schema: string, tableName: string) {
  return `${catalog}.${schema}.${tableName}`;
}
```

### Notes
- Simple configuration step
- No complex logic
- Defaults to: iceberg_prod.analytics.{productName}

---

## Step 6: Review & Deploy

### Data Structures (PRESERVE)
```typescript
interface GeneratedArtifact {
  name: string;
  path: string;
  content: string;
  type: 'contract' | 'dbt' | 'airflow';
}

interface PolicyViolation {
  policy_id: string;
  policy_name: string;
  enforcement: 'blocking' | 'warning' | 'monitoring';
  message: string;
}

interface Step6Data {
  deployed: boolean;
  prUrl?: string;
  optimizations?: string;
}
```

### API Integrations (PRESERVE)

**1. Policy Validation**
```typescript
// Endpoint: /api/v1/policies/calculate
async function validatePolicies(formData: any) {
  const response = await fetch('http://localhost:8000/api/v1/policies/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: formData.step1?.name,
      domain: formData.step1?.domain,
      glossary_terms: formData.step1?.tags,
      product_type: 'analytical'
    })
  });

  const effectivePolicies = await response.json();

  // Extract violations
  const violations = effectivePolicies.blocking_policies?.map((policy: any) => ({
    policy_id: policy.id,
    policy_name: policy.name,
    enforcement: 'blocking',
    message: `Policy "${policy.name}" requires validation before deployment`
  }));

  return violations;
}
```

**2. Quality Gates Execution**
```typescript
// From: '@/lib/services/quality-gates-client'
async function runQualityGates(productData: any) {
  const report = await runQualityGates({
    dataProductName: productData.name,
    productDefinition: {
      description: productData.description,
      domain: productData.domain,
      owner: productData.owner,
      classification: productData.classification,
      transformationSql: productData.sql,
      sources: productData.sources,
      businessContext: productData.businessContext,
      columnDescriptions: productData.columnDescriptions,
    },
    sampleData: productData.sampleData,
    qualityRules: productData.qualityRules,
  });

  return report; // { overallStatus: 'passed' | 'warning' | 'blocked', ... }
}
```

**3. Policy Exception Request**
```typescript
// Endpoint: /api/v1/policies/exceptions
async function submitExceptionRequest(violation: PolicyViolation, form: any, productData: any) {
  const response = await fetch('http://localhost:8000/api/v1/policies/exceptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      policy_id: violation.policy_id,
      product_id: productData.name,
      product_name: productData.displayName,
      requested_by: form.requestedBy,
      justification: form.justification,
      duration_days: form.durationDays
    })
  });

  const result = await response.json();
  return result.exception.id;
}
```

### Artifact Generation Templates (EXTRACT & PRESERVE)

**1. ODCS Contract Generator**
```typescript
function generateODCSContract(formData: any): string {
  const product = formData.step1 || {};
  const deliveryConfig = formData.step5?.deliveryConfig || {};

  return `# Data Contract (ODCS v3.0)
version: "3.0.0"
kind: DataContract

info:
  title: ${product.displayName}
  version: "1.0.0"
  description: ${product.description}
  owner: ${product.owner}
  domain: ${product.domain}
  tags:
${product.tags.map((tag: string) => `    - ${tag}`).join('\n')}

servers:
  production:
    type: trino
    host: trino.nexusone.com
    port: 8080
    catalog: ${deliveryConfig.catalog}
    schema: ${deliveryConfig.schema}

models:
  - name: ${deliveryConfig.tableName}
    type: table
    description: ${product.description}

quality:
  type: great_expectations
  expectationSuiteName: ${product.name}_quality

sla:
  freshnessHours: ${product.sla?.freshnessHours || 24}
  qualityThreshold: ${product.sla?.qualityThreshold || 95}
  availabilityTarget: ${product.sla?.availabilityTarget || 99.9}

schedule:
  type: ${product.schedule?.type}
  ${product.schedule?.time ? `time: "${product.schedule.time}"` : ''}
`;
}
```

**2. dbt Model Generator**
```typescript
function generateDbtModel(sql: string, deliveryConfig: any, productName: string): string {
  const materialization = deliveryConfig.materialization || 'table';
  const schema = deliveryConfig.schema || 'analytics';
  const tags = ['data-product', 'generated'];

  return `{{
  config(
    materialized='${materialization}',
    schema='${schema}',
    tags=${JSON.stringify(tags)},
    enabled=true
  )
}}

-- Generated by NexusOne Build Flow
-- Product: ${productName}
-- Format: ${deliveryConfig.format}

${sql}
`;
}
```

**3. Airflow DAG Generator**
```typescript
function generateAirflowDAG(formData: any): string {
  const product = formData.step1 || {};
  const productName = product.name;
  const schedule = product.schedule || { type: 'daily', time: '02:00' };

  // Convert schedule to cron
  let scheduleInterval = '0 2 * * *'; // daily at 2 AM
  if (schedule.type === 'hourly') scheduleInterval = '0 * * * *';
  else if (schedule.type === 'daily') {
    const [hour, minute] = (schedule.time || '02:00').split(':');
    scheduleInterval = `${minute} ${hour} * * *`;
  } else if (schedule.type === 'weekly') {
    const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    const dayNum = dayMap[schedule.day?.toLowerCase()] || 1;
    scheduleInterval = `0 2 * * ${dayNum}`;
  }

  return `"""
Airflow DAG for ${product.displayName}
Generated by NexusOne Build Flow
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator

default_args = {
    'owner': '${product.owner}',
    'depends_on_past': False,
    'email_on_failure': True,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='${productName}',
    default_args=default_args,
    description='${product.description}',
    schedule_interval='${scheduleInterval}',
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['data-product', 'dbt', '${product.domain}'],
) as dag:
    start = EmptyOperator(task_id='start')
    dbt_run = BashOperator(task_id='dbt_run_${productName}', bash_command='dbt run --select ${productName}')
    dbt_test = BashOperator(task_id='dbt_test_${productName}', bash_command='dbt test --select ${productName}')
    ge_validate = BashOperator(task_id='ge_validate_${productName}', bash_command='great_expectations checkpoint run ${productName}_checkpoint')
    end = EmptyOperator(task_id='end')

    start >> dbt_run >> dbt_test >> ge_validate >> end
`;
}
```

### Deployment State Machine (PRESERVE)

```
1. User clicks "Create Pull Request"
2. Run Policy Validation
   - If blocking violations → Show PolicyBlockingModal
     - User can request exception per policy
   - If no blocking → Continue
3. Run Quality Gates
   - If 'blocked' → Show BlockingIssuesModal (cannot proceed)
   - If 'warning' → Show WarningsAcknowledgmentModal (can acknowledge and proceed)
   - If 'passed' → Proceed immediately
4. Create Git PR (TODO - not yet implemented)
   - Create branch: feature/data-product-{name}
   - Commit artifacts
   - Create PR via GitHub API
   - Return PR URL
```

### UI Patterns (PRESERVE)
- **Advanced Toggle**: Show/hide technical artifacts (dbt, Airflow)
  - Default: Only show contract
  - Advanced: Show all 3 artifacts
- **Artifact Preview**: Modal with syntax-highlighted code
- **Artifact Download**: Download individual files
- **Multiple Modals**:
  - BlockingIssuesModal (quality gates)
  - WarningsAcknowledgmentModal (quality gates)
  - PolicyBlockingModal (governance)
  - ExceptionRequestModal (governance)

### Components Used (KEEP)
- `QualityGatesPanel` - KEEP
- `BlockingIssuesModal` - KEEP
- `WarningsAcknowledgmentModal` - KEEP

---

## Linear Workflow Orchestration

### State Machine
```typescript
type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface FormData {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  step6?: Step6Data;
}

// Navigation
function goToStep(targetStep: Step) {
  setCurrentStep(targetStep);
}

function handleStepComplete(stepNum: Step, data: any) {
  setFormData(prev => ({ ...prev, [`step${stepNum}`]: data }));
  if (stepNum < 6) goToStep((stepNum + 1) as Step);
}

function handleStepBack(stepNum: Step) {
  if (stepNum > 1) goToStep((stepNum - 1) as Step);
}
```

---

## Integration Points to Preserve in Unified Workspace

### Must Keep These Interactions:
1. **Step 1 → Step 2**: Business context feeds into quality expectations inference
2. **Step 2 → Step 3**: Selected sources populate SQL editor context
3. **Step 2 → Step 4**: Profiling results feed into quality rule suggestions
4. **Step 3 → Step 6**: SQL content goes into dbt model artifact
5. **Step 4 → Step 6**: Quality rules go into Great Expectations suite
6. **Step 1 → Step 6**: Schedule/SLA → Airflow DAG cron schedule

### Data Flow Dependencies:
```
Step 1 (ProductDefinition)
  ├→ Step 2 (Quality Inference)
  ├→ Step 4 (Policy Fetching by domain)
  └→ Step 6 (Contract + Airflow DAG)

Step 2 (Sources)
  ├→ Step 3 (SQL Context)
  ├→ Step 4 (Profiling → Quality Suggestions)
  └→ Step 6 (Source lineage in contract)

Step 3 (SQL)
  └→ Step 6 (dbt model content)

Step 4 (Quality Rules + Governance)
  └→ Step 6 (Quality gates + Policy validation)

Step 5 (Delivery Config)
  └→ Step 6 (Catalog/schema in contract + dbt config)
```

---

## Migration Strategy

### Phase 1: Consolidation (Week 1-2)

**Week 1: Extract & Centralize**
1. Create `/lib/services/product-definition-validation.ts`
   - Move: validateProductName, addTag, removeTag, inferUrgencyFromSchedule
   - Move: handleReliabilityChange, autoPopulateBusinessContext
2. Create `/lib/services/source-selection.ts`
   - Move: toggleSource, findPotentialJoins, filterSources
3. Create `/lib/services/artifact-generators.ts`
   - Move: generateODCSContract, generateDbtModel, generateAirflowDAG
4. Create `/lib/services/policy-validation.ts`
   - Move: validatePolicies, fetchPolicies

**Week 2: Update Workspace**
1. Refactor `UnifiedProductWorkspace` to import extracted functions
2. Add missing functionality from steps not yet in workspace:
   - Governance policy display
   - Policy exception request workflow
   - Advanced toggle for technical artifacts
3. Remove LinearWorkflow and Step1-6 components
4. Update `/app/(main)/build/page.tsx` to remove step-based flow references

---

## Success Criteria

✅ All reusable logic extracted to services
✅ All API endpoints documented
✅ All data structures preserved in unified interfaces
✅ All validation patterns centralized
✅ All template generators moved to artifact-generators.ts
✅ Zero functionality lost in consolidation
✅ All tests updated to use new service functions

---

## Files Referenced

### Keep (Used by Steps)
- `/components/build/DataReliabilitySelector.tsx`
- `/components/build/SmartSuggestionsPanel.tsx`
- `/components/build/QualityBreakdownCard.tsx`
- `/components/build/SampleDataPreview.tsx`
- `/components/build/QualityRulesBuilder.tsx`
- `/components/tisql/TiSQLWorkstation.tsx`
- `/components/build/quality-gates/QualityGatesPanel.tsx`
- `/components/build/quality-gates/BlockingIssuesModal.tsx`
- `/components/build/quality-gates/WarningsAcknowledgmentModal.tsx`
- `/lib/api/build-api.ts`
- `/lib/api/context-api.ts`
- `/lib/services/query-pattern-storage.ts`
- `/lib/services/quality-gates-client.ts`

### Delete (After Consolidation)
- `/components/build/steps/Step1DefineProduct.tsx`
- `/components/build/steps/Step2SelectSources.tsx`
- `/components/build/steps/Step3SQLWorkstation.tsx`
- `/components/build/steps/Step4Quality.tsx`
- `/components/build/steps/Step5DeliveryConfig.tsx`
- `/components/build/steps/Step6ReviewDeploy.tsx`
- `/components/build/LinearWorkflow.tsx`

---

**End of Backup Documentation**
