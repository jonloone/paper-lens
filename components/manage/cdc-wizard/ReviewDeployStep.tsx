'use client';

/**
 * CDC Wizard Step 5: Review & Deploy
 * Shows configuration summary and deployment progress
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  MessageSquare,
  Database,
  Table
} from 'lucide-react';
import type { CDCWizardState, PhaseResult } from '@/lib/types/cdc-wizard';

interface ReviewDeployStepProps {
  wizardState: CDCWizardState;
  onDeploy: (isDryRun: boolean) => void;
}

export default function ReviewDeployStep({ wizardState, onDeploy }: ReviewDeployStepProps) {
  const { selectedSource, kafkaConfig, debeziumConfig, icebergConfigs, deploymentResult } = wizardState;

  const getPhaseIcon = (phase: PhaseResult) => {
    if (phase.status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (phase.status === 'failed') return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (phase.status === 'in_progress') return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getPhaseColor = (status: string) => {
    if (status === 'completed') return 'text-green-400';
    if (status === 'failed') return 'text-red-400';
    if (status === 'in_progress') return 'text-blue-400';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Configuration Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Kafka Topic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-green-400">{kafkaConfig?.name}</p>
            <div className="text-xs text-gray-500 mt-2">
              {kafkaConfig?.partitions} partitions • RF {kafkaConfig?.replication_factor}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              Debezium Connector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-green-400">{debeziumConfig?.name}</p>
            <div className="text-xs text-gray-500 mt-2">
              {debeziumConfig?.snapshot_mode} snapshot
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Table className="w-4 h-4" />
              Iceberg Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-green-400">
              {icebergConfigs?.length || 0} table(s)
            </p>
            <div className="text-xs text-gray-500 mt-2">
              {icebergConfigs?.[0]?.file_format} • {icebergConfigs?.[0]?.compression_codec}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Progress */}
      {deploymentResult && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Deployment Progress</span>
              <Badge
                variant="outline"
                className={
                  deploymentResult.status === 'completed'
                    ? 'border-green-400 text-green-400'
                    : deploymentResult.status === 'failed'
                    ? 'border-red-400 text-red-400'
                    : 'border-blue-400 text-blue-400'
                }
              >
                {deploymentResult.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deploymentResult.phases.map((phase, index) => (
              <div key={index} className="flex items-start gap-3">
                {getPhaseIcon(phase)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${getPhaseColor(phase.status)}`}>
                      {phase.phase.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    {phase.duration_seconds && (
                      <span className="text-xs text-gray-500">
                        {phase.duration_seconds.toFixed(2)}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{phase.message}</p>
                  {phase.warnings.length > 0 && (
                    <Alert className="mt-2 border-yellow-400 bg-yellow-400/10">
                      <AlertDescription className="text-xs">
                        {phase.warnings.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  {phase.errors.length > 0 && (
                    <Alert className="mt-2 border-red-400 bg-red-400/10">
                      <AlertDescription className="text-xs">
                        {phase.errors.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            ))}

            {/* Overall Progress */}
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Overall Progress</span>
                <span className="text-gray-400">
                  {deploymentResult.phases.filter((p) => p.status === 'completed').length} /{' '}
                  {deploymentResult.phases.length} phases
                </span>
              </div>
              <Progress
                value={
                  (deploymentResult.phases.filter((p) => p.status === 'completed').length /
                    deploymentResult.phases.length) *
                  100
                }
                className="h-2"
              />
            </div>

            {/* Summary Stats */}
            {deploymentResult.status === 'completed' && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <div className="text-xs text-gray-500">Total Duration</div>
                  <div className="text-lg font-semibold text-green-400">
                    {deploymentResult.total_duration_seconds?.toFixed(2)}s
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Validation Checks</div>
                  <div className="text-lg font-semibold text-green-400">
                    {deploymentResult.passed_checks}/{deploymentResult.total_checks} passed
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pre-deployment Summary */}
      {!deploymentResult && (
        <Alert className="border-blue-400 bg-blue-400/10">
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Ready to deploy CDC pipeline for {selectedSource?.name}</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Kafka topic: {kafkaConfig?.name}</li>
                <li>Debezium connector: {debeziumConfig?.name}</li>
                <li>Iceberg tables: {icebergConfigs?.length || 0}</li>
              </ul>
              <p className="text-xs text-gray-400 mt-3">
                Click "Dry Run" to validate without deploying, or "Deploy Pipeline" to create all resources.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
