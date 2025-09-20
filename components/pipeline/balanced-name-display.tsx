'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { NodeData } from './custom-nodes';

interface BalancedNameDisplayProps {
  data: NodeData;
  viewMode?: 'business' | 'hybrid' | 'technical';
  variant?: 'card' | 'compact' | 'expanded';
}

export function BalancedNameDisplay({ 
  data, 
  viewMode = 'hybrid', 
  variant = 'card' 
}: BalancedNameDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Determine what to show based on view mode
  const getDisplayNames = () => {
    const businessName = data.businessName || data.label;
    const technicalId = data.technicalId || data.label.toLowerCase().replace(/\s+/g, '_');

    switch (viewMode) {
      case 'business':
        return {
          primary: businessName,
          secondary: undefined,
          showTechnical: false
        };
      case 'technical':
        return {
          primary: technicalId,
          secondary: businessName !== technicalId ? businessName : undefined,
          showTechnical: true
        };
      case 'hybrid':
      default:
        return {
          primary: businessName,
          secondary: technicalId !== businessName ? technicalId : undefined,
          showTechnical: true
        };
    }
  };

  const { primary, secondary, showTechnical } = getDisplayNames();

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-normal text-sm truncate">{primary}</span>
        {secondary && (
          <code className="text-xs text-muted-foreground bg-muted px-1 rounded truncate">
            {secondary}
          </code>
        )}
      </div>
    );
  }

  if (variant === 'expanded') {
    return (
      <div className="space-y-2">
        {/* Primary name */}
        <div className="flex items-center justify-between">
          <h3 className="font-normal text-lg">{primary}</h3>
          {data.businessContext?.purpose && (
            <Badge variant="outline" className="text-xs">
              {data.businessContext.purpose}
            </Badge>
          )}
        </div>

        {/* Technical ID with copy */}
        {secondary && showTechnical && (
          <div className="flex items-center gap-2">
            <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
              {secondary}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => copyToClipboard(secondary, 'technicalId')}
            >
              {copiedField === 'technicalId' ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}

        {/* System details */}
        {data.systemDetails && (
          <div className="space-y-1">
            {data.systemDetails.outputTable && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Output:</span>
                <code className="text-xs bg-muted px-1 rounded">
                  {data.systemDetails.outputTable}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => copyToClipboard(data.systemDetails!.outputTable!, 'outputTable')}
                >
                  {copiedField === 'outputTable' ? (
                    <Check className="h-2.5 w-2.5 text-green-600" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                </Button>
              </div>
            )}
            
            {data.systemDetails.pipelineId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Pipeline:</span>
                <code className="text-xs bg-muted px-1 rounded">
                  {data.systemDetails.pipelineId}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => copyToClipboard(data.systemDetails!.pipelineId!, 'pipelineId')}
                >
                  {copiedField === 'pipelineId' ? (
                    <Check className="h-2.5 w-2.5 text-green-600" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                </Button>
              </div>
            )}

            {data.systemDetails.schedule && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Schedule:</span>
                <span className="text-xs">{data.systemDetails.schedule}</span>
              </div>
            )}
          </div>
        )}

        {/* Business context */}
        {data.businessContext && viewMode !== 'technical' && (
          <div className="space-y-1">
            {data.businessContext.stakeholders && data.businessContext.stakeholders.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Stakeholders:</span>
                <div className="flex gap-1">
                  {data.businessContext.stakeholders.map((stakeholder, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {stakeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {data.businessContext.businessValue && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Value:</span>
                <span className="text-xs">{data.businessContext.businessValue}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-normal text-base truncate">{primary}</span>
        {secondary && (
          <code className="text-xs text-muted-foreground font-mono truncate">
            {secondary}
          </code>
        )}
      </div>
      {secondary && showTechnical && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => copyToClipboard(secondary, 'technicalId')}
          title="Copy technical ID"
        >
          {copiedField === 'technicalId' ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}