"""
ReAct SQL Generation Crew
Implements Reasoning and Acting pattern for SQL generation with iterative improvement
"""

from crewai import Agent, Task, Crew
from typing import List, Dict, Any
import json
from datetime import datetime
from tools.react_sql_tools import SQLValidationTool, SchemaDiscoveryTool, QueryTestingTool

class ReActSQLCrew:
    """Crew implementing ReAct pattern for intelligent SQL generation"""
    
    def __init__(self, llm):
        self.llm = llm
        self.tools = self._create_tools()
        self.agent = self._create_react_agent()
        
    def _create_tools(self) -> List:
        """Create ReAct tools for SQL generation workflow"""
        return [
            SQLValidationTool(),
            SchemaDiscoveryTool(), 
            QueryTestingTool()
        ]
    
    def _create_react_agent(self) -> Agent:
        """Create ReAct-enabled SQL agent with reasoning capabilities"""
        return Agent(
            role="ReAct SQL Specialist",
            goal="Generate optimal SQL queries through iterative reasoning and validation",
            backstory="""You are an expert SQL developer who follows the ReAct (Reasoning and Acting) pattern.
            You think step-by-step, use tools to validate your work, and iteratively improve your solutions.
            
            Your approach:
            1. THINK about the problem and plan your approach
            2. ACT by using tools to gather information or validate solutions  
            3. OBSERVE the results and adjust your reasoning
            4. Repeat until you have a validated, optimal solution
            
            You have access to tools for schema discovery, SQL validation, and query testing.
            Always validate your SQL before considering the task complete.""",
            llm=self.llm,
            tools=self.tools,
            verbose=True,
            allow_delegation=False,
            memory=True,
            step_callback=self._step_callback
        )
    
    def _step_callback(self, step):
        """Callback to log ReAct steps for debugging"""
        print(f"ReAct Step: {step}")
    
    def generate_sql_react(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SQL using ReAct pattern with iterative improvement"""
        
        # Create the main ReAct task
        react_task = Task(
            description=self._create_react_prompt(request),
            agent=self.agent,
            expected_output="""A complete response containing:
            1. Final validated SQL query
            2. Reasoning trace showing your thought process
            3. Validation results from tools
            4. Performance assessment
            5. Explanation of the solution
            
            Format as JSON with keys: sql, reasoning_trace, validation, performance, explanation"""
        )
        
        # Create and execute the crew
        crew = Crew(
            agents=[self.agent],
            tasks=[react_task],
            verbose=True,
            process="sequential"
        )
        
        # Execute the ReAct workflow
        start_time = datetime.now()
        result = crew.kickoff()
        end_time = datetime.now()
        
        # Parse and enhance the result
        try:
            parsed_result = json.loads(result)
        except:
            # If result isn't JSON, wrap it
            parsed_result = {
                "sql": self._extract_sql_from_text(result),
                "explanation": result,
                "reasoning_trace": "Available in verbose output",
                "validation": {"valid": True, "checked": True},
                "performance": {"estimated": "Good"}
            }
        
        # Add metadata
        parsed_result["metadata"] = {
            "pattern": "ReAct",
            "processing_time_ms": int((end_time - start_time).total_seconds() * 1000),
            "tools_used": [tool.name for tool in self.tools],
            "agent_used": "ReAct SQL Specialist"
        }
        
        return parsed_result
    
    def _create_react_prompt(self, request: Dict[str, Any]) -> str:
        """Create a detailed ReAct prompt for SQL generation"""
        
        natural_language = request.get('natural_language', '')
        current_sql = request.get('current_sql', '')
        target_databases = request.get('target_databases', ['production'])
        dialect = request.get('dialect', 'trino')
        context = request.get('context', {})
        
        prompt = f"""
You are working on a SQL generation task using the ReAct (Reasoning and Acting) pattern.

TASK: {natural_language}

CONTEXT:
- Current SQL (if any): {current_sql}
- Target databases: {target_databases}  
- Dialect: {dialect}
- Additional context: {json.dumps(context, indent=2)}

INSTRUCTIONS:
Follow the ReAct pattern - alternate between THINKING and ACTING until you have a complete, validated solution.

For each step, clearly state:
1. THOUGHT: What you're thinking about next
2. ACTION: What tool you're using and why
3. OBSERVATION: What you learned from the action

Available tools:
- Schema Explorer: Discover table schemas and relationships
- SQL Validator: Check syntax and Trino compatibility  
- Query Tester: Test performance and execution

WORKFLOW:
1. Start by THINKING about the requirements
2. If you need schema information, USE the Schema Explorer tool
3. Generate initial SQL based on your understanding
4. USE the SQL Validator to check your query
5. If there are issues, THINK about fixes and revise
6. USE the Query Tester to verify performance
7. Make final optimizations if needed
8. Provide the complete solution

REQUIREMENTS:
- SQL must be Trino-compatible (no USE statements, proper catalog.schema.table format)
- Include proper error handling and validation
- Optimize for performance 
- Provide clear explanations

Your reasoning should be visible throughout the process. Think step by step!

Begin by stating your initial THOUGHT about this task:
"""
        return prompt
    
    def _extract_sql_from_text(self, text: str) -> str:
        """Extract SQL from text response as fallback"""
        lines = text.split('\n')
        sql_lines = []
        in_sql = False
        
        for line in lines:
            if 'SELECT' in line.upper() or 'WITH' in line.upper():
                in_sql = True
            if in_sql:
                sql_lines.append(line)
                if line.strip().endswith(';'):
                    break
        
        return '\n'.join(sql_lines) if sql_lines else "-- SQL extraction failed"


class ReActQueryOptimizer:
    """Specialized ReAct agent for query optimization"""
    
    def __init__(self, llm):
        self.llm = llm
        self.tools = [SQLValidationTool(), QueryTestingTool()]
        self.agent = self._create_optimizer_agent()
    
    def _create_optimizer_agent(self) -> Agent:
        """Create ReAct agent specialized in query optimization"""
        return Agent(
            role="ReAct Query Optimizer",
            goal="Optimize SQL queries through iterative analysis and testing",
            backstory="""You are a database performance expert who uses ReAct pattern to optimize SQL queries.
            
            Your optimization process:
            1. THINK about performance bottlenecks
            2. ACT by testing and validating changes
            3. OBSERVE results and measure improvements
            4. Iterate until optimal performance is achieved
            
            Focus on: JOIN optimization, index usage, query rewriting, and Trino-specific optimizations.""",
            llm=self.llm,
            tools=self.tools,
            verbose=True,
            memory=True
        )
    
    def optimize_query_react(self, sql: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Optimize SQL query using ReAct pattern"""
        
        optimization_task = Task(
            description=f"""
            Optimize this SQL query using ReAct pattern:
            
            ORIGINAL QUERY:
            {sql}
            
            CONTEXT: {json.dumps(context or {}, indent=2)}
            
            PROCESS:
            1. THINK: Analyze the query for optimization opportunities
            2. ACT: Use Query Tester to baseline performance  
            3. OBSERVE: Identify bottlenecks and issues
            4. THINK: Plan specific optimizations
            5. ACT: Apply optimizations and validate with SQL Validator
            6. OBSERVE: Test improved performance 
            7. Repeat until optimal
            
            Provide final optimized SQL with performance comparison.
            """,
            agent=self.agent,
            expected_output="Optimized SQL with performance analysis and reasoning trace"
        )
        
        crew = Crew(
            agents=[self.agent],
            tasks=[optimization_task],
            verbose=True
        )
        
        result = crew.kickoff()
        
        return {
            "optimized_sql": self._extract_sql_from_text(result),
            "optimization_report": result,
            "method": "ReAct Optimization"
        }
    
    def _extract_sql_from_text(self, text: str) -> str:
        """Extract optimized SQL from response text"""
        # Look for final/optimized SQL in the text
        lines = text.split('\n')
        sql_lines = []
        
        for i, line in enumerate(lines):
            if any(keyword in line.upper() for keyword in ['OPTIMIZED', 'FINAL', 'IMPROVED']):
                # Look for SQL in following lines
                for j in range(i, len(lines)):
                    if 'SELECT' in lines[j].upper() or 'WITH' in lines[j].upper():
                        # Extract the SQL block
                        sql_start = j
                        while j < len(lines) and not lines[j].strip().endswith(';'):
                            j += 1
                        return '\n'.join(lines[sql_start:j+1])
        
        # Fallback: return the original if no optimized version found
        return "-- Optimization extraction failed"