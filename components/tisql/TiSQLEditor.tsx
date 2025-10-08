'use client';

import React, { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';

interface TiSQLEditorProps {
  sql: string;
  onChange: (sql: string) => void;
  selectedCatalog?: string;
  selectedEnvironment?: string;
  schema?: Array<{ name: string; type: string }>;
  onExecute?: () => void;
  theme?: 'dark' | 'light';
  readOnly?: boolean;
}

// SSR-Safe SQL Editor with tiSQL extensions
const EnhancedSQLEditor = dynamic(
  () => import('@tidbcloud/tisqleditor-react').then(async (mod) => {
    const { curSqlGutter } = await import('@tidbcloud/codemirror-extension-cur-sql-gutter');
    const { sqlAutoCompletion } = await import('@tidbcloud/codemirror-extension-sql-autocomplete');
    const { saveHelper } = await import('@tidbcloud/codemirror-extension-save-helper');
    const { oneDark } = await import('@tidbcloud/codemirror-extension-themes');

    const EditorWrapper = (props: any) => {
      const {
        doc,
        theme,
        selectedCatalog,
        selectedEnvironment,
        onSave,
        editorRef
      } = props;

      const extensions = useMemo(() => {
        const exts = [
          curSqlGutter(),
          sqlAutoCompletion(),
          saveHelper({
            save: (view) => {
              if (onSave) {
                onSave();
              }
            }
          })
        ];
        return exts;
      }, [onSave]);

      return (
        <mod.EditorCacheProvider>
          <mod.SQLEditor
            key={`tisql-editor-${selectedCatalog}-${selectedEnvironment}`}
            editorId={`tisql-editor-${selectedCatalog}-${selectedEnvironment}`}
            doc={doc}
            theme={theme === 'dark' ? oneDark : undefined}
            extraExts={extensions}
            className="h-full"
            ref={editorRef}
          />
        </mod.EditorCacheProvider>
      );
    };

    return { default: EditorWrapper };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] rounded border border-dashed border-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading SQL Editor...</p>
        </div>
      </div>
    )
  }
);

export function TiSQLEditor({
  sql,
  onChange,
  selectedCatalog = 'iceberg',
  selectedEnvironment = 'development',
  schema = [],
  onExecute,
  theme = 'dark',
  readOnly = false
}: TiSQLEditorProps) {
  const editorRef = useRef<any>(null);

  const handleSave = () => {
    // Trigger save action if needed
    if (onExecute) {
      onExecute();
    }
  };

  return (
    <div className="h-full w-full">
      <EnhancedSQLEditor
        doc={sql}
        theme={theme}
        selectedCatalog={selectedCatalog}
        selectedEnvironment={selectedEnvironment}
        onSave={handleSave}
        editorRef={editorRef}
      />
    </div>
  );
}
