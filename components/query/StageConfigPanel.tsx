'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Code, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PipelineStage, Rule, StageOption } from './QueryPipelineBuilder';

interface StageConfigPanelProps {
  stage: PipelineStage;
  availableOptions: StageOption[];
  onUpdateStage: (stage: PipelineStage) => void;
  onClose: () => void;
}

export const StageConfigPanel: React.FC<StageConfigPanelProps> = ({
  stage,
  availableOptions,
  onUpdateStage,
  onClose
}) => {
  const [rules, setRules] = useState<Rule[]>(stage.rules || []);
  const [customSQL, setCustomSQL] = useState('');
  const [customName, setCustomName] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  useEffect(() => {
    setRules(stage.rules || []);
  }, [stage]);

  const addRuleFromTemplate = (option: StageOption) => {
    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      name: option.name,
      sql: option.template,
      field: option.field
    };
    setRules([...rules, newRule]);
  };

  const addCustomRule = () => {
    if (!customSQL) return;
    
    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      name: customName || 'Custom Rule',
      sql: customSQL,
      type: 'custom'
    };
    setRules([...rules, newRule]);
    setCustomSQL('');
    setCustomName('');
  };

  const removeRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  const updateRule = (ruleId: string, updates: Partial<Rule>) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, ...updates } : r
    ));
    setEditingRuleId(null);
  };

  const generateStageSQL = (stage: PipelineStage): string => {
    if (stage.type === 'filter') {
      const conditions = rules.map(r => r.sql).filter(Boolean);
      return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }
    
    if (stage.type === 'transform' || stage.type === 'enrich') {
      const transforms = rules.map(r => r.sql).filter(Boolean);
      return transforms.join(',\n');
    }
    
    if (stage.type === 'aggregate') {
      const aggregates = rules.map(r => r.sql).filter(Boolean);
      return aggregates.join(',\n');
    }
    
    if (stage.type === 'privacy') {
      const masks = rules.map(r => r.sql).filter(Boolean);
      return masks.join(',\n');
    }
    
    return '';
  };

  const handleSave = () => {
    onUpdateStage({
      ...stage,
      rules,
      sqlTransformation: generateStageSQL({ ...stage, rules })
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-background border-l border-border shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Configure {stage.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add and configure rules for this pipeline stage
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Applied Rules */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Applied Rules</h4>
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rules configured</p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <Card key={rule.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingRuleId === rule.id ? (
                            <Input
                              value={rule.name}
                              onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                              className="h-7 text-sm"
                            />
                          ) : (
                            <div className="font-medium text-sm">{rule.name}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingRuleId(
                              editingRuleId === rule.id ? null : rule.id
                            )}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeRule(rule.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {editingRuleId === rule.id ? (
                        <textarea
                          value={rule.sql}
                          onChange={(e) => updateRule(rule.id, { sql: e.target.value })}
                          className="w-full min-h-[60px] p-2 text-xs font-mono bg-muted rounded-md border border-border"
                        />
                      ) : (
                        <code className="block text-xs text-green-600 font-mono bg-muted/30 p-2 rounded">
                          {rule.sql}
                        </code>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Templates */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Quick Templates</h4>
            <div className="grid grid-cols-2 gap-2">
              {availableOptions.map((option, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => addRuleFromTemplate(option)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {option.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Custom SQL */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Custom SQL</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="customName" className="text-xs">Rule Name</Label>
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Filter Active Users"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customSQL" className="text-xs">SQL Expression</Label>
                <textarea
                  id="customSQL"
                  value={customSQL}
                  onChange={(e) => setCustomSQL(e.target.value)}
                  placeholder="Enter SQL expression..."
                  className="w-full min-h-[80px] mt-1 p-2 text-sm font-mono bg-background border border-input rounded-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey && customSQL) {
                      addCustomRule();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={addCustomRule}
                disabled={!customSQL}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Rule
              </Button>
            </div>
          </div>

          {/* SQL Preview for this stage */}
          <div>
            <h4 className="text-sm font-semibold mb-3">SQL Impact</h4>
            <Card className="p-4 bg-muted/30">
              <code className="text-xs text-green-600 font-mono whitespace-pre-wrap">
                {generateStageSQL({ ...stage, rules }) || '-- No rules configured'}
              </code>
            </Card>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};