'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Database, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface Step5Data {
  deliveryConfig: {
    catalog: string;
    schema: string;
    tableName: string;
    format: 'iceberg' | 'delta';
    materialization: 'table' | 'view' | 'incremental';
  };
}

interface Step5DeliveryConfigProps {
  initialData?: Partial<Step5Data>;
  productName: string;
  onComplete: (data: Step5Data) => void;
  onBack: () => void;
}

export function Step5DeliveryConfig({ initialData, productName, onComplete, onBack }: Step5DeliveryConfigProps) {
  const [catalog, setCatalog] = useState(initialData?.deliveryConfig?.catalog || 'iceberg_prod');
  const [schema, setSchema] = useState(initialData?.deliveryConfig?.schema || 'analytics');
  const [tableName, setTableName] = useState(initialData?.deliveryConfig?.tableName || productName);
  const [format, setFormat] = useState<'iceberg' | 'delta'>(initialData?.deliveryConfig?.format || 'iceberg');
  const [materialization, setMaterialization] = useState<'table' | 'view' | 'incremental'>(
    initialData?.deliveryConfig?.materialization || 'table'
  );

  function handleContinue() {
    onComplete({
      deliveryConfig: {
        catalog,
        schema,
        tableName,
        format,
        materialization
      }
    });
  }

  const fullTablePath = `${catalog}.${schema}.${tableName}`;
  const isValid = catalog && schema && tableName;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Configure Delivery</h2>
        <p className="text-muted-foreground text-lg">
          Specify where your data product will be materialized
        </p>
      </div>

      {/* SQL Table Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <CardTitle>SQL Table Configuration</CardTitle>
          </div>
          <CardDescription>
            Your dbt model will create a table at this location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catalog</Label>
              <Select value={catalog} onValueChange={setCatalog}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iceberg_prod">iceberg_prod</SelectItem>
                  <SelectItem value="iceberg_staging">iceberg_staging</SelectItem>
                  <SelectItem value="iceberg_dev">iceberg_dev</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Schema</Label>
              <Select value={schema} onValueChange={setSchema}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytics">analytics</SelectItem>
                  <SelectItem value="marts">marts</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                  <SelectItem value="raw">raw</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Table Name</Label>
            <Input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="customer_churn_risk"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Table Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as 'iceberg' | 'delta')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iceberg">Apache Iceberg</SelectItem>
                  <SelectItem value="delta">Delta Lake</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Materialization</Label>
              <Select value={materialization} onValueChange={(v) => setMaterialization(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table (full refresh)</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="incremental">Incremental (Phase 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Full Path Preview */}
          <div className="mt-4 p-4 bg-muted rounded-md">
            <Label className="text-sm text-muted-foreground">Full Table Path</Label>
            <p className="font-mono text-sm mt-1">{fullTablePath}</p>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoint (Phase 2) */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          REST API endpoint generation coming in Phase 2 (Week 11-12). For now, your data will be available via SQL queries to the table above.
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Quality Rules
        </Button>
        <Button onClick={handleContinue} disabled={!isValid} size="lg" className="min-w-[200px]">
          Continue to Review
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
