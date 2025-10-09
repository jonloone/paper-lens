# Governance Integration Summary

## Where Governance Fits in Your Build Flow

### Current Build Flow (6 Steps)
```
1. Intent & Context    → Define data product intent
2. Discover Data       → Browse lakehouse, select tables
3. Define Schema       → Auto-inferred schema
4. Quality & SLA       → Quality rules, SLA targets
5. Transform Logic     → SQL transformation
6. Delivery Options    → Deploy configuration
```

### Enhanced with Governance (Same 6 Steps + Gates)
```
1. Intent & Context    → (no change)
2. Discover Data       → (no change)
3. Define Schema       → (no change)
4. Quality & SLA       → ✨ ADD: Governance section
                          - Data classification
                          - Regulatory requirements (GDPR, HIPAA, PCI-DSS)
                          - Authorized groups
                          - Encryption settings
5. Transform Logic     → (no change)
6. Delivery Options    → ✨ ADD: Pre-deploy governance validation
   └─> Click "Deploy"
       ├─> [GOVERNANCE GATE - 1-5ms]
       │   ├─ OPA validates schema policies
       │   ├─ OPA validates quality policies
       │   ├─ OPA validates security policies
       │   └─ Generate Ranger policies
       │
       ├─> IF PASS: Continue deployment
       │   ├─ Create Airflow DAG
       │   ├─ Create Iceberg tables
       │   ├─ Deploy Ranger policies (access + masking)
       │   ├─ Register in DataHub
       │   └─ Success!
       │
       └─> IF FAIL: Show violations
           ├─ Display policy violations
           ├─ Show AI recommendations
           ├─ User fixes issues
           └─ Retry
```

## ODPS v4.0 Compliance

### Your Current Data Contract
```typescript
{
  // ODPS: Info
  name: "customer_360",
  description: "Unified customer view",
  version: "1.0.0",

  // ODPS: Schema
  schema: {
    fields: [
      {
        name: "customer_id",
        type: "string",
        // ✨ ADD: classification
        classification: "public"
      },
      {
        name: "customer_ssn",
        type: "string",
        // ✨ ADD: classification + masking
        classification: "pii",
        masking_config: {
          enabled: true,
          method: "hash",
          allow_unmasked_groups: ["compliance_officers"]
        }
      }
    ]
  },

  // ODPS: Quality
  quality_rules: [
    { type: "completeness", threshold: 0.95 },
    { type: "uniqueness", columns: ["customer_id"] }
  ],

  // ODPS: SLA
  sla: {
    freshness_hours: 2,
    availability_percent: 99.5
  },

  // ODPS: Lineage
  source: {
    lakehouse_tables: ["bronze.customers", "bronze.orders"]
  },

  // ODPS: Ownership
  owner: "data-team",
  team: "analytics",

  // ✨ NEW: Governance (ODPS-compliant extension)
  governance: {
    data_classification: "confidential",
    regulatory_requirements: ["GDPR", "CCPA"],
    authorized_groups: ["finance_analysts", "data_scientists"],
    encryption: {
      at_rest: true,
      in_transit: true,
      algorithm: "AES-256"
    },
    audit_config: {
      enabled: true,
      retention_days: 365
    }
  }
}
```

### What Governance Adds to ODPS

| ODPS Section | Before | After Governance |
|--------------|--------|------------------|
| **Info** | ✅ name, description, version | ✅ No change |
| **Schema** | ✅ fields with types | ✅ Add classification + masking |
| **Quality** | ✅ quality_rules | ✅ OPA validates min 2 checks |
| **SLA** | ✅ sla targets | ✅ OPA validates + creates SLO |
| **Lineage** | ✅ source tables | ✅ No change |
| **Ownership** | ✅ owner, team | ✅ Add authorized_groups |
| **Security** | ❌ Not tracked | ✨ **NEW: governance section** |
| **Compliance** | ❌ Not tracked | ✨ **NEW: regulatory_requirements** |
| **Access Control** | ❌ Manual | ✨ **NEW: Auto-generated Ranger policies** |

## Integration Points

### 1. During Build (Step 4: Quality & SLA)

**Add to UI:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Governance & Compliance</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Data Classification Dropdown */}
    <Select>
      <option>Public</option>
      <option>Internal</option>
      <option>Confidential</option>
      <option>Restricted (PII/PHI)</option>
    </Select>

    {/* Regulatory Checkboxes */}
    <Checkbox>GDPR (EU Data Protection)</Checkbox>
    <Checkbox>HIPAA (Healthcare)</Checkbox>
    <Checkbox>PCI-DSS (Payment Card)</Checkbox>

    {/* Authorized Groups Multi-Select */}
    <MultiSelect options={teams} />
  </CardContent>
</Card>
```

**Stored in contract:**
```json
{
  "governance": {
    "data_classification": "confidential",
    "regulatory_requirements": ["GDPR"],
    "authorized_groups": ["finance_analysts"]
  }
}
```

### 2. Before Deploy (Step 6: Deliver)

**Replace deploy button click:**
```tsx
// OLD:
const handleDeploy = () => {
  setDeploying(true);
  // ... deploy logic
};

// NEW:
const handleDeploy = async () => {
  setDeploying(true);

  // 1. Validate with governance
  const validation = await fetch('/api/v1/governance/validate', {
    method: 'POST',
    body: JSON.stringify({ data_product: contract })
  }).then(r => r.json());

  // 2. If failed, show violations
  if (validation.status === 'blocked') {
    showViolationsDialog(validation.violations);
    setDeploying(false);
    return;
  }

  // 3. If passed, continue deployment
  // ... existing deploy logic
};
```

### 3. Post-Deploy (Governance Dashboard)

**New page at `/govern`:**
- Show governance metrics
- List open violations
- Display SLO compliance
- Show agent recommendations
- Track policy execution time

## What Happens at Each Stage

### Stage 1: User Fills Out Build Form
```
Steps 1-3: Normal flow
Step 4: Add governance config
  ├─ Data classification: "Confidential"
  ├─ Regulations: ["GDPR"]
  ├─ Authorized groups: ["analysts"]
  └─ Encryption: { at_rest: true }
Step 5: Normal flow
Step 6: Click "Deploy"
```

### Stage 2: Governance Validation (1-5ms)
```
OPA Policy Engine validates:
  ├─ ✅ PII fields have masking? YES
  ├─ ✅ Min 2 quality checks? YES
  ├─ ✅ SLO defined? YES
  ├─ ✅ Access control defined? YES
  └─ ✅ GDPR config present? YES

Result: PASS → Continue to Stage 3
```

### Stage 3: Ranger Policy Generation
```
Auto-generate from validated contract:
  ├─ Access Policy
  │  └─ "analysts" can SELECT from "customer_360"
  ├─ Masking Policy
  │  ├─ "customer_ssn" → MASK_HASH for all
  │  └─ "customer_ssn" → MASK_NONE for "compliance_officers"
  └─ Audit Policy
     └─ Log all access for 365 days
```

### Stage 4: Infrastructure Deployment
```
Normal deployment:
  ├─ Create Airflow DAG
  ├─ Create Iceberg tables
  ├─ Register in DataHub
  ├─ Configure Trino catalog
  └─ ✨ NEW: Deploy Ranger policies to Trino
```

### Stage 5: Runtime Enforcement
```
User queries "customer_360":
  ├─ Ranger checks access → Allowed (user in "analysts")
  ├─ Query executes
  ├─ Ranger applies masking → "customer_ssn" hashed
  ├─ Audit log written
  └─ Results returned (with masked PII)
```

## Benefits

### 1. Zero Manual Security Configuration
**Before:** Manually configure Ranger policies, hope you didn't miss PII fields
**After:** Auto-generated from validated contract, guaranteed compliant

### 2. Compliance by Default
**Before:** Hope engineers remember GDPR requirements
**After:** OPA blocks deployment if GDPR config missing for PII data

### 3. Consistent Enforcement
**Before:** Some data products have access control, some don't
**After:** Every deployment validated, no exceptions

### 4. Audit Trail
**Before:** Who changed what? When? Why?
**After:** Complete audit log of all governance decisions

### 5. AI-Powered Fixes
**Before:** "Deployment failed" - now what?
**After:** "Deployment blocked: Add masking_config: {enabled: true, method: 'hash'}"

## Example Scenarios

### Scenario 1: Happy Path (PII Properly Masked)

**Contract:**
```json
{
  "schema": {
    "fields": [{
      "name": "ssn",
      "classification": "pii",
      "masking_config": { "enabled": true, "method": "hash" }
    }]
  },
  "quality_rules": [
    { "type": "completeness", "threshold": 0.95 },
    { "type": "uniqueness", "columns": ["ssn"] }
  ],
  "governance": {
    "data_classification": "restricted",
    "authorized_groups": ["hr_team"]
  }
}
```

**Result:**
```
✅ OPA Validation: PASS (3ms)
✅ Ranger Policies: 2 generated
✅ Deployment: SUCCESS
✅ Access Control: hr_team can query
✅ PII Masking: SSN hashed for non-compliance users
```

### Scenario 2: Violation (PII Not Masked)

**Contract:**
```json
{
  "schema": {
    "fields": [{
      "name": "ssn",
      "classification": "pii"
      // Missing masking_config!
    }]
  }
}
```

**Result:**
```
❌ OPA Validation: BLOCKED
❌ Violation: "PII field 'ssn' must have masking enabled"
💡 AI Recommendation: "Add masking_config: {enabled: true, method: 'hash'}"
🔧 User Action: Fix contract, retry deployment
```

### Scenario 3: GDPR Compliance Missing

**Contract:**
```json
{
  "schema": {
    "fields": [{
      "name": "email",
      "classification": "pii",
      "masking_config": { "enabled": true }
    }]
  },
  "governance": {
    "regulatory_requirements": ["GDPR"]
    // Missing gdpr_config!
  }
}
```

**Result:**
```
❌ OPA Validation: BLOCKED
❌ Violation: "GDPR data requires gdpr_config"
💡 AI Recommendation: "Add gdpr_config: {
      right_to_erasure: true,
      data_retention_days: 730
    }"
```

## Summary

### Where to Integrate

1. **Step 4 (Quality & SLA)** - Add governance configuration form
2. **Step 6 (Deliver)** - Add pre-deploy validation gate
3. **New Page (/govern)** - Monitor compliance dashboard

### What Changes in Data Contract

Add `governance` section (ODPS-compliant):
```typescript
governance: {
  data_classification: string;
  regulatory_requirements: string[];
  authorized_groups: string[];
  encryption?: { at_rest, in_transit };
  audit_config?: { enabled, retention_days };
}
```

Add `classification` and `masking_config` to schema fields:
```typescript
fields: [{
  name: string;
  type: string;
  classification?: 'public' | 'internal' | 'confidential' | 'pii';
  masking_config?: {
    enabled: boolean;
    method: 'hash' | 'encrypt' | 'redact' | 'show_last_4';
    allow_unmasked_groups?: string[];
  }
}]
```

### What You Get

✅ **Build-Time:** Fast OPA validation (1-5ms) blocks bad deployments
✅ **Runtime:** Auto-generated Ranger policies enforce access + masking
✅ **Intelligence:** AI recommendations for fixing violations
✅ **Compliance:** GDPR, HIPAA, PCI-DSS enforcement built-in
✅ **ODPS:** Fully compliant with Open Data Product Specification v4.0
✅ **Zero Config:** No manual Ranger policy writing ever again

**Next:** Ready to implement the frontend components? I can create the governance section for Step 4 and the violations dialog.
