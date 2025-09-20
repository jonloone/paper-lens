"""
ReAct Tools for SQL Generation and Validation
Implements tools for Thought-Action-Observation pattern in SQL generation
"""

from typing import Dict, Any, List, Optional, Union
import json
import re
import structlog
from crewai.tools import BaseTool
import sqlparse
from sqlparse import sql, tokens

logger = structlog.get_logger()

class SQLValidationTool(BaseTool):
    """Tool for validating SQL syntax and structure"""
    
    name: str = "SQL Validator"
    description: str = """Validates SQL syntax, checks for common errors, and ensures Trino compatibility.
    Use this tool to verify generated SQL before proceeding.
    Input: SQL query string
    Output: Validation results with errors/warnings"""
    
    def _run(self, query: str) -> str:
        """Validate SQL query syntax and structure"""
        try:
            result = self.validate_sql(query)
            return json.dumps(result, indent=2)
        except Exception as e:
            logger.error(f"SQL validation failed: {str(e)}")
            return json.dumps({
                "valid": False,
                "errors": [f"Validation error: {str(e)}"],
                "warnings": [],
                "suggestions": []
            })
    
    def validate_sql(self, query: str) -> Dict[str, Any]:
        """Perform comprehensive SQL validation"""
        errors = []
        warnings = []
        suggestions = []
        
        # Basic syntax validation using sqlparse
        try:
            parsed = sqlparse.parse(query)
            if not parsed:
                errors.append("Empty or invalid SQL query")
                return {"valid": False, "errors": errors, "warnings": warnings, "suggestions": suggestions}
            
        except Exception as e:
            errors.append(f"SQL parsing error: {str(e)}")
            return {"valid": False, "errors": errors, "warnings": warnings, "suggestions": suggestions}
        
        # Check for Trino-specific issues
        self._check_trino_compatibility(query, errors, warnings, suggestions)
        
        # Check for common SQL issues
        self._check_common_issues(query, errors, warnings, suggestions)
        
        # Check for performance issues
        self._check_performance_issues(query, warnings, suggestions)
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions,
            "query_type": self._get_query_type(query),
            "tables_referenced": self._extract_tables(query)
        }
    
    def _check_trino_compatibility(self, query: str, errors: List[str], warnings: List[str], suggestions: List[str]):
        """Check for Trino-specific compatibility issues"""
        query_lower = query.lower()
        
        # Check for USE statements (not supported in Trino)
        if re.search(r'\buse\s+\w+\s*;', query_lower):
            errors.append("USE statements are not supported in Trino")
            suggestions.append("Remove USE statements and use fully qualified table names (catalog.schema.table)")
        
        # Check for MySQL-specific functions
        mysql_functions = ['DATE_SUB', 'DATE_ADD', 'CURDATE', 'NOW()']
        for func in mysql_functions:
            if func.lower() in query_lower:
                warnings.append(f"MySQL function '{func}' may not be available in Trino")
                if func == 'DATE_SUB':
                    suggestions.append("Use CURRENT_DATE - INTERVAL 'X' DAY instead of DATE_SUB")
                elif func == 'NOW()':
                    suggestions.append("Use CURRENT_TIMESTAMP instead of NOW()")
        
        # Check for proper table qualification
        if not re.search(r'\w+\.\w+\.\w+', query):
            warnings.append("Tables should be fully qualified with catalog.schema.table format")
            suggestions.append("Use format: catalog.schema.table (e.g., iceberg.production.customers)")
    
    def _check_common_issues(self, query: str, errors: List[str], warnings: List[str], suggestions: List[str]):
        """Check for common SQL issues"""
        query_lower = query.lower()
        
        # Check for missing semicolon
        if not query.strip().endswith(';') and not query_lower.strip().startswith('with'):
            warnings.append("Query should end with semicolon")
        
        # Check for SELECT *
        if 'select *' in query_lower:
            warnings.append("SELECT * may impact performance with large tables")
            suggestions.append("Consider selecting specific columns instead of *")
        
        # Check for missing WHERE clause in UPDATE/DELETE
        if re.search(r'\b(update|delete)\b', query_lower) and 'where' not in query_lower:
            errors.append("UPDATE/DELETE statements should include WHERE clause")
        
        # Check for potential SQL injection patterns
        suspicious_patterns = [r"';", r"--", r"/\*", r"\*/"]
        for pattern in suspicious_patterns:
            if re.search(pattern, query):
                warnings.append(f"Potentially suspicious pattern found: {pattern}")
    
    def _check_performance_issues(self, query: str, warnings: List[str], suggestions: List[str]):
        """Check for potential performance issues"""
        query_lower = query.lower()
        
        # Check for LIKE with leading wildcard
        if re.search(r"like\s+['\"]%", query_lower):
            warnings.append("LIKE with leading wildcard (LIKE '%...') cannot use indexes efficiently")
            suggestions.append("Consider full-text search or rearranging the pattern if possible")
        
        # Check for functions in WHERE clause
        if re.search(r"where\s+.*\w+\(.*\)\s*=", query_lower):
            warnings.append("Functions in WHERE clause may prevent index usage")
            suggestions.append("Consider using function-based indexes or restructuring the query")
        
        # Check for DISTINCT usage
        if 'distinct' in query_lower:
            suggestions.append("DISTINCT can be expensive - ensure it's necessary")
        
        # Check for multiple ORDER BY without LIMIT
        if 'order by' in query_lower and 'limit' not in query_lower:
            suggestions.append("ORDER BY without LIMIT may be expensive for large result sets")
    
    def _get_query_type(self, query: str) -> str:
        """Determine the type of SQL query"""
        query_lower = query.lower().strip()
        
        if query_lower.startswith('select'):
            return 'SELECT'
        elif query_lower.startswith('insert'):
            return 'INSERT'
        elif query_lower.startswith('update'):
            return 'UPDATE'
        elif query_lower.startswith('delete'):
            return 'DELETE'
        elif query_lower.startswith('create'):
            return 'CREATE'
        elif query_lower.startswith('drop'):
            return 'DROP'
        elif query_lower.startswith('with'):
            return 'CTE'
        else:
            return 'UNKNOWN'
    
    def _extract_tables(self, query: str) -> List[str]:
        """Extract table names from the query"""
        # Simple regex-based extraction (could be enhanced with proper parsing)
        table_pattern = r'\b(?:from|join|into|update)\s+([a-zA-Z_][a-zA-Z0-9_.]*)\b'
        matches = re.findall(table_pattern, query, re.IGNORECASE)
        return list(set(matches))


class SchemaDiscoveryTool(BaseTool):
    """Tool for discovering database schema information"""
    
    name: str = "Schema Explorer"
    description: str = """Discovers database schema information including tables, columns, and relationships.
    Use this tool to understand available data structures before writing SQL.
    Input: schema/table name or exploration request
    Output: Schema information in JSON format"""
    
    def _run(self, request: str) -> str:
        """Explore schema based on request"""
        try:
            result = self.explore_schema(request)
            return json.dumps(result, indent=2)
        except Exception as e:
            logger.error(f"Schema exploration failed: {str(e)}")
            return json.dumps({
                "error": f"Schema exploration error: {str(e)}",
                "available_schemas": ["production", "analytics", "staging"]
            })
    
    def explore_schema(self, request: str) -> Dict[str, Any]:
        """Explore database schema (mock implementation)"""
        request_lower = request.lower()
        
        # Mock schema data (in production, this would query actual database)
        mock_schema = {
            "catalogs": {
                "iceberg": {
                    "schemas": {
                        "production": {
                            "tables": {
                                "customers": {
                                    "columns": [
                                        {"name": "customer_id", "type": "BIGINT", "nullable": False, "primary_key": True},
                                        {"name": "customer_name", "type": "VARCHAR(255)", "nullable": False},
                                        {"name": "email", "type": "VARCHAR(255)", "nullable": False, "unique": True},
                                        {"name": "phone", "type": "VARCHAR(20)", "nullable": True},
                                        {"name": "address", "type": "VARCHAR(500)", "nullable": True},
                                        {"name": "segment", "type": "VARCHAR(50)", "nullable": True},
                                        {"name": "created_at", "type": "TIMESTAMP(6)", "nullable": False},
                                        {"name": "updated_at", "type": "TIMESTAMP(6)", "nullable": False}
                                    ],
                                    "indexes": ["customer_id", "email", "created_at"],
                                    "partitions": ["day(created_at)"],
                                    "estimated_rows": 150000
                                },
                                "orders": {
                                    "columns": [
                                        {"name": "order_id", "type": "BIGINT", "nullable": False, "primary_key": True},
                                        {"name": "customer_id", "type": "BIGINT", "nullable": False, "foreign_key": "customers.customer_id"},
                                        {"name": "order_date", "type": "DATE", "nullable": False},
                                        {"name": "order_amount", "type": "DECIMAL(10,2)", "nullable": False},
                                        {"name": "status", "type": "VARCHAR(50)", "nullable": False},
                                        {"name": "payment_method", "type": "VARCHAR(50)", "nullable": True},
                                        {"name": "shipping_address", "type": "VARCHAR(500)", "nullable": True},
                                        {"name": "created_at", "type": "TIMESTAMP(6)", "nullable": False}
                                    ],
                                    "indexes": ["order_id", "customer_id", "order_date"],
                                    "partitions": ["month(order_date)"],
                                    "estimated_rows": 500000
                                },
                                "order_items": {
                                    "columns": [
                                        {"name": "item_id", "type": "BIGINT", "nullable": False, "primary_key": True},
                                        {"name": "order_id", "type": "BIGINT", "nullable": False, "foreign_key": "orders.order_id"},
                                        {"name": "product_id", "type": "BIGINT", "nullable": False, "foreign_key": "products.product_id"},
                                        {"name": "quantity", "type": "INTEGER", "nullable": False},
                                        {"name": "unit_price", "type": "DECIMAL(10,2)", "nullable": False},
                                        {"name": "discount", "type": "DECIMAL(10,2)", "nullable": True, "default": "0.00"}
                                    ],
                                    "indexes": ["item_id", "order_id", "product_id"],
                                    "estimated_rows": 1200000
                                },
                                "products": {
                                    "columns": [
                                        {"name": "product_id", "type": "BIGINT", "nullable": False, "primary_key": True},
                                        {"name": "product_name", "type": "VARCHAR(255)", "nullable": False},
                                        {"name": "category", "type": "VARCHAR(100)", "nullable": False},
                                        {"name": "price", "type": "DECIMAL(10,2)", "nullable": False},
                                        {"name": "cost", "type": "DECIMAL(10,2)", "nullable": True},
                                        {"name": "description", "type": "TEXT", "nullable": True},
                                        {"name": "created_at", "type": "TIMESTAMP(6)", "nullable": False}
                                    ],
                                    "indexes": ["product_id", "category", "created_at"],
                                    "estimated_rows": 25000
                                }
                            }
                        },
                        "analytics": {
                            "tables": {
                                "events": {
                                    "columns": [
                                        {"name": "event_id", "type": "UUID", "nullable": False, "primary_key": True},
                                        {"name": "user_id", "type": "BIGINT", "nullable": True},
                                        {"name": "session_id", "type": "VARCHAR(100)", "nullable": True},
                                        {"name": "event_type", "type": "VARCHAR(100)", "nullable": False},
                                        {"name": "event_data", "type": "JSON", "nullable": True},
                                        {"name": "timestamp", "type": "TIMESTAMP(6)", "nullable": False}
                                    ],
                                    "indexes": ["event_id", "user_id", "timestamp"],
                                    "partitions": ["day(timestamp)"],
                                    "estimated_rows": 5000000
                                }
                            }
                        }
                    }
                }
            }
        }
        
        # Parse request and return relevant schema info
        if "customers" in request_lower:
            return {
                "table": "iceberg.production.customers",
                "schema": mock_schema["catalogs"]["iceberg"]["schemas"]["production"]["tables"]["customers"],
                "related_tables": ["orders", "order_items"]
            }
        elif "orders" in request_lower:
            return {
                "table": "iceberg.production.orders", 
                "schema": mock_schema["catalogs"]["iceberg"]["schemas"]["production"]["tables"]["orders"],
                "related_tables": ["customers", "order_items"]
            }
        elif "products" in request_lower:
            return {
                "table": "iceberg.production.products",
                "schema": mock_schema["catalogs"]["iceberg"]["schemas"]["production"]["tables"]["products"],
                "related_tables": ["order_items"]
            }
        elif "events" in request_lower or "analytics" in request_lower:
            return {
                "table": "iceberg.analytics.events",
                "schema": mock_schema["catalogs"]["iceberg"]["schemas"]["analytics"]["tables"]["events"],
                "related_tables": []
            }
        else:
            # Return overview
            return {
                "overview": "Available schemas and tables",
                "catalogs": ["iceberg"],
                "schemas": {
                    "production": ["customers", "orders", "order_items", "products"],
                    "analytics": ["events"]
                },
                "suggestions": "Specify a table name for detailed schema information"
            }


class QueryTestingTool(BaseTool):
    """Tool for testing SQL queries in a safe environment"""
    
    name: str = "Query Tester"
    description: str = """Tests SQL queries for execution and performance without affecting production data.
    Use this tool to verify query logic and estimate performance.
    Input: SQL query to test
    Output: Execution results, performance metrics, and recommendations"""
    
    def _run(self, query: str) -> str:
        """Test SQL query execution"""
        try:
            result = self.test_query(query)
            return json.dumps(result, indent=2)
        except Exception as e:
            logger.error(f"Query testing failed: {str(e)}")
            return json.dumps({
                "success": False,
                "error": f"Query testing error: {str(e)}",
                "recommendations": ["Check SQL syntax and table references"]
            })
    
    def test_query(self, query: str) -> Dict[str, Any]:
        """Test query execution (mock implementation)"""
        
        # Mock query execution results
        # In production, this would execute against a sandbox/test environment
        
        # Basic query analysis
        query_lower = query.lower()
        
        # Estimate complexity
        complexity_score = self._calculate_complexity(query)
        
        # Mock execution results
        execution_result = {
            "success": True,
            "execution_time_ms": complexity_score * 100,  # Mock timing
            "rows_returned": min(1000, complexity_score * 50),  # Mock row count
            "data_scanned_mb": complexity_score * 10,  # Mock data size
            "query_plan": self._generate_mock_plan(query),
            "performance_score": max(1, 10 - complexity_score),  # 1-10 scale
            "recommendations": self._generate_recommendations(query, complexity_score)
        }
        
        return execution_result
    
    def _calculate_complexity(self, query: str) -> int:
        """Calculate query complexity score (1-10)"""
        score = 1
        query_lower = query.lower()
        
        # Add points for complexity factors
        if 'join' in query_lower:
            score += query_lower.count('join')
        if 'group by' in query_lower:
            score += 1
        if 'order by' in query_lower:
            score += 1
        if 'having' in query_lower:
            score += 1
        if 'union' in query_lower:
            score += 2
        if 'window' in query_lower or 'over(' in query_lower:
            score += 2
        if 'with' in query_lower:  # CTEs
            score += 1
        
        return min(score, 10)
    
    def _generate_mock_plan(self, query: str) -> List[str]:
        """Generate mock execution plan"""
        plans = []
        query_lower = query.lower()
        
        if 'join' in query_lower:
            plans.append("Hash Join on customer_id")
        if 'group by' in query_lower:
            plans.append("HashAggregate")
        if 'order by' in query_lower:
            plans.append("Sort")
        if not plans:
            plans.append("Sequential Scan")
            
        return plans
    
    def _generate_recommendations(self, query: str, complexity: int) -> List[str]:
        """Generate performance recommendations"""
        recommendations = []
        query_lower = query.lower()
        
        if complexity > 7:
            recommendations.append("High complexity query - consider breaking into smaller parts")
        
        if 'select *' in query_lower:
            recommendations.append("Consider selecting only needed columns")
        
        if 'order by' in query_lower and 'limit' not in query_lower:
            recommendations.append("Add LIMIT clause to ORDER BY for better performance")
        
        if query_lower.count('join') > 3:
            recommendations.append("Multiple JOINs detected - verify join order for optimal performance")
        
        if not recommendations:
            recommendations.append("Query looks efficient")
        
        return recommendations