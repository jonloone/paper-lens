'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Code, 
  Database, 
  Search, 
  Settings, 
  Zap,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ReActStep, ReActResponse } from '@/lib/services/CrewAIService';

interface ReActActionViewerProps {
  response: ReActResponse;
  onActionReplay?: (step: ReActStep, index: number) => void;
  showTimeline?: boolean;
  compactMode?: boolean;
}

export const ReActActionViewer: React.FC<ReActActionViewerProps> = ({
  response,
  onActionReplay,
  showTimeline = true,
  compactMode = false
}) => {
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set());
  const [selectedAction, setSelectedAction] = useState<number | null>(null);

  const actions = response.reasoning_trace?.filter(step => step.type === 'action') || [];
  const observations = response.reasoning_trace?.filter(step => step.type === 'observation') || [];

  const toggleAction = (index: number) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedActions(newExpanded);
  };

  const getActionIcon = (actionContent: string) => {
    const content = actionContent.toLowerCase();
    if (content.includes('sql') || content.includes('query')) {
      return <Database className="w-4 h-4 text-blue-500" />;
    }
    if (content.includes('search') || content.includes('find')) {
      return <Search className="w-4 h-4 text-green-500" />;
    }
    if (content.includes('validate') || content.includes('check')) {
      return <CheckCircle2 className="w-4 h-4 text-orange-500" />;
    }
    if (content.includes('optimize') || content.includes('improve')) {
      return <Settings className="w-4 h-4 text-purple-500" />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getActionType = (actionContent: string): string => {
    const content = actionContent.toLowerCase();
    if (content.includes('sql') || content.includes('query')) return 'SQL Generation';
    if (content.includes('search') || content.includes('find')) return 'Schema Discovery';
    if (content.includes('validate') || content.includes('check')) return 'Validation';
    if (content.includes('optimize') || content.includes('improve')) return 'Optimization';
    if (content.includes('test') || content.includes('execute')) return 'Testing';
    return 'Action';
  };

  const getObservationForAction = (actionIndex: number): ReActStep | null => {
    const actionStep = actions[actionIndex];
    if (!actionStep) return null;
    
    // Find the observation that comes after this action
    const allSteps = response.reasoning_trace || [];
    const actionStepIndex = allSteps.findIndex(step => step === actionStep);
    
    for (let i = actionStepIndex + 1; i < allSteps.length; i++) {
      if (allSteps[i].type === 'observation') {
        return allSteps[i];
      }
    }
    return null;
  };

  const formatDuration = (start: string, end: string): string => {
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      const duration = endTime - startTime;
      
      if (duration < 1000) return `${duration}ms`;
      if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
      return `${(duration / 60000).toFixed(1)}m`;
    } catch {
      return 'N/A';
    }
  };

  if (actions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Action Timeline
            <Badge variant="outline">No actions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No actions were taken during this reasoning process.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Action Timeline
              <Badge variant="secondary">{actions.length} actions</Badge>
            </div>
            {!compactMode && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {response.pattern}
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {actions.map((action, index) => {
              const isExpanded = expandedActions.has(index);
              const observation = getObservationForAction(index);
              const isSelected = selectedAction === index;
              
              return (
                <div 
                  key={index}
                  className={`border rounded-lg transition-all duration-200 ${
                    isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => {
                      toggleAction(index);
                      setSelectedAction(isSelected ? null : index);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-full ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          {getActionIcon(action.content)}
                        </div>
                        {showTimeline && index < actions.length - 1 && (
                          <div className="w-px h-8 bg-gray-200"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" className="text-xs">
                            {getActionType(action.content)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Step {index + 1}
                          </Badge>
                          {action.tool_used && (
                            <Badge variant="secondary" className="text-xs">
                              <Code className="w-3 h-3 mr-1" />
                              {action.tool_used}
                            </Badge>
                          )}
                          <div className="ml-auto">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-sm text-gray-700 ${!isExpanded && !compactMode ? 'line-clamp-2' : ''}`}>
                          {action.content}
                        </p>
                        
                        {!compactMode && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </div>
                            {observation && (
                              <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {formatDuration(action.timestamp, observation.timestamp)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && observation && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <CheckCircle2 className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Observation
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Result
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {observation.content}
                          </p>
                          
                          {onActionReplay && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onActionReplay(action, index);
                                }}
                                className="text-xs"
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Replay Action
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {!compactMode && response.performance && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500">Estimated Time</div>
                  <div className="text-sm font-medium">
                    {response.performance.estimated_time_ms}ms
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Complexity</div>
                  <div className="text-sm font-medium">
                    {response.performance.complexity_score}/10
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Actions</div>
                  <div className="text-sm font-medium">
                    {actions.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReActActionViewer;