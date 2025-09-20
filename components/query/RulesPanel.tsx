'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Sparkles,
  BookOpen,
  Filter,
  Calculator,
  AlertCircle,
  Check,
  ChevronRight,
  Plus,
  Database,
  Lock,
  TrendingUp,
  Info,
} from 'lucide-react';
import type { DataHubContext, BusinessRule, QualityRule, GlossaryTerm } from '@/lib/services/DataHubContextService';

interface RulesPanelProps {
  dataHubContext: DataHubContext;
  onApplyRules: (rules: BusinessRule[]) => void;
  onClose?: () => void;
}

interface RuleCardProps {
  type: 'privacy' | 'quality' | 'business' | 'custom';
  title: string;
  description: string;
  source: string;
  icon?: React.ReactNode;
  badge?: string;
  isSelected?: boolean;
  onToggle: () => void;
  confidence?: number;
}

function RuleCard({ 
  type, 
  title, 
  description, 
  source, 
  icon, 
  badge, 
  isSelected, 
  onToggle,
  confidence 
}: RuleCardProps) {
  const typeStyles = {
    privacy: 'border-red-200 bg-red-50 hover:bg-red-100',
    quality: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100',
    business: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
    custom: 'border-gray-200 bg-gray-50 hover:bg-gray-100',
  };

  const typeIcons = {
    privacy: <Lock className="h-4 w-4 text-red-600" />,
    quality: <Shield className="h-4 w-4 text-yellow-600" />,
    business: <TrendingUp className="h-4 w-4 text-blue-600" />,
    custom: <Sparkles className="h-4 w-4 text-gray-600" />,
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        typeStyles[type]
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {icon || typeIcons[type]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{title}</h4>
              {badge && (
                <Badge variant="outline" className="text-xs">
                  {badge}
                </Badge>
              )}
              {confidence && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(confidence * 100)}% confidence
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Database className="h-3 w-3" />
              Source: {source}
            </p>
          </div>
        </div>
        <div className="mt-1">
          {isSelected ? (
            <Check className="h-5 w-5 text-blue-600" />
          ) : (
            <div className="h-5 w-5 rounded border-2 border-gray-300" />
          )}
        </div>
      </div>
    </div>
  );
}

interface GlossaryRuleCardProps {
  term: GlossaryTerm;
  isSelected: boolean;
  onToggle: () => void;
}

function GlossaryRuleCard({ term, isSelected, onToggle }: GlossaryRuleCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all bg-indigo-50 hover:bg-indigo-100 border-indigo-200 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <BookOpen className="h-4 w-4 text-indigo-600 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{term.name}</h4>
            {term.description && (
              <p className="text-xs text-gray-600 mt-1">{term.description}</p>
            )}
            {term.calculation && (
              <div className="mt-2 p-2 bg-white/50 rounded border border-indigo-200">
                <code className="text-xs font-mono">{term.calculation}</code>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Business Glossary
              </Badge>
              {term.properties?.updateFrequency && (
                <Badge variant="outline" className="text-xs">
                  Updated: {term.properties.updateFrequency}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="mt-1">
          {isSelected ? (
            <Check className="h-5 w-5 text-blue-600" />
          ) : (
            <div className="h-5 w-5 rounded border-2 border-gray-300" />
          )}
        </div>
      </div>
    </div>
  );
}

interface RuleTemplateProps {
  name: string;
  template: string;
  description: string;
  onAdd: () => void;
}

function RuleTemplate({ name, template, description, onAdd }: RuleTemplateProps) {
  return (
    <div className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-sm">{name}</h5>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
          <code className="text-xs font-mono text-gray-500 mt-2 block">{template}</code>
        </div>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

export function RulesPanel({ dataHubContext, onApplyRules, onClose }: RulesPanelProps) {
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('automated');

  const toggleRule = (ruleId: string) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }
    setSelectedRules(newSelected);
  };

  const applySelectedRules = () => {
    const rules: BusinessRule[] = [];
    
    // Add selected automated rules
    if (selectedRules.has('pii_protection')) {
      rules.push({
        id: 'pii_protection',
        name: 'PII Protection',
        type: 'privacy',
        description: `Apply masking to ${dataHubContext.piiFields.join(', ')}`,
        source: 'DataHub Classification',
        confidence: 0.95
      });
    }
    
    // Add selected quality rules
    dataHubContext.qualityRules?.forEach(rule => {
      if (selectedRules.has(rule.id)) {
        rules.push({
          id: rule.id,
          name: rule.name,
          type: 'quality',
          description: rule.description,
          source: 'DataHub Quality Rules',
          sqlTemplate: rule.condition
        });
      }
    });
    
    // Add selected glossary terms
    dataHubContext.glossaryTerms.forEach(term => {
      if (selectedRules.has(term.urn)) {
        rules.push({
          id: term.urn,
          name: term.name,
          type: 'business',
          description: term.description || '',
          source: 'DataHub Glossary',
          sqlTemplate: term.calculation
        });
      }
    });
    
    onApplyRules(rules);
  };

  const selectedCount = selectedRules.size;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Business Rules Engine</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Apply DataHub-powered rules and business logic to your query
          </p>
        </div>
        {selectedCount > 0 && (
          <Badge variant="default" className="text-sm">
            {selectedCount} rules selected
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="automated" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              DataHub Rules
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Business Logic
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Custom Rules
            </TabsTrigger>
          </TabsList>

          {/* DataHub Automated Rules */}
          <TabsContent value="automated" className="space-y-4 mt-4">
            {dataHubContext.piiFields.length > 0 && (
              <RuleCard
                type="privacy"
                title="PII Protection"
                description={`Apply masking to ${dataHubContext.piiFields.length} PII fields: ${dataHubContext.piiFields.slice(0, 3).join(', ')}${dataHubContext.piiFields.length > 3 ? '...' : ''}`}
                source="DataHub Classification"
                badge={dataHubContext.piiClassification}
                isSelected={selectedRules.has('pii_protection')}
                onToggle={() => toggleRule('pii_protection')}
                confidence={0.95}
              />
            )}
            
            {dataHubContext.qualityScore < 80 && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Quality Score: {dataHubContext.qualityScore}%</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Apply quality filters to improve data reliability
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Quality Rules</h4>
              {dataHubContext.qualityRules?.map(rule => (
                <RuleCard
                  key={rule.id}
                  type="quality"
                  title={rule.name}
                  description={rule.description}
                  source="DataHub Quality Rules"
                  badge={rule.severity}
                  isSelected={selectedRules.has(rule.id)}
                  onToggle={() => toggleRule(rule.id)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Business Logic from Glossary */}
          <TabsContent value="business" className="space-y-4 mt-4">
            {dataHubContext.glossaryTerms.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Business Glossary Calculations</h4>
                  <Badge variant="outline" className="text-xs">
                    {dataHubContext.glossaryTerms.length} available
                  </Badge>
                </div>
                {dataHubContext.glossaryTerms.map(term => (
                  <GlossaryRuleCard
                    key={term.urn}
                    term={term}
                    isSelected={selectedRules.has(term.urn)}
                    onToggle={() => toggleRule(term.urn)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No business glossary terms available</p>
                <p className="text-xs mt-1">Add terms in DataHub to see them here</p>
              </div>
            )}
          </TabsContent>

          {/* Custom Rules */}
          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Rule Templates</h4>
              
              <RuleTemplate
                name="Filter by Quality Score"
                template="WHERE _datahub_quality_score >= {threshold}"
                description="Only include records meeting quality threshold"
                onAdd={() => console.log('Add quality filter')}
              />
              
              <RuleTemplate
                name="Customer Segmentation"
                template="CASE WHEN {condition} THEN {segment} END AS customer_segment"
                description="Categorize customers based on behavior"
                onAdd={() => console.log('Add segmentation')}
              />
              
              <RuleTemplate
                name="Revenue Tier Calculation"
                template="CASE WHEN revenue > 100000 THEN 'Enterprise' ELSE 'SMB' END"
                description="Classify customers by revenue tier"
                onAdd={() => console.log('Add revenue tier')}
              />
              
              <RuleTemplate
                name="Time-based Filtering"
                template="WHERE {date_column} >= DATEADD(DAY, -{days}, CURRENT_DATE)"
                description="Filter records by recency"
                onAdd={() => console.log('Add time filter')}
              />
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Rule
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Summary and Actions */}
        {selectedCount > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Ready to Apply</p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedCount} rule{selectedCount !== 1 ? 's' : ''} will be applied to your query
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedRules(new Set())}>
                  Clear All
                </Button>
                <Button size="sm" onClick={applySelectedRules}>
                  Apply Rules
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}