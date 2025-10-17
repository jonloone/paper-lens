/**
 * Shared types for SQL Workstation components
 */

import type { Message } from 'ai';

export interface SQLContext {
  catalog: string;
  schema: string;
  selectedTables: Table[];
  currentSQL?: string;
  environment?: 'development' | 'staging' | 'production';
}

export interface Table {
  name: string;
  catalog: string;
  schema: string;
  columns?: Column[];
  rowCount?: number;
  sizeBytes?: number;
}

export interface Column {
  name: string;
  type: string;
  nullable?: boolean;
  description?: string;
}

export interface Artifact {
  id: string;
  type: 'sql' | 'dbt' | 'code' | 'table' | 'chart';
  language?: string;
  content: string;
  title?: string;
  metadata?: Record<string, any>;
}

export interface ArtifactAction {
  type: 'copy' | 'run' | 'edit' | 'download' | 'insert';
  label: string;
  onClick?: () => void;
}

export type { Message };
