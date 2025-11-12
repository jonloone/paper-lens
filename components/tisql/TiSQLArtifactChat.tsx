'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Sparkles, Send, Copy, RotateCcw, Check, Code2, Loader2, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResultsArtifactCard } from '@/components/build/ResultsArtifactCard';
import { QualityGatesCard } from '@/components/build/QualityGatesCard';
import { DBTModelEditorCard } from '@/components/build/DBTModelEditorCard';
import { ThresholdConfigModal } from '@/components/build/ThresholdConfigModal';
import { PreviewResult } from '@/components/build/ResultsPreviewPanel';
import { QualitySummary, QualityCheck } from '@/components/build/QualitySummaryPanel';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { DomainSelector } from './DomainSelector';
import { Domain, filterSourcesByDomain, getDomainById } from '@/lib/data/tisql-domains';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'sql-generation' | 'conversation'; // NEW: Message classification
  artifact?: {
    sql?: string;
    explanation?: string;
    isExecuting?: boolean;
    results?: any;
    quality?: any;
    qualityCardId?: string; // ID of spawned quality card
  };
}

interface QualityCard {
  id: string;
  quality: any;
  sourceMessageId: string;
  timestamp: number;
}

interface EditorCard {
  id: string;
  sql: string;
  modelName: string;
  sourceMessageId: string;
  timestamp: number;
}

interface TiSQLArtifactChatProps {
  availableSources: Array<{
    id: string;
    name: string;
    schema: string;
    columns: Array<{ name: string; type: string; description?: string }>;
  }>;
  productDefinition?: {
    name: string;
    description: string;
    domain?: string;
  };
  onSQLGenerated?: (sql: string) => void;
  onQueryResults?: (results: { columns: string[]; rows: any[][]; rowCount: number; executionTimeMs: number }) => void;
  onContinue?: () => void;
  initialSQL?: string;
  initialResults?: any;
  initialQuality?: any;
  className?: string;
  autoLoadPatterns?: boolean; // If true, automatically load AI pattern suggestions on mount (default: false)
  showPatternsButton?: boolean; // If true, show "Get AI Suggestions" button for manual trigger (default: false)
  hideHeader?: boolean; // If true, hide the chat header (default: false)
  chatOnly?: boolean; // If true, only show chat interface without artifact cards (default: false)
  initialDomain?: string; // If provided, use this domain instead of managing internally (for external control)
  activeViewMode?: 'results' | 'editor'; // Current view mode (Results or Editor tab)
  currentSQL?: string; // Live SQL content from the editor
  isEditorActive?: boolean; // Whether the user is currently in Editor mode
}

interface SQLArtifact {
  sql: string;
  explanation: string;
  assumptions: string[];
  confidence: number;
  warnings: string[];
}

interface PatternSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  tables: string[];
  samplePrompt: string;
}

export function TiSQLArtifactChat({
  availableSources,
  productDefinition,
  onSQLGenerated,
  onQueryResults,
  onContinue,
  className,
  autoLoadPatterns = false,
  showPatternsButton = false,
  hideHeader = false,
  chatOnly = false,
  initialDomain,
  activeViewMode,
  currentSQL,
  isEditorActive
}: TiSQLArtifactChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sqlArtifact, setSQLArtifact] = useState<SQLArtifact | null>(null);
  const [copied, setCopied] = useState(false);
  const [patterns, setPatterns] = useState<PatternSuggestion[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(autoLoadPatterns); // Only show loading if auto-loading
  const [patternsRequested, setPatternsRequested] = useState(false); // Track manual pattern requests
  const [qualityCards, setQualityCards] = useState<QualityCard[]>([]);
  const [editorCards, setEditorCards] = useState<EditorCard[]>([]);
  const [hiddenResults, setHiddenResults] = useState<Set<string>>(new Set());
  const [showResultsHistory, setShowResultsHistory] = useState(false); // NEW: Show all results vs latest only
  const [showAdvanced, setShowAdvanced] = useState(false); // NEW: Toggle for showing/hiding SQL and technical details
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [thresholdConfig, setThresholdConfig] = useState({
    completeness: 95,
    uniqueness: 50,
    validity: 95,
    nullPercentage: 5
  });
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Domain selection state (use initialDomain if provided, otherwise default to 'all')
  const [selectedDomain, setSelectedDomain] = useState<string>(initialDomain || 'all');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);

  // Sync selectedDomain when initialDomain changes (for external control)
  useEffect(() => {
    if (initialDomain !== undefined) {
      setSelectedDomain(initialDomain);
    }
  }, [initialDomain]);

  // Progressive loading messages
  const loadingMessages = [
    { main: 'Analyzing your data sources...', sub: 'Reading table schemas and metadata' },
    { main: 'Understanding connections...', sub: 'Mapping relationships between tables' },
    { main: 'Identifying patterns...', sub: 'Detecting common query opportunities' },
    { main: 'Preparing insights...', sub: 'Generating intelligent suggestions' }
  ];

  // Helper function to remove SQL code blocks from message content
  const removeSQLCodeBlocks = (content: string): string => {
    return content.replace(/```sql\n[\s\S]*?\n```/g, '').trim();
  };

  // Filter available sources based on selected domain
  const filteredSources = useMemo(() => {
    if (!selectedDomain || selectedDomain === 'all') {
      return availableSources;
    }
    return filterSourcesByDomain(availableSources, selectedDomain);
  }, [availableSources, selectedDomain]);

  // Execute SQL query and generate quality summary
  const executeQueryAndPopulateArtifact = async (
    sql: string,
    messageId: string
  ): Promise<void> => {
    // Set executing state with visual feedback
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? {
              ...m,
              artifact: {
                sql,
                explanation: m.content.split('```sql')[0].trim(),
                isExecuting: true
              }
            }
          : m
      )
    );

    // Add a temporary "Executing..." message for user feedback
    const executingMsgId = `executing-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: executingMsgId,
      role: 'assistant',
      content: '⏳ Executing SQL query...'
    }]);

    try {
      // Derive catalog and schema from selected domain
      const currentDomain = getDomainById(selectedDomain);
      let catalog = 'iceberg';
      let schema = 'production';

      // Extract catalog and schema from domain schemas if available
      if (currentDomain && currentDomain.schemas.length > 0 && currentDomain.id !== 'all') {
        // Use first schema as default, parse format: catalog.schema.*
        const firstSchema = currentDomain.schemas[0];
        const parts = firstSchema.split('.');

        if (parts.length >= 2) {
          catalog = parts[0]; // e.g., 'bronze', 'silver', 'gold', 'lakehouse', 'nexusone'
          schema = parts[1].replace('*', ''); // Remove wildcard

          // Map lakehouse catalog to iceberg (our backend catalog)
          if (catalog === 'lakehouse') {
            catalog = 'iceberg';
          }
        }
      }

      // Execute preview
      const response = await fetch('/api/tisql/preview-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql,
          catalog,
          schema,
          limit: 100,
          domainId: selectedDomain
        })
      });

      const data = await response.json();

      // Remove executing message
      setMessages(prev => prev.filter(m => m.id !== executingMsgId));

      if (data.success) {
        const previewResult: PreviewResult = {
          columns: data.columns || [],
          rows: data.rows || [],
          rowCount: data.rowCount || 0,
          executionTimeMs: data.executionTimeMs || 0,
          limited: data.limited || false,
          bytesProcessed: data.bytesProcessed,
          profiling: data.profiling
        };

        // Generate quality summary
        const qualitySummary = await generateQualitySummary(data);

        // Update message with artifact
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? {
                  ...m,
                  artifact: {
                    sql,
                    explanation: m.content.split('```sql')[0].trim(),
                    isExecuting: false,
                    results: previewResult,
                    quality: qualitySummary
                  }
                }
              : m
          )
        );

        // Pass results to parent component
        if (onQueryResults) {
          console.log('[TiSQLArtifactChat] Passing query results to parent:', {
            columns: data.columns?.length,
            rows: data.rows?.length,
            rowCount: data.rowCount
          });
          onQueryResults({
            columns: data.columns || [],
            rows: data.rows || [],
            rowCount: data.rowCount || 0,
            executionTimeMs: data.executionTimeMs || 0
          });
        }

        // Generate data audit showing what was loaded
        const audit = generateDataAudit(sql, data, selectedDomain?.name);
        setMessages(prev => [...prev, {
          id: `success-${Date.now()}`,
          role: 'assistant',
          content: audit
        }]);
      } else {
        // API returned success: false
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ Query execution failed: ${data.error || 'Unknown error'}. Please check your SQL syntax.`
        }]);
      }
    } catch (error) {
      console.error('Query execution error:', error);

      // Remove executing message
      setMessages(prev => prev.filter(m => m.id !== executingMsgId));

      // Update message to show execution failed
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                artifact: {
                  sql,
                  explanation: m.content.split('```sql')[0].trim(),
                  isExecuting: false
                }
              }
            : m
        )
      );

      // Add error message for user
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Failed to execute query: ${error instanceof Error ? error.message : 'Network error'}. Please try again.`
      }]);
    }
  };

  // Generate data audit message showing what data was loaded
  const generateDataAudit = (sql: string, data: any, domainName?: string): string => {
    const { columns = [], rows = [], rowCount = 0 } = data;
    const { extractSQLMetadata, calculateDataConfidence } = require('@/lib/utils/sql-metadata-extractor');

    // Extract table and column information from SQL
    const metadata = extractSQLMetadata(sql);
    const confidence = calculateDataConfidence(rowCount);

    // Build audit message in markdown
    const confidenceIcon = confidence.level === 'high' ? '✓' : confidence.level === 'medium' ? '⚠' : '✗';
    const confidenceColor = confidence.level === 'high' ? 'text-green-600' : confidence.level === 'medium' ? 'text-yellow-600' : 'text-red-600';

    let auditMessage = `**Data Sources Loaded**\n\n`;

    // List tables
    if (metadata.tables.length > 0) {
      metadata.tables.forEach(table => {
        auditMessage += `• **Table**: \`${table}\` (${columns.length} columns, ${rowCount.toLocaleString()} rows)\n`;
      });
    } else {
      auditMessage += `• **Columns**: ${columns.length} (${rowCount.toLocaleString()} rows)\n`;
    }

    auditMessage += `\n**Quality Assessment**\n\n`;
    auditMessage += `• **Confidence**: ${confidenceIcon} ${confidence.level.charAt(0).toUpperCase() + confidence.level.slice(1)} (${confidence.message})\n`;
    auditMessage += `• **Coverage**: ${rowCount > 0 ? '100%' : '0%'} of requested data returned\n`;

    if (domainName) {
      auditMessage += `• **Domain**: ${domainName}\n`;
    }

    if (metadata.estimatedComplexity !== 'simple') {
      auditMessage += `• **Query Complexity**: ${metadata.estimatedComplexity.charAt(0).toUpperCase() + metadata.estimatedComplexity.slice(1)}\n`;
    }

    return auditMessage;
  };

  // Generate quality summary from preview results
  const generateQualitySummary = async (previewData: any): Promise<QualitySummary> => {
    const totalRows = previewData.rowCount || 0;
    const columns = previewData.columns || [];
    const rows = previewData.rows || [];

    // Calculate basic quality metrics
    let nullCount = 0;
    const uniqueValues = new Map<number, Set<any>>();

    rows.forEach((row: any[]) => {
      row.forEach((cell, colIndex) => {
        if (cell === null || cell === undefined) {
          nullCount++;
        }
        if (!uniqueValues.has(colIndex)) {
          uniqueValues.set(colIndex, new Set());
        }
        uniqueValues.get(colIndex)?.add(cell);
      });
    });

    const totalCells = rows.length * columns.length;
    const completeness = totalCells > 0 ? ((totalCells - nullCount) / totalCells) * 100 : 100;

    // Calculate uniqueness (average across columns)
    let uniquenessSum = 0;
    uniqueValues.forEach((values) => {
      const uniquenessRatio = rows.length > 0 ? (values.size / rows.length) * 100 : 100;
      uniquenessSum += uniquenessRatio;
    });
    const uniqueness = columns.length > 0 ? uniquenessSum / columns.length : 100;

    // Generate quality checks
    const checks: QualityCheck[] = [
      {
        id: 'check-1',
        name: 'Row Count',
        status: totalRows > 0 ? 'pass' : 'fail',
        message: `Query returned ${totalRows.toLocaleString()} rows`,
        metric: totalRows
      },
      {
        id: 'check-2',
        name: 'Column Completeness',
        status: completeness >= 95 ? 'pass' : completeness >= 80 ? 'warning' : 'fail',
        message: `${completeness.toFixed(1)}% of cells have values`,
        metric: completeness,
        threshold: 95
      },
      {
        id: 'check-3',
        name: 'Data Uniqueness',
        status: uniqueness >= 50 ? 'pass' : 'warning',
        message: `Average ${uniqueness.toFixed(1)}% unique values per column`,
        metric: uniqueness
      },
      {
        id: 'check-4',
        name: 'Null Values',
        status: nullCount === 0 ? 'pass' : nullCount < totalCells * 0.05 ? 'warning' : 'fail',
        message: `${nullCount} null values found (${((nullCount / totalCells) * 100).toFixed(1)}%)`,
        metric: nullCount
      }
    ];

    // Calculate overall score
    const passCount = checks.filter(c => c.status === 'pass').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    const overallScore = ((passCount * 100 + warningCount * 70) / checks.length);

    return {
      overallScore: Math.round(overallScore),
      checks,
      completeness: Math.round(completeness),
      uniqueness: Math.round(uniqueness),
      validity: 100,
      nullCount,
      totalRows
    };
  };

  // Cycle through loading messages
  useEffect(() => {
    if (!patternsLoading) return;

    const interval = setInterval(() => {
      setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 800); // Change message every 800ms

    return () => clearInterval(interval);
  }, [patternsLoading, loadingMessages.length]);

  // Load pattern suggestions on mount (only if autoLoadPatterns is true)
  useEffect(() => {
    async function loadPatterns() {
      setPatternsLoading(true);
      try {
        const response = await fetch('/api/tisql/analyze-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sources: availableSources }),
        });

        if (!response.ok) throw new Error('Failed to analyze sources');

        const data = await response.json();
        setPatterns(data.patterns || []);

        // Create context-aware welcome message with metadata for better rendering
        const productContext = productDefinition?.name
          ? `for your **${productDefinition.name}** product`
          : 'for your data product';
        const domainContext = productDefinition?.domain
          ? ` in the ${productDefinition.domain} domain`
          : '';

        const welcomeMessage = data.patterns && data.patterns.length > 0
          ? `I've analyzed your data sources ${productContext}${domainContext}.\n\nHere are some insights you can explore:`
          : `I'm ready to help you build queries ${productContext}.\n\nAsk me anything about your data!`;

        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: welcomeMessage,
          },
        ]);
      } catch (error) {
        console.error('Pattern loading error:', error);

        // Fallback welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `I'm ready to help you explore your data sources. What would you like to query?`,
          },
        ]);
      } finally {
        setPatternsLoading(false);
      }
    }

    if (availableSources && availableSources.length > 0) {
      // Auto-load patterns if enabled, or if manually requested
      if (autoLoadPatterns || patternsRequested) {
        loadPatterns();
      } else {
        // Show simple welcome message without loading patterns
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Ready to explore your data. Ask me anything or write SQL queries directly.`,
          },
        ]);
        setPatternsLoading(false);
      }
    }
  }, [availableSources, autoLoadPatterns, patternsRequested]);

  // Fetch available domains on mount
  useEffect(() => {
    async function fetchDomains() {
      try {
        const response = await fetch('/api/tisql/domains');
        if (!response.ok) throw new Error('Failed to fetch domains');

        const data = await response.json();
        if (data.success && data.domains) {
          setDomains(data.domains);
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
        // Set empty domains array on error, component will handle gracefully
        setDomains([]);
      } finally {
        setDomainsLoading(false);
      }
    }

    fetchDomains();
  }, []); // Run once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[TiSQLChat] handleSubmit called with input:', input);
    if (!input.trim() || isLoading) {
      console.log('[TiSQLChat] Submission blocked - input empty or loading:', { input: input.trim(), isLoading });
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    console.log('[TiSQLChat] Sending message to API:', userMessage);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get current preview context from the latest message with results
      const latestResult = messages.find(m => m.artifact?.results);
      const currentPreview = latestResult
        ? {
            sql: latestResult.artifact?.sql,
            columns: latestResult.artifact?.results?.columns,
            rowCount: latestResult.artifact?.results?.rowCount,
          }
        : null;

      // Get current domain context
      const currentDomain = getDomainById(selectedDomain);

      const response = await fetch('/api/tisql/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          currentPreview,
          domainContext: currentDomain ? {
            id: currentDomain.id,
            name: currentDomain.name,
            schemas: currentDomain.schemas,
            keyMetrics: currentDomain.keyMetrics,
            commonQueries: currentDomain.commonQueries,
          } : null,
          editorContext: isEditorActive ? {
            mode: activeViewMode,
            currentSQL: currentSQL,
            isActive: isEditorActive,
          } : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = `assistant-${Date.now()}`;

      // Add empty assistant message
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const data = JSON.parse(line.slice(2));
              if (data && typeof data === 'string') {
                assistantContent += data;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }

      // Extract SQL and classify message type
      console.log('[TiSQLChat] Attempting SQL extraction from response length:', assistantContent.length);
      console.log('[TiSQLChat] Response preview:', assistantContent.substring(0, 200));
      console.log('[TiSQLChat] Contains ```sql?', assistantContent.includes('```sql'));

      const sqlMatch = assistantContent.match(/```sql\n([\s\S]*?)\n```/);
      console.log('[TiSQLChat] SQL regex match result:', sqlMatch ? 'FOUND' : 'NOT FOUND');

      if (sqlMatch) {
        const sql = sqlMatch[1];
        console.log('[TiSQLChat] Extracted SQL length:', sql.length, 'chars');

        // Check if this SQL is a duplicate or very similar to existing
        const existingSQLs = messages
          .filter(m => m.artifact?.sql)
          .map(m => m.artifact!.sql!);

        const isDuplicate = existingSQLs.some(existingSQL =>
          existingSQL.trim() === sql.trim() ||
          // Simple similarity check: normalize whitespace and compare
          existingSQL.replace(/\s+/g, ' ').trim() === sql.replace(/\s+/g, ' ').trim()
        );

        if (!isDuplicate) {
          // This is new SQL - execute it
          const artifact: SQLArtifact = {
            sql,
            explanation: assistantContent.split('```sql')[0].trim(),
            assumptions: [],
            confidence: 0.8,
            warnings: []
          };
          setSQLArtifact(artifact);

          // Notify parent component immediately when SQL is generated
          console.log('[TiSQLArtifactChat] SQL extracted, length:', sql.length);
          console.log('[TiSQLArtifactChat] Calling onSQLGenerated callback');
          if (onSQLGenerated) {
            onSQLGenerated(sql);
            console.log('[TiSQLArtifactChat] onSQLGenerated callback invoked successfully');
          } else {
            console.warn('[TiSQLArtifactChat] onSQLGenerated callback not provided!');
          }

          // Mark as SQL generation type and execute
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, type: 'sql-generation' } : m
            )
          );
          await executeQueryAndPopulateArtifact(sql, assistantId);
        } else {
          // Duplicate SQL detected - just mark as conversation
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, type: 'conversation', content: assistantContent }
                : m
            )
          );
        }
      } else {
        // No SQL in response - pure conversation
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, type: 'conversation' } : m
          )
        );
      }
    } catch (error) {
      console.error('[TiSQLChat] CATCH BLOCK - Chat error:', error);
      console.error('[TiSQLChat] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        },
      ]);
    } finally {
      console.log('[TiSQLChat] FINALLY BLOCK - Setting isLoading to false');
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = () => {
    if (sqlArtifact?.sql) {
      navigator.clipboard.writeText(sqlArtifact.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplyToEditor = () => {
    if (sqlArtifact?.sql && onSQLGenerated) {
      onSQLGenerated(sqlArtifact.sql);
    }
  };

  const handleReExecuteQuery = async (messageId: string, sql: string) => {
    // Mark artifact as executing
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId && m.artifact
          ? {
              ...m,
              artifact: { ...m.artifact, isExecuting: true }
            }
          : m
      )
    );

    // Re-execute query
    await executeQueryAndPopulateArtifact(sql, messageId);
  };

  const handleSpawnQualityCard = (messageId: string, quality: QualitySummary) => {
    const newCard: QualityCard = {
      id: `quality-${Date.now()}`,
      quality,
      sourceMessageId: messageId,
      timestamp: Date.now()
    };

    setQualityCards(prev => [...prev, newCard]);

    // Update message to track spawned card
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId && m.artifact
          ? {
              ...m,
              artifact: { ...m.artifact, qualityCardId: newCard.id }
            }
          : m
      )
    );
  };

  const handleSpawnEditorCard = (messageId: string, sql: string) => {
    const newCard: EditorCard = {
      id: `editor-${Date.now()}`,
      sql,
      modelName: `model_${Date.now()}`,
      sourceMessageId: messageId,
      timestamp: Date.now()
    };

    setEditorCards(prev => [...prev, newCard]);
  };

  const handleSaveModel = (editorId: string, sql: string, modelName: string) => {
    console.log('Saving model:', { editorId, modelName, sql });
    // TODO: Implement actual dbt model save to git

    // Auto-close editor card after save
    setEditorCards(prev => prev.filter(card => card.id !== editorId));
  };

  const handleRunFromEditor = async (sql: string) => {
    // Create a new user message and execute the query
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `Run this dbt model:\n\n${sql}`,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Auto-execute as if it was a normal query
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: 'Executing dbt model...'
    }]);

    try {
      // Extract the actual SELECT from dbt model
      const selectMatch = sql.match(/select[\s\S]*$/mi);
      const cleanSQL = selectMatch ? selectMatch[0] : sql;

      await executeQueryAndPopulateArtifact(cleanSQL, assistantId);
    } catch (error) {
      console.error('Run error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatternClick = async (pattern: PatternSuggestion) => {
    // Simulate user clicking on pattern card
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: pattern.samplePrompt,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get current preview context from the latest message with results
      const latestResult = messages.find(m => m.artifact?.results);
      const currentPreview = latestResult
        ? {
            sql: latestResult.artifact?.sql,
            columns: latestResult.artifact?.results?.columns,
            rowCount: latestResult.artifact?.results?.rowCount,
          }
        : null;

      // Get current domain context
      const currentDomain = getDomainById(selectedDomain);

      const response = await fetch('/api/tisql/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          currentPreview,
          domainContext: currentDomain ? {
            id: currentDomain.id,
            name: currentDomain.name,
            schemas: currentDomain.schemas,
            keyMetrics: currentDomain.keyMetrics,
            commonQueries: currentDomain.commonQueries,
          } : null,
          editorContext: isEditorActive ? {
            mode: activeViewMode,
            currentSQL: currentSQL,
            isActive: isEditorActive,
          } : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = `assistant-${Date.now()}`;

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const data = JSON.parse(line.slice(2));
              if (data && typeof data === 'string') {
                assistantContent += data;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }

      // Extract SQL and classify message type
      console.log('[TiSQLChat] Attempting SQL extraction from response length:', assistantContent.length);
      console.log('[TiSQLChat] Response preview:', assistantContent.substring(0, 200));
      console.log('[TiSQLChat] Contains ```sql?', assistantContent.includes('```sql'));

      const sqlMatch = assistantContent.match(/```sql\n([\s\S]*?)\n```/);
      console.log('[TiSQLChat] SQL regex match result:', sqlMatch ? 'FOUND' : 'NOT FOUND');

      if (sqlMatch) {
        const sql = sqlMatch[1];
        console.log('[TiSQLChat] Extracted SQL length:', sql.length, 'chars');

        // Check if this SQL is a duplicate or very similar to existing
        const existingSQLs = messages
          .filter(m => m.artifact?.sql)
          .map(m => m.artifact!.sql!);

        const isDuplicate = existingSQLs.some(existingSQL =>
          existingSQL.trim() === sql.trim() ||
          // Simple similarity check: normalize whitespace and compare
          existingSQL.replace(/\s+/g, ' ').trim() === sql.replace(/\s+/g, ' ').trim()
        );

        if (!isDuplicate) {
          // This is new SQL - execute it
          const artifact: SQLArtifact = {
            sql,
            explanation: assistantContent.split('```sql')[0].trim(),
            assumptions: [],
            confidence: 0.8,
            warnings: []
          };
          setSQLArtifact(artifact);

          // Notify parent component immediately when SQL is generated
          console.log('[TiSQLArtifactChat] SQL extracted, length:', sql.length);
          console.log('[TiSQLArtifactChat] Calling onSQLGenerated callback');
          if (onSQLGenerated) {
            onSQLGenerated(sql);
            console.log('[TiSQLArtifactChat] onSQLGenerated callback invoked successfully');
          } else {
            console.warn('[TiSQLArtifactChat] onSQLGenerated callback not provided!');
          }

          // Mark as SQL generation type and execute
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, type: 'sql-generation' } : m
            )
          );
          await executeQueryAndPopulateArtifact(sql, assistantId);
        } else {
          // Duplicate SQL detected - just mark as conversation
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, type: 'conversation', content: assistantContent }
                : m
            )
          );
        }
      } else {
        // No SQL in response - pure conversation
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, type: 'conversation' } : m
          )
        );
      }
    } catch (error) {
      console.error('Pattern generation error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error generating SQL for this pattern. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Close handlers for cards
  const handleCloseQuality = (cardId: string) => {
    setQualityCards(prev => prev.filter(c => c.id !== cardId));
    // Clear qualityCardId from source message so badge becomes clickable again
    setMessages(prev =>
      prev.map(m =>
        m.artifact?.qualityCardId === cardId
          ? { ...m, artifact: { ...m.artifact, qualityCardId: undefined }}
          : m
      )
    );
  };

  const handleCloseEditor = (cardId: string) => {
    setEditorCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleCloseResult = (messageId: string) => {
    setHiddenResults(prev => new Set(prev).add(messageId));
  };

  // If chatOnly mode, render just the chat interface
  if (chatOnly) {
    console.log('[TiSQLChat] Rendering in chatOnly mode, current input:', input, 'isLoading:', isLoading);
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex flex-col rounded-2xl border border-border bg-white dark:bg-gray-950 shadow-lg overflow-hidden">
          {/* Chat Header */}
          {!hideHeader && (
            <div className="px-4 py-3 border-b border-border bg-elevation-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Domain Selector */}
                  {!domainsLoading && domains.length > 0 && (
                    <DomainSelector
                      selectedDomain={selectedDomain}
                      onDomainChange={setSelectedDomain}
                      domains={domains}
                      compact={false}
                    />
                  )}
                  {/* Get AI Suggestions Button (only if enabled and not loaded) */}
                  {showPatternsButton && !patternsRequested && patterns.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPatternsRequested(true)}
                      className="h-7 gap-2 text-xs"
                      disabled={patternsLoading}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Get AI Suggestions
                    </Button>
                  )}
                  {/* Advanced Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                      "h-7 gap-2 text-xs transition-colors",
                      showAdvanced ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    {showAdvanced ? 'Hide SQL' : 'Show SQL'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-3">
            {/* Show loading indicator before any messages exist */}
            {messages.length === 0 && patternsLoading && (
              <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                  <Sparkles className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
                  <div className="flex-1 transition-all duration-300">
                    <p className="text-sm font-medium text-foreground animate-in fade-in duration-300">
                      {loadingMessages[currentLoadingMessage].main}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 animate-in fade-in duration-300">
                      {loadingMessages[currentLoadingMessage].sub}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm",
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-8'
                      : 'bg-elevation-1 border border-border text-foreground mr-8'
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {message.role === 'assistant' ? (
                      <MarkdownRenderer
                        content={removeSQLCodeBlocks(message.content)}
                        className="text-sm"
                      />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>

                {/* Show loading indicator while analyzing data */}
                {message.id === 'welcome' && patternsLoading && (
                  <div className="mt-3 p-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent animate-in fade-in duration-500">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                      <Sparkles className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
                      <div className="flex-1 transition-all duration-300">
                        <p className="text-sm font-medium text-foreground animate-in fade-in duration-300">
                          {loadingMessages[currentLoadingMessage].main}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 animate-in fade-in duration-300">
                          {loadingMessages[currentLoadingMessage].sub}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show pattern cards after welcome message */}
                {message.id === 'welcome' && !patternsLoading && patterns.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {patterns.slice(0, 4).map((pattern) => {
                      // Get icon component dynamically
                      const IconComponent = (Icons as any)[pattern.icon] || Icons.Database;

                      return (
                        <button
                          key={pattern.id}
                          onClick={() => handlePatternClick(pattern)}
                          disabled={isLoading}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border border-border",
                            "bg-white dark:bg-gray-950 hover:bg-elevation-1",
                            "transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "group"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30",
                              "group-hover:from-primary/30 group-hover:to-primary/20 transition-colors"
                            )}>
                              <IconComponent className="w-4 h-4 text-primary" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-foreground">
                                  {pattern.title}
                                </span>
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded-md",
                                  pattern.estimatedComplexity === 'simple'
                                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                    : pattern.estimatedComplexity === 'moderate'
                                    ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                                )}>
                                  {pattern.estimatedComplexity}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {pattern.description}
                              </p>
                              {pattern.tables.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                  {pattern.tables.slice(0, 2).map((table, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-1.5 py-0.5 rounded bg-elevation-1 text-muted-foreground font-mono"
                                    >
                                      {table}
                                    </span>
                                  ))}
                                  {pattern.tables.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{pattern.tables.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {patterns.length > 4 && (
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">
                          +{patterns.length - 4} more patterns available
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground px-3 py-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-elevation-0">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => {
                  console.log('[TiSQLChat chatOnly] Input changed:', e.target.value);
                  setInput(e.target.value);
                }}
                placeholder="Ask about your data..."
                className="min-h-[60px] resize-none rounded-xl text-sm pr-10"
                onKeyDown={(e) => {
                  console.log('[TiSQLChat chatOnly] Key pressed:', e.key, 'shiftKey:', e.shiftKey);
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('[TiSQLChat chatOnly] Enter pressed without shift, calling handleSubmit');
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="absolute bottom-2 right-2 h-7 w-7 p-0 rounded-lg"
                onClick={() => console.log('[TiSQLChat chatOnly] Send button clicked')}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Threshold Configuration Modal */}
        <ThresholdConfigModal
          open={showThresholdConfig}
          onClose={() => setShowThresholdConfig(false)}
          onSave={(config) => {
            setThresholdConfig(config);
            console.log('Updated thresholds:', config);
          }}
          currentConfig={thresholdConfig}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full gap-6", className)}>
      {/* Compact Chat Window - Left Side */}
      <div className="flex flex-col w-[400px] flex-shrink-0">
        <div className="flex-1 flex flex-col rounded-2xl border border-border bg-white dark:bg-gray-950 shadow-lg overflow-hidden">
          {/* Chat Header */}
          {!hideHeader && (
            <div className="px-4 py-3 border-b border-border bg-elevation-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Domain Selector */}
                  {!domainsLoading && domains.length > 0 && (
                    <DomainSelector
                      selectedDomain={selectedDomain}
                      onDomainChange={setSelectedDomain}
                      domains={domains}
                      compact={false}
                    />
                  )}
                  {/* Get AI Suggestions Button (only if enabled and not loaded) */}
                  {showPatternsButton && !patternsRequested && patterns.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPatternsRequested(true)}
                      className="h-7 gap-2 text-xs"
                      disabled={patternsLoading}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Get AI Suggestions
                    </Button>
                  )}
                  {/* Advanced Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                      "h-7 gap-2 text-xs transition-colors",
                      showAdvanced ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    {showAdvanced ? 'Hide SQL' : 'Show SQL'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-3">
            {/* Show loading indicator before any messages exist */}
            {messages.length === 0 && patternsLoading && (
              <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                  <Sparkles className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
                  <div className="flex-1 transition-all duration-300">
                    <p className="text-sm font-medium text-foreground animate-in fade-in duration-300">
                      {loadingMessages[currentLoadingMessage].main}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 animate-in fade-in duration-300">
                      {loadingMessages[currentLoadingMessage].sub}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm",
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-8'
                      : 'bg-elevation-1 border border-border text-foreground mr-8'
                  )}
                >
                  <div className="whitespace-pre-wrap">
                    {message.role === 'assistant' ? (
                      <MarkdownRenderer
                        content={removeSQLCodeBlocks(message.content)}
                        className="text-sm"
                      />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>

                {/* Show loading indicator while analyzing data */}
                {message.id === 'welcome' && patternsLoading && (
                  <div className="mt-3 p-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent animate-in fade-in duration-500">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                      <Sparkles className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
                      <div className="flex-1 transition-all duration-300">
                        <p className="text-sm font-medium text-foreground animate-in fade-in duration-300">
                          {loadingMessages[currentLoadingMessage].main}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 animate-in fade-in duration-300">
                          {loadingMessages[currentLoadingMessage].sub}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show pattern cards after welcome message */}
                {message.id === 'welcome' && !patternsLoading && patterns.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {patterns.slice(0, 4).map((pattern) => {
                      // Get icon component dynamically
                      const IconComponent = (Icons as any)[pattern.icon] || Icons.Database;

                      return (
                        <button
                          key={pattern.id}
                          onClick={() => handlePatternClick(pattern)}
                          disabled={isLoading}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border border-border",
                            "bg-white dark:bg-gray-950 hover:bg-elevation-1",
                            "transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "group"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30",
                              "group-hover:from-primary/30 group-hover:to-primary/20 transition-colors"
                            )}>
                              <IconComponent className="w-4 h-4 text-primary" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-foreground">
                                  {pattern.title}
                                </span>
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded-md",
                                  pattern.estimatedComplexity === 'simple'
                                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                    : pattern.estimatedComplexity === 'moderate'
                                    ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                                )}>
                                  {pattern.estimatedComplexity}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {pattern.description}
                              </p>
                              {pattern.tables.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                  {pattern.tables.slice(0, 2).map((table, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-1.5 py-0.5 rounded bg-elevation-1 text-muted-foreground font-mono"
                                    >
                                      {table}
                                    </span>
                                  ))}
                                  {pattern.tables.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{pattern.tables.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {patterns.length > 4 && (
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">
                          +{patterns.length - 4} more patterns available
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground px-3 py-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-elevation-0">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your data..."
                className="min-h-[60px] resize-none rounded-xl text-sm pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="absolute bottom-2 right-2 h-7 w-7 p-0 rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Grid for Artifact Cards - Right Side */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
          {/* Result Cards - Wider (2 columns) */}
          {(() => {
            const resultsMessages = messages.filter(m => m.artifact?.results && !hiddenResults.has(m.id));
            const displayedResults = showResultsHistory ? resultsMessages : resultsMessages.slice(-1);

            return displayedResults.map((message) => (
              <div key={message.id} className="lg:col-span-2 xl:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ResultsArtifactCard
                  results={message.artifact!.results}
                  sql={message.artifact!.sql}
                  quality={message.artifact!.quality}
                  personaConfig={{
                    sqlVisibility: showAdvanced ? 'expanded' : 'hidden',
                    resultsFirst: true
                  }}
                  onExecute={() => {
                    if (message.artifact?.sql) {
                      handleReExecuteQuery(message.id, message.artifact.sql);
                    }
                  }}
                  onViewQuality={message.artifact?.quality && !message.artifact?.qualityCardId
                    ? () => handleSpawnQualityCard(message.id, message.artifact!.quality)
                    : undefined
                  }
                  onEditSQL={message.artifact?.sql
                    ? () => handleSpawnEditorCard(message.id, message.artifact!.sql!)
                    : undefined
                  }
                  onClose={() => handleCloseResult(message.id)}
                  onContinue={onContinue}
                />
              </div>
            ));
          })()}

          {/* History Toggle Button */}
          {(() => {
            const resultsCount = messages.filter(m => m.artifact?.results && !hiddenResults.has(m.id)).length;
            if (resultsCount > 1 && !showResultsHistory) {
              return (
                <div className="lg:col-span-2 xl:col-span-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowResultsHistory(true)}
                    className="w-full gap-2"
                  >
                    <Icons.History className="w-4 h-4" />
                    View Previous Results ({resultsCount - 1})
                  </Button>
                </div>
              );
            }
            return null;
          })()}

          {/* Quality Gate Cards */}
          {qualityCards.map((card) => (
            <div key={card.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <QualityGatesCard
                summary={card.quality}
                onConfigure={() => setShowThresholdConfig(true)}
                onExpand={() => {
                  // TODO: Implement fullscreen quality view
                  console.log('Expand quality report', card.id);
                }}
                onClose={() => handleCloseQuality(card.id)}
              />
            </div>
          ))}

          {/* DBT Editor Cards */}
          {editorCards.map((card) => (
            <div key={card.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DBTModelEditorCard
                initialSQL={card.sql}
                modelName={card.modelName}
                onSave={(sql, name) => handleSaveModel(card.id, sql, name)}
                onRun={handleRunFromEditor}
                onExpand={() => {
                  // TODO: Implement fullscreen editor
                  console.log('Expand editor', card.id);
                }}
                onClose={() => handleCloseEditor(card.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Threshold Configuration Modal */}
      <ThresholdConfigModal
        open={showThresholdConfig}
        onClose={() => setShowThresholdConfig(false)}
        onSave={(config) => {
          setThresholdConfig(config);
          console.log('Updated thresholds:', config);
          // TODO: Re-run quality checks with new thresholds
        }}
        currentConfig={thresholdConfig}
      />
    </div>
  );
}
