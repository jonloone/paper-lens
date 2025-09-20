'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineStage } from './QueryPipelineBuilder';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface SQLPreviewProps {
  baseQuery: string;
  stages: PipelineStage[];
  finalSQL: string;
}

export const SQLPreview: React.FC<SQLPreviewProps> = ({
  baseQuery,
  stages,
  finalSQL
}) => {
  const [viewMode, setViewMode] = useState<'final' | 'stepped'>('final');
  const [copied, setCopied] = useState(false);

  const generateSQLUpToStage = (baseQuery: string, stages: PipelineStage[], upToIndex: number): string => {
    if (upToIndex < 0) return baseQuery;
    
    const activeStages = stages.slice(0, upToIndex + 1).filter(s => s.isActive);
    
    if (activeStages.length === 0) return baseQuery;
    
    // Build CTE chain
    const cteParts: string[] = [];
    let previousCte = 'base_data';
    
    // Start with base query
    cteParts.push(`${previousCte} AS (\n  ${baseQuery.replace(/\n/g, '\n  ')}\n)`);
    
    // Apply each stage
    activeStages.forEach((stage, i) => {
      const stageCte = `stage_${i}_${stage.type}`;
      const stageSql = applyStageToSQL(previousCte, stage);
      cteParts.push(`${stageCte} AS (\n  ${stageSql.replace(/\n/g, '\n  ')}\n)`);
      previousCte = stageCte;
    });
    
    // Build final query
    return `WITH ${cteParts.join(',\n')}\nSELECT * FROM ${previousCte}`;
  };

  const applyStageToSQL = (fromCte: string, stage: PipelineStage): string => {
    const rules = stage.rules.filter(r => r.sql);
    
    if (rules.length === 0) {
      return `SELECT * FROM ${fromCte}`;
    }
    
    switch (stage.type) {
      case 'filter':
        const conditions = rules.map(r => r.sql).join(' AND ');
        return `SELECT * FROM ${fromCte}\n  WHERE ${conditions}`;
      
      case 'transform':
      case 'enrich':
        const transforms = rules.map(r => {
          if (r.alias) {
            return `${r.sql} AS ${r.alias}`;
          }
          return r.sql;
        }).join(',\n       ');
        return `SELECT *,\n       ${transforms}\n  FROM ${fromCte}`;
      
      case 'aggregate':
        const aggregates = rules.map(r => r.sql).join(',\n       ');
        return `SELECT ${aggregates}\n  FROM ${fromCte}`;
      
      case 'privacy':
        const masks = rules.map(r => r.sql).join(',\n       ');
        return `SELECT * EXCEPT(${rules.map(r => r.field).filter(Boolean).join(', ')}),\n       ${masks}\n  FROM ${fromCte}`;
      
      default:
        return `SELECT * FROM ${fromCte}`;
    }
  };

  const generatedFinalSQL = useMemo(() => {
    if (stages.length === 0) return baseQuery;
    return generateSQLUpToStage(baseQuery, stages, stages.length - 1);
  }, [baseQuery, stages]);

  const handleCopy = () => {
    navigator.clipboard.writeText(viewMode === 'final' ? generatedFinalSQL : baseQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sql-preview space-y-4">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'final' | 'stepped')}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="final">Final SQL</TabsTrigger>
            <TabsTrigger value="stepped">Step by Step</TabsTrigger>
          </TabsList>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </Button>
        </div>
        
        <TabsContent value="final" className="mt-0">
          <Card className="p-0 overflow-hidden">
            <MonacoEditor
              height="400px"
              language="sql"
              theme="vs-dark"
              value={generatedFinalSQL}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                readOnly: false,
                wordWrap: 'on',
                automaticLayout: true
              }}
              onChange={(value) => {
                // Allow editing but don't update the pipeline
                // This is for experimentation
              }}
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="stepped" className="mt-0 space-y-4">
          {/* Base Query */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">Step 0</Badge>
              <h4 className="text-sm font-semibold">Base Query</h4>
            </div>
            <div className="bg-muted/30 rounded-md p-3">
              <code className="text-xs font-mono text-green-600 whitespace-pre-wrap">
                {baseQuery}
              </code>
            </div>
          </Card>
          
          {/* Each Stage */}
          {stages.map((stage, idx) => {
            if (!stage.isActive) return null;
            
            const sqlAfterStage = generateSQLUpToStage(baseQuery, stages, idx);
            
            return (
              <Card key={stage.id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">Step {idx + 1}</Badge>
                  <h4 className="text-sm font-semibold">After {stage.name}</h4>
                  <Badge className="text-xs">
                    {stage.rules.length} rule{stage.rules.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {/* Show the transformation */}
                <div className="space-y-2 mb-3">
                  <div className="text-xs text-muted-foreground">Transformation:</div>
                  <div className="bg-primary/5 rounded-md p-2 border border-primary/20">
                    <code className="text-xs font-mono text-primary whitespace-pre-wrap">
                      {stage.sqlTransformation || applyStageToSQL('previous_stage', stage)}
                    </code>
                  </div>
                </div>
                
                {/* Show result */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Resulting SQL:</div>
                  <div className="bg-muted/30 rounded-md p-3 max-h-[200px] overflow-auto">
                    <code className="text-xs font-mono text-green-600 whitespace-pre-wrap">
                      {sqlAfterStage}
                    </code>
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};