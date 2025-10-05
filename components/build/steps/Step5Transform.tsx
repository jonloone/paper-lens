'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HybridSQLWorkbench } from '@/components/build/HybridSQLWorkbench';
import { ArrowRight, ArrowLeft, Code2 } from 'lucide-react';

export interface Step5Data {
  sql: string;
}

interface Step5TransformProps {
  initialData?: Partial<Step5Data>;
  selectedTables: string[]; // From Step 2
  schema: Array<{ name: string; type: string }>; // From Step 3
  onComplete: (data: Step5Data) => void;
  onBack: () => void;
}

export function Step5Transform({ initialData, selectedTables, schema, onComplete, onBack }: Step5TransformProps) {
  const [sql, setSQL] = useState<string>(
    initialData?.sql || generateInitialSQL(selectedTables, schema)
  );

  const handleContinue = () => {
    onComplete({ sql });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Code2 className="w-8 h-8 text-primary" />
          Transform Logic
        </h2>
        <p className="text-muted-foreground text-lg">
          Write SQL to transform your source tables into the output schema
        </p>
      </div>

      {/* SQL Workbench */}
      <HybridSQLWorkbench
        sql={sql}
        onSQLChange={setSQL}
        availableTables={selectedTables}
        outputSchema={schema}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Quality
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="min-w-[200px]"
        >
          Continue to Delivery
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Generate initial SQL based on selected tables and schema
 */
function generateInitialSQL(tables: string[], schema: Array<{ name: string }>): string {
  if (tables.length === 0) {
    return '-- Select your source tables from the browser above';
  }

  if (tables.length === 1) {
    // Single table: simple SELECT
    const fields = schema.map(f => `  ${f.name}`).join(',\n');
    return `SELECT\n${fields}\nFROM ${tables[0]}`;
  }

  // Multiple tables: suggest JOIN template
  const primaryTable = tables[0];
  const fields = schema.map(f => `  ${f.name}`).join(',\n');

  let sql = `SELECT\n${fields}\nFROM ${primaryTable} AS t1\n`;

  tables.slice(1).forEach((table, index) => {
    const alias = `t${index + 2}`;
    sql += `LEFT JOIN ${table} AS ${alias}\n  ON t1.id = ${alias}.id  -- TODO: Update join condition\n`;
  });

  return sql;
}
