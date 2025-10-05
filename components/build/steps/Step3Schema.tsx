'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContractSchemaDesigner } from '@/components/build/ContractSchemaDesigner';
import { SchemaLineageFlow } from '@/components/build/SchemaLineageFlow';
import { ArrowRight, ArrowLeft, Sparkles, AlertCircle, CheckCircle2, Link2, Table, LayoutGrid } from 'lucide-react';
import {
  inferSchema,
  fetchTableMetadata,
  type SchemaField,
  type InferenceResult,
  type TableMetadata
} from '@/lib/build/schema-inference';

export interface Step3Data {
  schema: SchemaField[];
}

interface Step3SchemaProps {
  initialData?: Partial<Step3Data>;
  selectedTables: string[]; // From Step 2
  onComplete: (data: Step3Data) => void;
  onBack: () => void;
}

export function Step3Schema({ initialData, selectedTables, onComplete, onBack }: Step3SchemaProps) {
  const [schema, setSchema] = useState<SchemaField[]>(initialData?.schema || []);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [viewMode, setViewMode] = useState<'lineage' | 'table'>('lineage');
  const [selectedField, setSelectedField] = useState<SchemaField | null>(null);
  const [sourceTables, setSourceTables] = useState<TableMetadata[]>([]);

  // Auto-infer schema on mount if not already inferred
  useEffect(() => {
    if (schema.length === 0 && selectedTables.length > 0) {
      runInference();
    }
  }, []);

  const runInference = async () => {
    setIsInferring(true);
    try {
      // Fetch metadata for all selected tables
      const metadataPromises = selectedTables.map(fetchTableMetadata);
      const metadataList = await Promise.all(metadataPromises);

      // Store source tables for lineage view
      setSourceTables(metadataList.filter(Boolean) as TableMetadata[]);

      // Create metadata map
      const metadataMap = new Map<string, TableMetadata>();
      metadataList.forEach(metadata => {
        if (metadata) {
          metadataMap.set(metadata.id, metadata);
        }
      });

      // Run inference
      const result = await inferSchema(selectedTables, metadataMap);
      setInferenceResult(result);
      setSchema(result.schema);
    } catch (error) {
      console.error('Schema inference error:', error);
    } finally {
      setIsInferring(false);
    }
  };

  const isValid = schema.length > 0 && schema.every(field => field.name.trim() !== '');

  const handleContinue = () => {
    if (isValid) {
      onComplete({ schema });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          What columns do you need?
        </h2>
        <p className="text-muted-foreground text-lg">
          We've analyzed your selected tables and suggested the columns you'll likely need
        </p>
      </div>

      {/* Inference Status */}
      {isInferring && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            <div>
              <p className="font-medium text-primary">Figuring out what columns you need...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Looking at {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} to find the right fields
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Inference Suggestions */}
      {inferenceResult && showSuggestions && inferenceResult.suggestions.length > 0 && (
        <Card className="p-6 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Our Suggestions
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(false)}
            >
              Dismiss
            </Button>
          </div>
          <div className="space-y-2">
            {inferenceResult.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-900 dark:text-blue-100">{suggestion.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.confidence}% confidence
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Join Key Detection */}
      {inferenceResult && inferenceResult.joinKeys.length > 0 && (
        <Card className="p-6 border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">
              How These Tables Connect
            </h3>
          </div>
          <div className="space-y-2">
            {inferenceResult.joinKeys.map((join, index) => (
              <div key={index} className="flex items-center gap-3 text-sm p-3 rounded-lg bg-purple-500/10">
                <Badge variant="secondary" className="text-xs">
                  {join.confidence}%
                </Badge>
                <code className="text-xs bg-background/50 px-2 py-1 rounded">
                  {join.leftTable.split('.').pop()}.{join.leftColumn}
                </code>
                <span className="text-purple-600">↔</span>
                <code className="text-xs bg-background/50 px-2 py-1 rounded">
                  {join.rightTable.split('.').pop()}.{join.rightColumn}
                </code>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            We'll use these to combine the data from your tables
          </p>
        </Card>
      )}

      {/* Schema View Tabs */}
      {schema.length > 0 ? (
        <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="lineage" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Visual View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Edit Details
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={runInference}
              disabled={isInferring}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Refresh Suggestions
            </Button>
          </div>

          <TabsContent value="lineage" className="mt-4">
            <SchemaLineageFlow
              sourceTables={sourceTables.map(t => ({
                id: t.id,
                name: t.name,
                schema: t.schema || 'public',
                database: t.database || 'default',
                fieldCount: t.columns?.length || 0
              }))}
              outputSchema={schema}
              onFieldClick={setSelectedField}
            />
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Your Columns</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {schema.length} column{schema.length !== 1 ? 's' : ''} · Rename or adjust as needed
                </p>
              </div>
              <ContractSchemaDesigner
                schema={schema}
                onChange={setSchema}
              />
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Couldn't Find Columns</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn't analyze your selected tables. This might be a temporary issue.
          </p>
          <Button onClick={runInference} disabled={isInferring}>
            <Sparkles className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Data Sources
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          size="lg"
          className="min-w-[200px]"
        >
          Next: Add Quality Checks
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
