'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Zap,
  Box,
  Sparkles,
  FileText,
  Lightbulb,
  ArrowRight,
  Database,
  TrendingUp
} from 'lucide-react';

interface QuickAction {
  id: string;
  icon: any;
  title: string;
  description: string;
  type: 'source' | 'entity' | 'solution' | 'template';
}

export default function BuildPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'source',
      icon: Zap,
      title: 'Connect New Source',
      description: 'Stream data from operational systems',
      type: 'source'
    },
    {
      id: 'entity',
      icon: Box,
      title: 'Model Business Entity',
      description: 'Define customers, products, orders',
      type: 'entity'
    },
    {
      id: 'solution',
      icon: Sparkles,
      title: 'Solve Specific Problem',
      description: 'Build analytics or predictions',
      type: 'solution'
    },
    {
      id: 'template',
      icon: FileText,
      title: 'Use Template',
      description: 'Start from proven patterns',
      type: 'template'
    }
  ];

  const examples = [
    'Connect to our MySQL e-commerce database',
    'Create a unified customer profile from CRM and orders',
    'Build a customer churn prediction model',
    'Track real-time inventory levels across warehouses'
  ];

  const handleStartBuilding = async () => {
    if (!input.trim()) {
      router.push('/build/new/define');
      return;
    }

    setIsAnalyzing(true);

    // Simulate AI classification (will integrate with backend later)
    setTimeout(() => {
      const params = new URLSearchParams({
        input: input,
        detected: 'auto'
      });
      router.push(`/build/new/define?${params.toString()}`);
    }, 1500);
  };

  const handleQuickAction = (type: string) => {
    const params = new URLSearchParams({
      type: type
    });
    router.push(`/build/new/define?${params.toString()}`);
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
            <Rocket className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">
              Build a Data Product
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              One intelligent workflow that adapts to what you're building
            </p>
          </div>
        </div>

        {/* Primary Input */}
        <Card className="p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Describe what you want to build</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tell us in plain language, or skip ahead with quick actions below
            </p>
          </div>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: I need to connect our Salesforce data and combine it with transaction history to analyze customer lifetime value..."
            className="min-h-[120px] text-base resize-none"
            disabled={isAnalyzing}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Our AI will understand your intent and guide you through the right steps
            </div>
            <Button
              size="lg"
              onClick={handleStartBuilding}
              disabled={isAnalyzing}
              className="min-w-[160px]"
            >
              {isAnalyzing ? (
                <>Analyzing...</>
              ) : (
                <>
                  Start Building
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Or choose a quick start</h3>
            <Badge variant="outline" className="text-xs">
              Same process, different starting points
            </Badge>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.id}
                  className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
                  onClick={() => handleQuickAction(action.type)}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Example requests:</h3>
          <div className="grid gap-2">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setInput(example)}
                className="text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-sm"
              >
                <span className="text-muted-foreground">"{example}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Footer */}
        <Card className="p-6 bg-muted/30">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">127</div>
              <div className="text-xs text-muted-foreground mt-1">Active Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4</div>
              <div className="text-xs text-muted-foreground mt-1">Unified Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">~45m</div>
              <div className="text-xs text-muted-foreground mt-1">Average Build Time</div>
            </div>
          </div>
        </Card>

        {/* Process Preview */}
        <Card className="p-6 border-primary/20">
          <div className="flex items-start gap-4">
            <Database className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold">How it works</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our unified build process adapts to what you're creating. Whether you're connecting a
                new data source, modeling a business entity, or solving a complex problem, you'll follow
                the same four steps: <strong>Define</strong> what you're building, <strong>Source</strong> your data,
                <strong>Transform</strong> it, and choose how to <strong>Deliver</strong> it. The system intelligently
                adjusts each step based on your needs.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs">
                  <span className="font-medium">Define</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs">
                  <span className="font-medium">Source</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs">
                  <span className="font-medium">Transform</span>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs">
                  <span className="font-medium">Deliver</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
