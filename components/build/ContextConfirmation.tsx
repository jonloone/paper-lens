'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  TrendingUp,
  Users,
  Calendar,
  Target,
  ArrowRight
} from 'lucide-react';

interface ExtractedContext {
  business_need?: string;
  stakeholder?: string;
  deadline?: string;
  quality_requirements?: any;
  similar_contracts?: any[];
  domain_patterns?: any[];
  confidence?: number;
  kag_confidence?: number;
  namespace?: string;
  inferred_schema?: any[];
  delivery_method?: string;
  original_input?: string;
}

interface ContextConfirmationProps {
  context: ExtractedContext;
  onContinue?: (confirmed: ExtractedContext) => void;
}

export function ContextConfirmation({ context, onContinue }: ContextConfirmationProps) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<ExtractedContext>(context);
  const [editing, setEditing] = useState<string | null>(null);

  const handleContinue = () => {
    if (onContinue) {
      onContinue(confirmed);
    } else {
      // Proceed to source selection with confirmed context
      const params = new URLSearchParams({
        context: JSON.stringify(confirmed)
      });
      router.push(`/build/sources?${params.toString()}`);
    }
  };

  const confidenceColor = (conf: number) => {
    if (conf >= 0.85) return 'text-green-600 bg-green-50 border-green-200';
    if (conf >= 0.70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const confidenceLabel = (conf: number) => {
    if (conf >= 0.85) return 'High Confidence';
    if (conf >= 0.70) return 'Medium Confidence';
    return 'Review Required';
  };

  const confidence = context.kag_confidence || context.confidence || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Confirm Context</h1>
          <p className="text-muted-foreground mt-1">
            Review and refine the extracted information before building
          </p>
        </div>
        <Badge className={`${confidenceColor(confidence)} px-4 py-2 text-sm`}>
          {Math.round(confidence * 100)}% {confidenceLabel(confidence)}
        </Badge>
      </div>

      {/* Main Context Card */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Business Context</h2>
        </div>

        {/* Business Need */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            What they need
          </Label>
          <Input
            value={confirmed.business_need || ''}
            onChange={(e) => setConfirmed({ ...confirmed, business_need: e.target.value })}
            className="text-base"
            placeholder="Describe the business need..."
          />
        </div>

        {/* Stakeholder */}
        {context.stakeholder && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Stakeholder
            </Label>
            <Input
              value={confirmed.stakeholder || ''}
              onChange={(e) => setConfirmed({ ...confirmed, stakeholder: e.target.value })}
              className="text-base"
            />
          </div>
        )}

        {/* Deadline */}
        {context.deadline && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Deadline
            </Label>
            <Input
              value={confirmed.deadline || ''}
              onChange={(e) => setConfirmed({ ...confirmed, deadline: e.target.value })}
              className="text-base"
              type="text"
            />
          </div>
        )}

        {/* Quality Requirements */}
        {context.quality_requirements && Object.keys(context.quality_requirements).length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              Quality Requirements
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(context.quality_requirements).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm capitalize">{key}:</span>
                  <span className="text-sm font-mono font-medium">{JSON.stringify(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Similar Projects from KAG */}
      {context.similar_contracts && context.similar_contracts.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Similar Projects Found</h2>
            <Badge variant="secondary" className="ml-auto">
              {context.similar_contracts.length} matches
            </Badge>
          </div>

          <div className="space-y-3">
            {context.similar_contracts.slice(0, 3).map((contract: any, idx: number) => (
              <Card
                key={idx}
                className="p-4 hover:border-primary transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {contract.name || `Project ${idx + 1}`}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {contract.description || 'No description'}
                    </p>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    {Math.round((contract.similarity || 0) * 100)}% match
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3 pt-3 border-t">
                  <span>Built by: {contract.owner || 'Unknown'}</span>
                  <span>•</span>
                  <span>Success: {contract.success_rate || 'N/A'}%</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-8"
                    onClick={() => {
                      // TODO: Copy approach
                      alert('Copying approach from: ' + contract.name);
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy This Approach
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Domain Patterns */}
      {context.domain_patterns && context.domain_patterns.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Recommended Patterns</h2>
          </div>

          <div className="space-y-2">
            {context.domain_patterns.slice(0, 5).map((pattern: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{pattern.name || `Pattern ${idx + 1}`}</div>
                  <div className="text-sm text-muted-foreground">
                    {pattern.description || 'No description'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    // TODO: Apply pattern
                    alert('Applying pattern: ' + pattern.name);
                  }}
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Original Input Reference */}
      {context.original_input && (
        <Card className="p-4 bg-muted/50 border-muted">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View Original Request
            </summary>
            <p className="text-sm text-muted-foreground mt-2 pl-6 whitespace-pre-wrap">
              {context.original_input}
            </p>
          </details>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="lg"
          className="w-32"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="flex-1 h-12"
        >
          Continue with Selected Approach
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Info Box */}
      {confidence < 0.85 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-900">Review Recommended</p>
              <p className="text-sm text-yellow-800">
                Some extracted information has lower confidence. Please review and correct
                before continuing.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
