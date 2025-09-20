'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Lightbulb, 
  Database,
  Table,
  Hash,
  Calendar,
  Type,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { dataHubService } from '@/lib/services/DataHubContextService';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface AssistedSQLEditorProps {
  sql: string;
  onSQLChange: (sql: string) => void;
  onExecute: (sql: string) => void;
}

interface SQLSuggestion {
  type: 'table' | 'column' | 'function' | 'snippet' | 'glossary';
  label: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
}

export const AssistedSQLEditor: React.FC<AssistedSQLEditorProps> = ({
  sql,
  onSQLChange,
  onExecute
}) => {
  const [currentSQL, setCurrentSQL] = useState(sql);
  const [suggestions, setSuggestions] = useState<SQLSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);
  const [cursorContext, setCursorContext] = useState<string>('');
  const [showHelp, setShowHelp] = useState(true);
  const editorRef = useRef<any>(null);

  // Generate context-aware suggestions
  useEffect(() => {
    generateSuggestions();
  }, [cursorContext, currentSQL]);

  const generateSuggestions = () => {
    const context = cursorContext.toLowerCase();
    const sqlLower = currentSQL.toLowerCase();
    const newSuggestions: SQLSuggestion[] = [];
    
    // Table suggestions
    if (context === 'from' || context === 'join' || sqlLower.endsWith('from ')) {
      newSuggestions.push(
        {
          type: 'table',
          label: 'customers.master_table',
          value: 'customers.master_table',
          description: 'Main customer data table',
          icon: <Table className="h-3 w-3" />,
          category: 'Tables'
        },
        {
          type: 'table',
          label: 'sales.transactions',
          value: 'sales.transactions',
          description: 'Sales transaction records',
          icon: <Table className="h-3 w-3" />,
          category: 'Tables'
        },
        {
          type: 'table',
          label: 'products.catalog',
          value: 'products.catalog',
          description: 'Product catalog',
          icon: <Table className="h-3 w-3" />,
          category: 'Tables'
        }
      );
    }
    
    // Column suggestions
    if (context === 'select' || context === 'where' || context === 'group by' || context === 'order by') {
      newSuggestions.push(
        {
          type: 'column',
          label: 'customer_id',
          value: 'customer_id',
          description: 'Unique customer identifier',
          icon: <Hash className="h-3 w-3" />,
          category: 'Columns'
        },
        {
          type: 'column',
          label: 'customer_name',
          value: 'customer_name',
          description: 'Customer full name',
          icon: <Type className="h-3 w-3" />,
          category: 'Columns'
        },
        {
          type: 'column',
          label: 'order_date',
          value: 'order_date',
          description: 'Date of order',
          icon: <Calendar className="h-3 w-3" />,
          category: 'Columns'
        }
      );
    }
    
    // Function suggestions
    newSuggestions.push(
      {
        type: 'function',
        label: 'COUNT(*)',
        value: 'COUNT(*)',
        description: 'Count all rows',
        icon: <Database className="h-3 w-3" />,
        category: 'Functions'
      },
      {
        type: 'function',
        label: 'SUM(column)',
        value: 'SUM(${1:column})',
        description: 'Sum values in column',
        icon: <Database className="h-3 w-3" />,
        category: 'Functions'
      },
      {
        type: 'function',
        label: 'DATEDIFF',
        value: 'DATEDIFF(day, ${1:start_date}, ${2:end_date})',
        description: 'Calculate date difference',
        icon: <Calendar className="h-3 w-3" />,
        category: 'Functions'
      }
    );
    
    // Snippet suggestions
    if (sqlLower.length < 10) {
      newSuggestions.push(
        {
          type: 'snippet',
          label: 'Basic SELECT',
          value: 'SELECT * FROM ${1:table} WHERE ${2:condition}',
          description: 'Basic select query template',
          icon: <Lightbulb className="h-3 w-3" />,
          category: 'Templates'
        },
        {
          type: 'snippet',
          label: 'Join Tables',
          value: `SELECT 
  t1.*,
  t2.\${3:column}
FROM \${1:table1} t1
JOIN \${2:table2} t2 ON t1.id = t2.id`,
          description: 'Join two tables',
          icon: <Lightbulb className="h-3 w-3" />,
          category: 'Templates'
        },
        {
          type: 'snippet',
          label: 'Group & Aggregate',
          value: `SELECT 
  \${1:group_column},
  COUNT(*) as count,
  SUM(\${2:value_column}) as total
FROM \${3:table}
GROUP BY \${1:group_column}
ORDER BY total DESC`,
          description: 'Group and aggregate data',
          icon: <Lightbulb className="h-3 w-3" />,
          category: 'Templates'
        }
      );
    }
    
    // Business glossary terms
    newSuggestions.push(
      {
        type: 'glossary',
        label: 'Customer Lifetime Value',
        value: 'SUM(order_value) OVER (PARTITION BY customer_id)',
        description: 'Total value of customer purchases',
        icon: <Lightbulb className="h-3 w-3" />,
        category: 'Business Terms'
      },
      {
        type: 'glossary',
        label: 'Churn Risk',
        value: 'CASE WHEN DATEDIFF(day, last_order_date, CURRENT_DATE) > 90 THEN 1 ELSE 0 END',
        description: 'Customer churn risk indicator',
        icon: <Lightbulb className="h-3 w-3" />,
        category: 'Business Terms'
      }
    );
    
    setSuggestions(newSuggestions);
  };
  
  const insertSuggestion = (suggestion: SQLSuggestion) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      
      // Insert at cursor position
      editor.executeEdits('', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text: suggestion.value,
      }]);
      
      // Focus back on editor
      editor.focus();
    } else {
      // Fallback if Monaco not ready
      setCurrentSQL(currentSQL + ' ' + suggestion.value);
    }
  };
  
  const handleExecute = () => {
    onExecute(currentSQL);
  };
  
  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = [];
    }
    acc[suggestion.category].push(suggestion);
    return acc;
  }, {} as Record<string, SQLSuggestion[]>);
  
  return (
    <div className="assisted-sql-editor">
      <div className="grid grid-cols-3 gap-4">
        {/* SQL Editor - Main Focus */}
        <div className="col-span-2">
          <Card className="p-0 overflow-hidden bg-background/50 backdrop-blur-sm border-border">
            <div className="border-b border-border px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">SQL Editor</span>
                <Badge variant="outline" className="text-xs">Assisted Mode</Badge>
              </div>
              <Button
                size="sm"
                onClick={handleExecute}
                disabled={!currentSQL}
                className="gap-2"
              >
                <Play className="h-3 w-3" />
                Run
              </Button>
            </div>
            
            <MonacoEditor
              height="400px"
              language="sql"
              theme="vs-dark"
              value={currentSQL}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16, bottom: 16 }
              }}
              onChange={(value) => {
                setCurrentSQL(value || '');
                onSQLChange(value || '');
              }}
              onMount={(editor) => {
                editorRef.current = editor;
                
                // Track cursor context
                editor.onDidChangeCursorPosition((e) => {
                  const model = editor.getModel();
                  if (model) {
                    const position = e.position;
                    const line = model.getLineContent(position.lineNumber);
                    const beforeCursor = line.substring(0, position.column - 1);
                    
                    // Detect context
                    if (beforeCursor.toLowerCase().endsWith('from ')) {
                      setCursorContext('from');
                    } else if (beforeCursor.toLowerCase().endsWith('where ')) {
                      setCursorContext('where');
                    } else if (beforeCursor.toLowerCase().endsWith('select ')) {
                      setCursorContext('select');
                    }
                  }
                });
              }}
            />
          </Card>
        </div>
        
        {/* Suggestions Sidebar */}
        <div className="col-span-1">
          <Card className="p-4 bg-background/50 backdrop-blur-sm border-border h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Suggestions</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHelp(!showHelp)}
                className="h-6 w-6 p-0"
              >
                <Info className="h-3 w-3" />
              </Button>
            </div>
            
            {showHelp && (
              <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted/30 rounded">
                Click any suggestion to insert it at your cursor position.
              </div>
            )}
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              {Object.entries(groupedSuggestions).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {items.slice(0, 5).map((suggestion, idx) => (
                      <button
                        key={idx}
                        className={cn(
                          "w-full text-left p-2 rounded hover:bg-muted/50 transition-colors",
                          "flex items-start gap-2 group"
                        )}
                        onClick={() => insertSuggestion(suggestion)}
                      >
                        <span className="text-muted-foreground group-hover:text-foreground mt-0.5">
                          {suggestion.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {suggestion.label}
                          </div>
                          {suggestion.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.description}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                Quick Actions
              </h4>
              <div className="space-y-1">
                <button className="w-full text-left text-xs p-2 rounded hover:bg-muted/50">
                  Format SQL
                </button>
                <button className="w-full text-left text-xs p-2 rounded hover:bg-muted/50">
                  Validate Syntax
                </button>
                <button className="w-full text-left text-xs p-2 rounded hover:bg-muted/50">
                  Explain Query Plan
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};