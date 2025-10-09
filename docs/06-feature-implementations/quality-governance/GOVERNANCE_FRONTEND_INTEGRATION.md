# Governance Integration with Frontend Build Flow

## Overview

This document shows **exactly where and how** the hybrid governance system integrates with your existing data product build flow and Open Data Product Specification (ODPS) compliance.

## 🎯 Integration Points

### 1. **Pre-Deployment Validation** (Step 6: Deliver)
**Location:** `app/(main)/build/new/deliver/page.tsx`

**Current Flow:**
```
Define → Source → Transform → Deliver → Deploy
```

**Enhanced with Governance:**
```
Define → Source → Transform → Deliver → [GOVERNANCE GATE] → Deploy
                                              ↓
                                    OPA Validation (1-5ms)
                                    - Schema policies
                                    - Quality policies
                                    - Security policies
                                              ↓
                                    Pass: Continue to Deploy
                                    Fail: Show violations + AI recommendations
```

### 2. **Post-Deployment Compliance** (After Deploy)
**Location:** New governance dashboard at `/govern`

**What Happens:**
```
Deploy Success → Generate Ranger Policies → Monitor Compliance
                        ↓
                  Access Control Policies
                  PII Masking Policies
                  Row-Level Security
                        ↓
                  Runtime Enforcement
```

## 📊 ODPS v4.0 Compliance Integration

### Data Contract Structure

Your current data contract format already aligns well with ODPS:

```typescript
interface DataContract {
  // ODPS: Basic Info
  name: string;
  description: string;
  version: string;

  // ODPS: Schema
  schema: {
    fields: Array<{
      name: string;
      type: string;
      classification?: 'public' | 'internal' | 'confidential' | 'pii';
      // ✅ GOVERNANCE: Add masking config
      masking_config?: {
        enabled: boolean;
        method: 'hash' | 'encrypt' | 'redact' | 'show_last_4';
        allow_unmasked_groups?: string[];
      }
    }>
  };

  // ODPS: Quality
  quality_rules: Array<{
    type: string;
    threshold: number;
  }>;

  // ODPS: SLAs/SLOs
  sla: {
    freshness_hours: number;
    availability_percent: number;
  };

  // ✅ GOVERNANCE: Add security context
  governance?: {
    data_classification: 'public' | 'internal' | 'confidential' | 'restricted';
    regulatory_requirements?: ('GDPR' | 'HIPAA' | 'PCI-DSS' | 'SOX')[];
    authorized_groups: string[];
    encryption?: {
      at_rest: boolean;
      in_transit: boolean;
    };
    audit_config?: {
      enabled: boolean;
      retention_days: number;
    };
  };

  // ODPS: Lineage
  source: {
    lakehouse_tables: string[];
  };

  // ODPS: Ownership
  owner: string;
  team: string;
}
```

## 🔧 Implementation Steps

### Step 1: Enhance Step 4 (Quality & SLA)

**File:** `components/build/steps/Step4Quality.tsx`

Add governance section:

```tsx
// Add to Step4Quality component

const [governanceConfig, setGovernanceConfig] = useState({
  data_classification: 'internal',
  regulatory_requirements: [],
  authorized_groups: [],
  encryption: {
    at_rest: false,
    in_transit: false
  }
});

// Add UI section
<Card>
  <CardHeader>
    <CardTitle>Governance & Compliance</CardTitle>
    <CardDescription>
      Security and compliance requirements
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Data Classification */}
    <div>
      <Label>Data Classification</Label>
      <Select
        value={governanceConfig.data_classification}
        onValueChange={(val) => setGovernanceConfig({
          ...governanceConfig,
          data_classification: val
        })}
      >
        <SelectItem value="public">Public</SelectItem>
        <SelectItem value="internal">Internal</SelectItem>
        <SelectItem value="confidential">Confidential</SelectItem>
        <SelectItem value="restricted">Restricted (PII/PHI)</SelectItem>
      </Select>
    </div>

    {/* Regulatory Requirements */}
    <div>
      <Label>Regulatory Compliance</Label>
      <div className="space-y-2">
        <Checkbox
          checked={governanceConfig.regulatory_requirements.includes('GDPR')}
          onCheckedChange={(checked) => {
            // Add/remove GDPR
          }}
        >
          GDPR (EU Data Protection)
        </Checkbox>
        <Checkbox
          checked={governanceConfig.regulatory_requirements.includes('HIPAA')}
        >
          HIPAA (Healthcare)
        </Checkbox>
        <Checkbox
          checked={governanceConfig.regulatory_requirements.includes('PCI-DSS')}
        >
          PCI-DSS (Payment Card)
        </Checkbox>
      </div>
    </div>

    {/* Authorized Groups */}
    <div>
      <Label>Authorized Groups</Label>
      <MultiSelect
        options={availableGroups}
        value={governanceConfig.authorized_groups}
        onChange={(groups) => setGovernanceConfig({
          ...governanceConfig,
          authorized_groups: groups
        })}
      />
    </div>
  </CardContent>
</Card>
```

### Step 2: Add Governance Validation Before Deploy

**File:** `app/(main)/build/new/deliver/page.tsx`

Replace `handleDeploy` function:

```tsx
const handleDeploy = async () => {
  setDeploying(true);
  setDeployProgress(0);

  try {
    // STEP 1: Validate with Governance System
    setDeployProgress(10);
    const validationResponse = await fetch('/api/v1/governance/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_product: {
          id: crypto.randomUUID(),
          name: contract.name,
          database: contract.database || 'analytics',
          table: contract.table || contract.name.toLowerCase(),
          schema: contract.schema,
          quality_checks: contract.quality_rules,
          slo_definitions: contract.sla ? [{
            type: 'freshness',
            target_hours: contract.sla.freshness_hours
          }] : [],
          authorized_groups: contract.governance?.authorized_groups || [],
          data_classification: contract.governance?.data_classification,
          regulatory_requirements: contract.governance?.regulatory_requirements,
          encryption: contract.governance?.encryption
        }
      })
    });

    const validationResult = await validationResponse.json();

    // STEP 2: Check if validation passed
    if (validationResult.status === 'blocked') {
      setDeploying(false);

      // Show governance violations
      showGovernanceViolationsDialog(validationResult);
      return;
    }

    setDeployProgress(30);

    // STEP 3: Continue with normal deployment
    // ... existing deployment code ...

    setDeployProgress(50);

    // STEP 4: Generate Ranger policies
    const rangerPolicies = validationResult.ranger_policies;

    setDeployProgress(70);

    // STEP 5: Deploy (existing code)
    // ... create Airflow DAG, Iceberg tables, etc ...

    setDeployProgress(100);
    setDeploymentComplete(true);

  } catch (error) {
    console.error('Deployment failed:', error);
    setDeploying(false);
    // Show error dialog
  }
};

// New function to show violations
const showGovernanceViolationsDialog = (result: any) => {
  // Show dialog with violations and AI recommendations
  setShowViolationsDialog(true);
  setViolations(result.validation.violations);
  setRecommendations(result.agent_recommendations);
};
```

### Step 3: Create Violations Dialog Component

**File:** `components/governance/GovernanceViolationsDialog.tsx`

```tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lightbulb, Copy } from 'lucide-react';

interface Violation {
  violation_type: string;
  violation_message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_component?: string;
  agent_recommendation?: string;
}

interface GovernanceViolationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  violations: Violation[];
  recommendations: any[];
}

export function GovernanceViolationsDialog({
  open,
  onOpenChange,
  violations,
  recommendations
}: GovernanceViolationsDialogProps) {
  const severityColors = {
    critical: 'destructive',
    high: 'destructive',
    medium: 'warning',
    low: 'secondary'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Deployment Blocked - {violations.length} Policy Violation{violations.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Violations List */}
          <div className="space-y-4">
            {violations.map((violation, idx) => (
              <Alert key={idx} variant={severityColors[violation.severity] as any}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={severityColors[violation.severity] as any}>
                          {violation.severity.toUpperCase()}
                        </Badge>
                        {violation.affected_component && (
                          <code className="text-sm">{violation.affected_component}</code>
                        )}
                      </div>
                      <AlertDescription className="text-base font-medium">
                        {violation.violation_message}
                      </AlertDescription>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  {violation.agent_recommendation && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 mt-0.5 text-primary" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium">AI Recommendation:</p>
                          <p className="text-sm text-muted-foreground">
                            {violation.agent_recommendation}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(violation.agent_recommendation);
                            }}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Fix
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Alert>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Fix Issues & Retry
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Navigate to governance dashboard
                window.location.href = '/govern';
              }}
            >
              View Governance Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 4: Create Governance Dashboard Page

**File:** `app/(main)/govern/page.tsx` (already exists, enhance it)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

export default function GovernPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch governance metrics
    fetch('/api/v1/governance/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data));

    // Fetch open violations
    fetch('/api/v1/governance/violations?status=open')
      .then(res => res.json())
      .then(data => setViolations(data));

    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Governance & Compliance</h1>
        <p className="text-muted-foreground">
          Monitor policy enforcement, violations, and compliance status
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_policies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.total_policies || 0} total policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {metrics?.open_violations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.total_violations || 0} total violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLO Compliance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics?.slo_compliance_rate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Validation Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.policy_execution_avg_time_ms || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Per policy execution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Violations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Open Violations</CardTitle>
          <CardDescription>
            Policy violations requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {violations.map((violation) => (
              <div
                key={violation.violation_id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      violation.severity === 'critical' ? 'destructive' :
                      violation.severity === 'high' ? 'destructive' :
                      violation.severity === 'medium' ? 'warning' : 'secondary'
                    }>
                      {violation.severity}
                    </Badge>
                    <span className="font-medium">{violation.violation_message}</span>
                  </div>
                  {violation.affected_component && (
                    <p className="text-sm text-muted-foreground">
                      Component: <code>{violation.affected_component}</code>
                    </p>
                  )}
                  {violation.agent_recommendation && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      💡 {violation.agent_recommendation}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🔄 Complete Integration Flow

### User Experience

```
┌─────────────────────────────────────────────────────────┐
│ Step 1-3: Define, Source, Transform                    │
│ (Existing flow - no changes)                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: Quality & SLA                                   │
│ ✨ NEW: Add Governance section                          │
│   - Data classification                                 │
│   - Regulatory requirements (GDPR, HIPAA, etc.)         │
│   - Authorized groups                                   │
│   - Encryption settings                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 5: Transform                                       │
│ (Existing flow - no changes)                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Step 6: Deliver                                         │
│ Select delivery options (table, API, stream, etc.)      │
│                                                         │
│ Click "Deploy" →                                        │
│   ✨ NEW: Governance validation runs (1-5ms)            │
│                                                         │
│   IF PASS:                                              │
│     → Continue deployment                               │
│     → Generate Ranger policies                          │
│     → Create infrastructure                             │
│     → Deploy to production                              │
│                                                         │
│   IF FAIL:                                              │
│     → Show violations dialog                            │
│     → Display AI recommendations                        │
│     → User fixes issues                                 │
│     → Retry deployment                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Post-Deployment                                         │
│ - Monitor at /govern dashboard                          │
│ - Track SLO compliance                                  │
│ - Review violations                                     │
│ - Apply agent recommendations                           │
└─────────────────────────────────────────────────────────┘
```

## 📋 ODPS v4.0 Mapping

Your data contracts already align with ODPS. The governance system **enhances** ODPS compliance:

| ODPS Section | Your Current Structure | Governance Enhancement |
|--------------|------------------------|------------------------|
| **Info** | `name`, `description`, `version` | ✅ Already compliant |
| **Schema** | `schema.fields[]` | ✅ Add `classification`, `masking_config` |
| **Quality** | `quality_rules[]` | ✅ OPA validates minimum 2 checks |
| **SLA/SLO** | `sla` | ✅ Convert to `slo_definitions`, OPA validates |
| **Access** | `owner`, `team` | ✅ Add `authorized_groups`, Ranger enforces |
| **Lineage** | `source.lakehouse_tables` | ✅ Already tracked |
| **Security** | ❌ Not in contract | ✨ **NEW: `governance` section** |
| **Compliance** | ❌ Not tracked | ✨ **NEW: `regulatory_requirements`** |

## 🎯 Next Steps

1. **Add governance section to Step 4** (Quality & SLA)
2. **Enhance deploy button** to call governance API
3. **Create violations dialog component**
4. **Enhance `/govern` dashboard** to show metrics
5. **Test end-to-end flow** with sample data product

Would you like me to implement any of these components now?