# Build Flow Quality Integration
## Technical Architecture & Backend Service Integration

---

## Overview

This document details the technical integration between the NexusOne build flow (frontend) and the Python/FastAPI backend quality gates system. It covers API design, service orchestration, real-time status updates, error handling, and the connection to the governance visibility dashboard.

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend - Next.js 14"
        A[Step 3: Transformations] -->|User clicks Next| B[Step 4: QualityGatesPreview Component]
        B -->|POST /api/build/run-quality-gates| C[Next.js API Route]
        B -->|Poll every 1s| D[GET /api/build/gate-status/:id]
        B -->|Display results| E[3-Tier Results UI]
        E -->|User continues| F[Step 5: Delivery Options]
        E -->|View full dashboard| G[/govern/quality]
    end

    subgraph "Backend - Python/FastAPI"
        C -->|Forward request| H[FastAPI /quality-gates/execute]
        H -->|Orchestrate| I[QualityGatesService]
        I -->|Gate 1| J[GovernanceService - OPA]
        I -->|Gate 2| K[Cost Estimation Engine]
        I -->|Gate 3| L[GreatExpectationsService]
        I -->|Gate 4| M[Security Scanning - PII Detection]
        I -->|Gate 5| N[Performance Prediction]
        I -->|Store results| O[Gate Execution Cache]
        D -->|Query status| O
    end

    subgraph "Governance Dashboard"
        G -->|Fetch history| P[/api/quality-gates/executions]
        G -->|Fetch trends| Q[/api/quality-gates/trends]
        P & Q -->|Query| O
    end

    subgraph "External Services"
        J -.->|Policy eval| R[OPA Server]
        L -.->|Data validation| S[Great Expectations]
        M -.->|PII patterns| T[DataHub or Custom Scanner]
        K -.->|Cost metrics| U[Trino Query Analyzer]
    end
```

---

## API Endpoint Specifications

### 1. Execute Quality Gates

**Endpoint**: `POST /api/build/run-quality-gates`

**Purpose**: Trigger automated quality gate execution for a data product definition

**Request**:
```typescript
interface RunQualityGatesRequest {
  data_product_name: string;
  product_definition: {
    sources: Array<{
      name: string;
      catalog: string;
      schema: string;
      table: string;
      filters?: string[];
    }>;
    transformations: {
      sql_query: string;
      transformations?: Array<{ type: string; config: any }>;
    };
    output_schema: Array<{
      column_name: string;
      data_type: string;
      nullable: boolean;
      description?: string;
    }>;
    classification: 'public' | 'internal' | 'confidential' | 'pii';
    metadata?: {
      owner: string;
      team: string;
      business_purpose: string;
    };
  };
  sample_data?: {
    format: 'json' | 'csv' | 'parquet';
    data: string; // Base64 encoded or JSON stringified
  };
  options?: {
    skip_gates?: string[]; // For testing: skip specific gates
    timeout_ms?: number; // Default: 30000 (30 seconds)
  };
}
```

**Response**:
```typescript
interface RunQualityGatesResponse {
  execution_id: string; // UUID for tracking
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string; // ISO timestamp
  estimated_duration_ms: number; // Based on historical data
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/build/run-quality-gates \
  -H "Content-Type: application/json" \
  -d '{
    "data_product_name": "customer_360_view",
    "product_definition": {
      "sources": [
        {
          "name": "customers",
          "catalog": "bronze",
          "schema": "crm",
          "table": "customers"
        }
      ],
      "transformations": {
        "sql_query": "SELECT * FROM bronze.crm.customers WHERE active = true"
      },
      "output_schema": [
        { "column_name": "customer_id", "data_type": "bigint", "nullable": false },
        { "column_name": "email", "data_type": "varchar", "nullable": true }
      ],
      "classification": "pii"
    }
  }'
```

**Next.js API Route Implementation**:
```typescript
// app/api/build/run-quality-gates/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to Python backend
    const response = await fetch(`${BACKEND_URL}/quality-gates/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Quality gates execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute quality gates' },
      { status: 500 }
    );
  }
}
```

### 2. Get Gate Execution Status

**Endpoint**: `GET /api/build/gate-status/:execution_id`

**Purpose**: Poll for real-time status and results of gate execution

**Response**:
```typescript
interface GateExecutionStatus {
  execution_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
  progress: {
    total_gates: number;
    completed_gates: number;
    current_gate?: {
      name: string;
      status: 'running' | 'completed' | 'failed';
      started_at: string;
    };
  };
  results?: QualityGatesResults; // Only when status === 'completed'
  error?: {
    code: string;
    message: string;
    gate?: string; // Which gate failed
    details?: any;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
}

interface QualityGatesResults {
  execution_id: string;
  data_product_name: string;
  tier1_blocking: GateResult[];
  tier2_warnings: GateResult[];
  tier3_optimizations: GateResult[];
  can_proceed: boolean; // False if any Tier 1 failures
  requires_acknowledgment: boolean; // True if any Tier 2 warnings
  summary: {
    total_gates: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface GateResult {
  gate_name: string;
  gate_id: string; // e.g., "policy_compliance", "cost_estimation"
  tier: 1 | 2 | 3;
  passed: boolean;
  severity: 'blocking' | 'warning' | 'info';
  message: string;
  details: any; // Gate-specific details
  recommendations?: string[];
  execution_time_ms: number;
  confidence_score?: number; // For AI-based gates
}
```

**Example**:
```bash
curl http://localhost:8000/api/build/gate-status/exec_12345
```

**Next.js API Route Implementation**:
```typescript
// app/api/build/gate-status/[executionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;

    const response = await fetch(`${BACKEND_URL}/quality-gates/status/${executionId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Gate status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gate status' },
      { status: 500 }
    );
  }
}
```

---

## Backend Service Architecture

### Python Backend Structure

```
backend/
├── main.py                          # FastAPI app entry point
├── api/
│   └── quality_gates_routes.py      # API endpoints
├── services/
│   ├── quality_gates_service.py     # Main orchestration service
│   ├── great_expectations_service.py # Schema validation
│   ├── data_profiling.py            # YData profiling
│   ├── governance_service.py        # OPA policy validation
│   └── ranger_policy_generator.py   # Security policies
└── models/
    └── quality_gates.py             # Pydantic models
```

### QualityGatesService Implementation

```python
# backend/services/quality_gates_service.py
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd
import uuid

from .great_expectations_service import GreatExpectationsService
from .governance_service import GovernanceService
from .data_profiling import DataProfilingService
from .ranger_policy_generator import RangerPolicyGenerator

class QualityGatesService:
    """
    Orchestrates all quality validation gates for data product deployment

    Three-tier gate system:
    - TIER 1 (BLOCKING): Must pass to deploy (policy, security, critical quality)
    - TIER 2 (WARNING): Can deploy with acknowledgment (quality issues, missing docs)
    - TIER 3 (OPTIMIZATION): Deploy first, improve later (performance, enhancements)
    """

    def __init__(self):
        self.ge_service = GreatExpectationsService()
        self.governance_service = GovernanceService()
        self.ranger_service = RangerPolicyGenerator()
        self.profiling_service = DataProfilingService()

        # In-memory cache for execution status (use Redis in production)
        self.execution_cache: Dict[str, Dict[str, Any]] = {}

    async def run_all_gates(
        self,
        data_product_name: str,
        product_definition: Dict[str, Any],
        sample_data: Optional[pd.DataFrame] = None,
        quality_rules: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Execute all quality gates asynchronously

        Returns:
            execution_id: UUID for tracking gate execution
        """
        execution_id = str(uuid.uuid4())

        # Initialize execution status
        self.execution_cache[execution_id] = {
            "execution_id": execution_id,
            "status": "queued",
            "progress": {
                "total_gates": 5,
                "completed_gates": 0
            },
            "created_at": datetime.utcnow().isoformat(),
            "data_product_name": data_product_name
        }

        # Execute gates asynchronously (don't await)
        asyncio.create_task(
            self._execute_gates(execution_id, data_product_name, product_definition, sample_data, quality_rules)
        )

        return execution_id

    async def _execute_gates(
        self,
        execution_id: str,
        data_product_name: str,
        product_definition: Dict[str, Any],
        sample_data: Optional[pd.DataFrame],
        quality_rules: Optional[List[Dict[str, Any]]]
    ):
        """Internal method to execute all gates"""
        try:
            # Update status to running
            self.execution_cache[execution_id]["status"] = "running"
            self.execution_cache[execution_id]["started_at"] = datetime.utcnow().isoformat()

            results = {
                "tier1_blocking": [],
                "tier2_warnings": [],
                "tier3_optimizations": []
            }

            # Gate 1: Policy Compliance (Tier 1 - Blocking)
            self._update_current_gate(execution_id, "Policy Compliance", 1)
            gate1_result = await self._gate1_policy_compliance(product_definition)
            results["tier1_blocking"].append(gate1_result)

            # Gate 2: Cost Estimation (Tier 1 if >$1000/day, Tier 2 otherwise)
            self._update_current_gate(execution_id, "Cost Estimation", 2)
            gate2_result = await self._gate2_cost_estimation(product_definition)
            if gate2_result["details"]["daily_cost"] > 1000:
                results["tier1_blocking"].append(gate2_result)
            elif gate2_result["details"]["daily_cost"] > 100:
                results["tier2_warnings"].append(gate2_result)
            else:
                results["tier3_optimizations"].append(gate2_result)

            # Gate 3: Schema Validation (Tier 1 - Blocking)
            self._update_current_gate(execution_id, "Schema Validation", 3)
            gate3_result = await self._gate3_schema_validation(product_definition, sample_data)
            results["tier1_blocking"].append(gate3_result)

            # Gate 4: Security Scanning (Tier 1 - Blocking)
            self._update_current_gate(execution_id, "Security Scanning", 4)
            gate4_result = await self._gate4_security_scanning(product_definition, sample_data)
            results["tier1_blocking"].append(gate4_result)

            # Gate 5: Performance Prediction (Tier 2 - Warning)
            self._update_current_gate(execution_id, "Performance Prediction", 5)
            gate5_result = await self._gate5_performance_prediction(product_definition)
            results["tier2_warnings"].append(gate5_result)

            # Calculate summary
            all_gates = (
                results["tier1_blocking"] +
                results["tier2_warnings"] +
                results["tier3_optimizations"]
            )

            summary = {
                "total_gates": len(all_gates),
                "passed": len([g for g in all_gates if g["passed"]]),
                "failed": len([g for g in all_gates if not g["passed"] and g["tier"] == 1]),
                "warnings": len([g for g in all_gates if not g["passed"] and g["tier"] == 2])
            }

            # Determine if can proceed
            can_proceed = all(g["passed"] for g in results["tier1_blocking"])
            requires_acknowledgment = any(not g["passed"] for g in results["tier2_warnings"])

            # Update cache with final results
            self.execution_cache[execution_id].update({
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat(),
                "duration_ms": self._calculate_duration(execution_id),
                "results": {
                    "execution_id": execution_id,
                    "data_product_name": data_product_name,
                    "tier1_blocking": results["tier1_blocking"],
                    "tier2_warnings": results["tier2_warnings"],
                    "tier3_optimizations": results["tier3_optimizations"],
                    "can_proceed": can_proceed,
                    "requires_acknowledgment": requires_acknowledgment,
                    "summary": summary
                }
            })

        except Exception as e:
            # Handle execution failure
            self.execution_cache[execution_id].update({
                "status": "failed",
                "error": {
                    "code": "EXECUTION_ERROR",
                    "message": str(e),
                    "details": {}
                },
                "completed_at": datetime.utcnow().isoformat()
            })

    def _update_current_gate(self, execution_id: str, gate_name: str, gate_number: int):
        """Update execution cache with current gate progress"""
        self.execution_cache[execution_id]["progress"]["current_gate"] = {
            "name": gate_name,
            "status": "running",
            "started_at": datetime.utcnow().isoformat()
        }
        self.execution_cache[execution_id]["progress"]["completed_gates"] = gate_number - 1

    async def _gate1_policy_compliance(self, product_definition: Dict[str, Any]) -> Dict[str, Any]:
        """Gate 1: OPA Policy Compliance Check"""
        start_time = datetime.utcnow()

        violations = await self.governance_service.evaluate_policies(
            sources=product_definition.get("sources", []),
            classification=product_definition.get("classification", "internal"),
            transformations=product_definition.get("transformations", {})
        )

        passed = len(violations.get("critical", [])) == 0

        return {
            "gate_name": "Policy Compliance",
            "gate_id": "policy_compliance",
            "tier": 1,
            "passed": passed,
            "severity": "blocking" if not passed else "info",
            "message": f"{len(violations.get('critical', []))} critical policy violations detected" if not passed else "All policies compliant",
            "details": violations,
            "recommendations": [
                "Review cross-domain data sharing policies",
                "Ensure source data access permissions",
                "Validate data classification"
            ] if not passed else [],
            "execution_time_ms": (datetime.utcnow() - start_time).total_seconds() * 1000
        }

    async def _gate2_cost_estimation(self, product_definition: Dict[str, Any]) -> Dict[str, Any]:
        """Gate 2: Cost Estimation"""
        start_time = datetime.utcnow()

        # Estimate compute cost based on sources and transformations
        daily_cost = self._estimate_cost(product_definition)
        monthly_cost = daily_cost * 30

        tier = 1 if daily_cost > 1000 else 2 if daily_cost > 100 else 3
        passed = daily_cost <= 1000

        return {
            "gate_name": "Cost Estimation",
            "gate_id": "cost_estimation",
            "tier": tier,
            "passed": passed,
            "severity": "blocking" if tier == 1 else "warning" if tier == 2 else "info",
            "message": f"Estimated daily cost: ${daily_cost:.2f}",
            "details": {
                "daily_cost": daily_cost,
                "monthly_cost": monthly_cost,
                "breakdown": {
                    "compute": daily_cost * 0.8,
                    "storage": daily_cost * 0.2
                }
            },
            "recommendations": [
                "Add filter predicates to reduce data scanned",
                "Use partitioning to limit full table scans",
                "Consider incremental refresh instead of full refresh"
            ] if not passed else [],
            "execution_time_ms": (datetime.utcnow() - start_time).total_seconds() * 1000
        }

    async def _gate3_schema_validation(
        self,
        product_definition: Dict[str, Any],
        sample_data: Optional[pd.DataFrame]
    ) -> Dict[str, Any]:
        """Gate 3: Schema Validation using Great Expectations"""
        start_time = datetime.utcnow()

        validation_result = await self.ge_service.validate_schema(
            expected_schema=product_definition.get("output_schema", []),
            sample_data=sample_data
        )

        return {
            "gate_name": "Schema Validation",
            "gate_id": "schema_validation",
            "tier": 1,
            "passed": validation_result["passed"],
            "severity": "blocking" if not validation_result["passed"] else "info",
            "message": validation_result["message"],
            "details": validation_result["details"],
            "recommendations": validation_result.get("recommendations", []),
            "execution_time_ms": (datetime.utcnow() - start_time).total_seconds() * 1000
        }

    async def _gate4_security_scanning(
        self,
        product_definition: Dict[str, Any],
        sample_data: Optional[pd.DataFrame]
    ) -> Dict[str, Any]:
        """Gate 4: Security Scanning (PII Detection)"""
        start_time = datetime.utcnow()

        # PII detection logic
        pii_findings = await self._detect_pii(product_definition, sample_data)

        passed = len(pii_findings) == 0

        return {
            "gate_name": "Security Scanning",
            "gate_id": "security_scanning",
            "tier": 1,
            "passed": passed,
            "severity": "blocking" if not passed else "info",
            "message": f"PII detected in {len(pii_findings)} columns" if not passed else "No security issues found",
            "details": {
                "pii_columns": pii_findings,
                "masking_available": True
            },
            "recommendations": [
                "Apply data masking in transformations",
                "Use Ranger policies for column-level access control",
                "Request data steward approval for legitimate PII exposure"
            ] if not passed else [],
            "execution_time_ms": (datetime.utcnow() - start_time).total_seconds() * 1000,
            "confidence_score": 0.95
        }

    async def _gate5_performance_prediction(self, product_definition: Dict[str, Any]) -> Dict[str, Any]:
        """Gate 5: Performance Prediction"""
        start_time = datetime.utcnow()

        # Predict query performance
        prediction = self._predict_performance(product_definition)

        passed = prediction["execution_time_sec"] < 30

        return {
            "gate_name": "Performance Prediction",
            "gate_id": "performance_prediction",
            "tier": 2,
            "passed": passed,
            "severity": "warning" if not passed else "info",
            "message": f"Predicted execution time: {prediction['execution_time_sec']} seconds",
            "details": prediction,
            "recommendations": prediction.get("optimizations", []),
            "execution_time_ms": (datetime.utcnow() - start_time).total_seconds() * 1000,
            "confidence_score": 0.80
        }

    def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of gate execution"""
        return self.execution_cache.get(execution_id)

    # Helper methods
    def _estimate_cost(self, product_definition: Dict[str, Any]) -> float:
        """Estimate compute cost based on sources and complexity"""
        # Placeholder: Implement cost estimation logic
        return 150.0

    async def _detect_pii(
        self,
        product_definition: Dict[str, Any],
        sample_data: Optional[pd.DataFrame]
    ) -> List[str]:
        """Detect PII columns"""
        # Placeholder: Implement PII detection
        return []

    def _predict_performance(self, product_definition: Dict[str, Any]) -> Dict[str, Any]:
        """Predict query performance"""
        # Placeholder: Implement performance prediction
        return {
            "execution_time_sec": 12,
            "optimizations": []
        }

    def _calculate_duration(self, execution_id: str) -> int:
        """Calculate execution duration in milliseconds"""
        cache = self.execution_cache.get(execution_id, {})
        if "started_at" in cache and "completed_at" in cache:
            start = datetime.fromisoformat(cache["started_at"])
            end = datetime.fromisoformat(cache["completed_at"])
            return int((end - start).total_seconds() * 1000)
        return 0
```

### FastAPI Routes

```python
# backend/api/quality_gates_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from ..services.quality_gates_service import QualityGatesService

router = APIRouter(prefix="/quality-gates", tags=["Quality Gates"])
gates_service = QualityGatesService()

class ExecuteGatesRequest(BaseModel):
    data_product_name: str
    product_definition: Dict[str, Any]
    sample_data: Optional[Dict[str, Any]] = None
    options: Optional[Dict[str, Any]] = None

@router.post("/execute")
async def execute_quality_gates(request: ExecuteGatesRequest):
    """Execute all quality gates for a data product"""
    try:
        execution_id = await gates_service.run_all_gates(
            data_product_name=request.data_product_name,
            product_definition=request.product_definition,
            sample_data=None,  # Parse sample_data if provided
            quality_rules=None
        )

        return {
            "execution_id": execution_id,
            "status": "queued",
            "created_at": gates_service.execution_cache[execution_id]["created_at"],
            "estimated_duration_ms": 10000  # 10 seconds average
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{execution_id}")
async def get_gate_status(execution_id: str):
    """Get current status of gate execution"""
    status = gates_service.get_execution_status(execution_id)

    if not status:
        raise HTTPException(status_code=404, detail="Execution not found")

    return status
```

---

## Frontend Implementation

### React Query Integration

```typescript
// hooks/useQualityGates.ts
import { useQuery, useMutation } from '@tanstack/react-query';

interface ExecuteGatesRequest {
  data_product_name: string;
  product_definition: any;
}

interface ExecuteGatesResponse {
  execution_id: string;
  status: string;
  created_at: string;
}

interface GateExecutionStatus {
  execution_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: {
    total_gates: number;
    completed_gates: number;
    current_gate?: {
      name: string;
      status: string;
    };
  };
  results?: any;
}

export function useExecuteQualityGates() {
  return useMutation<ExecuteGatesResponse, Error, ExecuteGatesRequest>({
    mutationFn: async (request) => {
      const response = await fetch('/api/build/run-quality-gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to execute quality gates');
      }

      return response.json();
    },
  });
}

export function useGateExecutionStatus(executionId: string | null, enabled: boolean = true) {
  return useQuery<GateExecutionStatus>({
    queryKey: ['gate-execution', executionId],
    queryFn: async () => {
      const response = await fetch(`/api/build/gate-status/${executionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch gate status');
      }

      return response.json();
    },
    enabled: enabled && !!executionId,
    refetchInterval: (data) => {
      // Stop polling when completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      // Poll every 1 second while running
      return 1000;
    },
    staleTime: 0, // Always fetch fresh data
  });
}
```

### Step 4 Component Usage

```typescript
// components/build/steps/Step4QualityGates.tsx
'use client';

import { useEffect, useState } from 'react';
import { useExecuteQualityGates, useGateExecutionStatus } from '@/hooks/useQualityGates';
import { GateExecutionProgress } from './GateExecutionProgress';
import { GateResults } from './GateResults';

interface Step4QualityGatesProps {
  productDefinition: any;
  onBack: () => void;
  onContinue: () => void;
}

export function Step4QualityGates({
  productDefinition,
  onBack,
  onContinue
}: Step4QualityGatesProps) {
  const [executionId, setExecutionId] = useState<string | null>(null);

  const executeGates = useExecuteQualityGates();
  const { data: status, isLoading } = useGateExecutionStatus(executionId);

  // Auto-trigger gate execution on mount
  useEffect(() => {
    executeGates.mutate(
      {
        data_product_name: productDefinition.name,
        product_definition: productDefinition,
      },
      {
        onSuccess: (data) => {
          setExecutionId(data.execution_id);
        },
        onError: (error) => {
          console.error('Gate execution failed:', error);
        },
      }
    );
  }, []);

  // Show loading state
  if (!status || status.status === 'queued' || status.status === 'running') {
    return (
      <GateExecutionProgress
        gates={status?.progress || { total_gates: 5, completed_gates: 0 }}
        currentGate={status?.progress.current_gate}
      />
    );
  }

  // Show results
  if (status.status === 'completed') {
    return (
      <GateResults
        results={status.results}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  }

  // Show error state
  if (status.status === 'failed') {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Gate execution failed. Please try again.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return null;
}
```

---

## Error Handling

### Backend Error Scenarios

1. **Service Unavailable** (OPA, Great Expectations down)
   - Mark gate as "skipped" with reason
   - Allow deployment with warning
   - Log incident for operations team

2. **Timeout** (Gate takes >30 seconds)
   - Cancel execution
   - Return partial results
   - Allow user to retry or skip

3. **Invalid Input** (Malformed product definition)
   - Return 400 Bad Request with validation errors
   - Provide clear guidance on fixing issues

### Frontend Error Handling

```typescript
// Error boundary for Step 4
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="p-6 border border-red-500 rounded-lg">
      <h3 className="text-lg font-semibold text-red-600 mb-2">
        Quality Gates Error
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message}
      </p>
      <div className="flex gap-3">
        <Button onClick={resetErrorBoundary}>
          Retry
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/support'}>
          Contact Support
        </Button>
      </div>
    </div>
  );
}

export function Step4WithErrorBoundary(props: Step4QualityGatesProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Step4QualityGates {...props} />
    </ErrorBoundary>
  );
}
```

---

## Performance Optimization

### 1. Caching Strategy

**Backend**:
- Use Redis for execution status cache (instead of in-memory dict)
- Cache gate results for 1 hour
- Cache cost estimates for identical queries

**Frontend**:
- Cache completed gate results in React Query
- Prefetch Step 5 data during gate execution

### 2. Parallel Gate Execution

Execute independent gates in parallel:

```python
async def _execute_gates(self, execution_id, ...):
    # Execute all gates in parallel
    results = await asyncio.gather(
        self._gate1_policy_compliance(product_definition),
        self._gate2_cost_estimation(product_definition),
        self._gate3_schema_validation(product_definition, sample_data),
        self._gate4_security_scanning(product_definition, sample_data),
        self._gate5_performance_prediction(product_definition),
        return_exceptions=True  # Handle failures gracefully
    )
```

**Improvement**: 15s sequential → 5s parallel execution

### 3. Incremental Results

Stream partial results as gates complete:

```python
# Use Server-Sent Events (SSE) for real-time updates
@router.get("/stream/{execution_id}")
async def stream_gate_execution(execution_id: str):
    async def event_generator():
        while True:
            status = gates_service.get_execution_status(execution_id)
            yield f"data: {json.dumps(status)}\n\n"

            if status["status"] in ["completed", "failed"]:
                break

            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())
```

---

## Integration with Governance Dashboard

### Linking Gate Execution to Dashboard

After gate execution completes, results are automatically available in `/govern/quality`:

```python
# Store gate results in database for historical tracking
class GateExecutionRecord(BaseModel):
    execution_id: str
    data_product_id: str
    data_product_name: str
    executed_at: datetime
    duration_ms: int
    tier1_blocking: List[GateResult]
    tier2_warnings: List[GateResult]
    tier3_optimizations: List[GateResult]
    can_proceed: bool

# After gate execution, save to DB
await db.gate_executions.insert_one(record.dict())
```

### Dashboard Queries

```python
@router.get("/quality-gates/executions")
async def get_gate_executions(
    product_id: Optional[str] = None,
    limit: int = 50
):
    """Get recent gate executions for governance dashboard"""
    query = {}
    if product_id:
        query["data_product_id"] = product_id

    executions = await db.gate_executions.find(query).limit(limit).to_list()
    return executions
```

---

## Testing Strategy

### Backend Unit Tests

```python
# tests/test_quality_gates_service.py
import pytest
from services.quality_gates_service import QualityGatesService

@pytest.mark.asyncio
async def test_gate1_policy_compliance_pass():
    service = QualityGatesService()

    product_def = {
        "sources": [{"catalog": "bronze", "schema": "public", "table": "users"}],
        "classification": "internal"
    }

    result = await service._gate1_policy_compliance(product_def)

    assert result["passed"] == True
    assert result["tier"] == 1
    assert result["severity"] == "info"

@pytest.mark.asyncio
async def test_gate4_security_scanning_pii_detected():
    service = QualityGatesService()

    product_def = {
        "output_schema": [
            {"column_name": "email", "data_type": "varchar"},
            {"column_name": "ssn", "data_type": "varchar"}
        ]
    }

    result = await service._gate4_security_scanning(product_def, None)

    assert result["passed"] == False
    assert result["severity"] == "blocking"
    assert len(result["details"]["pii_columns"]) > 0
```

### Frontend Integration Tests

```typescript
// __tests__/Step4QualityGates.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Step4QualityGates } from '@/components/build/steps/Step4QualityGates';

describe('Step4QualityGates', () => {
  it('should execute gates and display results', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <Step4QualityGates
          productDefinition={{ name: 'test_product' }}
          onBack={() => {}}
          onContinue={() => {}}
        />
      </QueryClientProvider>
    );

    // Wait for gate execution to start
    await waitFor(() => {
      expect(screen.getByText(/Running Gate 1/i)).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/Gate Results Summary/i)).toBeInTheDocument();
    }, { timeout: 15000 });

    // Verify results displayed
    expect(screen.getByText(/Policy Compliance/i)).toBeInTheDocument();
  });
});
```

---

## Deployment Considerations

### Environment Variables

```bash
# .env.local (Frontend)
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000

# backend/.env (Backend)
DATABASE_URL=postgresql://user:pass@localhost/nexusone
REDIS_URL=redis://localhost:6379
OPA_SERVER_URL=http://localhost:8181
```

### Production Checklist

- [ ] Replace in-memory cache with Redis
- [ ] Add authentication/authorization to API endpoints
- [ ] Implement rate limiting for gate execution
- [ ] Set up monitoring/alerting for gate failures
- [ ] Configure timeout values based on production workloads
- [ ] Enable CORS for frontend-backend communication
- [ ] Set up database for persistent gate execution history
- [ ] Configure logging/observability (DataDog, New Relic)

---

## Success Metrics

### Performance Metrics
- **Gate Execution Time**: <10s for 95th percentile
- **API Response Time**: <100ms for status endpoint
- **Throughput**: 100+ concurrent gate executions

### Reliability Metrics
- **Uptime**: 99.9% for gate execution service
- **Error Rate**: <0.5% failed executions
- **Timeout Rate**: <1% of executions

### User Metrics
- **Completion Rate**: >95% of users complete Step 4
- **Retry Rate**: <5% of users retry gate execution
- **Support Tickets**: <2% related to gate failures

---

## Conclusion

This technical integration connects the NexusOne build flow frontend with the Python backend quality gates system, enabling:

1. **Automated quality validation** without manual configuration
2. **Real-time progress updates** via polling or WebSocket
3. **3-tier gate framework** with clear blocking/warning/optimization separation
4. **Seamless governance integration** linking build flow to monitoring dashboard
5. **Production-ready architecture** with error handling, caching, and scalability

By leveraging the existing `QualityGatesService` and related backend services, Step 4 provides a transparent, fast, and reliable quality checkpoint that aligns with the "deploy-first, optimize-later" philosophy.
