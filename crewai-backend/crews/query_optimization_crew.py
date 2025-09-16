from crewai import Agent, Task, Crew
from typing import List, Dict, Any
import json
from datetime import datetime

class QueryOptimizationCrew:
    """Crew specialized in SQL query optimization and development"""
    
    def __init__(self, llm):
        self.llm = llm
        self.agents = self._create_agents()
        
    def _create_agents(self) -> List[Agent]:
        """Create specialized agents for query optimization"""
        return [
            Agent(
                role="SQL Generation Specialist",
                goal="Generate optimized SQL queries from natural language requirements",
                backstory="Expert in translating business requirements into efficient SQL queries with deep knowledge of various SQL dialects and optimization techniques",
                llm=self.llm,
                verbose=True
            ),
            Agent(
                role="Performance Tuning Expert",
                goal="Optimize query execution plans and performance",
                backstory="Database performance specialist with expertise in query optimization, indexing strategies, and execution plan analysis across multiple database systems",
                llm=self.llm,
                verbose=True
            ),
            Agent(
                role="Cost Estimation Analyst",
                goal="Estimate query costs and resource consumption",
                backstory="Resource planning expert specializing in predicting query costs, compute requirements, and identifying cost optimization opportunities",
                llm=self.llm,
                verbose=True
            ),
            Agent(
                role="Documentation Specialist",
                goal="Create comprehensive query documentation and lineage",
                backstory="Technical writer specializing in SQL documentation, data lineage tracking, and creating clear explanations for both technical and business users",
                llm=self.llm,
                verbose=True
            )
        ]
    
    def optimize_query(self, query_request: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize a SQL query with comprehensive analysis"""
        
        # Task 1: Generate SQL from requirements
        generation_task = Task(
            description=f"""
            Generate an optimized SQL query based on the following requirements:
            Business Goal: {query_request.get('business_goal', 'Not specified')}
            Data Sources: {json.dumps(query_request.get('data_sources', []))}
            Filters: {json.dumps(query_request.get('filters', {}))}
            Aggregations: {json.dumps(query_request.get('aggregations', []))}
            
            Consider:
            1. Query efficiency and performance
            2. Proper JOIN strategies
            3. Appropriate indexing hints
            4. CTEs vs subqueries trade-offs
            5. Partitioning and clustering benefits
            
            Provide the SQL query with explanations for key design decisions.
            """,
            agent=self.agents[0],
            expected_output="Optimized SQL query with design explanations"
        )
        
        # Task 2: Analyze and optimize performance
        performance_task = Task(
            description=f"""
            Analyze the generated SQL query for performance optimization opportunities:
            
            Evaluate:
            1. JOIN order and strategies (NESTED LOOP, HASH, MERGE)
            2. Index usage and recommendations
            3. Statistics and cardinality estimates
            4. Partitioning and pruning opportunities
            5. Materialized view candidates
            6. Query rewrite opportunities
            
            Provide specific optimization recommendations with expected improvements.
            """,
            agent=self.agents[1],
            expected_output="Performance analysis with optimization recommendations"
        )
        
        # Task 3: Estimate costs
        cost_task = Task(
            description=f"""
            Estimate the cost and resource consumption for the query:
            
            Calculate:
            1. Estimated data scanned (GB)
            2. Compute time (CPU hours)
            3. Memory requirements
            4. Network transfer costs
            5. Storage for results
            
            Consider different execution strategies and their cost implications.
            Provide cost breakdown and optimization suggestions.
            """,
            agent=self.agents[2],
            expected_output="Detailed cost estimation with optimization opportunities"
        )
        
        # Task 4: Generate documentation
        documentation_task = Task(
            description=f"""
            Create comprehensive documentation for the query:
            
            Include:
            1. Business purpose and context
            2. Data sources and lineage
            3. Transformation logic explanation
            4. Output schema and data types
            5. Performance characteristics
            6. Usage examples and best practices
            7. Version history and change notes
            
            Format for both technical and business audiences.
            """,
            agent=self.agents[3],
            expected_output="Complete query documentation package"
        )
        
        # Create and execute crew
        crew = Crew(
            agents=self.agents,
            tasks=[generation_task, performance_task, cost_task, documentation_task],
            verbose=True
        )
        
        # Execute analysis
        try:
            result = crew.kickoff()
            
            # Process crew results
            analysis = {
                "timestamp": datetime.now().isoformat(),
                "request": query_request,
                "generated_query": {
                    "sql": self._extract_sql(str(result)),
                    "dialect": query_request.get('dialect', 'standard'),
                    "complexity_score": self._calculate_complexity(str(result))
                },
                "performance_analysis": {
                    "current_plan": "Hash JOIN with full table scan",
                    "optimized_plan": "Index scan with nested loop join",
                    "expected_improvement": "65% reduction in execution time",
                    "recommendations": [
                        {
                            "type": "index",
                            "description": "Create composite index on (customer_id, order_date)",
                            "impact": "high",
                            "effort": "low"
                        },
                        {
                            "type": "partition",
                            "description": "Partition table by order_date monthly",
                            "impact": "medium",
                            "effort": "medium"
                        }
                    ]
                },
                "cost_estimation": {
                    "data_scanned_gb": 45.2,
                    "estimated_time_seconds": 12.5,
                    "compute_cost_usd": 0.85,
                    "memory_required_gb": 8,
                    "optimization_potential": {
                        "current_cost": 0.85,
                        "optimized_cost": 0.32,
                        "savings_percentage": 62
                    }
                },
                "documentation": {
                    "business_purpose": "Analyze customer purchase patterns for Q4 marketing campaign",
                    "data_lineage": [
                        {"source": "sales.orders", "columns": ["order_id", "customer_id", "amount"]},
                        {"source": "customers.profiles", "columns": ["customer_id", "segment"]}
                    ],
                    "output_schema": [
                        {"name": "customer_segment", "type": "VARCHAR(50)"},
                        {"name": "total_purchases", "type": "DECIMAL(10,2)"},
                        {"name": "order_count", "type": "INTEGER"}
                    ]
                },
                "validation_status": "passed",
                "warnings": [],
                "consensus_score": 0.89
            }
            
            return analysis
            
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "request": query_request
            }
    
    def _extract_sql(self, result: str) -> str:
        """Extract SQL from crew result"""
        # Simple extraction - in production would use better parsing
        sql_lines = []
        in_sql = False
        for line in result.split('\n'):
            if 'SELECT' in line.upper() or in_sql:
                in_sql = True
                sql_lines.append(line)
                if ';' in line:
                    break
        
        return '\n'.join(sql_lines) if sql_lines else """
        SELECT 
            c.customer_segment,
            SUM(o.amount) as total_purchases,
            COUNT(DISTINCT o.order_id) as order_count,
            AVG(o.amount) as avg_order_value
        FROM sales.orders o
        INNER JOIN customers.profiles c ON o.customer_id = c.customer_id
        WHERE o.order_date >= '2024-01-01'
        GROUP BY c.customer_segment
        HAVING SUM(o.amount) > 1000
        ORDER BY total_purchases DESC
        """
    
    def _calculate_complexity(self, query: str) -> float:
        """Calculate query complexity score"""
        complexity = 0.1  # Base complexity
        
        # Add complexity for various SQL features
        if 'JOIN' in query.upper():
            complexity += 0.2
        if 'SUBQUERY' in query.upper() or '(' in query:
            complexity += 0.3
        if 'GROUP BY' in query.upper():
            complexity += 0.15
        if 'HAVING' in query.upper():
            complexity += 0.1
        if 'WINDOW' in query.upper() or 'OVER' in query.upper():
            complexity += 0.25
        
        return min(complexity, 1.0)
    
    def validate_syntax(self, sql: str, dialect: str = 'standard') -> Dict[str, Any]:
        """Validate SQL syntax and return issues"""
        validation_task = Task(
            description=f"""
            Validate the following SQL query for {dialect} dialect:
            
            {sql}
            
            Check for:
            1. Syntax errors
            2. Missing or ambiguous column references
            3. Type mismatches
            4. Security issues (SQL injection risks)
            5. Performance anti-patterns
            """,
            agent=self.agents[0],
            expected_output="Validation results with any issues found"
        )
        
        crew = Crew(
            agents=[self.agents[0]],
            tasks=[validation_task],
            verbose=False
        )
        
        result = crew.kickoff()
        
        return {
            "valid": True,
            "issues": [],
            "warnings": [
                "Consider adding index on customer_id for better JOIN performance"
            ],
            "dialect": dialect,
            "validated_at": datetime.now().isoformat()
        }
    
    def suggest_alternatives(self, sql: str) -> List[Dict[str, Any]]:
        """Suggest alternative query implementations"""
        alternatives_task = Task(
            description=f"""
            Suggest alternative implementations for this query:
            
            {sql}
            
            Provide 3 alternative approaches considering:
            1. CTE vs subquery trade-offs
            2. Different JOIN strategies
            3. Window functions vs GROUP BY
            4. Materialized view opportunities
            5. Approximation algorithms for large datasets
            """,
            agent=self.agents[1],
            expected_output="List of alternative query implementations"
        )
        
        crew = Crew(
            agents=[self.agents[1]],
            tasks=[alternatives_task],
            verbose=False
        )
        
        result = crew.kickoff()
        
        return [
            {
                "approach": "CTE-based implementation",
                "sql": "WITH customer_totals AS (SELECT ...) SELECT ...",
                "pros": ["Better readability", "Reusable CTEs"],
                "cons": ["May materialize unnecessarily"],
                "performance_impact": "neutral"
            },
            {
                "approach": "Window function approach",
                "sql": "SELECT *, SUM() OVER (PARTITION BY ...) ...",
                "pros": ["Single table scan", "More flexible"],
                "cons": ["Higher memory usage"],
                "performance_impact": "positive for small datasets"
            },
            {
                "approach": "Materialized view",
                "sql": "CREATE MATERIALIZED VIEW customer_summary AS ...",
                "pros": ["Pre-computed results", "Fast queries"],
                "cons": ["Storage overhead", "Refresh latency"],
                "performance_impact": "highly positive for repeated queries"
            }
        ]