'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle, Rocket, Database, FileJson, Table as TableIcon, Workflow, Calendar, Shield, Box, Lock, AlertTriangle, Check, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { PolicyViolationsDialog, type PolicyViolation } from '@/components/build/PolicyViolationsDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { GovernanceConfig } from '@/lib/schemas/odcs-contract';
import { GlossaryTermConfirmation, type ConfirmedTerm } from '@/components/build/GlossaryTermConfirmation';
import { extractTerms, confirmTerm, type ExtractedTerm } from '@/lib/services/glossary-service';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  governance?: GovernanceConfig;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  productName?: string;
  domain?: string;
  businessPurpose?: string;
  sql?: string;
  onComplete: (data: Step6Data) => void;
  onBack: () => void;
}

export function Step6Deliver({
  initialData,
  selectedTables = [],
  schema = [],
  qualityRules = [],
  governance,
  dataClassification,
  productName,
  domain,
  businessPurpose,
  sql,
  onComplete,
  onBack
}: Step6DeliverProps) {
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

  const [validating, setValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [warnings, setWarnings] = useState<PolicyViolation[]>([]);
  const [showViolationsDialog, setShowViolationsDialog] = useState(false);
  const [rangerPolicies, setRangerPolicies] = useState<any[]>([]);

  // Glossary state
  const [extractedTerms, setExtractedTerms] = useState<ExtractedTerm[]>([]);
  const [confirmedTerms, setConfirmedTerms] = useState<Set<string>>(new Set());
  const [skippedTerms, setSkippedTerms] = useState<Set<string>>(new Set());
  const [extracting, setExtracting] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const isValid = deliveryOptions.outputLocation.trim() !== '';
  const hasCriticalViolations = violations.some(v => v.severity === 'critical');
  const pendingTerms = extractedTerms.filter(t => !confirmedTerms.has(t.text) && !skippedTerms.has(t.text));

  // Extract glossary terms on mount
  useEffect(() => {
    const extractGlossaryTerms = async () => {
      if (!schema.length && !sql && !businessPurpose) return;

      setExtracting(true);
      try {
        // Extract from multiple sources
        const allTerms: ExtractedTerm[] = [];

        // Extract from intent (business purpose)
        if (businessPurpose) {
          const intentResult = await extractTerms({
            step: 'intent',
            content: { businessPurpose },
            domain,
            product_name: productName
          });
          allTerms.push(...intentResult.terms);
        }

        // Extract from sources (schema/columns)
        if (schema.length > 0) {
          const sourcesResult = await extractTerms({
            step: 'sources',
            content: {
              selectedSources: [{
                name: deliveryOptions.outputLocation || 'output_table',
                columns: schema.map(s => ({ name: s.name, data_type: s.type }))
              }]
            },
            domain,
            product_name: productName
          });
          allTerms.push(...sourcesResult.terms);
        }

        // Extract from SQL
        if (sql) {
          const sqlResult = await extractTerms({
            step: 'sql',
            content: { sql },
            domain,
            product_name: productName
          });
          allTerms.push(...sqlResult.terms);
        }

        // Extract from quality rules
        if (qualityRules.length > 0) {
          const qualityResult = await extractTerms({
            step: 'quality',
            content: { qualityRules },
            domain,
            product_name: productName
          });
          allTerms.push(...qualityResult.terms);
        }

        // Deduplicate terms
        const uniqueTerms = Array.from(
          new Map(allTerms.map(term => [term.text, term])).values()
        );

        setExtractedTerms(uniqueTerms);

        // Auto-open if we found terms
        if (uniqueTerms.length > 0) {
          setGlossaryOpen(true);
        }
      } catch (error) {
        console.error('Failed to extract glossary terms:', error);
      } finally {
        setExtracting(false);
      }
    };

    extractGlossaryTerms();
  }, []); // Run once on mount

  const handleConfirmTerm = async (confirmed: ConfirmedTerm) => {
    try {
      await confirmTerm({
        product_id: deliveryOptions.outputLocation || 'temp-product',
        term: confirmed.term,
        definition: confirmed.definition,
        action: 'confirm',
        confidence: confirmed.confidence,
        domain,
        context: confirmed.source
      });

      setConfirmedTerms(prev => new Set(prev).add(confirmed.term));
    } catch (error) {
      console.error('Failed to confirm term:', error);
    }
  };

  const handleSkipTerm = (term: string) => {
    setSkippedTerms(prev => new Set(prev).add(term));
  };

  const validateGovernance = async () => {
    setValidating(true);
    try {
      // Build ODCS contract from form data
      const contract = {
        name: deliveryOptions.outputLocation,
        schema: schema.map(s => ({
          name: s.name,
          type: s.type,
          classification: governance?.security.pii_fields.includes(s.name) ? 'pii' : 'public'
        })),
        metadata: {
          data_classification: dataClassification
        },
        governance
      };

      // Validate with OPA
      const response = await fetch('/api/governance/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: contract,
          policies: ['schema_validation', 'quality_requirements', 'security_compliance']
        })
      });

      const result = await response.json();

      if (!result.valid) {
        const criticalViolations = result.violations?.filter((v: PolicyViolation) => v.severity === 'critical') || [];
        const warningViolations = result.violations?.filter((v: PolicyViolation) => v.severity === 'warning') || [];

        setViolations(criticalViolations);
        setWarnings(warningViolations);

        if (criticalViolations.length > 0) {
          setShowViolationsDialog(true);
        }
      }

      // Generate Ranger policies preview
      if (governance) {
        const rangerResponse = await fetch('/api/governance/generate-ranger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: contract })
        });

        const rangerResult = await rangerResponse.json();
        setRangerPolicies(rangerResult.policies || []);
      }

      setValidationComplete(true);
    } catch (error) {
      console.error('Governance validation failed:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleDeploy = async () => {
    if (!isValid) return;

    // If governance is configured and not yet validated, validate first
    if (governance && !validationComplete) {
      await validateGovernance();
      return;
    }

    // Block deployment if critical violations exist
    if (hasCriticalViolations) {
      setShowViolationsDialog(true);
      return;
    }

    // Proceed with deployment
    onComplete({ deliveryOptions });
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

      {/* Business Glossary Terms */}
      {extractedTerms.length > 0 && (
        <Collapsible open={glossaryOpen} onOpenChange={setGlossaryOpen}>
          <Card className="p-6 space-y-4 border-blue-200 dark:border-blue-900">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Business Glossary</h3>
                  <Badge variant="secondary" className="ml-2">
                    {confirmedTerms.size} of {extractedTerms.length} defined
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {pendingTerms.length > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      {pendingTerms.length} pending
                    </Badge>
                  )}
                  {glossaryOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4">
              <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">
                  Help Us Build Your Organization's Glossary
                </AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  We've identified {extractedTerms.length} business term{extractedTerms.length !== 1 ? 's' : ''} from your data product.
                  Taking 30 seconds to confirm these helps your entire team understand the data better.
                  These definitions will be searchable in DataHub and available to Copilot.
                </AlertDescription>
              </Alert>

              {extracting && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 animate-pulse mx-auto mb-2" />
                  Extracting business terms...
                </div>
              )}

              <div className="space-y-3">
                {extractedTerms.map((term) => (
                  <GlossaryTermConfirmation
                    key={term.text}
                    term={term}
                    onConfirm={handleConfirmTerm}
                    onSkip={() => handleSkipTerm(term.text)}
                    isConfirmed={confirmedTerms.has(term.text)}
                  />
                ))}
              </div>

              {confirmedTerms.size > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Great Work!</AlertTitle>
                  <AlertDescription className="text-green-800">
                    You've defined {confirmedTerms.size} term{confirmedTerms.size !== 1 ? 's' : ''}.
                    These will be pushed to DataHub and indexed for Copilot search when you deploy.
                  </AlertDescription>
                </Alert>
              )}
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Governance Validation Status */}
      {governance && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Governance & Security Status</h3>
          </div>

          {!validationComplete && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Pre-Deployment Validation Required</AlertTitle>
              <AlertDescription>
                Your data product will be validated against governance policies before deployment.
                This ensures compliance with {governance.compliance.frameworks.join(', ')} and security requirements.
              </AlertDescription>
            </Alert>
          )}

          {validationComplete && !hasCriticalViolations && (
            <Alert className="border-green-600 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Validation Passed</AlertTitle>
              <AlertDescription className="text-green-800">
                All governance policies validated successfully. {rangerPolicies.length} security policies will be deployed.
              </AlertDescription>
            </Alert>
          )}

          {validationComplete && hasCriticalViolations && (
            <Alert className="border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive">Critical Violations Detected</AlertTitle>
              <AlertDescription className="text-destructive">
                {violations.length} policy violation{violations.length !== 1 ? 's' : ''} must be resolved before deployment.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-1 text-destructive underline"
                  onClick={() => setShowViolationsDialog(true)}
                >
                  View details
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {validationComplete && warnings.length > 0 && !hasCriticalViolations && (
            <Alert className="border-yellow-600 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">Warnings ({warnings.length})</AlertTitle>
              <AlertDescription className="text-yellow-800">
                Some recommendations available.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-1 text-yellow-800 underline"
                  onClick={() => setShowViolationsDialog(true)}
                >
                  Review warnings
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {validationComplete && rangerPolicies.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Security Policies to be Created:</p>
              <div className="space-y-1">
                {rangerPolicies.slice(0, 3).map((policy: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    {policy.name}
                  </div>
                ))}
                {rangerPolicies.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    + {rangerPolicies.length - 3} more policies
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Policy Violations Dialog */}
      <PolicyViolationsDialog
        open={showViolationsDialog}
        onOpenChange={setShowViolationsDialog}
        violations={violations}
        warnings={warnings}
        canProceed={!hasCriticalViolations}
        onAcknowledge={() => {
          setShowViolationsDialog(false);
          if (!hasCriticalViolations) {
            onComplete({ deliveryOptions });
          }
        }}
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
          onClick={handleDeploy}
          disabled={!isValid || validating || hasCriticalViolations}
          size="lg"
          className="min-w-[200px] bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
        >
          {validating ? (
            <>
              <Shield className="mr-2 w-4 h-4 animate-spin" />
              Validating Policies...
            </>
          ) : governance && !validationComplete ? (
            <>
              <Shield className="mr-2 w-4 h-4" />
              Validate & Deploy
            </>
          ) : (
            <>
              <Rocket className="mr-2 w-4 h-4" />
              Deploy Data Product
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
