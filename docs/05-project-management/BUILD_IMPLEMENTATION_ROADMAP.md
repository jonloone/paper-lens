# NexusOne Build Page: Implementation Roadmap
*Generated: 2025-09-30*

## Executive Summary

This roadmap outlines the implementation plan to make the Build page vision operational. Current completion: **15%**. Target: **MVP operational in 12-16 weeks**.

---

## Phase 1: Foundation (Weeks 1-4)
**Goal**: Implement ODCS/ODPS contract system and basic code generation

### Week 1-2: Contract System (ODCS/ODPS)

#### 1.1 ODCS Schema Implementation
**File**: `lib/schemas/odcs-contract.ts`

```typescript
// Open Data Contract Standard v4.0 implementation
interface ODCSContract {
  version: string;
  name: string;
  namespace: string;
  owner: ContactInfo;

  // Core contract definition
  schema: SchemaDefinition[];
  quality: QualityRequirements;
  sla: SLADefinition;

  // Metadata
  metadata: {
    business_context: string;
    stakeholders: string[];
    use_cases: string[];
    tags: string[];
  };

  // Lineage
  sources: SourceDefinition[];
  transformations: TransformationLogic;
}
```

**Tasks**:
- [ ] Define TypeScript interfaces for ODCS v4.0
- [ ] Implement contract validation logic
- [ ] Create contract versioning system (semantic versioning)
- [ ] Build contract serialization (YAML/JSON)

**Files to Create**:
- `lib/schemas/odcs-contract.ts`
- `lib/validators/contract-validator.ts`
- `lib/services/contract-version-manager.ts`

---

#### 1.2 ODPS Schema Implementation
**File**: `lib/schemas/odps-product.ts`

```typescript
// Open Data Product Standard implementation
interface ODPSProduct {
  product_id: string;
  contract_reference: {
    contract_name: string;
    contract_version: string;
  };

  // Delivery configuration
  delivery: {
    method: 'batch' | 'api' | 'stream';
    schedule?: string;
    interface: InterfaceDefinition;
  };

  // SLA specific to this product
  sla: ProductSLA;

  // Cost and monitoring
  cost: CostEstimate;
  monitoring: MonitoringConfig;
}
```

**Tasks**:
- [ ] Define TypeScript interfaces for ODPS
- [ ] Implement product-to-contract linking
- [ ] Create product deployment configs
- [ ] Build product monitoring setup

**Files to Create**:
- `lib/schemas/odps-product.ts`
- `lib/services/product-manager.ts`
- `lib/services/product-deployment.ts`

---

#### 1.3 Folder Structure Setup

**Directory Structure**:
```
data-products/
├── contracts/              # ODCS contracts
│   ├── README.md
│   └── [domain]/
│       └── v[version]/
│           ├── contract.yaml
│           └── metadata.json
│
├── products/              # ODPS products
│   └── [domain]/
│       └── [delivery-type]/
│           └── v[version]/
│               ├── product.yaml
│               └── [implementation-files]
│
└── implementations/       # Generated code
    └── [domain]/
        ├── dbt/
        ├── sqlmesh/
        ├── airflow/
        └── quality/
```

**Tasks**:
- [ ] Create folder structure
- [ ] Add README templates
- [ ] Setup Git integration
- [ ] Create example contracts/products

**Files to Create**:
- `data-products/contracts/README.md`
- `data-products/products/README.md`
- `data-products/implementations/README.md`

---

### Week 3-4: Basic Code Generation

#### 1.4 dbt Generator
**File**: `lib/generators/dbt-generator.ts`

```typescript
class DBTGenerator {
  generateModel(contract: ODCSContract): string {
    // Generate dbt model SQL
    return `
      {{ config(
        materialized='${this.getMaterialization(contract)}',
        schema='${contract.namespace}',
        tags=['${contract.metadata.tags.join("','")}']
      ) }}

      ${this.generateSQL(contract)}
    `;
  }

  generateTests(contract: ODCSContract): string {
    // Generate schema.yml with tests
  }

  generateDocs(contract: ODCSContract): string {
    // Generate documentation
  }
}
```

**Tasks**:
- [ ] Implement dbt model generator
- [ ] Generate schema.yml with tests
- [ ] Generate dbt_project.yml
- [ ] Create documentation generator

**Files to Create**:
- `lib/generators/dbt-generator.ts`
- `lib/templates/dbt/model.sql.template`
- `lib/templates/dbt/schema.yml.template`

---

#### 1.5 Airflow DAG Generator
**File**: `lib/generators/airflow-generator.ts`

```typescript
class AirflowDAGGenerator {
  generateDAG(product: ODPSProduct): string {
    return `
      from airflow import DAG
      from airflow.operators.bash import BashOperator
      from datetime import datetime

      dag = DAG(
        '${product.product_id}',
        schedule='${product.delivery.schedule}',
        start_date=datetime(2024, 1, 1),
        catchup=False
      )

      # Tasks generated from product config
      ${this.generateTasks(product)}
    `;
  }
}
```

**Tasks**:
- [ ] Implement DAG generator
- [ ] Generate task dependencies
- [ ] Add monitoring/alerting
- [ ] Create deployment scripts

**Files to Create**:
- `lib/generators/airflow-generator.ts`
- `lib/templates/airflow/dag.py.template`

---

## Phase 2: Quality Integration (Weeks 5-8)
**Goal**: Integrate Great Expectations and ydata-profiling

### Week 5-6: Great Expectations Integration

#### 2.1 Backend GE Service
**File**: `backend/services/great_expectations_service.py`

```python
from great_expectations.data_context import DataContext
from great_expectations.core import ExpectationSuite

class GreatExpectationsService:
    def __init__(self):
        self.context = DataContext()

    def create_suite_from_contract(self, contract: dict) -> ExpectationSuite:
        """Convert ODCS contract to GE expectation suite"""
        suite = ExpectationSuite(
            expectation_suite_name=f"{contract['name']}_v{contract['version']}"
        )

        # Add schema expectations
        for field in contract['schema']:
            suite.add_expectation({
                "expectation_type": "expect_column_to_exist",
                "kwargs": {"column": field['name']}
            })

            if field.get('required'):
                suite.add_expectation({
                    "expectation_type": "expect_column_values_to_not_be_null",
                    "kwargs": {"column": field['name'], "mostly": 0.99}
                })

        # Add quality expectations
        for rule in contract['quality']:
            suite.add_expectation(self._translate_quality_rule(rule))

        return suite

    def validate_data(self, data_path: str, suite_name: str):
        """Run validation and return results"""
        batch = self.context.get_batch({
            "path": data_path,
            "datasource": "spark_datasource"
        })

        results = self.context.run_validation_operator(
            "action_list_operator",
            assets_to_validate=[batch],
            run_name=f"validation_{datetime.now().isoformat()}"
        )

        return results
```

**Tasks**:
- [ ] Setup GE DataContext
- [ ] Implement contract→expectation compiler
- [ ] Create validation pipeline
- [ ] Add results→DataHub integration

**Files to Create**:
- `backend/services/great_expectations_service.py`
- `backend/api/validation_routes.py`
- `great_expectations/great_expectations.yml`

---

#### 2.2 Frontend GE Integration
**File**: `lib/services/quality-validation.ts`

```typescript
export async function validateContractQuality(
  contract: ODCSContract,
  dataPath: string
): Promise<ValidationResults> {
  const response = await fetch('/api/validation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract,
      data_path: dataPath,
      validation_level: 'strict'
    })
  });

  return await response.json();
}
```

**Tasks**:
- [ ] Create validation API client
- [ ] Build results display UI
- [ ] Add validation to build flow
- [ ] Implement continuous validation

**Files to Create**:
- `lib/services/quality-validation.ts`
- `components/quality/ValidationResults.tsx`
- `app/api/validation/route.ts`

---

### Week 7-8: ydata-profiling Integration

#### 2.3 Backend Profiling Service
**File**: `backend/services/profiling_service.py`

```python
from ydata_profiling import ProfileReport
import pandas as pd

class ProfilingService:
    def profile_datasource(self, source_config: dict) -> dict:
        """Generate comprehensive data profile"""
        # Load data
        df = self._load_data(source_config)

        # Generate profile
        profile = ProfileReport(
            df,
            title=f"Profile: {source_config['name']}",
            explorative=True,
            correlations={
                "pearson": {"calculate": True},
                "spearman": {"calculate": True}
            }
        )

        # Extract insights
        insights = {
            "schema": self._extract_schema(profile),
            "quality_suggestions": self._generate_quality_rules(profile),
            "data_issues": self._identify_issues(profile),
            "statistics": profile.get_description()
        }

        return insights

    def generate_contract_from_profile(self, profile: dict) -> dict:
        """Auto-generate ODCS contract from profiling results"""
        contract = {
            "schema": [],
            "quality": []
        }

        # Infer schema from profile
        for col, stats in profile['statistics'].items():
            contract['schema'].append({
                "name": col,
                "type": self._infer_type(stats),
                "required": stats['missing'] < 0.01  # < 1% missing
            })

            # Generate quality rules
            if stats['type'] == 'numeric':
                contract['quality'].append({
                    "expectation": "expect_column_values_to_be_between",
                    "column": col,
                    "min_value": stats['min'] * 0.95,
                    "max_value": stats['max'] * 1.05,
                    "source": "auto_profiling"
                })

        return contract
```

**Tasks**:
- [ ] Implement profiling execution
- [ ] Create profile→contract mapping
- [ ] Add drift detection
- [ ] Build profile storage/comparison

**Files to Create**:
- `backend/services/profiling_service.py`
- `backend/api/profiling_routes.py`
- `lib/services/profile-analyzer.ts`

---

## Phase 3: Intelligence Layer (Weeks 9-12)
**Goal**: Implement tool routing, pattern learning, and recommendations

### Week 9-10: Intelligent Tool Routing

#### 3.1 Tool Decision Framework
**File**: `lib/services/tool-router.ts`

```typescript
interface ToolDecision {
  tool: 'dbt' | 'sqlmesh';
  reason: string;
  features: string[];
  estimated_cost: number;
  estimated_performance: string;
}

class IntelligentToolRouter {
  route(contract: ODCSContract): ToolDecision {
    const factors = this.analyzeContract(contract);

    // High-volume incrementals → SQLMesh
    if (factors.dataVolume > 10_000_000 && factors.hasTimeColumn) {
      return {
        tool: 'sqlmesh',
        reason: 'Large time-series data benefits from INCREMENTAL_BY_TIME_RANGE',
        features: ['virtual_environments', 'efficient_incrementals'],
        estimated_cost: this.estimateCost('sqlmesh', factors),
        estimated_performance: '70% faster incrementals'
      };
    }

    // Critical SLAs → SQLMesh
    if (contract.sla.criticality === 'high') {
      return {
        tool: 'sqlmesh',
        reason: 'Built-in contract enforcement and audits',
        features: ['contract_validation', 'audit_framework'],
        estimated_cost: this.estimateCost('sqlmesh', factors),
        estimated_performance: '99.9% SLA achievement'
      };
    }

    // Analyst workflows → dbt
    if (contract.owner.team === 'analytics') {
      return {
        tool: 'dbt',
        reason: 'Better for rapid iteration and analyst familiarity',
        features: ['familiar_syntax', 'large_ecosystem'],
        estimated_cost: this.estimateCost('dbt', factors),
        estimated_performance: 'Standard performance'
      };
    }

    // Default to dbt
    return {
      tool: 'dbt',
      reason: 'Standard transformation pattern',
      features: ['proven', 'well_documented'],
      estimated_cost: this.estimateCost('dbt', factors),
      estimated_performance: 'Standard performance'
    };
  }
}
```

**Tasks**:
- [ ] Implement decision framework
- [ ] Add cost estimation
- [ ] Create performance predictions
- [ ] Build tool-specific generators

**Files to Create**:
- `lib/services/tool-router.ts`
- `lib/generators/sqlmesh-generator.ts`
- `lib/estimators/cost-estimator.ts`

---

### Week 11-12: Pattern Learning

#### 3.2 Pattern Extraction Engine
**File**: `lib/services/pattern-learning.ts`

```typescript
interface Pattern {
  id: string;
  business_context: {
    use_case: string;
    domain: string;
    stakeholder_type: string;
  };
  technical_pattern: {
    sources: string[];
    tool: string;
    complexity: 'simple' | 'medium' | 'complex';
    transformations: string[];
  };
  success_metrics: {
    completion_rate: number;
    average_time: number;
    quality_score: number;
    user_satisfaction: number;
  };
  reusability_score: number;
}

class PatternLearningEngine {
  async extractPattern(
    contract: ODCSContract,
    implementation: Implementation,
    outcomes: Outcomes
  ): Promise<Pattern> {
    const pattern = {
      id: generateId(),
      business_context: {
        use_case: contract.metadata.business_context,
        domain: contract.namespace,
        stakeholder_type: contract.owner.role
      },
      technical_pattern: {
        sources: contract.sources.map(s => s.name),
        tool: implementation.tool_used,
        complexity: this.assessComplexity(implementation),
        transformations: implementation.transformation_types
      },
      success_metrics: {
        completion_rate: outcomes.success ? 1.0 : 0.0,
        average_time: outcomes.duration_seconds,
        quality_score: outcomes.quality_score,
        user_satisfaction: outcomes.satisfaction_score
      },
      reusability_score: await this.calculateReusability(pattern)
    };

    // Store pattern
    await this.storePattern(pattern);

    // Update recommendation model
    await this.updateMLModel(pattern, outcomes);

    return pattern;
  }

  async findSimilarPatterns(request: BuildRequest): Promise<Pattern[]> {
    const embedding = await this.embedRequest(request);

    // Vector similarity search
    const similar = await this.vectorSearch(embedding, limit: 5);

    return similar.map(p => ({
      ...p,
      similarity_score: this.cosineSimilarity(embedding, p.embedding)
    }));
  }
}
```

**Tasks**:
- [ ] Implement pattern extraction
- [ ] Build similarity matching
- [ ] Create recommendation engine
- [ ] Add success tracking

**Files to Create**:
- `lib/services/pattern-learning.ts`
- `lib/ml/embedding-service.ts`
- `backend/services/pattern_storage.py`

---

## Phase 4: Full Orchestration (Weeks 13-16)
**Goal**: CrewAI orchestration, DataHub enrichment, feedback loops

### Week 13-14: CrewAI Orchestration

#### 4.1 Orchestration Assistant
**File**: `backend/services/orchestration_assistant.py`

```python
from crewai import Agent, Task, Crew

class OrchestrationAssistant:
    def __init__(self):
        self.analyzer = Agent(
            role='Data Requirements Analyst',
            goal='Understand business requirements and translate to technical specs',
            backstory='Expert at bridging business and technical worlds'
        )

        self.planner = Agent(
            role='Execution Planner',
            goal='Create optimal execution plan across tools',
            backstory='Knows all data tools and how to coordinate them'
        )

        self.executor = Agent(
            role='Execution Coordinator',
            goal='Execute the plan and handle errors',
            backstory='Experienced in running complex data pipelines'
        )

    def orchestrate_build(self, request: dict) -> dict:
        # Task 1: Analyze requirements
        analyze_task = Task(
            description=f"Analyze: {request['description']}",
            agent=self.analyzer
        )

        # Task 2: Create plan
        plan_task = Task(
            description="Create execution plan with tool selection",
            agent=self.planner,
            context=[analyze_task]
        )

        # Task 3: Execute
        execute_task = Task(
            description="Execute the plan and report results",
            agent=self.executor,
            context=[plan_task]
        )

        # Run crew
        crew = Crew(
            agents=[self.analyzer, self.planner, self.executor],
            tasks=[analyze_task, plan_task, execute_task]
        )

        result = crew.kickoff()

        return {
            "analysis": analyze_task.output,
            "plan": plan_task.output,
            "execution": execute_task.output
        }
```

**Tasks**:
- [ ] Implement CrewAI agents
- [ ] Build task coordination
- [ ] Add error handling
- [ ] Create execution monitoring

**Files to Create**:
- `backend/services/orchestration_assistant.py`
- `backend/agents/analyzer_agent.py`
- `backend/agents/planner_agent.py`

---

### Week 15: DataHub Enrichment

#### 4.2 DataHub Integration
**File**: `backend/services/datahub_enrichment.py`

```python
from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.metadata.schema_classes import *

class DataHubEnrichmentService:
    def __init__(self):
        self.emitter = DatahubRestEmitter(gms_server='http://localhost:8080')

    def enrich_on_build(self, contract: dict, product: dict, context: dict):
        """Enrich DataHub when data product is built"""

        # 1. Emit dataset metadata
        dataset_urn = self._create_dataset_urn(product)

        self.emitter.emit_mcp(DatasetPropertiesClass(
            description=contract['metadata']['business_context'],
            customProperties={
                'contract_version': contract['version'],
                'owner': contract['owner']['email'],
                'sla': str(contract['sla']),
                'use_cases': ','.join(contract['metadata']['use_cases'])
            }
        ))

        # 2. Emit lineage
        for source in contract['sources']:
            self.emitter.emit_mcp(UpstreamLineage(
                upstreams=[source['urn']],
                downstreams=[dataset_urn]
            ))

        # 3. Emit quality metrics
        if context.get('validation_results'):
            self.emitter.emit_mcp(DataQualityClass(
                score=context['validation_results']['success_percent'],
                assertions=context['validation_results']['expectations']
            ))

        # 4. Build glossary terms
        for term in self._extract_business_terms(context):
            self.emitter.emit_mcp(GlossaryTermClass(
                name=term['name'],
                definition=term['definition'],
                examples=[product['product_id']]
            ))
```

**Tasks**:
- [ ] Implement metadata emission
- [ ] Add lineage tracking
- [ ] Publish quality metrics
- [ ] Build glossary automation

**Files to Create**:
- `backend/services/datahub_enrichment.py`
- `lib/services/datahub-client.ts`

---

### Week 16: Feedback Loop

#### 4.3 Quality Feedback System
**File**: `backend/services/feedback_loop.py`

```python
class QualityFeedbackLoop:
    def learn_from_production(self, product_id: str):
        """Analyze production performance to improve contracts"""

        # Collect validation history
        history = self.ge_service.get_validation_history(
            product_id,
            lookback_days=30
        )

        # Analyze patterns
        patterns = {
            'recurring_failures': self._identify_recurring(history),
            'false_positives': self._identify_overly_strict(history),
            'missing_coverage': self._identify_gaps(history)
        }

        # Generate improvements
        improvements = []

        for rule in patterns['false_positives']:
            if rule.failure_rate > 0.1 and rule.business_impact == 'low':
                improvements.append({
                    'action': 'loosen_threshold',
                    'rule': rule.name,
                    'current': rule.threshold,
                    'suggested': rule.p95_threshold,
                    'reason': f'Failed {rule.failure_rate*100}% with no impact'
                })

        # Suggest contract update
        if improvements:
            self.suggest_contract_update(product_id, improvements)

        return improvements
```

**Tasks**:
- [ ] Implement validation tracking
- [ ] Add failure analysis
- [ ] Create improvement suggestions
- [ ] Build automated updates

**Files to Create**:
- `backend/services/feedback_loop.py`
- `lib/services/contract-improver.ts`

---

## Implementation Priorities

### Must-Have for MVP (Weeks 1-8)
1. ✅ ODCS/ODPS schemas and validation
2. ✅ Basic dbt code generation
3. ✅ Airflow DAG generation
4. ✅ Great Expectations integration
5. ✅ Basic profiling integration

### Important for Production (Weeks 9-12)
6. ✅ Intelligent tool routing
7. ✅ Pattern learning
8. ✅ Recommendation engine

### Nice-to-Have for V1 (Weeks 13-16)
9. ⭕ Full CrewAI orchestration
10. ⭕ Complete DataHub enrichment
11. ⭕ Automated feedback loops

---

## Success Metrics

### Technical Metrics
- Contract creation time: < 5 minutes
- Code generation accuracy: > 90%
- Quality validation coverage: > 95%
- Pattern reuse rate: > 60%

### Business Metrics
- Time to deploy data product: < 4 hours (from 2-3 days)
- Developer satisfaction: > 8/10
- First-time success rate: > 95%
- Cost optimization: 30% reduction

---

## Risk Mitigation

### Technical Risks
1. **GE Integration Complexity**
   - Mitigation: Start with simple expectations, expand gradually

2. **Tool Routing Accuracy**
   - Mitigation: Allow manual override, learn from feedback

3. **Pattern Learning Quality**
   - Mitigation: Start with manual curation, automate incrementally

### Organizational Risks
1. **Adoption Resistance**
   - Mitigation: Start with enthusiastic early adopters

2. **Tool Fragmentation**
   - Mitigation: Clear documentation on when to use each tool

---

## Next Steps

1. **Week 1**: Start with ODCS schema implementation
2. **Week 2**: Add ODPS and linking logic
3. **Week 3**: Build dbt generator
4. **Week 4**: Add Airflow generation
5. **Continue through phases...**

