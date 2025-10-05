'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Rocket, FileText, Database, Calendar, Download, Eye, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface Step6Data {
  deployed: boolean;
  prUrl?: string;
}

interface Step6ReviewDeployProps {
  formData: any;
  onComplete: (data: Step6Data) => void;
  onBack: () => void;
}

interface GeneratedArtifact {
  name: string;
  path: string;
  content: string;
  type: 'contract' | 'dbt' | 'airflow';
}

export function Step6ReviewDeploy({ formData, onComplete, onBack }: Step6ReviewDeployProps) {
  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>([]);
  const [previewArtifact, setPreviewArtifact] = useState<GeneratedArtifact | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    generateArtifacts();
  }, []);

  function generateArtifacts() {
    setIsGenerating(true);

    // Simulate artifact generation
    setTimeout(() => {
      const productName = formData.step1?.name || 'unnamed_product';
      const displayName = formData.step1?.displayName || 'Unnamed Product';
      const description = formData.step1?.description || '';
      const owner = formData.step1?.owner || 'data-team';
      const schedule = formData.step1?.schedule || { type: 'daily', time: '02:00' };
      const sql = formData.step3?.sql || 'SELECT 1';
      const deliveryConfig = formData.step5?.deliveryConfig || {
        catalog: 'iceberg_prod',
        schema: 'analytics',
        tableName: productName,
        format: 'iceberg',
        materialization: 'table'
      };

      const generated: GeneratedArtifact[] = [];

      // 1. ODCS Contract (v3.0)
      const odcsContract = generateODCSContract(formData);
      generated.push({
        name: 'ODCS Data Contract',
        path: `contracts/${productName}/v1.0.0/contract.yaml`,
        content: odcsContract,
        type: 'contract'
      });

      // 2. dbt Model
      const dbtModel = generateDbtModel(sql, deliveryConfig, productName);
      generated.push({
        name: 'dbt Model',
        path: `dbt/models/${deliveryConfig.schema}/${productName}.sql`,
        content: dbtModel,
        type: 'dbt'
      });

      // 3. Airflow DAG
      const airflowDag = generateAirflowDAG(formData);
      generated.push({
        name: 'Airflow DAG',
        path: `airflow/dags/${productName}_dag.py`,
        content: airflowDag,
        type: 'airflow'
      });

      setArtifacts(generated);
      setIsGenerating(false);
    }, 1000);
  }

  function handleDeploy() {
    // TODO: Implement Git integration
    // - Create branch: feature/data-product-{productName}
    // - Commit artifacts
    // - Create PR via GitHub API
    // For now, just complete the flow
    onComplete({
      deployed: true,
      prUrl: 'https://github.com/org/repo/pull/123' // Mock PR URL
    });
  }

  function downloadArtifact(artifact: GeneratedArtifact) {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.path.split('/').pop() || 'artifact.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const scheduleStr = formData.step1?.schedule?.type === 'daily'
    ? `Daily at ${formData.step1?.schedule?.time || '02:00'}`
    : formData.step1?.schedule?.type === 'hourly'
    ? 'Hourly'
    : formData.step1?.schedule?.type === 'weekly'
    ? `Weekly on ${formData.step1?.schedule?.day || 'Monday'}`
    : 'Custom schedule';

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Review & Deploy</h2>
        <p className="text-muted-foreground text-lg">
          Review generated artifacts and create pull request
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Product Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Product Name</p>
              <p className="font-medium">{formData.step1?.displayName || 'Unnamed Product'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium">{formData.step1?.owner || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domain</p>
              <p className="font-medium">{formData.step1?.domain || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Schedule</p>
              <p className="font-medium">{scheduleStr}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-sm mt-1">{formData.step1?.description || 'No description'}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Output Location</p>
            <p className="font-mono text-sm mt-1">
              {formData.step5?.deliveryConfig?.catalog || 'iceberg_prod'}.
              {formData.step5?.deliveryConfig?.schema || 'analytics'}.
              {formData.step5?.deliveryConfig?.tableName || formData.step1?.name || 'table'}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Source Tables</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {formData.step2?.selectedSources?.map((source: any) => (
                <Badge key={source.id} variant="secondary">
                  {source.schema}.{source.name}
                </Badge>
              )) || <span className="text-sm text-muted-foreground">None selected</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Artifacts */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Artifacts</CardTitle>
          <CardDescription>
            {isGenerating ? 'Generating files...' : `${artifacts.length} files ready for deployment`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="text-center py-8 text-muted-foreground">
              Generating artifacts...
            </div>
          ) : (
            <div className="space-y-3">
              {artifacts.map((artifact, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    {artifact.type === 'contract' && <FileText className="w-5 h-5 text-blue-600" />}
                    {artifact.type === 'dbt' && <Database className="w-5 h-5 text-purple-600" />}
                    {artifact.type === 'airflow' && <Calendar className="w-5 h-5 text-orange-600" />}
                    <div>
                      <p className="font-medium">{artifact.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{artifact.path}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewArtifact(artifact)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadArtifact(artifact)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment Info */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">Ready to Deploy</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Clicking "Create Pull Request" will create a new Git branch, commit these artifacts, and open a PR for team review.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artifact Preview Dialog */}
      <Dialog open={!!previewArtifact} onOpenChange={(open) => !open && setPreviewArtifact(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewArtifact?.name}</DialogTitle>
          </DialogHeader>
          {previewArtifact && (
            <div>
              <p className="text-sm text-muted-foreground font-mono mb-4">
                {previewArtifact.path}
              </p>
              <ScrollArea className="h-[500px] w-full rounded-md border">
                <pre className="p-4 text-xs">
                  <code>{previewArtifact.content}</code>
                </pre>
              </ScrollArea>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setPreviewArtifact(null)}>
                  Close
                </Button>
                <Button onClick={() => downloadArtifact(previewArtifact)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button onClick={onBack} variant="outline" size="lg">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Delivery Config
        </Button>
        <Button
          onClick={handleDeploy}
          disabled={isGenerating}
          size="lg"
          className="bg-green-600 hover:bg-green-700 min-w-[200px]"
        >
          <Rocket className="mr-2 w-4 h-4" />
          Create Pull Request
        </Button>
      </div>
    </div>
  );
}

// TypeScript template string generators (following PRD exactly - no Jinja2)
function generateODCSContract(formData: any): string {
  const product = formData.step1 || {};
  const sources = formData.step2?.selectedSources || [];
  const deliveryConfig = formData.step5?.deliveryConfig || {};

  return `# Data Contract (ODCS v3.0)
# Generated by NexusOne Build Flow

version: "3.0.0"
kind: DataContract

info:
  title: ${product.displayName || 'Unnamed Product'}
  version: "1.0.0"
  description: ${product.description || 'No description'}
  owner: ${product.owner || 'data-team'}
  domain: ${product.domain || 'analytics'}
  tags:
${(product.tags || []).map((tag: string) => `    - ${tag}`).join('\n') || '    - data-product'}

servers:
  production:
    type: trino
    host: trino.nexusone.com
    port: 8080
    catalog: ${deliveryConfig.catalog || 'iceberg_prod'}
    schema: ${deliveryConfig.schema || 'analytics'}

models:
  - name: ${deliveryConfig.tableName || product.name || 'table'}
    type: table
    description: ${product.description || 'Data product table'}

quality:
  type: great_expectations
  expectationSuiteName: ${product.name}_quality

sla:
  freshnessHours: ${product.sla?.freshnessHours || 24}
  qualityThreshold: ${product.sla?.qualityThreshold || 95}
  availabilityTarget: ${product.sla?.availabilityTarget || 99.9}

schedule:
  type: ${product.schedule?.type || 'daily'}
${product.schedule?.time ? `  time: "${product.schedule.time}"` : ''}
${product.schedule?.day ? `  day: "${product.schedule.day}"` : ''}
${product.schedule?.cron ? `  cron: "${product.schedule.cron}"` : ''}
`;
}

function generateDbtModel(sql: string, deliveryConfig: any, productName: string): string {
  const materialization = deliveryConfig.materialization || 'table';
  const schema = deliveryConfig.schema || 'analytics';
  const tags = ['data-product', 'generated'];

  return `{{
  config(
    materialized='${materialization}',
    schema='${schema}',
    tags=${JSON.stringify(tags)},
    enabled=true
  )
}}

-- Generated by NexusOne Build Flow
-- Product: ${productName}
-- Format: ${deliveryConfig.format || 'iceberg'}

${sql}
`;
}

function generateAirflowDAG(formData: any): string {
  const product = formData.step1 || {};
  const productName = product.name || 'unnamed_product';
  const schedule = product.schedule || { type: 'daily', time: '02:00' };

  let scheduleInterval = '0 2 * * *'; // Default: daily at 2 AM
  if (schedule.type === 'hourly') {
    scheduleInterval = '0 * * * *';
  } else if (schedule.type === 'daily') {
    const [hour, minute] = (schedule.time || '02:00').split(':');
    scheduleInterval = `${minute} ${hour} * * *`;
  } else if (schedule.type === 'weekly') {
    const dayMap: Record<string, number> = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
      friday: 5, saturday: 6, sunday: 0
    };
    const dayNum = dayMap[schedule.day?.toLowerCase() || 'monday'];
    scheduleInterval = `0 2 * * ${dayNum}`;
  } else if (schedule.cron) {
    scheduleInterval = schedule.cron;
  }

  return `"""
Airflow DAG for ${product.displayName || 'Unnamed Product'}
Generated by NexusOne Build Flow

Owner: ${product.owner || 'data-team'}
Description: ${product.description || 'Data product pipeline'}
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator

default_args = {
    'owner': '${product.owner || 'data-team'}',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='${productName}',
    default_args=default_args,
    description='${product.description || 'Data product pipeline'}',
    schedule_interval='${scheduleInterval}',
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['data-product', 'dbt', '${product.domain || 'analytics'}'],
) as dag:

    start = EmptyOperator(task_id='start')

    # Run dbt model
    dbt_run = BashOperator(
        task_id='dbt_run_${productName}',
        bash_command='dbt run --select ${productName}',
    )

    # Run data quality tests
    dbt_test = BashOperator(
        task_id='dbt_test_${productName}',
        bash_command='dbt test --select ${productName}',
    )

    # Run Great Expectations validation
    ge_validate = BashOperator(
        task_id='ge_validate_${productName}',
        bash_command='great_expectations checkpoint run ${productName}_checkpoint',
    )

    end = EmptyOperator(task_id='end')

    # Define task dependencies
    start >> dbt_run >> dbt_test >> ge_validate >> end
`;
}
