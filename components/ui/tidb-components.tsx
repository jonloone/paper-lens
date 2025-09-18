'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Client-side wrapper for TiDB SQL Editor
export const TiDBSQLEditor = dynamic(
  () => import('@tidbcloud/tisqleditor-react').then(mod => {
    const SQLEditorWrapper = (props: any) => {
      const { SQLEditor } = mod;
      return <SQLEditor {...props} />;
    };
    return { default: SQLEditorWrapper };
  }),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted h-64 w-full rounded-lg">Loading SQL Editor...</div>
  }
);

// Simple placeholder for AI Widget (not working due to navigator issues)
export const TiDBAIWidget = ({ onApply, ...props }: any) => {
  return (
    <div className="p-4 border border-dashed border-muted-foreground/50 rounded-lg text-center text-muted-foreground">
      <p className="text-sm">AI Widget temporarily disabled</p>
      <p className="text-xs mt-1">Due to SSR compatibility issues</p>
    </div>
  );
};

// Export type-safe props interfaces
export interface TiDBAIWidgetProps {
  onApply?: (suggestion: string) => void;
  [key: string]: any;
}

export interface TiDBSQLEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: string | number;
  [key: string]: any;
}