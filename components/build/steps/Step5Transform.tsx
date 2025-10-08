'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRight,
  ArrowLeft,
  Code2,
  Sparkles,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  FileCode,
  BookOpen,
  Database,
  Table,
  Info,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TiSQLWorkspace } from '@/components/tisql/TiSQLWorkspace';
import { TiSQLWorkstation } from '@/components/tisql/TiSQLWorkstation';
import type { ProductDefinition } from './Step1DefineProduct';
import type { Source } from './Step2SelectSources';

export interface Step5Data {
  sql: string;
  naturalLanguage?: string;
  template?: string;
  aiGenerated?: boolean;
}

interface Step5TransformProps {
  initialData?: Partial<Step5Data>;
  selectedTables: string[]; // From Step 2
  schema: Array<{ name: string; type: string }>; // From Step 3
  productDefinition?: ProductDefinition; // NEW - from Step 1
  selectedSources?: Source[]; // NEW - full source data from Step 2
  onComplete: (data: Step5Data) => void;
  onBack: () => void;
}

type Mode = 'choice' | 'blank' | 'ai' | 'template-detail' | 'generated' | 'editor';

interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  sql: string;
  category: string;
  usesMultipleTables?: boolean;
}

// Query library templates (from retail domain accelerator)
const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: 'customer_360',
    name: 'Customer 360 View',
    description: 'Unified customer view combining all touchpoints',
    category: 'business',
    usesMultipleTables: true,
    sql: `-- Customer 360 View
SELECT
  c.customer_id,
  c.customer_name,
  c.email,
  COUNT(DISTINCT o.order_id) as total_orders,
  SUM(o.order_amount) as lifetime_value,
  AVG(o.order_amount) as avg_order_value,
  MAX(o.order_date) as last_order_date,
  CASE
    WHEN SUM(o.order_amount) > 10000 THEN 'high_value'
    WHEN SUM(o.order_amount) > 5000 THEN 'medium_value'
    ELSE 'low_value'
  END as customer_segment
FROM {{ ref('customers') }} c
LEFT JOIN {{ ref('orders') }} o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.customer_name, c.email`
  },
  {
    id: 'order_analytics',
    name: 'Order Analytics',
    description: 'Daily order metrics and trends',
    category: 'analytics',
    usesMultipleTables: false,
    sql: `-- Order Analytics Dashboard
SELECT
  DATE(order_date) as order_day,
  COUNT(DISTINCT order_id) as total_orders,
  COUNT(DISTINCT customer_id) as unique_customers,
  SUM(order_amount) as total_revenue,
  AVG(order_amount) as avg_order_value,
  COUNT(DISTINCT CASE WHEN status = 'completed' THEN order_id END) as completed_orders,
  COUNT(DISTINCT CASE WHEN status = 'cancelled' THEN order_id END) as cancelled_orders
FROM {{ ref('orders') }}
WHERE order_date >= CURRENT_DATE - INTERVAL '90' DAY
GROUP BY DATE(order_date)
ORDER BY order_day DESC`
  },
  {
    id: 'product_performance',
    name: 'Product Performance',
    description: 'Product sales metrics and rankings',
    category: 'analytics',
    usesMultipleTables: true,
    sql: `-- Product Performance Analysis
SELECT
  p.product_id,
  p.product_name,
  p.category,
  COUNT(DISTINCT o.order_id) as order_count,
  SUM(o.quantity) as total_quantity_sold,
  SUM(o.quantity * p.price) as total_revenue,
  AVG(o.quantity) as avg_quantity_per_order,
  COUNT(DISTINCT o.customer_id) as unique_customers
FROM {{ ref('products') }} p
LEFT JOIN {{ ref('order_items') }} o ON p.product_id = o.product_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY p.product_id, p.product_name, p.category
ORDER BY total_revenue DESC
LIMIT 100`
  },
  {
    id: 'cohort_analysis',
    name: 'Cohort Analysis',
    description: 'Customer cohort retention and behavior',
    category: 'analytics',
    usesMultipleTables: false,
    sql: `-- Cohort Analysis
WITH cohorts AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', MIN(order_date)) as cohort_month
  FROM {{ ref('orders') }}
  GROUP BY customer_id
)
SELECT
  cohorts.cohort_month,
  DATE_TRUNC('month', o.order_date) as activity_month,
  DATEDIFF('month', cohorts.cohort_month, DATE_TRUNC('month', o.order_date)) as months_since_first_order,
  COUNT(DISTINCT o.customer_id) as active_customers,
  SUM(o.order_amount) as cohort_revenue
FROM cohorts
JOIN {{ ref('orders') }} o ON cohorts.customer_id = o.customer_id
GROUP BY cohorts.cohort_month, activity_month
ORDER BY cohorts.cohort_month, months_since_first_order`
  },
  {
    id: 'rfm_segmentation',
    name: 'RFM Segmentation',
    description: 'Recency, Frequency, Monetary customer segments',
    category: 'business',
    usesMultipleTables: false,
    sql: `-- RFM Segmentation
SELECT
  customer_id,
  DATEDIFF('day', MAX(order_date), CURRENT_DATE) as recency,
  COUNT(DISTINCT order_id) as frequency,
  SUM(order_amount) as monetary,
  CASE
    WHEN DATEDIFF('day', MAX(order_date), CURRENT_DATE) <= 30 THEN 'Active'
    WHEN DATEDIFF('day', MAX(order_date), CURRENT_DATE) <= 90 THEN 'At Risk'
    ELSE 'Churned'
  END as segment
FROM {{ ref('orders') }}
GROUP BY customer_id`
  },
  {
    id: 'churn_features',
    name: 'Churn Prediction Features',
    description: 'ML features for churn prediction models',
    category: 'analytics',
    usesMultipleTables: false,
    sql: `-- Churn Prediction Features
SELECT
  customer_id,
  DATEDIFF('day', MAX(order_date), CURRENT_DATE) as days_since_last_order,
  COUNT(DISTINCT order_id) as lifetime_orders,
  AVG(order_amount) as avg_order_value,
  STDDEV(order_amount) as order_value_stddev,
  COUNT(DISTINCT DATE_TRUNC('month', order_date)) as active_months,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*) as cancellation_rate
FROM {{ ref('orders') }}
GROUP BY customer_id`
  },
  {
    id: 'simple_aggregation',
    name: 'Simple Aggregation',
    description: 'Basic GROUP BY aggregation template',
    category: 'template',
    usesMultipleTables: false,
    sql: `-- Simple Aggregation Template
SELECT
  column1,
  column2,
  COUNT(*) as count,
  SUM(value_column) as total,
  AVG(value_column) as average
FROM {{ ref('table_name') }}
WHERE condition = 'value'
GROUP BY column1, column2
ORDER BY count DESC`
  },
  {
    id: 'join_template',
    name: 'Multi-Table Join',
    description: 'Template for joining multiple tables',
    category: 'template',
    usesMultipleTables: true,
    sql: `-- Multi-Table Join Template
SELECT
  t1.id,
  t1.column1,
  t2.column2,
  t3.column3
FROM {{ ref('table1') }} t1
LEFT JOIN {{ ref('table2') }} t2 ON t1.id = t2.table1_id
LEFT JOIN {{ ref('table3') }} t3 ON t1.id = t3.table1_id
WHERE t1.created_at >= CURRENT_DATE - INTERVAL '30' DAY`
  },
  {
    id: 'window_functions',
    name: 'Window Functions',
    description: 'Ranking and running totals template',
    category: 'template',
    usesMultipleTables: false,
    sql: `-- Window Functions Template
SELECT
  column1,
  column2,
  value_column,
  ROW_NUMBER() OVER (PARTITION BY column1 ORDER BY value_column DESC) as rank,
  SUM(value_column) OVER (PARTITION BY column1) as group_total,
  AVG(value_column) OVER (PARTITION BY column1) as group_average
FROM {{ ref('table_name') }}
ORDER BY column1, rank`
  },
  {
    id: 'time_series',
    name: 'Time-Series Analysis',
    description: 'Daily/monthly aggregation with trends',
    category: 'template',
    usesMultipleTables: false,
    sql: `-- Time-Series Analysis Template
SELECT
  DATE_TRUNC('day', timestamp_column) as period,
  COUNT(*) as count,
  SUM(value_column) as total,
  AVG(value_column) as average,
  LAG(COUNT(*), 1) OVER (ORDER BY DATE_TRUNC('day', timestamp_column)) as previous_count
FROM {{ ref('table_name') }}
WHERE timestamp_column >= CURRENT_DATE - INTERVAL '90' DAY
GROUP BY DATE_TRUNC('day', timestamp_column)
ORDER BY period`
  },
  {
    id: 'inventory_turnover',
    name: 'Inventory Turnover',
    description: 'Product inventory and sales velocity',
    category: 'business',
    usesMultipleTables: true,
    sql: `-- Inventory Turnover Analysis
SELECT
  p.product_id,
  p.product_name,
  i.current_stock,
  COUNT(DISTINCT o.order_id) as orders_30d,
  SUM(o.quantity) as units_sold_30d,
  i.current_stock / NULLIF(SUM(o.quantity) / 30, 0) as days_of_inventory
FROM {{ ref('products') }} p
LEFT JOIN {{ ref('inventory') }} i ON p.product_id = i.product_id
LEFT JOIN {{ ref('order_items') }} o ON p.product_id = o.product_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY p.product_id, p.product_name, i.current_stock
ORDER BY days_of_inventory`
  },
  {
    id: 'revenue_attribution',
    name: 'Revenue Attribution',
    description: 'Multi-touch attribution analysis',
    category: 'business',
    usesMultipleTables: true,
    sql: `-- Revenue Attribution Analysis
SELECT
  e.event_type,
  e.channel,
  COUNT(DISTINCT e.customer_id) as influenced_customers,
  COUNT(DISTINCT o.order_id) as attributed_orders,
  SUM(o.order_amount) as attributed_revenue,
  SUM(o.order_amount) / COUNT(DISTINCT o.order_id) as avg_order_value
FROM {{ ref('events') }} e
JOIN {{ ref('orders') }} o ON e.customer_id = o.customer_id
WHERE e.event_date <= o.order_date
  AND e.event_date >= o.order_date - INTERVAL '7' DAY
GROUP BY e.event_type, e.channel
ORDER BY attributed_revenue DESC`
  }
];

export function Step5Transform({
  initialData,
  selectedTables,
  schema,
  productDefinition,
  selectedSources,
  onComplete,
  onBack
}: Step5TransformProps) {
  const [mode, setMode] = useState<Mode>(initialData?.sql ? 'editor' : 'choice');
  const [naturalLanguage, setNaturalLanguage] = useState(initialData?.naturalLanguage || '');
  const [sql, setSQL] = useState(initialData?.sql || '');
  const [selectedTemplate, setSelectedTemplate] = useState<QueryTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateCarouselStart, setTemplateCarouselStart] = useState(0);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    sql: string;
    explanation: string;
    assumptions: string[];
    warnings: string[];
    confidence: number;
  } | null>(null);

  // Validation & Testing state
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    rowCount?: number;
    previewData?: any[];
    executionTime?: number;
    error?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Listen for SQL returned from playground
  useEffect(() => {
    const handleStorageChange = () => {
      const returnedSQL = localStorage.getItem('workflow_sql_return');
      if (returnedSQL) {
        try {
          const data = JSON.parse(returnedSQL);
          setSQL(data.sql);
          setMode('editor');
          localStorage.removeItem('workflow_sql_return');
        } catch (error) {
          console.error('Failed to parse returned SQL:', error);
        }
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleGenerateSQL = async () => {
    if (!naturalLanguage.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/tisql/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natural_language: naturalLanguage,
          available_sources: selectedTables.map(table => ({
            name: table,
            schema: 'iceberg',
            columns: schema.map(col => ({ name: col.name, type: col.type }))
          })),
          output_schema: schema
        })
      });

      const data = await response.json();

      setAiResponse({
        sql: data.sql || generateFallbackSQL(),
        explanation: data.explanation || 'Generated SQL query based on your request.',
        assumptions: data.assumptions || [],
        warnings: data.warnings || [],
        confidence: data.confidence || 0.7
      });

      setSQL(data.sql || generateFallbackSQL());
      setMode('generated');
    } catch (error) {
      console.error('Failed to generate SQL:', error);
      const fallbackSQL = generateFallbackSQL();
      setAiResponse({
        sql: fallbackSQL,
        explanation: 'Generated a basic SQL template. Customize it to match your requirements.',
        assumptions: ['Using LEFT JOIN to preserve all records'],
        warnings: ['Please review and adjust the JOIN conditions'],
        confidence: 0.5
      });
      setSQL(fallbackSQL);
      setMode('generated');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackSQL = (): string => {
    if (selectedTables.length === 0) {
      return '-- No tables selected\n-- Please go back and select source tables';
    }

    if (selectedTables.length === 1) {
      const fields = schema.length > 0
        ? schema.map(f => `  ${f.name}`).join(',\n')
        : '  *';
      return `SELECT\n${fields}\nFROM {{ ref('${selectedTables[0]}') }}`;
    }

    const primaryTable = selectedTables[0];
    const fields = schema.length > 0
      ? schema.map(f => `  ${f.name}`).join(',\n')
      : '  *';

    let sql = `SELECT\n${fields}\nFROM {{ ref('${primaryTable}') }} AS t1\n`;

    selectedTables.slice(1).forEach((table, index) => {
      const alias = `t${index + 2}`;
      sql += `LEFT JOIN {{ ref('${table}') }} AS ${alias}\n  ON t1.id = ${alias}.id  -- TODO: Update join condition\n`;
    });

    return sql;
  };

  const handleSelectTemplate = (template: QueryTemplate) => {
    setSelectedTemplate(template);
    setMode('template-detail');
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    setSQL(selectedTemplate.sql);
    setMode('editor');
  };

  const handleLoadTemplateInEditor = (template: QueryTemplate) => {
    // Confirm if SQL exists and would be overwritten
    if (sql.trim() && !confirm(`Replace current SQL with "${template.name}" template?`)) {
      return;
    }
    setSQL(template.sql);
    setShowTemplateBrowser(false);
  };

  const handleOpenAdvancedEditor = () => {
    const params = new URLSearchParams({
      sql: sql,
      returnTo: window.location.href,
      mode: 'workflow'
    });

    // Calculate center position for popup
    const width = 1400;
    const height = 900;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const windowFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,menubar=no,toolbar=no,location=no`;

    window.open(`/playground?${params.toString()}`, 'tisql-advanced-editor', windowFeatures);
  };

  const handleContinue = () => {
    onComplete({
      sql,
      naturalLanguage,
      template: selectedTemplate?.id,
      aiGenerated: mode === 'generated'
    });
  };

  // Validation handler
  const handleValidate = async () => {
    if (!sql.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Simulate validation (in production this would call an API)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation checks
      if (!sql.toLowerCase().includes('select')) {
        errors.push('SQL must contain a SELECT statement');
      }

      // Check if output columns match schema
      schema.forEach(field => {
        if (!sql.toLowerCase().includes(field.name.toLowerCase())) {
          warnings.push(`Output field "${field.name}" not found in query`);
        }
      });

      // Check for common issues
      if (sql.toLowerCase().includes('select *')) {
        warnings.push('Using SELECT * - consider specifying explicit columns');
      }

      setValidationResult({
        isValid: errors.length === 0,
        errors,
        warnings
      });
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Validation failed: Unable to connect to validation service'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Test with sample data handler
  const handleTest = async () => {
    if (!sql.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      // Simulate test execution (in production this would call Trino/Iceberg API)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockData = [
        { id: 1, name: 'Sample Row 1', value: 100 },
        { id: 2, name: 'Sample Row 2', value: 200 },
        { id: 3, name: 'Sample Row 3', value: 300 }
      ];

      setTestResult({
        success: true,
        rowCount: mockData.length,
        previewData: mockData,
        executionTime: 127
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Test execution failed: ' + (error as Error).message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const visibleTemplates = QUERY_TEMPLATES.slice(templateCarouselStart, templateCarouselStart + 4);
  const canScrollLeft = templateCarouselStart > 0;
  const canScrollRight = templateCarouselStart + 4 < QUERY_TEMPLATES.length;

  // Full-Page Workstation Mode - Industry Standard Experience
  if (mode === 'editor' || mode === 'blank') {
    return (
      <TiSQLWorkstation
        productDefinition={productDefinition}
        selectedSources={selectedSources || []}
        outputSchema={schema}
        sql={sql}
        onSQLChange={setSQL}
        catalog="iceberg"
        environment="development"
        onRun={handleTest}
        onValidate={handleValidate}
        onSave={() => {
          // Optional: implement save functionality
          console.log('Save SQL:', sql);
        }}
        onBack={() => setMode('choice')}
        onContinue={handleContinue}
        validationResult={validationResult}
        testResult={testResult}
        isValidating={isValidating}
        isTesting={isTesting}
        theme="dark"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Transform Logic</h2>
        <p className="text-muted-foreground text-lg">
          Define how to transform your source tables into the output schema
        </p>
      </div>

      {/* Mode: Choice (Entry Point) */}
      {mode === 'choice' && (
        <div className="space-y-6">
          {/* Primary Intent Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Blank */}
            <Card
              className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
              onClick={() => {
                setSQL(generateFallbackSQL());
                setMode('blank');
              }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileCode className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Start Blank</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Write SQL directly with full control
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Code2 className="w-3 h-3" />
                    <span>For experienced SQL writers</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Use AI */}
            <Card
              className="p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
              onClick={() => setMode('ai')}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Use AI</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Describe intent → Generate SQL
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3" />
                    <span>Natural language to SQL</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Template Carousel */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Browse Templates</h3>
                <Badge variant="secondary" className="text-xs">
                  {QUERY_TEMPLATES.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTemplateCarouselStart(Math.max(0, templateCarouselStart - 4))}
                  disabled={!canScrollLeft}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTemplateCarouselStart(templateCarouselStart + 4)}
                  disabled={!canScrollRight}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {visibleTemplates.map(template => (
                <Card
                  key={template.id}
                  className="p-5 cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="space-y-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm leading-tight">{template.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Context Summary */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>{selectedTables.length} tables, {schema.length} columns available</span>
            </div>
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              <span>Target: {schema.length} output fields</span>
            </div>
          </div>
        </div>
      )}

      {/* Mode: AI Input */}
      {mode === 'ai' && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Describe your transformation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Explain what you want to do with your data in plain English
                </p>
              </div>

              <Textarea
                placeholder="Example: Show me all customers who made purchases in the last 30 days with their total spend and order count, ordered by total spend descending"
                value={naturalLanguage}
                onChange={(e) => setNaturalLanguage(e.target.value)}
                className="min-h-[120px]"
                autoFocus
              />

              <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                <span>Using: {selectedTables.join(', ')}</span>
                <Button
                  onClick={handleGenerateSQL}
                  disabled={!naturalLanguage.trim() || isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate SQL
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Button
            variant="ghost"
            onClick={() => setMode('choice')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </Button>
        </div>
      )}

      {/* Mode: Template Detail */}
      {mode === 'template-detail' && selectedTemplate && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                    <Badge variant="outline">{selectedTemplate.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>

              {/* Template SQL Preview - Editable Monaco */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 border-b">
                  <span className="text-xs font-medium">SQL Preview (Editable)</span>
                </div>
                <div className="h-[300px]">
                  <Editor
                    height="300px"
                    language="sql"
                    value={selectedTemplate.sql}
                    onChange={(value) => {
                      if (selectedTemplate && value !== undefined) {
                        setSelectedTemplate({ ...selectedTemplate, sql: value });
                      }
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      readOnly: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
                      suggest: {
                        showKeywords: true,
                        showSnippets: true
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setMode('choice');
                  }}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to templates
                </Button>
                <Button onClick={handleUseTemplate} size="lg">
                  Use Template
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Mode: Generated SQL */}
      {mode === 'generated' && aiResponse && (
        <div className="space-y-4">
          <Card className="p-4 border-green-200 bg-green-50/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">SQL Generated</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(aiResponse.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {aiResponse.explanation}
                  </p>
                </div>

                {aiResponse.assumptions.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>
                      {aiResponse.assumptions[0]}
                      {aiResponse.assumptions.length > 1 && ` (+${aiResponse.assumptions.length - 1} more)`}
                    </span>
                  </div>
                )}

                {aiResponse.warnings.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-amber-700">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>{aiResponse.warnings[0]}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setMode('ai')}>
                    Regenerate
                  </Button>
                  <Button size="sm" onClick={() => setMode('editor')}>
                    Edit SQL
                  </Button>
                  <Button size="sm" onClick={handleContinue}>
                    Use This
                    <ArrowRight className="ml-2 w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b bg-muted/30 px-4 py-2">
              <span className="text-sm font-medium">Generated SQL</span>
            </div>
            <pre className="p-4 text-sm font-mono bg-background overflow-x-auto max-h-[400px]">
              {sql}
            </pre>
          </Card>
        </div>
      )}

      {/* Navigation - Only shown for non-editor/blank modes */}
      <div className="flex justify-between pt-4 border-t">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
      </div>
    </div>
  );
}
