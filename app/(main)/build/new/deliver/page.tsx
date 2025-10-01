'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Zap,
  Box,
  Database,
  Cloud,
  Rocket,
  CheckCircle2,
  FileText,
  Activity
} from 'lucide-react';

const steps = [
  { id: 'define', name: 'Define', description: 'What are you building?' },
  { id: 'source', name: 'Source', description: 'Where is your data?' },
  { id: 'transform', name: 'Transform', description: 'Shape your data' },
  { id: 'deliver', name: 'Deliver', description: 'How to access' }
];

interface ProductType {
  id: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  name: string;
}

const productTypes: ProductType[] = [
  {
    id: 'source',
    icon: Zap,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    name: 'Foundation Product'
  },
  {
    id: 'entity',
    icon: Box,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    name: 'Domain Product'
  },
  {
    id: 'solution',
    icon: Sparkles,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    name: 'Solution Product'
  }
];

const deliveryOptions = {
  source: [
    { id: 'stream', name: 'Real-time Stream', icon: Activity, description: 'Kafka topic for event streaming' },
    { id: 'batch', name: 'Batch Table', icon: Database, description: 'Iceberg table for batch queries' }
  ],
  entity: [
    { id: 'sql', name: 'SQL Table', icon: Database, description: 'Queryable Iceberg table' },
    { id: 'api', name: 'REST API', icon: Cloud, description: 'RESTful API endpoints' }
  ],
  solution: [
    { id: 'api', name: 'API Endpoint', icon: Cloud, description: 'Production REST API' },
    { id: 'dashboard', name: 'Dashboard', icon: FileText, description: 'Interactive analytics dashboard' }
  ]
};

function DeliverPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const contractParam = searchParams.get('contract');
  const [contract, setContract] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deploymentComplete, setDeploymentComplete] = useState(false);

  useEffect(() => {
    if (contractParam) {
      try {
        const parsed = JSON.parse(contractParam);
        setContract(parsed);

        // Auto-select recommended delivery options
        if (parsed.type === 'source') {
          setSelectedOptions(['stream', 'batch']);
        } else if (parsed.type === 'entity') {
          setSelectedOptions(['sql']);
        } else if (parsed.type === 'solution') {
          setSelectedOptions(['api']);
        }
      } catch (error) {
        console.error('Failed to parse contract:', error);
      }
    }
  }, [contractParam]);

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No contract data found</p>
          <Button onClick={() => router.push('/build/new/define')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Define
          </Button>
        </div>
      </div>
    );
  }

  const selectedType = productTypes.find(t => t.id === contract.type);
  const Icon = selectedType?.icon;

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleDeploy = () => {
    setDeploying(true);
    setDeployProgress(0);

    const interval = setInterval(() => {
      setDeployProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDeploying(false);
            setDeploymentComplete(true);
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 800);
  };

  const productName = contract.name || 'data_product';

  const deploymentSteps = [
    { label: 'Validating configuration', done: deployProgress >= 20 },
    { label: 'Generating data pipelines', done: deployProgress >= 40 },
    { label: 'Creating Iceberg tables', done: deployProgress >= 60 },
    { label: 'Deploying to development', done: deployProgress >= 80 },
    { label: 'Setting up monitoring', done: deployProgress >= 100 }
  ];

  if (deploymentComplete) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Success Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold">Product Deployed!</h2>
            <p className="text-muted-foreground text-lg">
              <span className="text-foreground font-semibold font-mono">{productName}</span> is ready in development
            </p>
          </div>

          {/* Success Card */}
          <Card className="p-10 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Access Your Product</h3>
              <div className="space-y-2">
                <div className="text-sm font-mono bg-white px-4 py-3 rounded border">
                  SQL: iceberg.dev.{productName}
                </div>
                {selectedOptions.includes('api') && (
                  <div className="text-sm font-mono bg-white px-4 py-3 rounded border">
                    API: https://api.example.com/v1/{productName}
                  </div>
                )}
                {selectedOptions.includes('stream') && (
                  <div className="text-sm font-mono bg-white px-4 py-3 rounded border">
                    Kafka: {productName}-events
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-3">
                <h4 className="font-semibold">Next Steps:</h4>
                <div className="grid gap-3">
                  <Button size="lg" className="w-full justify-start gap-3">
                    <Activity className="w-5 h-5" />
                    View in Airflow - Monitor pipeline runs
                  </Button>
                  <Button variant="outline" size="lg" className="w-full justify-start gap-3">
                    <Database className="w-5 h-5" />
                    Test with Query - Try SQL queries
                  </Button>
                  <Button variant="outline" size="lg" className="w-full justify-start gap-3">
                    <FileText className="w-5 h-5" />
                    View Documentation - See DataHub catalog
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <Button onClick={() => router.push('/build')} className="bg-primary">
              Create Another
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>

        </div>
      </div>
    );
  }

  if (deploying) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Deployment Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 animate-pulse mb-4">
              <Rocket className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-4xl font-bold">Deploying Your Product</h2>
            <p className="text-muted-foreground text-lg">
              This usually takes 2-3 minutes • You can safely close this page
            </p>
          </div>

          {/* Progress Card */}
          <Card className="p-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-muted-foreground">{deployProgress}%</span>
                </div>
                <Progress value={deployProgress} className="h-3" />
              </div>

              <div className="space-y-4">
                {deploymentSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.done ? 'bg-green-500' : 'bg-muted'
                    }`}>
                      {step.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-sm ${
                      step.done ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <div className="font-semibold">Deliver</div>
                <div className="text-sm text-muted-foreground">Step 4 of 4</div>
              </div>
            </div>
            {selectedType && (
              <Badge className="flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />}
                {selectedType.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-full h-2 rounded-full bg-primary`} />
                  <div className="text-xs mt-2 text-center font-medium">
                    {step.name}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-muted mx-2" />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">

          <div>
            <h2 className="text-3xl font-bold">How to deliver?</h2>
            <p className="text-muted-foreground text-lg mt-2">
              Choose how consumers will access this data product
            </p>
          </div>

          {/* Delivery Options */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Delivery Methods</Label>
              <Badge variant="outline">
                {selectedOptions.length} selected
              </Badge>
            </div>

            <div className="grid gap-3">
              {deliveryOptions[contract.type as keyof typeof deliveryOptions].map((option) => {
                const OptionIcon = option.icon;
                const isSelected = selectedOptions.includes(option.id);
                return (
                  <Card
                    key={option.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleOption(option.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${
                          isSelected ? 'bg-primary' : 'bg-muted'
                        } flex items-center justify-center`}>
                          <OptionIcon className={`w-6 h-6 ${
                            isSelected ? 'text-white' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold">{option.name}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* Summary */}
          <Card className="p-6 bg-muted/30 space-y-4">
            <h3 className="font-semibold">Deployment Summary</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product Name:</span>
                <span className="font-mono">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span>{selectedType?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner:</span>
                <span>{contract.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Domain:</span>
                <span>{contract.domain || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery:</span>
                <span>{selectedOptions.length} method{selectedOptions.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push(`/build/new/transform?${new URLSearchParams({ contract: contractParam || '' })}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleDeploy}
              disabled={selectedOptions.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Deploy to Development
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function DeliverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DeliverPageContent />
    </Suspense>
  );
}
