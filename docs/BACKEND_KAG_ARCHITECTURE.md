# NexusOne Backend: KAG/OpenSPG + Kuzu Integration Architecture
**Version 1.0 - Agent-Augmented MVP with Knowledge Graph Reasoning**

## Executive Summary

This document outlines the enhanced backend architecture for NexusOne that integrates:
- **KAG (Knowledge-Augmented Generation)** for intelligent reasoning
- **OpenSPG** for semantic graph modeling
- **Kuzu** for embedded graph database (no separate infrastructure)
- **CrewAI** for agent orchestration
- **Human-in-the-loop** controls for all AI recommendations

### Key Goals
1. Improve pattern matching accuracy by 30% through graph reasoning
2. Provide domain-specific accelerators for instant expertise
3. Enable relationship discovery across contracts, products, and patterns
4. Maintain complete human control with comprehensive audit trails
5. Keep MVP lightweight with embedded Kuzu (no Neo4j overhead)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│              Port 3000 - Public IP Access                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ REST API
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Agent Orchestration Layer                   │  │
│  │  - CrewAI Agents (Quality, Architecture, Pattern)     │  │
│  │  - Human Approval Workflows                            │  │
│  │  - Audit Logging                                       │  │
│  └────────────┬──────────────────────┬────────────────────┘  │
│               │                      │                        │
│  ┌────────────▼──────────┐  ┌───────▼────────────┐          │
│  │   KAG Intelligence     │  │  Traditional ML     │          │
│  │  - Graph Reasoning     │  │  - ydata-profiling │          │
│  │  - Pattern Matching    │  │  - Great Expectations│        │
│  │  - Impact Analysis     │  │  - Data Validation  │          │
│  └────────────┬───────────┘  └─────────────────────┘          │
│               │                                                │
│  ┌────────────▼──────────────────────────────────────────┐   │
│  │         Knowledge Graph Layer (Kuzu)                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │  Contracts   │  │   Products   │  │  Patterns   │ │   │
│  │  │  (ODCS)      │  │   (ODPS)     │  │  Library    │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │   │
│  │         │                  │                  │        │   │
│  │         └──────────────────┼──────────────────┘        │   │
│  │                     Relationships                      │   │
│  │              (IMPLEMENTS, USES_PATTERN,               │   │
│  │               DERIVED_FROM, MAPS_TO)                  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Domain Accelerators                       │   │
│  │  - Retail (Customer 360, Churn, Segmentation)        │   │
│  │  - Financial (Fraud Detection, Risk Scoring)          │   │
│  │  - Healthcare (Patient Journey, Outcomes)             │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Kuzu Embedded Graph Database

**Why Kuzu over Neo4j for MVP:**
- ✅ No separate server infrastructure needed
- ✅ Embedded library (like SQLite for graphs)
- ✅ Perfect for < 1M nodes (MVP scale)
- ✅ Faster for small graphs
- ✅ MIT licensed (completely free)
- ✅ Simple Python API
- ✅ ~100MB for MVP-scale graphs vs 2-4GB for Neo4j

**Graph Schema:**

```python
# Node Types
- DataContract (ODCS)
  - id, name, domain, schema, quality_rules, success_rate

- DataProduct (ODPS)
  - id, name, contract_id, delivery_type, usage_count

- Pattern
  - id, name, category, domain, template, success_metrics

- BusinessTerm
  - id, term, definition, domain, related_fields

# Relationship Types
- IMPLEMENTS: DataProduct -> DataContract
- USES_PATTERN: DataProduct -> Pattern (with confidence score)
- DERIVED_FROM: DataContract -> DataContract
- MAPS_TO: DataContract -> BusinessTerm (with field_name)
- DEPENDS_ON: Pattern -> Pattern
```

### 2. KAG Integration

**KAG Configuration:**

```python
from kag import KAG

kag_config = {
    "spg_config": {
        "backend": "kuzu",
        "connection": kuzu_connection
    },
    "llm_config": {
        "provider": "ollama",  # Local LLM
        "model": "llama3.1:8b",
        "base_url": "http://localhost:11434"
    },
    "reasoning_mode": "hybrid"  # Graph + LLM reasoning
}
```

**Reasoning Capabilities:**
1. **Hybrid Reasoning**: Combines graph traversal + LLM understanding
2. **Explainable**: Shows reasoning path through graph
3. **Relationship Discovery**: Finds non-obvious connections
4. **Impact Analysis**: Traces downstream effects via graph

### 3. Enhanced CrewAI Agents

**Contract Generation Assistant:**
- Uses KAG to find similar successful contracts
- Applies proven patterns from graph
- Suggests quality rules based on domain knowledge
- Explains recommendations with graph evidence

**Pattern Recommendation Engine:**
- Graph traversal to find applicable patterns
- Learning from successful implementations
- Pattern combination discovery
- Success rate tracking via graph metrics

**DataHub Enrichment Assistant:**
- Auto-generates documentation from contracts
- Maps technical fields to business terms
- Infers lineage from graph relationships
- Suggests tags based on graph context

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Week 1: Kuzu Setup**
```bash
# Install dependencies
pip install kuzu kag-framework ollama crewai

# Initialize Kuzu database
python backend/services/kuzu_init.py
```

**Deliverables:**
- ✅ Kuzu embedded database running
- ✅ Graph schema created
- ✅ Basic CRUD operations
- ✅ KAG adapter for Kuzu

**Week 2: KAG Integration**
- Connect KAG to Kuzu
- Configure Ollama LLM
- Test hybrid reasoning
- Validate performance (<2s response)

### Phase 2: Agent Enhancement (Weeks 3-4)

**Week 3: Contract Assistant**
- Graph-based contract suggestion
- Similar contract discovery
- Quality rule recommendations
- Impact analysis for changes

**Week 4: Pattern Engine**
- Pattern matching with graph
- Pattern combination discovery
- Success tracking
- Learning from implementations

### Phase 3: Domain Accelerators (Weeks 5-6)

**Week 5: Pre-built Domains**
- Retail domain graph
- Financial domain graph
- Healthcare domain graph
- Domain switching capability

**Week 6: Polish & Testing**
- Performance optimization
- Comprehensive testing
- Documentation
- Team training

---

## API Endpoints (New)

### Contract Generation with KAG

```python
POST /api/v1/contracts/suggest
{
  "business_requirements": "Create unified customer profile",
  "domain": "retail",
  "critical_fields": ["customer_id", "lifetime_value"]
}

Response:
{
  "contract": {
    "schema": {...},
    "quality_rules": [...]
  },
  "similar_contracts": [
    {
      "name": "customer_360_v2",
      "success_rate": 0.92,
      "similarity_score": 0.87
    }
  ],
  "applied_patterns": ["customer_360"],
  "reasoning_path": "Found 3 similar contracts in retail domain...",
  "confidence": 0.85,
  "requires_approval": true
}
```

### Pattern Recommendation with Graph

```python
POST /api/v1/patterns/recommend
{
  "requirements": {
    "domain": "retail",
    "use_case": "customer_churn",
    "data_sources": ["crm", "transactions"]
  }
}

Response:
{
  "patterns": [
    {
      "pattern": {
        "id": "churn_prediction",
        "name": "Customer Churn Model",
        "success_rate": 0.89
      },
      "match_score": 0.92,
      "reasoning": "This pattern has been used successfully 23 times...",
      "required_dependencies": ["customer_360"],
      "estimated_effort": "3 days"
    }
  ],
  "novel_combinations": [
    {
      "patterns": ["customer_360", "churn_prediction"],
      "success_rate": 0.87,
      "used_together": 12
    }
  ]
}
```

### Impact Analysis

```python
POST /api/v1/contracts/{contract_id}/impact-analysis
{
  "proposed_changes": {
    "schema_changes": {
      "removed_fields": ["old_field"],
      "added_fields": ["new_field"]
    }
  }
}

Response:
{
  "directly_affected": [
    {"product": "customer_analytics", "breaking": true}
  ],
  "downstream_affected": [
    {"contract": "customer_metrics", "migration_required": true}
  ],
  "affected_domains": ["Marketing", "Sales"],
  "estimated_migration_effort": "2 days",
  "migration_plan": {
    "steps": [...]
  }
}
```

---

## Human-in-the-Loop Controls

### Approval Workflow

```python
# Every suggestion requires explicit approval
{
  "suggestion_id": "uuid",
  "agent": "ContractAssistant",
  "suggestion": {...},
  "confidence": 0.85,
  "requires_approval": true,
  "approval_options": [
    "accept_as_is",
    "modify_and_accept",
    "reject_with_feedback",
    "request_alternatives"
  ]
}
```

### Audit Trail

```sql
-- audit_log table
CREATE TABLE agent_suggestions (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP,
  user_id TEXT,
  agent_name TEXT,
  action TEXT,
  input JSONB,
  suggestion JSONB,
  confidence DECIMAL,
  human_action TEXT,  -- accepted/modified/rejected
  modifications JSONB,
  feedback TEXT,
  final_outcome JSONB,
  timestamp_responded TIMESTAMP
);
```

---

## Success Metrics

### Validation Tests

```python
class KAGValidationTests:
    def test_reasoning_improvement(self):
        """Measure KAG vs keyword matching accuracy"""
        target: >30% improvement

    def test_relationship_discovery(self):
        """Find non-obvious pattern relationships"""
        target: 5+ useful discoveries

    def test_domain_acceleration(self):
        """Measure speedup from pre-built domains"""
        target: <2s for domain suggestions

    def test_performance_scale(self):
        """Validate performance at MVP scale"""
        targets:
          - Simple query: <10ms
          - Pattern match: <100ms
          - Impact analysis: <500ms
          - KAG reasoning: <2s
```

### Business Metrics

```yaml
Efficiency Improvements:
  Contract Creation: 50% faster (4h → 2h)
  Pattern Reuse: 60% adoption (up from 20%)
  Documentation Coverage: 90% (up from 40%)

Quality Improvements:
  Suggestion Acceptance: >70%
  Pattern Success Rate: >85%
  Contract Compliance: >95%

Adoption Metrics:
  User Engagement: 100% of data engineers
  Feedback Score: >8/10
```

---

## Technology Stack

```python
technology_stack = {
    # Graph & Reasoning
    "graph_db": "kuzu==0.0.9",
    "kag": "kag-framework==0.1.0",  # Knowledge-Augmented Generation
    "openspg": "openspg==0.1.0",    # Semantic graph modeling

    # AI & Agents
    "agents": "crewai==0.28.0",
    "llm": "ollama (llama3.1:8b)",   # Local LLM

    # Backend
    "api": "fastapi==0.104.0",
    "async": "asyncio",

    # Storage
    "audit": "postgresql",
    "cache": "redis (optional)",

    # Monitoring
    "logging": "python logging",
    "metrics": "prometheus (optional)"
}

# Total infrastructure cost: $0/month (all self-hosted)
# Development effort: 2 engineers × 6 weeks
```

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Kuzu limitations at scale | Design for easy Neo4j migration; Monitor at 50k nodes |
| KAG reasoning quality | Confidence scores + human validation always required |
| Graph complexity | Limit to 3 domains; Max 4 relationship types; Regular cleanup |
| Performance bottlenecks | Caching; Async operations; Query optimization |

### Adoption Risks

| Risk | Mitigation |
|------|------------|
| User resistance | Suggestions only; Show reasoning; Easy override |
| Over-reliance | Confidence indicators; Audit trails; Manual override always available |
| Stale knowledge | Success tracking; Weekly pattern review; Auto-deprecation |

---

## Next Steps

### Immediate Actions (This Week)

1. **Set up development environment in worktree4**
   ```bash
   cd /mnt/blockstorage/paper-lens-worktree4
   pip install kuzu kag-framework openspg
   ```

2. **Create Kuzu database structure**
   - Implement graph schema
   - Load sample data
   - Test basic queries

3. **Integrate KAG**
   - Configure with Ollama
   - Test hybrid reasoning
   - Validate performance

4. **Enhance first agent**
   - Contract Generation Assistant
   - Graph-based recommendations
   - Human approval workflow

### Week 2-6 Roadmap

- Week 2: Pattern Recommendation Engine
- Week 3: DataHub Enrichment Assistant
- Week 4: Domain Accelerators (Retail, Financial)
- Week 5: Testing & Optimization
- Week 6: Documentation & Training

---

## Conclusion

This architecture provides:
✅ **Intelligent reasoning** via KAG + Kuzu graph traversal
✅ **Lightweight MVP** with no separate infrastructure
✅ **Complete human control** with approval workflows
✅ **Domain expertise** through pre-built accelerators
✅ **Measurable improvement** with clear success metrics
✅ **Easy scaling** path to Neo4j if needed

The embedded Kuzu approach allows us to validate graph reasoning benefits without infrastructure overhead, while maintaining a clear migration path to enterprise-scale Neo4j if the MVP proves successful.
