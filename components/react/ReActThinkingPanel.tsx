'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Eye, 
  Play, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Zap,
  CheckCircle2,
  Circle,
  Target
} from 'lucide-react';
import { ReActStep, ReActResponse } from '@/lib/services/CrewAIService';

interface ReActThinkingPanelProps {
  response: ReActResponse;
  isLoading?: boolean;
  showDetails?: boolean;
  onStepClick?: (step: ReActStep, index: number) => void;
}

export const ReActThinkingPanel: React.FC<ReActThinkingPanelProps> = ({
  response,
  isLoading = false,
  showDetails = true,
  onStepClick
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showAllSteps, setShowAllSteps] = useState(false);

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (type: ReActStep['type']) => {
    switch (type) {
      case 'thought':
        return <Brain className="w-4 h-4 text-blue-500" />;
      case 'action':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'observation':
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepColor = (type: ReActStep['type']) => {
    switch (type) {
      case 'thought':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'action':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'observation':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  const displaySteps = showAllSteps 
    ? response.reasoning_trace 
    : response.reasoning_trace.slice(0, 5);

  const hiddenStepsCount = response.reasoning_trace.length - displaySteps.length;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 animate-pulse" />
            ReAct Reasoning
            <Badge variant="secondary" className="animate-pulse">
              Thinking...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response.reasoning_trace || response.reasoning_trace.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ReAct Reasoning
            <Badge variant="outline">No trace available</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No reasoning trace was provided for this response.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            ReAct Reasoning
            <Badge variant="secondary">{response.pattern}</Badge>
            <Badge variant="outline">
              {response.reasoning_trace.length} steps
            </Badge>
          </div>
          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllSteps(!showAllSteps)}
              className="text-xs"
            >
              {showAllSteps ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displaySteps.map((step, index) => {
            const isExpanded = expandedSteps.has(index);
            const actualIndex = showAllSteps ? index : index; // Maintain original index
            
            return (
              <div 
                key={actualIndex}
                className={`border rounded-lg p-3 transition-all duration-200 hover:shadow-sm cursor-pointer ${getStepColor(step.type)}`}
                onClick={() => {
                  toggleStep(actualIndex);
                  onStepClick?.(step, actualIndex);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 mt-0.5">
                    {getStepIcon(step.type)}
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {step.type}
                      </Badge>
                      {step.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {(step.confidence * 100).toFixed(0)}% confident
                        </Badge>
                      )}
                      {step.tool_used && (
                        <Badge variant="default" className="text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          {step.tool_used}
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`text-sm ${isExpanded ? '' : 'line-clamp-2'} leading-relaxed`}>
                      {step.content}
                    </p>
                    
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                        <div className="flex items-center gap-4 text-xs opacity-70">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(step.timestamp)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Step {actualIndex + 1}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {hiddenStepsCount > 0 && !showAllSteps && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllSteps(true)}
              className="w-full text-xs text-gray-500 hover:text-gray-700"
            >
              Show {hiddenStepsCount} more steps...
            </Button>
          )}
        </div>
        
        {showDetails && response.timestamp && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Analysis completed
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(response.timestamp)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReActThinkingPanel;