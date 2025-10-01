#!/bin/bash

# KAG Integration Test Suite
# Tests Phase 1 TypeScript APIs enhanced with Python KAG backend services
# Validates: Request parsing, contract suggestion, pattern discovery, impact analysis

set -e

echo "=========================================="
echo "KAG Integration Test Suite"
echo "=========================================="
echo ""

# Configuration
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"
TEST_OUTPUT_DIR="/tmp/kag-test-output"
BACKEND_PID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
    TESTS_RUN=$((TESTS_RUN + 1))
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_info() {
    echo -e "[INFO] $1"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    if [ ! -z "$BACKEND_PID" ]; then
        log_info "Stopping backend server (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    rm -rf "$TEST_OUTPUT_DIR"
}

trap cleanup EXIT

# Setup
mkdir -p "$TEST_OUTPUT_DIR"

# Step 1: Start Backend Server
echo ""
echo "=========================================="
echo "Step 1: Starting Backend Server"
echo "=========================================="
echo ""

log_info "Starting FastAPI backend on port 8000..."
cd /mnt/blockstorage/paper-lens
HOST=0.0.0.0 PORT=8000 python3 -m uvicorn backend.main:app --reload > "$TEST_OUTPUT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

log_info "Backend PID: $BACKEND_PID"
log_info "Waiting 5 seconds for backend to start..."
sleep 5

# Check backend health
log_test "Backend health check"
if curl -s "$BACKEND_URL/api/kag/health" | grep -q "healthy"; then
    log_pass "Backend is healthy"
else
    log_fail "Backend health check failed"
    cat "$TEST_OUTPUT_DIR/backend.log"
    exit 1
fi

# Step 2: Test KAG Endpoints Directly
echo ""
echo "=========================================="
echo "Step 2: Testing KAG Endpoints Directly"
echo "=========================================="
echo ""

# Test 2.1: Parse Request with KAG Enhancement
log_test "KAG enhanced request parsing"
PARSE_RESULT=$(curl -s -X POST "$BACKEND_URL/api/kag/parse-request" \
    -H "Content-Type: application/json" \
    -d '{
        "description": "Daily customer churn prediction scores for marketing team",
        "domain": "retail",
        "requester": "test@company.com"
    }')

echo "$PARSE_RESULT" > "$TEST_OUTPUT_DIR/parse_result.json"

if echo "$PARSE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    CONFIDENCE=$(echo "$PARSE_RESULT" | jq -r '.confidence')
    SIMILAR_COUNT=$(echo "$PARSE_RESULT" | jq -r '.similar_contracts | length')
    PATTERNS_COUNT=$(echo "$PARSE_RESULT" | jq -r '.domain_patterns | length')

    log_pass "Request parsing succeeded (confidence: $CONFIDENCE, similar: $SIMILAR_COUNT, patterns: $PATTERNS_COUNT)"

    # Validate structure
    if echo "$PARSE_RESULT" | jq -e '.understanding.business_objectives' > /dev/null 2>&1; then
        log_pass "Business objectives extracted"
    else
        log_fail "Business objectives missing"
    fi

    if echo "$PARSE_RESULT" | jq -e '.graph_insights' > /dev/null 2>&1; then
        log_pass "Graph insights included"
    else
        log_fail "Graph insights missing"
    fi
else
    log_fail "Request parsing failed"
    echo "$PARSE_RESULT" | jq '.'
fi

# Test 2.2: Contract Suggestion
log_test "KAG contract suggestion"
CONTRACT_RESULT=$(curl -s -X POST "$BACKEND_URL/api/kag/contract/suggest" \
    -H "Content-Type: application/json" \
    -d '{
        "requirements": "Daily customer churn prediction scores",
        "domain": "retail",
        "critical_fields": ["customer_id", "churn_score", "prediction_date"],
        "min_confidence": 0.7
    }')

echo "$CONTRACT_RESULT" > "$TEST_OUTPUT_DIR/contract_result.json"

if echo "$CONTRACT_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    CONTRACT_CONFIDENCE=$(echo "$CONTRACT_RESULT" | jq -r '.confidence')
    QUALITY_RULES=$(echo "$CONTRACT_RESULT" | jq -r '.quality_rules_generated')
    PATTERNS=$(echo "$CONTRACT_RESULT" | jq -r '.applied_patterns | length')

    log_pass "Contract suggestion succeeded (confidence: $CONTRACT_CONFIDENCE, rules: $QUALITY_RULES, patterns: $PATTERNS)"

    # Validate contract structure
    if echo "$CONTRACT_RESULT" | jq -e '.contract.metadata' > /dev/null 2>&1; then
        log_pass "Contract metadata present"
    else
        log_fail "Contract metadata missing"
    fi

    if echo "$CONTRACT_RESULT" | jq -e '.reasoning' > /dev/null 2>&1; then
        log_pass "Reasoning explanation included"
    else
        log_fail "Reasoning explanation missing"
    fi
else
    log_fail "Contract suggestion failed"
    echo "$CONTRACT_RESULT" | jq '.'
fi

# Test 2.3: Pattern Discovery
log_test "KAG pattern discovery"
PATTERN_RESULT=$(curl -s -X POST "$BACKEND_URL/api/kag/patterns/find" \
    -H "Content-Type: application/json" \
    -d '{
        "requirements": {
            "business_need": "churn_prediction",
            "data_volume": "high",
            "latency": "batch"
        },
        "domain": "retail"
    }')

echo "$PATTERN_RESULT" > "$TEST_OUTPUT_DIR/pattern_result.json"

if echo "$PATTERN_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    PATTERNS_FOUND=$(echo "$PATTERN_RESULT" | jq -r '.total_found')
    TOP_PATTERN=$(echo "$PATTERN_RESULT" | jq -r '.patterns[0].pattern.name // "none"')
    SCORE=$(echo "$PATTERN_RESULT" | jq -r '.patterns[0].score // 0')

    log_pass "Pattern discovery succeeded (found: $PATTERNS_FOUND, top: $TOP_PATTERN, score: $SCORE)"

    # Validate pattern structure
    if echo "$PATTERN_RESULT" | jq -e '.combinations' > /dev/null 2>&1; then
        log_pass "Pattern combinations included"
    else
        log_fail "Pattern combinations missing"
    fi
else
    log_fail "Pattern discovery failed"
    echo "$PATTERN_RESULT" | jq '.'
fi

# Test 2.4: Impact Analysis
log_test "KAG impact analysis"
IMPACT_RESULT=$(curl -s -X POST "$BACKEND_URL/api/kag/impact/analyze" \
    -H "Content-Type: application/json" \
    -d '{
        "contract_id": "retail.customer_churn_v1",
        "proposed_changes": {
            "schema_changes": [
                {"field": "churn_score", "change": "type_modification", "from": "float", "to": "double"}
            ]
        }
    }')

echo "$IMPACT_RESULT" > "$TEST_OUTPUT_DIR/impact_result.json"

if echo "$IMPACT_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    AFFECTED=$(echo "$IMPACT_RESULT" | jq -r '.total_affected')
    IS_BREAKING=$(echo "$IMPACT_RESULT" | jq -r '.is_breaking')
    MIGRATION=$(echo "$IMPACT_RESULT" | jq -r '.migration_effort')

    log_pass "Impact analysis succeeded (affected: $AFFECTED, breaking: $IS_BREAKING, effort: $MIGRATION)"

    # Validate impact structure
    if echo "$IMPACT_RESULT" | jq -e '.recommendations' > /dev/null 2>&1; then
        log_pass "Migration recommendations included"
    else
        log_fail "Migration recommendations missing"
    fi
else
    log_fail "Impact analysis failed"
    echo "$IMPACT_RESULT" | jq '.'
fi

# Test 2.5: Domain Accelerators
log_test "Domain accelerator - Retail patterns"
RETAIL_PATTERNS=$(curl -s "$BACKEND_URL/api/kag/domain/retail/patterns")

echo "$RETAIL_PATTERNS" > "$TEST_OUTPUT_DIR/retail_patterns.json"

if echo "$RETAIL_PATTERNS" | jq -e '.success' > /dev/null 2>&1; then
    PATTERN_COUNT=$(echo "$RETAIL_PATTERNS" | jq -r '.total_patterns')
    log_pass "Retail patterns retrieved (count: $PATTERN_COUNT)"
else
    log_fail "Retail patterns retrieval failed"
fi

log_test "Domain accelerator - Retail terms"
RETAIL_TERMS=$(curl -s "$BACKEND_URL/api/kag/domain/retail/terms")

echo "$RETAIL_TERMS" > "$TEST_OUTPUT_DIR/retail_terms.json"

if echo "$RETAIL_TERMS" | jq -e '.success' > /dev/null 2>&1; then
    TERMS_COUNT=$(echo "$RETAIL_TERMS" | jq -r '.total_terms')
    log_pass "Retail terms retrieved (count: $TERMS_COUNT)"
else
    log_fail "Retail terms retrieval failed"
fi

# Step 3: Test Enhanced TypeScript APIs (with Backend Running)
echo ""
echo "=========================================="
echo "Step 3: Testing Enhanced TypeScript APIs"
echo "=========================================="
echo ""

log_info "Testing if TypeScript APIs leverage KAG backend..."

# Test 3.1: Enhanced Request Parsing
log_test "Enhanced TypeScript request parsing (with KAG)"
TS_PARSE_RESULT=$(curl -s -X POST "$FRONTEND_URL/api/build/request/parse" \
    -H "Content-Type: application/json" \
    -d '{
        "description": "Daily customer churn prediction scores for marketing team",
        "requester": "test@company.com",
        "context": {
            "domain": "retail"
        }
    }')

echo "$TS_PARSE_RESULT" > "$TEST_OUTPUT_DIR/ts_parse_result.json"

if echo "$TS_PARSE_RESULT" | jq -e '.success' > /dev/null 2>&1; then
    log_pass "TypeScript parsing succeeded"

    # Check if KAG enhancement is present
    if echo "$TS_PARSE_RESULT" | jq -e '.extracted.similar_contracts' > /dev/null 2>&1; then
        log_pass "KAG enhancement detected (similar contracts present)"
    else
        log_info "No KAG enhancement detected (basic parsing only)"
    fi
else
    log_fail "TypeScript parsing failed"
fi

# Step 4: Performance Benchmarking
echo ""
echo "=========================================="
echo "Step 4: Performance Benchmarking"
echo "=========================================="
echo ""

log_test "KAG response time measurement"

# Measure parse-request timing
START=$(date +%s%N)
curl -s -X POST "$BACKEND_URL/api/kag/parse-request" \
    -H "Content-Type: application/json" \
    -d '{
        "description": "Customer segmentation analysis",
        "domain": "retail",
        "requester": "test@company.com"
    }' > /dev/null
END=$(date +%s%N)
PARSE_TIME=$(( (END - START) / 1000000 ))

log_info "Parse request time: ${PARSE_TIME}ms"

if [ $PARSE_TIME -lt 500 ]; then
    log_pass "Parse performance acceptable (<500ms)"
elif [ $PARSE_TIME -lt 1000 ]; then
    log_info "Parse performance moderate (${PARSE_TIME}ms)"
else
    log_fail "Parse performance slow (${PARSE_TIME}ms)"
fi

# Measure contract suggestion timing
START=$(date +%s%N)
curl -s -X POST "$BACKEND_URL/api/kag/contract/suggest" \
    -H "Content-Type: application/json" \
    -d '{
        "requirements": "Customer segmentation",
        "domain": "retail",
        "critical_fields": ["customer_id"],
        "min_confidence": 0.7
    }' > /dev/null
END=$(date +%s%N)
CONTRACT_TIME=$(( (END - START) / 1000000 ))

log_info "Contract suggestion time: ${CONTRACT_TIME}ms"

if [ $CONTRACT_TIME -lt 1000 ]; then
    log_pass "Contract performance acceptable (<1000ms)"
elif [ $CONTRACT_TIME -lt 2000 ]; then
    log_info "Contract performance moderate (${CONTRACT_TIME}ms)"
else
    log_fail "Contract performance slow (${CONTRACT_TIME}ms)"
fi

# Step 5: Error Handling Tests
echo ""
echo "=========================================="
echo "Step 5: Error Handling Tests"
echo "=========================================="
echo ""

log_test "Invalid domain handling"
INVALID_DOMAIN=$(curl -s "$BACKEND_URL/api/kag/domain/invalid_domain/patterns")

if echo "$INVALID_DOMAIN" | grep -q "404"; then
    log_pass "Invalid domain correctly rejected"
else
    log_fail "Invalid domain not properly handled"
fi

log_test "Missing required fields"
MISSING_FIELDS=$(curl -s -X POST "$BACKEND_URL/api/kag/parse-request" \
    -H "Content-Type: application/json" \
    -d '{}')

if echo "$MISSING_FIELDS" | grep -q "422"; then
    log_pass "Missing fields correctly rejected"
else
    log_fail "Missing fields not properly handled"
fi

# Final Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Total Tests Run:    $TESTS_RUN"
echo -e "Tests Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "KAG Integration Status: READY"
    echo ""
    echo "Test artifacts saved to: $TEST_OUTPUT_DIR"
    echo "Backend logs: $TEST_OUTPUT_DIR/backend.log"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Review test artifacts in: $TEST_OUTPUT_DIR"
    echo "Backend logs: $TEST_OUTPUT_DIR/backend.log"
    exit 1
fi
