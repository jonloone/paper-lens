'use client';

/**
 * CDC Pipeline Deployment Wizard
 *
 * 5-step guided flow for deploying complete CDC pipelines:
 * 1. Source Selection - Choose source system
 * 2. Kafka Configuration - Configure Kafka topics
 * 3. Debezium Configuration - Set up CDC connector
 * 4. Iceberg Configuration - Configure Iceberg tables
 * 5. Review & Deploy - Validate and deploy pipeline
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Database,
  MessageSquare,
  Table,
  PlayCircle,
  Loader2
} from 'lucide-react';

import type {
  CDCWizardState,
  SourceSummary,
  KafkaTopicConfig,
  DebeziumConnectorConfig,
  IcebergTableConfig,
  CDCDeploymentResult
} from '@/lib/types/cdc-wizard';

// Import step components (to be created)
import SourceSelectionStep from '@/components/manage/cdc-wizard/SourceSelectionStep';
import KafkaConfigurationStep from '@/components/manage/cdc-wizard/KafkaConfigurationStep';
import DebeziumConfigurationStep from '@/components/manage/cdc-wizard/DebeziumConfigurationStep';
import IcebergConfigurationStep from '@/components/manage/cdc-wizard/IcebergConfigurationStep';
import ReviewDeployStep from '@/components/manage/cdc-wizard/ReviewDeployStep';

const STEPS = [
  {
    id: 1,
    title: 'Source Selection',
    description: 'Choose the source system for CDC',
    icon: Database,
  },
  {
    id: 2,
    title: 'Kafka Configuration',
    description: 'Configure Kafka topics',
    icon: MessageSquare,
  },
  {
    id: 3,
    title: 'Debezium Configuration',
    description: 'Set up CDC connector',
    icon: Database,
  },
  {
    id: 4,
    title: 'Iceberg Configuration',
    description: 'Configure Iceberg tables',
    icon: Table,
  },
  {
    id: 5,
    title: 'Review & Deploy',
    description: 'Validate and deploy pipeline',
    icon: PlayCircle,
  },
];

export default function CDCWizardPage() {
  const router = useRouter();
  const [wizardState, setWizardState] = useState<CDCWizardState>({
    currentStep: 1,
    isDeploying: false,
    isDryRun: false,
  });

  const currentStep = STEPS[wizardState.currentStep - 1];
  const progressPercentage = (wizardState.currentStep / STEPS.length) * 100;

  // Navigation handlers
  const handleNext = () => {
    if (wizardState.currentStep < STEPS.length) {
      setWizardState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  const handleBack = () => {
    if (wizardState.currentStep > 1) {
      setWizardState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const handleCancel = () => {
    router.push('/manage/sources');
  };

  // Step data handlers
  const handleSourceSelected = (source: SourceSummary) => {
    setWizardState((prev) => ({
      ...prev,
      selectedSource: source,
    }));
  };

  const handleKafkaConfigured = (config: KafkaTopicConfig) => {
    setWizardState((prev) => ({
      ...prev,
      kafkaConfig: config,
    }));
  };

  const handleDebeziumConfigured = (config: DebeziumConnectorConfig) => {
    setWizardState((prev) => ({
      ...prev,
      debeziumConfig: config,
    }));
  };

  const handleIcebergConfigured = (configs: IcebergTableConfig[]) => {
    setWizardState((prev) => ({
      ...prev,
      icebergConfigs: configs,
    }));
  };

  const handleDeploy = async (isDryRun: boolean) => {
    setWizardState((prev) => ({
      ...prev,
      isDeploying: true,
      isDryRun,
    }));

    try {
      const endpoint = isDryRun ? '/api/v1/cdc/validate' : '/api/v1/cdc/deploy';

      const request = {
        source_id: wizardState.selectedSource!.id,
        kafka_topic_config: wizardState.kafkaConfig!,
        debezium_config: wizardState.debeziumConfig!,
        iceberg_configs: wizardState.icebergConfigs!,
        dry_run: isDryRun,
        skip_existing: true,
        auto_rollback: true,
      };

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result: CDCDeploymentResult = await response.json();

      setWizardState((prev) => ({
        ...prev,
        deploymentResult: result,
        isDeploying: false,
      }));
    } catch (error) {
      console.error('Deployment error:', error);
      setWizardState((prev) => ({
        ...prev,
        isDeploying: false,
      }));
    }
  };

  // Check if current step can proceed
  const canProceed = () => {
    switch (wizardState.currentStep) {
      case 1:
        return !!wizardState.selectedSource;
      case 2:
        return !!wizardState.kafkaConfig;
      case 3:
        return !!wizardState.debeziumConfig;
      case 4:
        return !!wizardState.icebergConfigs && wizardState.icebergConfigs.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-green-400 mb-2">
              CDC Pipeline Deployment Wizard
            </h1>
            <p className="text-gray-400">
              Automated Change Data Capture pipeline setup in 5 easy steps
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {wizardState.currentStep} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-gray-800" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => {
            const isActive = step.id === wizardState.currentStep;
            const isCompleted = step.id < wizardState.currentStep;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 border-2
                    ${isActive ? 'border-green-400 bg-green-400/10' : ''}
                    ${isCompleted ? 'border-green-400 bg-green-400' : ''}
                    ${!isActive && !isCompleted ? 'border-gray-700 bg-gray-800' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-black" />
                  ) : (
                    <Icon
                      className={`w-6 h-6 ${
                        isActive ? 'text-green-400' : 'text-gray-500'
                      }`}
                    />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={`text-xs font-medium ${
                      isActive ? 'text-green-400' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`hidden md:block h-0.5 w-full mt-6 -ml-full ${
                      isCompleted ? 'bg-green-400' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-6xl mx-auto">
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              {React.createElement(currentStep.icon, { className: 'w-5 h-5' })}
              {currentStep.title}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {currentStep.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {wizardState.currentStep === 1 && (
              <SourceSelectionStep
                selectedSource={wizardState.selectedSource}
                onSourceSelected={handleSourceSelected}
              />
            )}

            {wizardState.currentStep === 2 && (
              <KafkaConfigurationStep
                source={wizardState.selectedSource!}
                initialConfig={wizardState.kafkaConfig}
                onConfigured={handleKafkaConfigured}
              />
            )}

            {wizardState.currentStep === 3 && (
              <DebeziumConfigurationStep
                source={wizardState.selectedSource!}
                kafkaConfig={wizardState.kafkaConfig!}
                initialConfig={wizardState.debeziumConfig}
                onConfigured={handleDebeziumConfigured}
              />
            )}

            {wizardState.currentStep === 4 && (
              <IcebergConfigurationStep
                source={wizardState.selectedSource!}
                debeziumConfig={wizardState.debeziumConfig!}
                initialConfigs={wizardState.icebergConfigs}
                onConfigured={handleIcebergConfigured}
              />
            )}

            {wizardState.currentStep === 5 && (
              <ReviewDeployStep
                wizardState={wizardState}
                onDeploy={handleDeploy}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={wizardState.currentStep === 1 || wizardState.isDeploying}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {wizardState.currentStep < STEPS.length && (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || wizardState.isDeploying}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {wizardState.currentStep === STEPS.length && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleDeploy(true)}
                disabled={wizardState.isDeploying}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                {wizardState.isDeploying && wizardState.isDryRun ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Dry Run (Validate Only)
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleDeploy(false)}
                disabled={wizardState.isDeploying}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {wizardState.isDeploying && !wizardState.isDryRun ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Deploy Pipeline
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Deployment Result Alert */}
        {wizardState.deploymentResult && (
          <Alert
            className={`mt-6 ${
              wizardState.deploymentResult.status === 'completed'
                ? 'border-green-400 bg-green-400/10'
                : wizardState.deploymentResult.status === 'failed'
                ? 'border-red-400 bg-red-400/10'
                : 'border-yellow-400 bg-yellow-400/10'
            }`}
          >
            <AlertDescription>
              <div className="flex items-start gap-3">
                {wizardState.deploymentResult.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium mb-1">
                    {wizardState.deploymentResult.message}
                  </p>
                  <p className="text-sm text-gray-400">
                    Deployment ID: {wizardState.deploymentResult.deployment_id}
                  </p>
                  {wizardState.deploymentResult.total_duration_seconds && (
                    <p className="text-sm text-gray-400">
                      Duration: {wizardState.deploymentResult.total_duration_seconds.toFixed(2)}s
                    </p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
