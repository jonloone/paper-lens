'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { QualityRulesBuilder } from '@/components/build/QualityRulesBuilder';
import { ArrowRight, ArrowLeft, Shield, Clock, Lock, FileCheck, ChevronDown, ChevronRight } from 'lucide-react';
import type { GovernanceConfig } from '@/lib/schemas/odcs-contract';

export interface QualityRule {
  id: string;
  field: string;
  type: string;
  condition: string;
  value: string;
  severity: 'error' | 'warning';
}

export interface SLAConfig {
  freshnessTarget: string;
  freshnessUnit: 'minutes' | 'hours' | 'days';
  completenessThreshold: number;
  accuracyThreshold: number;
}

export interface Step4Data {
  qualityRules: QualityRule[];
  slaConfig: SLAConfig;
  governance?: GovernanceConfig;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
}

interface Step4QualityProps {
  initialData?: Partial<Step4Data>;
  schema: Array<{ name: string; type: string }>; // From Step 3
  onComplete: (data: Step4Data) => void;
  onBack: () => void;
}

export function Step4Quality({ initialData, schema, onComplete, onBack }: Step4QualityProps) {
  const [qualityRules, setQualityRules] = useState<QualityRule[]>(
    initialData?.qualityRules || []
  );
  const [slaConfig, setSLAConfig] = useState<SLAConfig>(
    initialData?.slaConfig || {
      freshnessTarget: '24',
      freshnessUnit: 'hours',
      completenessThreshold: 95,
      accuracyThreshold: 99
    }
  );

  const [showGovernance, setShowGovernance] = useState(false);
  const [dataClassification, setDataClassification] = useState<'public' | 'internal' | 'confidential' | 'restricted'>(
    initialData?.dataClassification || 'internal'
  );
  const [governance, setGovernance] = useState<GovernanceConfig>(
    initialData?.governance || {
      security: {
        encryption_required: false,
        pii_fields: [],
      },
      compliance: {
        frameworks: [],
        requires_approval: false,
        audit_required: false,
      },
      access_control: {
        default_policy: 'deny',
        allowed_groups: [],
      },
    }
  );

  const handleContinue = () => {
    onComplete({
      qualityRules,
      slaConfig,
      dataClassification,
      governance: showGovernance ? governance : undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          How do you want to check data quality?
        </h2>
        <p className="text-muted-foreground text-lg">
          Set up automatic checks to make sure your data stays accurate and up-to-date
        </p>
      </div>

      {/* SLA Configuration */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Data Freshness & Quality Targets</h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Freshness */}
          <div className="space-y-2">
            <Label>How fresh should the data be?</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={slaConfig.freshnessTarget}
                onChange={(e) => setSLAConfig({
                  ...slaConfig,
                  freshnessTarget: e.target.value
                })}
                className="w-24"
              />
              <Select
                value={slaConfig.freshnessUnit}
                onValueChange={(value: any) => setSLAConfig({
                  ...slaConfig,
                  freshnessUnit: value
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
            <p className="text-xs text-muted-foreground">
              Data older than this will trigger an alert
            </p>
          </div>

          {/* Completeness */}
          <div className="space-y-2">
            <Label>How complete should the data be?</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={slaConfig.completenessThreshold}
                onChange={(e) => setSLAConfig({
                  ...slaConfig,
                  completenessThreshold: Number(e.target.value)
                })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum % of rows with all required data filled in
            </p>
          </div>

          {/* Accuracy */}
          <div className="space-y-2">
            <Label>What's the acceptable quality level?</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={slaConfig.accuracyThreshold}
                onChange={(e) => setSLAConfig({
                  ...slaConfig,
                  accuracyThreshold: Number(e.target.value)
                })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum % of data that must pass validation checks
            </p>
          </div>
        </div>
      </Card>

      {/* Quality Rules */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Validation Checks</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add specific checks to validate your data (optional)
            </p>
          </div>
        </div>
        <QualityRulesBuilder
          rules={qualityRules}
          onChange={setQualityRules}
          availableFields={schema.map(f => f.name)}
        />
      </Card>

      {/* Data Governance */}
      <Card className="p-6">
        <button
          onClick={() => setShowGovernance(!showGovernance)}
          className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Data Governance & Security</h3>
          </div>
          {showGovernance ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {showGovernance && (
          <div className="space-y-6 pt-4 border-t">
            {/* Data Classification */}
            <div className="space-y-2">
              <Label>Data Classification Level</Label>
              <Select
                value={dataClassification}
                onValueChange={(value: any) => setDataClassification(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Unrestricted access</SelectItem>
                  <SelectItem value="internal">Internal - Company employees only</SelectItem>
                  <SelectItem value="confidential">Confidential - Need-to-know basis</SelectItem>
                  <SelectItem value="restricted">Restricted - Highly sensitive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Determines default access controls and encryption requirements
              </p>
            </div>

            {/* Security Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Settings
              </h4>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="encryption"
                  checked={governance.security.encryption_required}
                  onCheckedChange={(checked) =>
                    setGovernance({
                      ...governance,
                      security: {
                        ...governance.security,
                        encryption_required: checked as boolean,
                      },
                    })
                  }
                />
                <label htmlFor="encryption" className="text-sm cursor-pointer">
                  Require encryption at rest
                </label>
              </div>

              <div className="space-y-2">
                <Label>PII/Sensitive Fields (Select fields containing personal data)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {schema.map((field) => (
                    <div key={field.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`pii-${field.name}`}
                        checked={governance.security.pii_fields.includes(field.name)}
                        onCheckedChange={(checked) => {
                          const newPiiFields = checked
                            ? [...governance.security.pii_fields, field.name]
                            : governance.security.pii_fields.filter((f) => f !== field.name);
                          setGovernance({
                            ...governance,
                            security: {
                              ...governance.security,
                              pii_fields: newPiiFields,
                            },
                          });
                        }}
                      />
                      <label htmlFor={`pii-${field.name}`} className="text-sm cursor-pointer">
                        {field.name} ({field.type})
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  These fields will be automatically masked for unauthorized users
                </p>
              </div>

              <div className="space-y-2">
                <Label>Data Retention (days)</Label>
                <Input
                  type="number"
                  min="0"
                  value={governance.security.retention_days || ''}
                  onChange={(e) =>
                    setGovernance({
                      ...governance,
                      security: {
                        ...governance.security,
                        retention_days: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  placeholder="365"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Data older than this will be automatically archived or deleted
                </p>
              </div>
            </div>

            {/* Compliance Frameworks */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Compliance Requirements
              </h4>

              <div className="space-y-2">
                <Label>Applicable Frameworks (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['GDPR', 'HIPAA', 'SOC2', 'PCI-DSS', 'CCPA'] as const).map((framework) => (
                    <div key={framework} className="flex items-center space-x-2">
                      <Checkbox
                        id={`framework-${framework}`}
                        checked={governance.compliance.frameworks.includes(framework)}
                        onCheckedChange={(checked) => {
                          const newFrameworks = checked
                            ? [...governance.compliance.frameworks, framework]
                            : governance.compliance.frameworks.filter((f) => f !== framework);
                          setGovernance({
                            ...governance,
                            compliance: {
                              ...governance.compliance,
                              frameworks: newFrameworks,
                            },
                          });
                        }}
                      />
                      <label htmlFor={`framework-${framework}`} className="text-sm cursor-pointer">
                        {framework}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="approval"
                  checked={governance.compliance.requires_approval}
                  onCheckedChange={(checked) =>
                    setGovernance({
                      ...governance,
                      compliance: {
                        ...governance.compliance,
                        requires_approval: checked as boolean,
                      },
                    })
                  }
                />
                <label htmlFor="approval" className="text-sm cursor-pointer">
                  Require manual approval before deployment
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="audit"
                  checked={governance.compliance.audit_required}
                  onCheckedChange={(checked) =>
                    setGovernance({
                      ...governance,
                      compliance: {
                        ...governance.compliance,
                        audit_required: checked as boolean,
                      },
                    })
                  }
                />
                <label htmlFor="audit" className="text-sm cursor-pointer">
                  Enable comprehensive audit logging
                </label>
              </div>
            </div>

            {/* Access Control */}
            <div className="space-y-4">
              <h4 className="font-medium">Access Control</h4>

              <div className="space-y-2">
                <Label>Default Access Policy</Label>
                <Select
                  value={governance.access_control.default_policy}
                  onValueChange={(value: 'deny' | 'allow') =>
                    setGovernance({
                      ...governance,
                      access_control: {
                        ...governance.access_control,
                        default_policy: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deny">Deny by default (recommended)</SelectItem>
                    <SelectItem value="allow">Allow by default</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Allowed Groups (comma-separated)</Label>
                <Input
                  placeholder="data-engineers, analysts, data-science"
                  value={governance.access_control.allowed_groups.join(', ')}
                  onChange={(e) =>
                    setGovernance({
                      ...governance,
                      access_control: {
                        ...governance.access_control,
                        allowed_groups: e.target.value.split(',').map((g) => g.trim()).filter(Boolean),
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  User groups that will have access to this data product
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Columns
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="min-w-[200px]"
        >
          Next: Deploy
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
