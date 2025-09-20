'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Database,
  Settings,
  RefreshCw
} from 'lucide-react';

import { ReActThinkingPanel } from './ReActThinkingPanel';
import { ReActActionViewer } from './ReActActionViewer';
import { ReActProgressTracker } from './ReActProgressTracker';
import { 
  crewAIService, 
  ReActResponse, 
  ReActSQLRequest, 
  ReActOptimizationRequest 
} from '@/lib/services/CrewAIService';

export const ReActDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ReActResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  
  // Form states
  const [naturalLanguage, setNaturalLanguage] = useState(
    'Show me the top 5 customers by total order value from the last 6 months'
  );
  const [sqlQuery, setSqlQuery] = useState(
    'SELECT * FROM iceberg.production.customers WHERE customer_id IN (SELECT customer_id FROM iceberg.production.orders)'
  );
  
  const handleSQLGeneration = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const request: ReActSQLRequest = {
        natural_language: naturalLanguage,
        target_databases: ['production'],
        dialect: 'trino',
        context: {
          business_goal: 'Customer analysis for Q4 campaign'
        }
      };
      
      const result = await crewAIService.generateSQLWithReAct(request);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SQL');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSQLOptimization = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const request: ReActOptimizationRequest = {
        sql: sqlQuery,
        context: {
          performance_goal: 'Reduce execution time',
          data_size: 'large'
        }
      };
      
      const result = await crewAIService.optimizeQueryWithReAct(request);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize SQL');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSQLValidation = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const result = await crewAIService.validateSQLWithReAct({
        sql: sqlQuery,
        context: {
          dialect: 'trino',
          validate_syntax: true,
          check_performance: true
        }
      });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate SQL');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStepClick = (step: any, index: number) => {
    console.log('Step clicked:', { step, index });
  };
  
  const handleActionReplay = (step: any, index: number) => {
    console.log('Action replay:', { step, index });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-blue-500" />
          ReAct Framework Demo
        </h1>
        <p className="text-gray-600">
          Experience Reasoning and Acting pattern for intelligent SQL generation
        </p>
        <Badge variant="secondary" className="text-sm">
          <Sparkles className="w-4 h-4 mr-1" />
          Powered by CrewAI + Arbitron
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              ReAct Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="generate">Generate</TabsTrigger>
                <TabsTrigger value="optimize">Optimize</TabsTrigger>
                <TabsTrigger value="validate">Validate</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Natural Language Query
                  </label>
                  <Textarea
                    value={naturalLanguage}
                    onChange={(e) => setNaturalLanguage(e.target.value)}
                    placeholder="Describe what SQL query you need..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleSQLGeneration} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Generate SQL with ReAct
                </Button>
              </TabsContent>
              
              <TabsContent value="optimize" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    SQL Query to Optimize
                  </label>
                  <Textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter SQL query to optimize..."
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleSQLOptimization} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Optimize with ReAct
                </Button>
              </TabsContent>
              
              <TabsContent value="validate" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    SQL Query to Validate
                  </label>
                  <Textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter SQL query to validate..."
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleSQLValidation} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Validate with ReAct
                </Button>
              </TabsContent>
            </Tabs>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Generated SQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            {response?.sql ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border rounded-lg">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {response.sql}
                  </pre>
                </div>
                
                {response.validation && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {response.validation.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        Validation: {response.validation.valid ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    
                    {response.validation.warnings.length > 0 && (
                      <div className="text-xs text-orange-600">
                        Warnings: {response.validation.warnings.join(', ')}
                      </div>
                    )}
                    
                    {response.validation.suggestions.length > 0 && (
                      <div className="text-xs text-blue-600">
                        Suggestions: {response.validation.suggestions.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-500">Processing with ReAct...</span>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select an action above to see ReAct in action
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ReAct Components Demo */}
      {(response || isLoading) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Progress Tracker */}
          <div className="xl:col-span-1">
            <ReActProgressTracker
              response={response || undefined}
              isActive={isLoading}
              currentStepIndex={isLoading ? 2 : 0}
              totalSteps={isLoading ? 8 : 0}
              estimatedTimeMs={isLoading ? 15000 : 0}
              showDetailedProgress={true}
            />
          </div>
          
          {/* Thinking Panel */}
          <div className="xl:col-span-2">
            {response ? (
              <ReActThinkingPanel
                response={response}
                isLoading={false}
                showDetails={true}
                onStepClick={handleStepClick}
              />
            ) : (
              <ReActThinkingPanel
                response={{
                  success: true,
                  reasoning_trace: [],
                  pattern: 'ReAct',
                  timestamp: new Date().toISOString()
                }}
                isLoading={true}
              />
            )}
          </div>
        </div>
      )}

      {/* Action Viewer */}
      {response && (
        <ReActActionViewer
          response={response}
          onActionReplay={handleActionReplay}
          showTimeline={true}
          compactMode={false}
        />
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">CrewAI Service</span>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Enhanced Proxy</span>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">ReAct Endpoints</span>
              </div>
              <Badge variant="secondary">Available</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReActDemo;