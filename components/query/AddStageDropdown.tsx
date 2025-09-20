'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StageOption } from './QueryPipelineBuilder';

interface AddStageDropdownProps {
  availableStages: Record<string, {
    name: string;
    description: string;
    icon: string;
    options: StageOption[];
  }>;
  onAddStage: (type: string, option: StageOption) => void;
}

export const AddStageDropdown: React.FC<AddStageDropdownProps> = ({
  availableStages,
  onAddStage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const handleStageSelect = (type: string, option: StageOption) => {
    onAddStage(type, option);
    setIsOpen(false);
    setExpandedType(null);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="border-dashed gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="h-4 w-4" />
        Add Stage
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsOpen(false);
              setExpandedType(null);
            }}
          />
          
          {/* Dropdown Menu */}
          <Card className="absolute top-full left-0 mt-2 w-[400px] p-2 z-50 shadow-lg border-border">
            {Object.entries(availableStages).map(([key, stage]) => (
              <div key={key} className="mb-1">
                <button
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors",
                    "hover:bg-muted/50",
                    expandedType === key && "bg-muted"
                  )}
                  onClick={() => setExpandedType(expandedType === key ? null : key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{stage.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{stage.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {stage.description}
                        </div>
                      </div>
                    </div>
                    {expandedType === key ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {expandedType === key && (
                  <div className="ml-9 mt-2 space-y-1">
                    {stage.options.map((option, idx) => (
                      <button
                        key={idx}
                        className={cn(
                          "w-full text-left p-3 rounded-md",
                          "hover:bg-primary/5 hover:border-primary/20",
                          "border border-transparent transition-colors"
                        )}
                        onClick={() => handleStageSelect(key, option)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{option.name}</span>
                              {option.source && (
                                <Badge variant="outline" className="text-xs">
                                  {option.source}
                                </Badge>
                              )}
                            </div>
                            {option.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {option.description}
                              </p>
                            )}
                            {option.template && (
                              <code className="text-xs text-green-600 font-mono mt-1 block">
                                {option.template.length > 50 
                                  ? option.template.substring(0, 50) + '...'
                                  : option.template
                                }
                              </code>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* Custom option for each type */}
                    <button
                      className={cn(
                        "w-full text-left p-3 rounded-md",
                        "hover:bg-primary/5 hover:border-primary/20",
                        "border border-dashed border-muted-foreground/20"
                      )}
                      onClick={() => handleStageSelect(key, {
                        name: `Custom ${stage.name.replace('Add ', '')}`,
                        template: '',
                        description: 'Write your own SQL'
                      })}
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        <span className="text-sm">Custom {stage.name.replace('Add ', '')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Write your own SQL expression
                      </p>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
};