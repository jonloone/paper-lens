'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'business' | 'hybrid' | 'technical';

export interface PortalEntity {
  // Core naming
  businessName: string;
  technicalName: string;
  
  // Optional metadata
  type?: string;
  description?: string;
  owner?: string;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  
  // Business context
  purpose?: string;
  stakeholders?: string[];
  businessValue?: string;
  
  // System details
  system?: string;
  schedule?: string;
  lastModified?: Date;
}

interface PortalNameDisplayProps {
  entity: PortalEntity;
  viewMode?: ViewMode;
  variant?: 'inline' | 'card' | 'header' | 'compact';
  showCopy?: boolean;
  showType?: boolean;
  className?: string;
}

export function PortalNameDisplay({ 
  entity, 
  viewMode = 'hybrid',
  variant = 'inline',
  showCopy = true,
  showType = false,
  className
}: PortalNameDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(entity.technicalName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getDisplayNames = () => {
    switch (viewMode) {
      case 'business':
        return {
          primary: entity.businessName,
          secondary: null,
          showTechnical: false
        };
      case 'technical':
        return {
          primary: entity.technicalName,
          secondary: entity.businessName !== entity.technicalName ? entity.businessName : null,
          showTechnical: true
        };
      case 'hybrid':
      default:
        return {
          primary: entity.businessName,
          secondary: entity.technicalName,
          showTechnical: true
        };
    }
  };

  const { primary, secondary, showTechnical } = getDisplayNames();

  // Inline variant - for tables and lists
  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="font-medium">{primary}</span>
        {secondary && (
          <>
            <span className="text-muted-foreground">•</span>
            <code className="text-sm text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {secondary}
            </code>
          </>
        )}
        {showCopy && showTechnical && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
        {showType && entity.type && (
          <Badge variant="outline" className="text-xs">
            {entity.type}
          </Badge>
        )}
      </div>
    );
  }

  // Card variant - for detailed displays
  if (variant === 'card') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{primary}</h3>
            {secondary && showTechnical && (
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                  {secondary}
                </code>
                {showCopy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
          {entity.classification && (
            <Badge 
              variant="outline"
              className={cn(
                "text-xs",
                entity.classification === 'public' && "border-green-500 text-green-700",
                entity.classification === 'internal' && "border-blue-500 text-blue-700",
                entity.classification === 'confidential' && "border-yellow-500 text-yellow-700",
                entity.classification === 'restricted' && "border-red-500 text-red-700"
              )}
            >
              {entity.classification}
            </Badge>
          )}
        </div>
        
        {entity.description && (
          <p className="text-sm text-muted-foreground">{entity.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 text-xs">
          {entity.owner && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Owner:</span>
              <span>{entity.owner}</span>
            </div>
          )}
          {entity.system && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">System:</span>
              <span>{entity.system}</span>
            </div>
          )}
          {entity.schedule && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Schedule:</span>
              <span>{entity.schedule}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Header variant - for page titles
  if (variant === 'header') {
    return (
      <div className={cn("space-y-1", className)}>
        <h1 className="text-2xl">{primary}</h1>
        {secondary && showTechnical && (
          <div className="flex items-center gap-2">
            <code className="text-base text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
              {secondary}
            </code>
            {showCopy && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
        {entity.purpose && (
          <p className="text-muted-foreground">{entity.purpose}</p>
        )}
      </div>
    );
  }

  // Compact variant - for dense lists
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <span className="font-normal text-sm truncate">{primary}</span>
      {secondary && showTechnical && (
        <code className="text-xs text-muted-foreground bg-muted px-1 rounded truncate">
          {secondary}
        </code>
      )}
    </div>
  );
}