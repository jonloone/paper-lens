"""
CrewAI Dashboard Intelligence Service

Multi-agent system for intelligent dashboard generation from SQL query results.
Uses two specialized agents for fast, high-quality dashboard generation:
- Analyzer: Understands data patterns and business context
- Planner: Designs optimal dashboard layout with visualizations (validation done client-side)
"""

from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Note: CrewAI will be installed in requirements
try:
    from crewai import Agent, Task, Crew, Process
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    logger.warning("CrewAI not installed. Dashboard intelligence will use fallback mode.")


class DashboardIntelligenceCrew:
    """
    CrewAI-based dashboard intelligence system.
    Analyzes SQL query results and generates optimal dashboard layouts.
    """

    def __init__(self, llm_config: Optional[Dict[str, Any]] = None):
        """
        Initialize the dashboard intelligence crew.

        Args:
            llm_config: Configuration for the LLM (model, temperature, etc.)
        """
        if not CREWAI_AVAILABLE:
            raise ImportError("CrewAI is not installed. Please install it to use dashboard intelligence.")

        self.llm_config = llm_config or {
            "model": "gpt-4",
            "temperature": 0.3,
            "max_tokens": 2000
        }

        self.analyzer_agent = self._create_analyzer_agent()
        self.planner_agent = self._create_planner_agent()

        logger.info("DashboardIntelligenceCrew initialized successfully (2-agent fast mode)")

    def _create_analyzer_agent(self) -> Agent:
        """Create the Data Analysis Expert agent"""
        # Use CrewAI's native LLM class for custom OpenAI-compatible endpoints
        from crewai import LLM
        import os

        # Create LLM instance for Vultr using CrewAI's LLM class
        llm = LLM(
            model=self.llm_config.get("model", "openai/qwen2.5-coder-32b-instruct"),
            base_url=self.llm_config.get("api_base", "https://api.vultrinference.com/v1"),
            api_key=self.llm_config.get("api_key", os.getenv("VULTR_API_KEY", ""))
        )

        return Agent(
            role='Data Analysis Expert',
            goal='Deeply understand query results and identify meaningful patterns',
            backstory="""You are an expert data analyst with 15 years of experience
            in business intelligence and data science. You excel at understanding
            the semantic meaning of data, identifying patterns, and recognizing
            business context from SQL queries and their results.

            Your expertise includes:
            - Data type identification (temporal, categorical, numerical, geographic)
            - Pattern recognition (trends, distributions, correlations, outliers)
            - Business metric recognition (revenue, count, rate, percentage)
            - Query intent analysis from SQL structure
            - Statistical profiling and data quality assessment

            You provide clear, structured analysis that guides dashboard design.""",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

    def _create_planner_agent(self) -> Agent:
        """Create the Visualization Design Expert agent"""
        from crewai import LLM
        import os

        llm = LLM(
            model=self.llm_config.get("model", "openai/qwen2.5-coder-32b-instruct"),
            base_url=self.llm_config.get("api_base", "https://api.vultrinference.com/v1"),
            api_key=self.llm_config.get("api_key", os.getenv("VULTR_API_KEY", ""))
        )

        return Agent(
            role='Data Visualization Expert',
            goal='Design optimal dashboard layouts that tell a compelling data story',
            backstory="""You are a senior data visualization designer with expertise
            in dashboard design, chart selection, and storytelling with data. You
            understand which visualizations work best for different data types and
            how to create complementary views that provide comprehensive insights.

            Your expertise includes:
            - Chart type selection (bar, line, area, pie, scatter, histogram)
            - Dashboard layout design with multiple complementary views
            - Data transformation planning (histograms, grouping, pivoting)
            - Summary statistics identification
            - Visual storytelling and insight communication

            You design dashboards that are both beautiful and functional, always
            ensuring each view provides unique, actionable insights.""",
            verbose=True,
            allow_delegation=False,
            llm=llm
        )

    def analyze_and_generate_dashboard(
        self,
        sql: str,
        columns: List[str],
        rows: List[List[Any]],
        row_count: int
    ) -> Dict[str, Any]:
        """
        Main orchestration method for dashboard generation.

        This method coordinates two specialized agents in sequence:
        1. Analyzer: Profiles the data and identifies patterns
        2. Planner: Designs the dashboard layout with visualizations

        Args:
            sql: The SQL query that generated the results
            columns: Column names from the query results
            rows: Query result rows (all rows, will sample internally)
            row_count: Total number of rows

        Returns:
            Dashboard configuration with all views, transformations, and reasoning
        """
        start_time = datetime.now()
        logger.info(f"Starting dashboard generation for query with {row_count} rows and {len(columns)} columns")

        try:
            # Prepare data context (sample first 10 rows for analysis)
            sample_rows = rows[:10] if len(rows) > 10 else rows
            data_context = {
                'sql': sql,
                'columns': columns,
                'sample_rows': sample_rows,
                'row_count': row_count
            }

            # Task 1: Analyze data
            analyze_task = Task(
                description=self._build_analyzer_prompt(data_context),
                agent=self.analyzer_agent,
                expected_output="""Structured JSON analysis containing:
                {
                  "dataProfile": {
                    "columns": [array of column profiles with type, role, cardinality],
                    "patterns": [array of detected patterns with description and confidence],
                    "businessContext": {
                      "domain": string,
                      "metrics": [array of business metrics],
                      "entities": [array of business entities]
                    }
                  },
                  "queryIntent": string,
                  "recommendedFocus": [array of focus areas]
                }"""
            )

            # Task 2: Plan dashboard
            plan_task = Task(
                description=self._build_planner_prompt(data_context),
                agent=self.planner_agent,
                expected_output="""Complete dashboard layout JSON:
                {
                  "dashboard": {
                    "title": string,
                    "description": string,
                    "summaryStats": [array of 3-4 key statistics],
                    "views": [array of dashboard views with chart configs]
                  },
                  "reasoning": string
                }""",
                context=[analyze_task]
            )

            # Create and run crew (2 agents for speed - validation done client-side)
            crew = Crew(
                agents=[self.analyzer_agent, self.planner_agent],
                tasks=[analyze_task, plan_task],
                process=Process.sequential,
                verbose=True
            )

            logger.info("Executing CrewAI workflow...")
            result = crew.kickoff()

            # Parse and return result (planner output)
            parsed_result = self._parse_crew_result(result)

            # Sanitize chart types to ensure only valid types are used
            dashboard = parsed_result.get("dashboard")
            if dashboard and "views" in dashboard:
                dashboard = self._sanitize_chart_types(dashboard)
                dashboard = self._sanitize_data_mappings(dashboard, columns)

            # Wrap planner output in validation format for API compatibility
            wrapped_result = {
                "valid": True,
                "validatedDashboard": dashboard,
                "validationErrors": [],
                "transformationCode": {}
            }

            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(f"Dashboard generation completed in {elapsed:.2f}s")

            return wrapped_result

        except Exception as e:
            logger.error(f"Dashboard generation failed: {str(e)}", exc_info=True)
            raise

    def _build_analyzer_prompt(self, data_context: Dict[str, Any]) -> str:
        """Build the detailed prompt for the analyzer agent"""
        sample_rows_formatted = json.dumps(data_context['sample_rows'], indent=2)

        return f"""
Analyze this SQL query and its results to understand the data semantics and business context.

SQL Query:
```sql
{data_context['sql']}
```

Columns: {', '.join(data_context['columns'])}
Total Row Count: {data_context['row_count']:,}

Sample Data (first {len(data_context['sample_rows'])} rows):
{sample_rows_formatted}

Provide a comprehensive analysis including:

## 1. Column Profiling
For each column in the data, determine:
- **Semantic Type**: temporal, categorical, numerical, geographic, or text
- **Role**: dimension (to group by), measure (to aggregate), or identifier (unique keys)
- **Cardinality**: approximate number of unique values
- **Data Quality**: any null values, outliers, or issues observed

## 2. Pattern Detection
Identify patterns in the data:
- **Trends**: Increasing, decreasing, or cyclical patterns
- **Distributions**: Normal, skewed, uniform, or multimodal
- **Correlations**: Relationships between columns
- **Outliers**: Unusual values or anomalies
- **Seasonality**: Temporal patterns if time-based data

## 3. Business Context
Understand the business meaning:
- **Domain**: What business area does this data represent? (e.g., "sales analytics", "customer retention")
- **Metrics**: What business metrics are being measured? (e.g., "revenue", "conversion_rate", "churn_risk")
- **Entities**: What business entities are involved? (e.g., "customers", "orders", "products")

## 4. Query Intent
- What is the primary business question this query is trying to answer?
- What insights should be highlighted in visualizations?
- What additional context would help understand this data?

## 5. Visualization Focus
Based on your analysis, what aspects of this data are most interesting and should be the focus of visualizations?

**IMPORTANT**: Return your analysis as a valid JSON object with this exact structure:

```json
{{
  "dataProfile": {{
    "columns": [
      {{
        "name": "column_name",
        "type": "temporal|categorical|numerical|geographic|text",
        "role": "dimension|measure|identifier",
        "cardinality": 100,
        "nullPercentage": 0,
        "uniqueCount": 95,
        "sampleValues": [1, 2, 3]
      }}
    ],
    "patterns": [
      {{
        "type": "trend|distribution|correlation|outlier|seasonality",
        "description": "Clear description of the pattern",
        "confidence": 0.9,
        "affectedColumns": ["col1", "col2"]
      }}
    ],
    "businessContext": {{
      "domain": "business domain description",
      "metrics": ["metric1", "metric2"],
      "entities": ["entity1", "entity2"]
    }}
  }},
  "queryIntent": "What business question does this query answer?",
  "recommendedFocus": ["focus area 1", "focus area 2", "focus area 3"]
}}
```
"""

    def _build_planner_prompt(self, data_context: Dict[str, Any]) -> str:
        """Build the detailed prompt for the planner agent"""
        return f"""
Based on the data analysis from the Analyzer agent, design a comprehensive dashboard
that tells a compelling story with the data.

Available Columns: {', '.join(data_context['columns'])}
Row Count: {data_context['row_count']:,}

Design a dashboard that includes:

## 1. Summary Statistics (3-4 key metrics)
Identify the most important metrics to display prominently:
- Calculate summary values (totals, averages, counts)
- Add trend indicators if temporal data exists
- Use appropriate formatting (number, currency, percentage)

## 2. Primary Visualization (full-width)
Choose the best chart type for the main insight:
- Bar chart: for categorical comparisons
- Line/Area chart: for temporal trends
- Pie chart: for part-to-whole (max 6 categories)
- Scatter plot: for correlations between measures
- Histogram: for distributions of numerical data
- Metric: for single key performance indicators

## 3. Complementary Views (2-3 supporting charts)
Add supporting visualizations that provide additional insights:
- Distribution view (histogram if numeric data available)
- Top N / Bottom N comparison (if sortable data)
- Correlation view (if multiple measures)
- Breakdown by category (if categorical dimensions)

## 4. Data Transformations
For each view that needs transformation, specify:
- **Type**: histogram, topN, bottomN, pivot, aggregate, or none
- **Parameters**: All necessary configuration (buckets, sort column, limit, etc.)

## CRITICAL Visualization Constraints:
**YOU MUST ONLY USE THESE EXACT CHART TYPES - NO EXCEPTIONS:**
- bar
- line
- area
- pie
- scatter
- histogram
- metric

**DO NOT USE:** boxplot, heatmap, treemap, sankey, waterfall, gauge, or any other chart type.
**IF YOU USE ANY OTHER CHART TYPE, THE DASHBOARD WILL FAIL VALIDATION.**

## Additional Guidelines:
- Use bar charts for comparing categories
- Use line/area charts for time series or ordered data
- Use pie charts only for part-to-whole with <=6 categories
- Use scatter plots for showing correlations
- Use histograms for showing distributions
- Use metric charts for single KPI values
- Each view should provide UNIQUE insights (no redundancy)
- Transformations must reference ONLY real columns

**IMPORTANT**: Return your dashboard plan as valid JSON with this exact structure:

```json
{{
  "dashboard": {{
    "title": "Dashboard Title",
    "description": "Clear description of what this dashboard shows",
    "summaryStats": [
      {{
        "label": "Metric Name",
        "value": "1,234",
        "format": "number|currency|percentage|text",
        "trend": {{
          "direction": "up|down|neutral",
          "value": "+15%"
        }}
      }}
    ],
    "views": [
      {{
        "id": "view-id",
        "title": "View Title",
        "description": "What insight does this view provide?",
        "chartType": "bar|line|area|pie|scatter|histogram|metric",
        "size": "full|half|third|quarter",
        "dataMapping": {{
          "xColumn": "real_column_name",
          "yColumns": ["real_column_name"],
          "sortBy": "optional_sort_column",
          "sortOrder": "asc|desc",
          "limit": 10
        }},
        "transformation": {{
          "type": "histogram|topN|bottomN|pivot|aggregate|none",
          "params": {{
            "column": "for histogram",
            "buckets": 10,
            "sortBy": "for topN/bottomN",
            "limit": 10
          }}
        }},
        "reasoning": "Why this visualization was chosen and what insight it reveals",
        "confidence": 0.9
      }}
    ]
  }},
  "reasoning": "Overall reasoning for the dashboard design choices"
}}
```
"""

    def _build_validator_prompt(self, data_context: Dict[str, Any]) -> str:
        """Build the detailed prompt for the validator agent"""
        return f"""
Validate the dashboard plan from the Planner agent against the actual data
to ensure it can be executed without errors.

Available Columns: {', '.join(data_context['columns'])}
Row Count: {data_context['row_count']:,}

Perform these validation checks:

## 1. Column Reference Validation
- Do all xColumn and yColumns exist in the available columns?
- Are column names spelled correctly?
- Flag any missing or misnamed columns

## 2. Data Type Compatibility
- Is the column type compatible with the chart type?
  - Bar chart: categorical x, numeric y
  - Line chart: ordered x (temporal/numerical), numeric y
  - Pie chart: categorical x, numeric y, <=6 unique values
  - Scatter: numeric x and y
  - Histogram: numeric x

## 3. Transformation Feasibility
For each transformation, validate:
- **Histogram**: Is the column numeric? What bin size?
- **TopN/BottomN**: Does the sort column exist? Is it orderable?
- **Pivot**: Are group columns valid categorical?
- **Aggregate**: Are aggregation functions valid for column types?

## 4. Data Sufficiency
- Are there enough rows for the visualization?
- Is cardinality appropriate for chart type?
- Are there too many categories for the chosen chart?

## 5. Chart Configuration
- Are all required parameters present?
- Are parameter values reasonable?
- Would this configuration cause performance issues?

For each validation error found:
- **Error Message**: Clear description of the problem
- **Severity**: "error" (blocks rendering) or "warning" (suboptimal)
- **Suggestion**: Fix or alternative approach

If validation passes, return the validated dashboard unchanged.
If validation fails, provide fixes or remove problematic views.

**IMPORTANT**: Return validation result as valid JSON:

```json
{{
  "valid": true|false,
  "validatedDashboard": {{
    "title": "...",
    "description": "...",
    "summaryStats": [...],
    "views": [...]
  }},
  "validationErrors": [
    {{
      "viewId": "view-id",
      "error": "Description of the error",
      "severity": "error|warning",
      "suggestion": "How to fix it"
    }}
  ],
  "transformationCode": {{
    "view-id": {{
      "description": "What this transformation does",
      "implementation": "transformation type and parameters"
    }}
  }}
}}
```
"""

    def _parse_crew_result(self, result: Any) -> Dict[str, Any]:
        """
        Parse the crew execution result into structured format.

        CrewAI returns results as strings or objects. This method handles:
        - Direct JSON objects
        - JSON strings
        - Text with embedded JSON
        - Markdown code blocks with JSON

        Args:
            result: Raw result from crew.kickoff()

        Returns:
            Parsed JSON dictionary

        Raises:
            ValueError: If result cannot be parsed as JSON
        """
        try:
            # Log the raw result for debugging
            logger.info(f"Raw crew result type: {type(result)}")

            # Handle CrewOutput object from newer CrewAI versions
            if hasattr(result, 'raw'):
                result = result.raw
                logger.info(f"Extracted raw content from CrewOutput (first 500 chars): {str(result)[:500]}")
            elif hasattr(result, 'json_dict'):
                result = result.json_dict
                logger.info(f"Extracted json_dict from CrewOutput")
            else:
                logger.info(f"Raw crew result (first 500 chars): {str(result)[:500]}")

            # If already a dict, return it
            if isinstance(result, dict):
                return result

            # If it's a string, try to parse as JSON
            if isinstance(result, str):
                # First try direct JSON parse
                try:
                    return json.loads(result)
                except json.JSONDecodeError:
                    pass

                # Try to strip markdown code fences and parse
                import re

                # Remove markdown code fences (```json ... ``` or ``` ... ```)
                cleaned = re.sub(r'^```(?:json)?\s*\n?', '', result, flags=re.MULTILINE)
                cleaned = re.sub(r'\n?```\s*$', '', cleaned, flags=re.MULTILINE)
                cleaned = cleaned.strip()

                # If the JSON doesn't start with {, try to wrap it
                if cleaned and not cleaned.startswith('{'):
                    cleaned = '{' + cleaned + '}'

                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError as e:
                    logger.debug(f"JSON parse failed after cleaning: {e}")
                    pass

                # Try to extract JSON from anywhere in the text (greedy to capture full nested JSON)
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    try:
                        return json.loads(json_match.group())
                    except json.JSONDecodeError:
                        pass

            # If we get here, parsing failed
            raise ValueError(f"Could not parse crew result as JSON: {str(result)[:200]}...")

        except Exception as e:
            logger.error(f"Failed to parse crew result: {str(e)}")
            raise

    def _sanitize_chart_types(self, dashboard: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize chart types in dashboard views to ensure only valid types are used.

        Maps unsupported chart types to appropriate alternatives:
        - boxplot, violin → bar (for distribution comparisons)
        - heatmap, treemap → bar (for categorical comparisons)
        - gauge, indicator → metric (for single values)
        - waterfall, sankey → area (for flow/cumulative visualizations)

        Args:
            dashboard: Dashboard configuration with views

        Returns:
            Dashboard with sanitized chart types
        """
        VALID_CHART_TYPES = {'bar', 'line', 'area', 'pie', 'scatter', 'histogram', 'metric'}

        CHART_TYPE_MAPPING = {
            'boxplot': 'bar',
            'violin': 'bar',
            'heatmap': 'bar',
            'treemap': 'bar',
            'gauge': 'metric',
            'indicator': 'metric',
            'waterfall': 'area',
            'sankey': 'area',
            'funnel': 'bar',
            'radar': 'bar',
        }

        views = dashboard.get("views", [])
        sanitized_count = 0

        for view in views:
            if "chartType" in view:
                original_type = view["chartType"]

                # If already valid, no change needed
                if original_type in VALID_CHART_TYPES:
                    continue

                # Map to valid type
                mapped_type = CHART_TYPE_MAPPING.get(original_type, 'bar')
                view["chartType"] = mapped_type
                sanitized_count += 1

                logger.warning(
                    f"Sanitized invalid chart type '{original_type}' → '{mapped_type}' "
                    f"for view '{view.get('id', 'unknown')}'"
                )

        if sanitized_count > 0:
            logger.info(f"Sanitized {sanitized_count} invalid chart types in dashboard")

        return dashboard

    def _sanitize_data_mappings(self, dashboard: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """
        Ensure all dataMapping objects have required yColumns field.

        The AI sometimes generates dataMapping with only xColumn, missing the required yColumns.
        This method fixes that by inferring appropriate yColumns from available columns.

        Args:
            dashboard: Dashboard configuration with views
            columns: List of available column names from the query

        Returns:
            Dashboard with sanitized dataMapping objects
        """
        views = dashboard.get("views", [])
        fixed_count = 0

        for view in views:
            if "dataMapping" in view:
                mapping = view["dataMapping"]

                # Check if yColumns is missing or empty
                if "yColumns" not in mapping or not mapping["yColumns"]:
                    # Infer yColumns based on xColumn and available columns
                    x_column = mapping.get("xColumn", columns[0] if columns else "")

                    # Find numeric columns that aren't the x column
                    y_candidates = [col for col in columns if col != x_column]

                    # If we have candidates, use the first one; otherwise use first column
                    if y_candidates:
                        mapping["yColumns"] = [y_candidates[0]]
                    elif columns:
                        # Fallback: use first column if no other options
                        mapping["yColumns"] = [columns[0]]
                    else:
                        # Last resort: use xColumn itself
                        mapping["yColumns"] = [x_column]

                    fixed_count += 1
                    logger.warning(
                        f"Fixed missing yColumns in dataMapping for view '{view.get('id', 'unknown')}'. "
                        f"Added yColumns: {mapping['yColumns']}"
                    )

        if fixed_count > 0:
            logger.info(f"Fixed {fixed_count} incomplete dataMapping objects in dashboard")

        return dashboard


# Singleton instance
_dashboard_crew_instance: Optional[DashboardIntelligenceCrew] = None


def get_dashboard_crew() -> DashboardIntelligenceCrew:
    """
    Get or create the dashboard intelligence crew singleton.

    Returns:
        DashboardIntelligenceCrew instance
    """
    global _dashboard_crew_instance

    if _dashboard_crew_instance is None:
        import os

        # Configure for Vultr LLM
        llm_config = {
            "model": "openai/qwen2.5-coder-32b-instruct",  # Vultr's Qwen Coder model - CrewAI requires "openai/" prefix
            "temperature": 0.3,
            "max_tokens": 2000,
            "api_base": os.getenv("VULTR_INFERENCE_URL", "https://api.vultrinference.com/v1"),
            "api_key": os.getenv("VULTR_API_KEY", "")
        }
        _dashboard_crew_instance = DashboardIntelligenceCrew(llm_config)
        logger.info(f"✅ Created DashboardIntelligenceCrew with Vultr LLM (model={llm_config['model']}, endpoint={llm_config['api_base']})")

    return _dashboard_crew_instance


def generate_dashboard_with_fallback(
    sql: str,
    columns: List[str],
    rows: List[List[Any]],
    row_count: int
) -> Dict[str, Any]:
    """
    Generate dashboard with automatic fallback to rule-based if CrewAI fails.

    This function attempts to use CrewAI for intelligent dashboard generation,
    but falls back to the existing rule-based system if CrewAI is unavailable
    or encounters an error.

    Args:
        sql: The SQL query
        columns: Column names
        rows: Query result rows
        row_count: Total number of rows

    Returns:
        Dashboard configuration dictionary
    """
    if not CREWAI_AVAILABLE:
        logger.warning("CrewAI not available, using fallback rule-based dashboard generation")
        return _generate_fallback_dashboard(columns, rows, row_count)

    try:
        crew = get_dashboard_crew()
        return crew.analyze_and_generate_dashboard(sql, columns, rows, row_count)
    except Exception as e:
        logger.error(f"CrewAI dashboard generation failed: {str(e)}, falling back to rule-based", exc_info=True)
        return _generate_fallback_dashboard(columns, rows, row_count)


def _generate_fallback_dashboard(
    columns: List[str],
    rows: List[List[Any]],
    row_count: int
) -> Dict[str, Any]:
    """
    Simple fallback dashboard generator using basic rules.

    This is used when CrewAI is unavailable or fails.
    """
    # Simple rule: primary bar chart with first column as x, second as y
    return {
        "valid": True,
        "validatedDashboard": {
            "title": f"{columns[0]} Analysis",
            "description": f"Analysis of {row_count} records",
            "summaryStats": [
                {
                    "label": "Total Records",
                    "value": str(row_count),
                    "format": "number"
                }
            ],
            "views": [
                {
                    "id": "primary",
                    "title": "Primary View",
                    "description": "Main visualization",
                    "chartType": "bar",
                    "size": "full",
                    "dataMapping": {
                        "xColumn": columns[0],
                        "yColumns": [columns[1]] if len(columns) > 1 else [columns[0]],
                    },
                    "transformation": {
                        "type": "none",
                        "params": {}
                    },
                    "reasoning": "Simple bar chart visualization",
                    "confidence": 0.5
                }
            ]
        },
        "validationErrors": [],
        "reasoning": "Fallback rule-based dashboard generation"
    }
