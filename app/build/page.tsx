'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Hammer, Database, Wrench, Layers, Play,
  CheckCircle, XCircle, AlertCircle, Clock,
  Brain, Bot, Sparkles, ArrowRight, RefreshCw,
  Code, FileCode, GitBranch, Terminal, Zap,
  DollarSign, Shield, AlertTriangle, Package,
  Settings, Eye, Download, Upload, Copy
} from 'lucide-react';
import { crewAIService } from '@/lib/services/CrewAIService';

// Types for the three-column workflow
interface ProjectRequirements {
  name: string;
  description: string;
  businessPurpose: string;
  dataSources: string[];
  expectedVolume: string;
  freshnessRequirements: string;
  targetAudience: string;
  performanceNeeds: string;
  qualityThresholds: string;
  successCriteria: string;
}

interface ArchitectureOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedCost: string;
  estimatedTime: string;
  recommendationScore: number;
  reasoning: string;
}

interface GeneratedCode {
  type: 'dbt' | 'airflow' | 'sql' | 'api';
  name: string;
  code: string;
  language: string;
  validated: boolean;
}

export default function BuildDeployPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'studio';
  
  // State for three-column workflow
  const [currentStep, setCurrentStep] = useState(1);
  const [requirements, setRequirements] = useState<Partial<ProjectRequirements>>({});
  const [selectedArchitecture, setSelectedArchitecture] = useState<ArchitectureOption | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode[]>([]);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Mock architecture options
  const [architectureOptions] = useState<ArchitectureOption[]>([
    {
      id: 'opt-1',
      name: 'Batch ELT Pipeline',
      description: 'Traditional batch processing with dbt transformations',
      pros: ['Proven reliability', 'Cost effective', 'Easy maintenance'],
      cons: ['Higher latency', 'Not real-time capable'],
      estimatedCost: '$500/month',
      estimatedTime: '2 weeks',
      recommendationScore: 85,
      reasoning: 'Best fit for your daily reporting requirements with moderate data volume'
    },
    {
      id: 'opt-2',
      name: 'Stream Processing',
      description: 'Real-time processing with Kafka and Spark Streaming',
      pros: ['Real-time insights', 'Scalable', 'Low latency'],
      cons: ['Higher complexity', 'More expensive', 'Requires expertise'],
      estimatedCost: '$2000/month',
      estimatedTime: '4 weeks',
      recommendationScore: 65,
      reasoning: 'Consider if real-time requirements become critical'
    },
    {
      id: 'opt-3',
      name: 'Hybrid Lambda Architecture',
      description: 'Combines batch and stream processing for flexibility',
      pros: ['Best of both worlds', 'Flexible', 'Future-proof'],
      cons: ['Most complex', 'Highest cost', 'Maintenance overhead'],
      estimatedCost: '$3000/month',
      estimatedTime: '6 weeks',
      recommendationScore: 70,
      reasoning: 'Recommended if you need both historical and real-time views'
    }
  ]);

  const handleRequirementChange = (field: keyof ProjectRequirements, value: string) => {
    setRequirements(prev => ({ ...prev, [field]: value }));
  };

  const validateRequirements = async () => {
    setIsAnalyzing(true);
    // Simulate AI validation
    setTimeout(() => {
      setIsAnalyzing(false);
      setCurrentStep(2);
    }, 2000);
  };

  const selectArchitecture = (option: ArchitectureOption) => {
    setSelectedArchitecture(option);
    generateImplementation(option);
  };

  const generateImplementation = async (architecture: ArchitectureOption) => {
    // Simulate code generation
    const mockCode: GeneratedCode[] = [
      {
        type: 'dbt',
        name: 'models/staging/stg_customers.sql',
        code: `-- Staging model for customer data
WITH source AS (
    SELECT * FROM {{ source('raw', 'customers') }}
),

renamed AS (
    SELECT
        id AS customer_id,
        email,
        name,
        created_at,
        updated_at
    FROM source
)

SELECT * FROM renamed`,
        language: 'sql',
        validated: true
      },
      {
        type: 'airflow',
        name: 'dags/customer_pipeline.py',
        code: `from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'retries': 2,
    'retry_delay': timedelta(minutes=5)
}

with DAG(
    'customer_pipeline',
    default_args=default_args,
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
    catchup=False
) as dag:
    
    extract = BashOperator(
        task_id='extract_data',
        bash_command='python /opt/airflow/scripts/extract.py'
    )
    
    transform = BashOperator(
        task_id='run_dbt',
        bash_command='dbt run --models staging'
    )
    
    extract >> transform`,
        language: 'python',
        validated: true
      }
    ];
    
    setGeneratedCode(mockCode);
    setCurrentStep(3);
  };

  const runTests = async () => {
    setIsAnalyzing(true);
    // Simulate testing
    setTimeout(() => {
      setValidationResults({
        passed: 8,
        failed: 1,
        warnings: 2,
        coverage: 87
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="container mx-auto py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Hammer className="w-8 h-8" />
          Build & Deploy
        </h1>
        <p className="text-muted-foreground mt-1">
          Create data products efficiently using proven patterns
        </p>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="studio">Pipeline Studio</TabsTrigger>
          <TabsTrigger value="query">Query Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="deploy">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="studio" className="space-y-6">
          {/* Progress Indicator */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Requirements</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Architecture</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      currentStep >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      3
                    </div>
                    <span className="text-sm font-medium">Implementation</span>
                  </div>
                </div>
                <Badge variant="outline">
                  Step {currentStep} of 3
                </Badge>
              </div>
              <Progress value={currentStep * 33.33} className="h-2" />
            </CardContent>
          </Card>

          {/* Three-Column Progressive Workflow */}
          <div className="grid grid-cols-12 gap-6">
            {/* Column 1: Intent & Requirements (30%) */}
            <div className="col-span-12 lg:col-span-4">
              <Card className={currentStep === 1 ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="w-5 h-5" />
                    Intent & Requirements
                  </CardTitle>
                  <CardDescription>
                    Define what you want to build
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Customer Analytics Pipeline"
                          value={requirements.name || ''}
                          onChange={(e) => handleRequirementChange('name', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="What does this pipeline do?"
                          value={requirements.description || ''}
                          onChange={(e) => handleRequirementChange('description', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="purpose">Business Purpose</Label>
                        <Textarea
                          id="purpose"
                          placeholder="Why is this needed? What problem does it solve?"
                          value={requirements.businessPurpose || ''}
                          onChange={(e) => handleRequirementChange('businessPurpose', e.target.value)}
                        />
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="sources">Data Sources</Label>
                        <Input
                          id="sources"
                          placeholder="e.g., Salesforce, PostgreSQL, S3"
                          value={requirements.dataSources?.join(', ') || ''}
                          onChange={(e) => handleRequirementChange('dataSources', e.target.value.split(', '))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="volume">Expected Volume</Label>
                        <Input
                          id="volume"
                          placeholder="e.g., 1M records/day"
                          value={requirements.expectedVolume || ''}
                          onChange={(e) => handleRequirementChange('expectedVolume', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="freshness">Freshness Requirements</Label>
                        <Input
                          id="freshness"
                          placeholder="e.g., Real-time, Hourly, Daily"
                          value={requirements.freshnessRequirements || ''}
                          onChange={(e) => handleRequirementChange('freshnessRequirements', e.target.value)}
                        />
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="audience">Target Audience</Label>
                        <Input
                          id="audience"
                          placeholder="Who will use this data?"
                          value={requirements.targetAudience || ''}
                          onChange={(e) => handleRequirementChange('targetAudience', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="performance">Performance Needs</Label>
                        <Input
                          id="performance"
                          placeholder="e.g., <5s query response"
                          value={requirements.performanceNeeds || ''}
                          onChange={(e) => handleRequirementChange('performanceNeeds', e.target.value)}
                        />
                      </div>

                      <div className="pt-4">
                        {currentStep === 1 && (
                          <>
                            <Alert className="mb-4">
                              <Brain className="w-4 h-4" />
                              <AlertDescription>
                                AI will validate completeness and suggest improvements
                              </AlertDescription>
                            </Alert>
                            <Button 
                              className="w-full"
                              onClick={validateRequirements}
                              disabled={!requirements.name || !requirements.description || isAnalyzing}
                            >
                              {isAnalyzing ? (
                                <>
                                  <Bot className="w-4 h-4 mr-2 animate-pulse" />
                                  Validating Requirements...
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  Validate & Continue
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        
                        {currentStep > 1 && (
                          <Alert>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <AlertDescription>
                              Requirements validated and complete
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Column 2: Architecture & Design (40%) */}
            <div className="col-span-12 lg:col-span-5">
              <Card className={currentStep === 2 ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Architecture & Design
                  </CardTitle>
                  <CardDescription>
                    Choose the best technical approach
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {currentStep < 2 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Complete requirements first</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Alert>
                          <Sparkles className="w-4 h-4" />
                          <AlertDescription>
                            <strong>AI Analysis Complete:</strong> Evaluated 3 architecture options based on your requirements
                          </AlertDescription>
                        </Alert>

                        {architectureOptions.map((option) => (
                          <Card 
                            key={option.id}
                            className={`cursor-pointer transition-all ${
                              selectedArchitecture?.id === option.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                            }`}
                            onClick={() => selectArchitecture(option)}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-base">{option.name}</CardTitle>
                                  <CardDescription>{option.description}</CardDescription>
                                </div>
                                <Badge variant={option.recommendationScore > 80 ? 'default' : 'secondary'}>
                                  {option.recommendationScore}% Match
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-green-600 mb-1">Pros</p>
                                  <ul className="text-xs space-y-1">
                                    {option.pros.map((pro, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                                        {pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-red-600 mb-1">Cons</p>
                                  <ul className="text-xs space-y-1">
                                    {option.cons.map((con, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <XCircle className="w-3 h-3 text-red-500 mt-0.5" />
                                        {con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                                  <span>{option.estimatedCost}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span>{option.estimatedTime}</span>
                                </div>
                              </div>
                              
                              <Alert>
                                <Bot className="w-3 h-3" />
                                <AlertDescription className="text-xs">
                                  <strong>AI Reasoning:</strong> {option.reasoning}
                                </AlertDescription>
                              </Alert>
                            </CardContent>
                          </Card>
                        ))}

                        {selectedArchitecture && (
                          <Button className="w-full" onClick={() => setCurrentStep(3)}>
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Generate Implementation
                          </Button>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Column 3: Implementation & Testing (30%) */}
            <div className="col-span-12 lg:col-span-3">
              <Card className={currentStep === 3 ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Implementation
                  </CardTitle>
                  <CardDescription>
                    Generated code and testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {currentStep < 3 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select architecture first</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Alert>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <AlertDescription>
                            Generated {generatedCode.length} configuration files
                          </AlertDescription>
                        </Alert>

                        {generatedCode.map((code, idx) => (
                          <Card key={idx}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileCode className="w-4 h-4" />
                                  <span className="text-sm font-medium">{code.name}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {code.type}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-muted rounded p-2 text-xs font-mono overflow-x-auto">
                                <pre className="whitespace-pre">
                                  {code.code.split('\n').slice(0, 10).join('\n')}
                                  {code.code.split('\n').length > 10 && '\n...'}
                                </pre>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        <Separator />

                        {/* Testing Section */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Testing & Validation</h4>
                          
                          {!validationResults ? (
                            <Button 
                              className="w-full"
                              onClick={runTests}
                              disabled={isAnalyzing}
                            >
                              {isAnalyzing ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Running Tests...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Run Tests
                                </>
                              )}
                            </Button>
                          ) : (
                            <Card>
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-green-600">Passed</span>
                                    <span className="font-medium">{validationResults.passed}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-red-600">Failed</span>
                                    <span className="font-medium">{validationResults.failed}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-yellow-600">Warnings</span>
                                    <span className="font-medium">{validationResults.warnings}</span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between text-sm">
                                    <span>Coverage</span>
                                    <span className="font-medium">{validationResults.coverage}%</span>
                                  </div>
                                  <Progress value={validationResults.coverage} className="h-2" />
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {validationResults && (
                            <>
                              <Alert>
                                <Shield className="w-4 h-4" />
                                <AlertDescription>
                                  Security scan: No vulnerabilities detected
                                </AlertDescription>
                              </Alert>

                              <div className="space-y-2">
                                <Button className="w-full">
                                  <Play className="w-4 h-4 mr-2" />
                                  Deploy to Staging
                                </Button>
                                <Button variant="outline" className="w-full">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Files
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Query Builder
              </CardTitle>
              <CardDescription>
                Natural language to SQL with optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Brain className="w-4 h-4" />
                <AlertDescription>
                  Describe what data you need in plain English, and AI will generate optimized SQL
                </AlertDescription>
              </Alert>
              {/* Query builder interface will go here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Templates</CardTitle>
              <CardDescription>
                Reusable patterns for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Templates gallery will go here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Management</CardTitle>
              <CardDescription>
                Deploy and manage your pipelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Deployment interface will go here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}