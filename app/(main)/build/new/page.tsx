'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TechIcon } from '@/components/ui/tech-icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ArrowRight, AlertCircle, CheckCircle, ChevronRight,
  Clock, Code, Database, ExternalLink, FileText, GitBranch, 
  HelpCircle, Info, Layers, Lock, Shield, Sparkles, Users,
  Zap, Eye, BookOpen, Settings, TrendingUp, BarChart,
  Package, Search, Plus, Check, X, Loader2, RefreshCw,
  Building2, CreditCard, Globe, Heart, ShieldCheck,
  AlertTriangle, Gauge, TestTube, Activity, DollarSign, Rocket
} from 'lucide-react';

// Types for governance-first pipeline creation
interface BusinessPurpose {
  id: string;
  name: string;
  description: string;
  icon: any;
  requiredCompliance: string[];
  suggestedClassification: string;
  commonConsumers: string[];
}

interface DataClassification {
  level: string;
  name: string;
  description: string;
  color: string;
  icon: any;
  retention: string;
  encryption: string;
  accessControl: string;
}

interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  businessPurpose: string;
  complianceScore: number;
  successRate: number;
  usageCount: number;
  estimatedEffort: string;
  includedRules: string[];
  requiredTools: string[];
  classification: string;
}

interface BusinessRule {
  id: string;
  name: string;
  category: 'data_quality' | 'privacy' | 'business_logic';
  description: string;
  required: boolean;
  dbtMacro: string;
  usageCount: number;
  successRate: number;
}

interface QualityContract {
  freshness: 'real-time' | 'near-real-time' | 'business-hours' | 'daily' | 'custom';
  completeness: number;
  accuracy: string[];
  businessImpact: 'low' | 'medium' | 'high';
}

// Mock data
const businessPurposes: BusinessPurpose[] = [
  {
    id: 'customer-analytics',
    name: 'Customer Analytics',
    description: 'Internal customer behavior and segmentation analysis',
    icon: Users,
    requiredCompliance: ['GDPR', 'CCPA'],
    suggestedClassification: 'Internal',
    commonConsumers: ['Data Team', 'Business Analysts', 'Marketing']
  },
  {
    id: 'financial-reporting',
    name: 'Financial Reporting',
    description: 'Regulatory compliance and financial statements',
    icon: Building2,
    requiredCompliance: ['SOX', 'GAAP', 'SEC'],
    suggestedClassification: 'Confidential',
    commonConsumers: ['Finance', 'Executive Team', 'Auditors']
  },
  {
    id: 'marketing-insights',
    name: 'Marketing Insights',
    description: 'Campaign performance and customer engagement',
    icon: TrendingUp,
    requiredCompliance: ['GDPR', 'CAN-SPAM'],
    suggestedClassification: 'Internal',
    commonConsumers: ['Marketing', 'Business Analysts', 'External API']
  },
  {
    id: 'operational-metrics',
    name: 'Operational Metrics',
    description: 'Real-time monitoring and operational KPIs',
    icon: Activity,
    requiredCompliance: [],
    suggestedClassification: 'Public',
    commonConsumers: ['Operations', 'Data Team', 'Automated Systems']
  }
];

const classifications: DataClassification[] = [
  {
    level: 'public',
    name: 'Public',
    description: 'No restrictions, publicly available data',
    color: 'text-green-600',
    icon: Globe,
    retention: 'No limit',
    encryption: 'Not required',
    accessControl: 'All employees'
  },
  {
    level: 'internal',
    name: 'Internal',
    description: 'Company employees only',
    color: 'text-yellow-600',
    icon: Users,
    retention: '7 years',
    encryption: 'At rest',
    accessControl: 'Role-based'
  },
  {
    level: 'confidential',
    name: 'Confidential',
    description: 'Restricted access, business sensitive',
    color: 'text-orange-600',
    icon: Lock,
    retention: '7 years',
    encryption: 'At rest + transit',
    accessControl: 'Manager approval'
  },
  {
    level: 'highly-confidential',
    name: 'Highly Confidential',
    description: 'Executive approval required',
    color: 'text-red-600',
    icon: Shield,
    retention: '7 years + legal hold',
    encryption: 'End-to-end',
    accessControl: 'Executive approval'
  }
];

const templates: PipelineTemplate[] = [
  {
    id: 'customer-360',
    name: 'Customer 360 Pipeline',
    description: 'Unified customer view with behavioral insights',
    businessPurpose: 'customer-analytics',
    complianceScore: 98,
    successRate: 94,
    usageCount: 23,
    estimatedEffort: '4 hours',
    includedRules: ['Email validation', 'GDPR compliance', 'Deduplication', 'CLV calculation'],
    requiredTools: ['dbt', 'Airflow', 'DataHub'],
    classification: 'internal'
  },
  {
    id: 'customer-segmentation',
    name: 'Customer Segmentation Model',
    description: 'ML-based customer segmentation with privacy controls',
    businessPurpose: 'customer-analytics',
    complianceScore: 95,
    successRate: 87,
    usageCount: 12,
    estimatedEffort: '6 hours',
    includedRules: ['Statistical validation', 'Model governance', 'Privacy masking'],
    requiredTools: ['dbt', 'MLflow', 'DataHub'],
    classification: 'internal'
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Dashboard Pipeline',
    description: 'Real-time financial metrics with audit trails',
    businessPurpose: 'financial-reporting',
    complianceScore: 99,
    successRate: 96,
    usageCount: 15,
    estimatedEffort: '5 hours',
    includedRules: ['Financial validation', 'Audit logging', 'SOX compliance'],
    requiredTools: ['dbt', 'Airflow', 'Ranger'],
    classification: 'confidential'
  }
];

const businessRules: BusinessRule[] = [
  // Data Quality Rules
  {
    id: 'email-validation',
    name: 'Email Format Validation',
    category: 'data_quality',
    description: 'Validates email addresses against RFC 5322 standard',
    required: false,
    dbtMacro: 'validate_email_format',
    usageCount: 89,
    successRate: 98
  },
  {
    id: 'phone-validation',
    name: 'Phone Number Standardization',
    category: 'data_quality',
    description: 'Standardizes phone numbers to E.164 format',
    required: false,
    dbtMacro: 'standardize_phone_number',
    usageCount: 67,
    successRate: 95
  },
  {
    id: 'address-normalization',
    name: 'Address Normalization',
    category: 'data_quality',
    description: 'Normalizes addresses using USPS standards',
    required: false,
    dbtMacro: 'normalize_address',
    usageCount: 45,
    successRate: 92
  },
  // Privacy Rules
  {
    id: 'pii-masking',
    name: 'PII Detection and Masking',
    category: 'privacy',
    description: 'Automatically detects and masks personal information',
    required: true,
    dbtMacro: 'mask_pii',
    usageCount: 78,
    successRate: 99
  },
  {
    id: 'gdpr-compliance',
    name: 'GDPR Right to be Forgotten',
    category: 'privacy',
    description: 'Implements GDPR data deletion requirements',
    required: true,
    dbtMacro: 'apply_gdpr_deletion',
    usageCount: 56,
    successRate: 100
  },
  {
    id: 'data-retention',
    name: 'Data Retention Enforcement',
    category: 'privacy',
    description: 'Enforces organizational data retention policies',
    required: true,
    dbtMacro: 'enforce_retention_policy',
    usageCount: 92,
    successRate: 97
  },
  // Business Logic Rules
  {
    id: 'clv-calculation',
    name: 'Customer Lifetime Value',
    category: 'business_logic',
    description: 'Calculates CLV using historical transaction data',
    required: false,
    dbtMacro: 'calculate_clv',
    usageCount: 34,
    successRate: 91
  },
  {
    id: 'lead-scoring',
    name: 'Lead Scoring Algorithm',
    category: 'business_logic',
    description: 'Scores leads based on engagement and demographics',
    required: false,
    dbtMacro: 'calculate_lead_score',
    usageCount: 28,
    successRate: 88
  }
];

export default function NewPipelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPurpose, setSelectedPurpose] = useState<string>('');
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PipelineTemplate | null>(null);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [qualityContract, setQualityContract] = useState<QualityContract>({
    freshness: 'business-hours',
    completeness: 95,
    accuracy: [],
    businessImpact: 'medium'
  });
  const [isValidating, setIsValidating] = useState(false);

  const steps = [
    { number: 1, name: 'Business Context', icon: Building2 },
    { number: 2, name: 'Select Template', icon: Layers },
    { number: 3, name: 'Configure Rules', icon: Shield },
    { number: 4, name: 'Quality Contract', icon: CheckCircle },
    { number: 5, name: 'Review & Deploy', icon: Rocket }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (template: PipelineTemplate) => {
    setSelectedTemplate(template);
    // Pre-select included rules
    setSelectedRules(businessRules
      .filter(rule => template.includedRules.includes(rule.name))
      .map(rule => rule.id)
    );
  };

  const handleRuleToggle = (ruleId: string) => {
    setSelectedRules(prev =>
      prev.includes(ruleId)
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const validateGovernance = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
    }, 2000);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pipelines
            </Button>
            <h1 className="text-3xl font-light tracking-tight">Create New Pipeline</h1>
            <p className="text-muted-foreground mt-1">
              Build a compliant data pipeline with organizational governance built-in
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            
            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" :
                    isCompleted ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    "text-xs mt-2",
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-4",
                    isCompleted ? "bg-primary/20" : "bg-muted"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="min-h-[500px]">
          <CardContent className="p-6">
            {/* Step 1: Business Context */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Define Business Context</h2>
                  <p className="text-muted-foreground">
                    Understanding your business need helps us recommend the right governance and templates
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base mb-3">What is the business purpose?</Label>
                    <RadioGroup value={selectedPurpose} onValueChange={setSelectedPurpose}>
                      <div className="grid grid-cols-2 gap-4">
                        {businessPurposes.map(purpose => {
                          const Icon = purpose.icon;
                          return (
                            <div key={purpose.id} className="relative">
                              <RadioGroupItem
                                value={purpose.id}
                                id={purpose.id}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={purpose.id}
                                className={cn(
                                  "flex flex-col gap-3 rounded-lg border-2 p-4 hover:bg-accent cursor-pointer",
                                  "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                                  <div className="space-y-1">
                                    <div className="font-medium">{purpose.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {purpose.description}
                                    </div>
                                    {purpose.requiredCompliance.length > 0 && (
                                      <div className="flex gap-1 mt-2">
                                        {purpose.requiredCompliance.map(compliance => (
                                          <Badge key={compliance} variant="outline" className="text-xs">
                                            {compliance}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base mb-3">Expected Data Classification</Label>
                    <RadioGroup value={selectedClassification} onValueChange={setSelectedClassification}>
                      <div className="space-y-3">
                        {classifications.map(classification => {
                          const Icon = classification.icon;
                          return (
                            <div key={classification.level} className="relative">
                              <RadioGroupItem
                                value={classification.level}
                                id={classification.level}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={classification.level}
                                className={cn(
                                  "flex items-start gap-3 rounded-lg border p-3 hover:bg-accent cursor-pointer",
                                  "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                )}
                              >
                                <Icon className={cn("h-5 w-5 mt-0.5", classification.color)} />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{classification.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      ({classification.description})
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Retention: {classification.retention} • 
                                    Encryption: {classification.encryption} • 
                                    Access: {classification.accessControl}
                                  </div>
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base mb-3">Expected Consumers</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Data Team', 'Business Analysts', 'External API', 'Automated Systems', 'Executive Team', 'Marketing'].map(consumer => (
                        <div key={consumer} className="flex items-center space-x-2">
                          <Checkbox
                            id={consumer}
                            checked={selectedConsumers.includes(consumer)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedConsumers([...selectedConsumers, consumer]);
                              } else {
                                setSelectedConsumers(selectedConsumers.filter(c => c !== consumer));
                              }
                            }}
                          />
                          <Label
                            htmlFor={consumer}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {consumer}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Template Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Select a Template</h2>
                  <p className="text-muted-foreground">
                    Recommended templates based on your business context and governance requirements
                  </p>
                </div>

                <div className="space-y-4">
                  {templates
                    .filter(t => !selectedPurpose || t.businessPurpose === selectedPurpose)
                    .map(template => (
                      <div
                        key={template.id}
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all",
                          selectedTemplate?.id === template.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Layers className="h-5 w-5 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">{template.name}</h3>
                              <Badge variant="outline">
                                Used {template.usageCount} times
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{template.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <span className={cn("flex items-center gap-1", getComplianceColor(template.complianceScore))}>
                                <ShieldCheck className="h-4 w-4" />
                                Compliance: {template.complianceScore}%
                              </span>
                              <span className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-4 w-4" />
                                Success: {template.successRate}%
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {template.estimatedEffort}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Included rules:</span>
                                {template.includedRules.slice(0, 3).map(rule => (
                                  <Badge key={rule} variant="secondary" className="text-xs">
                                    {rule}
                                  </Badge>
                                ))}
                                {template.includedRules.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{template.includedRules.length - 3} more
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Required tools:</span>
                                {template.requiredTools.map(tool => (
                                  <Badge key={tool} variant="outline" className="text-xs">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                              size="sm"
                            >
                              {selectedTemplate?.id === template.id ? "Selected" : "Select"}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Step 3: Configure Business Rules */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Configure Business Rules</h2>
                  <p className="text-muted-foreground">
                    Select and configure the business rules that will be embedded in your pipeline
                  </p>
                </div>

                <Tabs defaultValue="data_quality">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="data_quality">
                      Data Quality ({businessRules.filter(r => r.category === 'data_quality').length})
                    </TabsTrigger>
                    <TabsTrigger value="privacy">
                      Privacy & Compliance ({businessRules.filter(r => r.category === 'privacy').length})
                    </TabsTrigger>
                    <TabsTrigger value="business_logic">
                      Business Logic ({businessRules.filter(r => r.category === 'business_logic').length})
                    </TabsTrigger>
                  </TabsList>

                  {['data_quality', 'privacy', 'business_logic'].map(category => (
                    <TabsContent key={category} value={category} className="space-y-3">
                      {businessRules
                        .filter(rule => rule.category === category)
                        .map(rule => (
                          <div
                            key={rule.id}
                            className={cn(
                              "border rounded-lg p-4",
                              selectedRules.includes(rule.id) && "border-primary bg-primary/5"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={rule.id}
                                  checked={selectedRules.includes(rule.id)}
                                  onCheckedChange={() => handleRuleToggle(rule.id)}
                                  disabled={rule.required}
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor={rule.id}
                                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                  >
                                    {rule.name}
                                    {rule.required && (
                                      <Badge variant="secondary" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>Used {rule.usageCount} times</span>
                                    <span>•</span>
                                    <span className="text-green-600">{rule.successRate}% success</span>
                                    <span>•</span>
                                    <code className="bg-muted px-1 rounded">{`{{ ${rule.dbtMacro}() }}`}</code>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  ))}
                </Tabs>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        {selectedRules.length} rules selected. These will be automatically embedded as dbt macros in your pipeline.
                      </span>
                      <Button variant="link" size="sm">
                        Preview Generated Code
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 4: Quality Contract */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Define Quality Contract</h2>
                  <p className="text-muted-foreground">
                    Set SLAs and quality requirements that will be automatically monitored
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-base mb-3">Data Freshness Requirements</Label>
                    <RadioGroup
                      value={qualityContract.freshness}
                      onValueChange={(value: any) => setQualityContract({...qualityContract, freshness: value})}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'real-time', label: 'Real-time', description: '< 5 minutes lag' },
                          { value: 'near-real-time', label: 'Near Real-time', description: '< 1 hour lag' },
                          { value: 'business-hours', label: 'Business Hours', description: '< 4 hours lag' },
                          { value: 'daily', label: 'Daily', description: '< 24 hours lag' }
                        ].map(option => (
                          <div key={option.value} className="relative">
                            <RadioGroupItem
                              value={option.value}
                              id={option.value}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={option.value}
                              className={cn(
                                "flex flex-col gap-1 rounded-lg border p-3 hover:bg-accent cursor-pointer",
                                "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              )}
                            >
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-muted-foreground">{option.description}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base mb-3">Data Completeness Requirements</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Label className="w-32 text-sm">Required fields:</Label>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="range"
                            min="80"
                            max="100"
                            value={qualityContract.completeness}
                            onChange={(e) => setQualityContract({...qualityContract, completeness: parseInt(e.target.value)})}
                            className="flex-1"
                          />
                          <span className="w-12 text-sm font-medium">{qualityContract.completeness}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-3">Data Accuracy Requirements</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        'Email addresses must be valid format',
                        'Phone numbers must be valid format',
                        'Addresses must be standardized',
                        'Dates must be in valid range',
                        'Numeric values must be within bounds',
                        'No duplicate records allowed'
                      ].map(requirement => (
                        <div key={requirement} className="flex items-center space-x-2">
                          <Checkbox
                            id={requirement}
                            checked={qualityContract.accuracy.includes(requirement)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setQualityContract({
                                  ...qualityContract,
                                  accuracy: [...qualityContract.accuracy, requirement]
                                });
                              } else {
                                setQualityContract({
                                  ...qualityContract,
                                  accuracy: qualityContract.accuracy.filter(r => r !== requirement)
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={requirement}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {requirement}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-3">Business Impact if SLA Breached</Label>
                    <RadioGroup
                      value={qualityContract.businessImpact}
                      onValueChange={(value: any) => setQualityContract({...qualityContract, businessImpact: value})}
                    >
                      <div className="space-y-2">
                        {[
                          { value: 'low', label: 'Low', description: '< $1K/hour impact', icon: DollarSign },
                          { value: 'medium', label: 'Medium', description: '$1K-$10K/hour impact', icon: DollarSign },
                          { value: 'high', label: 'High', description: '> $10K/hour impact', icon: AlertTriangle }
                        ].map(option => {
                          const Icon = option.icon;
                          return (
                            <div key={option.value} className="relative">
                              <RadioGroupItem
                                value={option.value}
                                id={`impact-${option.value}`}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={`impact-${option.value}`}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg border p-3 hover:bg-accent cursor-pointer",
                                  "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                )}
                              >
                                <Icon className={cn(
                                  "h-5 w-5",
                                  option.value === 'high' ? 'text-red-600' :
                                  option.value === 'medium' ? 'text-yellow-600' :
                                  'text-green-600'
                                )} />
                                <div>
                                  <span className="font-medium">{option.label}</span>
                                  <span className="text-sm text-muted-foreground ml-2">({option.description})</span>
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <Alert>
                  <TestTube className="h-4 w-4" />
                  <AlertDescription>
                    These SLAs will generate {qualityContract.accuracy.length + 3} dbt tests that run automatically with your pipeline.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 5: Review & Deploy */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Review & Deploy</h2>
                  <p className="text-muted-foreground">
                    Review your governance-compliant pipeline configuration before deployment
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Governance Validation */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Governance Validation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {isValidating ? (
                        <div className="flex items-center gap-2 py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Validating governance compliance...</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Data Classification: Matches "{selectedClassification}" requirement</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Privacy Compliance: GDPR rules applied correctly</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Access Controls: Role-based permissions configured</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">Data Retention: Manual review needed for 7-year rule</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Quality Tests: {qualityContract.accuracy.length + 3} validation tests will be created</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Estimated Compliance Score:</span>
                            <span className="text-lg font-semibold text-green-600">96/100</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Configuration Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Configuration Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Business Purpose:</span>
                          <p className="font-medium">{businessPurposes.find(p => p.id === selectedPurpose)?.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Classification:</span>
                          <p className="font-medium">{classifications.find(c => c.level === selectedClassification)?.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Template:</span>
                          <p className="font-medium">{selectedTemplate?.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Business Rules:</span>
                          <p className="font-medium">{selectedRules.length} rules configured</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Data Freshness:</span>
                          <p className="font-medium">{qualityContract.freshness.replace('-', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Business Impact:</span>
                          <p className="font-medium capitalize">{qualityContract.businessImpact}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={() => router.push('/build')}
                    >
                      <Rocket className="h-5 w-5 mr-2" />
                      Deploy Pipeline
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={validateGovernance}
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Validate Governance
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                    >
                      <Code className="h-5 w-5 mr-2" />
                      View dbt Code
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          <CardContent className="border-t pt-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!selectedPurpose || !selectedClassification || selectedConsumers.length === 0)) ||
                  (currentStep === 2 && !selectedTemplate) ||
                  (currentStep === 3 && selectedRules.length === 0)
                }
              >
                {currentStep === steps.length ? 'Complete' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}