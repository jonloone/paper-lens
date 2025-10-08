'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStepper, Step } from '@/lib/build/use-stepper';
import { HorizontalStepper } from '@/components/build/HorizontalStepper';
import { Step1DefineProduct, type Step1Data } from '@/components/build/steps/Step1DefineProduct';
import { Step2SelectSources, type Step2Data } from '@/components/build/steps/Step2SelectSources';
import { Step3SQLWorkstation } from '@/components/build/steps/Step3SQLWorkstation';
import { Step4QualityRules, type Step4Data } from '@/components/build/steps/Step4QualityRules';
import { Step5DeliveryConfig, type Step5Data } from '@/components/build/steps/Step5DeliveryConfig';
import { Step6ReviewDeploy, type Step6Data } from '@/components/build/steps/Step6ReviewDeploy';

// SQL step data type
interface Step3Data {
  sql: string;
  validationResult?: any;
  testResult?: any;
}
import { DraftRecoveryModal } from '@/components/build/DraftRecoveryModal';
import { DraftsPanel } from '@/components/build/DraftsPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Database, Code, Shield, Truck, Rocket, BookMarked } from 'lucide-react';
import { autoSave, clearAutoSave, Draft, saveAutoSaveAs, loadDraft } from '@/lib/utils/draft-storage';

// PRD v2: 6-step pragmatic workflow
const workflowSteps: Step[] = [
  {
    id: 'define',
    label: 'Define Product',
    description: 'Name, description, schedule',
    icon: FileText
  },
  {
    id: 'sources',
    label: 'Select Sources',
    description: 'Choose data tables',
    icon: Database
  },
  {
    id: 'transform',
    label: 'Write SQL',
    description: 'Transformation logic',
    icon: Code
  },
  {
    id: 'quality',
    label: 'Quality Rules',
    description: 'Data validation',
    icon: Shield
  },
  {
    id: 'delivery',
    label: 'Configure Delivery',
    description: 'SQL table, API, etc',
    icon: Truck
  },
  {
    id: 'deploy',
    label: 'Review & Deploy',
    description: 'Create pull request',
    icon: Rocket
  }
];

// 6-step form data
interface BuildFormData {
  step1?: Step1Data; // Define product (name, owner, schedule, SLA)
  step2?: Step2Data; // Select sources (tables from DataHub)
  step3?: Step3Data; // Write SQL (transformation logic)
  step4?: Step4Data; // Quality rules (Great Expectations)
  step5?: Step5Data; // Delivery config (SQL table, API endpoint)
  step6?: Step6Data; // Deploy (PR creation)
}

export default function BuildPage() {
  const stepper = useStepper(workflowSteps);
  const [formData, setFormData] = useState<BuildFormData>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(true);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [showDraftsPanel, setShowDraftsPanel] = useState(false);

  // Auto-save effect (runs every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        autoSave(formData, stepper.currentStep, Array.from(stepper.completedSteps));
        setLastSaved(new Date().toISOString());
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [formData, stepper.currentStep, stepper.completedSteps]);

  // Handle draft recovery
  const handleRecoverDraft = useCallback((draft: Draft<BuildFormData>) => {
    setFormData(draft.formData);
    stepper.goTo(draft.currentStep);
    draft.completedSteps.forEach(step => stepper.complete(step));
    setLastSaved(draft.updatedAt);
    setShowRecovery(false);
  }, [stepper]);

  const handleStartFresh = useCallback(() => {
    clearAutoSave();
    setShowRecovery(false);
  }, []);

  const handleSaveDraft = useCallback(() => {
    setShowSaveDraftDialog(true);
    // Auto-populate draft name from Step 1 if available
    if (formData.step1?.name) {
      setDraftName(formData.step1.name);
    }
  }, [formData]);

  const handleSaveDraftConfirm = useCallback(() => {
    if (!draftName.trim()) {
      alert('Please enter a draft name');
      return;
    }

    try {
      const draftId = saveAutoSaveAs(draftName, draftDescription);
      console.log('Saved draft:', draftId);
      setShowSaveDraftDialog(false);
      setDraftName('');
      setDraftDescription('');
      alert(`Draft "${draftName}" saved successfully!`);
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  }, [draftName, draftDescription]);

  const handleLoadDraft = useCallback((draftId: string) => {
    const draft = loadDraft<BuildFormData>(draftId);
    if (draft) {
      setFormData(draft.formData);
      stepper.goTo(draft.currentStep);
      draft.completedSteps.forEach(step => stepper.complete(step));
      setLastSaved(draft.updatedAt);
      console.log('Loaded draft:', draft.name);
    }
  }, [stepper]);

  // Step completion handlers
  const handleStep1Complete = (data: Step1Data) => {
    setFormData(prev => ({ ...prev, step1: data }));
    stepper.complete(0);
    stepper.next();
  };

  const handleStep2Complete = (data: Step2Data) => {
    setFormData(prev => ({ ...prev, step2: data }));
    stepper.complete(1);
    stepper.next();
  };

  const handleStep3Complete = (data: Step3Data) => {
    setFormData(prev => ({ ...prev, step3: data }));
    stepper.complete(2);
    stepper.next();
  };

  const handleStep4Complete = (data: Step4Data) => {
    setFormData(prev => ({ ...prev, step4: data }));
    stepper.complete(3);
    stepper.next();
  };

  const handleStep5Complete = (data: Step5Data) => {
    setFormData(prev => ({ ...prev, step5: data }));
    stepper.complete(4);
    stepper.next();
  };

  const handleStep6Complete = async (data: Step6Data) => {
    setFormData(prev => ({ ...prev, step6: data }));
    stepper.complete(5);

    // Submit complete data product for deployment
    const completeData = {
      ...formData,
      step6: data
    };

    console.log('Creating pull request for data product:', completeData);

    // Clear auto-save on successful completion
    clearAutoSave();

    // TODO: Submit to backend /api/v1/build/deploy
    // This will: Generate artifacts → Commit to Git → Create PR
    // await deployDataProduct(completeData);

    // Show success message
    alert('Data product created successfully!');
  };

  return (
    <div className="min-h-screen">
      {/* Draft Recovery Modal */}
      {showRecovery && (
        <DraftRecoveryModal
          onRecover={handleRecoverDraft}
          onStartFresh={handleStartFresh}
        />
      )}

      {/* Horizontal Stepper */}
      <HorizontalStepper
        steps={stepper.steps}
        currentStep={stepper.currentStep}
        completedSteps={stepper.completedSteps}
        onStepClick={stepper.goTo}
        lastSaved={lastSaved}
        onSaveDraft={handleSaveDraft}
      />

      {/* Save Draft Dialog */}
      <Dialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Draft</DialogTitle>
            <DialogDescription>
              Save your current progress as a named draft that you can resume later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="draft-name">Draft Name *</Label>
              <Input
                id="draft-name"
                placeholder="e.g., Customer 360 Pipeline"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft-description">Description (optional)</Label>
              <Textarea
                id="draft-description"
                placeholder="Add notes about this draft..."
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDraftDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraftConfirm}>
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drafts Panel */}
      <DraftsPanel
        open={showDraftsPanel}
        onOpenChange={setShowDraftsPanel}
        onLoadDraft={handleLoadDraft}
      />

      {/* Floating Drafts Button */}
      <Button
        onClick={() => setShowDraftsPanel(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        title="View Saved Drafts"
      >
        <BookMarked className="w-5 h-5" />
      </Button>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Step 1: Define Product */}
        {stepper.when('define', () => (
          <Step1DefineProduct
            initialData={formData.step1}
            onComplete={handleStep1Complete}
          />
        ))}

        {/* Step 2: Select Sources */}
        {stepper.when('sources', () => (
          <Step2SelectSources
            initialData={formData.step2}
            onComplete={handleStep2Complete}
            onBack={() => stepper.prev()}
          />
        ))}

        {/* Step 3: Write SQL */}
        {stepper.when('transform', () => {
          // Infer schema from selected sources
          const schema = (formData.step2?.selectedSources || [])
            .flatMap(source => source.columns || [])
            .map(col => ({ name: col.name, type: col.type }));

          return (
            <Step3SQLWorkstation
              productDefinition={formData.step1?.productDefinition}
              selectedSources={formData.step2?.selectedSources || []}
              schema={schema}
              initialData={formData.step3}
              onComplete={handleStep3Complete}
              onBack={() => stepper.prev()}
            />
          );
        })}

        {/* Step 4: Quality Rules */}
        {stepper.when('quality', () => (
          <Step4QualityRules
            initialData={formData.step4}
            sql={formData.step3?.sql || ''}
            onComplete={handleStep4Complete}
            onBack={() => stepper.prev()}
          />
        ))}

        {/* Step 5: Configure Delivery */}
        {stepper.when('delivery', () => (
          <Step5DeliveryConfig
            initialData={formData.step5}
            productName={formData.step1?.name || ''}
            onComplete={handleStep5Complete}
            onBack={() => stepper.prev()}
          />
        ))}

        {/* Step 6: Review & Deploy */}
        {stepper.when('deploy', () => (
          <Step6ReviewDeploy
            formData={formData}
            onComplete={handleStep6Complete}
            onBack={() => stepper.prev()}
          />
        ))}
      </div>
    </div>
  );
}
