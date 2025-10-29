'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SourceSelectionInterface } from './SourceSelectionInterface';
import { TiSQLArtifactChat } from '@/components/tisql/TiSQLArtifactChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, Rocket, Loader2, PencilLine, Target, TrendingUp, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  CodesandboxLogo,
  ClipboardText,
  Sparkle,
  CopySimple,
  PencilSimple,
  Database
} from '@phosphor-icons/react';
import { ProductTemplate } from '@/lib/data/product-templates';
import { cn } from '@/lib/utils';
import { BuildFlowProvider, useBuildFlow, useBuildFlowBusinessContext, ProductData } from '@/contexts/BuildFlowContext';
import { draftAutoSaveService } from '@/lib/services/draft-autosave';
import type { Draft } from '@/lib/services/draft-autosave';
import { BusinessObjectiveSelector } from '@/components/build/BusinessObjectiveSelector';
import { BusinessMetricsPanel } from '@/components/build/BusinessMetricsPanel';
import { BusinessQuestionsCapture } from '@/components/build/BusinessQuestionsCapture';
import { Card } from '@/components/ui/card';

// Re-export ProductData for backward compatibility
export type { ProductData };

interface UnifiedProductWorkspaceProps {
  initialData?: Partial<ProductData>;
  template?: ProductTemplate;
  onDeploy: (data: ProductData) => Promise<void>;
  onSaveDraft: (data: ProductData) => void;
  onBack: () => void;
}

/**
 * Inner component that uses the BuildFlowContext
 * This component has access to all context state and actions
 */
function UnifiedProductWorkspaceInner({
  onDeploy,
  onSaveDraft,
  onBack
}: Pick<UnifiedProductWorkspaceProps, 'onDeploy' | 'onSaveDraft' | 'onBack'>) {
  // Access context
  const {
    productData,
    updateMetadata,
    updateSources,
    updateSQL,
    updateCustomQualityRules,
    updateValidationStatus,
    updatePreviewResult
  } = useBuildFlow();

  // Business context
  const {
    businessObjectives,
    businessMetrics,
    businessQuestions,
    updateBusinessObjectives,
    updateBusinessMetrics,
    updateBusinessQuestions
  } = useBuildFlowBusinessContext();

  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [showBusinessContext, setShowBusinessContext] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Auto-save integration
  useEffect(() => {
    // Start auto-save when workspace mounts
    draftAutoSaveService.startAutoSave(
      () => productData,
      async (draft: Draft) => {
        // Save to localStorage
        try {
          const drafts = JSON.parse(localStorage.getItem('product-drafts') || '[]');
          const existingIndex = drafts.findIndex((d: Draft) => d.id === draft.id);

          if (existingIndex >= 0) {
            drafts[existingIndex] = draft;
          } else {
            drafts.push(draft);
          }

          localStorage.setItem('product-drafts', JSON.stringify(drafts));
          setLastAutoSaveTime(new Date().toLocaleTimeString());

          // Also call the existing save handler
          onSaveDraft(productData);
        } catch (error) {
          console.error('Draft auto-save failed:', error);
        }
      }
    );

    // Cleanup: Stop auto-save when unmounting
    return () => {
      draftAutoSaveService.stopAutoSave();
    };
  }, [productData, onSaveDraft]);

  // Handle SQL generation from AI
  const handleSQLGenerated = useCallback((sql: string) => {
    updateSQL(sql);
  }, [updateSQL]);

  // Handle preview results
  const handlePreviewComplete = useCallback((result: any) => {
    updatePreviewResult(result);
    if (result.qualitySummary) {
      updateValidationStatus(result.qualitySummary);
    }
  }, [updatePreviewResult, updateValidationStatus]);

  // Handle source selection changes
  const handleSourcesChange = useCallback((sources: ProductData['selectedSources']) => {
    updateSources(sources);
  }, [updateSources]);

  // Handle quality rules changes (supports legacy structure for backward compatibility)
  const handleQualityRulesChange = useCallback((rules: ProductData['qualityRules']) => {
    if (rules) {
      updateCustomQualityRules(rules);
    }
  }, [updateCustomQualityRules]);

  // Handle custom quality rules changes
  const handleCustomQualityRulesChange = useCallback((rules: ProductData['customQualityRules']) => {
    updateCustomQualityRules(rules);
  }, [updateCustomQualityRules]);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSaveDraft(productData);
    } finally {
      setIsSaving(false);
    }
  }, [productData, onSaveDraft]);

  // Show review modal if business context exists, otherwise deploy directly
  const handleDeploy = useCallback(() => {
    // Validation
    if (!productData.name.trim()) {
      alert('Please provide a product name');
      return;
    }

    if (!productData.sql.trim() && !productData.previewResult) {
      alert('Please compose your data product first');
      return;
    }

    if (productData.selectedSources.length === 0) {
      alert('Please select at least one data source');
      return;
    }

    // Check if business context exists
    const hasBusinessContext =
      businessObjectives.length > 0 ||
      businessMetrics.length > 0 ||
      businessQuestions.length > 0;

    if (hasBusinessContext) {
      // Show review modal
      setShowReviewModal(true);
    } else {
      // Deploy directly
      performDeploy();
    }
  }, [productData, businessObjectives, businessMetrics, businessQuestions]);

  // Actual deployment function
  const performDeploy = useCallback(async () => {
    setShowReviewModal(false);
    setIsDeploying(true);
    setDeployProgress(0);

    try {
      // Simulate activation progress
      const progressInterval = setInterval(() => {
        setDeployProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      await onDeploy(productData);

      clearInterval(progressInterval);
      setDeployProgress(100);

      // Keep at 100% briefly before resetting
      setTimeout(() => {
        setDeployProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Activation failed:', error);
      alert('Activation failed. Please try again.');
      setDeployProgress(0);
    } finally {
      setIsDeploying(false);
    }
  }, [productData, onDeploy]);

  // Determine which center content to show
  const showSourceSelection = productData.selectedSources.length === 0 && productData.createdFrom !== 'template';
  const showSQLComposer = productData.selectedSources.length > 0;

  return (
    <div className="flex h-screen bg-dot-grid overflow-hidden relative">
      {/* Deployment Progress Bar - Fixed at top */}
      {isDeploying && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress value={deployProgress} className="h-1 rounded-none" />
          <div className="bg-primary/10 backdrop-blur-sm border-b border-primary/20 px-4 py-2">
            <div className="flex items-center gap-3 max-w-7xl mx-auto">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Activating {productData.name}...</p>
                <p className="text-xs text-muted-foreground">
                  {deployProgress < 30 && 'Checking data quality...'}
                  {deployProgress >= 30 && deployProgress < 60 && 'Setting up data product...'}
                  {deployProgress >= 60 && deployProgress < 90 && 'Activating product...'}
                  {deployProgress >= 90 && 'Ready to use...'}
                </p>
              </div>
              <span className="text-xs font-mono text-primary font-semibold">
                {Math.round(deployProgress)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas - Full Width with Clean Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Enhanced Header */}
        <div className={cn(
          "flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm",
          isDeploying && "mt-16" // Offset for progress bar
        )}>
          <div className="px-8 py-4">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              {/* Product Icon & Title */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <CodesandboxLogo className="w-7 h-7 text-primary flex-shrink-0" weight="duotone" />

                {/* Editable Title with hover edit indicator */}
                <div className="flex-1 group relative min-w-0">
                  <Input
                    value={productData.name}
                    onChange={(e) => updateMetadata({ name: e.target.value })}
                    placeholder="Untitled Data Product"
                    className="text-2xl font-bold border-none shadow-none bg-transparent px-2 h-auto py-1 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-background/50 pr-10 transition-colors"
                  />
                  <PencilLine className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="gap-1.5">
                  <span className="text-xs text-muted-foreground">Domain:</span>
                  <span className="text-xs font-medium">{productData.domain}</span>
                </Badge>

                <Badge variant="secondary" className="capitalize text-xs gap-1">
                  {productData.createdFrom === 'template' && (
                    <>
                      <ClipboardText className="w-3 h-3" weight="duotone" />
                      Template
                    </>
                  )}
                  {productData.createdFrom === 'intent' && (
                    <>
                      <Sparkle className="w-3 h-3" weight="duotone" />
                      AI Generated
                    </>
                  )}
                  {productData.createdFrom === 'clone' && (
                    <>
                      <CopySimple className="w-3 h-3" weight="duotone" />
                      Cloned
                    </>
                  )}
                  {productData.createdFrom === 'manual' && (
                    <>
                      <PencilSimple className="w-3 h-3" weight="duotone" />
                      Manual
                    </>
                  )}
                </Badge>

                {/* Source count indicator */}
                {productData.selectedSources.length > 0 && (
                  <Badge variant="outline" className="gap-1.5">
                    <span className="text-xs font-medium">{productData.selectedSources.length}</span>
                    <span className="text-xs text-muted-foreground">
                      {productData.selectedSources.length === 1 ? 'source' : 'sources'}
                    </span>
                  </Badge>
                )}

                {/* Auto-save indicator */}
                {lastAutoSaveTime && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Save className="w-3 h-3" />
                    <span className="text-xs text-muted-foreground">
                      Saved {lastAutoSaveTime}
                    </span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Context Section - Collapsible */}
        {showSQLComposer && (
          <div className="border-b border-border/50 bg-card/30">
            <div className="px-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBusinessContext(!showBusinessContext)}
                className="w-full py-3 flex items-center justify-between hover:bg-accent/50 transition-colors rounded-none"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Business Context</span>
                  <Badge variant="outline" className="text-xs">
                    {businessObjectives.length + businessMetrics.length + businessQuestions.length} items
                  </Badge>
                </div>
                {showBusinessContext ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>

              {showBusinessContext && (
                <div className="pb-6">
                  <Tabs defaultValue="objectives" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="objectives" className="gap-2">
                        <Target className="w-4 h-4" />
                        Objectives ({businessObjectives.length})
                      </TabsTrigger>
                      <TabsTrigger value="metrics" className="gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Metrics ({businessMetrics.length})
                      </TabsTrigger>
                      <TabsTrigger value="questions" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Questions ({businessQuestions.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="objectives" className="mt-0">
                      <Card className="p-4">
                        <BusinessObjectiveSelector
                          productId={productData.name}
                          selectedObjectives={businessObjectives}
                          onObjectivesChange={updateBusinessObjectives}
                        />
                      </Card>
                    </TabsContent>

                    <TabsContent value="metrics" className="mt-0">
                      <Card className="p-4">
                        <BusinessMetricsPanel
                          productId={productData.name}
                          availableColumns={productData.selectedSources.flatMap(s =>
                            s.columns.map(c => ({
                              name: c.name,
                              type: c.type,
                              description: c.description || ''
                            }))
                          )}
                          selectedMetrics={businessMetrics}
                          onMetricsChange={updateBusinessMetrics}
                        />
                      </Card>
                    </TabsContent>

                    <TabsContent value="questions" className="mt-0">
                      <Card className="p-4">
                        <BusinessQuestionsCapture
                          productId={productData.name}
                          selectedQuestions={businessQuestions}
                          onQuestionsChange={updateBusinessQuestions}
                        />
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area - Full Width */}
        <div className="flex-1 overflow-hidden">
          {showSourceSelection && (
            <SourceSelectionInterface
              intent={productData.intent}
              domain={productData.domain}
              onSourcesSelected={handleSourcesChange}
              onDomainChange={(domain) => updateMetadata({ domain })}
            />
          )}

          {showSQLComposer && (
            <div className="h-full overflow-auto">
              <TiSQLArtifactChat
                availableSources={productData.selectedSources}
                productDefinition={{
                  name: productData.name,
                  description: productData.description,
                  domain: productData.domain
                }}
                onSQLGenerated={handleSQLGenerated}
                onContinue={handleDeploy}
                initialSQL={productData.sql}
                initialResults={productData.previewResult}
                initialQuality={productData.validationStatus}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar - Bottom Right */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl border-border/50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Draft
            </>
          )}
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handleDeploy}
          disabled={isDeploying || !productData.sql.trim()}
          className="gap-2 bg-primary hover:bg-primary/90 shadow-xl"
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Activating...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Activate Product
            </>
          )}
        </Button>
      </div>

      {/* Stakeholder Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Review Business Context
            </DialogTitle>
            <DialogDescription>
              Please review the business context before activating this data product. Confirm that all objectives, metrics, and questions are accurate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Objectives Section */}
            {businessObjectives.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-sm">Business Objectives ({businessObjectives.length})</h3>
                </div>
                <div className="space-y-2">
                  {businessObjectives.map((objective) => (
                    <Card key={objective.objective_id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{objective.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {objective.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {objective.description}
                          </p>
                          {objective.stakeholders && objective.stakeholders.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-xs text-muted-foreground">Stakeholders:</span>
                              <span className="text-xs">{objective.stakeholders.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Section */}
            {businessMetrics.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">Business Metrics ({businessMetrics.length})</h3>
                </div>
                <div className="space-y-2">
                  {businessMetrics.map((metric) => (
                    <Card key={metric.metric_id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">{metric.metric_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {metric.definition}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Current: </span>
                              <span className="font-medium">{metric.current_value} {metric.unit}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Target: </span>
                              <span className="font-medium">{metric.target_value} {metric.unit}</span>
                            </div>
                            <Badge
                              variant={
                                metric.trend === 'exceeding_target'
                                  ? 'default'
                                  : metric.trend === 'on_target'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="text-xs"
                            >
                              {metric.trend === 'exceeding_target' && 'Exceeding'}
                              {metric.trend === 'on_target' && 'On Target'}
                              {metric.trend === 'needs_improvement' && 'Needs Work'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Questions Section */}
            {businessQuestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-sm">Business Questions ({businessQuestions.length})</h3>
                </div>
                <div className="space-y-2">
                  {businessQuestions.map((question) => (
                    <Card key={question.question_id} className="p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">{question.question_text}</p>
                          {question.personas && question.personas.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {question.personas.map((persona, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {persona}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <Card className="p-4 bg-muted/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{businessObjectives.length}</p>
                  <p className="text-xs text-muted-foreground">Objectives</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{businessMetrics.length}</p>
                  <p className="text-xs text-muted-foreground">Metrics</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{businessQuestions.length}</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Edit Context
            </Button>
            <Button onClick={performDeploy} className="gap-2">
              <Rocket className="w-4 h-4" />
              Confirm & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * UnifiedProductWorkspace
 * Main component that wraps the workspace with BuildFlowProvider
 */
export function UnifiedProductWorkspace({
  initialData,
  template,
  onDeploy,
  onSaveDraft,
  onBack
}: UnifiedProductWorkspaceProps) {
  // Prepare initial data from template or initial data
  const preparedInitialData: Partial<ProductData> = template ? {
    name: template.name,
    description: template.description,
    domain: template.domain,
    owner: '',
    createdFrom: 'template',
    templateId: template.id,
    productType: 'aggregate',
    selectedSources: template.requiredSources.map(s => ({
      id: s.id,
      name: s.name,
      schema: s.schema,
      columns: s.columns,
      required: s.required,
      isDataProduct: false
    })),
    sql: template.sqlTemplate,
    inheritedQualityRules: [],
    customQualityRules: template.qualityRules || [],
    qualityRules: template.qualityRules,
    schedule: template.deploymentConfig.schedule,
    outputFormat: template.deploymentConfig.outputFormat,
    outputLocation: template.deploymentConfig.outputLocation,
    sla: template.deploymentConfig.sla
  } : {
    ...initialData
  };

  return (
    <BuildFlowProvider initialData={preparedInitialData}>
      <UnifiedProductWorkspaceInner
        onDeploy={onDeploy}
        onSaveDraft={onSaveDraft}
        onBack={onBack}
      />
    </BuildFlowProvider>
  );
}
