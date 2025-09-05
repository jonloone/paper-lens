'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Sparkles, Code, Check, X, Eye } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef
} from "@tanstack/react-table";

interface QualityRule {
  id: string;
  name: string;
  description: string;
  sql?: string;
  status: 'suggested' | 'applied' | 'ignored';
  confidence: number;
  table: string;
}

export function QualityRuleManager() {
  const [rules, setRules] = useState<QualityRule[]>([
    {
      id: '1',
      name: 'Email Format Check',
      description: 'Validates email field contains valid email format',
      sql: 'SELECT * FROM crm_events WHERE email !~ \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$\'',
      confidence: 95,
      status: 'suggested',
      table: 'crm_events'
    },
    {
      id: '2',
      name: 'Date Range Validation',
      description: 'Ensures event_date is within reasonable range',
      sql: 'SELECT * FROM crm_events WHERE event_date < \'2020-01-01\' OR event_date > CURRENT_DATE',
      confidence: 88,
      status: 'applied',
      table: 'crm_events'
    },
    {
      id: '3',
      name: 'Product Value Check',
      description: 'Validates product_value is positive and non-null',
      sql: 'SELECT * FROM crm_events WHERE product_value IS NULL OR product_value <= 0',
      confidence: 92,
      status: 'ignored',
      table: 'crm_events'
    }
  ]);
  
  const [ruleDescription, setRuleDescription] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRule = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate rule generation with CrewAI
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSQL = `-- Generated Quality Rule SQL
SELECT COUNT(*) as violations,
       'Data Quality Violation' as issue_type
FROM iceberg.banking_crm.crm_events
WHERE ${ruleDescription.toLowerCase().includes('email') 
  ? 'email IS NULL OR email NOT LIKE \'%@%.%\'' 
  : 'column_value IS NULL OR column_value < 0'}
HAVING COUNT(*) > 0;`;
      
      setGeneratedSQL(mockSQL);
      
      // Add to rules list
      const newRule: QualityRule = {
        id: String(rules.length + 1),
        name: ruleDescription.substring(0, 30),
        description: ruleDescription,
        sql: mockSQL,
        confidence: Math.floor(Math.random() * 15) + 85,
        status: 'suggested',
        table: 'crm_events'
      };
      
      setRules([newRule, ...rules]);
    } catch (error) {
      console.error('Rule generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRuleAction = (ruleId: string, action: 'accept' | 'ignore') => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: action === 'accept' ? 'applied' : 'ignored' }
        : rule
    ));
  };

  const columnHelper = createColumnHelper<QualityRule>();

  const columns: ColumnDef<QualityRule>[] = [
    columnHelper.accessor('name', {
      header: 'Rule Name',
      cell: info => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => (
        <p className="text-sm text-muted-foreground max-w-xs truncate">
          {info.getValue()}
        </p>
      )
    }),
    columnHelper.accessor('confidence', {
      header: 'Confidence',
      cell: info => (
        <Badge variant={info.getValue() > 90 ? "default" : "secondary"}>
          {info.getValue()}%
        </Badge>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <Badge variant={
          info.getValue() === 'applied' ? "default" : 
          info.getValue() === 'suggested' ? "outline" : "destructive"
        }>
          {info.getValue()}
        </Badge>
      )
    }),
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Eye className="h-3 w-3" />
          </Button>
          {row.original.status === 'suggested' && (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                onClick={() => handleRuleAction(row.original.id, 'accept')}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                onClick={() => handleRuleAction(row.original.id, 'ignore')}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: rules,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Rule Generation */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5" />
            Generate Quality Rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-300">
              Rule Description
            </label>
            <Textarea
              placeholder="Customer emails should be valid and not contain null values"
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              rows={2}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateRule}
              disabled={!ruleDescription.trim() || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? "Generating..." : "Generate SQL"}
            </Button>
            <Button variant="outline">Preview</Button>
            <Button variant="outline">Test Sample</Button>
          </div>

          {generatedSQL && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Generated SQL</label>
              <div className="bg-gray-800 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto text-gray-100">
                  <code>{generatedSQL}</code>
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Rules Table */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" />
              Quality Rules - iceberg.banking_crm.crm_events
            </span>
            <Badge variant="secondary">
              {rules.filter(r => r.status === 'applied').length} Active Rules
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-gray-800 bg-gray-800/50">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="p-3 text-left text-sm font-medium text-gray-300">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-800/25">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-3 text-gray-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}