'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Zap,
  Box,
  FileText,
  Check
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
  when: string;
}

const productTypes: ProductType[] = [
  {
    id: 'source',
    icon: Zap,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    name: 'Foundation Product',
    when: 'Connecting to a data source'
  },
  {
    id: 'entity',
    icon: Box,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    name: 'Domain Product',
    when: 'Modeling a business entity'
  },
  {
    id: 'solution',
    icon: Sparkles,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    name: 'Solution Product',
    when: 'Solving a specific problem'
  }
];

function DefinePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [domain, setDomain] = useState('');

  // Type detection
  const urlInput = searchParams.get('input');
  const urlType = searchParams.get('type');
  const urlConfidence = searchParams.get('confidence');
  const urlReasoning = searchParams.get('reasoning');

  const [detectedType, setDetectedType] = useState<string | null>(urlType || null);
  const [confidence, setConfidence] = useState<number | null>(
    urlConfidence ? parseFloat(urlConfidence) : null
  );
  const [reasoning, setReasoning] = useState<string[]>([]);
  const [showTypeSelector, setShowTypeSelector] = useState(!urlType);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    // If we have type from API, use it directly
    if (urlInput && urlType) {
      setDetectedType(urlType);
      setDescription(urlInput);
      setShowTypeSelector(false);

      // Parse reasoning if available
      if (urlReasoning) {
        try {
          const parsedReasoning = JSON.parse(urlReasoning);
          setReasoning(Array.isArray(parsedReasoning) ? parsedReasoning : []);
        } catch (e) {
          console.error('Failed to parse reasoning:', e);
        }
      }
    }
  }, [urlInput, urlType, urlReasoning]);

  const handleTypeSelect = (typeId: string) => {
    setDetectedType(typeId);
    setShowTypeSelector(false);
  };

  const handleContinue = () => {
    const contract = {
      name,
      description,
      owner,
      domain,
      type: detectedType
    };

    const params = new URLSearchParams({
      contract: JSON.stringify(contract)
    });
    router.push(`/build/new/source?${params.toString()}`);
  };

  const selectedType = productTypes.find(t => t.id === detectedType);
  const Icon = selectedType?.icon;

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Progress Bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <div className="font-semibold">Define</div>
                <div className="text-sm text-muted-foreground">Step 1 of 4</div>
              </div>
            </div>
            {detectedType && (
              <Badge className="flex items-center gap-2">
                {Icon && <Icon className="w-3 h-3" />}
                {selectedType?.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-full h-2 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-muted'}`} />
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
            <h2 className="text-3xl font-bold">What are you building?</h2>
            <p className="text-muted-foreground text-lg mt-2">
              Define your data product with basic information
            </p>
          </div>

          {/* Type Detection/Selection */}
          {detecting && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div>
                  <div className="font-medium">Analyzing your request...</div>
                  <div className="text-sm text-muted-foreground">Understanding what type of product you need</div>
                </div>
              </div>
            </Card>
          )}

          {!detecting && detectedType && !showTypeSelector && (
            <Card className="p-6 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {Icon && (
                    <div className={`w-12 h-12 rounded-xl ${selectedType.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${selectedType.iconColor}`} />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{selectedType?.name}</div>
                      <Check className="w-4 h-4 text-green-600" />
                      {confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{selectedType?.when}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTypeSelector(true)}
                >
                  Change Type
                </Button>
              </div>
              {reasoning.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-2">AI Reasoning:</div>
                  <div className="space-y-1">
                    {reasoning.map((reason, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {showTypeSelector && (
            <div className="space-y-4">
              <Label>What type of data product?</Label>
              <div className="grid gap-3">
                {productTypes.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <Card
                      key={type.id}
                      className={`p-4 cursor-pointer transition-all ${
                        detectedType === type.id
                          ? 'border-2 border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleTypeSelect(type.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${type.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <TypeIcon className={`w-6 h-6 ${type.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{type.name}</div>
                          <div className="text-sm text-muted-foreground">{type.when}</div>
                        </div>
                        {detectedType === type.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contract Definition */}
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., customer_360, order_events, churn_score"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Use lowercase with underscores. This will be the table/API name.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this data product do? Who will use it?"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Owner *</Label>
                  <Input
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Team or individual"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g., sales, marketing, finance"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Type-Specific Fields */}
          {detectedType === 'source' && (
            <Card className="p-6 space-y-4 border-amber-200 bg-amber-50/30">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                Foundation Product Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source System</Label>
                  <Input placeholder="e.g., MySQL, Salesforce, Kafka" />
                </div>
                <div className="space-y-2">
                  <Label>Sync Frequency</Label>
                  <Input placeholder="e.g., Real-time, Hourly, Daily" />
                </div>
              </div>
            </Card>
          )}

          {detectedType === 'entity' && (
            <Card className="p-6 space-y-4 border-blue-200 bg-blue-50/30">
              <h3 className="font-semibold flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600" />
                Domain Product Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Input placeholder="e.g., Customer, Product, Order" />
                </div>
                <div className="space-y-2">
                  <Label>Key Attributes</Label>
                  <Input placeholder="e.g., email, customer_id" />
                </div>
              </div>
            </Card>
          )}

          {detectedType === 'solution' && (
            <Card className="p-6 space-y-4 border-green-200 bg-green-50/30">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                Solution Product Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Business Problem</Label>
                  <Textarea
                    placeholder="What problem does this solve? What decisions will it enable?"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Success Metrics</Label>
                  <Input placeholder="How will you measure success?" />
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push('/build')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!name || !description || !owner || !detectedType}
            >
              Continue to Source
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function DefinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DefinePageContent />
    </Suspense>
  );
}
