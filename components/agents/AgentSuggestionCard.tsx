'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Shield,
  Search,
  Wrench,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check
} from 'lucide-react';
import { AgentSuggestion } from './AgentAssistPanel';

interface AgentSuggestionCardProps {
  suggestion: AgentSuggestion;
  onApply: () => void;
  onDismiss: () => void;
}

export function AgentSuggestionCard({ 
  suggestion, 
  onApply, 
  onDismiss 
}: AgentSuggestionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showImplementation, setShowImplementation] = useState(false);
  const [copied, setCopied] = useState(false);

  const getIcon = () => {
    switch (suggestion.type) {
      case 'optimization':
        return <Zap className="h-5 w-5 text-orange-500" />;
      case 'governance':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'troubleshooting':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'connection':
        return <Wrench className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = () => {
    if (suggestion.confidence > 0.8) return 'text-red-600 dark:text-red-400';
    if (suggestion.confidence > 0.6) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const handleCopyImplementation = () => {
    if (suggestion.implementation) {
      navigator.clipboard.writeText(suggestion.implementation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`font-medium text-sm ${getSeverityColor()}`}>
                  {suggestion.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {suggestion.message}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={onDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Impact */}
            {suggestion.impact && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  Impact: {suggestion.impact}
                </Badge>
              </div>
            )}

            {/* Confidence */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="text-xs text-muted-foreground">Confidence:</div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 w-3 rounded-full ${
                        i <= Math.round(suggestion.confidence * 5)
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                by {suggestion.agent} agent
              </span>
            </div>

            {/* Implementation */}
            {suggestion.implementation && (
              <div className="mt-3">
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowImplementation(!showImplementation)}
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${
                    showImplementation ? 'rotate-180' : ''
                  }`} />
                  {showImplementation ? 'Hide' : 'Show'} implementation
                </button>
                
                {showImplementation && (
                  <div className="mt-2 relative">
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                      <code>{suggestion.implementation}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={handleCopyImplementation}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Details */}
            {suggestion.details && (
              <div className="mt-3">
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${
                    showDetails ? 'rotate-180' : ''
                  }`} />
                  How agent figured this out
                </button>
                
                {showDetails && (
                  <div className="mt-2 p-2 bg-muted/50 rounded">
                    <pre className="text-xs whitespace-pre-wrap">
                      {suggestion.details}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={onApply}
                className="flex-1"
              >
                Apply
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}