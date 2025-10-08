'use client';

import { useState, useEffect } from 'react';
import { TiSQLWorkstation } from '@/components/tisql/TiSQLWorkstation';
import { saveQueryPattern } from '@/lib/services/query-pattern-storage';
import type { QueryAnalysisResult } from '@/lib/types/query-optimization';

interface Step3SQLWorkstationProps {
  productDefinition: any;
  selectedSources: any[];
  schema: Array<{ name: string; type: string }>;
  initialData?: {
    sql: string;
    validationResult?: any;
    testResult?: any;
  };
  onComplete: (data: any) => void;
  onBack: () => void;
}

export function Step3SQLWorkstation({
  productDefinition,
  selectedSources,
  schema,
  initialData,
  onComplete,
  onBack
}: Step3SQLWorkstationProps) {
  // Provide a starter SQL query if none exists
  const defaultSQL = `-- Write your SQL query here
-- Available tables: ${selectedSources.map(s => s.name).join(', ')}

SELECT
  *
FROM {{ ref('${selectedSources[0]?.name || 'your_table'}') }}
LIMIT 100`;

  const [sql, setSQL] = useState(initialData?.sql || defaultSQL);
  const [validationResult, setValidationResult] = useState(initialData?.validationResult || null);
  const [testResult, setTestResult] = useState(initialData?.testResult || null);
  const [analysisResult, setAnalysisResult] = useState<QueryAnalysisResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate schema-aware mock data based on output schema
  const generateMockData = (schema: Array<{ name: string; type: string }>, rowCount: number = 5) => {
    const rows = [];

    for (let i = 0; i < rowCount; i++) {
      const row: Record<string, any> = {};

      schema.forEach(field => {
        const fieldType = field.type.toLowerCase();

        if (fieldType.includes('int') || fieldType.includes('bigint') || fieldType.includes('long')) {
          row[field.name] = Math.floor(Math.random() * 10000) + 1;
        } else if (fieldType.includes('decimal') || fieldType.includes('double') || fieldType.includes('float')) {
          row[field.name] = (Math.random() * 10000).toFixed(2);
        } else if (fieldType.includes('string') || fieldType.includes('varchar')) {
          // Smart string generation based on field name
          if (field.name.toLowerCase().includes('id')) {
            row[field.name] = `ID-${String(i + 1).padStart(5, '0')}`;
          } else if (field.name.toLowerCase().includes('name')) {
            row[field.name] = `Sample Name ${i + 1}`;
          } else if (field.name.toLowerCase().includes('email')) {
            row[field.name] = `user${i + 1}@example.com`;
          } else if (field.name.toLowerCase().includes('status')) {
            row[field.name] = ['active', 'pending', 'completed'][i % 3];
          } else {
            row[field.name] = `value_${i + 1}`;
          }
        } else if (fieldType.includes('date') || fieldType.includes('timestamp')) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          row[field.name] = date.toISOString().split('T')[0];
        } else if (fieldType.includes('bool')) {
          row[field.name] = i % 2 === 0;
        } else {
          row[field.name] = `data_${i + 1}`;
        }
      });

      rows.push(row);
    }

    return rows;
  };

  const handleRun = async () => {
    setIsTesting(true);
    const startTime = Date.now();

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const executionTime = Date.now() - startTime;

      // Generate realistic mock data based on schema
      const previewRowCount = 5;
      const totalRowCount = Math.floor(Math.random() * 10000) + 1000;
      const mockData = generateMockData(schema, previewRowCount);

      const result = {
        success: true,
        rowCount: totalRowCount,
        executionTime: executionTime / 1000,
        previewData: mockData
      };
      setTestResult(result);

      // Save successful query as a pattern for organizational learning
      if (sql.trim() && result.success && result.rowCount > 0) {
        try {
          saveQueryPattern(sql, {
            title: productDefinition?.displayName || 'Untitled Query',
            description: productDefinition?.description,
            sourceTables: selectedSources.map(s => s.name),
            catalog: 'iceberg',
            schema: 'production',
            createdBy: 'current-user', // TODO: Get from auth context
            dataProductId: productDefinition?.id
          });
          console.log('[Step3] Query pattern saved for organizational learning');
        } catch (saveError) {
          console.warn('[Step3] Failed to save query pattern:', saveError);
        }
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setValidationResult({
        isValid: true,
        errors: [],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!sql.trim()) return;

    setIsAnalyzing(true);
    try {
      console.log('[Step3] Analyzing query...');

      const response = await fetch('/api/analyze-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql,
          userId: 'current-user' // TODO: Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.result) {
        setAnalysisResult(data.result);
        console.log('[Step3] Analysis complete:', {
          findings: data.result.findings.length,
          criticalCount: data.result.summary.criticalFindings
        });
      } else {
        console.error('[Step3] Analysis failed:', data.error);
      }
    } catch (error) {
      console.error('[Step3] Error analyzing query:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    onComplete({
      sql,
      validationResult,
      testResult
    });
  };

  return (
    <TiSQLWorkstation
      productDefinition={productDefinition}
      selectedSources={selectedSources}
      outputSchema={schema}
      sql={sql}
      onSQLChange={setSQL}
      catalog="iceberg"
      environment="development"
      onRun={handleRun}
      onValidate={handleValidate}
      onAnalyze={handleAnalyze}
      onSave={() => console.log('SQL saved:', sql)}
      onBack={onBack}
      onContinue={handleContinue}
      continueButtonText="Define Quality"
      validationResult={validationResult}
      testResult={testResult}
      analysisResult={analysisResult}
      isValidating={isValidating}
      isTesting={isTesting}
      isAnalyzing={isAnalyzing}
      theme="dark"
    />
  );
}
