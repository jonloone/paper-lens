/**
 * Query Optimization System - Type Definitions
 * Based on deterministic, rules-based ERD architecture
 *
 * Philosophy:
 * - Real data, not LLM guessing
 * - Deterministic rules
 * - Measurable outcomes
 * - Continuous learning
 */

// ============================================================================
// CORE ANALYSIS ENTITIES
// ============================================================================

export interface AnalysisSession {
  sessionId: string;
  queryText: string;
  queryHash: string;
  userId: string;

  // Context
  databaseName?: string;
  schemaName?: string;
  executionContext?: Record<string, any>;

  // Timing
  createdAt: Date;
  analysisStartedAt?: Date;
  analysisCompletedAt?: Date;
  analysisDurationMs?: number;

  // Parsed Query Structure
  parsedAst?: any;
  queryType?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP';
  tablesReferenced?: string[];
  complexityScore?: number;

  // Status
  status: 'parsing' | 'analyzing' | 'completed' | 'failed';
  errorMessage?: string;
  errorType?: string;

  // Results Summary
  findingsCount: number;
  criticalCount: number;
  highPriorityCount: number;

  // Optimization Potential
  estimatedCurrentCostSeconds?: number;
  estimatedOptimizedCostSeconds?: number;
  estimatedImprovementFactor?: number;

  // Metadata
  clientVersion?: string;
  analysisVersion?: string;
}

export interface Rule {
  ruleId: string;
  ruleVersion: number;
  category: RuleCategory;
  name: string;
  description: string;
  severity: RuleSeverity;

  // Applicability
  appliesToQueryTypes: string[];
  requiresContext: string[];

  // Metadata
  createdAt: Date;
  createdBy?: string;
  isActive: boolean;

  // Documentation
  documentationUrl?: string;
  exampleQuery?: string;
  exampleFix?: string;

  // Configuration
  config?: Record<string, any>;
}

export type RuleCategory =
  | 'partitioning'
  | 'joins'
  | 'aggregations'
  | 'safety'
  | 'quality'
  | 'performance';

export type RuleSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export interface RuleExecution {
  executionId: string;
  sessionId: string;
  ruleId: string;

  executedAt: Date;
  executionTimeMs: number;

  ruleApplied: boolean;
  ruleTriggered: boolean;

  contextSnapshot?: Record<string, any>;
  contextQualityId?: string;

  findingId?: string;

  errorOccurred: boolean;
  errorMessage?: string;
}

export interface Finding {
  findingId: string;
  sessionId: string;
  ruleId: string;

  severity: RuleSeverity;
  category: RuleCategory;

  // Description
  title: string;
  description: string;
  locationInQuery?: string;

  // Evidence (CRITICAL: Always grounded in data)
  evidence: Record<string, any>;
  evidenceSource: string;

  // States
  currentState: Record<string, any>;
  recommendedState: Record<string, any>;

  // Impact
  estimatedImpact: {
    reductionFactor?: number;
    dataSavingsGb?: number;
    estimatedSpeedup?: string;
    confidenceLevel: number;
  };

  // Fix
  fixTemplate?: string;
  fixSql?: string;
  canAutoApply: boolean;

  // Confidence (Based on data quality, NOT LLM certainty)
  confidenceScore: number; // 0.0 to 1.0
  confidenceBasis?: string;

  // Priority
  priorityScore?: number;

  createdAt: Date;
}

// ============================================================================
// CONTEXT & DATA QUALITY ENTITIES
// ============================================================================

export interface TableStatistics {
  statId: string;
  tableFqn: string; // catalog.schema.table

  // Statistics
  rowCount?: number;
  totalSizeBytes?: number;
  totalSizeGb?: number;
  fileCount?: number;

  // Partitioning
  isPartitioned: boolean;
  partitionColumn?: string;
  partitionCount?: number;

  // Source & Freshness
  source: string;
  collectedAt: Date;
  sourceTimestamp?: Date;
  stalenessHours?: number;

  // Quality
  isEstimated: boolean;
  confidenceLevel: number;

  // Validity
  validUntil?: Date;
  isValid: boolean;

  metadata?: Record<string, any>;
}

export interface PartitionMetadata {
  partitionId: string;
  tableFqn: string;

  // Iceberg specifics
  snapshotId?: number;
  partitionSpecId?: number;
  partitionSpec: Record<string, any>;

  partitionColumns: string[];
  partitionTransform: string[];
  totalPartitions: number;

  // Size distribution
  avgPartitionSizeGb?: number;
  maxPartitionSizeGb?: number;
  minPartitionSizeGb?: number;

  // Time-based partitioning
  isTemporal: boolean;
  temporalColumn?: string;
  temporalGranularity?: 'day' | 'hour' | 'month' | 'year';

  // Source & Freshness
  source: string;
  collectedAt: Date;
  stalenessHours?: number;

  validUntil?: Date;
  isValid: boolean;
}

export interface ColumnProfile {
  profileId: string;
  tableFqn: string;
  columnName: string;

  // Basic stats
  totalRows?: number;
  nullCount?: number;
  nullPercentage?: number;

  // Cardinality
  distinctCount?: number;
  distinctPercentage?: number;
  cardinalityClass: 'low' | 'medium' | 'high' | 'very_high';

  // Distribution
  topValues?: Array<{value: any; count: number}>;
  valueDistribution?: Record<string, number>;

  dataType: string;

  // Quality
  isUnique: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;

  // Source & Freshness
  source: string;
  profiledAt: Date;
  stalenessHours?: number;

  sampleSize?: number;
  isSampled: boolean;

  validUntil?: Date;
  isValid: boolean;
}

export interface ContextQuality {
  qualityId: string;
  sessionId: string;

  contextType: string;
  entityIdentifier: string;

  // Quality metrics
  dataSource?: string;
  sourceTimestamp?: Date;
  stalenessHours?: number;
  confidenceLevel: number;

  // Indicators
  isEstimated: boolean;
  isStale: boolean;
  isIncomplete: boolean;

  // Impact
  affectsRules: string[];
  degradationLevel: 'none' | 'minor' | 'moderate' | 'severe';

  // Fallback
  usedFallback: boolean;
  fallbackMethod?: string;

  assessedAt: Date;
}

export interface DataSourceHealth {
  healthId: string;
  sourceName: string;
  sourceType: 'mcp_server' | 'api' | 'database';

  checkedAt: Date;
  isAvailable: boolean;
  responseTimeMs?: number;

  status: 'healthy' | 'degraded' | 'unavailable';
  errorMessage?: string;

  affectsRules: string[];
  fallbackAvailable: boolean;

  version?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// HEURISTIC & ESTIMATION ENTITIES
// ============================================================================

export interface HeuristicModel {
  modelId: string;
  modelVersion: number;

  category: string;
  name: string;
  description: string;

  // Model parameters
  parameters: Record<string, any>;

  // Accuracy tracking
  usageCount: number;
  totalErrorPct?: number;
  avgErrorPct?: number;
  lastErrorPct?: number;

  confidenceLevel: number;

  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;

  documentation?: string;
}

export interface HeuristicEstimate {
  estimateId: string;
  sessionId: string;
  findingId?: string;

  modelId: string;
  modelVersion: number;

  inputContext: Record<string, any>;
  missingData: string[];

  estimatedValue: number;
  confidenceIntervalLow?: number;
  confidenceIntervalHigh?: number;
  confidenceLevel: number;

  reasoning?: string;
  assumptions: string[];

  usedInFinding: boolean;
  affectedRecommendation: boolean;

  createdAt: Date;
}

// ============================================================================
// COST ESTIMATION ENTITIES
// ============================================================================

export interface CostEstimate {
  estimateId: string;
  sessionId: string;

  // Scan cost
  dataScannedGb?: number;
  partitionsScanned?: number;
  estimatedRows?: number;

  // Operation costs
  joinCostFactor?: number;
  aggregationMemoryGb?: number;
  sortMemoryGb?: number;

  // Time estimates
  estimatedTimeSeconds?: number;
  timeBreakdown?: Record<string, number>;

  // Cost factors
  costFactors: string[];
  complexityMultiplier?: number;

  // Confidence
  confidenceLevel: number;
  usedHeuristics: boolean;
  heuristicModels: string[];

  estimatedAt: Date;
  modelVersion?: string;
}

export interface CostEstimateOptimized {
  optimizedEstimateId: string;
  sessionId: string;
  originalEstimateId: string;

  appliedFindings: string[];

  // Optimized costs
  dataScannedGb?: number;
  partitionsScanned?: number;
  estimatedRows?: number;
  estimatedTimeSeconds?: number;

  // Improvement
  reductionFactor?: number;
  dataSavingsGb?: number;
  timeSavingsSeconds?: number;
  estimatedSpeedup?: string;

  confidenceLevel: number;

  estimatedAt: Date;
}

// ============================================================================
// OUTCOME TRACKING ENTITIES (Feedback Loop)
// ============================================================================

export interface AppliedFix {
  fixId: string;
  sessionId: string;
  findingId: string;

  userId: string;
  appliedAt: Date;

  fixType: string;
  fixSql?: string;
  fixMethod: 'manual' | 'auto_applied' | 'modified';

  originalQueryId?: string;
  optimizedQueryId?: string;

  notes?: string;
  client?: string;
}

export interface ActualOutcome {
  outcomeId: string;
  fixId: string;

  // Before
  beforeExecutionTimeSeconds?: number;
  beforeDataScannedGb?: number;
  beforeRowsProcessed?: number;
  beforeCost?: number;

  // After
  afterExecutionTimeSeconds?: number;
  afterDataScannedGb?: number;
  afterRowsProcessed?: number;
  afterCost?: number;

  // Actual improvement
  actualTimeImprovementPct?: number;
  actualDataReductionPct?: number;
  actualSpeedupFactor?: number;

  measuredAt: Date;
  measurementSource?: string;

  improvementOccurred: boolean;
  meetsExpectations: boolean;

  metadata?: Record<string, any>;
}

export interface PredictionAccuracy {
  accuracyId: string;
  fixId: string;
  outcomeId: string;
  findingId: string;

  // Predicted
  predictedImprovementFactor?: number;
  predictedDataSavingsGb?: number;
  predictedTimeSavingsSeconds?: number;

  // Actual
  actualImprovementFactor?: number;
  actualDataSavingsGb?: number;
  actualTimeSavingsSeconds?: number;

  // Errors
  improvementFactorErrorPct?: number;
  dataSavingsErrorPct?: number;
  timeSavingsErrorPct?: number;

  overallAccuracyScore: number; // 0.0 to 1.0

  accuracyClass: 'excellent' | 'good' | 'fair' | 'poor';
  predictionQuality: 'overestimate' | 'accurate' | 'underestimate';

  // Root cause
  errorDrivers: string[];
  contributingFactors?: Record<string, any>;

  affectsHeuristics: string[];
  suggestedCorrection?: Record<string, any>;

  calculatedAt: Date;
}

// ============================================================================
// ANALYSIS RESULT (User-facing output)
// ============================================================================

export interface QueryAnalysisResult {
  session: AnalysisSession;
  findings: Finding[];
  costEstimate?: CostEstimate;
  optimizedEstimate?: CostEstimateOptimized;

  // Summary
  summary: {
    totalFindings: number;
    criticalFindings: number;
    potentialSpeedup?: string;
    confidenceLevel: number;
    dataQualityWarnings: string[];
  };

  // Context quality indicators
  contextQuality: {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    warnings: string[];
    missingContext: string[];
  };
}
