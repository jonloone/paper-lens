// Phase 1: Enhanced Quality Metrics Types

export interface QualityBreakdown {
  completeness: QualityMetric;
  uniqueness: QualityMetric;
  freshness: FreshnessMetric;
  validity: QualityMetric;
  overallScore: number;
}

export interface QualityMetric {
  score: number; // 0-100
  status: 'high' | 'medium' | 'low'; // green/yellow/red
  issues?: QualityIssue[];
}

export interface FreshnessMetric extends QualityMetric {
  lastUpdated: string; // ISO timestamp
  expectedFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'batch';
  isStale: boolean;
  updateHistory?: number[]; // sparkline data (last 7 days)
}

export interface QualityIssue {
  column?: string;
  type: 'null' | 'duplicate' | 'outlier' | 'format' | 'stale';
  count: number;
  percentage: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface SampleDataPreview {
  rows: Record<string, any>[];
  columns: string[];
  totalRows: number;
  sampleSize: number;
  executionTimeMs?: number;
}

export interface ColumnProfile {
  name: string;
  dataType: string;
  cardinality: number;
  nullPercentage: number;
  uniquePercentage: number;
  topValues?: Array<{ value: any; count: number; percentage: number }>;
  distribution?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    histogram?: Array<{ bucket: string; count: number }>;
  };
  formatPattern?: string;
  isPII: boolean;
  isKey: boolean;
}

// Helper functions
export function getQualityColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

export function getQualityBgColor(score: number): string {
  if (score >= 90) return 'bg-green-50 border-green-200';
  if (score >= 70) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

export function getQualityStatus(score: number): 'high' | 'medium' | 'low' {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

export function getQualityIcon(status: 'high' | 'medium' | 'low'): string {
  switch (status) {
    case 'high': return '✅';
    case 'medium': return '⚠️';
    case 'low': return '❌';
  }
}

export function formatUpdateFrequency(frequency: string): string {
  const map: Record<string, string> = {
    'real-time': 'Real-time',
    'hourly': 'Every hour',
    'daily': 'Daily',
    'weekly': 'Weekly',
    'batch': 'Batch updates'
  };
  return map[frequency] || frequency;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
