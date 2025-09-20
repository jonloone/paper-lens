'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Loader2,
  Search,
  Zap,
  Shield,
  Wrench,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { AgentSuggestionCard } from './AgentSuggestionCard';
import { AgentOrchestrationService } from '@/lib/services/AgentOrchestrationService';

export interface AgentSuggestion {
  id: string;
  type: 'optimization' | 'governance' | 'troubleshooting' | 'connection' | 'info';
  title: string;
  message: string;
  impact?: string;
  implementation?: string;
  confidence: number;
  agent: string;
  details?: string;
}

interface AgentAssistPanelProps {
  mode: 'query' | 'pipeline' | 'ingestion' | 'debug';
  context: any;
  onSuggestionApplied?: (suggestion: AgentSuggestion) => void;
}

export function AgentAssistPanel({ 
  mode, 
  context, 
  onSuggestionApplied 
}: AgentAssistPanelProps) {
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [orchestrator] = useState(() => new AgentOrchestrationService());

  // Analyze context in background when it changes
  useEffect(() => {
    const analyze = async () => {
      if (!context || Object.keys(context).length === 0) return;
      
      setIsAnalyzing(true);
      try {
        const newSuggestions = await orchestrator.analyzeContext(mode, context);
        setSuggestions(newSuggestions.filter(s => !dismissedIds.has(s.id)));
      } catch (error) {
        console.error('Agent analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Debounce analysis to avoid too many calls
    const timer = setTimeout(analyze, 1000);
    return () => clearTimeout(timer);
  }, [context, mode, dismissedIds]);

  const handleApplySuggestion = (suggestion: AgentSuggestion) => {
    // Apply the suggestion
    onSuggestionApplied?.(suggestion);
    
    // Remove from list
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismissSuggestion = (suggestion: AgentSuggestion) => {
    // Add to dismissed set
    setDismissedIds(prev => new Set([...prev, suggestion.id]));
    
    // Remove from list
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleTroubleshoot = async () => {
    setIsAnalyzing(true);
    try {
      const diagnosis = await orchestrator.troubleshootCurrent(context);
      if (diagnosis) {
        setSuggestions(prev => [{
          id: `troubleshoot-${Date.now()}`,
          type: 'troubleshooting',
          title: 'Issue Diagnosed',
          message: diagnosis.rootCause,
          implementation: diagnosis.fix,
          confidence: diagnosis.confidence,
          agent: 'troubleshooting',
          details: diagnosis.investigationSteps.join('\\n')
        }, ...prev]);
      }
    } catch (error) {
      console.error('Troubleshooting failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    setIsAnalyzing(true);
    try {
      const optimizations = await orchestrator.optimizeCurrent(context);
      setSuggestions(prev => [...optimizations, ...prev]);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddGovernance = async () => {
    setIsAnalyzing(true);
    try {
      const governanceItems = await orchestrator.addGovernance(context);
      setSuggestions(prev => [...governanceItems, ...prev]);
    } catch (error) {
      console.error('Governance analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'optimization': return <Zap className="h-4 w-4 text-orange-500" />;
      case 'governance': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'troubleshooting': return <Search className="h-4 w-4 text-red-500" />;
      case 'connection': return <Wrench className="h-4 w-4 text-green-500" />;
      default: return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`fixed right-0 top-16 bottom-0 w-96 bg-background border-l border-border transition-transform ${
      isMinimized ? 'translate-x-80' : 'translate-x-0'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Analyzing...</span>
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              <span className="text-sm font-medium">Agent Assistant</span>
            </>
          )}
          {suggestions.length > 0 && !isMinimized && (
            <Badge variant="secondary" className="text-xs">
              {suggestions.length} suggestions
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Minimized state */}
      {isMinimized && (
        <div className="absolute left-0 top-14 -translate-x-full bg-background border rounded-l-lg p-2">
          <div className="flex flex-col gap-2">
            <Bot className="h-5 w-5" />
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {suggestions.length}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!isMinimized && (
        <div className="flex flex-col h-full">
          {/* Suggestions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No suggestions at the moment</p>
                <p className="text-xs mt-2">
                  Agents are monitoring your work and will provide suggestions when needed
                </p>
              </div>
            ) : (
              suggestions.map(suggestion => (
                <AgentSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => handleApplySuggestion(suggestion)}
                  onDismiss={() => handleDismissSuggestion(suggestion)}
                />
              ))
            )}
          </div>

          {/* Manual Actions */}
          <div className="p-4 border-t space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Manual Actions</p>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={handleTroubleshoot}
              disabled={isAnalyzing}
            >
              <Search className="h-4 w-4 mr-2" />
              Troubleshoot Current Issue
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={handleOptimize}
              disabled={isAnalyzing}
            >
              <Zap className="h-4 w-4 mr-2" />
              Optimize Performance
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={handleAddGovernance}
              disabled={isAnalyzing}
            >
              <Shield className="h-4 w-4 mr-2" />
              Check Compliance
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              disabled={isAnalyzing}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Setup Connection
            </Button>
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-muted/50">
            <p className="text-xs text-center text-muted-foreground">
              Agents handle the bullshit, you keep control
            </p>
          </div>
        </div>
      )}
    </div>
  );
}