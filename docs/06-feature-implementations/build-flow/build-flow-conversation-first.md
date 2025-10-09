# NexusOne Build Flow: Conversation-First Data Product Creation
**Product Requirements Document**

**Version**: 1.0
**Date**: September 2025
**Status**: Implementation Ready
**Philosophy**: Meet engineers where they work, extract structure from chaos, build DataHub health through usage

---

## Executive Summary

### **The Core Problem**

Data engineers receive work requests through Slack messages, emails, and hallway conversations - not through perfectly structured tickets. Forcing them to translate messy human communication into structured forms creates friction, delays, and incomplete context.

**From research:** Engineers spend 33% of time on coordination tasks, and 74% of quality issues are discovered by stakeholders (not proactive monitoring) because engineers build technically sound products that miss business requirements.

### **The Solution: Conversation-First Build Flow**

Instead of requiring structured input, let engineers paste the actual Slack message, email, or conversation that triggered the work. Use LLM-powered extraction to structure the chaos, then create a feedback loop where every build action improves DataHub metadata quality.

### **Key Innovation: The Virtuous Cycle**

```
Engineer pastes messy request →
AI extracts structure →
Engineer builds with context →
Metadata automatically captured →
Better recommendations next time →
DataHub gets healthier →
Engineer sees value →
Engineer adds more context
```

**This approach eliminates:**
- ❌ Complex Jira/ServiceNow integrations that never work for all teams
- ❌ Mandatory metadata entry that engineers skip
- ❌ Assumption that tickets are the source of truth

**This approach delivers:**
- ✅ 90% faster context capture (paste vs. form filling)
- ✅ Automatic DataHub enrichment through usage
- ✅ Better recommendations as metadata quality improves
- ✅ Engineers actually maintain metadata because they see value

---

## The Build Flow Architecture

### **Entry Point: "What are you building?"**

Replace the current "Data Discovery" starting point with a conversation-first interface:

```typescript
interface BuildEntryPoint {
  primaryMethod: 'paste-conversation';  // 80% of users
  fallbackMethods: ['ticket-url', 'manual-form'];  // 20% of users
  aiExtraction: 'always-on';
  confidence: 'show-to-user';
}
```

#### **UI Layout**

```
┌─── Build Data Product ─────────────────────────────────────────────────┐
│                                                                        │
│  What are you building?                                                │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Paste your request (Slack message, email, or just describe it) │  │
│  │                                                                 │  │
│  │ [Large text area]                                               │  │
│  │                                                                 │  │
│  │ Example: "Hey Sarah, Jennifer from Marketing needs customer    │  │
│  │ churn data for the Q4 campaign. She needs it by Friday with    │  │
│  │ 95% accuracy. Can you help?"                                    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Or:                                                                   │
│  ├─ [Paste Jira/ServiceNow URL]                                        │
│  └─ [Fill form manually] (collapsed by default)                        │
│                                                                        │
│  [Extract Context & Continue] ──────────────────────────────────────→ │
└────────────────────────────────────────────────────────────────────────┘
```

### **Step 1: AI-Powered Context Extraction**

When engineer pastes text or URL, immediately extract structured context:

```typescript
interface ExtractedContext {
  // High-confidence extractions
  stakeholder: {
    name: string;           // "Jennifer from Marketing"
    email?: string;         // Matched to company directory
    department?: string;    // "Marketing"
    confidence: number;     // 0.0 - 1.0
  };

  businessNeed: {
    summary: string;        // "Customer churn analysis for Q4 campaign"
    keywords: string[];     // ["churn", "customer", "campaign"]
    urgency: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  };

  deadline: {
    date: Date;            // Parsed from "by Friday"
    type: 'hard' | 'soft'; // Regulatory vs. preference
    confidence: number;
  };

  qualityRequirements: {
    accuracy?: number;     // Extracted from "95% accuracy"
    freshness?: string;    // "real-time", "daily", "weekly"
    completeness?: number;
    confidence: number;
  };

  // Suggested data sources (from keyword analysis)
  suggestedSources: DataSource[];

  // Original text for reference
  originalRequest: string;
}
```

### **Step 2: Context Confirmation & Refinement**

Show extracted context to engineer for validation:

```
┌─── Extracted Context ──────────────────────────────────────────────────┐
│                                                                        │
│  🎯 Business Context (95% confidence)                                  │
│  ────────────────────────────────────────────────────────────────     │
│                                                                        │
│  Who needs this:                                                       │
│  ✓ Jennifer Chen (Marketing)  jennifer.chen@company.com              │
│    [Change] [Add others]                                               │
│                                                                        │
│  What they need:                                                       │
│  ✓ Customer churn analysis for Q4 campaign                            │
│    Keywords: churn, customer, campaign, Q4                            │
│    [Edit description]                                                  │
│                                                                        │
│  When they need it:                                                    │
│  ✓ Friday, Sep 29 (3 days) - Soft deadline                           │
│    [Change date] [Mark as hard deadline]                              │
│                                                                        │
│  Quality requirements:                                                 │
│  ✓ 95% accuracy (extracted from request)                              │
│  ? Freshness: Daily updates (inferred from similar projects)          │
│    [Confirm] [Change]                                                  │
│                                                                        │
│  ─────────────────────────────────────────────────────────────────    │
│                                                                        │
│  📊 Suggested Data Sources (based on "churn" + "customer")            │
│  ────────────────────────────────────────────────────────────────     │
│                                                                        │
│  ✓ customer_transactions (95% relevance)                              │
│    Used by Marketing in 3 similar projects                            │
│    Quality: 96% | Freshness: 2h ago | 2.5M records                    │
│                                                                        │
│  ✓ customer_demographics (87% relevance)                              │
│    Commonly combined with customer_transactions                       │
│    Quality: 94% | Freshness: 1d ago | 847K records                    │
│                                                                        │
│  ○ customer_support_tickets (73% relevance)                           │
│    May improve churn prediction accuracy                              │
│    Quality: 85% | Freshness: 45m ago | 230K records                   │
│                                                                        │
│  [Search for more sources] [Continue with selected sources] ────────→ │
│                                                                        │
│  💡 Tip: Based on similar projects, you'll likely also need           │
│     customer_events for behavioral analysis                           │
└────────────────────────────────────────────────────────────────────────┘
```

### **Step 3: Proceed to Technical Workflow**

Once context is confirmed, continue to existing technical steps:

```
Confirmed Context →
Source Selection (pre-filtered by relevance) →
Quality Analysis (with extracted requirements as baseline) →
Transform Design (with business context visible) →
API Configuration (with stakeholder access pre-configured) →
Deployment (with automatic DataHub metadata update)
```

---

## The DataHub Feedback Loop

### **Core Principle: Metadata as Byproduct, Not Chore**

Instead of asking engineers to "maintain DataHub," capture metadata automatically from their build activities, then surface that metadata in ways that help them work faster.

### **Automatic Metadata Capture Points**

#### **1. During Context Extraction**

```typescript
// When engineer confirms extracted context
async function onContextConfirmed(context: ExtractedContext) {
  // Automatically update DataHub
  await datahub.enrichAssets({
    datasets: context.suggestedSources.map(source => source.id),
    metadata: {
      stakeholders: [context.stakeholder.email],
      businessContext: context.businessNeed.summary,
      tags: context.businessNeed.keywords,
      qualityRequirements: context.qualityRequirements,
      lastUsedFor: {
        project: context.businessNeed.summary,
        date: new Date(),
        requestedBy: context.stakeholder.email
      }
    }
  });

  // No manual "update metadata" step required
}
```

#### **2. During Source Selection**

```typescript
// When engineer selects data sources
async function onSourcesSelected(selectedSources: DataSource[], context: ExtractedContext) {
  // Record usage patterns
  await datahub.recordUsagePattern({
    sources: selectedSources.map(s => s.id),
    usedTogether: selectedSources.length > 1,
    purpose: context.businessNeed.keywords,
    domain: context.stakeholder.department,
    successfulPattern: null  // Will update after deployment
  });
}
```

#### **3. During Pipeline Deployment**

```typescript
// When pipeline successfully deploys
async function onDeploymentSuccess(pipeline: DataProduct) {
  // Update DataHub with complete context
  await datahub.createOrUpdateDataProduct({
    name: pipeline.name,
    description: pipeline.businessContext.summary,
    owners: [getCurrentUser().email],
    stakeholders: [pipeline.stakeholder.email],
    domain: pipeline.stakeholder.department,
    sources: pipeline.sources.map(s => s.id),
    qualityRequirements: pipeline.qualityConfig,
    sla: {
      deadline: pipeline.deadline,
      freshnessRequirement: pipeline.qualityRequirements.freshness
    },
    lineage: pipeline.transformPipeline,
    tags: [
      ...pipeline.businessNeed.keywords,
      `stakeholder:${pipeline.stakeholder.name}`,
      `urgency:${pipeline.businessNeed.urgency}`
    ],
    customProperties: {
      originalRequest: pipeline.originalRequest,
      createdVia: 'nexusone-conversation-flow',
      confidence: pipeline.extractionConfidence
    }
  });
}
```

### **The Virtuous Cycle in Action**

```
Week 1: Engineer pastes Slack message
→ AI extracts context with 70% confidence
→ Engineer corrects 2 fields
→ Pipeline builds successfully
→ DataHub automatically updated with corrected context

Week 2: Similar request arrives
→ AI extracts context with 85% confidence (learned from Week 1)
→ Suggests sources based on Week 1 pattern
→ Engineer confirms without corrections
→ Build completes in 50% less time

Week 3: Engineer browses sources
→ Sees "Used in 2 similar projects" (from Weeks 1-2 metadata)
→ Clicks "Copy their approach"
→ Pre-fills entire pipeline configuration
→ Builds in 80% less time

Week 4: Metadata quality hits 85%
→ Recommendations become highly accurate
→ Engineers actively add context when they see value
→ DataHub becomes source of truth
→ New engineers onboard faster using historical patterns
```

---

## Implementation Roadmap

### **Phase 1: Conversation-First Entry (Weeks 1-3)**

**Goal**: Replace current "Data Discovery" entry with conversation-based context extraction

**Deliverables**:
- Conversation input interface with LLM extraction
- Context confirmation screen with edit capabilities
- Basic suggestion engine for data sources
- Automatic DataHub metadata capture

**Success Metrics**:
- Engineers can paste Slack messages and start building in <60 seconds
- AI extraction accuracy >75% (measured by correction rate)
- 80% of engineers prefer conversation entry over manual forms

### **Phase 2: Feedback Loop & Smart Recommendations (Weeks 4-6)**

**Goal**: Create virtuous cycle where metadata quality drives better recommendations

**Deliverables**:
- Pattern recognition from historical builds
- Metadata-driven source recommendations
- Visual feedback showing metadata value
- Correction learning system

**Success Metrics**:
- AI extraction accuracy improves to >85%
- Engineers see "similar project" recommendations 60% of the time
- 50% reduction in time from request to build start
- DataHub completeness score increases 30%

### **Phase 3: Ticket URL Support (Weeks 7-8)**

**Goal**: Add optional ticket URL parsing without complex integration

**Deliverables**:
- Ticket URL detection and parsing
- Multi-system support (Jira, ServiceNow, Asana)
- Fallback to HTML scraping
- Same confirmation flow as conversation entry

**Success Metrics**:
- 75% successful context extraction from ticket URLs
- Engineers use ticket URLs for 15-20% of builds
- Zero maintenance issues from ticket system changes

### **Phase 4: Advanced Intelligence (Weeks 9-12)**

**Goal**: Leverage accumulated metadata for advanced assistance

**Deliverables**:
- Automatic quality requirement inference
- Stakeholder auto-suggestion from usage patterns
- Domain-specific pattern libraries
- Predictive source selection

**Success Metrics**:
- >90% of builds reuse successful patterns
- DataHub completeness >85% across all assets
- Engineers report 70% time savings vs. old workflow
- New engineer onboarding time reduced 60%

---

## Success Metrics & Validation

### **Primary Success Metrics**

#### **1. Context Capture Efficiency**
- Time to start build: <60 seconds from paste to confirmed context
- Extraction accuracy: 85% of extractions require no corrections
- User preference: 80% prefer conversation vs. forms

#### **2. DataHub Health Improvement**
- Completeness score: 85% of datasets have complete metadata
- Metadata freshness: <7 days since last update
- Usage pattern capture: 90% of builds recorded as patterns

#### **3. Engineering Productivity**
- Build start time: <2 minutes from request to building
- Pattern reuse rate: 60% of builds reuse existing patterns
- First-time success rate: 85% of builds succeed without rework

### **Validation Strategy**

- **Week 2**: Initial validation with 5 engineers
- **Week 6**: Pattern recognition validation with 15 engineers
- **Week 12**: Full system validation with all engineers

---

## Conclusion

This conversation-first build flow eliminates the friction between how data engineers actually receive work (messy conversations) and how platforms expect them to work (structured forms). By using AI to extract structure from chaos, then creating automatic feedback loops that improve DataHub quality through usage rather than manual maintenance, we solve both problems simultaneously:

1. **Engineers build faster** because context is captured instantly from their actual communication
2. **DataHub gets healthier** because metadata is a byproduct of building, not a separate chore

The key insight: **Don't try to change how engineers work. Build tools that meet them where they are, then use that natural workflow to improve the platform's intelligence over time.**