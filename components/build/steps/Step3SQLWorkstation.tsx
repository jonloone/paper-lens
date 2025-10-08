'use client';

import { useState } from 'react';
import { TiSQLWorkstation } from '@/components/tisql/TiSQLWorkstation';

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
  const [sql, setSQL] = useState(initialData?.sql || '');
  const [validationResult, setValidationResult] = useState(initialData?.validationResult || null);
  const [testResult, setTestResult] = useState(initialData?.testResult || null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleRun = async () => {
    setIsTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = {
        success: true,
        rowCount: 1250,
        executionTime: 1.45,
        previewData: [
          { customer_id: 1, order_count: 15, total_spent: 1250.00 },
          { customer_id: 2, order_count: 8, total_spent: 890.50 },
          { customer_id: 3, order_count: 22, total_spent: 2100.75 }
        ]
      };
      setTestResult(result);
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
      onSave={() => console.log('SQL saved:', sql)}
      onBack={onBack}
      onContinue={handleContinue}
      continueButtonText="Define Quality"
      validationResult={validationResult}
      testResult={testResult}
      isValidating={isValidating}
      isTesting={isTesting}
      theme="dark"
    />
  );
}
