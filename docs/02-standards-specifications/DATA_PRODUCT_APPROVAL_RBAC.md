# Data Product Approval: Role-Based Access Control (RBAC)
**Refined Governance Model for NexusOne**

**Date:** October 8, 2025
**Priority:** 🔴 **CRITICAL** - Security & Governance
**Status:** Recommended Model

---

## Executive Summary

### The Right Governance Model

**Core Principle:** *"Everyone can propose, only engineers can deploy."*

This model balances:
- ✅ **Democratization** - Anyone can create data products
- ✅ **Safety** - Technical review before production
- ✅ **Quality** - Engineering standards enforced
- ✅ **Efficiency** - Self-service with guardrails

---

## Role-Based Permissions Matrix

### Capability by Role

| Capability | Data Analyst | Data Scientist | Product Manager | Analytics Engineer | Data Engineer | Senior Data Engineer |
|-----------|--------------|----------------|-----------------|-------------------|---------------|---------------------|
| **BUILD FLOW** | | | | | | |
| Access Build Flow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save Drafts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Complete All Steps | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit for Approval | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | | | | | | |
| **APPROVAL WORKFLOW** | | | | | | |
| Review Requests | ❌ | ❌ | View Only | ✅ | ✅ | ✅ |
| Approve for Production | ❌ | ❌ | ❌ | ⚠️ Limited | ✅ | ✅ |
| Request Changes | ❌ | ❌ | 💬 Comment | ✅ | ✅ | ✅ |
| Reject Requests | ❌ | ❌ | ❌ | ⚠️ Limited | ✅ | ✅ |
| | | | | | | |
| **DEPLOYMENT** | | | | | | |
| Deploy to Dev | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Deploy to Staging | ❌ | ❌ | ❌ | ⚠️ Own products | ✅ | ✅ |
| Deploy to Production | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Emergency Rollback | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| | | | | | | |
| **MANAGEMENT** | | | | | | |
| Edit Own Drafts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Others' Drafts | ❌ | ❌ | ❌ | ⚠️ Team only | ⚠️ Team only | ✅ |
| Delete Requests | Own only | Own only | Own only | ⚠️ Team only | ⚠️ Team only | ✅ |
| View Team Activity | Limited | Limited | ✅ Full | ✅ Team | ✅ Team | ✅ All |

**Legend:**
- ✅ Full access
- ⚠️ Conditional/limited access
- 💬 Comment-only access
- ❌ No access

---

## Detailed Role Definitions

### 1. Data Analyst 👤

**Primary Use Case:** Self-service data product creation for reporting

**Permissions:**
- ✅ Access full Build Flow (all 6 steps)
- ✅ Create drafts without limits
- ✅ Submit proposals for approval
- ✅ View status of own requests
- ❌ Cannot approve any requests
- ❌ Cannot deploy anything

**Workflow:**
```
Analyst creates product → Submits → Engineer reviews → Engineer deploys
```

**Rationale:**
- Empowers self-service (80% goal)
- Engineering review ensures quality
- No production access = safe experimentation
- Reduces engineer bottleneck for simple products

**Example:**
```
Analyst: Creates "daily_marketing_metrics" dashboard
         Submits proposal: "Need this for weekly reporting"

Engineer: Reviews SQL, adds indexing optimization
          Approves & deploys to production

Analyst: Gets notification, starts using immediately
```

---

### 2. Data Scientist 🔬

**Primary Use Case:** Feature engineering, model data pipelines

**Permissions:**
- ✅ Same as Data Analyst
- ✅ Access to ML-specific tools (feature store, MLflow)
- ✅ Can specify compute requirements (Spark config)
- ❌ Still cannot approve/deploy

**Workflow:**
```
Scientist creates features → Submits → Engineer validates → Deploys
```

**Rationale:**
- Complex pipelines need engineering review
- Cost implications require oversight
- Data quality critical for models
- Infrastructure knowledge gap

**Example:**
```
Scientist: Creates "churn_prediction_features" pipeline
           Uses Spark, reads from 10 tables, 5 transformations
           Submits: "Need this for Q4 churn model"

Engineer: Reviews resource usage, adds partitioning
          Validates joins don't cause data fanout
          Approves with monitoring alerts

Scientist: Pipeline runs, features available in feature store
```

---

### 3. Product Manager 📊

**Primary Use Case:** Oversight, prioritization, governance tracking

**Permissions:**
- ✅ Create "product requirement" templates
- ✅ Submit high-level proposals
- ✅ **View all pending requests** (oversight)
- ✅ Comment on any request (business context)
- 💬 Flag priority/urgency
- ❌ Cannot approve technical implementation
- ❌ Cannot deploy

**Special Access:**
- View-only access to all team requests
- Can see approval pipeline status
- Dashboard of team velocity metrics
- Governance compliance reports

**Workflow:**
```
PM creates requirement → Assigns to engineer → Engineer implements & deploys
```

**Rationale:**
- Needs visibility for prioritization
- Should provide business context
- Not responsible for technical quality
- Enables strategic planning

**Example:**
```
PM: Creates proposal "customer_360_view"
    Business justification: "Enable sales team self-service"
    Priority: High
    Assigns to: Senior Data Engineer team

Engineer: Picks up, implements with PM collaboration
          PM provides business logic feedback via comments
          Engineer handles technical decisions

PM: Gets notification when deployed, tracks in roadmap
```

---

### 4. Analytics Engineer ⚙️

**Primary Use Case:** dbt models, semantic layer, transformations

**Permissions:**
- ✅ Full Build Flow access
- ✅ Submit proposals
- ✅ **Limited approval rights:**
  - ✅ Can approve dbt models (their domain)
  - ✅ Can approve SQL-only transformations
  - ⚠️ Requires DE approval for:
    - Ingestion pipelines
    - Spark jobs
    - Infrastructure changes
- ✅ Deploy to dev/staging for own products
- ❌ Deploy to production (requires DE approval)

**Workflow:**
```
AE creates dbt model → Self-approve (simple cases) → Deploy to staging
                    ↓
                    Complex/infrastructure → DE review → DE deploy
```

**Rationale:**
- Trusted with SQL/dbt expertise
- Limited infrastructure impact
- Faster iteration for common cases
- Escalation path for complex work

**Example - Simple Case:**
```
AE: Creates staging_customers (dbt model)
    SQL transformation only, no new sources
    Self-reviews, deploys to staging
    Tests, then submits for production

DE: Quick review (5 min), approves production deploy
```

**Example - Complex Case:**
```
AE: Creates real-time streaming aggregation
    Requires Kafka, Spark Structured Streaming
    Submits for DE review

DE: Reviews infrastructure requirements
    Adjusts for high availability
    Deploys to production with monitoring
```

---

### 5. Data Engineer 🔧

**Primary Use Case:** Full data platform operations

**Permissions:**
- ✅ Everything Analytics Engineers can do
- ✅ **Full approval rights:**
  - Approve any data product
  - Approve infrastructure changes
  - Approve cost-significant work
- ✅ Deploy to any environment
- ✅ Emergency rollback capability
- ✅ Edit team members' drafts (collaborative)
- ⚠️ Cannot approve own work (requires peer review)

**Workflow:**
```
DE creates product → Submits for peer review → Another DE approves → Deploy
```

**Rationale:**
- Full platform knowledge
- Trusted with production access
- Peer review prevents mistakes
- Can move fast when needed

**Peer Review Exception:**
```
⚠️ Data Engineers must get peer approval for:
- Production deployments
- Schema changes
- Infrastructure modifications
- Cost > $100/day

✅ Can self-approve for:
- Dev/staging deploys
- Bug fixes (with post-review)
- Documentation updates
```

---

### 6. Senior Data Engineer 👨‍💼

**Primary Use Case:** Architecture, review, oversight

**Permissions:**
- ✅ Everything Data Engineers can do
- ✅ **Additional privileges:**
  - Approve any request (no peer review needed)
  - Override rejections (with justification)
  - Approve high-cost work (>$500/day)
  - Emergency production changes
  - System-wide configuration changes
- ✅ View all team activity across domains
- ✅ Access to platform analytics/metrics
- ✅ Can edit anyone's drafts

**Workflow:**
```
Anyone submits → Auto-assigned to Sr. DE → Reviews → Approves/Deploys
```

**Rationale:**
- Most experienced engineers
- Architecture decision makers
- Responsible for platform health
- Handle escalations

**Special Responsibilities:**
- Final say on architectural decisions
- Handle policy exceptions
- Mentor junior engineers through reviews
- Monitor platform-wide metrics

---

## Approval Workflow by Scenario

### Scenario 1: Simple Reporting Dashboard (Analyst)

**Submitter:** Data Analyst
**Approver:** Any Data Engineer

```
┌─ APPROVAL REQUIREMENTS ───────────────────────────────┐
│                                                        │
│ Product: daily_revenue_dashboard                      │
│ Submitter: Sarah (Data Analyst)                       │
│ Complexity: Low                                        │
│                                                        │
│ Required Approvals: 1                                  │
│ ✅ Technical Review: Any Data Engineer                │
│                                                        │
│ Auto-Assigned: Mike Johnson (DE) - Next in rotation   │
│                                                        │
│ Estimated Review Time: 10-15 minutes                  │
│                                                        │
│ Auto-Checks Running:                                   │
│ ✅ SQL Validation: Passed                             │
│ ✅ Cost Estimate: $12/day (Low)                       │
│ ✅ Policy Check: No violations                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Scenario 2: ML Feature Pipeline (Data Scientist)

**Submitter:** Data Scientist
**Approver:** Senior Data Engineer

```
┌─ APPROVAL REQUIREMENTS ───────────────────────────────┐
│                                                        │
│ Product: churn_prediction_features                    │
│ Submitter: Alex (Data Scientist)                      │
│ Complexity: High                                       │
│                                                        │
│ Required Approvals: 1 Senior Data Engineer            │
│                                                        │
│ Why Senior DE Required:                               │
│ ⚠️ Cost: $320/day (>$100 threshold)                   │
│ ⚠️ Complexity: Spark job, 10 source tables            │
│ ⚠️ PII Handling: Customer emails, phone numbers       │
│                                                        │
│ Auto-Assigned: Jane Smith (Senior DE)                 │
│                                                        │
│ Estimated Review Time: 30-45 minutes                  │
│                                                        │
│ Auto-Checks:                                           │
│ ✅ SQL Validation: Passed                             │
│ ⚠️ Cost: High (review recommended)                    │
│ ⚠️ PII Detection: 3 fields flagged                    │
│ ✅ Policy: Requires anonymization (flagged)           │
│                                                        │
│ Recommended Actions:                                   │
│ 💡 Consider incremental processing                    │
│ 💡 Add PII masking to email/phone                     │
│ 💡 Set up cost alerts                                 │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Scenario 3: dbt Model (Analytics Engineer)

**Submitter:** Analytics Engineer
**Approver:** Self (simple) or Data Engineer (complex)

```
┌─ APPROVAL REQUIREMENTS ───────────────────────────────┐
│                                                        │
│ Product: staging_orders                               │
│ Submitter: Emma (Analytics Engineer)                  │
│ Complexity: Low                                        │
│                                                        │
│ ✅ FAST-TRACK ELIGIBLE                                │
│                                                        │
│ Why Fast-Track:                                        │
│ ✅ dbt model (AE specialty)                           │
│ ✅ SQL-only transformation                            │
│ ✅ Cost: $8/day (Low)                                 │
│ ✅ No new sources                                     │
│ ✅ No infrastructure changes                          │
│                                                        │
│ Approval Options:                                      │
│ 1. ⚡ Self-approve & deploy to staging                │
│    (DE review for production later)                   │
│                                                        │
│ 2. 📤 Submit for immediate DE review                  │
│    (Typical: <30 min for fast-track)                 │
│                                                        │
│ Recommendation: Self-approve to staging               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Scenario 4: Infrastructure Change (Data Engineer)

**Submitter:** Data Engineer
**Approver:** Peer Data Engineer OR Senior Data Engineer

```
┌─ APPROVAL REQUIREMENTS ───────────────────────────────┐
│                                                        │
│ Product: streaming_event_pipeline                     │
│ Submitter: Mike (Data Engineer)                       │
│ Complexity: High                                       │
│                                                        │
│ ⚠️ PEER REVIEW REQUIRED                               │
│                                                        │
│ Why Peer Review:                                       │
│ ⚠️ Infrastructure: New Kafka topics                   │
│ ⚠️ Architecture: Introduces streaming pattern         │
│ ⚠️ Cost: $450/day (High)                              │
│ ⚠️ Risk: 24/7 monitoring required                     │
│                                                        │
│ Required Approval: 1 peer DE or Senior DE             │
│                                                        │
│ Auto-Assigned: Jane Smith (Senior DE)                 │
│ Fallback: Tom Wilson (DE) if Jane unavailable        │
│                                                        │
│ Review Focus Areas:                                    │
│ • Architecture fit                                    │
│ • Failure handling                                    │
│ • Monitoring/alerting plan                            │
│ • Runbook completeness                                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Auto-Assignment Logic

### Priority-Based Assignment

```typescript
interface AssignmentRule {
  priority: number;
  condition: (request: Request) => boolean;
  assignTo: UserRole | 'specific_user';
}

const assignmentRules: AssignmentRule[] = [
  // Rule 1: High-cost requires Senior DE
  {
    priority: 1,
    condition: (req) => req.estimatedCost > 100,
    assignTo: 'senior_data_engineer'
  },

  // Rule 2: PII requires Senior DE or Security
  {
    priority: 1,
    condition: (req) => req.hasPII,
    assignTo: 'senior_data_engineer'
  },

  // Rule 3: dbt models can go to Analytics Engineers
  {
    priority: 2,
    condition: (req) => req.type === 'dbt_model' && req.isSimple,
    assignTo: 'analytics_engineer'
  },

  // Rule 4: Domain-specific assignment
  {
    priority: 3,
    condition: (req) => true,
    assignTo: (req) => getDomainExpert(req.domain)
  },

  // Rule 5: Round-robin fallback
  {
    priority: 4,
    condition: (req) => true,
    assignTo: (req) => getNextInRotation('data_engineer')
  }
];
```

### Load Balancing

```
Current Queue:

Jane (Senior DE):     [====    ] 4 reviews pending (6h est.)
Mike (DE):           [========] 8 reviews pending (12h est.)
Tom (DE):            [==      ] 2 reviews pending (3h est.)

New Request: customer_segmentation (Low complexity, 15 min)

Assignment: Tom (least loaded, qualified)
```

---

## Review Interface by Role

### Data Engineer Review Interface

```
┌─ REVIEW: customer_segmentation_v2 ────────────────────┐
│                                                        │
│ Submitter: Sarah (Data Analyst)                       │
│ Submitted: 2 hours ago                                 │
│                                                        │
│ [Overview] [SQL] [Quality] [Impact] [Comments]        │
│                                                        │
│ QUICK CHECKS                                           │
│ ✅ SQL Syntax Valid                                   │
│ ✅ All sources accessible                             │
│ ✅ Quality rules defined                              │
│ ⚠️ Missing index on join column                       │
│                                                        │
│ ESTIMATED IMPACT                                       │
│ • Runtime: ~8 minutes                                 │
│ • Cost: $12/day                                       │
│ • No downstream breakage                              │
│                                                        │
│ AI REVIEW SUGGESTIONS                                  │
│ 💡 Add index on customer_id for 3x speedup            │
│ 💡 Consider partitioning by date                      │
│                                                        │
│ ─────────────────────────────────────────────────────│
│                                                        │
│ YOUR DECISION                                          │
│                                                        │
│ ○ ✅ Approve & Deploy                                 │
│   └─ [x] Apply AI optimization suggestions            │
│                                                        │
│ ○ ⚠️ Approve with Conditions                          │
│   └─ Condition: [________________]                    │
│                                                        │
│ ○ 🔄 Request Changes                                  │
│   └─ Feedback: [________________]                     │
│                                                        │
│ ○ ❌ Reject                                           │
│                                                        │
│ Quick Comment to Sarah:                               │
│ [Looks good! I'll add the index optimization.]        │
│                                                        │
│ [Submit Decision]                                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Product Manager View Interface (Read-Only)

```
┌─ TEAM DATA PRODUCT PIPELINE ──────────────────────────┐
│                                                        │
│ Filter: [All Domains ▼] [All Submitters ▼]           │
│         [All Statuses ▼]                              │
│                                                        │
│ 📊 PENDING APPROVALS (8)                              │
│                                                        │
│ customer_360_view                                     │
│ by: Engineering Team · Domain: Customer               │
│ Status: In Review (Jane Smith)                        │
│ Est. Deploy: Tomorrow                                 │
│ Alignment: ✅ On Roadmap (Q4 Initiative)             │
│ [View Details] [Add Business Context]                │
│                                                        │
│ churn_features_pipeline                               │
│ by: Data Science Team · Domain: ML                    │
│ Status: Changes Requested                             │
│ Alignment: ⚠️ Not on Roadmap                         │
│ [View Details] [Flag Priority]                       │
│                                                        │
│ ─────────────────────────────────────────────────────│
│                                                        │
│ 📈 METRICS (Last 30 Days)                             │
│                                                        │
│ • 47 products deployed                                │
│ • 92% approval rate                                   │
│ • 6h avg. time to approval                            │
│ • 8 products on roadmap vs 39 off-roadmap            │
│                                                        │
│ ⚠️ 17% of work not aligned with roadmap              │
│     [View Details] [Discuss with Team]               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Implementation: Permission Service

```typescript
// lib/services/permissions.ts

export enum Permission {
  // Build Flow
  ACCESS_BUILD_FLOW = 'build:access',
  SAVE_DRAFT = 'build:save_draft',
  SUBMIT_REQUEST = 'build:submit',

  // Review
  VIEW_REQUESTS = 'review:view',
  REVIEW_REQUESTS = 'review:review',
  APPROVE_SIMPLE = 'review:approve_simple',
  APPROVE_COMPLEX = 'review:approve_complex',
  APPROVE_HIGH_COST = 'review:approve_high_cost',
  REJECT_REQUESTS = 'review:reject',

  // Deploy
  DEPLOY_DEV = 'deploy:dev',
  DEPLOY_STAGING = 'deploy:staging',
  DEPLOY_PRODUCTION = 'deploy:production',
  ROLLBACK = 'deploy:rollback',

  // Management
  EDIT_OWN_DRAFTS = 'manage:edit_own',
  EDIT_TEAM_DRAFTS = 'manage:edit_team',
  EDIT_ANY_DRAFTS = 'manage:edit_any',
  DELETE_REQUESTS = 'manage:delete',
  VIEW_ALL_ACTIVITY = 'manage:view_all'
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  data_analyst: [
    Permission.ACCESS_BUILD_FLOW,
    Permission.SAVE_DRAFT,
    Permission.SUBMIT_REQUEST,
    Permission.VIEW_REQUESTS, // Own only
    Permission.EDIT_OWN_DRAFTS
  ],

  data_scientist: [
    Permission.ACCESS_BUILD_FLOW,
    Permission.SAVE_DRAFT,
    Permission.SUBMIT_REQUEST,
    Permission.VIEW_REQUESTS,
    Permission.EDIT_OWN_DRAFTS
  ],

  product_manager: [
    Permission.ACCESS_BUILD_FLOW,
    Permission.SAVE_DRAFT,
    Permission.SUBMIT_REQUEST,
    Permission.VIEW_REQUESTS, // All, read-only
    Permission.VIEW_ALL_ACTIVITY
  ],

  analytics_engineer: [
    Permission.ACCESS_BUILD_FLOW,
    Permission.SAVE_DRAFT,
    Permission.SUBMIT_REQUEST,
    Permission.VIEW_REQUESTS,
    Permission.REVIEW_REQUESTS,
    Permission.APPROVE_SIMPLE, // dbt models only
    Permission.EDIT_OWN_DRAFTS,
    Permission.EDIT_TEAM_DRAFTS,
    Permission.DEPLOY_DEV,
    Permission.DEPLOY_STAGING
  ],

  data_engineer: [
    Permission.ACCESS_BUILD_FLOW,
    Permission.SAVE_DRAFT,
    Permission.SUBMIT_REQUEST,
    Permission.VIEW_REQUESTS,
    Permission.REVIEW_REQUESTS,
    Permission.APPROVE_SIMPLE,
    Permission.APPROVE_COMPLEX,
    Permission.REJECT_REQUESTS,
    Permission.EDIT_OWN_DRAFTS,
    Permission.EDIT_TEAM_DRAFTS,
    Permission.DEPLOY_DEV,
    Permission.DEPLOY_STAGING,
    Permission.DEPLOY_PRODUCTION, // With peer review
    Permission.ROLLBACK
  ],

  senior_data_engineer: [
    ...rolePermissions.data_engineer,
    Permission.APPROVE_HIGH_COST,
    Permission.EDIT_ANY_DRAFTS,
    Permission.DELETE_REQUESTS,
    Permission.VIEW_ALL_ACTIVITY
    // No peer review requirement
  ]
};

export function hasPermission(
  user: User,
  permission: Permission,
  context?: Context
): boolean {
  const basePermissions = rolePermissions[user.role];

  if (!basePermissions.includes(permission)) {
    return false;
  }

  // Context-specific checks
  if (permission === Permission.APPROVE_SIMPLE && user.role === 'analytics_engineer') {
    return context?.type === 'dbt_model' && context?.complexity === 'low';
  }

  if (permission === Permission.DEPLOY_PRODUCTION && user.role === 'data_engineer') {
    return context?.hasPeerApproval === true;
  }

  return true;
}
```

---

## Benefits of This Model

### ✅ For the Organization

1. **Democratized Access**
   - All roles can create data products
   - No engineering bottleneck for simple cases
   - Encourages data culture

2. **Quality Assurance**
   - Engineering review for production
   - Peer review for complex changes
   - Automated checks as first line

3. **Clear Accountability**
   - Engineers responsible for production
   - Audit trail of all approvals
   - Clear escalation paths

4. **Efficient Resource Use**
   - Auto-assignment prevents overload
   - Fast-track for simple cases
   - Senior engineers for complex only

### ✅ For Data Analysts/Scientists

- Self-service without waiting
- Learn from engineer feedback
- Build trust over time (fast-track eligible)
- Focus on analysis, not infrastructure

### ✅ For Engineers

- Review only when needed
- AI suggestions speed review
- Clear decision criteria
- Mentorship through review comments

### ✅ For Product Managers

- Visibility without approval burden
- Can influence prioritization
- Track alignment with roadmap
- Metrics for planning

---

## Gradual Trust Model

### Concept: Earn Fast-Track Approval

```
New Analyst:
┌─────────────────────────────────────────┐
│ First 5 products: Full DE review        │
│ Next 10 products: Quick DE review       │
│ After 15 products: Fast-track eligible  │
└─────────────────────────────────────────┘

Criteria for Fast-Track:
✅ 95% approval rate on first submissions
✅ No production incidents from your products
✅ Consistent quality in SQL
✅ Good documentation habits
```

**Benefits:**
- Rewards good work
- Reduces review burden
- Maintains quality
- Builds trust

---

## Conclusion

**Recommended RBAC Model:**

**Create:** Everyone ✅
**Review:** Engineers only ⚙️
**Approve:** Engineers only ⚙️
**Deploy:** Engineers only ⚙️

**With nuance:**
- PMs provide oversight and context
- Analytics Engineers have limited approval rights
- Trust earned through quality work
- AI assists but doesn't decide

This balances **democratization** with **quality assurance**.

---

**Document Version:** 1.0
**Last Updated:** October 8, 2025
**Status:** Recommended for implementation
