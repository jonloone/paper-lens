# NexusOne CrewAI Backend with Arbitron

## Strategic AI Orchestration for Enterprise Data Operations

This backend implements CrewAI-based intelligent agent orchestration with Arbitron-powered LLM routing for cost-effective and performant AI operations.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              TypeScript Frontend                 │
│         (Monitor, Build, Insights Pages)         │
└─────────────────┬───────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────┐
│            FastAPI Server (Port 8000)            │
├──────────────────────────────────────────────────┤
│                  CrewAI Crews                    │
│  ┌──────────────────────────────────────────┐   │
│  │    System Health Crew (Tier 1 Priority)  │   │
│  │    • Urgency Agent                       │   │
│  │    • Business Impact Agent               │   │
│  │    • Cascade Risk Agent                  │   │
│  │    • Resolution Effort Agent             │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │    Performance Analysis Crew             │   │
│  │    • Throughput Agent                    │   │
│  │    • Latency Agent                       │   │
│  │    • Resource Agent                      │   │
│  │    • Cost Agent                          │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │    Quality Priority Crew                 │   │
│  │    • Business Impact Agent               │   │
│  │    • Compliance Agent                    │   │
│  │    • Accuracy Agent                      │   │
│  │    • Performance Agent                   │   │
│  └──────────────────────────────────────────┘   │
├──────────────────────────────────────────────────┤
│              Arbitron Router                     │
│    • Model Selection (Cost/Speed/Accuracy)       │
│    • Fallback Chains                            │
│    • Semantic Caching                           │
│    • Usage Tracking                             │
├──────────────────────────────────────────────────┤
│              Vultr Inference API                 │
│    • Mistral Nemo (Fast/Cheap)                  │
│    • Mixtral 8x7B (Balanced)                    │
│    • Llama 3 70B (Powerful)                     │
│    • DeepSeek Coder (Technical)                 │
└──────────────────────────────────────────────────┘
```

## Key Features

### 🚀 Strategic CrewAI Implementation
- **Consensus-based decision making** using multiple specialized agents
- **Pairwise ranking algorithms** for prioritization tasks
- **MCP tool integration** for real-time data from Airflow, Trino, Spark, DataHub

### 🧠 Arbitron Intelligent Routing
- **Dynamic model selection** based on task requirements
- **Cost optimization** with budget constraints
- **Fallback chains** for reliability
- **Semantic caching** to reduce redundant API calls

### 📊 Comprehensive Metrics
- **Token usage tracking** per crew and model
- **Cost analysis** with daily budget limits
- **Performance monitoring** (latency, success rates)
- **Optimization recommendations** based on usage patterns

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+ (for frontend integration)
- Vultr API key

### Setup

1. **Clone and navigate to the backend**:
```bash
cd crewai-backend
```

2. **Create virtual environment**:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Set environment variables**:
```bash
export VULTR_API_KEY="your-api-key"
export DAILY_BUDGET_LIMIT="50.0"
export CREWAI_PORT="8000"
```

5. **Start the server**:
```bash
./start.sh
# Or directly:
python -m uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
```http
GET /health
```

### System Health Crew

**Prioritize Alerts**:
```http
POST /api/crews/system-health/prioritize
Content-Type: application/json

{
  "alerts": [
    {
      "id": "alert-001",
      "severity": "critical",
      "type": "pipeline_failure",
      "message": "Customer ETL pipeline failed",
      "source": "airflow"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "id": "alert-001",
      "priority_rank": 1,
      "priority_score": 8.5,
      "urgency_score": 9.0,
      "business_impact_score": 8.5,
      "cascade_risk_score": 7.0,
      "resolution_effort_score": 3.0,
      "consensus_confidence": 0.85,
      "recommendations": [
        {
          "action": "immediate_response",
          "reason": "Top priority issue requiring immediate attention",
          "suggested_team": "Data Engineering"
        }
      ]
    }
  ],
  "arbitron_metrics": {
    "total_calls": 4,
    "cost_today": 0.012,
    "cache_hit_rate": 0.25,
    "model_stats": {...}
  }
}
```

### Arbitron Metrics

**Get Usage Metrics**:
```http
GET /api/arbitron/metrics
```

**Get Crew Cost**:
```http
GET /api/arbitron/cost/system_health
```

### Crew Management

**List Available Crews**:
```http
GET /api/crews
```

## Frontend Integration

### TypeScript Service

```typescript
import { crewAIService } from '@/lib/services/CrewAIService';

// Prioritize alerts
const { prioritized_alerts, arbitron_metrics } = 
  await crewAIService.prioritizeAlerts(alerts);

// Display results
prioritized_alerts.forEach(alert => {
  console.log(`Priority ${alert.priority_rank}: ${alert.message}`);
  console.log(`Confidence: ${alert.consensus_confidence}`);
});

// Monitor costs
console.log(`Today's spend: $${arbitron_metrics.cost_today}`);
```

### Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_CREWAI_API_URL=http://localhost:8000
```

## Crew Strategies

### System Health Crew
- **Strategy**: `speed_optimized`
- **Models**: Mistral Nemo → Mixtral 8x7B
- **Max Latency**: 500ms
- **Use Case**: Real-time alert prioritization

### Performance Analysis Crew
- **Strategy**: `balanced`
- **Models**: Mixtral 8x7B → Llama 3 70B
- **Max Cost**: $0.05 per call
- **Use Case**: Performance optimization recommendations

### Quality Priority Crew
- **Strategy**: `accuracy_optimized`
- **Models**: Llama 3 70B → Mixtral 8x7B
- **Min Confidence**: 0.85
- **Use Case**: Quality rule prioritization

## Monitoring & Observability

### Metrics Dashboard
Access comprehensive metrics at:
- Arbitron usage: `/api/arbitron/metrics`
- Cache statistics: Included in metrics
- Cost breakdown by model and crew
- Performance recommendations

### Logs
Structured logging with:
- Request/response tracking
- Model selection reasoning
- Cache hit/miss events
- Error tracking with context

## Development

### Adding New Crews

1. Create crew class in `crews/`:
```python
from .base_crew import BaseCrew

class NewCrew(BaseCrew):
    def _initialize_agents(self):
        # Define agents
        pass
    
    def execute_primary_task(self, context):
        # Implement crew logic
        pass
```

2. Register in FastAPI app:
```python
crews["new_crew"] = NewCrew(arbitron_router)
```

3. Add routing strategy in Arbitron config

### Testing

```bash
# Run tests
pytest tests/

# Test coverage
pytest --cov=. tests/
```

## Production Deployment

### Docker

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```env
VULTR_API_KEY=<your-key>
DAILY_BUDGET_LIMIT=100.0
CACHE_TTL_SECONDS=3600
CREWAI_HOST=0.0.0.0
CREWAI_PORT=8000
```

### Scaling Considerations

- Use Redis for distributed caching
- Implement queue for crew execution
- Add Prometheus metrics endpoint
- Use Kubernetes for orchestration

## Troubleshooting

### Common Issues

1. **"Model not available"**
   - Check Vultr API key
   - Verify model names in config

2. **High latency**
   - Check cache hit rate
   - Consider using faster models
   - Enable request batching

3. **Budget exceeded**
   - Monitor daily spend
   - Adjust routing strategies
   - Increase cache TTL

## License

MIT

## Support

For issues or questions, please open an issue in the repository.