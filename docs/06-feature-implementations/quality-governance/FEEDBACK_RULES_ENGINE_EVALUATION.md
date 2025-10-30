# Feedback Rules Engine Evaluation: ARTA vs Custom Python

## Executive Summary

**Recommendation**: **Use ARTA** for the feedback rules engine layer.

**Rationale**: ARTA is Python-native, provides declarative rule management that business users can understand, and offers production-proven features (rule sets, value sharing, flexible conditions) that would take significant effort to build custom. The YAML-based rule definitions enable non-developers to maintain feedback rules without code changes.

---

## Corrected Understanding of ARTA

**ARTA is a Python-based rules engine**, not Scala/JVM. Key facts:

- **Installation**: `pip install -U arta`
- **100% Python codebase**: No JVM dependencies
- **Created by MAIF** (French insurance company)
- **License**: Apache 2.0
- **Purpose**: Standardize rule definitions, separate business logic from code
- **Integration**: Native FastAPI/Pydantic compatibility

---

## Architecture Comparison

### Option 1: ARTA (Python Rules Engine)

**Architecture**:
```
YAML Rule Definitions → ARTA Engine → Python Actions → Feedback Response
```

**Example Rule Definition** (`feedback_rules.yaml`):
```yaml
rules:
  recommendation_feedback:

    high_confidence_collaborative:
      simple_condition: >
        input.source == "collaborative" and
        input.similarity_score >= 0.75 and
        input.selected == true
      action: record_positive_feedback
      action_parameters:
        feedback_type: "collaborative_strong"
        weight: 1.5
        explanation: "High similarity user selection validates collaborative filtering"

    pattern_validation:
      simple_condition: >
        input.source == "pattern" and
        input.usage_count >= 50 and
        input.selected == true
      action: record_positive_feedback
      action_parameters:
        feedback_type: "pattern_validation"
        weight: 1.2
        explanation: "Usage pattern confirmed by user selection"

    collaborative_rejection:
      simple_condition: >
        input.source == "collaborative" and
        input.similarity_score >= 0.55 and
        input.selected == false and
        input.viewed == true
      action: record_negative_feedback
      action_parameters:
        feedback_type: "collaborative_weak"
        weight: 0.8
        explanation: "User rejected similar user recommendation"

    low_quality_pattern:
      simple_condition: >
        input.source == "pattern" and
        input.quality_score < 85 and
        input.selected == false
      action: adjust_quality_threshold
      action_parameters:
        new_threshold: 90
        explanation: "Low quality pattern rejected, raising threshold"

    hybrid_strong_signal:
      simple_condition: >
        input.source == "hybrid" and
        input.score >= 75 and
        input.selected == true and
        input.time_to_select < 30
      action: strengthen_hybrid_weights
      action_parameters:
        collaborative_boost: 0.05
        pattern_boost: 0.05
        explanation: "Fast selection on hybrid recommendation indicates strong alignment"
```

**Python Actions** (`backend/services/feedback_actions.py`):
```python
from typing import Dict, Any
from .kuzu_knowledge_graph import KuzuKnowledgeGraph

graph = KuzuKnowledgeGraph()

def record_positive_feedback(
    feedback_type: str,
    weight: float,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Record positive feedback signal in knowledge graph"""

    # Update user profile with positive signal
    graph.record_feedback(
        user_id=input_data["user_id"],
        table_id=input_data["table_id"],
        feedback_type="positive",
        signal_strength=weight,
        metadata={
            "type": feedback_type,
            "explanation": explanation,
            "source": input_data["source"],
            "timestamp": input_data["timestamp"]
        }
    )

    # Strengthen pattern in usage graph
    graph.strengthen_recommendation_edge(
        user_id=input_data["user_id"],
        table_id=input_data["table_id"],
        weight_multiplier=weight
    )

    return {
        "feedback_recorded": True,
        "signal_type": "positive",
        "weight": weight,
        "explanation": explanation
    }


def record_negative_feedback(
    feedback_type: str,
    weight: float,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Record negative feedback signal in knowledge graph"""

    graph.record_feedback(
        user_id=input_data["user_id"],
        table_id=input_data["table_id"],
        feedback_type="negative",
        signal_strength=weight,
        metadata={
            "type": feedback_type,
            "explanation": explanation,
            "source": input_data["source"],
            "timestamp": input_data["timestamp"]
        }
    )

    # Weaken or remove recommendation edge
    graph.weaken_recommendation_edge(
        user_id=input_data["user_id"],
        table_id=input_data["table_id"],
        weight_multiplier=weight
    )

    return {
        "feedback_recorded": True,
        "signal_type": "negative",
        "weight": weight,
        "explanation": explanation
    }


def adjust_quality_threshold(
    new_threshold: int,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Adjust quality threshold based on rejection patterns"""

    # Update global quality threshold
    graph.update_quality_threshold(
        department=input_data["user_department"],
        new_threshold=new_threshold,
        reason=explanation
    )

    return {
        "threshold_adjusted": True,
        "new_threshold": new_threshold,
        "explanation": explanation
    }


def strengthen_hybrid_weights(
    collaborative_boost: float,
    pattern_boost: float,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Adjust hybrid recommendation weights based on strong signals"""

    # Update user-specific hybrid weights
    graph.update_hybrid_weights(
        user_id=input_data["user_id"],
        collaborative_adjustment=collaborative_boost,
        pattern_adjustment=pattern_boost,
        reason=explanation
    )

    return {
        "weights_adjusted": True,
        "collaborative_boost": collaborative_boost,
        "pattern_boost": pattern_boost,
        "explanation": explanation
    }
```

**FastAPI Integration** (`backend/api/feedback_routes.py`):
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from arta import RulesEngine
import os

router = APIRouter(prefix="/feedback", tags=["feedback"])

# Initialize ARTA engine
rules_config_path = os.path.join(os.path.dirname(__file__), "..", "rules")
feedback_engine = RulesEngine(config_path=rules_config_path)


class FeedbackEvent(BaseModel):
    user_id: str
    table_id: str
    source: str  # "collaborative", "pattern", "hybrid"
    score: float
    similarity_score: Optional[float] = None
    usage_count: Optional[int] = None
    quality_score: Optional[int] = None
    selected: bool
    viewed: bool
    time_to_select: Optional[int] = None  # seconds
    user_department: str
    timestamp: str


class FeedbackResponse(BaseModel):
    feedback_processed: bool
    rules_triggered: list[str]
    actions_executed: list[Dict[str, Any]]
    learning_applied: bool
    explanation: str


@router.post("/record", response_model=FeedbackResponse)
async def record_feedback(event: FeedbackEvent):
    """
    Process feedback event through ARTA rules engine.

    This endpoint receives user interaction events (clicks, selections, rejections)
    and applies feedback rules to update the recommendation system.
    """
    try:
        # Convert Pydantic model to dict for ARTA
        input_data = event.model_dump()

        # Apply feedback rules through ARTA engine
        result = feedback_engine.apply_rules(input_data=input_data)

        # Extract triggered rules and actions
        rules_triggered = result.get("rules_triggered", [])
        actions_executed = result.get("actions_executed", [])

        # Generate explanation
        explanations = [action.get("explanation", "") for action in actions_executed]
        combined_explanation = " | ".join(explanations) if explanations else "No rules triggered"

        return FeedbackResponse(
            feedback_processed=True,
            rules_triggered=rules_triggered,
            actions_executed=actions_executed,
            learning_applied=len(actions_executed) > 0,
            explanation=combined_explanation
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback processing failed: {str(e)}")


@router.get("/rules/list")
async def list_feedback_rules():
    """List all active feedback rules"""
    # ARTA provides rule introspection
    return {
        "rule_sets": feedback_engine.get_rule_sets(),
        "total_rules": feedback_engine.count_rules()
    }
```

**Pros**:
- ✅ **Python-native**: No language mismatch, seamless FastAPI integration
- ✅ **Declarative rules**: Business users can understand and modify YAML
- ✅ **Separation of concerns**: Rules separate from code, versioned independently
- ✅ **Production-proven**: Used by MAIF in production email processing
- ✅ **Flexible conditions**: Supports complex boolean logic
- ✅ **Built-in features**: Rule sets, action parameters, value sharing
- ✅ **Maintainable**: Add/modify rules without code changes
- ✅ **Testable**: Rules can be tested independently of actions

**Cons**:
- ⚠️ **Learning curve**: Team needs to learn ARTA DSL (minimal)
- ⚠️ **External dependency**: One more library to maintain
- ⚠️ **Documentation**: Smaller community than custom Python

---

### Option 2: Custom Python Rules Engine

**Architecture**:
```
Python Rule Classes → Custom Engine → Graph Updates → Feedback Response
```

**Example Implementation** (`backend/services/custom_feedback_engine.py`):
```python
from typing import Dict, Any, List, Callable
from dataclasses import dataclass
from abc import ABC, abstractmethod


@dataclass
class FeedbackRule(ABC):
    """Base class for feedback rules"""
    name: str
    weight: float
    explanation: str

    @abstractmethod
    def matches(self, event: Dict[str, Any]) -> bool:
        """Check if rule condition matches event"""
        pass

    @abstractmethod
    def execute(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Execute rule action"""
        pass


class HighConfidenceCollaborativeRule(FeedbackRule):
    def __init__(self):
        super().__init__(
            name="high_confidence_collaborative",
            weight=1.5,
            explanation="High similarity user selection validates collaborative filtering"
        )

    def matches(self, event: Dict[str, Any]) -> bool:
        return (
            event.get("source") == "collaborative" and
            event.get("similarity_score", 0) >= 0.75 and
            event.get("selected") == True
        )

    def execute(self, event: Dict[str, Any]) -> Dict[str, Any]:
        from .kuzu_knowledge_graph import KuzuKnowledgeGraph
        graph = KuzuKnowledgeGraph()

        graph.record_feedback(
            user_id=event["user_id"],
            table_id=event["table_id"],
            feedback_type="positive",
            signal_strength=self.weight,
            metadata={"type": "collaborative_strong", "explanation": self.explanation}
        )

        return {
            "rule": self.name,
            "action": "positive_feedback",
            "weight": self.weight,
            "explanation": self.explanation
        }


class CustomFeedbackEngine:
    def __init__(self):
        self.rules: List[FeedbackRule] = [
            HighConfidenceCollaborativeRule(),
            PatternValidationRule(),
            CollaborativeRejectionRule(),
            # ... add all rules
        ]

    def apply_rules(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Apply all matching rules to event"""
        results = []

        for rule in self.rules:
            if rule.matches(event):
                result = rule.execute(event)
                results.append(result)

        return {
            "rules_triggered": [r["rule"] for r in results],
            "actions_executed": results,
            "count": len(results)
        }
```

**Pros**:
- ✅ **Full control**: Complete flexibility in implementation
- ✅ **No external dependencies**: One less library
- ✅ **Type safety**: Full Python typing and IDE support
- ✅ **Custom optimizations**: Can optimize for specific use cases

**Cons**:
- ❌ **More code to maintain**: Need to build rule engine features
- ❌ **Code changes required**: Adding rules requires code deployment
- ❌ **Less accessible**: Business users can't modify rules
- ❌ **Reinventing the wheel**: Building features ARTA already has
- ❌ **Testing overhead**: More custom code to test

---

## Detailed Comparison Matrix

| Criterion | ARTA (Python) | Custom Python | Winner |
|-----------|---------------|---------------|--------|
| **Integration** | Native FastAPI, pip install | Native | Tie |
| **Rule Definition** | Declarative YAML | Imperative Python classes | ARTA |
| **Maintainability** | Non-dev rule changes | Requires code changes | ARTA |
| **Flexibility** | High (extensible actions) | Maximum (full control) | Tie |
| **Development Speed** | Fast (pre-built features) | Slower (build everything) | ARTA |
| **Business Accessibility** | High (YAML readable) | Low (requires Python) | ARTA |
| **Type Safety** | Good (Pydantic integration) | Excellent (native typing) | Custom |
| **Testing** | Rule + action testing | Full custom testing | Tie |
| **Performance** | Optimized engine | Custom optimizations | Tie |
| **Community Support** | Small but active (MAIF) | N/A (self-supported) | ARTA |
| **Production Proven** | Yes (MAIF insurance) | Depends on implementation | ARTA |
| **Deployment** | Standard Python package | No external deps | Custom |
| **Learning Curve** | Minimal (simple DSL) | None (pure Python) | Custom |

**Overall**: ARTA wins 7-2 with 4 ties

---

## Recommended Architecture: Dual Rules Engine

### OPA (Governance) + ARTA (Feedback)

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                         │
│  (Clicks, Selections, Rejections, Time-to-Select)           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Feedback Event Processing                       │
│  POST /feedback/record                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│               ARTA Rules Engine                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  feedback_rules.yaml                                 │   │
│  │  - high_confidence_collaborative                     │   │
│  │  - pattern_validation                                │   │
│  │  - collaborative_rejection                           │   │
│  │  - low_quality_pattern                               │   │
│  │  - hybrid_strong_signal                              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Feedback Actions (Python)                       │
│  - record_positive_feedback()                                │
│  - record_negative_feedback()                                │
│  - adjust_quality_threshold()                                │
│  - strengthen_hybrid_weights()                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Living Context Graph (Kuzu)                        │
│  - Update UserProfile feature vectors                        │
│  - Strengthen/weaken recommendation edges                    │
│  - Adjust department quality thresholds                      │
│  - Record feedback signals with explanations                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│        Improved Future Recommendations                       │
│  - Adjusted similarity weights                               │
│  - Updated pattern confidence                                │
│  - Refined quality thresholds                                │
│  - Personalized hybrid weights                               │
└─────────────────────────────────────────────────────────────┘
```

**Separation of Concerns**:
- **OPA**: Governance policies (compliance, security, access control)
- **ARTA**: Learning feedback (recommendation optimization, quality adjustment)

**Why This Works**:
- OPA excels at policy enforcement with rich ecosystem
- ARTA excels at business rule management with declarative approach
- Both are Python-compatible (OPA via REST API, ARTA native)
- Clear separation: blocking policies vs learning signals

---

## Implementation Roadmap

### Phase 1: Basic ARTA Integration (Week 1)
1. Install ARTA: `pip install -U arta`
2. Create `backend/rules/feedback_rules.yaml` with 5 core rules
3. Implement `backend/services/feedback_actions.py` with 4 action functions
4. Create `backend/api/feedback_routes.py` with POST /feedback/record endpoint
5. Test with mock feedback events

### Phase 2: Frontend Integration (Week 2)
1. Add click tracking to RecommendationsSection component
2. Implement "view" event tracking (recommendation shown)
3. Implement "select" event tracking (user clicks recommendation)
4. Add time-to-select measurement
5. Wire up to POST /feedback/record API

### Phase 3: Learning Loop (Week 3)
1. Implement graph update methods in KuzuKnowledgeGraph
2. Add feedback signal storage
3. Implement weight adjustment algorithms
4. Create feedback dashboard showing learning metrics
5. Validate recommendation improvements

### Phase 4: Advanced Rules (Week 4)
1. Add temporal rules (time-of-day patterns)
2. Add cross-department learning
3. Add A/B testing support
4. Add rule performance metrics
5. Implement rule versioning

---

## Code Examples: Full Integration

### 1. ARTA Rule Configuration (`backend/rules/rules.yaml`)

```yaml
rules:
  recommendation_feedback:

    # Positive Signals

    high_confidence_collaborative:
      simple_condition: >
        input.source == "collaborative" and
        input.similarity_score >= 0.75 and
        input.selected == true
      action: record_positive_feedback
      action_parameters:
        feedback_type: "collaborative_strong"
        weight: 1.5
        explanation: "High similarity user selection validates collaborative filtering"

    pattern_validation:
      simple_condition: >
        input.source == "pattern" and
        input.usage_count >= 50 and
        input.selected == true
      action: record_positive_feedback
      action_parameters:
        feedback_type: "pattern_validation"
        weight: 1.2
        explanation: "Usage pattern confirmed by user selection"

    fast_hybrid_selection:
      simple_condition: >
        input.source == "hybrid" and
        input.score >= 75 and
        input.selected == true and
        input.time_to_select < 30
      action: strengthen_hybrid_weights
      action_parameters:
        collaborative_boost: 0.05
        pattern_boost: 0.05
        explanation: "Fast selection indicates strong hybrid alignment"

    # Negative Signals

    collaborative_rejection:
      simple_condition: >
        input.source == "collaborative" and
        input.similarity_score >= 0.55 and
        input.selected == false and
        input.viewed == true
      action: record_negative_feedback
      action_parameters:
        feedback_type: "collaborative_weak"
        weight: 0.8
        explanation: "User rejected similar user recommendation"

    low_quality_rejection:
      simple_condition: >
        input.source == "pattern" and
        input.quality_score < 85 and
        input.selected == false and
        input.viewed == true
      action: adjust_quality_threshold
      action_parameters:
        new_threshold: 90
        explanation: "Low quality pattern rejected, raising threshold"

    # Learning Signals

    cross_department_discovery:
      simple_condition: >
        input.selected == true and
        input.source == "collaborative" and
        input.user_department != input.table_primary_department
      action: record_cross_department_pattern
      action_parameters:
        learning_type: "cross_pollination"
        weight: 1.0
        explanation: "User discovered table from different department"
```

### 2. Actions with Graph Integration (`backend/services/feedback_actions.py`)

```python
from typing import Dict, Any
from .kuzu_knowledge_graph import KuzuKnowledgeGraph
import logging

logger = logging.getLogger(__name__)
graph = KuzuKnowledgeGraph()


def record_positive_feedback(
    feedback_type: str,
    weight: float,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Record positive feedback signal in knowledge graph.

    This strengthens the recommendation edge and updates user profile
    to improve future recommendations.
    """
    try:
        # Record feedback event
        graph.record_feedback(
            user_id=input_data["user_id"],
            table_id=input_data["table_id"],
            feedback_type="positive",
            signal_strength=weight,
            metadata={
                "type": feedback_type,
                "explanation": explanation,
                "source": input_data["source"],
                "score": input_data.get("score"),
                "timestamp": input_data["timestamp"]
            }
        )

        # Strengthen recommendation edge
        graph.strengthen_recommendation_edge(
            user_id=input_data["user_id"],
            table_id=input_data["table_id"],
            weight_multiplier=weight
        )

        logger.info(f"Positive feedback recorded: {feedback_type} for user {input_data['user_id']}")

        return {
            "feedback_recorded": True,
            "signal_type": "positive",
            "weight": weight,
            "explanation": explanation
        }

    except Exception as e:
        logger.error(f"Failed to record positive feedback: {str(e)}")
        return {"error": str(e)}


def record_negative_feedback(
    feedback_type: str,
    weight: float,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Record negative feedback signal in knowledge graph.

    This weakens or removes the recommendation edge and updates similarity
    scores to avoid similar recommendations in the future.
    """
    try:
        graph.record_feedback(
            user_id=input_data["user_id"],
            table_id=input_data["table_id"],
            feedback_type="negative",
            signal_strength=weight,
            metadata={
                "type": feedback_type,
                "explanation": explanation,
                "source": input_data["source"],
                "timestamp": input_data["timestamp"]
            }
        )

        # Weaken recommendation edge
        graph.weaken_recommendation_edge(
            user_id=input_data["user_id"],
            table_id=input_data["table_id"],
            weight_multiplier=weight
        )

        logger.info(f"Negative feedback recorded: {feedback_type} for user {input_data['user_id']}")

        return {
            "feedback_recorded": True,
            "signal_type": "negative",
            "weight": weight,
            "explanation": explanation
        }

    except Exception as e:
        logger.error(f"Failed to record negative feedback: {str(e)}")
        return {"error": str(e)}


def adjust_quality_threshold(
    new_threshold: int,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Adjust quality threshold for department based on rejection patterns.

    If users repeatedly reject recommendations below a certain quality score,
    we raise the minimum quality threshold for that department.
    """
    try:
        graph.update_quality_threshold(
            department=input_data["user_department"],
            new_threshold=new_threshold,
            reason=explanation,
            triggered_by=input_data["user_id"]
        )

        logger.info(f"Quality threshold adjusted for {input_data['user_department']}: {new_threshold}")

        return {
            "threshold_adjusted": True,
            "department": input_data["user_department"],
            "new_threshold": new_threshold,
            "explanation": explanation
        }

    except Exception as e:
        logger.error(f"Failed to adjust quality threshold: {str(e)}")
        return {"error": str(e)}


def strengthen_hybrid_weights(
    collaborative_boost: float,
    pattern_boost: float,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Adjust hybrid recommendation weights based on strong positive signals.

    When users quickly select hybrid recommendations, we slightly increase
    both collaborative and pattern weights to reinforce this alignment.
    """
    try:
        graph.update_hybrid_weights(
            user_id=input_data["user_id"],
            collaborative_adjustment=collaborative_boost,
            pattern_adjustment=pattern_boost,
            reason=explanation
        )

        logger.info(f"Hybrid weights strengthened for user {input_data['user_id']}")

        return {
            "weights_adjusted": True,
            "collaborative_boost": collaborative_boost,
            "pattern_boost": pattern_boost,
            "explanation": explanation
        }

    except Exception as e:
        logger.error(f"Failed to strengthen hybrid weights: {str(e)}")
        return {"error": str(e)}


def record_cross_department_pattern(
    learning_type: str,
    weight: float,
    explanation: str,
    input_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Record cross-department discovery pattern for organizational learning.

    Tracks when users discover valuable tables from other departments,
    enabling cross-pollination recommendations.
    """
    try:
        graph.record_cross_department_discovery(
            user_id=input_data["user_id"],
            user_department=input_data["user_department"],
            table_id=input_data["table_id"],
            table_department=input_data.get("table_primary_department", "unknown"),
            learning_type=learning_type,
            weight=weight
        )

        logger.info(f"Cross-department pattern recorded: {input_data['user_department']} → {input_data.get('table_primary_department')}")

        return {
            "pattern_recorded": True,
            "learning_type": learning_type,
            "explanation": explanation
        }

    except Exception as e:
        logger.error(f"Failed to record cross-department pattern: {str(e)}")
        return {"error": str(e)}
```

### 3. Frontend Feedback Tracking (`components/discover/RecommendationsSection.tsx`)

```typescript
// Add to existing RecommendationsSection component

const [viewedRecommendations, setViewedRecommendations] = useState<Set<string>>(new Set());
const viewStartTime = useRef<Map<string, number>>(new Map());

// Track when recommendation is viewed
useEffect(() => {
  if (recommendations.length > 0) {
    recommendations.forEach(rec => {
      if (!viewedRecommendations.has(rec.product_id)) {
        // Record view event
        trackFeedback({
          user_id: userId,
          table_id: rec.product_id,
          source: rec.source,
          score: rec.score,
          similarity_score: rec.similarity_score,
          usage_count: rec.usage_count,
          quality_score: rec.quality_score,
          selected: false,
          viewed: true,
          time_to_select: null,
          user_department: userDepartment,
          timestamp: new Date().toISOString()
        });

        setViewedRecommendations(prev => new Set([...prev, rec.product_id]));
        viewStartTime.current.set(rec.product_id, Date.now());
      }
    });
  }
}, [recommendations]);

// Track when recommendation is clicked
const handleRecommendationClick = (recommendation: DataProductRecommendation) => {
  const startTime = viewStartTime.current.get(recommendation.product_id) || Date.now();
  const timeToSelect = Math.floor((Date.now() - startTime) / 1000); // seconds

  // Record selection event
  trackFeedback({
    user_id: userId,
    table_id: recommendation.product_id,
    source: recommendation.source,
    score: recommendation.score,
    similarity_score: recommendation.similarity_score,
    usage_count: recommendation.usage_count,
    quality_score: recommendation.quality_score,
    selected: true,
    viewed: true,
    time_to_select: timeToSelect,
    user_department: userDepartment,
    timestamp: new Date().toISOString()
  });

  // Navigate to product detail
  router.push(`/discover/${recommendation.product_id}`);
};

// Feedback tracking function
const trackFeedback = async (event: FeedbackEvent) => {
  try {
    await fetch('/api/feedback/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (error) {
    console.error('Failed to track feedback:', error);
  }
};
```

---

## Decision: Use ARTA for Feedback Rules Engine

### Final Recommendation

**Adopt ARTA as the feedback rules engine** for the following reasons:

1. **Python-Native**: Seamless FastAPI integration, no JVM complexity
2. **Business Accessibility**: YAML rules that product owners can understand
3. **Rapid Development**: Pre-built features save implementation time
4. **Maintainability**: Rule changes without code deployment
5. **Production Proven**: MAIF uses it in production systems
6. **Separation of Concerns**: Clear distinction from OPA governance layer

### Implementation Priority

**High Priority** - This is critical for closing the feedback loop in the Context Intelligence Architecture. Without explanatory feedback, the system cannot learn and improve recommendations.

### Next Steps

1. Install ARTA: `pip install -U arta`
2. Create initial rule set with 5 core feedback rules
3. Implement feedback actions with graph integration
4. Add feedback tracking to Discover page
5. Validate learning loop with test data
6. Monitor recommendation improvement metrics

---

**Status**: Evaluation Complete ✅
**Recommendation**: ARTA (Python Rules Engine)
**Confidence**: High (8/10)
**Priority**: High (Critical for learning loop)
