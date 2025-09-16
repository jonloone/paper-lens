"""
Base Crew class with Arbitron integration
Provides common functionality for all CrewAI crews
"""

from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
import structlog
from crewai import Crew, Agent, Task
from ..arbitron import ArbitronRouter, ArbitronConfig

logger = structlog.get_logger()

class BaseCrew(ABC):
    """
    Base class for all CrewAI crews with Arbitron integration
    """
    
    def __init__(self, arbitron_router: ArbitronRouter, strategy: str):
        self.arbitron = arbitron_router
        self.strategy = strategy
        self.agents = []
        self.crew = None
        self.execution_history = []
        
        # Initialize agents
        self._initialize_agents()
    
    @abstractmethod
    def _initialize_agents(self):
        """Initialize crew-specific agents"""
        pass
    
    @abstractmethod
    def execute_primary_task(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the crew's primary task"""
        pass
    
    def create_agent(
        self,
        role: str,
        goal: str,
        backstory: str,
        task_type: str = "analysis",
        tools: List = None,
        verbose: bool = True
    ) -> Agent:
        """
        Create an agent with Arbitron-powered LLM
        
        Args:
            role: Agent's role
            goal: Agent's goal
            backstory: Agent's backstory/expertise
            task_type: Type of task for model selection
            tools: Tools available to the agent
            verbose: Whether to log agent actions
        
        Returns:
            Configured CrewAI Agent
        """
        # Get LLM from Arbitron with appropriate routing
        llm = self.arbitron.get_llm(
            strategy=self.strategy,
            task_type=task_type,
            context={"role": role}
        )
        
        agent = Agent(
            role=role,
            goal=goal,
            backstory=backstory,
            llm=llm,
            tools=tools or [],
            verbose=verbose,
            allow_delegation=False  # Agents work independently in our architecture
        )
        
        logger.info(f"Created agent: {role} with strategy: {self.strategy}")
        
        return agent
    
    def create_task(
        self,
        description: str,
        agent: Agent,
        expected_output: str = None,
        context: List[Task] = None
    ) -> Task:
        """
        Create a task for an agent
        
        Args:
            description: Task description
            agent: Agent to execute the task
            expected_output: Expected output format
            context: Previous tasks for context
        
        Returns:
            Configured CrewAI Task
        """
        task = Task(
            description=description,
            agent=agent,
            expected_output=expected_output or "Detailed analysis and recommendations",
            context=context or []
        )
        
        return task
    
    def execute_with_consensus(
        self,
        tasks: List[Task],
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute tasks and build consensus from agent outputs
        
        Args:
            tasks: List of tasks to execute
            context: Additional context for execution
        
        Returns:
            Consensus results from all agents
        """
        try:
            # Track execution with Arbitron
            with self.arbitron.usage_tracker as tracker:
                tracker.start_crew_execution(self.__class__.__name__)
                
                # Create and run crew
                self.crew = Crew(
                    agents=self.agents,
                    tasks=tasks,
                    verbose=True
                )
                
                # Execute crew
                result = self.crew.kickoff(context)
                
                # Process consensus
                consensus = self._build_consensus(result)
                
                # Track completion
                tracker.end_crew_execution(self.__class__.__name__, success=True)
                
                # Store in history
                self.execution_history.append({
                    "timestamp": logger.get_timestamp(),
                    "context": context,
                    "result": consensus,
                    "metrics": tracker.get_crew_metrics(self.__class__.__name__)
                })
                
                return consensus
                
        except Exception as e:
            logger.error(f"Crew execution failed: {str(e)}")
            tracker.end_crew_execution(self.__class__.__name__, success=False)
            raise
    
    def _build_consensus(self, crew_output: Any) -> Dict[str, Any]:
        """
        Build consensus from crew output
        Override in subclasses for specific consensus logic
        
        Args:
            crew_output: Raw output from CrewAI
        
        Returns:
            Structured consensus result
        """
        # Default implementation - override in subclasses
        return {
            "consensus": str(crew_output),
            "confidence": 0.75,
            "agents_agreed": len(self.agents),
            "methodology": "default"
        }
    
    def perform_pairwise_ranking(
        self,
        items: List[Dict],
        criteria: List[str]
    ) -> List[Dict]:
        """
        Perform pairwise ranking of items based on criteria
        
        Args:
            items: Items to rank
            criteria: Ranking criteria
        
        Returns:
            Ranked items with scores
        """
        if len(items) <= 1:
            return items
        
        # Initialize scores
        scores = {i: 0 for i in range(len(items))}
        
        # Perform pairwise comparisons
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                # Have each agent compare the pair
                comparisons = []
                for agent in self.agents:
                    comparison = self._compare_pair(
                        agent,
                        items[i],
                        items[j],
                        criteria
                    )
                    comparisons.append(comparison)
                
                # Aggregate comparisons
                winner = self._aggregate_comparisons(comparisons)
                if winner == 0:
                    scores[i] += 1
                else:
                    scores[j] += 1
        
        # Sort by scores
        ranked_indices = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
        ranked_items = []
        
        for idx in ranked_indices:
            item = items[idx].copy()
            item["consensus_score"] = scores[idx] / (len(items) - 1)  # Normalize score
            item["rank"] = len(ranked_items) + 1
            ranked_items.append(item)
        
        return ranked_items
    
    def _compare_pair(
        self,
        agent: Agent,
        item1: Dict,
        item2: Dict,
        criteria: List[str]
    ) -> int:
        """
        Have an agent compare two items
        
        Returns:
            0 if item1 is better, 1 if item2 is better
        """
        # This would be implemented with actual LLM call
        # For now, returning mock comparison
        import random
        return random.choice([0, 1])
    
    def _aggregate_comparisons(self, comparisons: List[int]) -> int:
        """
        Aggregate comparison results from multiple agents
        
        Returns:
            Final winner (0 or 1)
        """
        # Simple majority vote
        return 0 if sum(comparisons) < len(comparisons) / 2 else 1
    
    def get_execution_metrics(self) -> Dict[str, Any]:
        """Get metrics for crew executions"""
        if not self.execution_history:
            return {
                "total_executions": 0,
                "success_rate": 0,
                "avg_confidence": 0
            }
        
        successful = [e for e in self.execution_history if e.get("result")]
        
        return {
            "total_executions": len(self.execution_history),
            "success_rate": len(successful) / len(self.execution_history),
            "avg_confidence": sum(e["result"].get("confidence", 0) for e in successful) / len(successful) if successful else 0,
            "recent_executions": self.execution_history[-5:]  # Last 5 executions
        }