'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Users, Target, BookOpen, Lightbulb } from 'lucide-react';

interface GlossaryTerm {
  urn: string;
  name: string;
  definition: string;
  calculation?: string;
}

interface BusinessContextSectionProps {
  description: string;
  targetConsumers: string[];
  glossaryTerms: GlossaryTerm[];
  useCases: string[];
}

export function BusinessContextSection({
  description,
  targetConsumers,
  glossaryTerms,
  useCases
}: BusinessContextSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Take top 3 glossary terms for display
  const topGlossaryTerms = glossaryTerms.slice(0, 3);

  return (
    <div className="border-t pt-6 mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left mb-4 hover:opacity-80 transition-opacity"
      >
        <h2 className="text-lg font-semibold">Business Context</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-6">
          {/* What is this? */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">What is this?</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Who uses this? */}
          {targetConsumers && targetConsumers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Who uses this?</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {targetConsumers.map((consumer, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {consumer}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Key Business Concepts */}
          {topGlossaryTerms && topGlossaryTerms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Key Business Concepts</h3>
              </div>
              <div className="space-y-3">
                {topGlossaryTerms.map((term) => (
                  <div key={term.urn} className="pl-3 border-l-2 border-primary/20">
                    <div className="font-medium text-sm">{term.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {term.definition}
                    </div>
                    {term.calculation && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-2 rounded">
                        {term.calculation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Use Cases */}
          {useCases && useCases.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Common Use Cases</h3>
              </div>
              <ul className="space-y-2">
                {useCases.map((useCase, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
