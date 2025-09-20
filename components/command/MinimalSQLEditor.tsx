'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Play, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  scanSize?: string;
}

interface MinimalSQLEditorProps {
  initialSQL?: string;
  onClose: () => void;
  onSave: (sql: string, name: string) => void;
}

export const MinimalSQLEditor: React.FC<MinimalSQLEditorProps> = ({
  initialSQL = '',
  onClose,
  onSave
}) => {
  const [sql, setSQL] = useState(initialSQL);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [schedule, setSchedule] = useState<string>('none');
  
  // Query intelligence
  const [scanSize, setScanSize] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const analyzeQuery = (query: string) => {
    // Simple analysis for demo
    const warnings: string[] = [];
    const upperQuery = query.toUpperCase();
    
    if (!upperQuery.includes('WHERE') && upperQuery.includes('FROM')) {
      warnings.push('No partition filter detected');
    }
    
    if (upperQuery.includes('*')) {
      warnings.push('Consider selecting specific columns');
    }
    
    setWarnings(warnings);
    
    // Mock scan size calculation
    if (!upperQuery.includes('WHERE')) {
      setScanSize('2.5 TB');
    } else if (upperQuery.includes('DATE')) {
      setScanSize('120 GB');
    } else {
      setScanSize('450 GB');
    }
  };
  
  useEffect(() => {
    if (sql) {
      analyzeQuery(sql);
    }
  }, [sql]);
  
  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    
    // Simulate query execution
    setTimeout(() => {
      setResult({
        columns: ['customer_id', 'total_revenue', 'order_count'],
        rows: [
          ['cust_001', 45230, 12],
          ['cust_002', 38102, 8],
          ['cust_003', 67891, 23],
          ['cust_004', 23456, 5],
          ['cust_005', 89012, 31]
        ],
        rowCount: 1234,
        executionTime: 423
      });
      setIsRunning(false);
    }, 1500);
  };
  
  const handleSave = () => {
    if (!queryName.trim()) return;
    onSave(sql, queryName);
    setShowSaveDialog(false);
  };
  
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="text-sm font-medium">SQL Editor</div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="h-1/2 border-b border-border">
          <MonacoEditor
            height="100%"
            language="sql"
            theme="vs-dark"
            value={sql}
            onChange={(value) => setSQL(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              renderLineHighlight: 'none',
              scrollBeyondLastLine: false,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              wordWrap: 'on'
            }}
          />
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={handleRun}
              disabled={isRunning || !sql}
              className="gap-2"
            >
              <Play className="h-3 w-3" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            
            {/* Query Intelligence */}
            {scanSize && !isRunning && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Query: {scanSize} scan</span>
                {warnings.length > 0 && (
                  <span className="text-yellow-500">
                    {warnings[0]}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {result && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
              className="gap-2"
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
          )}
        </div>
        
        {/* Results */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          {result && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                {result.rowCount.toLocaleString()} rows • {result.executionTime}ms
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {result.columns.map((col, idx) => (
                        <th key={idx} className="text-left py-2 px-3 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-border/50">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="py-2 px-3">
                            {typeof cell === 'number' ? cell.toLocaleString() : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Minimal Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-background border border-border rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Save Query</h3>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Query name"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-border rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              <div>
                <select
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-border rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="none">No schedule</option>
                  <option value="@once">Run once</option>
                  <option value="@hourly">Every hour</option>
                  <option value="@daily">Every day</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!queryName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};