'use client';

import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Code2,
  Play,
  Save,
  FileCode,
  Maximize2,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DBTModelEditorCardProps {
  initialSQL?: string;
  modelName?: string;
  onSave?: (sql: string, name: string) => void;
  onRun?: (sql: string) => void;
  onExpand?: () => void;
  onClose?: () => void;
  className?: string;
}

interface DBTTemplate {
  id: string;
  name: string;
  description: string;
  category: 'staging' | 'intermediate' | 'mart' | 'snapshot';
  template: string;
}

const DBT_TEMPLATES: DBTTemplate[] = [
  {
    id: 'staging-simple',
    name: 'Staging Model',
    description: 'Basic staging model with source reference',
    category: 'staging',
    template: `{{
  config(
    materialized='view',
    schema='staging'
  )
}}

with source as (
  select * from {{ source('raw', 'table_name') }}
),

renamed as (
  select
    id,
    created_at,
    updated_at
  from source
)

select * from renamed`
  },
  {
    id: 'intermediate-join',
    name: 'Intermediate Join',
    description: 'Join multiple staging models',
    category: 'intermediate',
    template: `{{
  config(
    materialized='ephemeral'
  )
}}

with customers as (
  select * from {{ ref('stg_customers') }}
),

orders as (
  select * from {{ ref('stg_orders') }}
),

joined as (
  select
    customers.customer_id,
    customers.customer_name,
    orders.order_id,
    orders.order_total
  from customers
  left join orders
    on customers.customer_id = orders.customer_id
)

select * from joined`
  },
  {
    id: 'mart-aggregate',
    name: 'Mart Aggregation',
    description: 'Aggregated mart model for analytics',
    category: 'mart',
    template: `{{
  config(
    materialized='table',
    schema='marts'
  )
}}

with events as (
  select * from {{ ref('int_events') }}
),

aggregated as (
  select
    date_trunc('day', event_timestamp) as event_date,
    user_id,
    count(*) as event_count,
    count(distinct session_id) as session_count
  from events
  group by 1, 2
)

select * from aggregated`
  },
  {
    id: 'incremental',
    name: 'Incremental Model',
    description: 'Incremental processing for large datasets',
    category: 'mart',
    template: `{{
  config(
    materialized='incremental',
    unique_key='id',
    on_schema_change='append_new_columns'
  )
}}

select
  id,
  event_timestamp,
  user_id,
  event_type
from {{ source('raw', 'events') }}

{% if is_incremental() %}
  where event_timestamp > (select max(event_timestamp) from {{ this }})
{% endif %}`
  }
];

export function DBTModelEditorCard({
  initialSQL = '',
  modelName = 'untitled_model',
  onSave,
  onRun,
  onExpand,
  onClose,
  className
}: DBTModelEditorCardProps) {
  const [sql, setSQL] = useState(initialSQL);
  const [name, setName] = useState(modelName);
  const [copied, setCopied] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'validating' | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: 'on',
      rulers: [],
      wordWrap: 'on',
      folding: true,
      glyphMargin: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
    });
  };

  const handleSQLChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSQL(value);
      setValidationStatus(null); // Reset validation on change
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(sql, name);
    }
  };

  const handleRun = () => {
    if (onRun) {
      onRun(sql);
    }
  };

  const handleValidate = async () => {
    setValidationStatus('validating');

    // Simulate validation (in real implementation, call dbt parse API)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Basic validation checks
    const hasConfig = sql.includes('config(');
    const hasSelect = sql.includes('select');
    const hasRef = sql.includes('ref(') || sql.includes('source(');

    if (hasConfig && hasSelect && hasRef) {
      setValidationStatus('valid');
      setValidationMessage('Model syntax is valid');
    } else {
      setValidationStatus('invalid');
      const missing = [];
      if (!hasConfig) missing.push('config()');
      if (!hasSelect) missing.push('SELECT statement');
      if (!hasRef) missing.push('ref() or source()');
      setValidationMessage(`Missing: ${missing.join(', ')}`);
    }
  };

  const handleTemplateSelect = (template: DBTTemplate) => {
    setSQL(template.template);
    setValidationStatus(null);
  };

  const getCategoryColor = (category: DBTTemplate['category']) => {
    switch (category) {
      case 'staging':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'intermediate':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'mart':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'snapshot':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-white dark:bg-gray-950 border border-border overflow-hidden",
        "shadow-lg hover:shadow-xl transition-shadow duration-200",
        "flex flex-col",
        className
      )}
      style={{ height: '500px' }} // Fixed height for editor
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-elevation-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-sm font-semibold bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1 max-w-xs"
                  placeholder="Model name"
                />
                <Badge variant="outline" className="text-xs">
                  .sql
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  dbt Model
                </span>
                {validationStatus && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    {validationStatus === 'validating' && (
                      <div className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Validating...</span>
                      </div>
                    )}
                    {validationStatus === 'valid' && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">{validationMessage}</span>
                      </div>
                    )}
                    {validationStatus === 'invalid' && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600 dark:text-red-400">{validationMessage}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Template Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                  <FileCode className="w-3 h-3" />
                  Templates
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>dbt Model Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DBT_TEMPLATES.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="flex-col items-start py-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm">{template.name}</span>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs ml-auto", getCategoryColor(template.category))}
                      >
                        {template.category}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 w-7 p-0">
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </Button>
            {onExpand && (
              <Button size="sm" variant="ghost" onClick={onExpand} className="h-7 w-7 p-0">
                <Maximize2 className="w-3 h-3" />
              </Button>
            )}
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 bg-elevation-0">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={handleSQLChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
            folding: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-elevation-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {sql.split('\n').length} lines • {sql.length} characters
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            disabled={validationStatus === 'validating'}
            className="gap-1.5 h-7 text-xs"
          >
            {validationStatus === 'validating' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Validate
          </Button>

          {onRun && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRun}
              className="gap-1.5 h-7 text-xs"
            >
              <Play className="w-3 h-3" />
              Run
            </Button>
          )}

          {onSave && (
            <Button
              size="sm"
              onClick={handleSave}
              className="gap-1.5 h-7 text-xs bg-primary"
            >
              <Save className="w-3 h-3" />
              Save Model
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
