#!/bin/bash
# NexusOne Backend: KAG/Kuzu Setup Script

echo "🚀 Setting up NexusOne Backend with KAG + Kuzu..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Python version
echo -e "${BLUE}Step 1: Checking Python version...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

if [[ $(python3 -c "import sys; print(sys.version_info >= (3, 9))") != "True" ]]; then
    echo -e "${YELLOW}⚠️  Python 3.9+ required. Current: $python_version${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python version OK${NC}"
echo ""

# Step 2: Install Kuzu
echo -e "${BLUE}Step 2: Installing Kuzu embedded graph database...${NC}"
pip install kuzu==0.0.12
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Kuzu installed${NC}"
else
    echo -e "${YELLOW}⚠️  Kuzu installation failed${NC}"
    exit 1
fi
echo ""

# Step 3: Install Ollama Python client
echo -e "${BLUE}Step 3: Installing Ollama Python client...${NC}"
pip install ollama-python==0.1.9
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Ollama client installed${NC}"
else
    echo -e "${YELLOW}⚠️  Ollama client installation failed${NC}"
fi
echo ""

# Step 4: Install graph utilities
echo -e "${BLUE}Step 4: Installing graph utilities...${NC}"
pip install networkx==3.2.1 cachetools==5.3.2
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Graph utilities installed${NC}"
else
    echo -e "${YELLOW}⚠️  Graph utilities installation failed${NC}"
fi
echo ""

# Step 5: Check if Ollama is installed
echo -e "${BLUE}Step 5: Checking Ollama installation...${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✅ Ollama is installed${NC}"

    # Check if Llama 3.1 model is available
    if ollama list | grep -q "llama3.1"; then
        echo -e "${GREEN}✅ Llama 3.1 model is available${NC}"
    else
        echo -e "${YELLOW}⚠️  Llama 3.1 model not found. Pulling...${NC}"
        ollama pull llama3.1:8b
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Llama 3.1 model pulled${NC}"
        else
            echo -e "${YELLOW}⚠️  Failed to pull Llama 3.1 model${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Ollama not installed. Installing...${NC}"
    echo "Run: curl https://ollama.ai/install.sh | sh"
    echo "Then run: ollama pull llama3.1:8b"
fi
echo ""

# Step 6: Create data directory for Kuzu
echo -e "${BLUE}Step 6: Creating data directory...${NC}"
mkdir -p ../data
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data directory created${NC}"
else
    echo -e "${YELLOW}⚠️  Failed to create data directory${NC}"
fi
echo ""

# Step 7: Test Kuzu setup
echo -e "${BLUE}Step 7: Testing Kuzu setup...${NC}"
python3 << EOF
try:
    import kuzu
    print("✅ Kuzu import successful")

    # Test database creation
    import tempfile
    import os
    test_db = os.path.join(tempfile.gettempdir(), "test_kuzu.db")
    db = kuzu.Database(test_db)
    conn = kuzu.Connection(db)
    print("✅ Kuzu database creation successful")

    # Cleanup
    import shutil
    shutil.rmtree(test_db, ignore_errors=True)

except Exception as e:
    print(f"⚠️  Kuzu test failed: {e}")
    exit(1)
EOF
echo ""

# Step 8: Test Ollama connection
echo -e "${BLUE}Step 8: Testing Ollama connection...${NC}"
python3 << EOF
try:
    import ollama

    # Test connection
    response = ollama.list()
    print("✅ Ollama connection successful")

    # Check for llama3.1 model
    models = [model['name'] for model in response.get('models', [])]
    if any('llama3.1' in model for model in models):
        print("✅ Llama 3.1 model available")
    else:
        print("⚠️  Llama 3.1 model not found")

except Exception as e:
    print(f"⚠️  Ollama test failed: {e}")
    print("Make sure Ollama is running: ollama serve")
EOF
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Initialize Kuzu database:"
echo "   python -c 'from services.kuzu_knowledge_graph import get_knowledge_graph; kg = get_knowledge_graph(); print(kg.get_graph_statistics())'"
echo ""
echo "2. Start Ollama (if not running):"
echo "   ollama serve"
echo ""
echo "3. Test the backend:"
echo "   cd backend && HOST=0.0.0.0 PORT=8000 python -m uvicorn main:app --reload"
echo ""
echo "4. View documentation:"
echo "   cat docs/IMPLEMENTATION_PLAN.md"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
