'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Layers,
  Copy,
  ArrowRight,
  Rocket,
  Clock,
  TrendingUp,
  Database,
  Code,
  Shield,
  Loader2,
  ChevronRight,
  Zap,
  BookMarked
} from 'lucide-react';
import { UnifiedProductWorkspace, ProductData } from '@/components/build/workspace/UnifiedProductWorkspace';
import { DeploymentSuccess } from '@/components/build/deploy/DeploymentSuccess';
import { ALL_TEMPLATES, ProductTemplate } from '@/lib/data/product-templates';
import { IntentAnalysisPreview } from '@/components/build/IntentAnalysisPreview';
import { getIntentAnalysisService, type IntentAnalysisResponse } from '@/lib/services/intent-analysis';
import { TemplatePreviewModal } from '@/components/build/TemplatePreviewModal';
import { TemplateGalleryHeader } from '@/components/build/TemplateGalleryHeader';
import { TemplateListItem } from '@/components/build/TemplateListItem';
import {
  searchAndSortTemplates,
  getTemplateCountByDomain,
  type DomainFilter,
  type SortOption,
  type TemplateWithMetrics
} from '@/lib/services/template-search';
import { ClonePreviewModal } from '@/components/build/ClonePreviewModal';
import { CloneAnalysisService, type CloneAnalysisResponse } from '@/lib/services/clone-analysis';
import { DraftCard } from '@/components/build/DraftCard';
import { DraftPreviewModal } from '@/components/build/DraftPreviewModal';
import { draftConflictService } from '@/lib/services/draft-conflict';
import type { Draft } from '@/lib/services/draft-autosave';
import type { ConflictCheck } from '@/lib/services/draft-conflict';
import { useDensitySpacing } from '@/contexts/DensityContext';
import { cn } from '@/lib/utils';

// State machine
type BuildPhase = 'builder' | 'analysis' | 'workspace' | 'success';

// Mock deployed products for cloning
const RECENT_PRODUCTS = [
  { id: 'prod-1', name: 'Customer 360 View', domain: 'Marketing', lastModified: '2 days ago', usageCount: 247 },
  { id: 'prod-2', name: 'Sales Performance Dashboard', domain: 'Sales', lastModified: '1 week ago', usageCount: 189 },
  { id: 'prod-3', name: 'Product Usage Analytics', domain: 'Product', lastModified: '3 days ago', usageCount: 156 }
];

const DOMAIN_ICONS: Record<string, any> = {
  'Marketing': TrendingUp,
  'Sales': TrendingUp,
  'Product': Code,
  'Finance': Database,
  'Operations': Zap
};

export default function BuildPage() {
  const [phase, setPhase] = useState<BuildPhase>('builder');
  const [intent, setIntent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [productData, setProductData] = useState<Partial<ProductData> | null>(null);
  const [deployedProductId, setDeployedProductId] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<IntentAnalysisResponse | null>(null);
  const spacing = useDensitySpacing();

  // Template gallery state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateWithMetrics | null>(null);

  // Clone state
  const [cloneSourceProduct, setCloneSourceProduct] = useState<ProductData | null>(null);
  const [cloneAnalysis, setCloneAnalysis] = useState<CloneAnalysisResponse | null>(null);
  const [isAnalyzingClone, setIsAnalyzingClone] = useState(false);

  // Draft state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [previewDraft, setPreviewDraft] = useState<Draft | null>(null);
  const [previewConflicts, setPreviewConflicts] = useState<ConflictCheck | null>(null);

  // Load drafts from localStorage on mount
  useEffect(() => {
    try {
      const savedDrafts = localStorage.getItem('product-drafts');
      if (savedDrafts) {
        const parsedDrafts: Draft[] = JSON.parse(savedDrafts);
        // Sort by lastSaved (most recent first)
        parsedDrafts.sort((a, b) =>
          new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
        );
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  }, []);

  // Filter and sort templates
  const filteredTemplates = searchAndSortTemplates(ALL_TEMPLATES, {
    query: searchQuery,
    domain: selectedDomain,
    sortBy: sortBy
  });

  const domainCounts = getTemplateCountByDomain(ALL_TEMPLATES);

  // Intent analysis with AI
  const handleGenerateFromIntent = useCallback(async () => {
    if (!intent.trim()) return;

    setIsGenerating(true);
    try {
      const service = getIntentAnalysisService();
      const analysis = await service.analyzeIntent({
        intent: intent.trim()
      });

      setAnalysisResult(analysis);
      setIsGenerating(false);
      setPhase('analysis');
    } catch (error) {
      console.error('Intent analysis failed:', error);
      setIsGenerating(false);
      alert('Failed to analyze intent. Please try again.');
    }
  }, [intent]);

  // Accept AI analysis and proceed to workspace
  const handleAcceptAnalysis = useCallback(() => {
    if (!analysisResult) return;

    const generatedData: Partial<ProductData> = {
      name: analysisResult.suggestedName,
      description: analysisResult.description,
      domain: analysisResult.domain,
      owner: '',
      createdFrom: 'intent',
      intent,
      productType: analysisResult.productType,
      selectedSources: analysisResult.suggestedSources.map(source => ({
        id: source.tableName,
        name: source.tableName,
        schema: source.schema || 'public',
        columns: [],
        required: source.required
      })),
      sql: '-- AI-suggested transformation will be developed in workspace',
      inheritedQualityRules: [],
      customQualityRules: analysisResult.suggestedQualityRules.map(rule => ({
        id: `rule-${Date.now()}-${Math.random()}`,
        type: rule.type,
        field: rule.field,
        threshold: rule.threshold,
        description: rule.description,
        isInherited: false
      })),
      schedule: analysisResult.suggestedSchedule || '0 2 * * *',
      outputFormat: analysisResult.suggestedOutputFormat || 'table'
    };

    setProductData(generatedData);
    setPhase('workspace');
  }, [analysisResult, intent]);

  // Customize analysis (proceed to workspace but allow manual adjustment)
  const handleCustomizeAnalysis = useCallback(() => {
    if (!analysisResult) return;

    // Similar to accept, but user will manually customize in workspace
    const generatedData: Partial<ProductData> = {
      name: analysisResult.suggestedName,
      description: analysisResult.description,
      domain: analysisResult.domain,
      owner: '',
      createdFrom: 'intent',
      intent,
      productType: analysisResult.productType,
      selectedSources: [], // Empty - user will select manually
      sql: '',
      inheritedQualityRules: [],
      customQualityRules: [],
      schedule: analysisResult.suggestedSchedule || '0 2 * * *',
      outputFormat: analysisResult.suggestedOutputFormat || 'table'
    };

    setProductData(generatedData);
    setPhase('workspace');
  }, [analysisResult, intent]);

  // Reanalyze intent
  const handleReanalyze = useCallback(() => {
    setAnalysisResult(null);
    setPhase('builder');
  }, []);

  // Template preview
  const handlePreviewTemplate = useCallback((template: TemplateWithMetrics) => {
    setPreviewTemplate(template);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewTemplate(null);
  }, []);

  // Template selection
  const handleSelectTemplate = useCallback((template: ProductTemplate) => {
    setSelectedTemplate(template);
    setPreviewTemplate(null); // Close preview if open
    setPhase('workspace');
  }, []);

  // Clone product with AI analysis
  const handleCloneProduct = useCallback(async (productId: string) => {
    const product = RECENT_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    // Create a mock ProductData from RECENT_PRODUCTS
    const sourceProduct: ProductData = {
      name: product.name,
      description: `${product.domain} data product`,
      domain: product.domain,
      owner: '',
      createdFrom: 'manual',
      productType: 'aggregate',
      selectedSources: [],
      sql: `-- SQL for ${product.name}\nSELECT * FROM ${product.domain.toLowerCase()}_data`,
      schema: {
        columns: [
          { name: 'id', type: 'string', description: 'Primary key', nullable: false },
          { name: 'created_at', type: 'timestamp', description: 'Creation time', nullable: false }
        ]
      },
      qualityRules: [
        { field: 'id', rule: 'unique', severity: 'critical' }
      ],
      schedule: '0 2 * * *',
      outputFormat: 'table',
      inheritedQualityRules: [],
      customQualityRules: []
    };

    // Analyze clone with AI
    setIsAnalyzingClone(true);
    setCloneSourceProduct(sourceProduct);

    try {
      const service = new CloneAnalysisService();
      const analysis = await service.analyzeClone({
        sourceProduct,
        userIntent: undefined // No initial intent
      });

      setCloneAnalysis(analysis);
    } catch (error) {
      console.error('Clone analysis failed:', error);
      // Fallback: proceed without analysis
      setCloneAnalysis(null);
    } finally {
      setIsAnalyzingClone(false);
    }
  }, []);

  // Close clone preview modal
  const handleCloseClonePreview = useCallback(() => {
    setCloneSourceProduct(null);
    setCloneAnalysis(null);
  }, []);

  // Confirm clone with modifications
  const handleConfirmClone = useCallback((modifications: {
    name: string;
    description: string;
    applyModifications: string[];
    customIntent?: string;
  }) => {
    if (!cloneSourceProduct) return;

    const clonedData: Partial<ProductData> = {
      name: modifications.name,
      description: modifications.description,
      domain: cloneSourceProduct.domain,
      owner: '',
      createdFrom: 'clone',
      clonedFromId: cloneSourceProduct.name,
      productType: cloneSourceProduct.productType,
      selectedSources: cloneSourceProduct.selectedSources || [],
      sql: cloneSourceProduct.sql || '',
      schema: cloneSourceProduct.schema,
      qualityRules: cloneSourceProduct.qualityRules || [],
      schedule: cloneSourceProduct.schedule || '0 2 * * *',
      outputFormat: cloneSourceProduct.outputFormat || 'table',
      inheritedQualityRules: [],
      customQualityRules: []
    };

    setProductData(clonedData);
    setCloneSourceProduct(null);
    setCloneAnalysis(null);
    setPhase('workspace');
  }, [cloneSourceProduct]);

  // Preview draft with conflict detection
  const handlePreviewDraft = useCallback(async (draft: Draft) => {
    try {
      // Check for conflicts
      const conflicts = await draftConflictService.checkConflicts(draft);

      setPreviewDraft(draft);
      setPreviewConflicts(conflicts);
    } catch (error) {
      console.error('Failed to check draft conflicts:', error);
      alert('Failed to load draft preview');
    }
  }, []);

  // Load draft from preview modal
  const handleLoadDraft = useCallback((draft: Draft) => {
    setProductData(draft.productData);
    setPreviewDraft(null);
    setPreviewConflicts(null);
    setPhase('workspace');
  }, []);

  // Delete draft
  const handleDeleteDraft = useCallback((draftId: string) => {
    try {
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      setDrafts(updatedDrafts);
      localStorage.setItem('product-drafts', JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Failed to delete draft:', error);
      alert('Failed to delete draft');
    }
  }, [drafts]);

  // Export draft to JSON file
  const handleExportDraft = useCallback((draft: Draft) => {
    try {
      const dataStr = JSON.stringify(draft, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `draft-${draft.productData.name || 'untitled'}-${Date.now()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Failed to export draft:', error);
      alert('Failed to export draft');
    }
  }, []);

  // Deploy
  const handleDeploy = useCallback(async (data: ProductData) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const productId = `prod-${Date.now()}`;
    setDeployedProductId(productId);
    setProductData(data);
    setPhase('success');
  }, []);

  // Save draft
  const handleSaveDraft = useCallback((data: ProductData) => {
    console.log('Saving draft:', data);
    // Draft is auto-saved - no alert needed
  }, []);

  // Back to builder
  const handleBackToBuilder = useCallback(() => {
    setPhase('builder');
    setSelectedTemplate(null);
    setProductData(null);
    setIntent('');
    setAnalysisResult(null);
  }, []);

  // Create another
  const handleCreateAnother = useCallback(() => {
    setPhase('builder');
    setSelectedTemplate(null);
    setProductData(null);
    setIntent('');
    setDeployedProductId('');
    setAnalysisResult(null);
  }, []);

  // Render analysis phase
  if (phase === 'analysis' && analysisResult) {
    return (
      <div className="min-h-screen bg-dot-grid">
        <div className="max-w-[1200px] mx-auto p-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToBuilder}
              className="mb-4"
              aria-label="Back to builder"
            >
              ← Back to Builder
            </Button>
            <h1 className="text-3xl font-bold mb-2">Review AI Analysis</h1>
            <p className="text-muted-foreground/85">
              Review the suggestions below and accept them or customize to your needs
            </p>
          </div>

          <IntentAnalysisPreview
            analysis={analysisResult}
            originalIntent={intent}
            onAccept={handleAcceptAnalysis}
            onCustomize={handleCustomizeAnalysis}
            onReanalyze={handleReanalyze}
            loading={false}
          />
        </div>
      </div>
    );
  }

  // Render workspace phase
  if (phase === 'workspace') {
    return (
      <UnifiedProductWorkspace
        initialData={productData || undefined}
        template={selectedTemplate || undefined}
        onDeploy={handleDeploy}
        onSaveDraft={handleSaveDraft}
        onBack={handleBackToBuilder}
      />
    );
  }

  // Render success phase
  if (phase === 'success') {
    return (
      <DeploymentSuccess
        productData={productData as ProductData}
        productId={deployedProductId}
        onCreateAnother={handleCreateAnother}
        onViewProduct={() => {
          window.location.href = `/discover/${deployedProductId}`;
        }}
      />
    );
  }

  // Main builder page with workspace feel
  return (
    <div className="min-h-screen bg-dot-grid">
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Hero Intent Capture */}
        <section aria-labelledby="intent-heading" className="mb-12">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 id="intent-heading" className="text-4xl font-bold text-foreground mb-3">
              Build a Data Product
            </h1>
            <p className="text-base text-muted-foreground/85">
              Start from a template, describe what you need, or clone an existing product
            </p>
          </div>

          {/* Quick Intent Input */}
          <Card
            elevation="raised"
            surface="gradient"
            className="max-w-3xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
          >
            <CardContent className={spacing.card}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">Describe what you need</h2>
              </div>
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., Create a customer 360 view combining CRM data, purchase history, and website activity..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateFromIntent()}
                  className="flex-1 text-base h-12"
                  disabled={isGenerating}
                  aria-label="Describe your data product intent"
                />
                <Button
                  onClick={handleGenerateFromIntent}
                  disabled={!intent.trim() || isGenerating}
                  className="gap-2 h-12 px-6 bg-primary hover:bg-primary/90 [transition:var(--transition-button)] [box-shadow:var(--elevation-1)] hover:[box-shadow:var(--elevation-2)]"
                  aria-label={isGenerating ? "Generating analysis" : "Generate data product from intent"}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tabbed Content: Templates, Clone, Drafts */}
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="templates" className="gap-2">
              <Layers className="w-4 h-4" aria-hidden="true" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="clone" className="gap-2">
              <Copy className="w-4 h-4" aria-hidden="true" />
              Clone
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2">
              <BookMarked className="w-4 h-4" aria-hidden="true" />
              Drafts
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className={spacing.stack}>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Start from a proven template
              </h3>
              <p className="text-sm text-muted-foreground/85">
                Production-ready SQL, sources, and quality rules included
              </p>
            </div>

            {/* Template Gallery Header */}
            <TemplateGalleryHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDomain={selectedDomain}
              onDomainChange={setSelectedDomain}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultCount={filteredTemplates.length}
              totalCount={ALL_TEMPLATES.length}
              domainCounts={domainCounts}
            />

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", spacing.grid)} role="list" aria-label="Template gallery">
                {filteredTemplates.map((template) => {
                  const DomainIcon = DOMAIN_ICONS[template.domain] || Layers;

                  return (
                    <Card
                      key={template.id}
                      elevation="base"
                      interactive
                      surface="default"
                      className="bg-elevation-1"
                      onClick={() => handleSelectTemplate(template)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${template.name} - ${template.description}`}
                    >
                      <CardContent className={spacing.card}>
                        {/* Template Header */}
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 [transition:var(--transition-colors)]">
                            <DomainIcon className="w-5 h-5 text-primary" aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-foreground line-clamp-1 mb-1">
                              {template.name}
                            </h4>
                            <p className="text-xs text-muted-foreground/85">
                              {template.domain} • {template.useCase}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground/85 mb-4 line-clamp-2">
                          {template.description}
                        </p>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground/85 mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            <span>{template.estimatedTimeToValue}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="w-3 h-3" aria-hidden="true" />
                            <span>{template.requiredSources.length} sources</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" aria-hidden="true" />
                            <span>{template.qualityRules.length} rules</span>
                          </div>
                        </div>

                        {/* Action */}
                        <Button
                          variant="outline"
                          className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary [transition:var(--transition-button)]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(template);
                          }}
                          aria-label={`Start building with ${template.name}`}
                        >
                          Start Building
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-3" role="list" aria-label="Template list">
                {filteredTemplates.map((template) => (
                  <TemplateListItem
                    key={template.id}
                    template={template}
                    onPreview={handlePreviewTemplate}
                    onUse={handleSelectTemplate}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
              <Card elevation="subtle">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground/85 mb-4">
                    No templates match your filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedDomain('all');
                    }}
                    aria-label="Clear all filters"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Template Preview Modal */}
            <TemplatePreviewModal
              template={previewTemplate}
              open={!!previewTemplate}
              onClose={handleClosePreview}
              onUse={handleSelectTemplate}
            />
          </TabsContent>

          {/* Clone Tab */}
          <TabsContent value="clone" className={spacing.stack}>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Clone an existing product
              </h3>
              <p className="text-sm text-muted-foreground/85">
                Start from a deployed product and adapt it to your needs
              </p>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", spacing.grid)} role="list" aria-label="Clonable products">
              {RECENT_PRODUCTS.map((product) => {
                const DomainIcon = DOMAIN_ICONS[product.domain] || Database;

                return (
                  <Card
                    key={product.id}
                    elevation="base"
                    interactive
                    surface="default"
                    className="bg-elevation-1"
                    onClick={() => handleCloneProduct(product.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Clone ${product.name} - ${product.usageCount} queries per month`}
                  >
                    <CardContent className={spacing.card}>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <DomainIcon className="w-5 h-5 text-green-500" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-foreground line-clamp-1 mb-1">
                            {product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground/85">
                            {product.domain}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground/85">Usage:</span>
                          <span className="font-medium text-foreground">{product.usageCount} queries/mo</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground/85">Modified:</span>
                          <span className="font-medium text-foreground">{product.lastModified}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full gap-2 [transition:var(--transition-button)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneProduct(product.id);
                        }}
                        aria-label={`Clone ${product.name} product`}
                      >
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        Clone Product
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Clone Preview Modal */}
            <ClonePreviewModal
              sourceProduct={cloneSourceProduct}
              analysis={cloneAnalysis}
              open={!!(cloneSourceProduct && cloneAnalysis)}
              onClose={handleCloseClonePreview}
              onClone={handleConfirmClone}
            />

            {/* Loading State for Clone Analysis */}
            {isAnalyzingClone && cloneSourceProduct && !cloneAnalysis && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center" role="status" aria-label="Analyzing clone">
                <Card elevation="raised">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
                      <div className="text-center">
                        <h3 className="font-semibold text-foreground mb-1">
                          Analyzing Clone
                        </h3>
                        <p className="text-sm text-muted-foreground/85">
                          Identifying modifications and dependencies...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className={spacing.stack}>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Resume a saved draft
              </h3>
              <p className="text-sm text-muted-foreground/85">
                Pick up where you left off • Drafts are auto-saved every 30 seconds
              </p>
            </div>

            {drafts.length === 0 ? (
              <Card elevation="subtle" surface="default" className="bg-elevation-1">
                <CardContent className="p-12 text-center">
                  <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" aria-hidden="true" />
                  <p className="text-muted-foreground/85 mb-4">No saved drafts yet</p>
                  <p className="text-sm text-muted-foreground/85">
                    Start building a data product and your progress will be automatically saved
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", spacing.grid)} role="list" aria-label="Saved drafts">
                {drafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onClick={() => handleLoadDraft(draft)}
                  />
                ))}
              </div>
            )}

            {/* Draft Preview Modal */}
            <DraftPreviewModal
              draft={previewDraft}
              conflicts={previewConflicts}
              open={!!previewDraft}
              onClose={() => {
                setPreviewDraft(null);
                setPreviewConflicts(null);
              }}
              onLoad={handleLoadDraft}
              onDelete={handleDeleteDraft}
              onExport={handleExportDraft}
            />
          </TabsContent>
        </Tabs>

        {/* Helper Text */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-muted-foreground/85">
            Need help? Check out our{' '}
            <a href="/docs" className="text-primary hover:underline focus-visible:outline-primary">
              documentation
            </a>{' '}
            or{' '}
            <a href="/examples" className="text-primary hover:underline focus-visible:outline-primary">
              example products
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
