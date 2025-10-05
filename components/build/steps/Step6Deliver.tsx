'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle, Rocket, Database, FileJson, Table as TableIcon, Workflow, Calendar, Shield, Box } from 'lucide-react';

export interface DeliveryOptions {
  outputFormat: 'iceberg' | 'delta' | 'parquet';
  outputLocation: string;
  enableAPI: boolean;
  enableStreaming: boolean;
  schedule: string;
  scheduleUnit: 'minutes' | 'hours' | 'days';
}

export interface Step6Data {
  deliveryOptions: DeliveryOptions;
}

interface Step6DeliverProps {
  initialData?: Partial<Step6Data>;
  selectedTables?: string[];
  schema?: Array<{ name: string; type: string }>;
  qualityRules?: any[];
  onComplete: (data: Step6Data) => void;
  onBack: () => void;
}

export function Step6Deliver({ initialData, selectedTables = [], schema = [], qualityRules = [], onComplete, onBack }: Step6DeliverProps) {
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>(
    initialData?.deliveryOptions || {
      outputFormat: 'iceberg',
      outputLocation: 'iceberg.products.',
      enableAPI: true,
      enableStreaming: false,
      schedule: '1',
      scheduleUnit: 'hours'
    }
  );

  const isValid = deliveryOptions.outputLocation.trim() !== '';

  const handleDeploy = () => {
    if (isValid) {
      onComplete({ deliveryOptions });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Rocket className="w-8 h-8 text-primary" />
          Ready to deploy
        </h2>
        <p className="text-muted-foreground text-lg">
          Review your configuration and schedule when this should run
        </p>
      </div>

      {/* Orchestration Summary */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Workflow className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">What We'll Set Up For You</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          We'll configure these existing tools to work together automatically:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
            <Database className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">dbt Model</p>
              <p className="text-xs text-muted-foreground">
                Combines {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} → {schema.length} column{schema.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
            <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Airflow Schedule</p>
              <p className="text-xs text-muted-foreground">
                Runs the pipeline on your schedule
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
            <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Quality Checks</p>
              <p className="text-xs text-muted-foreground">
                {qualityRules.length} validation{qualityRules.length !== 1 ? 's' : ''} via Great Expectations
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
            <Box className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">DataHub Registry</p>
              <p className="text-xs text-muted-foreground">
                Tracks lineage and metadata
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Output Configuration */}
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">Where Should We Save the Data?</h3>

          <div className="grid grid-cols-2 gap-6">
            {/* Format */}
            <div className="space-y-2">
              <Label>Table Format</Label>
              <Select
                value={deliveryOptions.outputFormat}
                onValueChange={(value: any) => setDeliveryOptions({
                  ...deliveryOptions,
                  outputFormat: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iceberg">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Iceberg (Recommended)
                    </div>
                  </SelectItem>
                  <SelectItem value="delta">
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4" />
                      Delta Lake
                    </div>
                  </SelectItem>
                  <SelectItem value="parquet">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      Parquet Files
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Format for storing the data
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Table Name *</Label>
              <Input
                value={deliveryOptions.outputLocation}
                onChange={(e) => setDeliveryOptions({
                  ...deliveryOptions,
                  outputLocation: e.target.value
                })}
                placeholder="products.customer_behavior"
              />
              <p className="text-xs text-muted-foreground">
                Where in the lakehouse to save this
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Access Patterns - Simplified for Phase 1: Batch SQL only */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">How to Access the Data</h3>
        <div className="p-4 rounded-lg border bg-muted/10">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-primary" />
            <p className="font-medium">SQL Query Access</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Query this data using SQL through Trino, dbt, or any BI tool connected to your lakehouse
          </p>
          <div className="mt-3 p-3 bg-background rounded border font-mono text-xs">
            SELECT * FROM {deliveryOptions.outputLocation || 'your_table_name'}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Want real-time API or streaming access? Contact the data platform team.
        </p>
      </Card>

      {/* Schedule */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">How Often Should This Update?</h3>

        <div className="flex items-center gap-4">
          <Label>Update every</Label>
          <Input
            type="number"
            min="1"
            value={deliveryOptions.schedule}
            onChange={(e) => setDeliveryOptions({
              ...deliveryOptions,
              schedule: e.target.value
            })}
            className="w-24"
          />
          <Select
            value={deliveryOptions.scheduleUnit}
            onValueChange={(value: any) => setDeliveryOptions({
              ...deliveryOptions,
              scheduleUnit: value
            })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          We'll set up an Airflow DAG to run this automatically on your schedule
        </p>
      </Card>

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
          onClick={handleDeploy}
          disabled={!isValid}
          size="lg"
          className="min-w-[200px] bg-green-600 hover:bg-green-700"
        >
          <Rocket className="mr-2 w-4 h-4" />
          Deploy Data Product
        </Button>
      </div>
    </div>
  );
}
