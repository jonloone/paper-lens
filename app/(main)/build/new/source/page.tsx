'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Zap,
  Box,
  Database,
  Cloud,
  Activity,
  FileJson,
  Check,
  Plus
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

// Source options for Foundation Products
const sourceConnectors = [
  { id: 'mysql', name: 'MySQL', icon: Database, category: 'Database' },
  { id: 'postgres', name: 'PostgreSQL', icon: Database, category: 'Database' },
  { id: 'mongodb', name: 'MongoDB', icon: Database, category: 'Database' },
  { id: 'kafka', name: 'Apache Kafka', icon: Activity, category: 'Stream' },
  { id: 'rest', name: 'REST API', icon: Cloud, category: 'API' },
  { id: 'graphql', name: 'GraphQL', icon: Cloud, category: 'API' },
  { id: 's3', name: 'Amazon S3', icon: Cloud, category: 'Storage' },
  { id: 'json', name: 'JSON Files', icon: FileJson, category: 'File' }
];

// Mock foundation products for Domain/Solution
const mockFoundationProducts = [
  { id: 'orders', name: 'order_events', description: 'E-commerce order transactions', type: 'Stream' },
  { id: 'customers', name: 'customer_records', description: 'CRM customer data', type: 'Batch' },
  { id: 'inventory', name: 'inventory_levels', description: 'Real-time warehouse inventory', type: 'Stream' },
  { id: 'payments', name: 'payment_transactions', description: 'Payment processing events', type: 'Stream' }
];

function SourcePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse contract from URL
  const contractParam = searchParams.get('contract');
  const [contract, setContract] = useState<any>(null);

  // Foundation Product: Direct source selection
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [connectionString, setConnectionString] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('hourly');

  // Domain/Solution: Product selection
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (contractParam) {
      try {
        setContract(JSON.parse(contractParam));
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

  const handleContinue = () => {
    const updatedContract = {
      ...contract,
      source: contract.type === 'source'
        ? { connector: selectedConnector, connectionString, syncFrequency }
        : { products: selectedProducts }
    };

    const params = new URLSearchParams({
      contract: JSON.stringify(updatedContract)
    });
    router.push(`/build/new/transform?${params.toString()}`);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const isValid = contract.type === 'source'
    ? selectedConnector && connectionString
    : selectedProducts.length > 0;

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <div className="font-semibold">Source</div>
                <div className="text-sm text-muted-foreground">Step 2 of 4</div>
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
                  <div className={`w-full h-2 rounded-full ${
                    idx <= 1 ? 'bg-primary' : 'bg-muted'
                  }`} />
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
            <h2 className="text-3xl font-bold">Where is your data?</h2>
            <p className="text-muted-foreground text-lg mt-2">
              {contract.type === 'source' && 'Connect to your data source'}
              {contract.type === 'entity' && 'Select foundation products to build from'}
              {contract.type === 'solution' && 'Choose data products to compose'}
            </p>
          </div>

          {/* Foundation Product: Direct Source Connection */}
          {contract.type === 'source' && (
            <div className="space-y-6">

              <Card className="p-6 border-amber-200 bg-amber-50/30">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-600" />
                  Connect to Data Source
                </h3>

                <div className="space-y-6">

                  <div className="space-y-3">
                    <Label>Select Source Type</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {sourceConnectors.map((connector) => {
                        const ConnectorIcon = connector.icon;
                        const isSelected = selectedConnector === connector.id;
                        return (
                          <Card
                            key={connector.id}
                            className={`p-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-2 border-amber-600 bg-amber-50'
                                : 'hover:border-amber-300'
                            }`}
                            onClick={() => setSelectedConnector(connector.id)}
                          >
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className={`w-10 h-10 rounded-lg ${
                                isSelected ? 'bg-amber-600' : 'bg-amber-100'
                              } flex items-center justify-center`}>
                                <ConnectorIcon className={`w-5 h-5 ${
                                  isSelected ? 'text-white' : 'text-amber-600'
                                }`} />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{connector.name}</div>
                                <div className="text-xs text-muted-foreground">{connector.category}</div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-amber-600 absolute top-2 right-2" />
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {selectedConnector && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <Label>Connection Details</Label>
                        <Input
                          value={connectionString}
                          onChange={(e) => setConnectionString(e.target.value)}
                          placeholder={
                            selectedConnector === 'mysql' ? 'mysql://user:password@host:3306/database' :
                            selectedConnector === 'kafka' ? 'kafka://broker1:9092,broker2:9092' :
                            selectedConnector === 'rest' ? 'https://api.example.com/v1' :
                            'Connection string or endpoint'
                          }
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sync Frequency</Label>
                          <select
                            value={syncFrequency}
                            onChange={(e) => setSyncFrequency(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          >
                            <option value="realtime">Real-time (Stream)</option>
                            <option value="5min">Every 5 minutes</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Authentication</Label>
                          <Input placeholder="Credentials or API key" />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </Card>

            </div>
          )}

          {/* Domain Product: Select Foundation Products */}
          {contract.type === 'entity' && (
            <div className="space-y-6">

              <Card className="p-6 border-blue-200 bg-blue-50/30">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Box className="w-5 h-5 text-blue-600" />
                  Select Foundation Products
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose one or more foundation products to build your domain entity
                </p>

                <div className="grid gap-3">
                  {mockFoundationProducts.map((product) => {
                    const isSelected = selectedProducts.includes(product.id);
                    return (
                      <Card
                        key={product.id}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-2 border-blue-600 bg-blue-50'
                            : 'hover:border-blue-300'
                        }`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${
                              isSelected ? 'bg-blue-600' : 'bg-blue-100'
                            } flex items-center justify-center`}>
                              <Database className={`w-5 h-5 ${
                                isSelected ? 'text-white' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium font-mono text-sm">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">{product.type}</Badge>
                            {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">
                      {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      These will be joined and transformed to create your domain entity
                    </div>
                  </div>
                )}

              </Card>

            </div>
          )}

          {/* Solution Product: Compose from Existing Products */}
          {contract.type === 'solution' && (
            <div className="space-y-6">

              <Card className="p-6 border-green-200 bg-green-50/30">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Compose Data Products
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select existing data products to combine for your solution
                </p>

                <div className="grid gap-3">
                  {mockFoundationProducts.map((product) => {
                    const isSelected = selectedProducts.includes(product.id);
                    return (
                      <Card
                        key={product.id}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-2 border-green-600 bg-green-50'
                            : 'hover:border-green-300'
                        }`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${
                              isSelected ? 'bg-green-600' : 'bg-green-100'
                            } flex items-center justify-center`}>
                              <Database className={`w-5 h-5 ${
                                isSelected ? 'text-white' : 'text-green-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium font-mono text-sm">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">{product.type}</Badge>
                            {isSelected && <Check className="w-5 h-5 text-green-600" />}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-900">
                      {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      These products will be composed to solve your business problem
                    </div>
                  </div>
                )}

              </Card>

            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push(`/build/new/define?${new URLSearchParams({ contract: contractParam || '' })}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!isValid}
            >
              Continue to Transform
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function SourcePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SourcePageContent />
    </Suspense>
  );
}
