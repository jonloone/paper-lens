'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Rocket } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface DeploymentStepProps {
  workflowData: any;
  onComplete: (data: any) => void;
  uiConfig?: any;
}

export function DeploymentStep({ workflowData, onComplete, uiConfig }: DeploymentStepProps) {
  const [deploymentStatus] = useState('ready');
  const [dataProductSpec] = useState({
    name: 'Sales Analytics Data Product',
    version: '1.0.0',
    description: 'Comprehensive sales data with quality guarantees',
    owner: 'Data Platform Team',
    sla: '99.9% availability',
    refreshRate: 'Daily at 2 AM UTC',
    qualityMetrics: {
      completeness: '>95%',
      accuracy: '>98%',
      timeliness: '<24 hours'
    }
  });

  const handleDeploy = () => {
    onComplete({ dataProductSpec, deploymentStatus: 'deployed' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Step 5: Deployment</h2>
        <p className="text-muted-foreground">
          Review and deploy your data product with Open Data Product Specification (ODPS) compliance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Data Product Specification (ODPS v4.0)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Product Name</div>
              <div className="font-medium">{dataProductSpec.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Version</div>
              <div className="font-medium">{dataProductSpec.version}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Owner</div>
              <div className="font-medium">{dataProductSpec.owner}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">SLA</div>
              <div className="font-medium">{dataProductSpec.sla}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-2">Description</div>
            <p className="text-sm">{dataProductSpec.description}</p>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-2">Quality Metrics</div>
            <div className="flex gap-2">
              <Badge variant="secondary">Completeness: {dataProductSpec.qualityMetrics.completeness}</Badge>
              <Badge variant="secondary">Accuracy: {dataProductSpec.qualityMetrics.accuracy}</Badge>
              <Badge variant="secondary">Timeliness: {dataProductSpec.qualityMetrics.timeliness}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle className="w-4 h-4" />
        <AlertDescription>
          <strong>Validation Complete</strong> - Your data product is ready for deployment to production.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={handleDeploy} size="lg" className="bg-green-600 hover:bg-green-700">
          <Rocket className="w-4 h-4 mr-2" />
          Deploy Data Product
        </Button>
      </div>
    </div>
  );
}