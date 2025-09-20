'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Play, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertCircle,
  Zap,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import { ReActStep, ReActResponse } from '@/lib/services/CrewAIService';

interface ReActProgressTrackerProps {
  response?: ReActResponse;
  isActive?: boolean;
  currentStep?: ReActStep;
  totalSteps?: number;
  currentStepIndex?: number;
  estimatedTimeMs?: number;
  onCancel?: () => void;
  onPause?: () => void;
  showDetailedProgress?: boolean;
}

export const ReActProgressTracker: React.FC<ReActProgressTrackerProps> = ({
  response,
  isActive = false,
  currentStep,
  totalSteps = 0,
  currentStepIndex = 0,
  estimatedTimeMs = 0,
  onCancel,
  onPause,
  showDetailedProgress = true
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const getStepIcon = (type?: ReActStep['type'], isActive?: boolean) => {
    const iconClass = `w-4 h-4 ${isActive ? 'animate-pulse' : ''}`;
    
    switch (type) {
      case 'thought':
        return <Brain className={`${iconClass} text-blue-500`} />;
      case 'action':
        return <Play className={`${iconClass} text-green-500`} />;
      case 'observation':
        return <Eye className={`${iconClass} text-purple-500`} />;
      default:
        return <Activity className={`${iconClass} text-gray-400`} />;
    }
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getProgressPercentage = (): number => {
    if (!isActive && response) {
      return 100;
    }
    if (totalSteps === 0) return 0;
    return Math.min((currentStepIndex / totalSteps) * 100, 95); // Cap at 95% until complete
  };

  const getEstimatedCompletion = (): string => {
    if (!isActive || !estimatedTimeMs || currentStepIndex === 0) {
      return 'Calculating...';
    }
    
    const averageTimePerStep = elapsedTime / currentStepIndex;
    const remainingSteps = totalSteps - currentStepIndex;
    const estimatedRemainingTime = remainingSteps * averageTimePerStep;
    
    return formatTime(estimatedRemainingTime);
  };

  const getStepTypeStats = (): { thoughts: number; actions: number; observations: number } => {
    if (!response?.reasoning_trace) {
      return { thoughts: 0, actions: 0, observations: 0 };
    }
    
    return response.reasoning_trace.reduce(
      (acc, step) => {
        acc[step.type === 'thought' ? 'thoughts' : step.type === 'action' ? 'actions' : 'observations']++;
        return acc;
      },
      { thoughts: 0, actions: 0, observations: 0 }
    );
  };

  const stepStats = getStepTypeStats();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isActive ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            ) : response ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Clock className="w-5 h-5 text-gray-400" />
            )}
            ReAct Progress
            {isActive ? (
              <Badge variant="default" className="animate-pulse">
                Processing...
              </Badge>
            ) : response ? (
              <Badge variant="secondary">
                Completed
              </Badge>
            ) : (
              <Badge variant="outline">
                Ready
              </Badge>
            )}
          </div>
          
          {isActive && (onCancel || onPause) && (
            <div className="flex items-center gap-2">
              {onPause && (
                <Button variant="outline" size="sm" onClick={onPause}>
                  Pause
                </Button>
              )}
              {onCancel && (
                <Button variant="destructive" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {isActive ? 'Processing' : response ? 'Completed' : 'Ready'}
              </span>
              <span className="font-medium">
                {getProgressPercentage().toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={getProgressPercentage()} 
              className="h-2"
            />
          </div>

          {/* Current Step Info */}
          {(isActive && currentStep) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStepIcon(currentStep.type, true)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {currentStep.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Step {currentStepIndex + 1} of {totalSteps}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {currentStep.content}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500">Elapsed Time</div>
              <div className="text-sm font-medium">
                {formatTime(elapsedTime)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500">Est. Remaining</div>
              <div className="text-sm font-medium">
                {isActive ? getEstimatedCompletion() : '0s'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500">Steps</div>
              <div className="text-sm font-medium">
                {response ? response.reasoning_trace.length : currentStepIndex} 
                {totalSteps > 0 && ` / ${totalSteps}`}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500">Pattern</div>
              <div className="text-sm font-medium">
                {response?.pattern || 'ReAct'}
              </div>
            </div>
          </div>

          {/* Detailed Progress (when completed) */}
          {showDetailedProgress && response && (
            <div className="space-y-3">
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Step Breakdown
                </h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Brain className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-medium">Thoughts</span>
                    </div>
                    <div className="text-sm font-semibold text-blue-700">
                      {stepStats.thoughts}
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Play className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-medium">Actions</span>
                    </div>
                    <div className="text-sm font-semibold text-green-700">
                      {stepStats.actions}
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="w-3 h-3 text-purple-500" />
                      <span className="text-xs font-medium">Observations</span>
                    </div>
                    <div className="text-sm font-semibold text-purple-700">
                      {stepStats.observations}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              {response.performance && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Performance
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Complexity Score</div>
                      <div className="text-sm font-medium">
                        {response.performance.complexity_score}/10
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Estimated Time</div>
                      <div className="text-sm font-medium">
                        {response.performance.estimated_time_ms}ms
                      </div>
                    </div>
                  </div>
                  
                  {response.performance.recommendations && response.performance.recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Recommendations</div>
                      <div className="space-y-1">
                        {response.performance.recommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-start gap-1">
                            <Target className="w-3 h-3 mt-0.5 text-gray-400" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Warning for long-running processes */}
          {isActive && elapsedTime > 30000 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-700">
                This process is taking longer than expected. Complex reasoning tasks may require additional time.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReActProgressTracker;