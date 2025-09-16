#!/usr/bin/env python3
"""
Minimal test script for CrewAI backend
Tests basic functionality without full dependencies
"""

import sys
import json
from datetime import datetime

# Test basic imports
try:
    print("Testing basic Python setup...")
    print(f"Python version: {sys.version}")
    print(f"Current time: {datetime.now().isoformat()}")
    
    # Test JSON functionality (used throughout)
    test_data = {
        "alerts": [
            {
                "id": "test-001",
                "severity": "critical",
                "message": "Test alert",
                "source": "test"
            }
        ]
    }
    
    json_str = json.dumps(test_data, indent=2)
    parsed = json.loads(json_str)
    assert parsed["alerts"][0]["id"] == "test-001"
    print("✓ JSON serialization working")
    
    # Test mock crew functionality
    class MockCrew:
        def prioritize_alerts(self, alerts):
            """Mock prioritization"""
            prioritized = []
            for i, alert in enumerate(alerts):
                alert_copy = alert.copy()
                alert_copy.update({
                    "priority_rank": i + 1,
                    "priority_score": 10 - i,
                    "consensus_confidence": 0.85
                })
                prioritized.append(alert_copy)
            return prioritized
    
    crew = MockCrew()
    result = crew.prioritize_alerts(test_data["alerts"])
    print(f"✓ Mock crew prioritization working: {len(result)} alerts processed")
    
    # Test mock Arbitron
    class MockArbitron:
        def get_metrics(self):
            return {
                "total_calls": 10,
                "cost_today": 0.05,
                "cache_hit_rate": 0.3,
                "model_used": "mock-model"
            }
    
    arbitron = MockArbitron()
    metrics = arbitron.get_metrics()
    print(f"✓ Mock Arbitron working: ${metrics['cost_today']} spent today")
    
    print("\n✅ All basic tests passed!")
    print("\nNext steps:")
    print("1. Install full dependencies: pip install fastapi uvicorn pydantic")
    print("2. Run minimal FastAPI server: python minimal_server.py")
    print("3. Test at http://localhost:8000/health")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)