# Build Flow: Realistic Implementation Plan
## Pragmatic Code Generator & Workflow Coordinator

**Date**: 2025-10-03
**Status**: Ready for Development
**Approach**: Template-based code generation, NOT AI magic

---

## Executive Summary

This implementation plan delivers a **practical build flow** that reduces data product creation time from 4-8 hours to 30-60 minutes by:

1. **Eliminating boilerplate** - Generate dbt models, Airflow DAGs, GE suites, ODCS contracts
2. **Coordinating tools** - Orchestrate dbt, Great Expectations, Airflow, DataHub, APIsix
3. **Enforcing standards** - ODCS/ODPS compliance from day one
4. **Validating configurations** - Real-time validation against live infrastructure (Trino, DataHub)

**What This IS:**
- Code generator using proven templates
- Workflow coordinator across existing tools
- Standards enforcer (ODCS/ODPS)
- Real-time validator against actual infrastructure

**What This IS NOT:**
- AI that writes SQL for you
- ML-powered recommendations (Phase 1)
- Predictive optimization
- Magic deployment system

---

## Core Architecture Principles

### 1. Template-Based Generation (No AI Magic)

```typescript
// GOOD: Straightforward template generation
function generateDbtModel(sql: string, config: ModelConfig): string {
  return `
{{ config(
    materialized='${config.materialization}',
    schema='${config.schema}',
    tags=${JSON.stringify(config.tags)}
) }}

${sql}
  `.trim();
}

// NOT BUILDING: AI-powered code generation
// ❌ function generateSQLFromNaturalLanguage(prompt: string)
// ❌ function optimizeQueryAutomatically(sql: string)
// ❌ function predictPerformance(query: string)
```

### 2. Real Infrastructure Validation

```typescript
// Validate against actual Trino instance
async function validateSQL(sql: string): Promise<ValidationResult> {
  try {
    // Use EXPLAIN to validate without executing
    const result = await trino.query(`EXPLAIN ${sql}`);
    return {
      valid: true,
      plan: result.queryPlan,
      estimatedRows: result.stats.outputRows
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      line: extractErrorLine(error)
    };
  }
}

// Fetch actual sources from DataHub
async function getAvailableSources(): Promise<Source[]> {
  const sources = await datahub.search({
    entity: "dataset",
    filters: { platform: ["iceberg", "trino"] },
    limit: 1000
  });

  return sources.map(s => ({
    id: s.urn,
    name: s.name,
    schema: s.schemaMetadata,
    qualityScore: s.qualityScore,
    rowCount: s.properties?.rowCount,
    lastUpdated: s.properties?.lastModified
  }));
}
```

### 3. Standard Configs Only

**All generated artifacts must be vanilla configs that engineers can recognize:**

- ✅ dbt models → Standard dbt YAML/SQL
- ✅ Great Expectations → Standard GE JSON
- ✅ Airflow DAGs → Standard Python (no custom operators)
- ✅ ODCS contracts → Standard YAML spec v3.0
- ✅ APIsix routes → Standard YAML config

**❌ No proprietary formats. No magic syntax. No custom DSLs.**

### 4. GitOps Deployment

```
Portal generates files → Commits to Git branch → Creates PR →
Team reviews → CI/CD tests → Merge deploys to production

Standard workflow. No custom deployment system.
```

---

## Phase 1: MVP - Core Workflow (8 Weeks)

### Objective
Build the foundational 3-step flow: Define → Select Sources → Write SQL → Generate artifacts

### Week 1-2: Project Setup + Step 1 (Define Product)

**Backend Setup:**
```python
# FastAPI backend structure
/backend
  /api
    /v1
      /build
        - start.py           # POST /build/start
        - sources.py         # GET /build/sources
        - validate.py        # POST /build/validate-sql
        - preview.py         # POST /build/preview
        - generate.py        # POST /build/generate-artifacts
        - deploy.py          # POST /build/deploy
  /services
    - datahub_client.py      # DataHub integration
    - trino_client.py        # Trino validation
    - git_client.py          # Git operations
    - template_engine.py     # Template generation
  /templates
    - dbt_model.jinja2
    - airflow_dag.jinja2
    - odcs_contract.jinja2
    - ge_suite.jinja2
```

**Frontend - Step 1: Define Product**
```typescript
// components/build/steps/Step1DefineProduct.tsx
interface ProductDefinition {
  name: string;              // Lowercase, underscores only
  displayName: string;
  description: string;
  domain: string;
  owner: string;
  tags: string[];
  schedule: {
    type: 'hourly' | 'daily' | 'weekly' | 'cron';
    time?: string;           // For daily: "02:00"
    day?: string;            // For weekly: "monday"
    cron?: string;           // For custom
  };
  sla: {
    freshnessHours: number;
    qualityThreshold: number;
    availabilityTarget: number;
  };
}

// Real-time validation
async function validateProductName(name: string): Promise<ValidationResult> {
  // Check format
  if (!/^[a-z_]+$/.test(name)) {
    return {
      valid: false,
      error: "Use lowercase and underscores only"
    };
  }

  // Check uniqueness against DataHub
  const exists = await api.checkProductExists(name);
  if (exists) {
    return {
      valid: false,
      error: `Product '${name}' already exists`
    };
  }

  return { valid: true };
}
```

**API Endpoints:**
```python
# POST /api/v1/build/start
@router.post("/start")
async def start_build_workflow(definition: ProductDefinition):
    """Create new product workflow"""

    # Validate product name uniqueness
    if await datahub_client.product_exists(definition.name):
        raise HTTPException(400, "Product already exists")

    # Create workflow ID
    workflow_id = f"workflow_{uuid4()}"

    # Generate draft ODCS contract
    contract = generate_odcs_contract(definition)

    # Store workflow state
    await workflow_store.create(workflow_id, {
        "definition": definition,
        "contract_draft": contract,
        "status": "in_progress",
        "created_at": datetime.utcnow()
    })

    return {
        "workflow_id": workflow_id,
        "contract_draft": contract
    }
```

**Deliverables Week 1-2:**
- ✅ Backend API structure
- ✅ Step 1 UI component
- ✅ Product name validation (real-time)
- ✅ ODCS contract draft generation
- ✅ Workflow state management

### Week 3-4: Step 2 (Select Sources)

**Frontend - Step 2: Source Selection**
```typescript
// components/build/steps/Step2SelectSources.tsx
interface Source {
  id: string;                // DataHub URN
  name: string;
  schema: string;
  database: string;
  qualityScore: number;
  rowCount: number;
  columns: ColumnMetadata[];
  lastUpdated: string;
}

// Fetch sources from DataHub
async function fetchAvailableSources(
  search?: string,
  domain?: string
): Promise<Source[]> {
  const response = await api.get('/build/sources', {
    params: { search, domain }
  });
  return response.data.sources;
}

// Schema preview modal
function SchemaPreviewModal({ source }: { source: Source }) {
  return (
    <Modal>
      <Table>
        <thead>
          <tr>
            <th>Column</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {source.columns.map(col => (
            <tr key={col.name}>
              <td>{col.name}</td>
              <td>{col.type}</td>
              <td>{col.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Modal>
  );
}
```

**API Endpoints:**
```python
# GET /api/v1/build/sources
@router.get("/sources")
async def get_available_sources(
    search: Optional[str] = None,
    domain: Optional[str] = None
):
    """Fetch available sources from DataHub"""

    # Build DataHub search query
    query = {
        "entity": "dataset",
        "filters": {"platform": ["iceberg", "trino"]}
    }

    if search:
        query["query"] = search
    if domain:
        query["filters"]["domains"] = [domain]

    # Fetch from DataHub
    results = await datahub_client.search(query)

    # Transform to frontend format
    sources = []
    for dataset in results:
        sources.append({
            "id": dataset.urn,
            "name": dataset.name,
            "schema": dataset.properties.get("schema", "public"),
            "qualityScore": dataset.qualityScore or 0,
            "rowCount": dataset.properties.get("rowCount", 0),
            "columns": dataset.schemaMetadata.fields,
            "lastUpdated": dataset.properties.get("lastModified")
        })

    return {"sources": sources}
```

**Deliverables Week 3-4:**
- ✅ Source browser with search/filter
- ✅ DataHub integration for source metadata
- ✅ Schema preview modal
- ✅ Selected sources cart/list
- ✅ Storage estimate calculator

### Week 5-6: Step 3 (Write SQL)

**Frontend - Step 3: SQL Editor**
```typescript
// components/build/steps/Step3WriteSQL.tsx
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';

function Step3WriteSQL({
  workflowId,
  selectedSources,
  onComplete
}: Step3Props) {
  const [sqlCode, setSqlCode] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Real-time syntax validation (debounced)
  const debouncedValidate = useDebounce(async (sql: string) => {
    setIsValidating(true);
    const result = await api.post('/build/validate-sql', {
      sql,
      sources: selectedSources.map(s => s.id)
    });
    setValidationResult(result.data);
    setIsValidating(false);
  }, 1000);

  useEffect(() => {
    if (sqlCode.length > 10) {
      debouncedValidate(sqlCode);
    }
  }, [sqlCode]);

  // Preview results on sample data
  async function handlePreview() {
    const result = await api.post('/build/preview', {
      sql: sqlCode,
      limit: 100
    });
    setPreviewData(result.data);
  }

  return (
    <div className="space-y-6">
      {/* SQL Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Write Transformation SQL</CardTitle>
          <CardDescription>
            Use dbt ref() syntax for source tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeMirror
            value={sqlCode}
            onChange={setSqlCode}
            extensions={[sql()]}
            theme="dark"
            height="400px"
          />

          {/* Validation status */}
          {isValidating && (
            <div className="mt-2 text-sm text-muted-foreground">
              Validating syntax...
            </div>
          )}

          {validationResult && !validationResult.valid && (
            <Alert variant="destructive" className="mt-2">
              <AlertTitle>SQL Error</AlertTitle>
              <AlertDescription>
                {validationResult.error}
              </AlertDescription>
            </Alert>
          )}

          {validationResult?.valid && (
            <Alert variant="default" className="mt-2">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Syntax validated successfully
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Results */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Results</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              disabled={!validationResult?.valid}
            >
              Test on Sample Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {previewData && (
            <>
              <DataTable
                columns={previewData.columns}
                data={previewData.rows}
              />
              <div className="mt-2 text-sm text-muted-foreground">
                {previewData.rowCount} rows · Execution time: {previewData.executionTimeMs}ms
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={() => loadTemplate('aggregation')}>
            Aggregation
          </Button>
          <Button variant="outline" onClick={() => loadTemplate('dedupe')}>
            Deduplicate
          </Button>
          <Button variant="outline" onClick={() => loadTemplate('scd2')}>
            SCD Type 2
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Sources
        </Button>
        <Button
          onClick={() => onComplete({ sql: sqlCode })}
          disabled={!validationResult?.valid}
        >
          Continue to Quality Rules →
        </Button>
      </div>
    </div>
  );
}
```

**API Endpoints:**
```python
# POST /api/v1/build/validate-sql
@router.post("/validate-sql")
async def validate_sql(request: SQLValidationRequest):
    """Validate SQL syntax using Trino EXPLAIN"""

    try:
        # Use Trino EXPLAIN to validate without executing
        result = await trino_client.query(f"EXPLAIN {request.sql}")

        return {
            "valid": True,
            "plan": result.query_plan,
            "estimatedRows": result.stats.get("outputRows", 0)
        }
    except TrinoQueryError as e:
        return {
            "valid": False,
            "error": str(e),
            "line": extract_error_line(e)
        }

# POST /api/v1/build/preview
@router.post("/preview")
async def preview_results(request: SQLPreviewRequest):
    """Execute SQL on sample data"""

    # Add LIMIT to ensure we don't execute expensive queries
    limited_sql = f"{request.sql} LIMIT {request.limit or 100}"

    try:
        result = await trino_client.query(limited_sql)

        return {
            "columns": [col.name for col in result.columns],
            "rows": result.data,
            "rowCount": len(result.data),
            "executionTimeMs": result.stats.get("elapsedTimeMillis", 0)
        }
    except TrinoQueryError as e:
        raise HTTPException(400, str(e))
```

**SQL Templates:**
```python
# backend/templates/sql_templates.py

AGGREGATION_TEMPLATE = """
-- Template: Daily aggregation by key
SELECT
  {{ key_column }},
  DATE({{ timestamp_column }}) as date,
  COUNT(*) as row_count,
  COUNT(DISTINCT {{ entity_column }}) as unique_entities,
  SUM({{ metric_column }}) as total_{{ metric_name }}
FROM {{ ref('source_table') }}
WHERE {{ timestamp_column }} >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1, 2
"""

DEDUPE_TEMPLATE = """
-- Template: Deduplicate by key, keep latest
WITH ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY {{ key_column }}
      ORDER BY {{ timestamp_column }} DESC
    ) as rn
  FROM {{ ref('source_table') }}
)
SELECT * EXCEPT (rn)
FROM ranked
WHERE rn = 1
"""

SCD2_TEMPLATE = """
-- Template: Slowly Changing Dimension Type 2
WITH source AS (
  SELECT * FROM {{ ref('source_table') }}
),
existing AS (
  SELECT * FROM {{ this }}
  WHERE is_current = true
),
changes AS (
  SELECT
    s.*,
    e.{{ natural_key }} as existing_key,
    CASE
      WHEN e.{{ natural_key }} IS NULL THEN 'INSERT'
      WHEN {{ check_columns_changed(s, e) }} THEN 'UPDATE'
      ELSE 'NO_CHANGE'
    END as change_type
  FROM source s
  LEFT JOIN existing e ON s.{{ natural_key }} = e.{{ natural_key }}
)
-- Full SCD2 implementation...
"""
```

**Deliverables Week 5-6:**
- ✅ SQL editor with syntax highlighting (CodeMirror)
- ✅ Real-time validation via Trino EXPLAIN
- ✅ Sample data preview (LIMIT 100)
- ✅ SQL template library (3 templates)
- ✅ Template insertion UI

### Week 7-8: Artifact Generation + Git Integration

**Template Engine:**
```python
# backend/services/template_engine.py
from jinja2 import Environment, FileSystemLoader
import yaml

class TemplateEngine:
    def __init__(self):
        self.jinja_env = Environment(
            loader=FileSystemLoader('backend/templates')
        )

    def generate_dbt_model(
        self,
        sql: str,
        config: ModelConfig
    ) -> str:
        """Generate dbt model SQL file"""
        template = self.jinja_env.get_template('dbt_model.jinja2')
        return template.render(
            sql=sql,
            materialization=config.materialization,
            schema=config.schema,
            tags=config.tags
        )

    def generate_odcs_contract(
        self,
        definition: ProductDefinition,
        schema: SchemaDefinition
    ) -> str:
        """Generate ODCS v3.0 contract YAML"""
        template = self.jinja_env.get_template('odcs_contract.jinja2')
        contract_dict = template.render(
            product=definition,
            schema=schema,
            version="1.0.0"
        )
        return yaml.dump(contract_dict, sort_keys=False)

    def generate_airflow_dag(
        self,
        product: ProductDefinition
    ) -> str:
        """Generate Airflow DAG Python file"""
        template = self.jinja_env.get_template('airflow_dag.jinja2')
        return template.render(
            product_name=product.name,
            owner=product.owner,
            schedule=product.schedule,
            description=product.description
        )

    def generate_ge_suite(
        self,
        rules: List[QualityRule]
    ) -> str:
        """Generate Great Expectations suite JSON"""
        expectations = []
        for rule in rules:
            expectations.append(self._rule_to_ge_expectation(rule))

        suite = {
            "data_asset_type": "Dataset",
            "expectation_suite_name": f"{product.name}_suite",
            "expectations": expectations,
            "meta": {"great_expectations_version": "0.18.0"}
        }
        return json.dumps(suite, indent=2)
```

**Git Integration:**
```python
# backend/services/git_client.py
from git import Repo
import os

class GitClient:
    def __init__(self, repo_path: str):
        self.repo = Repo(repo_path)

    async def create_product_branch(
        self,
        product_name: str
    ) -> str:
        """Create feature branch for product"""
        branch_name = f"feature/data-product-{product_name}"

        # Create and checkout branch
        self.repo.git.checkout('-b', branch_name)
        return branch_name

    async def commit_artifacts(
        self,
        artifacts: Dict[str, str],
        product_name: str
    ) -> str:
        """Commit generated artifacts"""

        # Write files
        for filepath, content in artifacts.items():
            full_path = os.path.join(self.repo.working_dir, filepath)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(content)
            self.repo.index.add([filepath])

        # Commit
        commit_msg = f"feat: Add data product {product_name}\n\n🤖 Generated by NexusOne Portal"
        self.repo.index.commit(commit_msg)

        return self.repo.head.commit.hexsha

    async def create_pull_request(
        self,
        branch_name: str,
        product: ProductDefinition
    ) -> str:
        """Create PR via GitHub API"""

        # Push branch
        origin = self.repo.remote(name='origin')
        origin.push(branch_name)

        # Create PR via GitHub API
        pr_data = {
            "title": f"Data Product: {product.displayName}",
            "body": f"""
## Data Product: {product.displayName}

**Description:** {product.description}

**Owner:** {product.owner}
**Domain:** {product.domain}

### Artifacts Generated:
- ODCS Contract
- dbt Model
- Great Expectations Suite
- Airflow DAG

🤖 Generated by NexusOne Portal
            """,
            "head": branch_name,
            "base": "main"
        }

        pr = await github_client.create_pull_request(pr_data)
        return pr.html_url
```

**API Endpoint:**
```python
# POST /api/v1/build/generate-artifacts
@router.post("/generate-artifacts")
async def generate_artifacts(workflow_id: str):
    """Generate all deployment artifacts"""

    # Load workflow state
    workflow = await workflow_store.get(workflow_id)

    # Generate artifacts
    template_engine = TemplateEngine()

    artifacts = {
        "contracts/{product}/v1.0.0/contract.yaml":
            template_engine.generate_odcs_contract(
                workflow.definition,
                workflow.schema
            ),

        "dbt/models/{schema}/{product}.sql":
            template_engine.generate_dbt_model(
                workflow.sql,
                workflow.config
            ),

        "airflow/dags/{product}_dag.py":
            template_engine.generate_airflow_dag(
                workflow.definition
            ),

        # Phase 2: GE suite (for now, just placeholder)
        # "great_expectations/expectations/{product}.json":
        #     template_engine.generate_ge_suite(workflow.quality_rules)
    }

    return {"artifacts": artifacts}

# POST /api/v1/build/deploy
@router.post("/deploy")
async def deploy_product(request: DeployRequest):
    """Deploy via Git PR"""

    workflow = await workflow_store.get(request.workflow_id)

    # Generate artifacts
    artifacts = await generate_artifacts(request.workflow_id)

    # Git operations
    git_client = GitClient("/path/to/repo")

    # Create branch
    branch = await git_client.create_product_branch(workflow.definition.name)

    # Commit artifacts
    commit_sha = await git_client.commit_artifacts(
        artifacts,
        workflow.definition.name
    )

    # Create PR
    pr_url = await git_client.create_pull_request(
        branch,
        workflow.definition
    )

    return {
        "branch": branch,
        "commit_sha": commit_sha,
        "pr_url": pr_url
    }
```

**Deliverables Week 7-8:**
- ✅ Template engine (Jinja2)
- ✅ ODCS contract generation
- ✅ dbt model generation
- ✅ Airflow DAG generation
- ✅ Git integration (branch, commit, PR)
- ✅ Deploy endpoint

### Phase 1 Success Criteria

- ✅ **10 products created** via portal
- ✅ **50% time savings** vs manual (4-8hrs → 2-4hrs)
- ✅ **90% PR approval rate** (minimal changes needed)
- ✅ **100% ODCS compliance** (all products have contracts)
- ✅ **Syntax validation** catches errors before PR
- ✅ **GitOps workflow** (PR-based deployment)

---

## Phase 2: Quality & Delivery (6 Weeks)

### Week 9-10: Step 4 (Quality Rules UI)

**Frontend - Step 4: Quality Rules Builder**
```typescript
// components/build/steps/Step4QualityRules.tsx
interface QualityRule {
  id: string;
  column: string;
  type: 'not_null' | 'unique' | 'in_set' | 'matches_regex' | 'between';
  config: Record<string, any>;
  severity: 'critical' | 'warning';
}

function Step4QualityRules({
  schema,
  onComplete
}: Step4Props) {
  const [columnRules, setColumnRules] = useState<QualityRule[]>([]);
  const [tableRules, setTableRules] = useState<QualityRule[]>([]);
  const [generatedSuite, setGeneratedSuite] = useState<string>('');

  // Generate GE suite when rules change
  useEffect(() => {
    const allRules = [...columnRules, ...tableRules];
    generateGESuite(allRules).then(setGeneratedSuite);
  }, [columnRules, tableRules]);

  function addColumnRule(column: string, type: string) {
    const rule: QualityRule = {
      id: uuidv4(),
      column,
      type,
      config: getDefaultConfig(type),
      severity: 'warning'
    };
    setColumnRules([...columnRules, rule]);
  }

  return (
    <div className="space-y-6">
      {/* Column-Level Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Column-Level Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {schema.columns.map(col => (
            <div key={col.name} className="mb-4 p-4 border rounded">
              <Label className="font-semibold">{col.name}</Label>
              <div className="flex gap-2 mt-2">
                <Checkbox
                  checked={hasRule(col.name, 'not_null')}
                  onCheckedChange={() => toggleRule(col.name, 'not_null')}
                />
                <Label>Not null</Label>

                <Checkbox
                  checked={hasRule(col.name, 'unique')}
                  onCheckedChange={() => toggleRule(col.name, 'unique')}
                />
                <Label>Unique</Label>

                {/* More check types... */}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Table-Level Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Table-Level Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={hasTableRule('row_count')}
                onCheckedChange={() => toggleTableRule('row_count')}
              />
              <Label>Minimum row count:</Label>
              <Input
                type="number"
                className="w-32"
                value={getTableRuleConfig('row_count', 'min') || 1000000}
                onChange={(e) => updateTableRuleConfig('row_count', 'min', e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={hasTableRule('freshness')}
                onCheckedChange={() => toggleTableRule('freshness')}
              />
              <Label>Data updated in last:</Label>
              <Input
                type="number"
                className="w-20"
                value={getTableRuleConfig('freshness', 'hours') || 3}
              />
              <span>hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated GE Suite Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Great Expectations Suite</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadYAML(generatedSuite)}>
              Download YAML
            </Button>
            <Button variant="outline" onClick={testSuiteNow}>
              Test Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded overflow-x-auto">
            {generatedSuite}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Great Expectations Generation:**
```python
# backend/services/ge_generator.py

class GEGenerator:
    def rule_to_expectation(self, rule: QualityRule) -> dict:
        """Convert quality rule to GE expectation"""

        if rule.type == "not_null":
            return {
                "expectation_type": "expect_column_values_to_not_be_null",
                "kwargs": {"column": rule.column},
                "meta": {"severity": rule.severity}
            }

        elif rule.type == "unique":
            return {
                "expectation_type": "expect_column_values_to_be_unique",
                "kwargs": {"column": rule.column},
                "meta": {"severity": rule.severity}
            }

        elif rule.type == "in_set":
            return {
                "expectation_type": "expect_column_values_to_be_in_set",
                "kwargs": {
                    "column": rule.column,
                    "value_set": rule.config["allowed_values"]
                },
                "meta": {"severity": rule.severity}
            }

        elif rule.type == "matches_regex":
            return {
                "expectation_type": "expect_column_values_to_match_regex",
                "kwargs": {
                    "column": rule.column,
                    "regex": rule.config["pattern"]
                },
                "meta": {"severity": rule.severity}
            }

        elif rule.type == "row_count":
            return {
                "expectation_type": "expect_table_row_count_to_be_between",
                "kwargs": {
                    "min_value": rule.config.get("min"),
                    "max_value": rule.config.get("max")
                },
                "meta": {"severity": rule.severity}
            }

    def generate_suite(
        self,
        product_name: str,
        rules: List[QualityRule]
    ) -> dict:
        """Generate complete GE suite"""

        expectations = [self.rule_to_expectation(rule) for rule in rules]

        return {
            "data_asset_type": "Dataset",
            "expectation_suite_name": f"{product_name}_quality",
            "expectations": expectations,
            "meta": {
                "great_expectations_version": "0.18.0",
                "generated_by": "NexusOne Portal"
            }
        }
```

**Deliverables Week 9-10:**
- ✅ Quality rules builder UI
- ✅ Column-level checks (not_null, unique, in_set, regex)
- ✅ Table-level checks (row_count, freshness)
- ✅ Great Expectations suite generation
- ✅ GE suite preview and download

### Week 11-12: Step 5 (Delivery Config) + Step 6 (Review & Deploy)

**Frontend - Step 5: Delivery Configuration**
```typescript
// components/build/steps/Step5DeliveryConfig.tsx
interface DeliveryConfig {
  sql: {
    enabled: boolean;
    catalog: string;
    schema: string;
    tableName: string;
    format: 'iceberg' | 'delta';
    partitioning: 'auto' | 'manual';
    partitionColumn?: string;
  };
  api: {
    enabled: boolean;
    path: string;
    methods: string[];
    rateLimit: number;
    authentication: 'api_key' | 'oauth';
  };
  stream?: {
    enabled: boolean;
    topic: string;
    partitions: number;
  };
}

function Step5DeliveryConfig({ onComplete }: Step5Props) {
  const [config, setConfig] = useState<DeliveryConfig>({
    sql: {
      enabled: true,
      catalog: 'iceberg_prod',
      schema: 'analytics',
      tableName: '',
      format: 'iceberg',
      partitioning: 'auto'
    },
    api: {
      enabled: false,
      path: '/v1/products/',
      methods: ['GET'],
      rateLimit: 1000,
      authentication: 'api_key'
    }
  });

  return (
    <div className="space-y-6">
      {/* SQL Table (Always enabled) */}
      <Card>
        <CardHeader>
          <CardTitle>SQL Table (dbt materialized table)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catalog</Label>
              <Select
                value={config.sql.catalog}
                onValueChange={(v) => updateConfig('sql', 'catalog', v)}
              >
                <SelectItem value="iceberg_prod">iceberg_prod</SelectItem>
                <SelectItem value="iceberg_staging">iceberg_staging</SelectItem>
              </Select>
            </div>

            <div>
              <Label>Schema</Label>
              <Select
                value={config.sql.schema}
                onValueChange={(v) => updateConfig('sql', 'schema', v)}
              >
                <SelectItem value="analytics">analytics</SelectItem>
                <SelectItem value="marts">marts</SelectItem>
                <SelectItem value="staging">staging</SelectItem>
              </Select>
            </div>
          </div>

          <div>
            <Label>Table Name</Label>
            <Input
              value={config.sql.tableName}
              onChange={(e) => updateConfig('sql', 'tableName', e.target.value)}
              placeholder="customer_churn_risk"
            />
          </div>

          <div>
            <Label>Partitioning</Label>
            <Select
              value={config.sql.partitioning}
              onValueChange={(v) => updateConfig('sql', 'partitioning', v)}
            >
              <SelectItem value="auto">Auto-detect date columns</SelectItem>
              <SelectItem value="manual">Manual selection</SelectItem>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* REST API (Optional) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={config.api.enabled}
              onCheckedChange={(v) => updateConfig('api', 'enabled', v)}
            />
            <CardTitle>REST API Endpoint</CardTitle>
          </div>
        </CardHeader>
        {config.api.enabled && (
          <CardContent className="space-y-4">
            <div>
              <Label>API Path</Label>
              <Input
                value={config.api.path}
                onChange={(e) => updateConfig('api', 'path', e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Full URL: https://api.nexusone.com{config.api.path}
              </p>
            </div>

            <div>
              <Label>Rate Limit</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={config.api.rateLimit}
                  onChange={(e) => updateConfig('api', 'rateLimit', Number(e.target.value))}
                  className="w-32"
                />
                <span>requests/minute</span>
              </div>
            </div>

            {/* Generated API spec preview */}
            <div className="mt-4 p-4 bg-muted rounded">
              <Label className="text-sm font-mono">
                GET {config.api.path}{'{customer_id}'}
              </Label>
              <pre className="mt-2 text-xs">
{`Response 200:
{
  "customer_id": "cust_001",
  "churn_risk_level": "medium",
  ...
}`}
              </pre>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
```

**Frontend - Step 6: Review & Deploy**
```typescript
// components/build/steps/Step6ReviewDeploy.tsx
function Step6ReviewDeploy({
  workflow,
  onDeploy
}: Step6Props) {
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);
  const [deploymentType, setDeploymentType] = useState<'pr' | 'direct'>('pr');

  useEffect(() => {
    // Generate artifacts for preview
    api.post('/build/generate-artifacts', {
      workflow_id: workflow.id
    }).then(res => setArtifacts(res.data));
  }, []);

  async function handleDeploy() {
    const result = await api.post('/build/deploy', {
      workflow_id: workflow.id,
      deployment_type: deploymentType
    });

    if (result.data.pr_url) {
      window.open(result.data.pr_url, '_blank');
    }

    onDeploy(result.data);
  }

  return (
    <div className="space-y-6">
      {/* Deployment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold">Product:</dt>
              <dd>{workflow.definition.displayName}</dd>
            </div>
            <div>
              <dt className="font-semibold">Owner:</dt>
              <dd>{workflow.definition.owner}</dd>
            </div>
            <div>
              <dt className="font-semibold">Schedule:</dt>
              <dd>{formatSchedule(workflow.definition.schedule)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Sources:</dt>
              <dd>{workflow.sources.map(s => s.name).join(', ')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* What Will Be Created */}
      <Card>
        <CardHeader>
          <CardTitle>What Will Be Created</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {artifacts && (
            <>
              <ArtifactPreview
                icon={FileText}
                title="ODCS Contract"
                path={artifacts.contract.path}
                content={artifacts.contract.content}
              />

              <ArtifactPreview
                icon={Database}
                title="dbt Model"
                path={artifacts.dbt.path}
                content={artifacts.dbt.content}
              />

              <ArtifactPreview
                icon={Shield}
                title="Great Expectations Suite"
                path={artifacts.ge.path}
                content={artifacts.ge.content}
              />

              <ArtifactPreview
                icon={Workflow}
                title="Airflow DAG"
                path={artifacts.airflow.path}
                content={artifacts.airflow.content}
              />

              {artifacts.api && (
                <ArtifactPreview
                  icon={Server}
                  title="APIsix Route"
                  path={artifacts.api.path}
                  content={artifacts.api.content}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Deployment Options */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Options</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={deploymentType} onValueChange={setDeploymentType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pr" id="pr" />
              <Label htmlFor="pr">
                Deploy via Pull Request (Recommended)
                <p className="text-sm text-muted-foreground">
                  Create PR for team review → CI/CD tests → Merge deploys
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="direct" id="direct" />
              <Label htmlFor="direct">
                Deploy Directly (Admin only)
                <p className="text-sm text-muted-foreground">
                  Immediate deployment, skips review
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Deploy Button */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Delivery Config
        </Button>
        <Button
          onClick={handleDeploy}
          className="bg-green-600 hover:bg-green-700"
        >
          {deploymentType === 'pr' ? 'Create Pull Request' : 'Deploy Now'}
        </Button>
      </div>
    </div>
  );
}
```

**APIsix Route Generation:**
```python
# backend/services/apisix_generator.py

class APIsixGenerator:
    def generate_route_config(
        self,
        product: ProductDefinition,
        api_config: APIConfig
    ) -> str:
        """Generate APIsix route configuration"""

        config = {
            "uri": f"{api_config.path}/*",
            "name": f"{product.name}_api",
            "desc": product.description,
            "plugins": {
                "key-auth": {},
                "limit-count": {
                    "count": api_config.rate_limit,
                    "time_window": 60,
                    "rejected_code": 429
                },
                "proxy-rewrite": {
                    "regex_uri": [
                        f"^{api_config.path}/(.+)$",
                        "/trino-query?customer_id=$1"
                    ]
                },
                "trino-query": {
                    "cluster": "production",
                    "catalog": product.sql_config.catalog,
                    "schema": product.sql_config.schema,
                    "query": self._generate_query_template(product)
                }
            },
            "upstream": {
                "type": "roundrobin",
                "nodes": {
                    "trino.nexusone.com:8080": 1
                }
            }
        }

        return yaml.dump(config)

    def _generate_query_template(self, product: ProductDefinition) -> str:
        """Generate parameterized SQL for API"""
        return f"""
SELECT *
FROM {product.sql_config.schema}.{product.sql_config.table_name}
WHERE customer_id = $customer_id
        """.strip()
```

**Deliverables Week 11-12:**
- ✅ Delivery configuration UI (SQL + API)
- ✅ APIsix route generation
- ✅ Review & deploy UI
- ✅ Artifact preview components
- ✅ PR creation flow
- ✅ ODPS spec generation

### Phase 2 Success Criteria

- ✅ **50 products created** via portal
- ✅ **100% have quality rules** (Great Expectations)
- ✅ **30% use API delivery** (APIsix routes)
- ✅ **70% time savings** (4-8hrs → 1-2hrs)
- ✅ **95% quality suite adoption**
- ✅ **Zero manual ODCS/ODPS creation**

---

## Phase 3: Templates & Polish (4 Weeks)

### Week 13-14: SQL Template Library

**Template Management:**
```python
# backend/services/template_library.py

class SQLTemplateLibrary:
    TEMPLATES = {
        "aggregation": {
            "name": "Daily Aggregation",
            "description": "Aggregate metrics by key and date",
            "template": """
-- Daily aggregation by {{ key_column }}
SELECT
  {{ key_column }},
  DATE({{ timestamp_column }}) as date,
  COUNT(*) as row_count,
  COUNT(DISTINCT {{ entity_column }}) as unique_{{ entity_name }},
  SUM({{ metric_column }}) as total_{{ metric_name }},
  AVG({{ metric_column }}) as avg_{{ metric_name }}
FROM {{ ref('source_table') }}
WHERE {{ timestamp_column }} >= CURRENT_DATE - INTERVAL '{{ lookback_days }}' DAY
GROUP BY 1, 2
ORDER BY 1, 2 DESC
            """,
            "parameters": [
                {"name": "key_column", "type": "column", "required": True},
                {"name": "timestamp_column", "type": "column", "required": True},
                {"name": "entity_column", "type": "column", "required": True},
                {"name": "metric_column", "type": "column", "required": True},
                {"name": "lookback_days", "type": "number", "default": 30}
            ]
        },

        "dedupe": {
            "name": "Deduplicate Records",
            "description": "Keep most recent record per key",
            "template": """
-- Deduplicate by {{ key_column }}, keep latest
WITH ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY {{ key_column }}
      ORDER BY {{ timestamp_column }} DESC
    ) as rn
  FROM {{ ref('source_table') }}
)
SELECT {{ columns }}
FROM ranked
WHERE rn = 1
            """,
            "parameters": [
                {"name": "key_column", "type": "column", "required": True},
                {"name": "timestamp_column", "type": "column", "required": True},
                {"name": "columns", "type": "text", "default": "* EXCEPT (rn)"}
            ]
        },

        "scd2": {
            "name": "SCD Type 2",
            "description": "Slowly Changing Dimension with history",
            "template": """
-- SCD Type 2 for {{ entity_name }}
WITH source AS (
  SELECT * FROM {{ ref('source_table') }}
),
existing AS (
  SELECT * FROM {{ this }}
  WHERE is_current = true
),
changes AS (
  SELECT
    s.*,
    e.{{ natural_key }} as existing_key,
    CASE
      WHEN e.{{ natural_key }} IS NULL THEN 'INSERT'
      WHEN {{ check_scd_columns(s, e) }} THEN 'UPDATE'
      ELSE 'NO_CHANGE'
    END as change_type,
    CURRENT_TIMESTAMP as effective_from
  FROM source s
  LEFT JOIN existing e ON s.{{ natural_key }} = e.{{ natural_key }}
),
expired AS (
  SELECT
    e.*,
    CURRENT_TIMESTAMP as effective_to,
    false as is_current
  FROM existing e
  JOIN changes c ON e.{{ natural_key }} = c.{{ natural_key }}
  WHERE c.change_type = 'UPDATE'
),
new_records AS (
  SELECT
    {{ generate_surrogate_key() }} as surrogate_key,
    c.* EXCEPT (change_type),
    NULL as effective_to,
    true as is_current
  FROM changes c
  WHERE c.change_type IN ('INSERT', 'UPDATE')
)
SELECT * FROM expired
UNION ALL
SELECT * FROM new_records
            """,
            "parameters": [
                {"name": "natural_key", "type": "column", "required": True},
                {"name": "scd_columns", "type": "multi_column", "required": True},
                {"name": "entity_name", "type": "text", "required": True}
            ]
        }
    }

    def get_template(self, template_id: str) -> dict:
        return self.TEMPLATES.get(template_id)

    def render_template(
        self,
        template_id: str,
        parameters: dict
    ) -> str:
        """Render template with user parameters"""
        template_def = self.TEMPLATES[template_id]

        # Validate required parameters
        for param in template_def["parameters"]:
            if param["required"] and param["name"] not in parameters:
                raise ValueError(f"Missing required parameter: {param['name']}")

        # Render with Jinja2
        template = Template(template_def["template"])
        return template.render(**parameters)
```

**Template Selection UI:**
```typescript
// components/build/TemplateSelector.tsx
function TemplateSelector({ onSelect }: { onSelect: (sql: string) => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const templates = useQuery('/build/templates');

  async function applyTemplate() {
    const rendered = await api.post('/build/render-template', {
      template_id: selectedTemplate,
      parameters
    });
    onSelect(rendered.data.sql);
  }

  return (
    <Dialog>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose SQL Template</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          {templates.data?.map(template => (
            <Card
              key={template.id}
              className={selectedTemplate === template.id ? 'border-primary' : ''}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {selectedTemplate && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold">Template Parameters</h3>
            {templates.data
              ?.find(t => t.id === selectedTemplate)
              ?.parameters.map(param => (
                <div key={param.name}>
                  <Label>{param.name}</Label>
                  {param.type === 'column' ? (
                    <Select
                      value={parameters[param.name]}
                      onValueChange={(v) => setParameters({...parameters, [param.name]: v})}
                    >
                      {availableColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      value={parameters[param.name] || param.default || ''}
                      onChange={(e) => setParameters({...parameters, [param.name]: e.target.value})}
                    />
                  )}
                </div>
              ))}

            <Button onClick={applyTemplate}>Apply Template</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Deliverables Week 13-14:**
- ✅ SQL template library (5+ templates)
- ✅ Template parameter UI
- ✅ Template rendering engine
- ✅ Template preview
- ✅ Copy from existing product

### Week 15-16: UX Polish + Validation Improvements

**Enhanced Validation:**
```python
# backend/services/validation_service.py

class ValidationService:
    async def comprehensive_validate(
        self,
        workflow: WorkflowState
    ) -> ValidationReport:
        """Run all validations before deployment"""

        errors = []
        warnings = []

        # 1. SQL syntax validation
        sql_result = await self.validate_sql(workflow.sql)
        if not sql_result.valid:
            errors.append({
                "type": "sql_syntax",
                "message": sql_result.error,
                "line": sql_result.line
            })

        # 2. Source availability check
        for source in workflow.sources:
            exists = await datahub_client.dataset_exists(source.id)
            if not exists:
                errors.append({
                    "type": "source_not_found",
                    "message": f"Source {source.name} not found in DataHub"
                })

        # 3. Naming conflicts
        if await datahub_client.product_exists(workflow.definition.name):
            errors.append({
                "type": "name_conflict",
                "message": f"Product {workflow.definition.name} already exists"
            })

        # 4. Performance estimation
        perf = await self.estimate_performance(workflow.sql)
        if perf.estimated_rows > 100_000_000:
            warnings.append({
                "type": "performance",
                "message": f"Query may process {perf.estimated_rows:,} rows. Consider filtering."
            })

        # 5. Quality rule coverage
        if len(workflow.quality_rules) < 3:
            warnings.append({
                "type": "quality_coverage",
                "message": "Consider adding more quality checks (currently {len(workflow.quality_rules)})"
            })

        return ValidationReport(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
```

**Better Error Messages:**
```typescript
// Enhanced error display
function ValidationErrors({ errors }: { errors: ValidationError[] }) {
  return (
    <div className="space-y-2">
      {errors.map((error, i) => (
        <Alert key={i} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{getErrorTitle(error.type)}</AlertTitle>
          <AlertDescription>
            {error.message}
            {error.suggestion && (
              <div className="mt-2 text-sm">
                💡 Suggestion: {error.suggestion}
              </div>
            )}
            {error.docs_link && (
              <a href={error.docs_link} className="text-sm underline mt-2 block">
                Learn more →
              </a>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
```

**Preview Enhancements:**
```typescript
// Data visualization for preview results
function EnhancedPreview({ data }: { data: PreviewData }) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Sample Results</CardTitle>
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'table' ? (
          <DataTable columns={data.columns} data={data.rows} />
        ) : (
          <AutoChart data={data} />
        )}

        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <div>📊 {data.rowCount.toLocaleString()} rows</div>
          <div>⏱️ {data.executionTimeMs}ms</div>
          <div>💾 {formatBytes(data.sizeBytes)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Deliverables Week 15-16:**
- ✅ Comprehensive validation service
- ✅ Enhanced error messages with suggestions
- ✅ Data visualization for previews
- ✅ Performance warnings
- ✅ UX polish and animations
- ✅ Keyboard shortcuts

### Phase 3 Success Criteria

- ✅ **100+ products created**
- ✅ **50% use templates** (not writing from scratch)
- ✅ **80% adoption rate** (most products via portal)
- ✅ **User NPS >40**
- ✅ **<5% validation errors** (catch before PR)
- ✅ **Average time: 45 minutes** (down from 60)

---

## Phase 4: Advanced Features (Ongoing)

### Features to Add

**1. dbt Tests Generation** (Week 17-18)
- Automatically generate dbt schema.yml tests
- Sync with Great Expectations rules
- Custom test macros

**2. Incremental Model Support** (Week 19-20)
- SQLMesh integration
- Incremental strategies (merge, append, delete+insert)
- Partition management

**3. Multi-Step Transformations** (Week 21-22)
- CTEs and staging layers
- Dependency management
- Complex pipeline visualization

**4. Version Management** (Week 23-24)
- Product versioning (v1, v2, etc.)
- Breaking vs non-breaking changes
- Migration guides
- Deprecation warnings

**5. Product Cloning/Forking** (Week 25-26)
- Clone existing product
- Modify and create new version
- Inheritance patterns

---

## Optional Intelligence Layer (Future)

**IF we add CrewAI + OpenSPG (Phase 5+):**

### 1. Natural Language Query Assistant
```typescript
// Optional enhancement - not required for MVP
async function nlToSQL(naturalLanguage: string): Promise<SQLSuggestion> {
  const result = await crewai.analyze({
    agent: 'QueryGenerationAgent',
    input: naturalLanguage,
    context: await openspg.getSchemaContext()
  });

  return {
    sql: result.generated_sql,
    confidence: result.confidence,
    explanation: result.reasoning,
    requiresReview: result.confidence < 0.8
  };
}
```

### 2. Smart Schema Suggestions
```typescript
// Optional enhancement
async function suggestRelatedSources(
  selected: Source[]
): Promise<SourceSuggestion[]> {
  return await openspg.query(`
    MATCH (s:Dataset)-[r:JOINS_WITH|COMMONLY_USED_WITH]->(related:Dataset)
    WHERE s.name IN [${selected.map(s => s.name)}]
    RETURN related, r, COUNT(*) as usage
    ORDER BY usage DESC
  `);
}
```

### 3. Quality Rule Recommendations
```typescript
// Optional enhancement
async function recommendQualityRules(
  schema: Schema,
  sample: SampleData
): Promise<QualityRule[]> {
  return await crewai.analyze({
    agent: 'QualityAgent',
    schema,
    sample,
    context: await findSimilarProducts()
  });
}
```

**Key Point:** These are OPTIONAL enhancements. Core platform works without AI.

---

## Success Metrics

### Efficiency Metrics

**Time Savings:**
- Baseline: 4-8 hours manual
- Phase 1 Goal: 2-4 hours (50% savings)
- Phase 2 Goal: 1-2 hours (70% savings)
- Phase 3 Goal: 30-60 minutes (85% savings)

**Adoption:**
- Phase 1: 10 products created
- Phase 2: 50 products created
- Phase 3: 100+ products created
- Target: 80% of new products via portal

### Quality Metrics

**Standards Compliance:**
- 100% ODCS contracts (enforced)
- 100% ODPS specs for APIs
- 95%+ Great Expectations coverage
- 90%+ DataHub registration

**Correctness:**
- 90%+ PR approval rate (minimal changes)
- <5% validation errors
- Zero production incidents from generated code

### Business Impact

**ROI:**
- Engineering time saved: 200+ hours/month (at 100 products)
- Reduced time-to-insight: 80%
- Increased data product velocity: 3-5x
- Infrastructure cost reduction: 20% (via query optimization)

---

## Technical Stack

### Frontend
- **Framework:** React + TypeScript + Next.js
- **UI Components:** shadcn/ui
- **Code Editor:** CodeMirror 6
- **State Management:** Zustand
- **API Client:** Axios with React Query

### Backend
- **Framework:** FastAPI (Python)
- **Template Engine:** Jinja2
- **Validation:** Trino client (SQL), Pydantic (schemas)
- **Git Operations:** GitPython
- **Task Queue:** Celery + Redis (Phase 2+)

### Integrations
- **DataHub:** REST API + Python SDK
- **Trino:** REST API for validation/preview
- **Git:** GitPython for branch/commit/PR
- **GitHub:** PyGithub for PR creation
- **APIsix:** YAML config generation

### Infrastructure
- **Deployment:** Docker + Kubernetes
- **Storage:** PostgreSQL (workflow state)
- **Cache:** Redis
- **CI/CD:** GitHub Actions

---

## Risks & Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Trino validation slow | Cache validation results; async validation |
| DataHub API rate limits | Implement caching; batch requests |
| Git conflicts | Branch naming strategy; PR review process |
| Template rendering errors | Comprehensive testing; validation before render |
| SQL injection in templates | Parameterized queries; strict escaping |

### Adoption Risks

| Risk | Mitigation |
|------|------------|
| Engineers prefer manual workflow | Gradual rollout; preserve manual option |
| Template limitations | Provide escape hatch to manual editing |
| Generated code quality concerns | PR review process; comprehensive testing |
| Learning curve too steep | Extensive documentation; onboarding sessions |

---

## Conclusion

This realistic implementation plan delivers a **pragmatic code generator and workflow coordinator** that:

1. **Reduces boilerplate** by 85% (4-8hrs → 30-60min)
2. **Enforces standards** (ODCS/ODPS 100% compliance)
3. **Coordinates tools** (dbt, GE, Airflow, DataHub, APIsix)
4. **Validates configurations** against real infrastructure

**No AI magic. No over-engineering. Just practical code generation and tool orchestration.**

The platform succeeds by:
- Using proven templates (not AI)
- Validating against real systems (Trino, DataHub)
- Generating standard configs (no proprietary formats)
- Following GitOps workflows (PR-based deployment)

**Timeline:**
- Phase 1 (8 weeks): Core workflow
- Phase 2 (6 weeks): Quality & delivery
- Phase 3 (4 weeks): Templates & polish
- Phase 4+ (ongoing): Advanced features

**Total: 18 weeks to full production platform**
