# Phase 4C: Profile Similarity & Collaborative Filtering - Design Document

**Goal**: Close Context Architecture gap from 7/10 to 8/10 by adding profile similarity and collaborative filtering recommendations.

**Duration**: 2-3 weeks (demo mode: smart mocks, 1-2 days)

---

## 🎯 Objective

Enable personalized recommendations by:
1. Creating user profile fingerprints based on behavior patterns
2. Finding similar users through statistical matching
3. Recommending tables used by similar users
4. Showing "Users like you also selected..." in UI

---

## 📊 Current State vs. Target

### Current (Phase 3)
- ✅ Department-aware recommendations
- ✅ Usage pattern mining
- ❌ No user similarity
- ❌ No collaborative filtering
- ❌ No personalization beyond department

### Target (Phase 4C)
- ✅ User profile fingerprints
- ✅ Statistical similarity matching
- ✅ Collaborative filtering
- ✅ "Users like you" recommendations
- ✅ Cross-pollinated suggestions

---

## 🏗️ Architecture Design

### High-Level Flow

```
User interacts with system
  ↓
Profile captured:
  • Tables selected
  • Domains worked in
  • Use cases pursued
  • Query patterns
  • Time of day
  • Frequency
  ↓
Profile Fingerprint generated:
  • Feature vector (numeric)
  • Hash for quick lookup
  ↓
Similarity Engine finds:
  • Cosine similarity > 0.7
  • Top 5 most similar users
  ↓
Collaborative Filtering:
  • Tables they selected
  • That you haven't seen yet
  ↓
Recommendations augmented:
  1. Department-based (Phase 3)
  2. Similar user-based (Phase 4C)
  3. Combined ranking
  ↓
UI shows:
  "Users like you also selected..."
```

### Data Model

```cypher
// New Node Types
(u:UserProfile {
  user_id: string,
  department: string,
  role: string,
  fingerprint_hash: string,
  feature_vector: [float],  // For similarity calc
  created_at: datetime,
  updated_at: datetime
})

// New Relationships
(u1:UserProfile)-[:SIMILAR_TO {score: float}]->(u2:UserProfile)
(u:UserProfile)-[:SELECTED]->(t:TableNode)
(u:UserProfile)-[:VIEWED]->(t:TableNode)
(u:UserProfile)-[:QUERIED]->(t:TableNode)
```

### Profile Fingerprint Features

```python
fingerprint = {
    # Table Selection Patterns
    "table_selection_diversity": 0.0-1.0,     # Wide vs focused
    "domain_focus": ["finance", "customer"],  # Top 2 domains
    "avg_tables_per_product": 3.5,            # Typical complexity

    # Use Case Patterns
    "primary_use_case": "reporting",          # Most common
    "use_case_distribution": {
        "reporting": 0.6,
        "analysis": 0.3,
        "ml_feature": 0.1
    },

    # Temporal Patterns
    "avg_session_duration_min": 45,           # How long they work
    "typical_time_of_day": "morning",         # When they work
    "frequency": "daily",                     # How often

    # Behavioral Markers
    "exploration_score": 0.0-1.0,             # Exploratory vs decisive
    "quality_sensitivity": 0.0-1.0,           # Cares about quality?
    "collaboration_score": 0.0-1.0,           # Works with others?

    # Technical Sophistication
    "sql_complexity_score": 0.0-1.0,          # Simple vs complex queries
    "joins_per_query": 2.3,                   # Avg complexity
    "uses_advanced_features": true,           # Window functions, CTEs
}
```

---

## 🧮 Similarity Algorithm

### Approach: Cosine Similarity with Feature Weighting

```python
def calculate_similarity(user1_profile, user2_profile):
    # Convert profiles to feature vectors
    v1 = profile_to_vector(user1_profile)
    v2 = profile_to_vector(user2_profile)

    # Apply feature weights
    weights = {
        "domain_overlap": 3.0,          # Very important
        "use_case_similarity": 2.5,     # Important
        "table_pattern_similarity": 2.0, # Important
        "temporal_alignment": 1.0,       # Nice to have
        "technical_level": 1.5,          # Moderately important
    }

    # Weighted cosine similarity
    similarity = weighted_cosine(v1, v2, weights)

    # Threshold: 0.7+ = similar
    return similarity
```

### Example Calculation

**User A (Finance Analyst)**:
```python
{
  "domain_focus": ["finance", "customer"],
  "primary_use_case": "reporting",
  "sql_complexity": 0.6,
  "quality_sensitivity": 0.9
}
```

**User B (Finance Manager)**:
```python
{
  "domain_focus": ["finance", "product"],
  "primary_use_case": "reporting",
  "sql_complexity": 0.4,
  "quality_sensitivity": 0.8
}
```

**Similarity Score**: 0.82 (High - both finance, reporting, quality-focused)

**User C (Data Scientist)**:
```python
{
  "domain_focus": ["customer", "product"],
  "primary_use_case": "ml_feature",
  "sql_complexity": 0.95,
  "quality_sensitivity": 0.6
}
```

**Similarity Score**: 0.31 (Low - different focus, use case, technical level)

---

## 🔄 Collaborative Filtering

### Approach: Item-Based Collaborative Filtering

```python
def get_collaborative_recommendations(user_id, limit=5):
    # 1. Find similar users (similarity > 0.7)
    similar_users = find_similar_users(user_id, threshold=0.7)

    # 2. Get tables they selected
    their_tables = []
    for sim_user in similar_users:
        tables = get_tables_selected_by(sim_user.user_id)
        their_tables.extend([
            (table, sim_user.similarity_score)
            for table in tables
        ])

    # 3. Filter out tables user already selected
    user_tables = get_tables_selected_by(user_id)
    candidates = [
        t for t in their_tables
        if t[0] not in user_tables
    ]

    # 4. Rank by weighted score
    # Score = similarity_score * usage_count * quality_score
    ranked = rank_by_score(candidates)

    # 5. Return top N
    return ranked[:limit]
```

### Example Output

**Input**: User A (Finance Analyst)
**Similar Users**: User B (0.82), User D (0.75), User E (0.71)

**Their Selections**:
- User B: [finance.orders, finance.payments, customer.accounts]
- User D: [finance.orders, finance.revenue_daily, product.sales]
- User E: [finance.payments, finance.budgets, customer.transactions]

**User A Already Has**: [finance.orders, customer.accounts]

**Recommendations**:
1. finance.payments (used by B + E, score: 1.53)
2. finance.revenue_daily (used by D, score: 1.12)
3. finance.budgets (used by E, score: 0.89)
4. product.sales (used by D, score: 0.85)
5. customer.transactions (used by E, score: 0.76)

---

## 💾 Implementation Plan

### Backend Components

**1. Profile Service** (`backend/services/user_profile_service.py`)
```python
class UserProfileService:
    def create_profile(user_id, department, role) -> UserProfile
    def update_profile_from_behavior(user_id, behavior_event)
    def generate_fingerprint(user_id) -> dict
    def get_profile(user_id) -> UserProfile
```

**2. Similarity Engine** (`backend/services/similarity_engine.py`)
```python
class SimilarityEngine:
    def calculate_similarity(profile1, profile2) -> float
    def find_similar_users(user_id, threshold=0.7) -> List[SimilarUser]
    def update_similarity_graph() -> None  # Batch job
    def get_similar_users_cached(user_id) -> List[SimilarUser]
```

**3. Collaborative Filter** (`backend/services/collaborative_filter.py`)
```python
class CollaborativeFilter:
    def get_recommendations(user_id, limit=5) -> List[TableRecommendation]
    def record_selection(user_id, table_id) -> None
    def get_table_affinity(user_id, table_id) -> float
```

**4. Mock Profile Generator** (`backend/services/mock_profile_generator.py`)
```python
class MockProfileGenerator:
    def generate_realistic_profiles(count=50) -> List[UserProfile]
    def generate_similarity_clusters() -> None
    def generate_selection_patterns() -> None
```

### API Endpoints

**New Routes** (`backend/api/profile_routes.py`):
```python
POST /profile/create
  - Create user profile from signup data

PUT /profile/{user_id}/update
  - Update profile from behavior events

GET /profile/{user_id}/similar
  - Get similar users

GET /recommendations/collaborative?user_id={id}&limit=5
  - Get collaborative filtering recommendations
```

**Enhanced Routes** (`backend/api/recommendations_routes.py`):
```python
POST /recommendations/tables
  - Now includes collaborative recommendations
  - Merges department-based + collaborative
  - Returns source: "department" | "similar_users"

GET /recommendations/explain/{table_id}
  - Now shows similar users who use this table
  - "3 users like you selected this table"
```

### Frontend Components

**1. Similar Users Section** (`components/build/SimilarUsersPanel.tsx`)
```tsx
<Card>
  <CardHeader>
    <Users className="w-5 h-5" />
    Users Like You Also Selected
  </CardHeader>
  <CardContent>
    {collaborativeRecs.map(rec => (
      <TableCard
        table={rec.table}
        similarUsers={rec.similar_users}
        avgSimilarity={rec.avg_similarity}
      />
    ))}
  </CardContent>
</Card>
```

**2. Enhanced Explanation Modal**
```tsx
// Add section showing similar users
<div>
  <h4>Similar Users</h4>
  <p>3 users with similar roles use this table</p>

  <div className="space-y-2">
    {similarUsers.map(user => (
      <Badge>
        {user.role} • {user.department} • {user.similarity}% match
      </Badge>
    ))}
  </div>
</div>
```

---

## 🧪 Testing Strategy

### Unit Tests

1. **Profile Fingerprinting**
   - Test feature vector generation
   - Test hash consistency
   - Test edge cases (empty profile)

2. **Similarity Calculation**
   - Test identical profiles (similarity = 1.0)
   - Test opposite profiles (similarity ≈ 0.0)
   - Test known similar profiles
   - Test performance (10k comparisons)

3. **Collaborative Filtering**
   - Test recommendation generation
   - Test filtering (exclude already selected)
   - Test ranking logic
   - Test empty results handling

### Integration Tests

1. **End-to-End Flow**
   - Create profile → Generate fingerprint → Find similar → Get recs
   - Verify recommendations are relevant
   - Verify no duplicate recommendations

2. **API Tests**
   - Test all new endpoints
   - Test error handling
   - Test rate limiting
   - Test response times

### Demo Validation

1. **Create 50 Mock Profiles**
   - 5 clusters of similar users
   - Realistic selection patterns
   - Diverse departments/roles

2. **Verify Recommendations**
   - Similar users should get overlapping recs
   - Dissimilar users should get different recs
   - Quality scores should be high (>85%)

3. **UI Testing**
   - "Users like you" section appears
   - Badges show similarity scores
   - Explanation modal shows similar users
   - Smooth interactions

---

## 📊 Success Metrics

### Quantitative

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Recommendation accuracy | >70% | A/B test: collaborative vs random |
| Similar user precision | >0.75 | Manual review of top 5 similar |
| API response time | <500ms | Performance testing |
| Profile fingerprint speed | <100ms | Unit test benchmarks |

### Qualitative

- ✅ Recommendations feel personalized
- ✅ "Users like you" makes sense
- ✅ Similar users have similar roles/departments
- ✅ Collaborative recs are relevant

---

## 🚀 Implementation Timeline

### Day 1: Foundation (6 hours)
- [ ] Profile data model in Kuzu
- [ ] UserProfileService (CRUD operations)
- [ ] Basic fingerprint generation
- [ ] Unit tests

### Day 2: Similarity Engine (6 hours)
- [ ] Similarity calculation algorithm
- [ ] SimilarityEngine service
- [ ] Find similar users function
- [ ] Mock profile generator (50 profiles)
- [ ] Unit tests

### Day 3: Collaborative Filtering (6 hours)
- [ ] CollaborativeFilter service
- [ ] Get recommendations logic
- [ ] Integration with existing recommendations API
- [ ] Merge ranking algorithm
- [ ] Unit tests

### Day 4: Frontend Integration (4 hours)
- [ ] SimilarUsersPanel component
- [ ] Enhanced explanation modal
- [ ] Wire up to collaborative API
- [ ] UI polish and animations

### Day 5: Testing & Documentation (2 hours)
- [ ] End-to-end testing
- [ ] Create demo script
- [ ] Phase 4C completion document

**Total**: 24 hours (3 days)

---

## 🎓 Key Decisions

### Decision 1: Feature-Based vs. Deep Learning
**Choice**: Feature-based similarity (weighted cosine)

**Alternatives**:
- Deep learning embeddings
- Matrix factorization
- Neural collaborative filtering

**Rationale**:
- Interpretable (can explain why users are similar)
- Fast (no model training needed)
- Works with small data (50 mock profiles)
- Sufficient for demo

### Decision 2: Real-Time vs. Batch Similarity
**Choice**: Batch pre-computation + cache

**Alternatives**:
- Real-time on every request
- Lazy computation on first access

**Rationale**:
- Faster API responses (<500ms)
- Similarity scores don't change frequently
- Can update nightly or hourly
- Better user experience

### Decision 3: Item-Based vs. User-Based Collaborative Filtering
**Choice**: User-based (find similar users, recommend their tables)

**Alternatives**:
- Item-based (find similar tables)
- Hybrid approach

**Rationale**:
- Easier to explain ("users like you")
- Fits our use case (small user base)
- More intuitive for UI display
- Aligns with Context Architecture framework

---

## 📈 Context Architecture Impact

### Current Score: 7/10

**Gaps**:
- ❌ Profile Similarity: 5/10
- ❌ Continuous Learning Loop: 4/10

### After Phase 4C: 8/10

**Improvements**:
- ✅ Profile Similarity: 8/10
- ⚠️ Continuous Learning Loop: 4/10 (deferred to Phase 4D)

**Remaining to 10/10**:
- Real Trino integration (deferred for demo)
- Deployment success feedback loop (Phase 4D)
- A/B testing framework (Phase 5)

---

## 💡 Innovation Highlights

### Novel Approaches

1. **Behavior-Based Fingerprinting**: Not just demographics, actual usage patterns
2. **Weighted Feature Similarity**: Domain focus weighted 3x more than time-of-day
3. **Hybrid Recommendations**: Department + Collaborative + Usage = Triple intelligence
4. **Transparent Similarity**: UI shows why users are similar

### Competitive Advantages

vs. Amazon Recommendations:
- ✅ We show why ("3 analysts like you")
- ✅ We factor in department context
- ✅ We consider quality scores

vs. Netflix Recommendations:
- ✅ We provide transparency
- ✅ We combine multiple signals
- ✅ We don't just rely on implicit feedback

---

## 🎯 Phase 4C Success Criteria

### Must Have
- ✅ 50 mock user profiles generated
- ✅ Similarity calculation working (cosine > 0.7)
- ✅ Collaborative recommendations API functional
- ✅ "Users like you" UI component
- ✅ Explanation modal shows similar users

### Nice to Have
- ⚠️ Real-time similarity (cached is fine)
- ⚠️ Similarity graph visualization
- ⚠️ User clustering analysis
- ⚠️ A/B testing framework

### Out of Scope (Phase 5)
- ❌ Real user behavior tracking
- ❌ Deep learning embeddings
- ❌ Production monitoring
- ❌ Privacy controls

---

**Document Status**: Design Complete
**Next Step**: Begin implementation (Day 1: Profile Service)
**Estimated Completion**: 3 days
**Context Architecture Target**: 8/10

---

## 🌟 Vision Statement

> "By understanding users through their behavior patterns and connecting them with peers who share similar needs, we transform cold recommendations into warm, trusted suggestions backed by social proof."
>
> — Phase 4C Design

✨ **Ready to implement Profile Similarity & Collaborative Filtering** ✨
