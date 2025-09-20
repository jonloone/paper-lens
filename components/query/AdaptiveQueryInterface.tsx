'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Code, 
  GitBranch, 
  Play, 
  Save,
  Settings2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NaturalLanguageQuery } from './NaturalLanguageQuery';
import { AssistedSQLEditor } from './AssistedSQLEditor';
import { QueryPipelineBuilder } from './QueryPipelineBuilder';
import { PipelineProductization } from '@/components/productization/PipelineProductization';
import type { QueryPipeline } from './QueryPipelineBuilder';

type QueryMode = 'simple' | 'assisted' | 'advanced';

interface AdaptiveQueryInterfaceProps {
  onExecute: (sql: string) => void;
  onSaveAsProduct?: (product: any) => void;
  initialMode?: QueryMode;
}

export const AdaptiveQueryInterface: React.FC<AdaptiveQueryInterfaceProps> = ({
  onExecute,
  onSaveAsProduct,
  initialMode = 'simple'
}) => {
  const [mode, setMode] = useState<QueryMode>(initialMode);
  const [query, setQuery] = useState('');
  const [sql, setSQL] = useState('');
  const [showPipeline, setShowPipeline] = useState(false);
  const [currentPipeline, setCurrentPipeline] = useState<QueryPipeline | null>(null);
  const [showProductization, setShowProductization] = useState(false);
  
  // Remember user preference
  useEffect(() => {
    const savedMode = localStorage.getItem('queryMode') as QueryMode;
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);
  
  const handleModeChange = (newMode: QueryMode) => {
    setMode(newMode);
    localStorage.setItem('queryMode', newMode);
    
    // Reset pipeline view when leaving advanced mode
    if (newMode !== 'advanced') {
      setShowPipeline(false);
    }
  };
  
  const handleExecute = (executeSql: string) => {
    setSQL(executeSql);
    onExecute(executeSql);
  };
  
  const handleSaveAsProduct = () => {
    if (sql) {
      if (currentPipeline) {
        setShowProductization(true);
      } else {
        // Create simple pipeline from SQL
        const simplePipeline: QueryPipeline = {
          baseQuery: sql,
          stages: [],
          finalSQL: sql,
          metadata: {}
        };
        setCurrentPipeline(simplePipeline);
        setShowProductization(true);
      }
    }
  };
  
  const togglePipelineView = () => {
    if (!showPipeline && sql) {
      // Convert current SQL to pipeline
      const pipeline: QueryPipeline = {
        baseQuery: sql,
        stages: [],
        finalSQL: sql,
        metadata: {
          dataSources: extractDataSources(sql)
        }
      };
      setCurrentPipeline(pipeline);
      setShowPipeline(true);
      setMode('advanced');
    } else {
      setShowPipeline(false);
    }
  };
  
  const extractDataSources = (sql: string): string[] => {
    const matches = sql.match(/from\s+(\w+\.\w+|\w+)/gi) || [];
    return matches.map(m => m.replace(/from\s+/i, ''));
  };
  
  const getModeIcon = (mode: QueryMode) => {
    switch (mode) {
      case 'simple': return <MessageSquare className="h-3 w-3" />;
      case 'assisted': return <Code className="h-3 w-3" />;
      case 'advanced': return <GitBranch className="h-3 w-3" />;
    }
  };
  
  const getModeDescription = (mode: QueryMode) => {
    switch (mode) {
      case 'simple': return 'Natural language';
      case 'assisted': return 'Guided SQL';
      case 'advanced': return 'Pipeline builder';
    }
  };
  
  return (
    <div className="adaptive-query-interface space-y-4">
      {/* Mode Selector - Subtle, integrated header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Query Builder</h2>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        
        {/* Mode Tabs - Subtle styling */}
        <Tabs value={mode} onValueChange={(v) => handleModeChange(v as QueryMode)}>
          <TabsList className="h-8 p-0.5 bg-muted/30">
            {(['simple', 'assisted', 'advanced'] as QueryMode[]).map((m) => (
              <TabsTrigger
                key={m}
                value={m}
                className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1 gap-1.5"
              >
                {getModeIcon(m)}
                <span className="capitalize">{m}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Main Query Area - Adapts to mode */}
      <div className="query-content">
        {mode === 'simple' && !showPipeline && (
          <NaturalLanguageQuery
            onQueryChange={setQuery}
            onSQLGenerated={setSQL}
            onExecute={handleExecute}
            initialQuery={query}
          />
        )}
        
        {mode === 'assisted' && !showPipeline && (
          <AssistedSQLEditor
            sql={sql}
            onSQLChange={setSQL}
            onExecute={handleExecute}
          />
        )}
        
        {(mode === 'advanced' || showPipeline) && (
          <QueryPipelineBuilder
            initialQuery={sql || query}
            onExecute={(pipeline) => {
              setCurrentPipeline(pipeline);
              handleExecute(pipeline.finalSQL);
            }}
            onSaveAsProduct={(pipeline) => {
              setCurrentPipeline(pipeline);
              setShowProductization(true);
            }}
          />
        )}
      </div>
      
      {/* Action Bar - Always visible */}
      <Card className="p-4 bg-background/50 backdrop-blur-sm border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Context badges */}
            {sql && (
              <>
                <Badge variant="outline" className="text-xs">
                  SQL Ready
                </Badge>
                {extractDataSources(sql).map((source, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Advanced options - subtle */}
            {sql && !showPipeline && mode !== 'advanced' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePipelineView}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <GitBranch className="h-3 w-3 mr-1" />
                Pipeline view
              </Button>
            )}
            
            {/* Save as product */}
            {sql && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveAsProduct}
                className="gap-2"
              >
                <Save className="h-3 w-3" />
                Save as Product
              </Button>
            )}
            
            {/* Execute - Primary action */}
            <Button
              onClick={() => handleExecute(sql)}
              disabled={!sql}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Run Query
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Pipeline Productization Modal */}
      {showProductization && currentPipeline && (
        <PipelineProductization
          pipeline={currentPipeline}
          onSave={(product) => {
            console.log('Saving data product:', product);
            setShowProductization(false);
            setCurrentPipeline(null);
            onSaveAsProduct?.(product);
          }}
          onClose={() => {
            setShowProductization(false);
          }}
        />
      )}
      
      {/* Mode Helper - Subtle, dismissible */}
      {mode === 'simple' && (
        <div className="text-xs text-muted-foreground text-center">
          💡 Tip: Describe what you want in plain English. AI will generate the SQL for you.
        </div>
      )}
      
      {mode === 'assisted' && (
        <div className="text-xs text-muted-foreground text-center">
          💡 Tip: Write SQL with intelligent autocomplete and suggestions based on your data catalog.
        </div>
      )}
      
      {mode === 'advanced' && !showPipeline && (
        <div className="text-xs text-muted-foreground text-center">
          💡 Tip: Build complex data transformations as visual pipelines with stages and rules.
        </div>
      )}
    </div>
  );
};