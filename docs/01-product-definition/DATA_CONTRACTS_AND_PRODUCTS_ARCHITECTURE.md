# NexusOne: Data Contracts & Products Architecture
## The Complete Mental Model

**Version:** 1.0
**Last Updated:** 2025-10-13
**Status:** Canonical Reference

---

## Executive Summary

NexusOne treats **data contracts (ODCS)** and **data products (ODPS)** as fundamentally different yet complementary concepts. This separation enables:

- **Clear ownership**: Data Engineers own contracts, Platform teams optimize products
- **Cost optimization**: One contract, multiple delivery methods at different price points
- **Evolution without breaking**: Optimize delivery without changing promises
- **Governance at scale**: Approve schema changes once, affect all products consistently

**The Core Principle:**
```
Contract = WHAT data looks like + quality guarantees (ODCS)
Product = HOW to access and consume that data (ODPS)
Quality Gate = HOW to verify the contract is being honored

One Contract → Multiple Products → Continuous Quality Validation
```

---

## Part 1: Foundational Concepts

### What is a Data Contract (ODCS)?

A **data contract** is a formal promise about what data will look like and how good it will be. It's technology-agnostic and focuses purely on the data itself.

**Contract Components:**
```yaml
# Example: Customer Churn Score Contract
contract:
  name: customer_churn_score
  version: 2.0.0
  owner: jennifer.martinez@company.com

  # THE PROMISE: Schema
  schema:
    - customer_id:
        type: string
        required: true
        description: "Unique customer identifier"
    - churn_risk:
        type: float
        required: true
        range: [0, 1]
        description: "Probability of churn in next 30 days"
    - risk_factors:
        type: array<string>
        description: "Contributing factors (e.g., 'low_engagement', 'payment_issues')"
    - calculated_at:
        type: timestamp
        required: true

  # THE PROMISE: Quality
  quality:
    completeness:
      customer_id: ">99%"
      churn_risk: ">99%"
    accuracy:
      churn_risk: ">95% based on 30-day validation"
    timeliness:
      freshness: "updated_within_24_hours"
    consistency:
      churn_risk: "must_match_range_0_to_1"

  # THE PROMISE: SLA
  sla:
    availability: "99.5%"
    delivery_time: "daily_by_8am_pt"
    support_response: "4_hours_business_days"
```

**Key Characteristics:**
- ✅ **Technology-agnostic**: Doesn't specify SQL, API, or stream
- ✅ **Versioned**: Major.Minor.Patch semantic versioning
- ✅ **Governed**: Breaking changes require approval
- ✅ **Testable**: Quality rules can be automatically validated

### What is a Data Product (ODPS)?

A **data product** is a specific delivery mechanism for a contract. It defines HOW consumers access the data promised by the contract.

**Product Components:**
```yaml
# Example: Batch Product for Customer Churn Score
product:
  name: customer_churn_score_batch
  contract_ref: customer_churn_score/v2.0.0  # Links to contract

  # THE DELIVERY: How to access
  delivery:
    method: batch
    schedule: "0 8 * * *"  # Daily at 8 AM
    implementation: sqlmesh  # Or dbt, hidden from users

  # THE INTERFACE: Where to find it
  interface:
    type: sql
    location: iceberg.marketing.customer_churn_scores
    format: parquet
    partitioning: by_date

  # THE PERFORMANCE: What to expect
  performance:
    latency: "<2 hours from source update"
    throughput: "10k queries/hour"
    cost: "$50/month compute + $10/month storage"

  # THE ACCESS: Who can use it
  access:
    authentication: sso
    authorization: ranger
    consumers: ["marketing_team", "sales_ops"]
```

**Key Characteristics:**
- ✅ **Contract-linked**: Must reference a specific contract version
- ✅ **Technology-specific**: Defines actual implementation (Iceberg, Kafka, REST)
- ✅ **Performance-focused**: Optimizable without changing contract
- ✅ **Cost-attributed**: Clear cost per product

### The Critical Distinction

| Aspect | Contract (ODCS) | Product (ODPS) |
|--------|----------------|----------------|
| **What it defines** | Data schema + quality | Access method + performance |
| **Owned by** | Data Engineer / Domain team | Platform Engineering |
| **Changes require** | Governance approval if breaking | Platform optimization review |
| **Versioning** | Semantic versioning (breaking changes) | Independent versioning |
| **Examples** | "Customer 360 v2.0" | "Customer 360 SQL table", "Customer 360 REST API" |
| **Focus** | Business meaning | Technical efficiency |

---

## Part 2: The Three Product Types & Contract Relationships

### Foundation Products (Source-Aligned)

**Definition:** Raw data ingestion from source systems where the contract IS the product (1:1 relationship).

**Contract Characteristics:**
```yaml
# Foundation contracts are simple replication promises
contract:
  name: salesforce_crm_sync
  type: foundation

  schema:
    # Schema mirrors source system exactly
    - account_id: string (from Salesforce.Account.Id)
    - account_name: string (from Salesforce.Account.Name)
    - created_date: timestamp (from Salesforce.Account.CreatedDate)

  quality:
    # Quality focuses on replication integrity
    completeness: ">99.9% (all Salesforce records)"
    latency: "<5 minutes from source update"

  source:
    system: salesforce
    connection: production_crm
    tables: ["Account", "Contact", "Opportunity"]
```

**Product Strategy:**
- Usually **one product per contract** (direct replication)
- Focus: Fast, reliable data movement
- Format: Typically Iceberg table (CDC stream)
- Users: Other data engineers building downstream products

**Visual Hierarchy in Portal:**
```
Foundation Card:
1. Source Logo (HERO) ← "This is Salesforce data"
2. Product Name
3. Description
4. Schema preview
5. Replication stats (freshness, volume)
```

**Quality Gates for Foundation:**
- Schema drift detection
- Replication lag monitoring
- Completeness checks
- PII detection and masking

### Domain Products (Aggregate-Aligned)

**Definition:** Business-context aggregations where one contract can have multiple products serving different consumption patterns.

**Contract Characteristics:**
```yaml
# Domain contracts are business-focused with multiple delivery options
contract:
  name: customer_360
  type: domain

  schema:
    # Schema represents business concepts, not source systems
    - customer_id: string
    - lifetime_value: float
    - customer_segment: string
    - risk_score: float
    - last_interaction_date: timestamp

  quality:
    # Quality focuses on business accuracy
    accuracy: ">95% based on validation dataset"
    consistency: "segment must match LTV ranges"
    freshness: "updated daily by 8 AM"

  business_context:
    purpose: "Unified customer view for personalization"
    questions_answered:
      - "What is customer lifetime value?"
      - "Which customers are high risk?"
      - "When did customer last interact?"
    use_cases:
      - "Marketing campaign targeting"
      - "Customer success prioritization"
      - "Sales lead scoring"
```

**Product Strategy:**
- **Multiple products from one contract** based on consumer needs:
  - **Batch product**: Daily SQL table for analytics ($)
  - **API product**: On-demand lookups for applications ($$)
  - **Stream product**: Real-time updates for event processing ($$$)

**Example Multi-Product Architecture:**
```
Customer 360 Contract v3.0
├── Batch Product v1.0
│   ├── Delivery: Daily refresh at 8 AM
│   ├── Interface: iceberg.domain.customer_360
│   ├── Cost: $50/month
│   └── Consumers: Analysts, BI tools
│
├── API Product v1.0
│   ├── Delivery: On-demand with 1-hour cache
│   ├── Interface: GET /api/v1/customers/{id}
│   ├── Cost: $0.10 per 1k requests
│   └── Consumers: Web apps, microservices
│
└── Stream Product v1.0 (optional)
    ├── Delivery: Real-time CDC
    ├── Interface: kafka.domain.customer_360_changes
    ├── Cost: $200/month
    └── Consumers: Real-time personalization
```

**Visual Hierarchy in Portal:**
```
Domain Card:
1. Product Title (HERO) ← "This is Customer 360 data"
2. Description (business context)
3. Badges (Production, Freshness)
4. Available Products:
   • Batch Table ($) - For analytics
   • REST API ($$) - For applications
   • Kafka Stream ($$$) - For real-time
5. Small source icons in footer (secondary)
```

**Quality Gates for Domain:**
- Business rule validation (segment logic)
- Cross-source consistency checks
- Aggregation accuracy tests
- Referential integrity across sources

### Solution Products (Consumer-Aligned)

**Definition:** Ready-to-use capabilities (ML models, APIs, dashboards) where the contract is the interface specification, not the data schema.

**Contract Characteristics:**
```yaml
# Solution contracts are API/interface-focused
contract:
  name: customer_churn_predictor
  type: solution
  format: ml_model

  interface:
    # Input schema
    input:
      - customer_id: string (required)
      - features: object (optional - auto-populated if not provided)

    # Output schema
    output:
      - customer_id: string
      - churn_probability: float [0, 1]
      - risk_factors: array<string>
      - confidence_score: float [0, 1]
      - prediction_timestamp: timestamp

  quality:
    # Quality focuses on model performance
    accuracy: ">94% on validation set"
    precision: ">92% for high-risk predictions"
    latency: "<100ms p99"

  business_context:
    capability: "Predicts customer churn in next 30 days"
    use_cases:
      - "Proactive retention campaigns"
      - "Customer success team prioritization"
      - "Real-time churn alerts"
```

**Product Strategy:**
- **One product per contract** (the capability IS the product)
- Focus: What it does, not where data comes from
- Format: API endpoint, dashboard URL, model endpoint
- Users: Business users, product managers, application developers

**Visual Hierarchy in Portal:**
```
Solution Card:
1. Product Title (HERO) ← "This predicts churn"
2. Description (what it does)
3. Badges (ML Model, Real-time)
4. Value proposition (accuracy, use cases)
5. NO source systems shown (abstracted away)
```

**Quality Gates for Solution:**
- Model accuracy monitoring
- API latency and availability
- Input validation
- Output quality checks (no nulls, valid ranges)

---

## Part 3: Quality Gates Integration

### The Quality Gate Framework

Quality gates are **continuous validations** that ensure data contracts are being honored. They bridge contracts and products by verifying promises at multiple checkpoints.

**Quality Gate Hierarchy:**
```
Contract Quality Promises (ODCS)
    ↓
Quality Gate Definitions (What to check)
    ↓
Product-Specific Implementations (How to check)
    ↓
Continuous Monitoring (When to check)
    ↓
Alerting & Governance (What to do when violated)
```

### Contract-Level Quality Gates

Quality gates are **defined at the contract level** but **executed at the product level**.

**Example: Customer Churn Score Contract**
```yaml
contract:
  name: customer_churn_score
  version: 2.0.0

  quality_gates:
    # Gate 1: Schema Validation
    - name: schema_integrity
      type: schema_check
      severity: blocker
      rules:
        - customer_id: must_exist, must_be_string
        - churn_risk: must_exist, must_be_float, must_be_in_range_0_to_1
        - risk_factors: must_be_array
      execution: pre_deployment, continuous

    # Gate 2: Completeness
    - name: data_completeness
      type: completeness_check
      severity: blocker
      rules:
        - customer_id: null_rate < 0.1%
        - churn_risk: null_rate < 0.1%
      threshold: 99.9%
      execution: post_ingestion, hourly

    # Gate 3: Accuracy Validation
    - name: model_accuracy
      type: accuracy_check
      severity: warning
      rules:
        - churn_risk: validate_against_30day_outcomes
        - accuracy_threshold: ">95%"
      execution: daily

    # Gate 4: Freshness
    - name: data_freshness
      type: timeliness_check
      severity: blocker
      rules:
        - calculated_at: max_age < 24_hours
        - sla_deadline: 8_00_AM_PT
      execution: continuous

    # Gate 5: Business Rules
    - name: business_logic
      type: consistency_check
      severity: warning
      rules:
        - if churn_risk > 0.7, risk_factors must not be empty
        - if churn_risk < 0.1, risk_factors length <= 2
      execution: post_transformation
```

### Product-Specific Quality Gate Execution

Each product implements the contract's quality gates appropriate to its delivery method:

**Batch Product Implementation:**
```python
# Customer Churn Batch Product - Quality Gate Integration
class CustomerChurnBatchProduct:
    contract_version = "2.0.0"

    def execute_quality_gates(self):
        gates = self.contract.quality_gates

        # Pre-deployment gates (before data goes live)
        self.run_gate(gates['schema_integrity'], stage='pre_deployment')
        self.run_gate(gates['data_completeness'], stage='pre_deployment')

        if not self.all_blocker_gates_passed():
            self.halt_deployment()
            self.notify_owner("Blocker quality gates failed")
            return

        # Deploy data
        self.deploy_to_production()

        # Post-deployment gates (after data is live)
        self.run_gate(gates['data_freshness'], stage='post_deployment')
        self.run_gate(gates['business_logic'], stage='post_deployment')

        # Warning gates don't block, but notify
        if self.has_warning_violations():
            self.notify_owner("Warning quality gates violated", severity='warning')

        # Schedule continuous monitoring
        self.schedule_continuous_gates([
            gates['data_completeness'],  # Every hour
            gates['data_freshness'],     # Every 15 min
            gates['model_accuracy']      # Daily
        ])
```

**API Product Implementation:**
```python
# Customer Churn API Product - Quality Gate Integration
class CustomerChurnAPIProduct:
    contract_version = "2.0.0"

    def handle_request(self, customer_id):
        # Pre-request validation (Gate 1: Schema)
        if not self.validate_input_schema(customer_id):
            return 400, "Invalid request format"

        # Fetch prediction
        prediction = self.get_prediction(customer_id)

        # Post-request validation (Gate 3: Accuracy confidence)
        if prediction['confidence_score'] < 0.8:
            self.log_warning("Low confidence prediction", customer_id)

        # Continuous monitoring (Gate 4: Latency)
        latency = time.time() - request_start
        if latency > 0.1:  # 100ms p99 SLA
            self.metrics.record_sla_violation('latency', latency)

        # Output validation (Gate 1: Schema + Gate 5: Business rules)
        if not self.validate_output_schema(prediction):
            self.metrics.record_error('output_validation_failed')
            return 500, "Internal error"

        return 200, prediction
```

### Quality Gate Execution Timeline

**Build Phase (Step 6: Quality Gates in Build Flow):**
```
┌─── Build Step 6: Quality Gates & Review ─────────────────────────┐
│                                                                   │
│ Running contract validation for customer_churn_score v2.0...     │
│                                                                   │
│ ✅ Gate 1: Schema Integrity                                      │
│    • customer_id: string ✓                                       │
│    • churn_risk: float[0,1] ✓                                   │
│    • risk_factors: array<string> ✓                              │
│    Passed in 0.3s                                                │
│                                                                   │
│ ✅ Gate 2: Data Completeness (Test dataset)                      │
│    • customer_id: 100% complete ✓                               │
│    • churn_risk: 99.97% complete ✓ (threshold: 99%)            │
│    Passed in 1.2s                                                │
│                                                                   │
│ ⚠️  Gate 3: Model Accuracy                                       │
│    • Accuracy: 94.2% (threshold: 95%)                           │
│    • Warning: Slightly below target                              │
│    • Note: Test dataset small, monitor in production            │
│    Passed with warnings in 5.4s                                  │
│                                                                   │
│ ✅ Gate 4: Freshness (Simulated)                                 │
│    • Sample data < 24h old ✓                                    │
│    Passed in 0.1s                                                │
│                                                                   │
│ ✅ Gate 5: Business Rules                                        │
│    • High risk → non-empty factors ✓                            │
│    • Low risk → few factors ✓                                   │
│    Passed in 0.8s                                                │
│                                                                   │
│ 📊 Summary: 5/5 gates passed (1 warning)                         │
│                                                                   │
│ [Deploy to Production] [Review Warnings] [Adjust Gates]         │
└───────────────────────────────────────────────────────────────────┘
```

**Operations Phase (Continuous Monitoring):**
```
┌─── Operations: Contract Health - customer_churn_score v2.0 ──────┐
│                                                                   │
│ Quality Gate Status (Last 24 hours)                              │
│                                                                   │
│ ✅ Schema Integrity                                              │
│    • Executions: 1,440 (every minute)                           │
│    • Pass rate: 100%                                             │
│    • Last check: 30 seconds ago                                  │
│                                                                   │
│ ✅ Data Completeness                                             │
│    • Executions: 24 (hourly)                                    │
│    • Pass rate: 100%                                             │
│    • Avg completeness: 99.94%                                    │
│                                                                   │
│ ⚠️  Model Accuracy                                               │
│    • Executions: 1 (daily)                                       │
│    • Current: 93.8% ⬇️ (threshold: 95%)                         │
│    • Trend: Declining (was 96.1% last week)                     │
│    • Alert sent to: jennifer.martinez@company.com               │
│    [View Trends] [Retrain Model] [Acknowledge]                  │
│                                                                   │
│ ✅ Data Freshness                                                │
│    • Executions: 96 (every 15 min)                              │
│    • Pass rate: 97.9% (2 SLA misses)                            │
│    • Last update: 7:58 AM (met 8 AM SLA)                        │
│                                                                   │
│ ✅ Business Rules                                                │
│    • Executions: 24 (post each batch)                           │
│    • Pass rate: 100%                                             │
│    • Violations: 0                                               │
│                                                                   │
│ Products Affected: 3 (Batch, API, Stream)                        │
│ Overall Contract Health: ⚠️ Degraded (accuracy issue)            │
│                                                                   │
│ [View All Gates] [Edit Gate Thresholds] [Historical Trends]     │
└───────────────────────────────────────────────────────────────────┘
```

### Quality Gate Categories by Product Type

**Foundation Products:**
| Gate Type | Purpose | Example |
|-----------|---------|---------|
| **Schema Drift** | Detect source changes | Salesforce added new field |
| **Replication Lag** | Ensure freshness | CDC delay < 5 minutes |
| **Completeness** | No data loss | 100% of source records present |
| **PII Detection** | Security compliance | Mask SSN, credit cards |

**Domain Products:**
| Gate Type | Purpose | Example |
|-----------|---------|---------|
| **Business Rules** | Validate logic | Customer segment matches LTV range |
| **Cross-Source Consistency** | Data integrity | Orders match transactions |
| **Aggregation Accuracy** | Calculation correctness | SUM(orders) = total_revenue |
| **Referential Integrity** | No orphans | All customer_ids exist in customer table |

**Solution Products:**
| Gate Type | Purpose | Example |
|-----------|---------|---------|
| **Model Performance** | ML accuracy | Churn prediction >94% accurate |
| **API Latency** | Response time | p99 < 100ms |
| **Input Validation** | Prevent bad requests | customer_id must be valid UUID |
| **Output Quality** | Response correctness | Predictions in valid range [0,1] |

---

## Part 4: Portal Experience by Persona

### Data Engineer View

**Discover Page:**
```
┌─── Discover: Contracts & Products ───────────────────────────────┐
│                                                                   │
│ View as: [Data Engineer] ← Shows technical details               │
│                                                                   │
│ Foundation Products (Source-aligned)                             │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ 🗄️ [Salesforce Logo - LARGE]                            │     │
│ │    Salesforce CRM Production                            │     │
│ │    23 tables • 2.3M records • Real-time CDC             │     │
│ │                                                          │     │
│ │ salesforce_crm_sync v1.2                                │     │
│ │ Real-time replication of Salesforce production...       │     │
│ │                                                          │     │
│ │ Contract: v1.2.0 | Schema: 156 columns                  │     │
│ │ Quality: 99.8% complete | Lag: <5 min                   │     │
│ │ [View Schema] [Quality History] [Browse Tables]         │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│ Domain Products (Aggregate-aligned)                              │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ Customer 360 Dataset                                     │     │
│ │ Unified customer view combining CRM, transactions...     │     │
│ │                                                          │     │
│ │ Contract: v3.0 (Production)                              │     │
│ │ Schema: 24 columns | Quality: 96.4% | Daily refresh     │     │
│ │                                                          │     │
│ │ Available Products:                                      │     │
│ │ • iceberg.domain.customer_360 (Batch - $50/mo)          │     │
│ │ • GET /api/v1/customers/{id} (API - $0.10/1k)           │     │
│ │ • kafka.customer_360_changes (Stream - $200/mo)         │     │
│ │                                                          │     │
│ │ Sources: [SF icon][Stripe icon][Zendesk icon]           │     │
│ │ [View Contract] [Add Product] [Quality Gates]           │     │
│ └─────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
```

**Build Page:**
```
┌─── Build: Create Data Product ───────────────────────────────────┐
│                                                                   │
│ Step 1: Define Your Need                                         │
│ "Daily customer churn scores for marketing campaigns"            │
│                                                                   │
│ 🔍 Checking for existing contracts...                            │
│                                                                   │
│ ✅ Found matching contract: customer_churn_score v2.0           │
│                                                                   │
│ Do you want to:                                                  │
│ ○ Add new product to existing contract (Recommended)            │
│   → Reuses proven schema and quality rules                      │
│   → Marketing team already uses this contract via API           │
│   → You'll create a new batch delivery method                   │
│                                                                   │
│ ○ Create new contract version (v3.0)                            │
│   → Only if schema/quality needs change                         │
│   → Requires governance review for breaking changes             │
│                                                                   │
│ ○ Create entirely new contract                                  │
│   → Starting from scratch                                        │
│                                                                   │
│ [Add Product to v2.0] [Create v3.0] [Start New]                 │
└───────────────────────────────────────────────────────────────────┘
```

**Operations Page:**
```
┌─── Operations: Contract Health ──────────────────────────────────┐
│                                                                   │
│ View: [By Contract] ← Primary view for engineers                 │
│                                                                   │
│ ⚠️ Contracts Requiring Attention (2)                             │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ customer_churn_score v2.0                                │     │
│ │ ⚠️ Quality Gate Failure: Model Accuracy 93.8% (↓ from 96.1%) │     │
│ │                                                          │     │
│ │ Impact:                                                  │     │
│ │ • Batch product: Deployed (warning logged)              │     │
│ │ • API product: Serving with low confidence flag         │     │
│ │ • Stream product: Real-time warnings triggered          │     │
│ │                                                          │     │
│ │ Root cause analysis:                                     │     │
│ │ • Upstream data drift detected in feature_store         │     │
│ │ • Model training date: 45 days ago (stale)              │     │
│ │                                                          │     │
│ │ Recommended actions:                                     │     │
│ │ 1. Retrain model with recent data                       │     │
│ │ 2. Update quality gate threshold temporarily            │     │
│ │ 3. Notify consumers of accuracy degradation             │     │
│ │                                                          │     │
│ │ [Edit Contract] [Retrain Model] [Notify Consumers]      │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│ ✅ Healthy Contracts (45)                                        │
│ [Filter] [Export] [Create Report]                               │
└───────────────────────────────────────────────────────────────────┘
```

### Governance/Compliance View

**Operations Page - Governance Mode:**
```
┌─── Governance: Contract Compliance Dashboard ────────────────────┐
│                                                                   │
│ View: [Governance Review Queue]                                  │
│                                                                   │
│ 📋 Pending Reviews (3)                                           │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ customer_360 v3.0 → v4.0 (BREAKING CHANGE)              │     │
│ │                                                          │     │
│ │ Requested by: jennifer.martinez@company.com             │     │
│ │ Date: Oct 13, 2025                                      │     │
│ │                                                          │     │
│ │ Changes:                                                 │     │
│ │ ✅ Added: customer_lifetime_value_v2 (float)            │     │
│ │ 🚨 Removed: customer_lifetime_value (BREAKING)          │     │
│ │ ⚠️  Modified: risk_score calculation logic              │     │
│ │                                                          │     │
│ │ Impact Analysis:                                         │     │
│ │ • 8 products affected                                    │     │
│ │ • 23 consumers notified                                  │     │
│ │ • 4 teams need to update queries                        │     │
│ │                                                          │     │
│ │ Compliance Checks:                                       │     │
│ │ ✅ Migration guide provided                              │     │
│ │ ✅ 90-day deprecation period set                         │     │
│ │ ✅ Breaking change documented with rationale            │     │
│ │ ✅ Quality gates updated                                 │     │
│ │ ⏳ Stakeholder approvals: 2/3                            │     │
│ │                                                          │     │
│ │ Quality Gate Changes:                                    │     │
│ │ • Added: ltv_v2_range_check (0 to 1M)                   │     │
│ │ • Modified: accuracy_threshold (95% → 96%)              │     │
│ │                                                          │     │
│ │ [Approve] [Request Changes] [View Full Diff]            │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│ 🚨 Policy Violations (1)                                         │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ payment_details v1.0                                     │     │
│ │ 🚨 Missing PII classification                            │     │
│ │ Severity: High | Grace period: 4 days remaining         │     │
│ │                                                          │     │
│ │ Quality Gates Affected:                                  │     │
│ │ ⚠️  PII masking not configured                           │     │
│ │ ⚠️  Access logs incomplete                               │     │
│ │                                                          │     │
│ │ [Classify Data] [Configure Masking] [Escalate]          │     │
│ └─────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
```

### Analyst View

**Discover Page:**
```
┌─── Discover: Data Products ──────────────────────────────────────┐
│                                                                   │
│ View as: [Analyst] ← Shows business context                     │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ Customer 360 Dataset                                     │     │
│ │                                                          │     │
│ │ Get a complete view of customer behavior, value,        │     │
│ │ and engagement across all touchpoints                   │     │
│ │                                                          │     │
│ │ What you can answer:                                     │     │
│ │ • Which customers are most valuable?                    │     │
│ │ • How do customers interact across channels?            │     │
│ │ • Who is at risk of churning?                           │     │
│ │                                                          │     │
│ │ How to access:                                           │     │
│ │ SELECT * FROM iceberg.domain.customer_360               │     │
│ │                                                          │     │
│ │ Popular columns:                                         │     │
│ │ • customer_id, lifetime_value, risk_score               │     │
│ │                                                          │     │
│ │ Quality: ⭐⭐⭐⭐⭐ 96% (High)                             │     │
│ │ Updated: Daily at 8 AM                                  │     │
│ │ Owner: Data Platform Team                               │     │
│ │                                                          │     │
│ │ [View Sample Data] [Copy Query] [Request Access]        │     │
│ └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│ 💡 Tip: Quality gates ensure this data is >96% accurate         │
│         and refreshed daily. Check Operations for SLA status.   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Complete Workflows

### Workflow 1: Creating a New Domain Product

**Scenario:** Marketing needs customer churn scores for campaign targeting.

**Step-by-Step:**

```
1. Request Intake (Build Page)
   ↓
   User: "I need daily customer churn scores by 8 AM for targeting"
   AI: Analyzes request, extracts requirements
   ↓

2. Contract Discovery
   ↓
   System: Searches for existing contracts matching "customer churn"
   Found: customer_churn_score v2.0 (used by Sales team)
   ↓
   Prompt: "Reuse existing contract or create new?"
   Decision: Reuse v2.0 (same data, different delivery)
   ↓

3. Product Definition
   ↓
   Contract: customer_churn_score v2.0 (schema + quality already defined)
   New Product: customer_churn_batch_marketing
   Delivery: Daily batch at 8 AM via Iceberg
   Tool Selection: SQLMesh (automatically chosen for time-range incremental)
   ↓

4. Quality Gate Setup (Inherited from Contract)
   ↓
   Gate 1: Schema integrity (customer_id, churn_risk, etc.)
   Gate 2: Completeness >99%
   Gate 3: Accuracy >95%
   Gate 4: Freshness <24h, delivered by 8 AM
   Gate 5: Business rules (risk ranges, factor logic)
   ↓

5. Implementation Generation
   ↓
   System generates:
   - SQLMesh model with incremental_by_time_range
   - Great Expectations validation suite
   - Airflow DAG for 8 AM execution
   - DataHub metadata registration
   ↓

6. Quality Gate Validation (Build Step 6)
   ↓
   Run gates on test dataset:
   ✅ Schema integrity: Passed
   ✅ Completeness: 99.97% (passed)
   ⚠️  Accuracy: 94.2% (warning, close to 95%)
   ✅ Freshness: Simulated 8 AM delivery
   ✅ Business rules: All passed
   ↓
   Result: 5/5 gates passed (1 warning acceptable)
   ↓

7. Deployment
   ↓
   Deploy to dev → Run quality gates → Pass
   Deploy to staging → Run quality gates → Pass
   Deploy to prod → Run quality gates → Pass
   ↓
   Product live: iceberg.marketing.customer_churn_scores
   ↓

8. Continuous Monitoring (Operations)
   ↓
   - Schema check: Every minute
   - Completeness: Hourly
   - Accuracy: Daily validation
   - Freshness: Every 15 minutes
   - Business rules: Post each batch
   ↓
   Alerts sent if any gate fails
```

**Key Points:**
- ✅ **Reused contract** = no governance review needed
- ✅ **Added new product** = new delivery method for existing promise
- ✅ **Quality gates inherited** from contract automatically
- ✅ **Tool selection hidden** from user (SQLMesh chosen by system)
- ✅ **Continuous monitoring** starts immediately after deployment

### Workflow 2: Breaking Contract Change

**Scenario:** Data Science improves churn model, changes schema.

**Step-by-Step:**

```
1. Engineer Proposes Change (Operations Page)
   ↓
   Navigate to: customer_churn_score v2.0 contract
   Click: "Edit Contract"
   ↓
   Changes:
   ✅ Added: confidence_score (float) - NEW FIELD
   ✅ Modified: churn_risk calculation - LOGIC CHANGE
   🚨 Removed: deprecated_score (float) - BREAKING CHANGE
   ↓
   System detects: BREAKING CHANGE (field removal)
   ↓

2. Impact Analysis (Automatic)
   ↓
   System scans all products using v2.0:
   - Batch product: 3 consumers query deprecated_score
   - API product: 2 applications use deprecated_score
   - Stream product: 1 real-time pipeline depends on it
   ↓
   Impact: 6 consumers across 3 products must update
   ↓

3. Governance Requirements Enforced
   ↓
   System requires:
   ☐ Document reason for breaking change
   ☐ Provide migration guide
   ☐ Set deprecation timeline (min 30 days)
   ☐ Notify all consumers
   ☐ Get stakeholder approvals (3/3 required)
   ☐ Update quality gates
   ↓
   Engineer completes checklist:
   ✅ Reason: "Improved model accuracy requires new scoring method"
   ✅ Migration: "Replace deprecated_score with confidence_score"
   ✅ Timeline: "90-day deprecation (both fields available)"
   ✅ Notifications: Sent to all 6 consumers
   ☐ Approvals: Waiting for stakeholders
   ↓

4. Quality Gate Updates
   ↓
   Engineer updates contract quality gates:
   ✅ Added: confidence_score_range_check (0 to 1)
   ✅ Modified: accuracy threshold (95% → 96% with new model)
   ✅ Removed: deprecated_score checks (after 90 days)
   ↓

5. Governance Review (Operations - Governance View)
   ↓
   Governance sees:
   - Breaking change details
   - Impact analysis (6 consumers)
   - Migration plan
   - Quality gate changes
   ↓
   Stakeholder approvals:
   ✅ Data Engineering Lead: Approved
   ✅ Marketing Team Lead: Approved (consumers updated)
   ✅ Platform Team: Approved (deployment plan clear)
   ↓
   All approvals received
   ↓

6. Dual-Version Deployment
   ↓
   v2.0: Remains active with deprecation warning
   v3.0: Deployed alongside v2.0
   ↓
   Both versions run for 90 days:
   - Old products continue using v2.0
   - New products can use v3.0
   - Consumers migrate at their pace
   ↓
   Quality gates run on BOTH versions:
   v2.0: Old gates continue
   v3.0: New gates with confidence_score
   ↓

7. Migration Tracking (Operations)
   ↓
   Dashboard shows:
   - v2.0: 6 consumers (migration deadline: Jan 10, 2026)
   - v3.0: 2 consumers (early adopters)
   ↓
   30 days before deadline: Escalation warnings
   ↓

8. Deprecation Completion
   ↓
   After 90 days:
   - All consumers migrated to v3.0
   - v2.0 marked as deprecated
   - Quality gates stopped for v2.0
   - v2.0 removed from production
```

**Key Points:**
- 🚨 **Breaking changes require governance** approval
- ✅ **Impact analysis automatic** (system knows all consumers)
- ✅ **Dual-version support** for migration period
- ✅ **Quality gates updated** with contract
- ✅ **Migration tracked** with deadlines and notifications

### Workflow 3: Quality Gate Failure Response

**Scenario:** Model accuracy drops below SLA.

**Step-by-Step:**

```
1. Continuous Monitoring Detects Failure
   ↓
   Contract: customer_churn_score v2.0
   Quality Gate: model_accuracy
   Threshold: >95%
   Actual: 93.8% (↓ from 96.1%)
   Severity: Warning (not blocker)
   ↓

2. Immediate Actions (Automated)
   ↓
   Products affected:
   - Batch: Latest run deployed with warning logged
   - API: Responses include low_confidence flag
   - Stream: Real-time accuracy warnings emitted
   ↓
   Alerts sent:
   - Email to contract owner: jennifer.martinez@company.com
   - Slack to #data-quality channel
   - Dashboard updated in Operations
   ↓

3. Engineer Investigation (Operations Page)
   ↓
   Navigate to: customer_churn_score contract health
   View: Quality gate failure details
   ↓
   Root cause analysis shows:
   - Upstream feature_store data drift detected
   - Model last trained: 45 days ago (getting stale)
   - Recent customer behavior shift (economic changes)
   ↓
   Recommended actions:
   1. Retrain model with last 30 days data
   2. Update quality gate threshold temporarily (93% → 96%)
   3. Notify consumers of temporary accuracy degradation
   ↓

4. Short-Term Fix
   ↓
   Engineer clicks: "Adjust Quality Gate"
   ↓
   Temporary change:
   - Old threshold: >95%
   - New threshold: >93% (with 7-day expiration)
   - Reason: "Model retraining in progress"
   ↓
   System automatically:
   - Updates gate for all 3 products
   - Notifies stakeholders of temporary change
   - Sets reminder to revert after 7 days
   ↓

5. Long-Term Fix
   ↓
   Engineer triggers: "Retrain Model"
   ↓
   Retraining pipeline:
   - Fetch last 30 days customer data
   - Retrain churn model
   - Validate on holdout set
   - Quality gate pre-check before deployment
   ↓
   New model accuracy: 96.8% ✅
   ↓

6. Deployment with Quality Validation
   ↓
   Deploy new model to batch product:
   - Gate 1: Schema integrity ✅
   - Gate 2: Completeness ✅
   - Gate 3: Accuracy 96.8% ✅ (exceeds 95%)
   - Gate 4: Freshness ✅
   - Gate 5: Business rules ✅
   ↓
   All gates pass, model deployed
   ↓

7. Revert Temporary Threshold
   ↓
   System automatically:
   - Reverts threshold to >95%
   - Notifies stakeholders of fix completion
   - Updates Operations dashboard to ✅ Healthy
   ↓

8. Post-Incident Learning
   ↓
   System captures pattern:
   - Issue: Model staleness causing accuracy drift
   - Solution: Retraining with recent data
   - Prevention: Add new quality gate for "model_age < 30_days"
   ↓
   Recommend to other ML contracts:
   "Add model staleness check based on customer_churn success"
```

**Key Points:**
- ⚡ **Immediate detection** via continuous monitoring
- 🚨 **Automated alerting** to owners and stakeholders
- ⚙️ **Flexible response** (temporary threshold adjustment)
- ✅ **Quality-gated deployment** prevents bad model rollout
- 📚 **Pattern learning** improves future quality gates

---

## Part 6: Technical Implementation Details

### Data Storage Structure

```
/data-products/
├── contracts/                        # ODCS definitions
│   └── customer_churn_score/
│       ├── v1.0.0/
│       │   ├── contract.yaml         # Schema + quality promises
│       │   ├── quality_gates.yaml    # Gate definitions
│       │   └── changelog.md          # Version history
│       ├── v2.0.0/
│       │   ├── contract.yaml
│       │   ├── quality_gates.yaml    # Inherited + new gates
│       │   ├── migration_guide.md    # For consumers
│       │   └── governance_approval.json
│       └── v3.0.0/
│           ├── contract.yaml
│           ├── quality_gates.yaml
│           ├── breaking_changes.md
│           └── deprecation_plan.yaml
│
├── products/                         # ODPS implementations
│   └── customer_churn_score/
│       ├── batch_marketing/
│       │   └── v1.0.0/
│       │       ├── product.yaml      # References contract v2.0.0
│       │       ├── sqlmesh_model.sql
│       │       ├── airflow_dag.py
│       │       └── quality_tests.py  # Executes contract gates
│       ├── api_realtime/
│       │   └── v1.0.0/
│       │       ├── product.yaml      # References contract v2.0.0
│       │       ├── fastapi_endpoint.py
│       │       ├── apisix_config.yaml
│       │       └── quality_middleware.py
│       └── stream_events/
│           └── v1.0.0/
│               ├── product.yaml      # References contract v2.0.0
│               ├── kafka_config.yaml
│               └── quality_consumer.py
│
└── quality_gate_results/             # Monitoring data
    └── customer_churn_score/
        ├── v2.0.0/
        │   ├── 2025-10-13/
        │   │   ├── schema_integrity_results.json
        │   │   ├── completeness_results.json
        │   │   ├── accuracy_results.json
        │   │   └── summary.json
        │   └── historical_trends.parquet
        └── v3.0.0/
            └── ...
```

### API Endpoints

```typescript
// Contract Management APIs
GET    /api/contracts                          // List all contracts
GET    /api/contracts/{name}                   // Get specific contract
GET    /api/contracts/{name}/versions          // Get version history
POST   /api/contracts                          // Create new contract
PUT    /api/contracts/{name}/v{version}        // Update contract (creates new version if breaking)
DELETE /api/contracts/{name}/v{version}        // Deprecate contract version

// Product Management APIs
GET    /api/contracts/{name}/products          // Get all products for a contract
POST   /api/contracts/{name}/products          // Add new product to contract
PUT    /api/products/{product_id}              // Update product (doesn't affect contract)
DELETE /api/products/{product_id}              // Remove product

// Quality Gate APIs
GET    /api/contracts/{name}/quality-gates     // Get quality gates for contract
PUT    /api/contracts/{name}/quality-gates     // Update quality gates (creates new version)
GET    /api/products/{product_id}/quality-results  // Get quality results for product
POST   /api/quality-gates/execute              // Manually trigger quality gates

// Governance APIs
GET    /api/governance/pending-reviews         // Get contracts awaiting approval
POST   /api/governance/approve                 // Approve breaking change
POST   /api/governance/reject                  // Reject breaking change
GET    /api/governance/violations              // Get policy violations

// Operations APIs
GET    /api/operations/contracts               // Contract health dashboard
GET    /api/operations/contracts/{name}/health // Detailed health for contract
GET    /api/operations/products/{product_id}/metrics  // Product-specific metrics
GET    /api/operations/incidents               // Active incidents
POST   /api/operations/incidents/{id}/resolve  // Mark incident resolved
```

### Database Schema (Simplified)

```sql
-- Contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,  -- Semantic versioning
    type VARCHAR(50),  -- foundation, domain, solution
    schema JSONB NOT NULL,
    quality_promises JSONB NOT NULL,
    sla JSONB NOT NULL,
    owner_email VARCHAR(255),
    status VARCHAR(50),  -- active, deprecated, draft
    created_at TIMESTAMP,
    UNIQUE(name, version)
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contract_id UUID REFERENCES contracts(id),
    contract_version VARCHAR(50),
    delivery_method VARCHAR(50),  -- batch, api, stream
    interface_config JSONB,
    implementation_tool VARCHAR(50),  -- sqlmesh, dbt, custom
    cost_monthly DECIMAL,
    status VARCHAR(50),
    created_at TIMESTAMP
);

-- Quality gates table
CREATE TABLE quality_gates (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),  -- schema, completeness, accuracy, etc.
    severity VARCHAR(50),  -- blocker, warning, info
    rules JSONB NOT NULL,
    execution_frequency VARCHAR(50),  -- continuous, hourly, daily
    threshold JSONB,
    created_at TIMESTAMP
);

-- Quality results table (time-series)
CREATE TABLE quality_results (
    id UUID PRIMARY KEY,
    quality_gate_id UUID REFERENCES quality_gates(id),
    product_id UUID REFERENCES products(id),
    execution_timestamp TIMESTAMP,
    status VARCHAR(50),  -- passed, failed, warning
    result_details JSONB,
    metrics JSONB,
    created_at TIMESTAMP
);

-- Governance approvals table
CREATE TABLE governance_approvals (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id),
    change_type VARCHAR(50),  -- breaking, non_breaking
    change_summary JSONB,
    impact_analysis JSONB,
    required_approvers TEXT[],
    approvals JSONB,  -- [{approver, timestamp, status}]
    status VARCHAR(50),  -- pending, approved, rejected
    created_at TIMESTAMP
);

-- Contract versions table (audit trail)
CREATE TABLE contract_versions (
    id UUID PRIMARY KEY,
    contract_id UUID REFERENCES contracts(id),
    version VARCHAR(50),
    changes JSONB,
    author_email VARCHAR(255),
    reason TEXT,
    governance_approval_id UUID REFERENCES governance_approvals(id),
    created_at TIMESTAMP
);
```

---

## Part 7: Key Principles & Best Practices

### Principle 1: Contracts are Promises, Products are Delivery

**Do:**
- ✅ Define contracts based on business needs, not technical constraints
- ✅ Version contracts semantically (breaking vs non-breaking)
- ✅ Allow multiple products per contract
- ✅ Optimize products without touching contracts

**Don't:**
- ❌ Mix schema definitions with delivery methods
- ❌ Create new contracts for different delivery methods
- ❌ Change contracts for performance optimizations
- ❌ Skip governance for "small" breaking changes

### Principle 2: Quality Gates are Contract Validators

**Do:**
- ✅ Define gates at contract level (inherit across products)
- ✅ Execute gates at product level (appropriate to delivery method)
- ✅ Make blocker gates fail deployments
- ✅ Make warning gates log and alert

**Don't:**
- ❌ Define different gates for each product of same contract
- ❌ Allow gate failures to silently pass
- ❌ Skip gates in development environments
- ❌ Hard-code thresholds (make them configurable)

### Principle 3: Persona-Appropriate Abstraction

**Do:**
- ✅ Show engineers: Contracts, schemas, quality gates, tools
- ✅ Show analysts: Business context, sample queries, data quality
- ✅ Show governance: Compliance, approvals, policy violations
- ✅ Show executives: Business impact, costs, SLA compliance

**Don't:**
- ❌ Overwhelm analysts with technical details
- ❌ Hide tool selection from senior engineers
- ❌ Show raw quality metrics to business users
- ❌ Use technical jargon in governance workflows

### Principle 4: Progressive Disclosure of Complexity

**Do:**
- ✅ Start simple: Natural language → Contract → Products
- ✅ Provide "Advanced Settings" for power users
- ✅ Auto-select tools, but allow override
- ✅ Show summaries first, details on click

**Don't:**
- ❌ Front-load complexity in initial screens
- ❌ Force users to understand tool differences
- ❌ Require expertise for common tasks
- ❌ Hide important information behind too many clicks

---

## Part 8: Success Metrics

### Engineering Productivity

| Metric | Before NexusOne | With NexusOne | Improvement |
|--------|----------------|---------------|-------------|
| **Time to create product** | 2-3 days | 2-3 hours | **10x faster** |
| **Contract reuse rate** | 10% (accidental) | 60% (intentional) | **6x increase** |
| **Quality gate violations** | 30% caught in prod | 5% reach prod | **6x reduction** |
| **Breaking changes blocked** | 60% (manual review) | 95% (automated) | **58% improvement** |
| **Documentation completeness** | 40% (manual effort) | 95% (auto-generated) | **138% improvement** |

### Operations & Governance

| Metric | Before NexusOne | With NexusOne | Improvement |
|--------|----------------|---------------|-------------|
| **SLA compliance** | 87% | 94% | **8% improvement** |
| **Mean time to detection (MTTD)** | 45 minutes | 2 minutes | **22x faster** |
| **Mean time to resolution (MTTR)** | 4 hours | 45 minutes | **5.3x faster** |
| **Governance approval time** | 5 days | 1 day | **5x faster** |
| **Policy violation rate** | 15% | 2% | **7.5x reduction** |

### Business Impact

| Metric | Before NexusOne | With NexusOne | Improvement |
|--------|----------------|---------------|-------------|
| **Data product portfolio** | 45 products | 156 products | **247% growth** |
| **Active data consumers** | 89 users | 342 users | **284% growth** |
| **Cost per product** | $2,400/month | $850/month | **65% reduction** |
| **Time to insight** | 2 weeks | 2 days | **7x faster** |

---

## Conclusion

NexusOne's contract-first architecture fundamentally changes how organizations manage data by:

1. **Separating concerns**: Data promises (ODCS) from delivery (ODPS) from validation (Quality Gates)
2. **Enabling reuse**: One contract, many products, tested once
3. **Enforcing governance**: Breaking changes require approval, quality gates prevent bad data
4. **Optimizing costs**: Right delivery method for each use case
5. **Scaling teams**: Small teams deliver like large ones through automation

**The Result:**
A data platform that gets smarter with every build, maintains quality at scale, and enables rapid innovation without sacrificing governance.

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **ODCS** | Open Data Contract Standard - defines schema and quality promises |
| **ODPS** | Open Data Product Standard - defines delivery methods and interfaces |
| **Contract** | A versioned promise about what data looks like and its quality |
| **Product** | A specific delivery mechanism for a contract (SQL, API, stream) |
| **Quality Gate** | Automated validation that a contract's promises are being kept |
| **Foundation Product** | Source-aligned raw data replication (contract = product) |
| **Domain Product** | Business-context aggregation (one contract, many products) |
| **Solution Product** | Consumer-ready capability (ML model, dashboard, API) |
| **Breaking Change** | Contract modification that breaks existing consumers |
| **Governance Approval** | Required review for breaking changes |
| **SLA** | Service Level Agreement - promises about availability and performance |

---

**Document Status:** ✅ Complete and Canonical
**Next Review:** 2025-11-13
**Feedback:** Submit issues to #data-platform-feedback
