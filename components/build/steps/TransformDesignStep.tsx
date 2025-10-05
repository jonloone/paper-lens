'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, GitBranch, Code, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TransformDesignStepProps {
  workflowData: any;
  onComplete: (data: any) => void;
  uiConfig?: any;
}

export function TransformDesignStep({ workflowData, onComplete, uiConfig }: TransformDesignStepProps) {
  const [transformPipeline] = useState([
    { id: '1', name: 'Filter Invalid Records', type: 'filter' },
    { id: '2', name: 'Join Customer Data', type: 'join' },
    { id: '3', name: 'Aggregate by Region', type: 'aggregate' }
  ]);

  const [generatedSQL] = useState(`
-- Generated dbt model
{{ config(materialized='table') }}

WITH filtered_transactions AS (
  SELECT *
  FROM {{ ref('raw_transactions') }}
  WHERE amount > 0
    AND transaction_date >= '2024-01-01'
),

customer_enriched AS (
  SELECT
    t.*,
    c.customer_segment,
    c.lifetime_value
  FROM filtered_transactions t
  LEFT JOIN {{ ref('customer_profiles') }} c
    ON t.customer_id = c.customer_id
)

SELECT
  region,
  customer_segment,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM customer_enriched
GROUP BY region, customer_segment
  `);

  const handleContinue = () => {
    onComplete({ transformPipeline, generatedSQL });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Step 3: Transform Design</h2>
        <p className="text-muted-foreground">
          Design data transformations using dbt models for your data product.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Transform Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transformPipeline.map((stage) => (
              <div key={stage.id} className="p-3 border rounded-lg flex items-center justify-between">
                <span className="font-medium">{stage.name}</span>
                <span className="text-sm text-muted-foreground">{stage.type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Generated dbt Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
            <code className="text-xs">{generatedSQL}</code>
          </pre>
        </CardContent>
      </Card>

      <Alert>
        <Database className="w-4 h-4" />
        <AlertDescription>
          This dbt model will be deployed to your data warehouse and tested before production use.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={handleContinue} size="lg">
          Continue to API Configuration
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}