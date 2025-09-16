#!/bin/bash

# CrewAI Backend Startup Script

echo "Starting NexusOne CrewAI Backend with Arbitron..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Set environment variables
export VULTR_API_KEY=${VULTR_API_KEY:-"NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA"}
export CREWAI_HOST=${CREWAI_HOST:-"0.0.0.0"}
export CREWAI_PORT=${CREWAI_PORT:-"8000"}
export DAILY_BUDGET_LIMIT=${DAILY_BUDGET_LIMIT:-"50.0"}
export CACHE_TTL_SECONDS=${CACHE_TTL_SECONDS:-"3600"}

# Start the FastAPI server
echo "Starting FastAPI server on http://$CREWAI_HOST:$CREWAI_PORT"
python -m uvicorn api.app:app --host $CREWAI_HOST --port $CREWAI_PORT --reload

echo "CrewAI Backend is running!"