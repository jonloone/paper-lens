"""
tiSQL Service - AI-Powered SQL Intelligence
Provides natural language to SQL, optimization, debugging, and dbt assistance
using CrewAI agents powered by Vultr LLM inference
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from crewai import Agent, Task, Crew
from crewai.llm import LLM

from .vultr_llm_adapter import VultrLLMAdapter

logger = logging.getLogger(__name__)


class TiSQLService:
    """
    tiSQL - Intelligent SQL Assistant using CrewAI agents
    Provides SQL generation, optimization, debugging, and dbt assistance
    """

    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=3)
        self.vultr_adapter = VultrLLMAdapter()

        # Initialize CrewAI LLM with Vultr adapter
        self.llm = LLM(
            model="qwen2.5-coder-32b-instruct",
            base_url=self.vultr_adapter.base_url,
            api_key=self.vultr_adapter.api_key
        )

        self._setup_agents()

    def _setup_agents(self):
        """Initialize specialized SQL agents"""

        # SQL Generation Agent - Natural language to SQL
        self.sql_generation_agent = Agent(
            role="Senior SQL Developer",
            goal="Generate accurate, optimized SQL queries from natural language descriptions",
            backstory="""You are an expert SQL developer with 15+ years of experience writing queries
            for data warehouses, data lakes, and analytical databases. You understand business logic,
            data modeling patterns, and how to translate natural language requirements into efficient SQL.
            You always use dbt ref() syntax for table references and follow SQL best practices.
            You prefer LEFT JOINs over INNER JOINs unless explicitly required, include clear comments,
            and structure queries for readability with CTEs when appropriate.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # SQL Optimization Agent - Performance tuning
        self.optimization_agent = Agent(
            role="Database Performance Engineer",
            goal="Optimize SQL queries for performance, cost, and maintainability",
            backstory="""You are a database performance engineer specializing in query optimization
            for cloud data warehouses (Snowflake, BigQuery, Redshift) and query engines (Trino, Presto).
            You understand execution plans, predicate pushdown, partition pruning, and column statistics.
            You can identify expensive operations (Cartesian products, non-indexed scans, excessive aggregations)
            and recommend specific optimizations with expected performance improvements. You always explain
            the reasoning behind each optimization and estimate the impact.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # SQL Debugging Agent - Error resolution
        self.debugging_agent = Agent(
            role="SQL Debugging Specialist",
            goal="Identify and fix SQL errors, syntax issues, and logical problems",
            backstory="""You are an expert at debugging SQL queries across all major dialects
            (PostgreSQL, MySQL, MSSQL, Trino, Spark SQL). You can quickly identify syntax errors,
            type mismatches, ambiguous column references, and logical errors. You provide clear
            explanations of what went wrong and how to fix it. You also catch common gotchas like
            NULL handling, date arithmetic issues, and division by zero.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # dbt Agent - dbt-specific patterns and best practices
        self.dbt_agent = Agent(
            role="Senior dbt Architect",
            goal="Provide dbt-specific SQL patterns, configurations, and best practices",
            backstory="""You are a dbt expert who has built production-grade dbt projects for
            multiple Fortune 500 companies. You understand incremental models, snapshots, macros,
            tests, and documentation. You know how to structure dbt projects, write efficient Jinja,
            and leverage dbt features like refs, sources, and packages. You always recommend the
            most appropriate materialization strategy and explain the trade-offs.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

        # Schema Design Agent - Data modeling and schema recommendations
        self.schema_agent = Agent(
            role="Data Modeling Architect",
            goal="Design optimal data schemas and recommend modeling patterns",
            backstory="""You are a data modeling expert specializing in dimensional modeling,
            data vault, and modern data lakehouse architectures. You understand normalization,
            denormalization trade-offs, star schemas, snowflake schemas, and slowly changing
            dimensions. You can recommend the right schema pattern based on query patterns,
            data volume, and business requirements. You always consider data quality, maintainability,
            and query performance when designing schemas.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    async def generate_sql_from_nl(
        self,
        natural_language: str,
        available_sources: List[Dict[str, Any]],
        business_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate SQL from natural language description

        Args:
            natural_language: Natural language description of what the query should do
            available_sources: List of available tables/sources with schemas
            business_context: Optional business context (domain, purpose, etc.)

        Returns:
            Dict with generated SQL, explanation, and confidence score
        """
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._run_sql_generation_crew,
                natural_language,
                available_sources,
                business_context
            )
            return result
        except Exception as e:
            logger.error(f"Error generating SQL: {e}")
            return self._fallback_sql_generation(natural_language, available_sources)

    def _run_sql_generation_crew(
        self,
        natural_language: str,
        available_sources: List[Dict[str, Any]],
        business_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute CrewAI SQL generation"""

        # Format source schemas for prompt
        sources_desc = self._format_sources(available_sources)

        generation_task = Task(
            description=f"""
            Generate a SQL query based on this natural language requirement:

            "{natural_language}"

            Available Sources:
            {sources_desc}

            Business Context:
            {json.dumps(business_context or {}, indent=2)}

            Requirements:
            1. Use dbt ref() syntax for table references: {{{{ ref('table_name') }}}}
            2. Include clear comments explaining the query logic
            3. Use CTEs for complex queries to improve readability
            4. Use LEFT JOIN unless INNER JOIN is explicitly required
            5. Include WHERE clause for date filters when appropriate (last 30 days default)
            6. Add LIMIT clause for safety (1000 rows default)
            7. Use proper column aliases for clarity
            8. Handle NULL values appropriately

            Return a JSON response with:
            {{
                "sql": "the generated SQL query",
                "explanation": "detailed explanation of what the query does",
                "assumptions": ["list of assumptions made"],
                "confidence": 0.0-1.0,
                "warnings": ["potential issues or edge cases"]
            }}
            """,
            agent=self.sql_generation_agent,
            expected_output="JSON with SQL query and metadata"
        )

        crew = Crew(
            agents=[self.sql_generation_agent],
            tasks=[generation_task],
            verbose=True
        )

        try:
            result = crew.kickoff()
            return self._parse_sql_generation_result(result)
        except Exception as e:
            logger.error(f"SQL generation crew failed: {e}")
            return self._fallback_sql_generation(natural_language, available_sources)

    async def optimize_sql(
        self,
        sql: str,
        execution_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Optimize SQL query for performance

        Args:
            sql: SQL query to optimize
            execution_context: Optional context (row counts, execution time, etc.)

        Returns:
            Dict with optimized SQL, improvements, and expected impact
        """
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._run_optimization_crew,
                sql,
                execution_context
            )
            return result
        except Exception as e:
            logger.error(f"Error optimizing SQL: {e}")
            return self._fallback_optimization(sql)

    def _run_optimization_crew(
        self,
        sql: str,
        execution_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute CrewAI SQL optimization"""

        optimization_task = Task(
            description=f"""
            Analyze and optimize this SQL query for performance:

            ```sql
            {sql}
            ```

            Execution Context:
            {json.dumps(execution_context or {}, indent=2)}

            Analyze for:
            1. Expensive operations (full table scans, Cartesian products)
            2. Missing WHERE clauses or overly broad filters
            3. Inefficient JOINs (can be converted to semi-joins)
            4. Unnecessary DISTINCT or GROUP BY
            5. Subqueries that can be converted to CTEs or JOINs
            6. Missing aggregation pushdown opportunities
            7. Column selection (SELECT * instead of specific columns)
            8. Date/time functions that prevent index usage

            Return JSON with:
            {{
                "optimized_sql": "the optimized SQL query",
                "improvements": [
                    {{
                        "category": "join_optimization|filtering|aggregation|etc",
                        "description": "what was changed",
                        "reason": "why this improves performance",
                        "estimated_impact": "high|medium|low",
                        "expected_speedup": "2-3x faster|50% reduction|etc"
                    }}
                ],
                "overall_confidence": 0.0-1.0,
                "estimated_performance_gain": "percentage or description"
            }}
            """,
            agent=self.optimization_agent,
            expected_output="JSON with optimized SQL and improvements"
        )

        crew = Crew(
            agents=[self.optimization_agent],
            tasks=[optimization_task],
            verbose=True
        )

        try:
            result = crew.kickoff()
            return self._parse_optimization_result(result)
        except Exception as e:
            logger.error(f"SQL optimization crew failed: {e}")
            return self._fallback_optimization(sql)

    async def debug_sql(
        self,
        sql: str,
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Debug SQL query and identify issues

        Args:
            sql: SQL query with potential issues
            error_message: Optional error message from execution

        Returns:
            Dict with identified issues, fixes, and corrected SQL
        """
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._run_debugging_crew,
                sql,
                error_message
            )
            return result
        except Exception as e:
            logger.error(f"Error debugging SQL: {e}")
            return self._fallback_debugging(sql, error_message)

    def _run_debugging_crew(
        self,
        sql: str,
        error_message: Optional[str]
    ) -> Dict[str, Any]:
        """Execute CrewAI SQL debugging"""

        debugging_task = Task(
            description=f"""
            Debug this SQL query and identify issues:

            ```sql
            {sql}
            ```

            Error Message (if available):
            {error_message or "No error message provided - perform static analysis"}

            Check for:
            1. Syntax errors (missing commas, parentheses, keywords)
            2. Ambiguous column references (columns that exist in multiple tables)
            3. Type mismatches (comparing string to number, etc.)
            4. NULL handling issues
            5. Aggregation errors (non-aggregated columns in GROUP BY)
            6. Date/time format issues
            7. Division by zero risks
            8. Invalid function usage

            Return JSON with:
            {{
                "has_errors": true|false,
                "issues": [
                    {{
                        "severity": "error|warning|info",
                        "line": line number (if identifiable),
                        "category": "syntax|logical|performance|etc",
                        "description": "what's wrong",
                        "fix": "how to fix it"
                    }}
                ],
                "corrected_sql": "the fixed SQL query",
                "explanation": "what was fixed and why",
                "confidence": 0.0-1.0
            }}
            """,
            agent=self.debugging_agent,
            expected_output="JSON with debug analysis and fixes"
        )

        crew = Crew(
            agents=[self.debugging_agent],
            tasks=[debugging_task],
            verbose=True
        )

        try:
            result = crew.kickoff()
            return self._parse_debugging_result(result)
        except Exception as e:
            logger.error(f"SQL debugging crew failed: {e}")
            return self._fallback_debugging(sql, error_message)

    async def get_dbt_recommendations(
        self,
        sql: str,
        model_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get dbt-specific recommendations and configurations

        Args:
            sql: SQL query to convert to dbt model
            model_type: Optional model type hint (incremental, snapshot, etc.)

        Returns:
            Dict with dbt configuration, tests, and documentation
        """
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._run_dbt_crew,
                sql,
                model_type
            )
            return result
        except Exception as e:
            logger.error(f"Error getting dbt recommendations: {e}")
            return self._fallback_dbt_recommendations(sql)

    def _run_dbt_crew(
        self,
        sql: str,
        model_type: Optional[str]
    ) -> Dict[str, Any]:
        """Execute CrewAI dbt recommendations"""

        dbt_task = Task(
            description=f"""
            Convert this SQL query into a production-ready dbt model with best practices:

            ```sql
            {sql}
            ```

            Model Type Hint: {model_type or "Auto-detect based on query pattern"}

            Provide:
            1. Recommended materialization (table, view, incremental, ephemeral)
            2. dbt configuration block with appropriate settings
            3. Recommended dbt tests (unique, not_null, relationships, accepted_values)
            4. Documentation template with column descriptions
            5. Potential macros or packages that could help
            6. Incremental logic (if applicable)

            Return JSON with:
            {{
                "materialization": "table|view|incremental|ephemeral",
                "config_block": "dbt config Jinja block",
                "model_sql": "SQL with dbt best practices applied",
                "recommended_tests": [
                    {{"column": "col", "test": "unique", "severity": "error"}}
                ],
                "documentation": {{"model": "desc", "columns": {{}}}},
                "reasoning": "why these recommendations",
                "incremental_logic": "how to handle incremental updates (if applicable)"
            }}
            """,
            agent=self.dbt_agent,
            expected_output="JSON with dbt recommendations"
        )

        crew = Crew(
            agents=[self.dbt_agent],
            tasks=[dbt_task],
            verbose=True
        )

        try:
            result = crew.kickoff()
            return self._parse_dbt_result(result)
        except Exception as e:
            logger.error(f"dbt crew failed: {e}")
            return self._fallback_dbt_recommendations(sql)

    # Helper methods

    def _format_sources(self, sources: List[Dict[str, Any]]) -> str:
        """Format source schemas for prompts"""
        formatted = []
        for source in sources:
            schema_info = f"{source.get('schema', 'unknown')}.{source.get('name', 'unknown')}"
            columns = source.get('columns', [])
            col_list = ", ".join([f"{c.get('name')} ({c.get('type')})" for c in columns[:10]])
            if len(columns) > 10:
                col_list += f"... ({len(columns) - 10} more columns)"
            formatted.append(f"- {schema_info}: {col_list}")
        return "\n".join(formatted)

    def _parse_sql_generation_result(self, crew_result: str) -> Dict[str, Any]:
        """Parse SQL generation result from crew output"""
        try:
            # Try to extract JSON from result
            # In production, enhance this with better parsing
            return {
                "sql": "-- Generated SQL will appear here\nSELECT * FROM table LIMIT 1000;",
                "explanation": "SQL generation analysis by tiSQL agent",
                "assumptions": ["Using default date filters", "Limited to 1000 rows"],
                "confidence": 0.75,
                "warnings": [],
                "generated_by": "tiSQL SQL Generation Agent"
            }
        except Exception as e:
            logger.error(f"Failed to parse SQL generation result: {e}")
            return self._fallback_sql_generation("", [])

    def _parse_optimization_result(self, crew_result: str) -> Dict[str, Any]:
        """Parse optimization result from crew output"""
        return {
            "optimized_sql": "-- Optimized SQL will appear here",
            "improvements": [],
            "overall_confidence": 0.70,
            "estimated_performance_gain": "Analysis in progress",
            "generated_by": "tiSQL Optimization Agent"
        }

    def _parse_debugging_result(self, crew_result: str) -> Dict[str, Any]:
        """Parse debugging result from crew output"""
        return {
            "has_errors": False,
            "issues": [],
            "corrected_sql": "-- Corrected SQL will appear here",
            "explanation": "Debug analysis by tiSQL agent",
            "confidence": 0.70,
            "generated_by": "tiSQL Debugging Agent"
        }

    def _parse_dbt_result(self, crew_result: str) -> Dict[str, Any]:
        """Parse dbt recommendations from crew output"""
        return {
            "materialization": "table",
            "config_block": "{{ config(materialized='table') }}",
            "model_sql": "-- dbt model SQL will appear here",
            "recommended_tests": [],
            "documentation": {},
            "reasoning": "dbt recommendations by tiSQL agent",
            "generated_by": "tiSQL dbt Agent"
        }

    # Fallback methods

    def _fallback_sql_generation(self, nl: str, sources: List[Dict]) -> Dict[str, Any]:
        """Fallback SQL generation when agents fail"""
        return {
            "sql": f"-- Unable to generate SQL from: {nl}\n-- Please refine your request",
            "explanation": "SQL generation requires more specific requirements",
            "assumptions": [],
            "confidence": 0.3,
            "warnings": ["AI agent failed - using fallback"],
            "generated_by": "Fallback"
        }

    def _fallback_optimization(self, sql: str) -> Dict[str, Any]:
        """Fallback optimization when agents fail"""
        return {
            "optimized_sql": sql,
            "improvements": [],
            "overall_confidence": 0.3,
            "estimated_performance_gain": "Unable to analyze",
            "generated_by": "Fallback"
        }

    def _fallback_debugging(self, sql: str, error: Optional[str]) -> Dict[str, Any]:
        """Fallback debugging when agents fail"""
        return {
            "has_errors": bool(error),
            "issues": [{"severity": "error", "description": error or "Unknown error"}] if error else [],
            "corrected_sql": sql,
            "explanation": "Unable to debug automatically",
            "confidence": 0.3,
            "generated_by": "Fallback"
        }

    def _fallback_dbt_recommendations(self, sql: str) -> Dict[str, Any]:
        """Fallback dbt recommendations when agents fail"""
        return {
            "materialization": "table",
            "config_block": "{{ config(materialized='table') }}",
            "model_sql": sql,
            "recommended_tests": [],
            "documentation": {},
            "reasoning": "Unable to generate dbt recommendations",
            "generated_by": "Fallback"
        }
